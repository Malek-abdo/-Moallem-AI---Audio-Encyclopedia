import { GoogleGenAI, Modality, Type } from "@google/genai";
import { DialectOption, PodcastSegment, VoiceName, PodcastLength } from "../types";
import { VOICES } from "../constants";

const getClient = () => {
  // Use the environment variable as per best practices
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please check your settings.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helper: Rate Limit Handling ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = 
        error.status === 429 || 
        error.code === 429 || 
        (error.message && (
            error.message.toLowerCase().includes('quota') || 
            error.message.toLowerCase().includes('exhausted') || 
            error.message.includes('429')
        ));
      
      if (isRateLimit) {
        if (i < retries - 1) {
          console.warn(`Rate limit hit (Attempt ${i + 1}/${retries}). Retrying in ${delay/1000}s...`);
          await sleep(delay);
          delay *= 2; // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Service busy");
}

/**
 * Step 1: Generate the Script Structure (JSON)
 */
interface ScriptSegmentJSON {
  text: string;
  msa_translation: string;
  english_translation: string;
  visual_description: string;
}

const generateScriptSegments = async (topic: string, dialect: DialectOption, voiceName: VoiceName, length: PodcastLength): Promise<ScriptSegmentJSON[]> => {
  return retryOperation(async () => {
    const ai = getClient();
    const voice = VOICES.find(v => v.id === voiceName);
    const role = voice ? `${voice.gender} expert with a ${voice.description} personality` : 'encyclopedic expert';
    
    let lengthInstruction = '';
    if (length === 'extra-long') {
      lengthInstruction = `
      MODE: ACADEMIC (EXTRA LONG)
      Target: 15 segments.
      Style: Detailed and patient.
      Structure: Intro, Definitions, Core Concepts (Step-by-step), Examples, Quiz, Summary.
      `;
    } else if (length === 'long') {
      lengthInstruction = `
      MODE: STORYTELLING (LONG)
      Target: 8 segments.
      Style: Narrative-driven.
      Structure: Hook, History, Core Story, Conclusion.
      `;
    } else {
      lengthInstruction = `
      MODE: BRIEF (SHORT)
      Target: 3 segments ONLY.
      Style: Quick and direct.
      Structure: Intro, One Main Fact, Quick Conclusion.
      `;
    }

    const prompt = `
      You are a podcaster (${role}).
      TOPIC: ${topic}
      DIALECT: ${dialect.name}
      
      INSTRUCTIONS:
      ${dialect.promptInstruction}
      ${lengthInstruction}
      
      Output strictly JSON array of objects with keys: "text", "msa_translation", "english_translation", "visual_description".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              msa_translation: { type: Type.STRING },
              english_translation: { type: Type.STRING },
              visual_description: { type: Type.STRING }
            },
            required: ["text", "visual_description", "msa_translation", "english_translation"]
          }
        },
        thinkingConfig: { thinkingBudget: 0 } // Save tokens
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Failed to generate script.");
    return JSON.parse(jsonText) as ScriptSegmentJSON[];
  });
};

/**
 * Helper: Generate Audio
 */
const generateSegmentAudio = async (text: string, voiceName: string): Promise<string> => {
  return retryOperation(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};

/**
 * Helper: Generate Image (Soft Fail)
 */
const generateSegmentImage = async (visualPrompt: string, topic: string): Promise<string> => {
  try {
    // Only 1 retry for images to save time/quota
    return await retryOperation(async () => {
        const ai = getClient();
        const fullPrompt = `Cinematic illustration: ${topic}, ${visualPrompt}. High detail, no text.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: fullPrompt,
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) return part.inlineData.data;
          }
        }
        return "";
    }, 1, 1000);
  } catch (e) {
    console.warn("Image generation failed (likely quota). Skipping image to save podcast.");
    return ""; // Return empty string so the podcast continues without image
  }
};

/**
 * ORCHESTRATOR
 */
export const generateFullEpisode = async (topic: string, dialect: DialectOption, voiceName: VoiceName, length: PodcastLength): Promise<PodcastSegment[]> => {
  const scriptSegments = await generateScriptSegments(topic, dialect, voiceName, length);
  const results: PodcastSegment[] = [];

  for (const [index, seg] of scriptSegments.entries()) {
    try {
      if (index > 0) await sleep(2000); // Delay between segments

      // 1. Audio (Critical) - If this fails, we skip the segment
      const audioBase64 = await generateSegmentAudio(seg.text, voiceName);
      if (!audioBase64) continue;

      await sleep(1000); 

      // 2. Image (Non-Critical) - If this fails, we use empty string
      const imageBase64 = await generateSegmentImage(seg.visual_description, topic);

      results.push({
        text: seg.text,
        textMSA: seg.msa_translation,
        textEn: seg.english_translation,
        visualPrompt: seg.visual_description,
        audioBase64,
        imageBase64 // Can be empty
      });

    } catch (error) {
      console.warn(`Skipping segment ${index + 1} due to error`, error);
    }
  }
  
  if (results.length === 0) {
     throw new Error("Unable to generate episode. Please check your API Quota or try again later.");
  }

  return results;
};

export const decodeAudio = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000; 
  const numChannels = 1;
  const dataLen = bytes.length - (bytes.length % 2);
  const dataInt16 = new Int16Array(bytes.buffer, bytes.byteOffset, dataLen / 2);
  const buffer = audioContext.createBuffer(numChannels, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

export const createWavBlobFromBuffer = (buffer: AudioBuffer): Blob => {
    // Implementation remains the same as before, needed for exports
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1; 
    const bitDepth = 16;
    const data = buffer.getChannelData(0);
    const bufferLength = data.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(arrayBuffer);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
};
