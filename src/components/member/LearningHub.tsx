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
      setContinueItem(cont);
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
    <div className="space-y-6">
      {continueItem && (
        <div className="glass-panel rounded-2xl p-6 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <p className="font-display text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            {t('memberDashboard.continueWhere')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {continueItem.cover_url && (
              <img
                src={continueItem.cover_url}
                alt=""
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-white mb-2 truncate">
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
                className="primary-btn px-5 py-2.5 rounded-full font-display text-xs font-semibold tracking-widest uppercase inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {t('memberDashboard.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-white mb-4">{t('memberDashboard.inProgress')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.product_type === 'ebook'
                    ? onOpenEbook(item.id)
                    : onOpenCourse(item.id, item.lastProgress?.lesson_id)
                }
                className="glass-panel rounded-xl p-4 border border-white/10 text-left hover:border-primary/30 transition-all flex gap-3"
              >
                <img src={item.cover_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm text-white truncate">{item.title}</p>
                  <div className="h-1 rounded-full bg-white/10 mt-2">
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
        className="w-full glass-panel rounded-xl p-4 border border-white/10 flex items-center justify-between text-left hover:border-primary/30 transition-all group"
      >
        <span className="font-display text-sm font-semibold text-white">{t('memberDashboard.viewFullLibrary')}</span>
        <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
