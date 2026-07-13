/**
 * PaymentMethodSelector
 * Modal that lets users choose between Stripe (International) and FastPay (Angola).
 * Only shows FastPay if the product has a fastpay_link configured and FastPay is globally enabled.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Smartphone, ChevronRight, Info } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { supabase } from '../../lib/supabase';

interface PaymentMethodSelectorProps {
  product: {
    id: string;
    title: string;
    price: number;
    aoa_price?: number | null;
    fastpay_link?: string | null;
    originalPrice: number;
  };
  onSelectStripe: (selectedBonusIds: string[]) => void;
  onSelectFastPay: (selectedBonusIds: string[]) => void;
  onClose: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

export function PaymentMethodSelector({
  product,
  onSelectStripe,
  onSelectFastPay,
  onClose,
}: PaymentMethodSelectorProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('checkout');
  const [fastpayEnabled, setFastpayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optionalBonuses, setOptionalBonuses] = useState<any[]>([]);
  const [selectedBonusIds, setSelectedBonusIds] = useState<string[]>([]);
  const hasFastPayLink = !!product.fastpay_link;
  const computedAoaPrice = product.aoa_price || Math.round(product.originalPrice * 920);

  useEffect(() => {
    async function checkFastPay() {
      if (!hasFastPayLink) {
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/fastpay/settings`);
        const data = await res.json();
        setFastpayEnabled(data.enabled === true);
      } catch {
        setFastpayEnabled(false);
      }
    }
    
    async function loadOptionalBonuses() {
      try {
        const { data } = await supabase
          .from('product_bonuses')
          .select('id, title, description, additional_price, additional_price_aoa, original_value')
          .eq('product_id', product.id)
          .eq('is_optional', true)
          .eq('is_active', true);
        if (data) {
          setOptionalBonuses(data);
        }
      } catch (err) {
        console.error('Error loading optional bonuses:', err);
      }
    }

    Promise.all([checkFastPay(), loadOptionalBonuses()]).finally(() => {
      setLoading(false);
    });
  }, [product.id, hasFastPayLink]);

  const showFastPay = hasFastPayLink && fastpayEnabled;
  const hasOptionalBonuses = optionalBonuses.length > 0;

  // If only Stripe is available and no optional bonuses exist, skip the selector
  useEffect(() => {
    if (!loading && !showFastPay && !hasOptionalBonuses) {
      onSelectStripe([]);
    }
  }, [loading, showFastPay, hasOptionalBonuses]);

  // Don't render modal if FastPay not available and no optional bonuses exist
  if (loading) return null;
  if (!showFastPay && !hasOptionalBonuses) return null;

  // Sum selected surcharges
  const totalBonusUsd = optionalBonuses
    .filter(b => selectedBonusIds.includes(b.id))
    .reduce((acc, b) => acc + Number(b.additional_price || 0), 0);

  const totalBonusAoa = optionalBonuses
    .filter(b => selectedBonusIds.includes(b.id))
    .reduce((acc, b) => acc + Number(b.additional_price_aoa || 0), 0);

  const finalStripePrice = product.price + totalBonusUsd;
  const finalFastPayPrice = computedAoaPrice + totalBonusAoa;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-white/10 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-display font-bold text-on-surface">
            {hasOptionalBonuses ? (locale === 'pt' ? 'Escolha os seus Extras' : 'Choose Your Extras') : t('paymentMethodSelector.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Bumps Section */}
        {optionalBonuses.length > 0 && (
          <div className="p-5 border-b border-white/5 space-y-3 bg-white/5">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
              {locale === 'pt' ? 'Ofertas Especiais Recomendadas' : 'Special Recommended Offers'}
            </h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {optionalBonuses.map(bonus => {
                const isSelected = selectedBonusIds.includes(bonus.id);
                const priceUsd = Number(bonus.additional_price || 0);
                const priceAoa = Number(bonus.additional_price_aoa || 0);
                return (
                  <div
                    key={bonus.id}
                    onClick={() => {
                      setSelectedBonusIds(prev =>
                        prev.includes(bonus.id)
                          ? prev.filter(id => id !== bonus.id)
                          : [...prev, bonus.id]
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(236,72,153,0.05)]'
                        : 'border-white/5 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by onClick on container
                      className="w-4 h-4 rounded border-white/10 bg-surface-high text-primary focus:ring-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs">{bonus.title}</span>
                        <span className="font-bold text-green-400 text-xs shrink-0">
                          {showFastPay 
                            ? `+${priceAoa.toLocaleString()} Kz`
                            : `+$${priceUsd.toFixed(2)}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: bonus.description || '' }} />
                      <div className="text-[9px] text-on-surface-variant/60 mt-0.5 line-through">
                        {locale === 'pt' ? `Valor original: $${Number(bonus.original_value || 0).toFixed(2)}` : `Original value: $${Number(bonus.original_value || 0).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Stripe Option */}
          <button
            onClick={() => onSelectStripe(selectedBonusIds)}
            className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-white/10
                       hover:border-[#635bff]/50 hover:bg-[#635bff]/5 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#635bff] to-[#00d4ff] flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-display font-bold text-on-surface text-base flex justify-between items-center">
                <span>
                  Stripe
                  <span className="ml-1.5 text-xs font-normal text-on-surface-variant">
                    ({t('paymentMethodSelector.international')})
                  </span>
                </span>
                <span className="font-bold text-white">${finalStripePrice.toFixed(2)}</span>
              </div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                {t('paymentMethodSelector.stripeDesc')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-[#635bff] group-hover:translate-x-0.5 transition-all animate-pulse" />
          </button>

          {/* FastPay Option */}
          {showFastPay && (
            <button
              onClick={() => onSelectFastPay(selectedBonusIds)}
              className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-white/10
                         hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-display font-bold text-on-surface text-base flex justify-between items-center">
                  <span>
                    FastPay
                    <span className="ml-1.5 text-xs font-normal text-on-surface-variant">
                      ({t('paymentMethodSelector.angola')})
                    </span>
                  </span>
                  <span className="font-bold text-orange-400">{Math.round(finalFastPayPrice).toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="text-sm text-on-surface-variant mt-0.5">
                  {t('paymentMethodSelector.fastPayDesc')}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        {/* Notice */}
        <div className="px-5 pb-5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('paymentMethodSelector.notice', {
                price: `${Math.round(finalFastPayPrice).toLocaleString('pt-AO')} Kz`
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
