import { useState } from 'react';
import { ArrowRight, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CheckoutButtonProps {
  productId: string;
  price: number;
  couponCode?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'mobile';
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud';

export function CheckoutButton({
  productId,
  price,
  couponCode,
  className,
  children,
  variant = 'primary',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not authenticated
        alert('Por favor, faça login para continuar com a compra.');
        // You can implement a proper login modal here
        return;
      }

      // Create checkout session
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

      // Read referral code from localStorage
      let referralCode = '';
      try {
        const stored = JSON.parse(localStorage.getItem('ce_referral_code') || 'null');
        if (stored && stored.expiry > Date.now()) referralCode = stored.code;
      } catch {}

      const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          couponCode: couponCode || undefined,
          userId: user.id,
          authUserId: user.id,
          userEmail: user.email,
          referralCode: referralCode || undefined,
          successUrl: `${appUrl}?screen=success`,
          cancelUrl: `${appUrl}?screen=cancel`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      
      // Show user-friendly error
      alert(
        '❌ Erro ao iniciar checkout:\n\n' +
        (err instanceof Error ? err.message : 'Erro desconhecido') +
        '\n\nPor favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`
          min-w-[160px] bg-on-surface text-background font-display text-sm font-bold 
          px-4 py-3 rounded-full hover:bg-primary hover:text-on-primary 
          transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          ${className || ''}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processando...</span>
          </>
        ) : (
          children || 'Comprar Agora'
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`
          bg-on-surface text-background font-display text-lg sm:text-xl md:text-2xl 
          font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-xl 
          hover:bg-primary hover:text-on-primary transition-all duration-300 
          w-full md:w-auto text-center flex justify-center items-center gap-3 
          shadow-[0_0_20px_rgba(255,255,255,0.1)] 
          hover:shadow-[0_0_30px_rgba(192,193,255,0.3)] 
          group disabled:opacity-50 disabled:cursor-not-allowed
          ${className || ''}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Processando...</span>
          </>
        ) : (
          <>
            {children || 'Comprar Agora'}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
        <Lock className="w-4 h-4" />
        Pagamento 100% seguro via{' '}
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#635bff] to-[#00d4ff]">
          Stripe
        </span>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center md:text-left">
          {error}
        </div>
      )}
    </div>
  );
}
