import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, Moon, Sun, Clock, Trash2, ChevronRight, Zap, Book, GraduationCap, Command } from 'lucide-react';
import DialectSelector from './components/DialectSelector';
import GenderSelector from './components/GenderSelector';
import PodcastPlayer from './components/PodcastPlayer';
import { AppState, VoiceName, PodcastSegment, SavedProject, PodcastLength } from './types';
import { DIALECTS, VOICES } from './constants';
import { generateFullEpisode } from './services/geminiService';
import { saveProject, getAllProjects, deleteProject } from './services/storageService';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [dialectId, setDialectId] = useState<string | null>('egypt');
  const [voice, setVoice] = useState<VoiceName>('Fenrir');
  const [length, setLength] = useState<PodcastLength>('short');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [podcastSegments, setPodcastSegments] = useState<PodcastSegment[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Load settings and projects on mount
  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadProjects = async () => {
      try {
          const projects = await getAllProjects();
          setSavedProjects(projects);
      } catch (e) {
          console.error("Failed to load projects", e);
      }
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !dialectId) return;

    const selectedDialect = DIALECTS.find(d => d.id === dialectId);
    if (!selectedDialect) return;

    setErrorMsg('');
    setAppState('GENERATING_SCRIPT');

    try {
      const segments = await generateFullEpisode(topic, selectedDialect, voice, length);
      setPodcastSegments(segments);
      setAppState('PLAYING');
    } catch (err: any) {
      console.error(err);
      setAppState('ERROR');
      setErrorMsg(err.message || "حدث خطأ أثناء إنشاء البودكاست. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleSaveProject = async (name: string) => {
      if (!podcastSegments || !dialectId) return;
      
      const newProject: SavedProject = {
          id: crypto.randomUUID(),
          name: name,
          topic: topic,
          date: Date.now(),
          segments: podcastSegments,
          dialectId: dialectId,
          voiceId: voice,
      };

      try {
          await saveProject(newProject);
          await loadProjects();
          // alert("تم حفظ المشروع بنجاح!"); 
      } catch (e) {
          console.error("Save failed", e);
          alert("فشل الحفظ. قد تكون المساحة ممتلئة.");
      }
  };

  const handleLoadProject = (project: SavedProject) => {
      setTopic(project.topic);
      setDialectId(project.dialectId);
      if (project.voiceId) {
          setVoice(project.voiceId);
      }
      setPodcastSegments(project.segments);
      setAppState('PLAYING');
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
          await deleteProject(id);
          await loadProjects();
      }
  };

  const handleReset = () => {
    setAppState('IDLE');
    setPodcastSegments(null);
    setTopic('');
  };

  // --- UI Components ---

  const SavedProjectsList = () => {
      if (savedProjects.length === 0) return null;

      return (
          <div className="mt-12 animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-400 mb-4 px-2">المكتبة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProjects.map(project => (
                      <div 
                        key={project.id}
                        onClick={() => handleLoadProject(project)}
                        className="bg-ios-card dark:bg-ios-dark-card p-4 rounded-3xl shadow-ios hover:shadow-ios-hover cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex justify-between items-start">
                              <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg mb-1">{project.name}</h4>
                                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 w-fit px-2 py-1 rounded-lg">
                                      <span>{DIALECTS.find(d => d.id === project.dialectId)?.emoji}</span>
                                      <span>{VOICES.find(v => v.id === project.voiceId)?.emoji || '🎙️'}</span>
                                      <span>{new Date(project.date).toLocaleDateString('ar-EG')}</span>
                                  </div>
                              </div>
                              <button 
                                onClick={(e) => handleDeleteProject(e, project.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                              >
                                   <Trash2 size={18} />
                               </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const MainInterface = () => {
    switch (appState) {
      case 'IDLE':
      case 'ERROR':
        return (
          <div className="max-w-3xl mx-auto pb-20">
            <div className="text-center mb-10 pt-10 animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Mawsoo'ah <span className="text-primary-500">AI</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                موسوعتك الصوتية الذكية، بأي لهجة تفضلها.
              </p>
            </div>

            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              
              {/* Card 1: Topic */}
              <div className="bg-ios-card dark:bg-ios-dark-card rounded-[2rem] shadow-ios p-6 md:p-8">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Command size={18} />
                    </div>
                    <label className="text-lg font-bold text-gray-900 dark:text-white">
                        موضوع الحلقة
                    </label>
                 </div>
                 <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="عن ماذا تريد أن تتعلم اليوم؟ (مثلاً: الثقوب السوداء، تاريخ القهوة، نظرية الكم...)"
                    className="w-full p-4 text-xl md:text-2xl font-medium bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-white resize-none h-32 leading-relaxed"
                  />
              </div>

              {/* Card 2: Settings Group (Apple Style Inset) */}
              <div className="space-y-4">
                  <div className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider">الإعدادات</div>
                  
                  <div className="bg-ios-card dark:bg-ios-dark-card rounded-[2rem] shadow-ios overflow-hidden divide-y divide-gray-100 dark:divide-ios-dark-separator">
                      
                      {/* Gender Selector */}
                      <div className="p-6">
                          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">المتحدث</label>
                          <GenderSelector selectedVoice={voice} onSelect={setVoice} />
                      </div>

                      {/* Length Selector */}
                      <div className="p-6">
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">نوع الشرح</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'short', icon: Zap, label: 'موجز', sub: '٢ دقيقة' },
                                { id: 'long', icon: Book, label: 'قصصي', sub: '٨ دقائق' },
                                { id: 'extra-long', icon: GraduationCap, label: 'أكاديمي', sub: '٢٠ دقيقة' },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = length === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setLength(opt.id as PodcastLength)}
                                        className={`
                                            relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300
                                            ${isSelected 
                                                ? 'bg-primary-500 text-white shadow-glow transform scale-[1.02]' 
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}
                                        `}
                                    >
                                        <Icon size={24} className="mb-2" />
                                        <span className="font-bold text-sm">{opt.label}</span>
                                        <span className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{opt.sub}</span>
                                    </button>
                                )
                            })}
                        </div>
                      </div>

                      {/* Dialect Selector */}
                      <div className="p-6">
                          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">اللهجة / اللغة</label>
                          <DialectSelector selectedId={dialectId} onSelect={setDialectId} />
                      </div>

                  </div>
              </div>

              {/* Action Button */}
              <button
                  onClick={handleGenerate}
                  disabled={!topic || !dialectId}
                  className={`
                    w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-ios-hover
                    ${!topic || !dialectId 
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50' 
                      : 'bg-primary-600 hover:bg-primary-500 transform hover:scale-[1.01] active:scale-[0.98]'}
                  `}
                >
                  <Sparkles size={24} className={!topic ? '' : 'animate-pulse'} />
                  <span>إنشاء الحلقة</span>
              </button>

               {appState === 'ERROR' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl text-center text-sm border border-red-100 dark:border-red-900/30">
                    {errorMsg}
                  </div>
                )}
            </div>

            <SavedProjectsList />
          </div>
        );

      case 'GENERATING_SCRIPT':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in-up">
             <div className="relative">
                <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 rounded-full"></div>
                <div className="w-24 h-24 bg-white dark:bg-ios-dark-card rounded-full flex items-center justify-center shadow-ios mb-8 relative z-10">
                    <Book size={40} className="text-primary-500 animate-pulse-slow" />
                </div>
             </div>
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">جاري التحضير...</h2>
             <p className="text-gray-500 dark:text-gray-400 text-center max-w-md text-lg leading-relaxed px-4">
               يقوم الذكاء الاصطناعي الآن بكتابة السيناريو وتقسيم الموضوع إلى مشاهد تعليمية شيقة.
             </p>
          </div>
        );

      case 'GENERATING_MEDIA': 
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in-up">
             <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
                <div className="w-24 h-24 bg-white dark:bg-ios-dark-card rounded-full flex items-center justify-center shadow-ios mb-8 relative z-10">
                    <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                    <Zap size={40} className="text-primary-500" />
                </div>
             </div>
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">إنتاج الوسائط</h2>
             <p className="text-gray-500 dark:text-gray-400 text-center max-w-md text-lg leading-relaxed px-4">
               يتم الآن توليد التعليق الصوتي ورسم اللوحات الفنية بدقة عالية.
             </p>
          </div>
        );

      case 'PLAYING':
        return podcastSegments ? (
          <div className="py-4 animate-fade-in-up">
             <PodcastPlayer 
               segments={podcastSegments}
               topic={topic}
               onReset={handleReset}
               onSave={handleSaveProject}
             />
          </div>
        ) : null;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-500">
      {/* Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50 dark:border-white/5 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div 
            onClick={appState !== 'IDLE' ? handleReset : undefined}
            className={`flex items-center gap-3 ${appState !== 'IDLE' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white shadow-glow">
              <Globe size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Mawsoo'ah AI</span>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-90"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Spacer for Fixed Header */}
      <main className="container mx-auto px-4 pt-24">
        {MainInterface()}
      </main>
    </div>
  );
};

export default App;