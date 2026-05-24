import { useState, useEffect } from 'react';
import { ArrowRight, Lock, Loader2, CheckCircle, Download, Library, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProductPurchaseOptional } from '../contexts/ProductPurchaseContext';
import { mapStoreError } from '../lib/error-messages';
import { useTranslation } from 'react-i18next';
import { downloadProduct } from '../lib/download-file';
import { useLocale } from '../contexts/LocaleContext';
import { PaymentMethodSelector } from './payment/PaymentMethodSelector';
import { FastPayFlow } from './payment/FastPayFlow';

interface ProductActionButtonProps {
  productId: string;
  price: number;
  isFree: boolean;
  productType?: 'file' | 'course' | 'ebook';
  productTitle?: string;
  fastpayLink?: string | null;
  aoaPrice?: number | null;
  couponCode?: string;
  className?: string;
  variant?: 'primary' | 'mobile';
  onNavigateToLibrary?: () => void;
  onStartLearning?: (productId: string, type: 'course' | 'ebook') => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function ProductActionButton({
  productId,
  price,
  isFree,
  couponCode,
  className,
  variant = 'primary',
  productType = 'file',
  productTitle = '',
  fastpayLink,
  aoaPrice,
  onNavigateToLibrary,
  onStartLearning,
}: ProductActionButtonProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showFastPayFlow, setShowFastPayFlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  const purchaseCtx = useProductPurchaseOptional();
  const ownsProduct = purchaseCtx?.ownsProduct ?? false;
  const accessType = purchaseCtx?.accessType ?? null;
  const purchaseLoading = purchaseCtx?.loading ?? false;
  const refetch = purchaseCtx?.refetch ?? (async () => {});

  useEffect(() => {
    const onFocus = () => void refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setUserLoading(false);
    }
  }

  const handleBuyClick = () => {
    if (loading || ownsProduct) return;
    // If product has FastPay link, show payment method selector
    if (fastpayLink) {
      setShowPaymentSelector(true);
    } else {
      handlePaidCheckout();
    }
  };

  const handlePaidCheckout = async () => {
    if (loading) return; // Prevent double-click
    if (ownsProduct) return; // Already owns
    setShowPaymentSelector(false);
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        alert('Por favor, faça login para continuar com a compra.');
        return;
      }

      // Create checkout session
      const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', user.id)
        .single();

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
          userId: member?.id || user.id,
          authUserId: user.id,
          userEmail: user.email,
          referralCode: referralCode || undefined,
          successUrl: `${appUrl}?screen=success`,
          cancelUrl: `${appUrl}?screen=cancel`,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as any;
        // Handle 409 = already owns product
        if (response.status === 409 && errBody.alreadyOwned) {
          await refetch(); // Refresh ownership state
          setError('Você já possui este produto.');
          return;
        }
        throw new Error(errBody.error || `Erro do servidor (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const isNetwork =
        err instanceof TypeError ||
        (err instanceof Error && err.message.toLowerCase().includes('fetch'));
      const message = isNetwork
        ? `Servidor de pagamentos indisponível.`
        : mapStoreError(err, 'payment');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeProduct = async () => {
    if (loading) return;
    if (ownsProduct) return;
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError('Faça login para obter este produto.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Ensure member record exists before claiming
      try {
        await fetch(`${BACKEND_URL}/api/auth/ensure-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      } catch {}

      const response = await fetch(`${BACKEND_URL}/api/products/claim-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: productId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to claim free product');
      }

      // Refresh ownership state
      await refetch();
      
      if (onNavigateToLibrary) {
        onNavigateToLibrary();
      }
    } catch (err) {
      console.error('Free product error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao obter produto gratuito.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadProduct(productId, locale);
    } catch (err) {
      const msg = err instanceof Error && err.message === 'LOGIN_REQUIRED'
        ? t('errors.loginRequired')
        : t('errors.generic');
      setError(msg);
      alert(msg);
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (userLoading || purchaseLoading) {
    return (
      <button
        disabled
        className={`
          bg-surface-highest text-on-surface-variant font-display text-lg 
          px-8 py-5 rounded-xl w-full flex justify-center items-center gap-3
          ${className || ''}
        `}
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Carregando...</span>
      </button>
    );
  }

  // Already owns product
  if (ownsProduct) {
    const isCourse = productType === 'course';
    const isEbook = productType === 'ebook';

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            if (isCourse && onStartLearning) {
              onStartLearning(productId, 'course');
            } else if (isEbook && onStartLearning) {
              onStartLearning(productId, 'ebook');
            } else {
              void handleDownload();
            }
          }}
          disabled={downloading && !isCourse && !isEbook}
          className={`
            bg-green-600 text-white font-display text-lg sm:text-xl md:text-2xl 
            font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-xl 
            hover:bg-green-700 transition-all duration-300 
            w-full md:w-auto text-center flex justify-center items-center gap-3 
            shadow-[0_0_20px_rgba(34,197,94,0.3)] 
            hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] 
            group disabled:opacity-50
            ${className || ''}
          `}
        >
          {downloading && !isCourse && !isEbook ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <CheckCircle className="w-6 h-6" />
          )}
          <span>
            {isCourse
              ? 'Começar curso'
              : isEbook
                ? 'Ler agora'
                : downloading
                  ? t('actions.downloading')
                  : t('actions.downloadProduct')}
          </span>
          {!isCourse && !isEbook && (
            <Download className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>

        <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
          <CheckCircle className="w-4 h-4" />
          {accessType === 'free' ? 'Produto Gratuito' : 'Acesso Vitalício'}
        </div>
      </div>
    );
  }

  // Free product - not owned
  if (isFree) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={handleFreeProduct}
          disabled={loading}
          className={`
            bg-primary text-on-primary font-display text-lg sm:text-xl md:text-2xl 
            font-bold px-6 sm:px-8 py-4 sm:py-5 rounded-xl 
            hover:bg-primary/90 transition-all duration-300 
            w-full md:w-auto text-center flex justify-center items-center gap-3 
            shadow-[0_0_20px_rgba(192,193,255,0.3)] 
            hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] 
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
              <Download className="w-6 h-6" />
              <span>Baixar Gratuitamente</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
          <CheckCircle className="w-4 h-4" />
          100% Gratuito • Sem Cadastro de Cartão
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center md:text-left">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Paid product - not owned
  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          onClick={handleBuyClick}
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
              <span>Comprar Agora</span>
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
          {fastpayLink && (
            <>
              {' '}ou{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                FastPay
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center md:text-left">
            {error}
          </div>
        )}
      </div>

      {/* Payment Method Selector Modal */}
      {showPaymentSelector && (
        <PaymentMethodSelector
          product={{
            id: productId,
            title: productTitle,
            price,
            aoa_price: aoaPrice,
            fastpay_link: fastpayLink,
          }}
          onSelectStripe={() => {
            setShowPaymentSelector(false);
            handlePaidCheckout();
          }}
          onSelectFastPay={() => {
            setShowPaymentSelector(false);
            setShowFastPayFlow(true);
          }}
          onClose={() => setShowPaymentSelector(false)}
        />
      )}

      {/* FastPay Flow Modal */}
      {showFastPayFlow && (
        <FastPayFlow
          product={{
            id: productId,
            title: productTitle,
            price,
            aoa_price: aoaPrice,
            fastpay_link: fastpayLink,
          }}
          onClose={() => setShowFastPayFlow(false)}
          onComplete={() => refetch()}
        />
      )}
    </>
  );
}
