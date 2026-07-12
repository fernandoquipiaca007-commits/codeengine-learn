// Este componente foi substituído pela versão Pro
// Importando a versão melhorada
export { CoursePlayerPro as CoursePlayer } from './CoursePlayerPro';

// Versão legada mantida para compatibilidade
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Play, Clock } from 'lucide-react';
import { getLessonStreamUrl, saveProgress, getProductProgress } from '../../lib/learning-api';
import { useLocale } from '../../contexts/LocaleContext';

interface CoursePlayerLegacyProps {
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

interface ProgressRow {
  lesson_id: string;
  position_seconds: number;
  status: string;
}

export function CoursePlayerLegacy({ productId, initialLessonId, onBack }: CoursePlayerLegacyProps) {
  const { locale } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [product, setProduct] = useState<{ title: string; cover_url: string } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(initialLessonId || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductProgress(productId);
      setProduct(data.product);
      setLessons(data.lessons || []);
      setProgress(data.progress || []);
      const last = data.lastProgress;
      const startId =
        initialLessonId ||
        last?.lesson_id ||
        data.lessons?.[0]?.id;
      if (startId) setCurrentLessonId(startId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [productId, initialLessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!currentLessonId) return;
    loadVideo(currentLessonId);
  }, [currentLessonId]);

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

  async function loadVideo(lessonId: string) {
    setVideoLoading(true);
    setVideoUrl(null);
    try {
      const media = await getLessonStreamUrl(lessonId);
      if (media.type === 'link') {
        window.open(media.url, '_blank');
        // Auto-complete if it's a link
        saveProgress({
          product_id: productId,
          lesson_id: lessonId,
          progress_type: 'video',
          status: 'completed',
        });
      } else {
        setVideoUrl(media.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVideoLoading(false);
    }
  }

  const currentLesson = lessons.find((l) => l.id === currentLessonId);
  const currentProgress = progress.find((p) => p.lesson_id === currentLessonId);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !currentLessonId) return;
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
    }, 5000);
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v || !currentProgress?.position_seconds) return;
    if (currentProgress.position_seconds > 5) {
      v.currentTime = currentProgress.position_seconds;
    }
  }

  function lessonStatus(lessonId: string) {
    return progress.find((p) => p.lesson_id === lessonId)?.status || 'not_started';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-sans text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{product?.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/10 relative">
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
              </div>
            )}
            {videoUrl && (
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                controls
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
            )}
          </div>
          {currentLesson && (
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-2">{currentLesson.title}</h2>
              {currentLesson.description && (
                <div 
                  className="font-sans text-on-surface-variant leading-relaxed prose prose-invert max-w-none [&_a]:text-primary [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 text-sm"
                  dangerouslySetInnerHTML={{ __html: currentLesson.description.includes('<') ? currentLesson.description : currentLesson.description.replace(/\n/g, '<br/>') }}
                />
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          <h3 className="font-display text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Aulas
          </h3>
          {lessons.map((lesson) => {
            const status = lessonStatus(lesson.id);
            const isActive = lesson.id === currentLessonId;
            return (
              <button
                key={lesson.id}
                onClick={() => setCurrentLessonId(lesson.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : status === 'in_progress' ? (
                    <Play className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-white truncate">{lesson.title}</p>
                    {lesson.video_duration_seconds ? (
                      <p className="text-xs text-on-surface-variant">
                        {Math.floor(lesson.video_duration_seconds / 60)} min
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
