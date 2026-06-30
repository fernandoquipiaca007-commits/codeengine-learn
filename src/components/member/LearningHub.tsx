import { useState, useEffect } from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { getContinueWatching, getMemberLibrary, LibraryItem } from '../../lib/learning-api';
import { useTranslation } from 'react-i18next';

interface LearningHubProps {
  onOpenCourse: (productId: string, lessonId?: string) => void;
  onOpenEbook: (productId: string) => void;
  onGoToLibrary: () => void;
}

export function LearningHub({ onOpenCourse, onOpenEbook, onGoToLibrary }: LearningHubProps) {
  const { t } = useTranslation('pages');
  const [continueItem, setContinueItem] = useState<{
    product_id: string;
    product_title: string;
    cover_url?: string;
    lesson_id?: string;
    progress_type: string;
    product_type?: string;
  } | null>(null);
  const [recent, setRecent] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [cont, library] = await Promise.all([
        getContinueWatching(),
        getMemberLibrary().catch(() => [] as LibraryItem[]),
      ]);
      if (cont) {
        const prod = (cont as any).products;
        setContinueItem({
          product_id: cont.product_id,
          product_title: prod?.title || (cont as any).product_title || '',
          cover_url: prod?.cover_url || (cont as any).cover_url,
          lesson_id: cont.lesson_id,
          progress_type: cont.progress_type,
          product_type: prod?.product_type || (cont as any).product_type,
        });
      } else {
        setContinueItem(null);
      }
      const inProgress = library
        .filter((i) => i.status === 'in_progress' && i.percentComplete > 0 && i.percentComplete < 100)
        .slice(0, 4);
      setRecent(inProgress);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {continueItem && (
        <div className="glass-panel rounded-xl p-2.5 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
          <p className="font-display text-[9px] font-semibold tracking-widest uppercase text-primary mb-1">
            {t('memberDashboard.continueWhere')}
          </p>
          <div className="flex flex-row gap-2.5 items-center">
            {continueItem.cover_url && (
              <img
                src={continueItem.cover_url}
                alt=""
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xs font-bold text-white mb-1 truncate">
                {continueItem.product_title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (continueItem.progress_type === 'ebook' || continueItem.product_type === 'ebook') {
                    onOpenEbook(continueItem.product_id);
                  } else {
                    onOpenCourse(continueItem.product_id, continueItem.lesson_id);
                  }
                }}
                className="primary-btn px-2.5 py-1 rounded font-display text-[9px] font-semibold tracking-widest uppercase inline-flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                {t('memberDashboard.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h2 className="font-display text-[11px] font-bold text-white mb-1.5">{t('memberDashboard.inProgress')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.product_type === 'ebook'
                    ? onOpenEbook(item.id)
                    : onOpenCourse(item.id, item.lastProgress?.lesson_id)
                }
                className="glass-panel rounded-lg p-1.5 border border-white/10 text-left hover:border-primary/30 transition-all flex gap-2 items-center"
              >
                <img src={item.cover_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[10px] text-white truncate">{item.title}</p>
                  <div className="h-0.5 rounded-full bg-white/10 mt-1">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentComplete}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onGoToLibrary}
        className="w-full glass-panel rounded-lg p-1.5 border border-white/10 flex items-center justify-between text-left hover:border-primary/30 transition-all group"
      >
        <span className="font-display text-[10px] font-semibold text-white">{t('memberDashboard.viewFullLibrary')}</span>
        <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
