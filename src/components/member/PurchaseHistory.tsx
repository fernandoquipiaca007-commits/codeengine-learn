import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ShoppingBag, Calendar, DollarSign, CheckCircle, Clock, XCircle, Download, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProductCoverUrl } from '../../lib/storage-path';
import { useLocale } from '../../contexts/LocaleContext';

interface Purchase {
  id: string;
  product_id: string;
  amount_paid: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  access_type: string | null;
  purchase_date: string;
  products: {
    id: string;
    title: string;
    cover_url: string;
    cover_storage_path: string | null;
    is_free: boolean;
    category_id: string;
    language?: string | null;
    use_shared_content?: boolean | null;
    updated_at?: string | null;
  };
}

interface PurchaseHistoryProps {
  memberId: string;
  onDownload: (productId: string) => void;
}

/**
 * Determines the effective display status for a purchase.
 * If the purchase has access_type 'free' or 'paid', it means the user
 * has been granted access, so we show "Concluído" regardless of the
 * raw payment_status (which may be 'pending' due to a database trigger issue).
 */
function getEffectiveStatus(purchase: Purchase): 'completed' | 'pending' | 'failed' | 'refunded' {
  if (purchase.payment_status === 'failed' || purchase.payment_status === 'refunded') {
    return purchase.payment_status;
  }
  // If user has access (free or paid), treat as completed
  if (purchase.access_type === 'free' || purchase.access_type === 'paid') {
    return 'completed';
  }
  return purchase.payment_status;
}

export function PurchaseHistory({ memberId, onDownload }: PurchaseHistoryProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    loadPurchases();
  }, [memberId, locale]);

  async function loadPurchases() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          products (
            id,
            title,
            cover_url,
            cover_storage_path,
            is_free,
            category_id,
            use_shared_content,
            updated_at
          )
        `)
        .eq('member_id', memberId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      const items = data || [];
      const productIds = items
        .map((purchase: any) => {
          const prod = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
          return prod?.id;
        })
        .filter(Boolean);

      let translations: any[] = [];
      if (productIds.length > 0) {
        const { data: trs } = await supabase
          .from('products_translations')
          .select('*')
          .in('product_id', productIds)
          .in('language', [locale, 'pt']);
        translations = trs ?? [];
      }

      const mappedPurchases = items.map((purchase: any) => {
        const product = Array.isArray(purchase.products) ? purchase.products[0] : purchase.products;
        if (!product) return purchase;

        const tr = translations.find((t) => t.product_id === product.id && t.language === locale);
        const fb = translations.find((t) => t.product_id === product.id && t.language === 'pt');
        const useShared = Boolean(product.use_shared_content);

        const title = useShared ? product.title : (tr?.title || fb?.title || product.title);
        const cover_url = useShared ? product.cover_url : (tr?.cover_url || fb?.cover_url || product.cover_url);
        const cover_storage_path = useShared ? product.cover_storage_path : (tr?.cover_url || fb?.cover_url || product.cover_storage_path);

        return {
          ...purchase,
          products: {
            ...product,
            title,
            cover_url,
            cover_storage_path,
            language: useShared ? 'pt' : locale,
            use_shared_content: useShared,
            updated_at: product.updated_at
          }
        };
      });

      setPurchases(mappedPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === 'all') return true;
    return getEffectiveStatus(purchase) === filter;
  });

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'refunded':
        return <XCircle className="w-5 h-5 text-orange-400" />;
      default:
        return <Clock className="w-5 h-5 text-on-surface-variant" />;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return t('purchases.status.completed');
      case 'pending':
        return t('purchases.status.pending');
      case 'failed':
        return t('purchases.status.failed');
      case 'refunded':
        return t('purchases.status.refunded');
      default:
        return status;
    }
  }

  // Fallback labels in case i18next translations are not complete
  function getStatusLabelFallback(status: string) {
    const label = getStatusLabel(status);
    if (label && label !== `purchases.status.${status}`) return label;
    const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
    const dict = {
      pt: { completed: 'Concluído', pending: 'Pendente', failed: 'Falhou', refunded: 'Reembolsado' },
      en: { completed: 'Completed', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' },
      fr: { completed: 'Terminé', pending: 'En attente', failed: 'Échoué', refunded: 'Remboursé' }
    }[activeLang] || { completed: 'Concluído', pending: 'Pendente', failed: 'Falhou', refunded: 'Reembolsado' };
    return (dict as any)[status] || status;
  }

  function formatPrice(amount: number, isFree?: boolean) {
    const baseLabel = t('purchases.status.free');
    const freeLabel = (baseLabel && baseLabel !== 'purchases.status.free')
      ? baseLabel
      : (locale === 'fr' ? 'Gratuit' : locale === 'pt' ? 'Grátis' : 'Free');
    if (isFree || amount === 0) return freeLabel;
    return `$ ${amount}`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
    const dateLoc = activeLang === 'pt' ? 'pt-BR' : activeLang === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(dateLoc, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallbacks for layout labels
  const activeLang = ((locale || 'pt').slice(0, 2) as 'pt' | 'en' | 'fr') || 'pt';
  const labelDict = {
    pt: {
      title: 'Histórico de Compras',
      count: (count: number) => `${count} ${count === 1 ? 'transação' : 'transações'} no total`,
      filterAll: 'Todas',
      emptyTitle: 'Nenhuma compra encontrada',
      emptyAll: 'Você ainda não realizou nenhuma compra no site.',
      emptyFiltered: (status: string) => `Nenhuma compra com o status "${status}" encontrada.`,
      downloadAction: 'Baixar'
    },
    en: {
      title: 'Purchase History',
      count: (count: number) => `${count} ${count === 1 ? 'transaction' : 'transactions'} total`,
      filterAll: 'All',
      emptyTitle: 'No purchases found',
      emptyAll: 'You have not made any purchases on the site yet.',
      emptyFiltered: (status: string) => `No purchases with status "${status}" found.`,
      downloadAction: 'Download'
    },
    fr: {
      title: 'Historique des Achats',
      count: (count: number) => `${count} ${count === 1 ? 'transaction' : 'transactions'} au total`,
      filterAll: 'Toutes',
      emptyTitle: 'Aucun achat trouvé',
      emptyAll: 'Vous n\'avez encore effectué aucun achat sur le site.',
      emptyFiltered: (status: string) => `Aucun achat avec le statut "${status}" trouvé.`,
      downloadAction: 'Télécharger'
    }
  }[activeLang] || {
    title: 'Histórico de Compras',
    count: (count: number) => `${count} ${count === 1 ? 'transação' : 'transações'} no total`,
    filterAll: 'Todas',
    emptyTitle: 'Nenhuma compra encontrada',
    emptyAll: 'Você ainda não realizou nenhuma compra no site.',
    emptyFiltered: (status: string) => `Nenhuma compra com o status "${status}" encontrada.`,
    downloadAction: 'Baixar'
  };

  const pageTitle = (t('purchases.title') && t('purchases.title') !== 'purchases.title') ? t('purchases.title') : labelDict.title;
  const purchasesCountText = (t('purchases.count', { count: filteredPurchases.length }) && t('purchases.count') !== 'purchases.count')
    ? t('purchases.count', { count: filteredPurchases.length })
    : labelDict.count(filteredPurchases.length);
  const filterAllText = (t('purchases.filters.all') && t('purchases.filters.all') !== 'purchases.filters.all') ? t('purchases.filters.all') : labelDict.filterAll;
  const emptyTitleText = (t('purchases.empty.title') && t('purchases.empty.title') !== 'purchases.empty.title') ? t('purchases.empty.title') : labelDict.emptyTitle;
  const emptyAllText = (t('purchases.empty.all') && t('purchases.empty.all') !== 'purchases.empty.all') ? t('purchases.empty.all') : labelDict.emptyAll;
  const emptyFilteredText = (t('purchases.empty.filtered') && t('purchases.empty.filtered') !== 'purchases.empty.filtered')
    ? t('purchases.empty.filtered', { status: getStatusLabelFallback(filter) })
    : labelDict.emptyFiltered(getStatusLabelFallback(filter));
  const downloadActionText = (t('purchases.actions.download') && t('purchases.actions.download') !== 'purchases.actions.download') ? t('purchases.actions.download') : labelDict.downloadAction;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            {pageTitle}
          </h2>
          <p className="font-sans text-base text-on-surface-variant">
            {purchasesCountText}
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {['all', 'completed', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-display text-xs font-semibold tracking-widest uppercase transition-all ${
                filter === status
                  ? 'bg-primary text-on-primary'
                  : 'glass-panel border border-white/10 text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {status === 'all' ? filterAllText : getStatusLabelFallback(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div
          className="glass-panel rounded-2xl p-12 text-center border border-white/10"
        >
          <ShoppingBag className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            {emptyTitleText}
          </h3>
          <p className="font-sans text-base text-on-surface-variant">
            {filter === 'all' ? emptyAllText : emptyFilteredText}
          </p>
        </div>
      ) : (
      <div className="space-y-4">
          {filteredPurchases.map((purchase, index) => {
            const effectiveStatus = getEffectiveStatus(purchase);
            const isFree = purchase.products?.is_free || purchase.amount_paid === 0;
            const hasAccess = effectiveStatus === 'completed';

            return (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-xl p-4 sm:p-6 border border-white/10 hover:border-primary/30 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* Product Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-highest flex-shrink-0">
                  <img
                    src={getProductCoverUrl(purchase.products)}
                    alt={purchase.products?.title || 'Produto'}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/96x96/1a1a2e/c0c1ff?text=${encodeURIComponent((purchase.products?.title || 'P').charAt(0))}`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors text-safe-wrap">
                    {purchase.products?.title || 'Produto'}
                  </h3>

                  <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-sans">{formatDate(purchase.purchase_date)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isFree ? (
                        <Gift className="w-4 h-4 text-green-400" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      <span className={`font-mono font-semibold ${isFree ? 'text-green-400' : ''}`}>
                        {formatPrice(purchase.amount_paid, isFree)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(effectiveStatus)}
                      <span className="font-display text-xs font-semibold tracking-widest uppercase">
                        {getStatusLabelFallback(effectiveStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - Show download for any purchase with access */}
                {hasAccess && (
                  <button
                    onClick={() => onDownload(purchase.product_id)}
                    className="secondary-btn w-full sm:w-auto px-5 py-3 rounded-lg font-display text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all touch-target"
                  >
                    <Download className="w-4 h-4" />
                    {downloadActionText}
                  </button>
                )}
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
