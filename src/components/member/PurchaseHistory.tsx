import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ShoppingBag, Calendar, DollarSign, CheckCircle, Clock, XCircle, Download, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getProductCoverUrl } from '../../lib/storage-path';

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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    loadPurchases();
  }, [memberId]);

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
            category_id
          )
        `)
        .eq('member_id', memberId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
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

  function formatPrice(amount: number, isFree?: boolean) {
    if (isFree || amount === 0) return t('purchases.status.free');
    return `$ ${amount.toFixed(2)}`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            {t('purchases.title')}
          </h2>
          <p className="font-sans text-base text-on-surface-variant">
            {t('purchases.count', { count: filteredPurchases.length })}
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
              {status === 'all' ? t('purchases.filters.all') : getStatusLabel(status)}
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
            {t('purchases.empty.title')}
          </h3>
          <p className="font-sans text-base text-on-surface-variant">
            {filter === 'all'
              ? t('purchases.empty.all')
              : t('purchases.empty.filtered', { status: getStatusLabel(filter) })}
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
                        {getStatusLabel(effectiveStatus)}
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
                    {t('purchases.actions.download')}
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
