import { PodcastSegment } from '../types';

interface SegmentTiming {
    start: number;
    end: number;
    image: string; // base64
    segment: PodcastSegment;
}

/**
 * Detects the best supported MIME type for video recording in the current browser.
 * Fixes issues on Safari (which often rejects standard webm).
 */
const getSupportedMimeType = () => {
    const types = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
    ];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            console.log(`Using supported video mime type: ${type}`);
            return type;
        }
    }
    return ''; // Browser will try default
};

export const exportVideo = async (
    timings: SegmentTiming[],
    audioBuffer: AudioBuffer,
    onProgress: (percent: number) => void
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        // Standard HD Video Dimensions
        const width = 1280;
        const height = 720;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no alpha
        
        if (!ctx) return reject(new Error('Canvas context not supported'));

        // 1. Preload all images to avoid flickering
        const imageCache = new Map<string, HTMLImageElement>();
        const uniqueImages = Array.from(new Set(timings.map(t => t.image)));
        
        try {
            await Promise.all(uniqueImages.map(base64 => new Promise<void>((res, rej) => {
                const img = new Image();
                img.onload = () => {
                    imageCache.set(base64, img);
                    res();
                };
                img.onerror = () => {
                    console.warn("Failed to load an image frame, skipping.");
                    res(); // Continue even if one fails
                };
                img.src = `data:image/png;base64,${base64}`;
            })));
        } catch (e) {
            console.error(e);
            return reject(new Error('Failed to load images for video export'));
        }

        // 2. Setup Audio for Recording
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const exportAudioCtx = new AudioCtx();
        const dest = exportAudioCtx.createMediaStreamDestination();
        const source = exportAudioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(dest);

        // 3. Setup Recorder
        const streamFps = 30;
        const canvasStream = canvas.captureStream(streamFps);
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ]);

        const mimeType = getSupportedMimeType();
        const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(combinedStream, options);
        } catch (e) {
            console.error("MediaRecorder init failed", e);
            exportAudioCtx.close();
            return reject(new Error("Browser does not support video recording configuration."));
        }

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
            exportAudioCtx.close();
            resolve(blob);
        };

        // 4. Start Recording & Animation Loop
        const duration = audioBuffer.duration;
        let animationId: number;
        
        recorder.start();
        source.start();
        
        const startTime = exportAudioCtx.currentTime;

        const drawFrame = () => {
            const currentTime = exportAudioCtx.currentTime - startTime;
            const progress = Math.min(currentTime / duration, 1);
            
            // Notify progress
            onProgress(progress * 100);

            // Stop condition
            if (currentTime >= duration) {
                recorder.stop();
                source.stop();
                cancelAnimationFrame(animationId);
                return;
            }

            // Find active segment
            const active = timings.find(t => currentTime >= t.start && currentTime < t.end) || timings[timings.length - 1];
            
            if (active) {
                const img = imageCache.get(active.image);
                
                // Clear background
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);

                if (img) {
                    const segDuration = active.end - active.start;
                    const segElapsed = currentTime - active.start;
                    const segProgress = Math.min(Math.max(segElapsed / segDuration, 0), 1);

                    // --- Replicate Ken Burns Effect ---
                    // Deterministic effect based on start time seed
                    const seed = Math.floor(active.start * 100); 
                    const effectType = seed % 4; // 0: Zoom In, 1: Zoom Out, 2: Pan Right, 3: Pan Left
                    
                    let scale = 1;
                    let tx = 0;
                    
                    // Calculate "Cover" Scale
                    const scaleX = width / img.width;
                    const scaleY = height / img.height;
                    const baseScale = Math.max(scaleX, scaleY);

                    ctx.save();
                    
                    // Animation Params
                    const ZOOM_AMOUNT = 0.15; // 15% movement
                    
                    if (effectType === 0) { // Zoom In
                        scale = baseScale * (1 + (segProgress * ZOOM_AMOUNT));
                    } else if (effectType === 1) { // Zoom Out
                        scale = baseScale * (1 + ZOOM_AMOUNT - (segProgress * ZOOM_AMOUNT));
                    } else if (effectType === 2) { // Pan Right
                        scale = baseScale * 1.15;
                        const maxTranslate = width * 0.05;
                        tx = -maxTranslate + (segProgress * maxTranslate * 2);
                    } else { // Pan Left
                        scale = baseScale * 1.15;
                        const maxTranslate = width * 0.05;
                        tx = maxTranslate - (segProgress * maxTranslate * 2);
                    }

                    // Apply Transformations
                    const cx = width / 2;
                    const cy = height / 2;

                    ctx.translate(cx, cy);
                    ctx.scale(scale, scale);
                    ctx.translate(tx, 0);
                    ctx.translate(-img.width / 2, -img.height / 2);
                    
                    ctx.drawImage(img, 0, 0);
                    ctx.restore();
                }
            }

            // IMPORTANT: Request next frame to keep stream active
            animationId = requestAnimationFrame(drawFrame);
        };

        drawFrame();
    });
};