// ============================================
// ReferralProgress — Progressive Discount Bar
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, TrendingDown, Sparkles, Share2 } from 'lucide-react';
import { useReferral } from '../../hooks/useReferral';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../contexts/LocaleContext';

interface ReferralProgressProps {
  productId: string;
  originalPrice: number;
  onDiscountChange?: (discount: number) => void;
}

export function ReferralProgress({ productId, originalPrice, onDiscountChange }: ReferralProgressProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('common');
  const { getProgress } = useReferral();
  const [progress, setProgress] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ownsProduct, setOwnsProduct] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        // Check if user already owns this product
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (member?.id) {
          const { data: purchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('member_id', member.id)
            .eq('product_id', productId)
            .in('payment_status', ['completed', 'pending'])
            .maybeSingle();
          
          if (purchase) {
            setOwnsProduct(true);
            return; // Don't load progress if they own it
          }
        }

        const p = await getProgress(productId);
        if (p?.success) {
          setProgress(p);
          onDiscountChange?.(p.discount || 0);
        }
      }
    };
    check();
  }, [productId]);

  // Real-time updates
  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel(`ref-progress-${productId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'product_referral_progress',
        filter: `product_id=eq.${productId}`,
      }, async () => {
        const p = await getProgress(productId);
        if (p?.success) {
          if (p.conversions > (progress?.conversions || 0)) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          }
          setProgress(p);
          onDiscountChange?.(p.discount || 0);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [productId, isLoggedIn, progress?.conversions]);

  if (!isLoggedIn || ownsProduct || !progress || progress.goal <= 0) return null;

  const pct = progress.progressPercent || 0;
  const currentPrice = progress.currentPrice ?? originalPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-5 border border-primary/20 relative overflow-hidden"
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-10 bg-primary/10 backdrop-blur-sm rounded-2xl"
          >
            <div className="text-center">
              <Sparkles className="w-10 h-10 text-secondary mx-auto mb-2 animate-bounce" />
              <p className="font-display text-lg font-bold text-primary">+1 Conversion!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-on-surface">{t('product.shareAndSave')}</p>
            <p className="text-xs text-on-surface-variant">{t('product.shareToReduce')}</p>
          </div>
        </div>
        {progress.isFree && (
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-display text-xs font-bold uppercase tracking-wider animate-pulse">
            {t('product.freeWord')}!
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-surface-highest rounded-full overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: pct >= 100
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, var(--primary), var(--secondary))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        {/* Glow effect */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full blur-sm opacity-50"
          style={{ background: 'var(--primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <TrendingDown className="w-3 h-3" />
          <span>{progress.conversions}/{progress.goal} {t('product.conversions')}</span>
        </div>
        <span className="font-mono font-semibold text-primary">{pct}%</span>
      </div>

      {/* Price Display */}
      <div className="mt-3 flex items-center gap-3 pt-3 border-t border-white/5">
        <Gift className="w-5 h-5 text-secondary" />
        <div className="flex items-baseline gap-2">
          {progress.discount > 0 && (
            <span className="font-mono text-sm text-on-surface-variant/50 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
          <span className={`font-mono text-lg font-bold ${progress.isFree ? 'text-green-400' : 'text-primary'}`}>
            {progress.isFree ? t('product.freeWord') : `$${currentPrice.toFixed(2)}`}
          </span>
        </div>
        {progress.discount > 0 && !progress.isFree && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
            -${progress.discount.toFixed(2)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
