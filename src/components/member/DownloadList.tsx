import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Clock, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { downloadProduct } from '../../lib/download-file';
import { useLocale } from '../../contexts/LocaleContext';
import { useTranslation } from 'react-i18next';
import { getProductCoverUrl } from '../../lib/storage-path';

interface ProductDownload {
  id: string;
  title: string;
  cover_url: string;
  cover_storage_path: string | null;
  storage_url: string;
  file_storage_path: string | null;
  purchase_date: string;
  last_download?: string;
  download_count: number;
  language?: string | null;
  use_shared_content?: boolean;
  updated_at?: string;
  bonuses?: any[];
}

interface DownloadListProps {
  memberId: string;
}

const LOCALIZED_TEXTS = {
  pt: {
    headerTitle: 'Meus Downloads',
    headerSubtitle: (count: number) => `${count} ${count === 1 ? 'produto disponível' : 'produtos disponíveis'} para download`,
    lifetimeAccess: 'Acesso vitalício:',
    lifetimeDesc: 'Você pode baixar seus produtos quantas vezes quiser, sem limite de tempo.',
    emptyTitle: 'Nenhum produto disponível',
    emptyDesc: 'Você ainda não comprou nenhum produto. Explore nossa biblioteca!',
    purchasedAt: 'Comprado em:',
    downloads: 'Downloads:',
    lastDownload: 'Último download:',
    downloading: 'Baixando...',
    downloadButton: 'Baixar Produto',
    lessThanHour: 'Há menos de 1 hora',
    hoursAgo: (h: number) => `Há ${h} ${h === 1 ? 'hora' : 'horas'}`,
    daysAgo: (d: number) => `Há ${d} ${d === 1 ? 'dia' : 'dias'}`
  },
  en: {
    headerTitle: 'My Downloads',
    headerSubtitle: (count: number) => `${count} ${count === 1 ? 'product available' : 'products available'} for download`,
    lifetimeAccess: 'Lifetime access:',
    lifetimeDesc: 'You can download your products as many times as you want, with no time limit.',
    emptyTitle: 'No products available',
    emptyDesc: 'You have not purchased any products yet. Explore our library!',
    purchasedAt: 'Purchased on:',
    downloads: 'Downloads:',
    lastDownload: 'Last download:',
    downloading: 'Downloading...',
    downloadButton: 'Download Product',
    lessThanHour: 'Less than an hour ago',
    hoursAgo: (h: number) => `${h} ${h === 1 ? 'hour' : 'hours'} ago`,
    daysAgo: (d: number) => `${d} ${d === 1 ? 'day' : 'days'} ago`
  },
  fr: {
    headerTitle: 'Mes Téléchargements',
    headerSubtitle: (count: number) => `${count} ${count === 1 ? 'produit disponible' : 'produits disponibles'} au téléchargement`,
    lifetimeAccess: 'Accès à vie :',
    lifetimeDesc: 'Vous pouvez télécharger vos produits autant de fois que vous le souhaitez, sans limite de temps.',
    emptyTitle: 'Aucun produit disponible',
    emptyDesc: 'Vous n\'avez encore acheté aucun produit. Explorez notre bibliothèque !',
    purchasedAt: 'Acheté le :',
    downloads: 'Téléchargements :',
    lastDownload: 'Dernier téléchargement :',
    downloading: 'Téléchargement...',
    downloadButton: 'Télécharger le produit',
    lessThanHour: 'Il y a moins d\'une heure',
    hoursAgo: (h: number) => `Il y a ${h} ${h === 1 ? 'heure' : 'heures'}`,
    daysAgo: (d: number) => `Il y a ${d} ${d === 1 ? 'jour' : 'jours'}`
  }
};

export function DownloadList({ memberId }: DownloadListProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('member');
  const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const texts = LOCALIZED_TEXTS[activeLang] || LOCALIZED_TEXTS.pt;

  const [products, setProducts] = useState<ProductDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingBonusId, setDownloadingBonusId] = useState<string | null>(null);

  async function handleBonusDownload(bonusId: string) {
    setDownloadingBonusId(bonusId);
    try {
      const { downloadBonus } = await import('../../lib/download-file');
      await downloadBonus(bonusId);
    } catch (error) {
      console.error('Error downloading bonus:', error);
      alert(error instanceof Error ? error.message : 'Bonus download failed');
    } finally {
      setDownloadingBonusId(null);
    }
  }

  useEffect(() => {
    loadPurchasedProducts();
  }, [memberId, locale]);

  async function loadPurchasedProducts() {
    setLoading(true);
    try {
      // Get all completed purchases with product details
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          purchase_date,
          product_id,
          selected_bonus_ids,
          products (
            id,
            title,
            cover_url,
            cover_storage_path,
            storage_url,
            file_storage_path,
            use_shared_content,
            updated_at
          )
        `)
        .eq('member_id', memberId)
        .in('payment_status', ['completed', 'pending'])
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;

      const filteredPurchases = (purchases || []).filter((purchase: any) => {
        const prod = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
        return prod?.id;
      });

      const productIds = filteredPurchases.map((purchase: any) => {
        const prod = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
        return prod.id;
      });

      let translations: any[] = [];
      if (productIds.length > 0) {
        const { data: trs } = await supabase
          .from('products_translations')
          .select('*')
          .in('product_id', productIds)
          .in('language', [locale, 'pt']);
        translations = trs ?? [];
      }

      // Get download stats for each product
      const productsWithStats = await Promise.all(
        filteredPurchases.map(async (purchase: any) => {
          const product = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
          const { data: downloads } = await supabase
            .from('downloads')
            .select('download_timestamp')
            .eq('member_id', memberId)
            .eq('product_id', product.id)
            .order('download_timestamp', { ascending: false });

          const tr = translations.find((tr) => tr.product_id === product.id && tr.language === locale);
          const fb = translations.find((tr) => tr.product_id === product.id && tr.language === 'pt');
          const useShared = Boolean(product.use_shared_content);

          const title = useShared ? product.title : (tr?.title || fb?.title || product.title);
          const cover_url = useShared ? product.cover_url : (tr?.cover_url || fb?.cover_url || product.cover_url);
          const cover_storage_path = useShared ? product.cover_storage_path : (tr?.cover_url || fb?.cover_url || product.cover_storage_path);
          const storage_url = useShared ? product.storage_url : (tr?.storage_url || fb?.storage_url || product.storage_url);
          const file_storage_path = useShared ? product.file_storage_path : (tr?.storage_url || fb?.storage_url || product.file_storage_path);

          // Fetch bonuses for this product
          const { data: dbBonuses } = await supabase
            .from('product_bonuses')
            .select('id, title, description, is_optional, file_url, file_storage_path')
            .eq('product_id', product.id)
            .eq('is_active', true);

          const selectedIds = purchase.selected_bonus_ids || [];
          const accessibleBonuses = (dbBonuses || []).filter((b: any) => {
            const hasFile = !!(b.file_url || b.file_storage_path);
            if (!hasFile) return false;
            if (!b.is_optional) return true;
            return selectedIds.includes(b.id);
          });

          return {
            id: product.id,
            title,
            cover_url,
            cover_storage_path,
            storage_url,
            file_storage_path,
            purchase_date: purchase.purchase_date,
            last_download: downloads?.[0]?.download_timestamp,
            download_count: downloads?.length || 0,
            language: useShared ? 'pt' : locale,
            use_shared_content: useShared,
            updated_at: product.updated_at,
            bonuses: accessibleBonuses,
          };
        })
      );

      setProducts(productsWithStats);
    } catch (error) {
      console.error('Error loading purchased products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(productId: string) {
    setDownloadingId(productId);
    try {
      await downloadProduct(productId, locale);
      await loadPurchasedProducts();
    } catch (error) {
      console.error('Error downloading product:', error);
      alert(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const dateLoc = activeLang === 'pt' ? 'pt-BR' : activeLang === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(dateLoc, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function getTimeSinceDownload(dateString?: string) {
    if (!dateString) return null;

    const now = new Date();
    const downloadDate = new Date(dateString);
    const diffMs = now.getTime() - downloadDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return texts.lessThanHour;
    if (diffHours < 24) return texts.hoursAgo(diffHours);
    
    const diffDays = Math.floor(diffHours / 24);
    return texts.daysAgo(diffDays);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          {texts.headerTitle}
        </h2>
        <p className="font-sans text-base text-on-surface-variant">
          {texts.headerSubtitle(products.length)}
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4 border border-primary/30 bg-primary/5"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm text-on-surface">
              <span className="font-semibold">{texts.lifetimeAccess}</span> {texts.lifetimeDesc}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Products List */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-12 text-center border border-white/10"
        >
          <Download className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            {texts.emptyTitle}
          </h3>
          <p className="font-sans text-base text-on-surface-variant">
            {texts.emptyDesc}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-all group"
            >
              {/* Product Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-surface-highest mb-4 relative">
                <img
                  src={getProductCoverUrl(product)}
                  alt={product.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/400x225?text=Produto';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
              </div>

              {/* Info */}
              <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                {product.title}
              </h3>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-sans text-on-surface-variant">{texts.purchasedAt}</span>
                  <span className="font-mono text-on-surface">{formatDate(product.purchase_date)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-sans text-on-surface-variant">{texts.downloads}</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-mono text-on-surface">{product.download_count}x</span>
                  </div>
                </div>

                {product.last_download && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-sans text-on-surface-variant">{texts.lastDownload}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-on-surface-variant" />
                      <span className="font-sans text-on-surface-variant text-xs">
                        {getTimeSinceDownload(product.last_download)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(product.id)}
                disabled={downloadingId === product.id}
                className="w-full bg-primary text-on-primary font-display text-sm font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,193,255,0.3)] hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {downloadingId === product.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {texts.downloading}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    {texts.downloadButton}
                  </>
                )}
              </button>

              {/* Bonuses Downloads */}
              {product.bonuses && product.bonuses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-left">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    {activeLang === 'pt' ? 'Bônus Inclusos e Adquiridos' : 'Included & Purchased Bonuses'}
                  </h4>
                  <div className="space-y-1.5">
                    {product.bonuses.map((bonus: any) => (
                      <button
                        key={bonus.id}
                        type="button"
                        onClick={() => handleBonusDownload(bonus.id)}
                        disabled={downloadingBonusId === bonus.id}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/90 hover:text-white transition group/bonus disabled:opacity-50"
                      >
                        <span className="font-semibold truncate max-w-[70%]">{bonus.title}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-primary group-hover/bonus:text-secondary font-medium shrink-0">
                          {downloadingBonusId === bonus.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{texts.downloading || 'A baixar...'}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>{activeLang === 'pt' ? 'Baixar' : 'Download'}</span>
                            </>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
