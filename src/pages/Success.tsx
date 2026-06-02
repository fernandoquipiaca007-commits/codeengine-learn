import { useEffect, useState } from 'react';
import { CheckCircle, Download, ArrowRight, Mail, Package, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface SuccessProps {
  setScreen?: (screen: string) => void;
}

interface SessionData {
  productName: string;
  customerEmail: string;
  amountPaid: number;
  purchaseId?: string;
}

export function Success({ setScreen }: SuccessProps) {
  const { t } = useTranslation('pages');
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('session_id');

    // If no session_id in URL, try sessionStorage (re-mount recovery)
    if (!sessionId) {
      sessionId = sessionStorage.getItem('ce_checkout_session_id');
    }

    if (sessionId) {
      // Persist for re-mount recovery before clearing URL
      sessionStorage.setItem('ce_checkout_session_id', sessionId);
      // Security: clear session_id from URL immediately
      window.history.replaceState({}, '', window.location.pathname);
      fetchSessionData(sessionId);
    } else {
      // No session_id anywhere — show success fallback instead of error
      // The purchase DID complete (user was redirected here by Stripe)
      setSessionData({
        productName: t('success.acquiredProduct'),
        customerEmail: '',
        amountPaid: 0,
      });
      setLoading(false);
    }
  }, []);

  const fetchSessionData = async (sessionId: string) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      // Garante registro da compra (webhook pode atrasar em dev local)
      const fulfillRes = await fetch(`${backendUrl}/api/stripe/fulfill-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!fulfillRes.ok) {
        const fulfillData = await fulfillRes.json().catch(() => ({}));
        throw new Error(fulfillData.error || 'Falha ao processar e liberar a compra no sistema.');
      }

      const response = await fetch(`${backendUrl}/api/stripe/session/${sessionId}`);

      if (!response.ok) {
        throw new Error(t('success.failedToFetchSession'));
      }

      const { session } = await response.json();

      const { data: purchase } = await supabase
        .from('purchases')
        .select(`
          id,
          amount_paid,
          product_id,
          products (
            id,
            title
          )
        `)
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      const metaProductId = session.metadata?.product_id;
      const productObj = purchase && (Array.isArray((purchase as any).products) ? (purchase as any).products[0] : (purchase as any).products);
      const productTitle =
        productObj?.title ||
        (metaProductId ? t('success.acquiredProduct') : t('success.product'));

      setSessionData({
        productName: productTitle,
        customerEmail: session.customer_email,
        amountPaid: (purchase?.amount_paid ?? session.amount_total / 100) as number,
        purchaseId: purchase?.id,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(t('success.errorLoadingPurchase'));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !error) {
      // Countdown to redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            sessionStorage.removeItem('ce_checkout_session_id');
            if (setScreen) {
              setScreen('member');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error, setScreen]);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 max-w-[800px] mx-auto">
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-sans text-lg text-on-surface-variant">
            {t('success.loading')}
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 mb-6">
            <Package className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface mb-4">
            {t('success.error')}
          </h1>
          <p className="font-sans text-lg text-on-surface-variant mb-8">
            {error}
          </p>
          <button
            onClick={() => setScreen && setScreen('home')}
            className="bg-primary text-on-primary font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all"
          >
            {t('success.backToHome')}
          </button>
        </div>
      ) : (
        <>
          {/* Success Animation */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-4">
              {t('success.confirmed')}
            </h1>
            
            <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto mb-4">
              {t('success.purchaseSuccess', { product: sessionData?.productName })}
            </p>

            <p className="font-sans text-sm text-on-surface-variant">
              {t('success.amountPaid', { amount: `$ ${sessionData?.amountPaid}` })}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid gap-6 mb-12">
            {/* Email Card */}
            <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
                  {t('success.checkEmail')}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant mb-2">
                  {t('success.emailSent')}
                </p>
                <p className="font-mono text-sm text-primary font-semibold">
                  {sessionData?.customerEmail}
                </p>
                <p className="font-sans text-xs text-on-surface-variant mt-2">
                  {t('success.checkSpam')}
                </p>
              </div>
            </div>

            {/* Download Card */}
            <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
                  {t('success.downloadReady')}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant">
                  {t('success.downloadDesc')}
                </p>
              </div>
            </div>

            {/* Support Card */}
            <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-tertiary-container" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
                  {t('success.lifetimeAccess')}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant">
                  {t('success.lifetimeDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {sessionData?.purchaseId && (
            <div className="glass-panel p-4 rounded-xl mb-8 border border-white/10">
              <p className="font-mono text-xs text-on-surface-variant">
                {t('success.purchaseId')} {sessionData.purchaseId}
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setScreen && setScreen('member')}
              className="bg-primary text-on-primary font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group"
            >
              {t('success.goToDownloads')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => setScreen && setScreen('home')}
              className="glass-panel border border-white/10 text-on-surface font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-surface-high transition-all"
            >
              {t('success.backToHomeBtn')}
            </button>
          </div>

          {/* Auto Redirect Info */}
          <div className="text-center mt-8">
            <p className="font-sans text-sm text-on-surface-variant">
              {t('success.autoRedirect')}{' '}
              <span className="font-bold text-primary">{countdown}</span> {t('success.seconds')}
            </p>
          </div>

          {/* What's Next */}
          <div className="mt-16 glass-panel p-8 rounded-2xl">
            <h2 className="font-display text-2xl font-bold text-on-surface mb-6 text-center">
              {t('success.nextSteps')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-primary">
                  1
                </div>
                <div>
                  <h4 className="font-display font-semibold text-on-surface mb-1">
                    {t('success.step1Title')}
                  </h4>
                  <p className="font-sans text-sm text-on-surface-variant">
                    {t('success.step1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-primary">
                  2
                </div>
                <div>
                  <h4 className="font-display font-semibold text-on-surface mb-1">
                    {t('success.step2Title')}
                  </h4>
                  <p className="font-sans text-sm text-on-surface-variant">
                    {t('success.step2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-primary">
                  3
                </div>
                <div>
                  <h4 className="font-display font-semibold text-on-surface mb-1">
                    {t('success.step3Title')}
                  </h4>
                  <p className="font-sans text-sm text-on-surface-variant">
                    {t('success.step3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
