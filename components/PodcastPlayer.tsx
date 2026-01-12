import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, FileText, Download, Save, Maximize2, X, MoreHorizontal, Video, Loader2, ChevronDown } from 'lucide-react';
import { decodeAudio, createWavBlobFromBuffer } from '../services/geminiService';
import { exportVideo } from '../services/mediaExportService';
import AudioVisualizer from './AudioVisualizer';
import { PodcastSegment } from '../types';

interface Props {
  segments: PodcastSegment[];
  topic: string;
  onReset: () => void;
  onSave: (name: string) => void;
}

type SubtitleMode = 'off' | 'original' | 'msa' | 'english';

const PodcastPlayer: React.FC<Props> = ({ segments, topic, onReset, onSave }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  
  // Subtitle State
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('original');
  const [showOptions, setShowOptions] = useState(false);

  // Fullscreen State
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Current Segment Data
  const [currentImage, setCurrentImage] = useState<string>('');
  const [currentSegment, setCurrentSegment] = useState<PodcastSegment | null>(null);
  const [currentSegmentDuration, setCurrentSegmentDuration] = useState<number>(5);

  const [isSaving, setIsSaving] = useState(false);
  
  // Animation State
  const [imageStyle, setImageStyle] = useState<React.CSSProperties>({});

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const masterBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const segmentTimeMapRef = useRef<{ start: number, end: number, image: string, segment: PodcastSegment }[]>([]);

  // Initialize Audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        audioContextRef.current = new AudioCtx();
        
        const decodedBuffers = await Promise.all(
            segments.map(seg => decodeAudio(seg.audioBase64, audioContextRef.current!))
        );

        const totalLength = decodedBuffers.reduce((acc, buf) => acc + buf.length, 0);
        
        const masterBuffer = audioContextRef.current.createBuffer(
            1, totalLength, 24000
        );
        
        const channelData = masterBuffer.getChannelData(0);
        let offset = 0;
        const timeMap: { start: number, end: number, image: string, segment: PodcastSegment }[] = [];

        decodedBuffers.forEach((buf, index) => {
            channelData.set(buf.getChannelData(0), offset);
            
            const startSec = offset / 24000;
            const durationSec = buf.duration;
            const endSec = startSec + durationSec;
            
            timeMap.push({
                start: startSec,
                end: endSec,
                image: segments[index].imageBase64,
                segment: segments[index]
            });

            offset += buf.length;
        });

        masterBufferRef.current = masterBuffer;
        segmentTimeMapRef.current = timeMap;
        setDuration(masterBuffer.duration);

        if (timeMap.length > 0) {
            setCurrentImage(timeMap[0].image);
            setCurrentSegment(timeMap[0].segment);
            setCurrentSegmentDuration(timeMap[0].end - timeMap[0].start);
        }

      } catch (e) {
        console.error("Failed to prepare audio", e);
      }
    };

    if (segments.length > 0) {
        initAudio();
    }

    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [segments]);

  // Apply Ken Burns Effect
  useEffect(() => {
    if (!currentSegment || !isPlaying) {
        if (!isPlaying) {
             const currentTransform = imageStyle.transform || 'scale(1)';
             setImageStyle({ transform: currentTransform, transition: 'none' });
        }
        return;
    }

    const effects = [
        { start: 'scale(1) translate(0, 0)', end: 'scale(1.15) translate(0, 0)' },
        { start: 'scale(1.15) translate(0, 0)', end: 'scale(1) translate(0, 0)' },
        { start: 'scale(1.15) translate(-2%, 0)', end: 'scale(1.15) translate(2%, 0)' },
    ];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    setImageStyle({ transform: randomEffect.start, transition: 'none' });

    const timer = setTimeout(() => {
        const animDuration = currentSegmentDuration + 1; 
        setImageStyle({ transform: randomEffect.end, transition: `transform ${animDuration}s linear` });
    }, 50);

    return () => clearTimeout(timer);
  }, [currentSegment, currentSegmentDuration, isPlaying]);


  // Playback Loop
  useEffect(() => {
    let animationFrame: number;

    const updateState = () => {
      if (audioContextRef.current && isPlaying) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        
        if (elapsed >= duration) {
          setIsPlaying(false);
          setCurrentTime(duration);
          pausedTimeRef.current = 0;
        } else {
          setCurrentTime(elapsed);
          
          const active = segmentTimeMapRef.current.find(
            seg => elapsed >= seg.start && elapsed < seg.end
          );
          
          if (active) {
             if (active.image !== currentImage) {
                 setCurrentImage(active.image);
                 setCurrentSegmentDuration(active.end - active.start);
             }
             if (active.segment !== currentSegment) setCurrentSegment(active.segment);
          }
          animationFrame = requestAnimationFrame(updateState);
        }
      }
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateState);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, duration, currentImage, currentSegment]);

  const togglePlay = async () => {
    if (!audioContextRef.current || !masterBufferRef.current) return;

    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      pausedTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
    } else {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      playFrom(pausedTimeRef.current);
    }
  };

  const playFrom = (offsetTime: number) => {
     if (!audioContextRef.current || !masterBufferRef.current) return;
     const safeOffset = Math.max(0, Math.min(offsetTime, duration));

     if (sourceNodeRef.current) sourceNodeRef.current.stop();

     const source = audioContextRef.current.createBufferSource();
     source.buffer = masterBufferRef.current;
     source.connect(audioContextRef.current.destination);
     source.start(0, safeOffset);
     startTimeRef.current = audioContextRef.current.currentTime - safeOffset;
     pausedTimeRef.current = safeOffset;
     sourceNodeRef.current = source;
     setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    
    const active = segmentTimeMapRef.current.find(seg => newTime >= seg.start && newTime < seg.end);
    if (active) {
        setCurrentImage(active.image);
        setCurrentSegment(active.segment);
        setCurrentSegmentDuration(active.end - active.start);
    }
    if (isPlaying) playFrom(newTime);
  };

  const handleDownloadVideo = async () => {
      if (!masterBufferRef.current || segmentTimeMapRef.current.length === 0) return;
      if (isPlaying) togglePlay();
      setShowOptions(false);

      setIsExporting(true);
      try {
          const blob = await exportVideo(
              segmentTimeMapRef.current,
              masterBufferRef.current,
              (progress) => setExportProgress(progress)
          );
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `mawsooah-${topic.replace(/\s+/g, '-')}.webm`; // Browser may auto-correct ext
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Video export failed", e);
          alert("نعتذر، المتصفح الحالي لا يدعم تصدير الفيديو بهذه الصيغة. يرجى تجربة Chrome أو Firefox على الحاسوب.");
      } finally {
          setIsExporting(false);
          setExportProgress(0);
      }
  };

  const handleSaveClick = () => {
    setIsSaving(true);
    const name = prompt("اسم المشروع:", topic);
    if (name) onSave(name);
    setIsSaving(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const subtitleText = (() => {
    if (!currentSegment || subtitleMode === 'off') return null;
    switch (subtitleMode) {
      case 'msa': return currentSegment.textMSA;
      case 'english': return currentSegment.textEn;
      default: return currentSegment.text;
    }
  })();

  return (
    <div className="max-w-md mx-auto relative group">
      {/* Background Blur Effect */}
      {currentImage && (
        <div className="fixed inset-0 z-[-1] overflow-hidden">
            <img 
                src={`data:image/png;base64,${currentImage}`} 
                className="w-full h-full object-cover blur-[80px] opacity-30 dark:opacity-20 scale-150"
            />
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40"></div>
        </div>
      )}

      {/* Loading Overlay for Export */}
      {isExporting && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white dark:bg-ios-dark-card p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
               <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التصدير...</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">يتم دمج الفيديو بجودة عالية.</p>
               <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
                   <div className="bg-primary-500 h-full transition-all duration-300 ease-linear" style={{ width: `${exportProgress}%` }} />
               </div>
               <span className="text-xs font-mono text-gray-400">{Math.round(exportProgress)}%</span>
           </div>
        </div>
      )}

      {/* Fullscreen Viewer */}
      {isImageFullscreen && currentImage && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-0 animate-in fade-in">
           <button onClick={() => setIsImageFullscreen(false)} className="absolute top-6 right-6 text-white/80 hover:text-white z-10"><X size={32} /></button>
           <img src={`data:image/png;base64,${currentImage}`} className="max-w-full max-h-full object-contain" />
           {subtitleText && (
             <div className="absolute bottom-12 left-0 right-0 text-center px-6">
                <span className="inline-block bg-black/50 backdrop-blur-xl text-white px-6 py-4 rounded-2xl text-xl font-medium leading-relaxed shadow-lg">
                  {subtitleText}
                </span>
             </div>
           )}
        </div>
      )}

      {/* Main Player Card */}
      <div className="bg-white/80 dark:bg-ios-dark-card/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/5">
        
        {/* Artwork Area */}
        <div className="p-6 pb-2">
            <div className="aspect-square w-full bg-gray-100 dark:bg-black/50 rounded-2xl overflow-hidden relative shadow-lg">
                {currentImage ? (
                    <div className="w-full h-full cursor-zoom-in" onClick={() => setIsImageFullscreen(true)}>
                        <img 
                            src={`data:image/png;base64,${currentImage}`} 
                            style={imageStyle}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        
                        {/* Subtitles on Image */}
                        {subtitleText && (
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-white font-bold text-lg leading-relaxed drop-shadow-md dir-rtl text-right">
                                    {subtitleText}
                                </p>
                            </div>
                        )}
                        <button className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
                            <Maximize2 size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-4xl">🎨</div>
                )}
            </div>
        </div>

        {/* Info & Seek */}
        <div className="px-8 mt-4">
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate leading-tight">{topic}</h2>
                    <p className="text-primary-500 font-medium text-sm mt-1">Mawsoo'ah AI</p>
                </div>
                <button 
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <MoreHorizontal size={24} />
                </button>
            </div>

            {/* Options Dropdown */}
            {showOptions && (
                <div className="absolute top-20 right-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-2 w-56 z-20 animate-in slide-in-from-top-2">
                    <button onClick={handleSaveClick} className="w-full text-right px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold">
                        <Save size={18} /> حفظ المشروع
                    </button>
                    <button onClick={handleDownloadVideo} className="w-full text-right px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold">
                        <Video size={18} /> حفظ فيديو
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-white/10 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-400 font-bold uppercase">الترجمة</div>
                    {['original', 'msa', 'english', 'off'].map((mode) => (
                        <button 
                            key={mode}
                            onClick={() => { setSubtitleMode(mode as SubtitleMode); setShowOptions(false); }}
                            className={`w-full text-right px-4 py-2 rounded-lg text-sm transition-colors ${subtitleMode === mode ? 'text-primary-500 font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            {mode === 'original' ? 'النص الأصلي' : mode === 'msa' ? 'الفصحى' : mode === 'english' ? 'English' : 'إخفاء'}
                        </button>
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-2">
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:h-2 transition-all"
                />
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-400 mb-6 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 mb-8">
                <button onClick={onReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><RotateCcw size={22} /></button>
                
                <button 
                    onClick={togglePlay}
                    className="w-20 h-20 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30 transform transition-all active:scale-95"
                >
                    {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
                </button>

                <div className="w-6"><AudioVisualizer isPlaying={isPlaying} /></div>
            </div>

            {/* Script Toggle */}
            <button 
                onClick={() => setShowScript(!showScript)}
                className="w-full py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-primary-500 uppercase tracking-widest transition-colors"
            >
                <FileText size={14} />
                <span>{showScript ? 'Hide Script' : 'Show Script'}</span>
                <ChevronDown size={14} className={`transform transition-transform ${showScript ? 'rotate-180' : ''}`} />
            </button>
        </div>

        {/* Script Viewer */}
        {showScript && (
            <div className="bg-gray-50 dark:bg-black/20 p-6 max-h-64 overflow-y-auto text-right space-y-4 border-t border-gray-100 dark:border-white/5">
                {segments.map((s, i) => (
                    <div key={i} className={`transition-opacity duration-300 ${s.text === currentSegment?.text ? 'opacity-100' : 'opacity-40'}`}>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-relaxed">{s.text}</p>
                        {s.textEn && <p className="text-sm text-gray-500 dark:text-gray-400 dir-ltr text-left mt-1">{s.textEn}</p>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default PodcastPlayer;