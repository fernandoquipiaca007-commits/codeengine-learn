import { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CouponInputProps {
  productId: string;
  originalPrice: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
}

export function CouponInput({ productId, originalPrice, onCouponApplied }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  async function validateCoupon() {
    if (!couponCode.trim()) {
      showMessage('error', 'Digite um código de cupom');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_coupons')
        .select('*')
        .eq('product_id', productId)
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        showMessage('error', 'Cupom inválido ou expirado');
        return;
      }

      // Validate expiration
      if (data.valid_until) {
        const expirationDate = new Date(data.valid_until);
        if (expirationDate < new Date()) {
          showMessage('error', 'Este cupom expirou');
          return;
        }
      }

      // Validate max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        showMessage('error', 'Este cupom atingiu o limite de usos');
        return;
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_type === 'percentage') {
        discount = (originalPrice * data.discount_value) / 100;
      } else {
        discount = data.discount_value;
      }

      // Apply coupon
      setAppliedCoupon(data.code);
      onCouponApplied(discount, data.code);
      showMessage('success', `Cupom aplicado! Desconto de R$ ${discount.toFixed(2)}`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      showMessage('error', 'Erro ao validar cupom');
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
          Tem um cupom de desconto?
        </h3>
      </div>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-display text-sm font-semibold text-on-surface">
                  Cupom Aplicado
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
              placeholder="Digite o código"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-surface-container border border-outline/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface placeholder-on-surface-variant/50 font-mono uppercase"
            />
            <button
              onClick={validateCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-display text-sm font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validando...' : 'Aplicar'}
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
