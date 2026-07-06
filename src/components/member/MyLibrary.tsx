import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Download, GraduationCap } from 'lucide-react';
import { getMemberLibrary, LibraryItem } from '../../lib/learning-api';
import { getProductCoverUrl } from '../../lib/storage-path';
import { useLocale } from '../../contexts/LocaleContext';
import { supabase } from '../../lib/supabase';

interface MyLibraryProps {
  onOpenCourse: (productId: string, lessonId?: string) => void;
  onOpenEbook: (productId: string) => void;
  onDownload: (productId: string) => void;
}

export function MyLibrary({ onOpenCourse, onOpenEbook, onDownload }: MyLibraryProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'course' | 'ebook' | 'file'>('all');

  useEffect(() => {
    load();
  }, [locale]);

  async function load() {
    setLoading(true);
    try {
      const library = await getMemberLibrary();

      const productIds = library.map((item) => item.id).filter(Boolean);
      let translations: any[] = [];
      if (productIds.length > 0) {
        const { data: trs } = await supabase
          .from('products_translations')
          .select('*')
          .in('product_id', productIds)
          .in('language', [locale, 'pt']);
        translations = trs ?? [];
      }

      const localizedItems = library.map((item) => {
        const tr = translations.find((t) => t.product_id === item.id && t.language === locale);
        const fb = translations.find((t) => t.product_id === item.id && t.language === 'pt');
        const useShared = Boolean((item as any).use_shared_content);

        const title = useShared ? item.title : (tr?.title || fb?.title || item.title);
        const cover_url = useShared ? item.cover_url : (tr?.cover_url || fb?.cover_url || item.cover_url);
        const cover_storage_path = useShared ? item.cover_storage_path : (tr?.cover_url || fb?.cover_url || item.cover_storage_path);

        return {
          ...item,
          title,
          cover_url,
          cover_storage_path,
          language: useShared ? 'pt' : locale,
          use_shared_content: useShared,
        } as LibraryItem;
      });

      setItems(localizedItems);
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(['all', 'course', 'ebook', 'file'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[9px] font-display font-semibold tracking-widest uppercase transition-all ${
              filter === f
                ? 'bg-primary text-on-primary'
                : 'glass-panel border border-white/10 text-on-surface-variant hover:text-white'
            }`}
          >
            {f === 'all' ? t('library.filters.all') : typeLabel(f as LibraryItem['product_type'])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="group glass-panel rounded-lg border border-white/10 overflow-hidden flex gap-2 p-2 hover:border-primary/30 transition-all"
          >
            <img
              src={getProductCoverUrl(item)}
              alt=""
              className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-surface-highest"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/60x60/1a1a2e/c0c1ff?text=${encodeURIComponent(Array.from(item.title || 'P')[0])}`;
              }}
            />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-display font-semibold tracking-widest uppercase text-primary">
                  {typeLabel(item.product_type)}
                </span>
                {item.is_free && (
                  <span className="text-[9px] font-display font-semibold tracking-widest uppercase text-green-400">
                    {t('library.status.free')}
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-xs text-white truncate mb-0.5">
                {item.title}
              </h3>
              {item.product_type !== 'file' && (
                <div className="h-1 rounded-full bg-white/10 mb-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, item.percentComplete || 0)}%` }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleOpen(item)}
                className="mt-auto inline-flex items-center gap-1 text-[10px] font-display font-semibold text-primary group-hover:text-secondary"
              >
                {item.product_type === 'course' && (
                  <>
                    <Play className="w-3 h-3" />
                    {item.percentComplete > 0 ? t('library.actions.continue') : t('library.actions.start')}
                  </>
                )}
                {item.product_type === 'ebook' && (
                  <>
                    <BookOpen className="w-3 h-3" />
                    {item.percentComplete > 0 ? t('library.actions.continueReading') : t('library.actions.read')}
                  </>
                )}
                {item.product_type === 'file' && (
                  <>
                    <Download className="w-3 h-3" />
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
