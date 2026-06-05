/**
 * PaymentMethodSelector
 * Modal that lets users choose between Stripe (International) and FastPay (Angola).
 * Only shows FastPay if the product has a fastpay_link configured and FastPay is globally enabled.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Smartphone, ChevronRight, Info } from 'lucide-react';

interface PaymentMethodSelectorProps {
  product: {
    id: string;
    title: string;
    price: number;
    aoa_price?: number | null;
    fastpay_link?: string | null;
  };
  onSelectStripe: () => void;
  onSelectFastPay: () => void;
  onClose: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function PaymentMethodSelector({
  product,
  onSelectStripe,
  onSelectFastPay,
  onClose,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation('checkout');
  const [fastpayEnabled, setFastpayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasFastPayLink = !!product.fastpay_link;

  useEffect(() => {
    async function checkFastPay() {
      if (!hasFastPayLink) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/fastpay/settings`);
        const data = await res.json();
        setFastpayEnabled(data.enabled === true);
      } catch {
        setFastpayEnabled(false);
      } finally {
        setLoading(false);
      }
    }
    checkFastPay();
  }, [hasFastPayLink]);

  const showFastPay = hasFastPayLink && fastpayEnabled;

  // If only Stripe is available, skip the selector
  useEffect(() => {
    if (!loading && !showFastPay) {
      onSelectStripe();
    }
  }, [loading, showFastPay]);

  // Don't render modal if FastPay not available (will auto-redirect to Stripe)
  if (loading) return null;
  if (!showFastPay) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-white/10 animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-display font-bold text-on-surface">
            {t('paymentMethodSelector.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Stripe Option */}
          <button
            onClick={onSelectStripe}
            className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-white/10
                       hover:border-[#635bff]/50 hover:bg-[#635bff]/5 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#635bff] to-[#00d4ff] flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-display font-bold text-on-surface text-base">
                Stripe
                <span className="ml-1.5 text-xs font-normal text-on-surface-variant">
                  ({t('paymentMethodSelector.international')})
                </span>
              </div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                {t('paymentMethodSelector.stripeDesc')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-[#635bff] group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* FastPay Option */}
          <button
            onClick={onSelectFastPay}
            className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-white/10
                       hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-display font-bold text-on-surface text-base">
                FastPay
                <span className="ml-1.5 text-xs font-normal text-on-surface-variant">
                  ({t('paymentMethodSelector.angola')})
                </span>
              </div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                <span className="font-sans font-bold text-orange-400">
                  {product.aoa_price ? `${product.aoa_price.toFixed(2)} AOA` : `${product.price.toFixed(2)} Kz`}
                </span>
                {" • " + t('paymentMethodSelector.fastPayDesc')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-5 pb-5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('paymentMethodSelector.notice', {
                price: product.aoa_price
                  ? `${product.aoa_price.toFixed(2)} AOA`
                  : `${product.price.toFixed(2)} Kz`
              })}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
