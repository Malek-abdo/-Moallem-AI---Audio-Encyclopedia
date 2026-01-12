
export type Gender = 'male' | 'female';

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export type PodcastLength = 'short' | 'long' | 'extra-long';

export interface VoiceOption {
  id: VoiceName;
  label: string;
  gender: Gender;
  emoji: string;
  description: string;
}

export interface DialectOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  promptInstruction: string;
  category: 'arab' | 'world';
}

export interface PodcastRequest {
  topic: string;
  dialectId: string;
  voice: VoiceName;
}

export interface PodcastSegment {
  text: string;
  textMSA?: string; // Modern Standard Arabic Translation
  textEn?: string;  // English Translation
  visualPrompt: string;
  audioBase64: string;
  imageBase64: string;
  duration?: number; // Duration in seconds, calculated after decoding
  startTime?: number; // Start time in the merged track
}

export interface PodcastResponse {
  segments: PodcastSegment[];
  totalDuration?: number;
}

export interface SavedProject {
  id: string;
  name: string;
  topic: string;
  date: number;
  segments: PodcastSegment[];
  dialectId: string;
  voiceId: VoiceName;
}

export type AppState = 'IDLE' | 'GENERATING_SCRIPT' | 'GENERATING_MEDIA' | 'PLAYING' | 'ERROR';
