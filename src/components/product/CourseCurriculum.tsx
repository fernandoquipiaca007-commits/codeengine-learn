import { useState, useEffect } from 'react';
import { Lock, Play, Clock, Headphones, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProductPurchaseOptional } from '../../contexts/ProductPurchaseContext';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  display_order: number;
  module_id?: string | null;
  is_preview: boolean;
  video_duration_seconds?: number;
  lesson_type?: 'video' | 'audio' | 'link';
  external_url?: string;
}

interface Module {
  id: string;
  title: string;
  display_order: number;
}

interface CourseCurriculumProps {
  productId: string;
  onPreviewLesson?: (lessonId: string) => void;
}

export function CourseCurriculum({ productId, onPreviewLesson }: CourseCurriculumProps) {
  const { t } = useTranslation('pages');
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const purchase = useProductPurchaseOptional();
  const ownsProduct = purchase?.ownsProduct ?? false;

  useEffect(() => {
    void load();
  }, [productId]);

  async function load() {
    try {
      const [mRes, lRes] = await Promise.all([
        supabase.from('course_modules').select('*').eq('product_id', productId).order('display_order'),
        supabase
          .from('course_lessons')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('display_order'),
      ]);
      if (mRes.error) console.error('Error loading modules:', mRes.error);
      if (lRes.error) console.error('Error loading lessons:', lRes.error);
      setModules(mRes.data || []);
      setLessons(lRes.data || []);
    } catch (err) {
      console.error('Error loading curriculum:', err);
      setModules([]);
      setLessons([]);
    }
  }

  const totalSeconds = lessons.reduce((s, l) => s + (l.video_duration_seconds || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  function renderLesson(lesson: Lesson) {
    const canWatch = ownsProduct || lesson.is_preview;
    return (
      <div
        key={lesson.id}
        className={`flex items-center gap-4 p-4 rounded-lg border ${
          canWatch ? 'border-white/10 hover:border-primary/30' : 'border-white/5 opacity-60'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${canWatch ? 'bg-primary/20' : 'bg-surface-container'}`}
        >
          {!canWatch ? (
            <Lock className="w-4 h-4 text-on-surface-variant" />
          ) : lesson.lesson_type === 'audio' ? (
            <Headphones className="w-4 h-4 text-primary" />
          ) : lesson.lesson_type === 'link' ? (
            <LinkIcon className="w-4 h-4 text-primary" />
          ) : (
            <Play className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => canWatch && onPreviewLesson?.(lesson.id)}>
          <p className="font-display font-semibold text-white truncate">{lesson.title}</p>
          {lesson.description && (
            <p className="font-sans text-xs text-on-surface-variant line-clamp-1">{lesson.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {lesson.video_duration_seconds ? (
            <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(lesson.video_duration_seconds / 60)}min
            </span>
          ) : null}
          {!canWatch && <span className="block text-xs text-on-surface-variant mt-1">{t('product.afterPurchase')}</span>}
          {lesson.is_preview && !ownsProduct && (
            <span className="block text-xs text-primary mt-1">Preview</span>
          )}
        </div>
      </div>
    );
  }

  if (lessons.length === 0) return null;

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-white">{t('product.courseContent')}</h2>
        <span className="font-sans text-sm text-on-surface-variant">
          {lessons.length} {t('product.lessons')}
          {totalSeconds > 0 && ` · ${hours > 0 ? `${hours}h ` : ''}${mins}min`}
        </span>
      </div>

      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod.id}>
            <h3 className="font-display text-lg font-semibold text-primary mb-3">{mod.title}</h3>
            <div className="space-y-2">{lessons.filter((l) => l.module_id === mod.id).map(renderLesson)}</div>
          </div>
        ))}
        {lessons.filter((l) => !l.module_id).length > 0 && (
          <div className="space-y-2">
            {modules.length > 0 && (
              <h3 className="font-display text-lg font-semibold text-on-surface-variant mb-3">{t('product.lessonsTitle')}</h3>
            )}
            {lessons.filter((l) => !l.module_id).map(renderLesson)}
          </div>
        )}
      </div>
    </section>
  );
}
