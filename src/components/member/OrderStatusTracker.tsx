/**
 * OrderStatusTracker
 * Displays the member's FastPay orders with status badges, filtering, and action links.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock, CheckCircle, XCircle, Package, Filter,
  Loader2, AlertCircle, ExternalLink, Eye, RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FastPayOrderItem {
  id: string;
  product_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  proof_url: string | null;
  proof_uploaded_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  product?: {
    id: string;
    title: string;
    price: number;
    cover_url: string;
  };
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function OrderStatusTracker() {
  const { t, i18n } = useTranslation('member');
  const [orders, setOrders] = useState<FastPayOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const url = new URL(`${BACKEND_URL}/api/fastpay/orders`);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || t('orderStatusTracker.loadError'));
      }
    } catch (err) {
      setError(t('orderStatusTracker.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const statusConfig = {
    pending: {
      label: t('orderStatusTracker.status.pending'),
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
    completed: {
      label: t('orderStatusTracker.status.completed'),
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    failed: {
      label: t('orderStatusTracker.status.failed'),
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (orders.length === 0 && statusFilter === 'all') {
    return null; // Don't render section if no FastPay orders
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-on-surface text-sm flex items-center gap-1.5">
          <Package className="w-4 h-4 text-orange-400" />
          {t('orderStatusTracker.title')}
        </h3>
        <button
          onClick={fetchOrders}
          className="p-1 rounded hover:bg-white/10 text-on-surface-variant transition-colors"
          title={t('orderStatusTracker.refresh')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
        {['all', 'pending', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`
              px-2.5 py-1 rounded text-[10px] font-medium transition-all
              ${statusFilter === s
                ? 'bg-primary/20 text-primary'
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
              }
            `}
          >
            {s === 'all' ? t('orderStatusTracker.all') : statusConfig[s as keyof typeof statusConfig].label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 p-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-2">
          {statusFilter !== 'all' 
            ? t('orderStatusTracker.noOrdersWithStatus', { status: statusConfig[statusFilter as keyof typeof statusConfig]?.label })
            : t('orderStatusTracker.noOrders')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            const date = new Date(order.created_at);

            return (
              <div
                key={order.id}
                className={`p-2.5 rounded-lg border ${config.border} ${config.bg}`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Product cover */}
                  {order.product?.cover_url && (
                    <img
                      src={order.product.cover_url}
                      alt={order.product?.title}
                      className="w-9 h-9 rounded object-cover flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Product name + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-semibold text-on-surface text-xs truncate">
                        {order.product?.title || 'Produto'}
                      </p>
                      <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium ${config.color} ${config.bg} flex-shrink-0`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {config.label}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-on-surface-variant">
                      <span>{order.amount.toFixed(2)} Kz</span>
                      <span>•</span>
                      <span>{date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'fr' ? 'fr-FR' : 'pt-BR')}</span>
                      {order.proof_uploaded_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            {t('orderStatusTracker.proofSent')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Status-specific messages */}
                    {order.status === 'pending' && (
                      <p className="mt-1 text-[9px] text-yellow-300/80">
                        <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                        {t('orderStatusTracker.pendingMessage')}
                      </p>
                    )}

                    {order.status === 'completed' && (
                      <p className="mt-1 text-[9px] text-green-300/80">
                        <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" />
                        {t('orderStatusTracker.completedMessage')}
                      </p>
                    )}

                    {order.status === 'failed' && order.rejection_reason && (
                      <p className="mt-1 text-[9px] text-red-300/80">
                        <XCircle className="w-2.5 h-2.5 inline mr-0.5" />
                        {t('orderStatusTracker.rejectionReason', { reason: order.rejection_reason })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
