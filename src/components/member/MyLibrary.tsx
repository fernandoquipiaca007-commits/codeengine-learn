import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Download, GraduationCap } from 'lucide-react';
import { getMemberLibrary, LibraryItem } from '../../lib/learning-api';
import { getProductCoverUrl } from '../../lib/storage-path';

interface MyLibraryProps {
  onOpenCourse: (productId: string, lessonId?: string) => void;
  onOpenEbook: (productId: string) => void;
  onDownload: (productId: string) => void;
}

export function MyLibrary({ onOpenCourse, onOpenEbook, onDownload }: MyLibraryProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'course' | 'ebook' | 'file'>('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const library = await getMemberLibrary();
      setItems(library);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.product_type === filter);

  function typeLabel(type: LibraryItem['product_type']) {
    if (type === 'course') return t('library.filters.course');
    if (type === 'ebook') return t('library.filters.ebook');
    return t('library.filters.file');
  }

  function handleOpen(item: LibraryItem) {
    if (item.product_type === 'course') {
      onOpenCourse(item.id, item.lastProgress?.lesson_id);
    } else if (item.product_type === 'ebook') {
      onOpenEbook(item.id);
    } else {
      onDownload(item.id);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
        <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="font-display text-lg font-semibold text-white mb-2">{t('library.empty.title')}</p>
        <p className="font-sans text-sm text-on-surface-variant">
          {t('library.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['all', 'course', 'ebook', 'file'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-display font-semibold tracking-widest uppercase transition-all ${
              filter === f
                ? 'bg-primary text-on-primary'
                : 'glass-panel border border-white/10 text-on-surface-variant hover:text-white'
            }`}
          >
            {f === 'all' ? t('library.filters.all') : typeLabel(f as LibraryItem['product_type'])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="group glass-panel rounded-xl border border-white/10 overflow-hidden flex gap-4 p-4 hover:border-primary/30 hover:-translate-y-0.5 transition-all"
          >
            <img
              src={getProductCoverUrl(item)}
              alt=""
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-surface-highest"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/80x80/1a1a2e/c0c1ff?text=${encodeURIComponent((item.title || 'P').charAt(0))}`;
              }}
            />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-display font-semibold tracking-widest uppercase text-primary">
                  {typeLabel(item.product_type)}
                </span>
                {item.is_free && (
                  <span className="text-[10px] font-display font-semibold tracking-widest uppercase text-green-400">
                    {t('library.status.free')}
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-white line-clamp-2 mb-2 min-h-[2.5rem]">
                {item.title}
              </h3>
              {item.product_type !== 'file' && (
                <div className="h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, item.percentComplete || 0)}%` }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleOpen(item)}
                className="mt-auto inline-flex items-center gap-2 text-sm font-display font-semibold text-primary group-hover:text-secondary"
              >
                {item.product_type === 'course' && (
                  <>
                    <Play className="w-4 h-4" />
                    {item.percentComplete > 0 ? t('library.actions.continue') : t('library.actions.start')}
                  </>
                )}
                {item.product_type === 'ebook' && (
                  <>
                    <BookOpen className="w-4 h-4" />
                    {item.percentComplete > 0 ? t('library.actions.continueReading') : t('library.actions.read')}
                  </>
                )}
                {item.product_type === 'file' && (
                  <>
                    <Download className="w-4 h-4" />
                    {t('library.actions.download')}
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
