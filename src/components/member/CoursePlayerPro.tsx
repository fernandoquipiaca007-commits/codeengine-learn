import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  List,
  X,
} from 'lucide-react';
import { getLessonStreamUrl, saveProgress, getProductProgress } from '../../lib/learning-api';
import { useLocale } from '../../contexts/LocaleContext';

interface CoursePlayerProProps {
  productId: string;
  initialLessonId?: string;
  onBack: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  display_order: number;
  module_id?: string | null;
  video_duration_seconds?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  display_order: number;
  lessons: Lesson[];
}

interface ProgressRow {
  lesson_id: string;
  position_seconds: number;
  status: string;
}

export function CoursePlayerPro({ productId, initialLessonId, onBack }: CoursePlayerProProps) {
  const { locale } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado básico
  const [product, setProduct] = useState<{ title: string; cover_url: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(initialLessonId || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);

  // Estado do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductProgress(productId);
      setProduct(data.product);

      // Organizar aulas por módulos
      const allLessons = data.lessons || [];
      setLessons(allLessons);

      // Agrupar por módulos se existirem
      const moduleMap = new Map<string, Module>();
      const lessonsWithoutModule: Lesson[] = [];

      allLessons.forEach((lesson: Lesson) => {
        if (lesson.module_id) {
          if (!moduleMap.has(lesson.module_id)) {
            moduleMap.set(lesson.module_id, {
              id: lesson.module_id,
              title: `Módulo ${moduleMap.size + 1}`,
              display_order: moduleMap.size,
              lessons: [],
            });
          }
          moduleMap.get(lesson.module_id)!.lessons.push(lesson);
        } else {
          lessonsWithoutModule.push(lesson);
        }
      });

      const modulesArray = Array.from(moduleMap.values());
      if (lessonsWithoutModule.length > 0) {
        modulesArray.push({
          id: 'no-module',
          title: 'Aulas',
          display_order: 999,
          lessons: lessonsWithoutModule,
        });
      }

      setModules(modulesArray);
      setProgress(data.progress || []);

      // Expandir todos os módulos por padrão
      setExpandedModules(new Set(modulesArray.map((m) => m.id)));

      // Determinar aula inicial
      const last = data.lastProgress;
      const startId = initialLessonId || last?.lesson_id || allLessons[0]?.id;
      if (startId) setCurrentLessonId(startId);
    } catch (e) {
      console.error('Erro ao carregar curso:', e);
    } finally {
      setLoading(false);
    }
  }, [productId, initialLessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carregar vídeo quando a aula muda
  useEffect(() => {
    if (!currentLessonId) return;
    loadVideo(currentLessonId);
  }, [currentLessonId]);

  async function loadVideo(lessonId: string) {
    setVideoLoading(true);
    setVideoUrl(null);
    try {
      const url = await getLessonStreamUrl(lessonId);
      setVideoUrl(url);
    } catch (e) {
      console.error('Erro ao carregar vídeo:', e);
    } finally {
      setVideoLoading(false);
    }
  }

  // Salvar progresso ao sair
  useEffect(() => {
    const flush = () => {
      const v = videoRef.current;
      if (!v || !currentLessonId) return;
      const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      void saveProgress({
        product_id: productId,
        lesson_id: currentLessonId,
        progress_type: 'video',
        position_seconds: Math.floor(v.currentTime),
        position_percent: pct,
        status: pct >= 90 ? 'completed' : 'in_progress',
      });
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [productId, currentLessonId]);

  // Handlers do player
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !currentLessonId) return;

    setCurrentTime(v.currentTime);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      const status = pct >= 90 ? 'completed' : 'in_progress';

      saveProgress({
        product_id: productId,
        lesson_id: currentLessonId,
        progress_type: 'video',
        position_seconds: Math.floor(v.currentTime),
        position_percent: pct,
        status,
      });

      setProgress((prev) => {
        const rest = prev.filter((p) => p.lesson_id !== currentLessonId);
        return [...rest, { lesson_id: currentLessonId, position_seconds: Math.floor(v.currentTime), status }];
      });
    }, 3000);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;

    setDuration(v.duration);

    // Restaurar posição salva
    const currentProgress = progress.find((p) => p.lesson_id === currentLessonId);
    if (currentProgress?.position_seconds && currentProgress.position_seconds > 5) {
      v.currentTime = currentProgress.position_seconds;
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const changePlaybackRate = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  };

  const goToNextLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id);
    }
  };

  const goToPreviousLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex > 0) {
      setCurrentLessonId(lessons[currentIndex - 1].id);
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skipTime(-10);
          break;
        case 'ArrowRight':
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume]);

  // Ocultar controles automaticamente
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const lessonStatus = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId)?.status || 'not_started';
  };

  const courseProgress = lessons.length > 0 
    ? (progress.filter((p) => p.status === 'completed').length / lessons.length) * 100 
    : 0;

  const currentLesson = lessons.find((l) => l.id === currentLessonId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto" />
          <p className="text-on-surface-variant">Carregando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold text-white truncate">{product?.title}</h1>
                <p className="text-sm text-on-surface-variant">
                  {Math.round(courseProgress)}% concluído • {lessons.length} aulas
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de progresso do curso */}
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Player de vídeo */}
          <div className={`${showPlaylist ? 'lg:col-span-2' : 'lg:col-span-3'} relative bg-black`}>
            <div className="relative aspect-video bg-black group">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary" />
                </div>
              )}

              {videoUrl && (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={goToNextLesson}
                  />

                  {/* Overlay de controles */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
                      showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Play/Pause central */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all transform hover:scale-110"
                      >
                        {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                      </button>
                    </div>

                    {/* Controles inferiores */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      {/* Barra de progresso */}
                      <div className="group/progress">
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          value={currentTime}
                          onChange={(e) => handleSeek(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer group-hover/progress:h-2 transition-all"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                              (currentTime / duration) * 100
                            }%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`,
                          }}
                        />
                      </div>

                      {/* Controles */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button onClick={togglePlay} className="hover:text-primary transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                          </button>

                          <button onClick={goToPreviousLesson} className="hover:text-primary transition-colors">
                            <SkipBack className="w-5 h-5" />
                          </button>

                          <button onClick={goToNextLesson} className="hover:text-primary transition-colors">
                            <SkipForward className="w-5 h-5" />
                          </button>

                          <div className="flex items-center gap-2 group/volume">
                            <button onClick={toggleMute} className="hover:text-primary transition-colors">
                              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.1}
                              value={volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-0 group-hover/volume:w-20 transition-all"
                            />
                          </div>

                          <span className="text-sm font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <button
                              onClick={() => setShowSettings(!showSettings)}
                              className="hover:text-primary transition-colors"
                            >
                              <Settings className="w-5 h-5" />
                            </button>

                            {showSettings && (
                              <div className="absolute bottom-full right-0 mb-2 bg-surface rounded-lg p-3 min-w-[200px] space-y-2">
                                <div>
                                  <p className="text-xs text-on-surface-variant mb-2">Velocidade</p>
                                  <div className="grid grid-cols-4 gap-1">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                      <button
                                        key={rate}
                                        onClick={() => {
                                          changePlaybackRate(rate);
                                          setShowSettings(false);
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${
                                          playbackRate === rate ? 'bg-primary text-white' : 'bg-white/10'
                                        }`}
                                      >
                                        {rate}x
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Informações da aula */}
            {currentLesson && (
              <div className="p-6 bg-surface">
                <h2 className="font-display text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
                {currentLesson.description && (
                  <p className="text-on-surface-variant leading-relaxed">{currentLesson.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <div className="bg-surface border-l border-white/10 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="sticky top-0 bg-surface border-b border-white/10 p-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Conteúdo do Curso</h3>
                <button onClick={() => setShowPlaylist(false)} className="lg:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2">
                {modules.map((module) => (
                  <div key={module.id} className="mb-2">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedModules);
                        if (newExpanded.has(module.id)) {
                          newExpanded.delete(module.id);
                        } else {
                          newExpanded.add(module.id);
                        }
                        setExpandedModules(newExpanded);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="font-semibold text-sm">{module.title}</span>
                      {expandedModules.has(module.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {expandedModules.has(module.id) && (
                      <div className="space-y-1 mt-1">
                        {module.lessons.map((lesson) => {
                          const status = lessonStatus(lesson.id);
                          const isActive = lesson.id === currentLessonId;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLessonId(lesson.id)}
                              className={`w-full text-left p-3 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-primary/20 border-l-4 border-primary'
                                  : 'hover:bg-white/5 border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                  ) : status === 'in_progress' ? (
                                    <PlayCircle className="w-5 h-5 text-primary" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-on-surface-variant" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-white'}`}>
                                    {lesson.title}
                                  </p>
                                  {lesson.video_duration_seconds && (
                                    <p className="text-xs text-on-surface-variant mt-1">
                                      {formatTime(lesson.video_duration_seconds)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
