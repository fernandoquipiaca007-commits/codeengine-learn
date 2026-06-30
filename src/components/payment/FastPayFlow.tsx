/**
 * FastPayFlow
 * Multi-step wizard for the FastPay payment process.
 * Steps: Instructions → Redirect → Upload → Waiting
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, ArrowRight, ArrowLeft, ExternalLink, CheckCircle,
  Clock, Smartphone, Upload, Shield, Loader2, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProofUploader } from './ProofUploader';
import { useLocale } from '../../contexts/LocaleContext';

interface FastPayFlowProps {
  product: {
    id: string;
    title: string;
    price: number;
    aoa_price?: number | null;
    fastpay_link?: string | null;
  };
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'instructions' | 'creating' | 'redirect' | 'upload' | 'waiting';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud';

export function FastPayFlow({ product, onClose, onComplete }: FastPayFlowProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('checkout');
  const [step, setStep] = useState<Step>('instructions');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [fastpayLink, setFastpayLink] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(product.aoa_price || product.price);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async () => {
    setStep('creating');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('fastPayFlow.sessionExpired'));
        setStep('instructions');
        return;
      }

      // Read referral code from localStorage
      let referralCode = '';
      try {
        const stored = JSON.parse(localStorage.getItem('ce_referral_code') || 'null');
        if (stored && stored.expiry > Date.now()) {
          referralCode = stored.code;
        }
      } catch (e) {}

      const res = await fetch(`${BACKEND_URL}/api/fastpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          product_id: product.id,
          referral_code: referralCode || undefined
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Handle existing pending order — go directly to upload
        if (data.existing_order_id) {
          setOrderId(data.existing_order_id);
          setFastpayLink(product.fastpay_link || null);
          setStep('redirect');
          return;
        }
        throw new Error(data.error || t('fastPayFlow.createOrderError'));
      }

      setOrderId(data.order_id);
      setFastpayLink(data.fastpay_link);
      setOrderAmount(data.amount);
      setStep('redirect');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fastPayFlow.createOrderGenericError'));
      setStep('instructions');
    }
  };

  const openPaymentLink = () => {
    if (fastpayLink) {
      window.open(fastpayLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUploadComplete = () => {
    setStep('waiting');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-surface rounded-t-2xl">
          <div>
            <h3 className="text-lg font-display font-bold text-on-surface">
              {step === 'instructions' && t('fastPayFlow.titleInstructions')}
              {step === 'creating' && t('fastPayFlow.titleCreating')}
              {step === 'redirect' && t('fastPayFlow.titleRedirect')}
              {step === 'upload' && t('fastPayFlow.titleUpload')}
              {step === 'waiting' && t('fastPayFlow.titleWaiting')}
            </h3>
            <p className="text-sm text-on-surface-variant mt-0.5 truncate">
              {product.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            {['instructions', 'redirect', 'upload', 'waiting'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === s
                    ? 'bg-primary text-on-primary'
                    : ['instructions', 'redirect', 'upload', 'waiting'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-on-surface-variant'
                  }
                `}>
                  {['instructions', 'redirect', 'upload', 'waiting'].indexOf(step) > i
                    ? <CheckCircle className="w-4 h-4" />
                    : i + 1
                  }
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-0.5 rounded ${
                    ['instructions', 'redirect', 'upload', 'waiting'].indexOf(step) > i
                      ? 'bg-green-500'
                      : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* ── STEP: INSTRUCTIONS ── */}
          {step === 'instructions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-orange-400" />
                  <span className="font-display font-bold text-orange-300 text-sm">
                    {t('fastPayFlow.howItWorks')}
                  </span>
                </div>
                <ol className="space-y-2 text-sm text-on-surface-variant list-decimal list-inside">
                  <li>{t('fastPayFlow.step1')}</li>
                  <li>{t('fastPayFlow.step2')}</li>
                  <li>{t('fastPayFlow.step3')}</li>
                  <li>{t('fastPayFlow.step4')}</li>
                </ol>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-on-surface">{t('fastPayFlow.amountToPay')}</p>
                  <p className="text-xl font-display font-bold text-primary">
                    {product.aoa_price ? `${product.aoa_price.toFixed(2)} AOA` : `${product.price.toFixed(2)} Kz`}
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={createOrder}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                           bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-display font-bold
                           hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg
                           shadow-orange-500/20"
              >
                {t('fastPayFlow.continueToPayment')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── STEP: CREATING ── */}
          {step === 'creating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-on-surface-variant">{t('fastPayFlow.creatingOrderMessage')}</p>
            </div>
          )}

          {/* ── STEP: REDIRECT ── */}
          {step === 'redirect' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                {t('fastPayFlow.redirectMessage')}
              </p>

              <button
                onClick={openPaymentLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                           bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-display font-bold
                           hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg
                           shadow-orange-500/20"
              >
                <ExternalLink className="w-5 h-5" />
                {t('fastPayFlow.openPaymentPage')}
              </button>

              {fastpayLink && (
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant mb-1">
                    {t('fastPayFlow.copyLinkLabel')}
                  </p>
                  <code className="text-xs text-primary break-all bg-white/5 px-2 py-1 rounded">
                    {fastpayLink}
                  </code>
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => setStep('upload')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                             border-2 border-primary/30 text-primary font-display font-semibold
                             hover:bg-primary/10 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  {t('fastPayFlow.alreadyPaidAction')}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: UPLOAD ── */}
          {step === 'upload' && orderId && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                {t('fastPayFlow.uploadInstructions')}
              </p>

              <ProofUploader
                orderId={orderId}
                onUploadComplete={handleUploadComplete}
              />

              <button
                onClick={() => setStep('redirect')}
                className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('fastPayFlow.backToPayment')}
              </button>
            </div>
          )}

          {/* ── STEP: WAITING ── */}
          {step === 'waiting' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-display font-bold text-on-surface text-lg text-center">
                  {t('fastPayFlow.proofReceived')}
                </h4>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-display font-semibold text-blue-300 text-sm">
                    {t('fastPayFlow.approvalTitle')}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t('fastPayFlow.approvalDesc')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onComplete?.();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                             bg-primary text-on-primary font-display font-bold
                             hover:bg-primary/90 transition-all"
                >
                  {t('fastPayFlow.understand')}
                </button>
              </div>
            </div>
          )}
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
