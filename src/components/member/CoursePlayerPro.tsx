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
    <div ref={containerRef} className="min-h-screen pb-20">
      {/* Header simples */}
      <div className="px-4 sm:px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-display font-semibold text-lg">CodeEngine <span className="text-gray-500">Learn</span></span>
        </button>
      </div>

      {/* Container principal */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna do Player - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Premium */}
            <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl">
              <div className="relative aspect-video bg-gradient-to-br from-black via-gray-900 to-black">
                {videoLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    </div>
                    <p className="mt-4 text-gray-400 font-medium">Carregando vídeo...</p>
                  </div>
                )}

                {videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={goToNextLesson}
                    />

                    {/* Controles do player */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${
                        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {/* Play/Pause central */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={togglePlay}
                          className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                        >
                          {isPlaying ? (
                            <Pause className="w-10 h-10 text-white" />
                          ) : (
                            <Play className="w-10 h-10 ml-1 text-white" />
                          )}
                        </button>
                      </div>

                      {/* Controles inferiores */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                        {/* Barra de progresso */}
                        <div className="relative">
                          <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => handleSeek(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all"
                            style={{
                              background: `linear-gradient(to right, #fff 0%, #fff ${
                                (currentTime / duration) * 100
                              }%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
                            }}
                          />
                        </div>

                        {/* Controles */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={togglePlay}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </button>

                            <button
                              onClick={goToPreviousLesson}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <SkipBack className="w-5 h-5" />
                            </button>

                            <button
                              onClick={goToNextLesson}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <SkipForward className="w-5 h-5" />
                            </button>

                            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>

                            <span className="text-sm font-mono text-white">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Settings className="w-5 h-5" />
                              </button>

                              {showSettings && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-xl rounded-2xl p-4 min-w-[200px] border border-white/10">
                                  <p className="text-xs text-gray-400 mb-2 font-semibold">Velocidade</p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                      <button
                                        key={rate}
                                        onClick={() => {
                                          changePlaybackRate(rate);
                                          setShowSettings(false);
                                        }}
                                        className={`px-2 py-1 text-sm rounded-lg transition-all ${
                                          playbackRate === rate
                                            ? 'bg-primary text-white'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                      >
                                        {rate}x
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informações da aula */}
            {currentLesson && (
              <div className="space-y-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="font-semibold">Progresso Total: {Math.round(courseProgress)}%</span>
                  <span>•</span>
                  <span>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Playlist Mobile */}
            <div className="lg:hidden space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-white">Playlist</h3>
                <span className="text-sm text-gray-400">
                  {progress.filter((p) => p.status === 'completed').length} / {lessons.length} aulas
                </span>
              </div>

              <div className="space-y-3">
                {lessons.map((lesson) => {
                  const status = lessonStatus(lesson.id);
                  const isActive = lesson.id === currentLessonId;
                  const progressPercent = progress.find((p) => p.lesson_id === lesson.id)?.position_seconds
                    ? ((progress.find((p) => p.lesson_id === lesson.id)?.position_seconds || 0) /
                        (lesson.video_duration_seconds || 1)) *
                      100
                    : 0;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLessonId(lesson.id)}
                      className={`w-full rounded-2xl p-4 transition-all ${
                        isActive
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-surface/50 border-2 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          {status === 'completed' ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : (
                            <Play className="w-6 h-6 text-gray-500" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                          <p className={`font-medium text-sm mb-1 ${isActive ? 'text-primary' : 'text-white'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {lesson.video_duration_seconds && (
                              <span>{formatTime(lesson.video_duration_seconds)}</span>
                            )}
                            {status === 'in_progress' && progressPercent > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-primary">Em progresso</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        {status === 'completed' && (
                          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Barra de progresso */}
                      {progressPercent > 0 && (
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Playlist Desktop - Sidebar */}
          <div className="hidden lg:block space-y-4">
            <div className="sticky top-6">
              <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">Playlist</h3>
                  <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                    {lessons.length} aulas
                  </span>
                </div>

                {/* Progresso total */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Progresso Total</span>
                    <span className="text-lg font-bold text-primary">{Math.round(courseProgress)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {progress.filter((p) => p.status === 'completed').length} de {lessons.length} concluídas
                  </p>
                </div>

                {/* Lista de aulas */}
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pr-2">
                  {lessons.map((lesson) => {
                    const status = lessonStatus(lesson.id);
                    const isActive = lesson.id === currentLessonId;
                    const progressPercent = progress.find((p) => p.lesson_id === lesson.id)?.position_seconds
                      ? ((progress.find((p) => p.lesson_id === lesson.id)?.position_seconds || 0) /
                          (lesson.video_duration_seconds || 1)) *
                        100
                      : 0;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLessonId(lesson.id)}
                        className={`w-full text-left rounded-2xl p-3 transition-all relative overflow-hidden ${
                          isActive
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        }`}
                      >
                        {/* Barra de progresso */}
                        {progressPercent > 0 && (
                          <div
                            className="absolute bottom-0 left-0 h-1 bg-primary/50 transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        )}

                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            {status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : status === 'in_progress' ? (
                              <PlayCircle className="w-5 h-5 text-primary" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-500" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isActive ? 'text-primary' : 'text-white'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              {lesson.video_duration_seconds && (
                                <span>{formatTime(lesson.video_duration_seconds)}</span>
                              )}
                              {status === 'in_progress' && progressPercent > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary">{Math.round(progressPercent)}%</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status icon */}
                          {status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
