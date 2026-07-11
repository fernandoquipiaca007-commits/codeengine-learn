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
  escrow_status?: 'none' | 'held' | 'requested' | 'released' | 'disputed';
  escrow_requested_at?: string | null;
  escrow_dispute_reason?: string | null;
  escrow_resolved_at?: string | null;
  products: {
    id: string;
    title: string;
    cover_url: string;
    cover_storage_path: string | null;
    is_free: boolean;
    category_id: string;
    product_type?: string;
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

  const [showDisputeModal, setShowDisputeModal] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingEscrow, setSubmittingEscrow] = useState<string | null>(null);

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
            product_type,
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

  async function handleRelease(purchaseId: string) {
    if (!window.confirm('Tem certeza de que deseja confirmar a conclusão e liberar o pagamento para o criador? Esta ação é irreversível.')) {
      return;
    }
    setSubmittingEscrow(purchaseId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
      const response = await fetch(`${BACKEND_URL}/api/collaborators/escrow/${purchaseId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.error || 'Erro ao liberar pagamento.');
      } else {
        alert('Pagamento liberado com sucesso!');
        void loadPurchases();
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao liberar pagamento.');
    } finally {
      setSubmittingEscrow(null);
    }
  }

  async function handleDispute(purchaseId: string) {
    if (!disputeReason.trim()) {
      alert('Por favor, informe a justificativa da disputa.');
      return;
    }
    setSubmittingEscrow(purchaseId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
      const response = await fetch(`${BACKEND_URL}/api/collaborators/escrow/${purchaseId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: disputeReason }),
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.error || 'Erro ao abrir disputa.');
      } else {
        alert('Disputa aberta com sucesso. Nossa equipe analisará o caso.');
        setShowDisputeModal(null);
        setDisputeReason('');
        void loadPurchases();
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao abrir disputa.');
    } finally {
      setSubmittingEscrow(null);
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-sm sm:text-base font-bold text-white mb-0.5">
            {pageTitle}
          </h2>
          <p className="font-sans text-[10px] text-on-surface-variant">
            {purchasesCountText}
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-1">
          {['all', 'completed', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-2.5 py-1 rounded font-display text-[9px] font-semibold tracking-widest uppercase transition-all ${
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
          className="glass-panel rounded-xl p-6 text-center border border-white/10"
        >
          <ShoppingBag className="w-10 h-10 text-on-surface-variant mx-auto mb-2 opacity-50" />
          <h3 className="font-display text-sm font-bold text-white mb-1">
            {emptyTitleText}
          </h3>
          <p className="font-sans text-xs text-on-surface-variant">
            {filter === 'all' ? emptyAllText : emptyFilteredText}
          </p>
        </div>
      ) : (
      <div className="space-y-2">
          {filteredPurchases.map((purchase, index) => {
            const effectiveStatus = getEffectiveStatus(purchase);
            const isFree = purchase.products?.is_free || purchase.amount_paid === 0;
            const hasAccess = effectiveStatus === 'completed';

            return (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="glass-panel rounded-lg p-2.5 border border-white/10 hover:border-primary/30 transition-all group"
            >
              <div className="flex flex-row items-center gap-3">
                {/* Product Image */}
                <div className="w-9 h-9 rounded overflow-hidden bg-surface-highest flex-shrink-0">
                  <img
                    src={getProductCoverUrl(purchase.products)}
                    alt={purchase.products?.title || 'Produto'}
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/48x48/1a1a2e/c0c1ff?text=${encodeURIComponent(Array.from(purchase.products?.title || 'P')[0])}`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-display text-xs font-semibold text-white truncate group-hover:text-primary transition-colors text-safe-wrap">
                    {purchase.products?.title || 'Produto'}
                  </h3>

                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-sans">{formatDate(purchase.purchase_date)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {isFree ? (
                        <Gift className="w-3 h-3 text-green-400" />
                      ) : (
                        <DollarSign className="w-3 h-3" />
                      )}
                      <span className={`font-mono font-semibold ${isFree ? 'text-green-400' : ''}`}>
                        {formatPrice(purchase.amount_paid, isFree)}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(effectiveStatus)}
                      <span className="font-display text-[8px] font-semibold tracking-widest uppercase">
                        {getStatusLabelFallback(effectiveStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions - Show download for any purchase with access (only if it's not a service or service escrow is released) */}
                {hasAccess && purchase.products?.product_type !== 'service' && (
                  <button
                    onClick={() => onDownload(purchase.product_id)}
                    className="secondary-btn px-2.5 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-white/10 transition-all ml-auto touch-target"
                  >
                    <Download className="w-3 h-3" />
                    {downloadActionText}
                  </button>
                )}
              </div>

              {/* Escrow System Panel for Services */}
              {purchase.escrow_status && purchase.escrow_status !== 'none' && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      Garantia de Serviço Segura
                    </span>
                    <span className="text-[9px] font-medium text-on-surface-variant uppercase tracking-wider">
                      Status: {purchase.escrow_status === 'held' ? 'Retido' :
                               purchase.escrow_status === 'requested' ? 'Solicitado' :
                               purchase.escrow_status === 'released' ? 'Liberado' :
                               purchase.escrow_status === 'disputed' ? 'Em Disputa' : purchase.escrow_status}
                    </span>
                  </div>

                  {purchase.escrow_status === 'held' && (
                    <div className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-lg">
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        O pagamento está retido com segurança. Confirme a entrega assim que o serviço for concluído.
                      </p>
                      <button
                        onClick={() => handleRelease(purchase.id)}
                        disabled={submittingEscrow === purchase.id}
                        className="px-2.5 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-[9px] font-semibold transition disabled:opacity-40 flex-shrink-0 touch-target"
                      >
                        Liberar Pagamento
                      </button>
                    </div>
                  )}

                  {purchase.escrow_status === 'requested' && (
                    <div className="bg-white/5 p-2 rounded-lg space-y-2">
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        O criador declarou o serviço concluído e solicitou a liberação. Se nenhuma ação for tomada em 7 dias, a liberação será automática.
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowDisputeModal(purchase.id);
                            setDisputeReason('');
                          }}
                          disabled={submittingEscrow === purchase.id}
                          className="px-2 py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[9px] font-semibold transition disabled:opacity-40 touch-target"
                        >
                          Contestar Entrega
                        </button>
                        <button
                          onClick={() => handleRelease(purchase.id)}
                          disabled={submittingEscrow === purchase.id}
                          className="px-2.5 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-[9px] font-semibold transition disabled:opacity-40 touch-target"
                        >
                          Liberar Pagamento
                        </button>
                      </div>
                    </div>
                  )}

                  {purchase.escrow_status === 'disputed' && (
                    <div className="bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                      <p className="text-[10px] text-red-400 leading-relaxed font-medium">
                        Você contestou este serviço. A moderação foi notificada e entrará em contato.
                      </p>
                      {purchase.escrow_dispute_reason && (
                        <p className="text-[9px] text-on-surface-variant mt-1 italic">
                          Sua justificativa: "{purchase.escrow_dispute_reason}"
                        </p>
                      )}
                    </div>
                  )}

                  {purchase.escrow_status === 'released' && (
                    <div className="bg-green-500/5 border border-green-500/10 p-1.5 rounded-lg">
                      <p className="text-[9px] text-green-400 leading-relaxed font-semibold font-sans">
                        ✓ Pagamento concluído e liberado ao criador.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Dispute Reason Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-xl border border-white/10 p-4 space-y-3 font-sans">
            <h3 className="font-display text-sm font-bold text-white">Contestar Entrega do Serviço</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Explique detalhadamente por que este serviço não foi concluído como combinado. A moderação analisará seu relato.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Digite sua justificativa..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDisputeModal(null)}
                className="px-3 py-1.5 rounded text-xs text-white/60 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDispute(showDisputeModal)}
                disabled={!disputeReason.trim() || submittingEscrow === showDisputeModal}
                className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition disabled:opacity-40"
              >
                Enviar Contestação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
