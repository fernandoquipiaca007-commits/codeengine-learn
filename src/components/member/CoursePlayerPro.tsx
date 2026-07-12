import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Play,
  Clock,
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
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLessonStreamUrl, saveProgress, getProductProgress } from '../../lib/learning-api';

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
}

interface ProgressRow {
  lesson_id: string;
  position_seconds: number;
  status: string;
}

export function CoursePlayerPro({ productId, initialLessonId, onBack }: CoursePlayerProProps) {
  const { t } = useTranslation('member');
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const mediaRequestRef = useRef(0);
  const hasRestoredTime = useRef(false);
  const maxTimeRef = useRef<number>(0);

  // Estado básico
  const [product, setProduct] = useState<{ title: string; cover_url: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(initialLessonId || null);

  useEffect(() => {
    hasRestoredTime.current = false;
    
    // Initialize max watched time to prevent forward skipping abuse
    const localData = localStorage.getItem(`course_progress_${productId}`);
    let startTime = 0;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.last_lesson_id === currentLessonId && parsed.last_position > 0) {
          startTime = parsed.last_position;
        }
      } catch {}
    }
    if (startTime === 0) {
      const serverProgress = progress.find((p) => p.lesson_id === currentLessonId);
      if (serverProgress?.position_seconds) {
        startTime = serverProgress.position_seconds;
      }
    }
    maxTimeRef.current = startTime;
  }, [currentLessonId, progress, productId]);
  
  // Estado da Mídia
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | 'link' | 'cloudflare-stream' | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

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

  const flushProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v || !currentLessonId) return;
    const safeDuration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const pct = safeDuration > 0 ? (v.currentTime / safeDuration) * 100 : 0;
    void saveProgress({
      product_id: productId,
      lesson_id: currentLessonId,
      progress_type: 'video',
      position_seconds: Math.floor(v.currentTime),
      position_percent: pct,
      status: pct >= 90 ? 'completed' : 'in_progress',
    });
  }, [currentLessonId, productId]);

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductProgress(productId);
      setProduct(data.product);

      // Aulas e Módulos ordenados
      const allLessons = data.lessons || [];
      const allModules = data.modules || [];
      setLessons(allLessons);
      setModules(allModules);
      setProgress(data.progress || []);

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
    const requestId = ++mediaRequestRef.current;
    setMediaLoading(true);
    setMediaError(null);
    setMediaUrl(null);
    setMediaType(null);
    try {
      const media = await getLessonStreamUrl(lessonId);
      if (requestId !== mediaRequestRef.current) return;
      
      setMediaUrl(media.url);
      setMediaType(media.type);

      if (media.type === 'link') {
        // Auto-complete link lessons immediately
        saveProgress({
          product_id: productId,
          lesson_id: lessonId,
          progress_type: 'video',
          status: 'completed',
        });
        setProgress((prev) => {
          const rest = prev.filter((p) => p.lesson_id !== lessonId);
          return [...rest, { lesson_id: lessonId, position_seconds: 0, status: 'completed' }];
        });
      }
    } catch (e) {
      if (requestId === mediaRequestRef.current) {
        console.error('Erro ao carregar mídia:', e);
        setMediaError(t('coursePlayer.accessError'));
      }
    } finally {
      if (requestId === mediaRequestRef.current) {
        setMediaLoading(false);
      }
    }
  }

  // Salvar progresso ao sair
  useEffect(() => {
    const onBeforeUnload = () => flushProgress();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushProgress();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [flushProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+P
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Track YouTube player progress
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    if (mediaType !== 'cloudflare-stream' || !mediaUrl) return;
    const isYouTube = mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');
    if (!isYouTube) return;

    // Load YouTube API script if not loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let interval: ReturnType<typeof setInterval>;
    const initYT = () => {
      const iframe = document.getElementById('yt-iframe');
      if (!iframe) return;

      ytPlayerRef.current = new (window as any).YT.Player('yt-iframe', {
        events: {
          onStateChange: (event: any) => {
            // event.data === 0 means ENDED
            if (event.data === 0 && currentLessonId) {
              // Mark as completed
              saveProgress({
                product_id: productId,
                lesson_id: currentLessonId,
                progress_type: 'video',
                position_seconds: ytPlayerRef.current.getDuration() || 0,
                position_percent: 100,
                status: 'completed',
              });
              setProgress((prev) => {
                const rest = prev.filter((p) => p.lesson_id !== currentLessonId);
                return [...rest, { lesson_id: currentLessonId, position_seconds: Math.floor(ytPlayerRef.current.getDuration() || 0), status: 'completed' }];
              });
            }
          }
        }
      });

      // Periodically update position
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const time = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (dur > 0 && currentLessonId) {
              const pct = (time / dur) * 100;
              const status = pct >= 90 ? 'completed' : 'in_progress';
              
              // Local update for responsive UI progress bar
              setCurrentTime(time);
              setDuration(dur);
              
              // Auto-save periodically
              saveProgress({
                product_id: productId,
                lesson_id: currentLessonId,
                progress_type: 'video',
                position_seconds: Math.floor(time),
                position_percent: pct,
                status,
              });
              setProgress((prev) => {
                const rest = prev.filter((p) => p.lesson_id !== currentLessonId);
                return [...rest, { lesson_id: currentLessonId, position_seconds: Math.floor(time), status }];
              });
            }
          } catch {}
        }
      }, 5000);
    };

    // Try initializing
    const checkAPI = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(checkAPI);
        // Wait briefly for DOM rendering
        setTimeout(initYT, 1000);
      }
    }, 500);

    return () => {
      clearInterval(checkAPI);
      if (interval) clearInterval(interval);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [mediaUrl, mediaType, currentLessonId, productId]);

  // Handlers do player
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !currentLessonId) return;

    // Skipping protection (Anti-abuse)
    if (v.currentTime > maxTimeRef.current + 2.5) {
      v.currentTime = maxTimeRef.current;
      return;
    }

    // Update maxTimeRef
    if (v.currentTime > maxTimeRef.current) {
      maxTimeRef.current = v.currentTime;
    }

    setCurrentTime(v.currentTime);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      const status = pct >= 90 ? 'completed' : 'in_progress';

      const progressData: {
        product_id: string;
        lesson_id: string;
        progress_type: 'video' | 'ebook';
        position_seconds: number;
        position_percent: number;
        status: string;
      } = {
        product_id: productId,
        lesson_id: currentLessonId,
        progress_type: 'video',
        position_seconds: Math.floor(v.currentTime),
        position_percent: pct,
        status,
      };

      // Save to server
      saveProgress(progressData);

      // Save to localStorage for instant persistence/offline support
      localStorage.setItem(`course_progress_${productId}`, JSON.stringify({
        last_lesson_id: currentLessonId,
        last_position: Math.floor(v.currentTime),
        timestamp: Date.now()
      }));

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

    if (hasRestoredTime.current) return;

    // Restaurar posição salva (preferência para localStorage se for mais recente)
    const localData = localStorage.getItem(`course_progress_${productId}`);
    let startTime = 0;

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.last_lesson_id === currentLessonId && parsed.last_position > 5) {
          startTime = parsed.last_position;
        }
      } catch (e) {
        console.error("Error parsing local progress:", e);
      }
    }

    if (startTime === 0) {
      const serverProgress = progress.find((p) => p.lesson_id === currentLessonId);
      if (serverProgress?.position_seconds && serverProgress.position_seconds > 5) {
        startTime = serverProgress.position_seconds;
      }
    }

    if (startTime > 0) {
      v.currentTime = startTime;
      hasRestoredTime.current = true;
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    
    // Fallback double check to restore position if it was missed or blocked in onLoadedMetadata
    const v = videoRef.current;
    if (v && !hasRestoredTime.current) {
      const localData = localStorage.getItem(`course_progress_${productId}`);
      let startTime = 0;
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.last_lesson_id === currentLessonId && parsed.last_position > 5) {
            startTime = parsed.last_position;
          }
        } catch (e) {}
      }
      if (startTime === 0) {
        const serverProgress = progress.find((p) => p.lesson_id === currentLessonId);
        if (serverProgress?.position_seconds && serverProgress.position_seconds > 5) {
          startTime = serverProgress.position_seconds;
        }
      }
      if (startTime > 0) {
        v.currentTime = startTime;
        hasRestoredTime.current = true;
      }
    }
  };

  const handleVideoError = () => {
    console.error("Erro interno do Player de Vídeo", videoRef.current?.error);
    setMediaError(t('coursePlayer.playbackError'));
    setIsPlaying(false);
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
    const safeDuration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const nextTime = safeDuration > 0 ? Math.max(0, Math.min(safeDuration, time)) : Math.max(0, time);
    v.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (vol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && volume === 0) {
      v.volume = 0.5;
      setVolume(0.5);
    }
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
      playerContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const toggleLessonCompleted = (lessonId: string) => {
    const currentStatus = lessonStatus(lessonId);
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    const position = newStatus === 'completed' ? (currentLesson?.video_duration_seconds || 0) : 0;

    saveProgress({
      product_id: productId,
      lesson_id: lessonId,
      progress_type: 'video',
      position_seconds: position,
      position_percent: newStatus === 'completed' ? 100 : 0,
      status: newStatus,
    });

    setProgress((prev) => {
      const rest = prev.filter((p) => p.lesson_id !== lessonId);
      return [...rest, { lesson_id: lessonId, position_seconds: position, status: newStatus }];
    });
  };

  const courseProgress = lessons.length > 0 
    ? (progress.filter((p) => p.status === 'completed').length / lessons.length) * 100 
    : 0;

  const currentLesson = lessons.find((l) => l.id === currentLessonId);

  function renderPlaylistLessonRow(lesson: Lesson) {
    const status = lessonStatus(lesson.id);
    const isActive = lesson.id === currentLessonId;
    const progressRecord = progress.find((p) => p.lesson_id === lesson.id);
    let progressPercent = 0;
    if (status === 'completed') progressPercent = 100;
    else if (progressRecord?.position_seconds && lesson.video_duration_seconds) {
      progressPercent = (progressRecord.position_seconds / lesson.video_duration_seconds) * 100;
    }

    return (
      <button
        key={lesson.id}
        onClick={() => setCurrentLessonId(lesson.id)}
        className={`w-full text-left rounded-2xl p-3 transition-all relative overflow-hidden group ${
          isActive
            ? 'bg-primary/10 border-2 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
        }`}
      >
        {progressPercent > 0 && !isActive && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-primary/40 transition-all opacity-50"
            style={{ width: `${progressPercent}%` }}
          />
        )}
        {isActive && (
          <div
            className="absolute bottom-0 left-0 h-1.5 bg-primary transition-all shadow-[0_0_10px_rgba(59,130,246,0.8)]"
            style={{ width: `${progressPercent > 0 ? progressPercent : 100}%` }}
          />
        )}

        <div className="flex items-center gap-4 relative z-10">
          <div className={`flex-shrink-0 w-16 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 ${isActive ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-[#1a1a1a] border border-white/5'}`}>
            {status === 'completed' ? (
              <CheckCircle className={`w-5 h-5 ${isActive ? 'text-white' : 'text-green-400'}`} />
            ) : status === 'in_progress' ? (
              <PlayCircle className={`w-5 h-5 ${isActive ? 'text-white' : 'text-primary'}`} />
            ) : (
              <Play className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 ml-1'}`} />
            )}
          </div>

          <div className="flex-1 min-w-0 py-1">
            <p
              className={`text-sm font-semibold truncate leading-tight ${
                isActive ? 'text-primary' : 'text-gray-200 group-hover:text-white'
              }`}
            >
              {lesson.title}
            </p>
            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 mt-1.5">
              {lesson.video_duration_seconds ? (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatTime(lesson.video_duration_seconds)}</span>
              ) : (
                <span>{t('coursePlayer.interactiveLesson', { defaultValue: 'Aula interativa' })}</span>
              )}
              {status === 'in_progress' && progressPercent > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span className="text-primary">{Math.round(progressPercent)}%</span>
                </>
              )}
            </div>
          </div>

          {status === 'completed' && !isActive && (
            <CheckCircle className="w-5 h-5 text-green-500/50 flex-shrink-0 mr-1" />
          )}
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto" />
          <p className="text-on-surface-variant">{t('coursePlayer.loadingCourse')}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black pb-20 font-sans">
      {/* Header simples (Estilo Design Branch) */}
      <div className="border-b border-white/5 bg-surface/20 backdrop-blur-md mb-6">
        <div className="max-w-[1880px] w-full mx-auto px-4 sm:px-6 md:px-12 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2.5 text-on-surface-variant hover:text-primary transition-all group"
          >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-on-surface">CodeEngine <span className="text-primary/60">1</span></span>
          </button>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white flex items-center gap-2 border border-white/10 hover:border-white/20"
            title={showPlaylist ? t('coursePlayer.hidePlaylist') : t('coursePlayer.showPlaylist')}
          >
            <List className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
              {showPlaylist ? t('coursePlayer.hidePlaylist') : t('coursePlayer.showPlaylist')}
            </span>
          </button>
        </div>
      </div>

      {/* Container principal (max-w 1880px) */}
      <div className="max-w-[1880px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna do Player - 2/3 */}
          <div className={`${showPlaylist ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
            {/* Player Premium Container */}
            <div 
              ref={playerContainerRef}
              className={`relative bg-black overflow-hidden shadow-2xl group transition-all duration-300 ${
                isFullscreen 
                  ? 'w-screen h-screen rounded-none border-none shadow-none z-50 fixed inset-0 flex items-center justify-center' 
                  : `rounded-3xl border-2 border-white/10 ${mediaType === 'audio' ? 'h-48' : ''}`
              }`}
            >
              <div className={`relative ${isFullscreen ? 'w-full h-full' : mediaType === 'audio' ? 'h-full' : 'aspect-video'} bg-gradient-to-br from-black via-gray-900 to-black`}>
                
                {/* 1. Loading State */}
                {mediaLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-sm">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-primary" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    </div>
                    <p className="mt-4 text-gray-400 font-medium">{t('coursePlayer.loadingMedia')}</p>
                  </div>
                )}

                {/* 2. Error State */}
                {mediaError && !mediaLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90 backdrop-blur-md p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('coursePlayer.errorTitle')}</h3>
                    <p className="text-gray-400 mb-6 max-w-md">{mediaError}</p>
                    <button
                      onClick={() => currentLessonId && loadVideo(currentLessonId)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 border border-white/10"
                    >
                      {t('coursePlayer.retry')}
                    </button>
                  </div>
                )}

                {/* 3. Cloudflare Stream Player */}
                {mediaUrl && mediaType === 'cloudflare-stream' && !mediaError && (
                  <iframe
                    id={mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? 'yt-iframe' : undefined}
                    src={mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? `${mediaUrl}${mediaUrl.includes('?') ? '&' : '?'}enablejsapi=1` : mediaUrl}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0 rounded-2xl"
                    title="Cloudflare Stream Player"
                  />
                )}

                {/* 3. Custom HTML5 Media Player (Video/Audio) */}
                {mediaUrl && mediaType !== 'link' && mediaType !== 'cloudflare-stream' && !mediaError && (
                  <>
                    <video
                      ref={videoRef}
                      key={`${currentLessonId || 'lesson'}-${mediaUrl}`}
                      src={mediaUrl}
                      preload="metadata"
                      playsInline
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      className={`w-full h-full ${mediaType === 'audio' ? 'hidden' : isFullscreen ? 'object-contain' : 'object-cover'} select-none`}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={handlePlay}
                      onPause={() => setIsPlaying(false)}
                      onEnded={goToNextLesson}
                      onError={handleVideoError}
                    />

                    {mediaType === 'audio' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <Volume2 className="w-12 h-12 text-primary opacity-80" />
                        </div>
                      </div>
                    )}

                    {/* Controles do player em Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${
                        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {/* Play/Pause central grande */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={togglePlay}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all duration-300 transform hover:scale-110 border border-white/10"
                        >
                          {isPlaying ? (
                            <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          ) : (
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white" />
                          )}
                        </button>
                      </div>

                      {/* Controles inferiores Premium */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-3">
                        {/* Barra de progresso estendida hover */}
                        <div className="relative group/progress px-2">
                          <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => handleSeek(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer group-hover/progress:h-2 transition-all absolute top-1/2 -translate-y-1/2 left-0 z-10"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                                duration > 0 ? (currentTime / duration) * 100 : 0
                              }%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                            }}
                          />
                        </div>

                        {/* Botões */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 sm:gap-3 text-white">
                            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg transition-all hidden sm:block">
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>

                            <button onClick={goToPreviousLesson} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            <button onClick={goToNextLesson} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            <div className="flex items-center gap-2 group/volume ml-1 sm:ml-2">
                              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-0 group-hover/volume:w-16 sm:group-hover/volume:w-20 h-1 transition-all"
                                style={{
                                  background: `linear-gradient(to right, #fff 0%, #fff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                                }}
                              />
                            </div>

                            <span className="text-xs sm:text-sm font-mono ml-2 opacity-80">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 text-white">
                            <div className="relative">
                              <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Settings className="w-5 h-5" />
                              </button>

                              {showSettings && (
                                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] rounded-xl border border-white/10 p-3 min-w-[180px] space-y-2 shadow-2xl backdrop-blur-xl">
                                  <div>
                                    <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">{t('coursePlayer.speed')}</p>
                                    <div className="grid grid-cols-4 gap-1">
                                      {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                        <button
                                          key={rate}
                                          onClick={() => {
                                            changePlaybackRate(rate);
                                            setShowSettings(false);
                                          }}
                                          className={`px-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                                            playbackRate === rate ? 'bg-primary text-white' : 'hover:bg-white/10 text-gray-300'
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

                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 4. Mídia do tipo Link */}
                {mediaUrl && mediaType === 'link' && !mediaError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 text-center z-10 border-2 border-primary/20 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-primary/30">
                      <LinkIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{t('coursePlayer.externalContent')}</h3>
                    <p className="text-gray-400 mb-8 max-w-md">
                      {t('coursePlayer.externalContentDesc')}
                    </p>
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1"
                    >
                      {t('coursePlayer.openExternalContent')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Informações da aula */}
            {currentLesson && (
              <div className="bg-[#121216]/95 backdrop-blur-xl border border-white/15 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-transparent opacity-30" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">{currentLesson.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Manual Complete Button */}
                    <button
                      onClick={() => toggleLessonCompleted(currentLesson.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                        lessonStatus(currentLesson.id) === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {lessonStatus(currentLesson.id) === 'completed' 
                        ? t('coursePlayer.completed', 'Concluída') 
                        : t('coursePlayer.markCompleted', 'Concluir Aula')}
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                      <Clock className="w-3 h-3" />
                      {currentLesson.video_duration_seconds ? formatTime(currentLesson.video_duration_seconds) : t('coursePlayer.interactive')}
                    </div>
                  </div>
                </div>
                {currentLesson.description ? (
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-on-surface-variant leading-relaxed text-sm sm:text-base font-sans opacity-80 [&_a]:text-primary [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: currentLesson.description.includes('<') ? currentLesson.description : currentLesson.description.replace(/\n/g, '<br/>') }}
                    />
                  </div>
                ) : (
                  <p className="text-on-surface-variant/40 italic font-sans">{t('coursePlayer.noDescription')}</p>
                )}
              </div>
            )}
          </div>

          {/* Coluna da Playlist (Desktop Sidebar / Mobile Stacked) */}
          {showPlaylist && (
            <div className="lg:col-span-1 space-y-4">
              <div className="sticky top-6">
                <div className="bg-[#121216]/95 backdrop-blur-xl rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  
                  {/* Header Sidebar */}
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h3 className="font-display text-lg font-bold text-white">{t('coursePlayer.playlist')}</h3>
                    <span className="text-xs font-semibold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                      {t('coursePlayer.lessonsCount', { count: lessons.length })}
                    </span>
                  </div>

                  {/* Card de Progresso Premium */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6 flex-shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t('coursePlayer.progress')}</span>
                      <span className="text-xl font-bold text-white">{Math.round(courseProgress)}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden relative z-10 border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3 font-medium relative z-10">
                      {t('coursePlayer.completedOf', { completed: progress.filter((p) => p.status === 'completed').length, total: lessons.length })}
                    </p>
                  </div>

                  {/* Lista de Aulas Agrupadas por Módulo */}
                  <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1 pb-4 flex-1">
                    {/* 1. Aulas sem Módulo (Introdução) */}
                    {(() => {
                      const unassigned = lessons.filter((l) => !l.module_id);
                      if (unassigned.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 font-display">
                            {t('coursePlayer.introduction', { defaultValue: 'Introdução' })}
                          </h4>
                          <div className="space-y-2">
                            {unassigned.map(renderPlaylistLessonRow)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Módulos e suas Aulas */}
                    {modules.map((mod) => {
                      const modLessons = lessons
                        .filter((l) => l.module_id === mod.id)
                        .sort((a, b) => a.display_order - b.display_order);
                      if (modLessons.length === 0) return null;

                      return (
                        <div key={mod.id} className="space-y-2 border-t border-white/5 pt-4 first:border-t-0 first:pt-0">
                          <div>
                            <h4 className="text-sm font-bold text-primary pl-1 font-display">
                              {mod.title}
                            </h4>
                            {mod.description && (
                              <p className="text-[10px] text-gray-400 mt-1 pl-1 leading-relaxed font-sans">
                                {mod.description}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 mt-2">
                            {modLessons.map(renderPlaylistLessonRow)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
