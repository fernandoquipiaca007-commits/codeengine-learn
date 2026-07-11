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
  productType?: 'file' | 'course' | 'ebook' | 'service' | string;
  productTitle?: string;
  fastpayLink?: string | null;
  aoaPrice?: number | null;
  couponCode?: string;
  className?: string;
  variant?: 'primary' | 'mobile';
  onNavigateToLibrary?: () => void;
  onStartLearning?: (productId: string, type: 'course' | 'ebook') => void;
  ctaText?: string;
  /** Called when user tries to buy/claim without being authenticated.
   *  The caller should navigate to the signup/login screen. */
  onRequireAuth?: () => void;
  preferAoa?: boolean;
  originalPrice?: number;
  licensingInfo?: any;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

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
  ctaText,
  onRequireAuth,
  preferAoa = false,
  originalPrice,
  licensingInfo,
}: ProductActionButtonProps) {
  const { locale } = useLocale();
  const { t } = useTranslation(['common', 'checkout'], { lng: locale });
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showFastPayFlow, setShowFastPayFlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Get current user
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  const purchaseCtx = useProductPurchaseOptional();
  const ownsProduct = purchaseCtx?.ownsProduct ?? false;
  const accessType = purchaseCtx?.accessType ?? null;
  const purchaseLoading = purchaseCtx?.loading ?? false;
  const refetch = purchaseCtx?.refetch ?? (async () => {});

  useEffect(() => {
    console.log('[ProductActionButton] state/translation diagnostic:', {
      productId,
      activeLocale: locale,
      ownsProduct,
      t_readNow: t('product.readNow'),
      t_downloadProduct: t('actions.downloadProduct'),
      t_buyNow: t('actions.buyNow'),
      i18nLanguage: locale // locale context language
    });
  }, [productId, locale, ownsProduct, t]);

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
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      // Auto-trigger pending checkout intent (set before redirecting to signup)
      if (u) {
        const raw = sessionStorage.getItem('pendingCheckout');
        if (raw) {
          try {
            const intent = JSON.parse(raw) as {
              productId: string;
              hasMultiPayment: boolean;
              preferAoa?: boolean;
            };
            if (intent.productId === productId) {
              sessionStorage.removeItem('pendingCheckout');
              // Small delay so component state settles before triggering checkout
              setTimeout(() => {
                if (intent.hasMultiPayment) {
                  setShowPaymentSelector(true);
                } else {
                  void handlePaidCheckout(u);
                }
              }, 400);
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setUserLoading(false);
    }
  }

  const handleBuyClick = () => {
    if (loading || ownsProduct) return;

    // Not logged in → save intent and redirect to signup
    if (!user) {
      sessionStorage.setItem('pendingCheckout', JSON.stringify({
        productId,
        hasMultiPayment: !!fastpayLink,
        fastpayLink: fastpayLink || null,
        aoaPrice: aoaPrice ?? null,
        price,
        productTitle,
        preferAoa,
      }));
      onRequireAuth?.();
      return;
    }

    // Logged in — proceed normally
    if (fastpayLink) {
      setShowPaymentSelector(true);
    } else {
      void handlePaidCheckout();
    }
  };

  const handlePaidCheckout = async (loggedInUser?: any) => {
    if (loading) return; // Prevent double-click
    if (ownsProduct) return; // Already owns
    setShowPaymentSelector(false);
    setLoading(true);
    setError(null);

    // Use the freshly-loaded user (passed directly) or fall back to state
    const currentUser = loggedInUser ?? user;

    try {
      if (!currentUser) {
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          productId,
          hasMultiPayment: !!fastpayLink,
          fastpayLink: fastpayLink || null,
          aoaPrice: aoaPrice ?? null,
          price,
          productTitle,
          preferAoa,
        }));
        onRequireAuth?.();
        return;
      }

      // Create checkout session
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', currentUser.id)
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
          userId: member?.id || currentUser.id,
          authUserId: currentUser.id,
          userEmail: currentUser.email,
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
          setError(t('product.alreadyOwnedError'));
          return;
        }
        throw new Error(errBody.error || `Erro do servidor (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || t('checkout:errorDesc'));
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
        ? t('product.paymentUnavailable')
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
        // Save intent and redirect to signup for free products too
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          productId,
          hasMultiPayment: false,
          isFree: true,
        }));
        onRequireAuth?.();
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
      setError(err instanceof Error ? err.message : t('errors.generic'));
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
          bg-surface-highest text-on-surface-variant font-display text-sm sm:text-base 
          px-5 py-3 rounded-lg w-full flex justify-center items-center gap-2.5
          ${className || ''}
        `}
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{t('product.loading')}</span>
      </button>
    );
  }

  // Already owns product
  if (ownsProduct) {
    const isCourse = productType === 'course';
    const isEbook = productType === 'ebook';
    const isService = productType === 'service';

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            if (isCourse && onStartLearning) {
              onStartLearning(productId, 'course');
            } else if (isEbook && onStartLearning) {
              onStartLearning(productId, 'ebook');
            } else if (isService) {
              setShowServiceModal(true);
            } else {
              void handleDownload();
            }
          }}
          disabled={downloading && !isCourse && !isEbook && !isService}
          className={`
            bg-green-600 text-white font-display text-sm sm:text-base md:text-lg 
            font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg 
            hover:bg-green-700 transition-all duration-300 
            w-full md:w-auto text-center flex justify-center items-center gap-2.5 
            shadow-[0_0_20px_rgba(34,197,94,0.3)] 
            hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] 
            group disabled:opacity-50
            ${className || ''}
          `}
        >
          {downloading && !isCourse && !isEbook && !isService ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>
            {isCourse
              ? t('product.startCourse')
              : isEbook
                ? t('product.readNow')
                : isService
                  ? 'Acessar Serviço'
                  : downloading
                    ? t('actions.downloading')
                    : t('actions.downloadProduct')}
          </span>
          {!isCourse && !isEbook && !isService && (
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>

        <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
          <CheckCircle className="w-4 h-4" />
          {accessType === 'free' ? t('product.freeBadge') : t('product.lifetimeAccess')}
        </div>

        {/* Modal de Entrega do Serviço */}
        {isService && showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121214] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-left">
              <button 
                onClick={() => setShowServiceModal(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition"
              >
                <span className="sr-only">Fechar</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-display">Instruções do seu Serviço</h3>
                <p className="text-xs text-on-surface-variant">
                  Você adquiriu com sucesso o serviço <strong className="text-white">"{productTitle}"</strong>. Siga as instruções do criador abaixo para recebê-lo de forma segura.
                </p>
              </div>

              <div className="bg-white/3 border border-white/5 rounded-xl p-4 text-sm text-white/90 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {licensingInfo?.service_delivery?.instructions || 'Nenhuma instrução específica de entrega fornecida pelo criador. Por favor, entre em contato usando o botão abaixo.'}
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Canal Oficial e Seguro de Contacto</span>
                {(() => {
                  const delivery = licensingInfo?.service_delivery || {};
                  const method = delivery.method || 'email';
                  const contact = delivery.contact || '';

                  if (method === 'whatsapp') {
                    const digits = contact.replace(/\D/g, '');
                    const waLink = contact.startsWith('http') ? contact : `https://wa.me/${digits}`;
                    return (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-semibold transition"
                      >
                        Falar com o Criador no WhatsApp
                      </a>
                    );
                  }

                  if (method === 'email') {
                    return (
                      <a
                        href={`mailto:${contact}`}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-semibold transition"
                      >
                        Enviar E-mail para o Criador
                      </a>
                    );
                  }

                  if (method === 'telegram') {
                    const tgLink = contact.startsWith('http') ? contact : `https://t.me/${contact.replace('@', '')}`;
                    return (
                      <a
                        href={tgLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-3 text-sm font-semibold transition"
                      >
                        Falar com o Criador no Telegram
                      </a>
                    );
                  }

                  return (
                    <a
                      href={contact.startsWith('http') ? contact : `https://${contact}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/95 text-on-primary py-3 text-sm font-semibold transition"
                    >
                      Acessar Canal de Atendimento / Agendamento
                    </a>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="w-full border border-white/10 hover:bg-white/5 text-xs text-white py-2 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
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
            bg-primary text-on-primary font-display text-sm sm:text-base md:text-lg 
            font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg 
            hover:bg-primary/90 transition-all duration-300 
            w-full md:w-auto text-center flex justify-center items-center gap-2.5 
            shadow-[0_0_20px_rgba(192,193,255,0.3)] 
            hover:shadow-[0_0_30px_rgba(192,193,255,0.5)] 
            group disabled:opacity-50 disabled:cursor-not-allowed
            ${className || ''}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('checkout:processing')}</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>{ctaText || t('actions.downloadFree') || 'Baixar Gratuitamente'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
          <CheckCircle className="w-4 h-4" />
          {t('product.freeNoCard')}
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
            buy-button 
            text-center flex justify-center items-center gap-3 
            ${className || ''}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{t('checkout:processing')}</span>
            </>
          ) : (
            <>
              <span>{ctaText || t('actions.buyNow')}</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        <div className="flex items-center justify-center md:justify-start gap-2 font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60">
          <Lock className="w-4 h-4" />
          {t('product.securePaymentVia')}{' '}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#635bff] to-[#00d4ff]">
            Stripe
          </span>
          {fastpayLink && (
            <>
              {' '}{t('product.or')}{' '}
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
            originalPrice: originalPrice || price,
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
