import { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface CouponInputProps {
  productId: string;
  originalPrice: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
}

export function CouponInput({ productId, originalPrice, onCouponApplied }: CouponInputProps) {
  const { t } = useTranslation('checkout');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  async function validateCoupon() {
    if (!couponCode.trim()) {
      showMessage('error', t('enterCouponCode') || 'Digite um código de cupom');
      return;
    }

    setLoading(true);
    try {
      // 1. First, check product_coupons (global or product-specific campaigns)
      let { data: couponData } = await supabase
        .from('product_coupons')
        .select('*')
        .eq('product_id', productId)
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!couponData) {
        const { data: globalCoupon } = await supabase
          .from('product_coupons')
          .select('*')
          .is('product_id', null)
          .eq('code', couponCode.toUpperCase())
          .eq('is_active', true)
          .maybeSingle();
        couponData = globalCoupon;
      }

      let discount = 0;
      let appliedCode = '';

      if (couponData) {
        // Validate product coupon expiration
        if (couponData.valid_until) {
          const expirationDate = new Date(couponData.valid_until);
          if (expirationDate < new Date()) {
            showMessage('error', 'Este cupom expirou');
            return;
          }
        }

        // Validate max uses
        if (couponData.max_uses && couponData.current_uses >= couponData.max_uses) {
          showMessage('error', 'Este cupom atingiu o limite de usos');
          return;
        }

        // Calculate discount
        if (couponData.discount_type === 'percentage') {
          discount = (originalPrice * couponData.discount_value) / 100;
        } else {
          discount = couponData.discount_value;
        }
        appliedCode = couponData.code;
      } else {
        // Fallback: Check global coupons table
        const { data: globalCoupon } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', couponCode.toUpperCase())
          .maybeSingle();

        if (globalCoupon) {
          // Validate global coupon expiration
          if (globalCoupon.expiration_date) {
            const expirationDate = new Date(globalCoupon.expiration_date);
            if (expirationDate < new Date()) {
              showMessage('error', 'Este cupom expirou');
              return;
            }
          }

          // Validate max uses
          if (globalCoupon.usage_limit && globalCoupon.usage_count >= globalCoupon.usage_limit) {
            showMessage('error', 'Este cupom atingiu o limite de usos');
            return;
          }

          // Validate applicable products if any
          if (globalCoupon.applicable_products && globalCoupon.applicable_products.length > 0) {
            if (!globalCoupon.applicable_products.includes(productId)) {
              showMessage('error', 'Este cupom não é válido para este produto');
              return;
            }
          }

          // Calculate discount
          if (globalCoupon.discount_type === 'percentage') {
            discount = (originalPrice * globalCoupon.discount_value) / 100;
          } else {
            discount = globalCoupon.discount_value;
          }
          appliedCode = globalCoupon.code;
        } else {
          // 2. If not found, check member_coupons (personal rewards)
          const { data: authData } = await supabase.auth.getUser();
        if (!authData || !authData.user) {
          showMessage('error', 'Cupom inválido ou expirado');
          return;
        }
        
        // Find member id
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('auth_id', authData.user.id)
          .single();

        if (!member) {
          showMessage('error', 'Cupom inválido ou expirado');
          return;
        }

        const { data: memberCoupon, error: memberCouponError } = await supabase
          .from('member_coupons')
          .select('*')
          .eq('code', couponCode.toUpperCase())
          .eq('member_id', member.id)
          .single();

        if (memberCouponError || !memberCoupon) {
          showMessage('error', 'Cupom inválido ou expirado');
          return;
        }

        if (memberCoupon.status === 'USED') {
          showMessage('error', 'Este cupom já foi utilizado.');
          return;
        }

        if (memberCoupon.status !== 'ACTIVE') {
          showMessage('error', 'Este cupom não está mais ativo.');
          return;
        }

        // Member coupons currently only support percentage (based on points-service generation)
        // or fixed value depending on the implementation. Let's assume the value stored is percentage 
        // as points-service sets discountValue. We should check if it's PCT or OFF.
        const isPercentage = memberCoupon.code.includes('PCT');
        if (isPercentage) {
          discount = (originalPrice * memberCoupon.discount_percentage) / 100;
        } else {
          discount = memberCoupon.discount_percentage;
        }
        appliedCode = memberCoupon.code;
        }
      }

      // Apply coupon
      setAppliedCoupon(appliedCode);
      onCouponApplied(discount, appliedCode);
      showMessage('success', `Cupom aplicado! Desconto de $ ${discount}`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      showMessage('error', t('validationError') || 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponApplied(0, '');
    setMessage(null);
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-semibold text-on-surface">
          {t('couponTitle') || 'Tem um cupom de desconto?'}
        </h3>
      </div>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-display text-sm font-semibold text-on-surface">
                  {t('couponApplied') || 'Cupom Aplicado'}
                </p>
                <code className="text-xs text-green-500 font-mono">{appliedCoupon}</code>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Remover cupom"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
              placeholder={t('couponPlaceholder') || 'Digite o código'}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-surface-container border border-outline/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface placeholder-on-surface-variant/50 font-mono uppercase"
            />
            <button
              onClick={validateCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-display text-sm font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('validating') || 'Validando...' : t('apply') || 'Aplicar'}
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl border ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}
            >
              <p className="font-sans text-sm">{message.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
