// ============================================
// ReferralShareCard — Share Link Component
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Share2, MessageCircle, Mail, Link2 } from 'lucide-react';
import { useReferral } from '../../hooks/useReferral';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../contexts/LocaleContext';

interface ReferralShareCardProps {
  productId?: string;
  compact?: boolean;
}

export function ReferralShareCard({ productId, compact = false }: ReferralShareCardProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('member', { lng: locale });
  const { createLink, getGlobalLink, getShareUrl, myLinks, fetchMyLinks } = useReferral();
  const [link, setLink] = useState<any>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (productId) {
          await fetchMyLinks();
        } else {
          const globalLink = await getGlobalLink();
          if (globalLink) {
            setLink(globalLink);
            setShareUrl(getShareUrl(globalLink.code));
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  // Update shareUrl when myLinks change
  useEffect(() => {
    if (productId && myLinks.length) {
      const existing = myLinks.find((l: any) => l.product_id === productId);
      if (existing) {
        setLink(existing);
        setShareUrl(getShareUrl(existing.code, productId));
      }
    }
  }, [myLinks, productId]);

  const handleCreateLink = async () => {
    setLoading(true);
    setError('');

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('Please log in to generate your referral link');
      setLoading(false);
      return;
    }

    try {
      // Try creating the link (product-specific or global)
      const newLink = await createLink(productId);
      if (newLink) {
        setLink(newLink);
        setShareUrl(getShareUrl(newLink.code, productId));
      } else {
        // Fallback: try getting global link
        const globalLink = await getGlobalLink();
        if (globalLink) {
          setLink(globalLink);
          setShareUrl(getShareUrl(globalLink.code, productId));
        } else {
          setError('Failed to generate link. Please try again.');
        }
      }
    } catch (err) {
      setError('Error generating link. Please try again.');
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = (platform: string) => {
    const text = 'Check this out!';
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`,
    };
    window.open(urls[platform], '_blank');
  };

  if (!link && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`glass-panel rounded-2xl ${compact ? 'p-3' : 'p-6'} border border-white/10`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-on-surface">{t('rewardsPanel.shareAndEarn')}</p>
            <p className="text-xs text-on-surface-variant">{t('rewardsPanel.generateLinkDesc')}</p>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 mb-2 font-sans">{error}</p>
        )}
        <button
          onClick={handleCreateLink}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-surface font-display text-sm font-bold tracking-wide hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
        >
          {loading ? t('rewardsPanel.generating') : t('rewardsPanel.generateLink')}
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className={`glass-panel rounded-2xl ${compact ? 'p-3' : 'p-6'} border border-white/10`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-highest rounded-xl" />
          <div className="flex-1 h-4 bg-surface-highest rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-2xl ${compact ? 'p-3' : 'p-6'} border border-primary/10`}
    >
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-on-surface">{t('rewardsPanel.yourReferralLink')}</p>
            <p className="text-xs text-on-surface-variant">
              {link?.clicks || 0} {t('rewardsPanel.clicks')} · {link?.conversions || 0} {t('rewardsPanel.conversions')}
            </p>
          </div>
        </div>
      )}

      {/* Link Display */}
      <div className="flex items-center gap-2 bg-surface-highest/50 rounded-xl p-2 mb-3">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 bg-transparent text-xs text-on-surface-variant font-mono truncate outline-none"
        />
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg transition-all ${
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('whatsapp')}
          className="flex-1 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="font-display text-xs font-semibold">WhatsApp</span>
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="font-display text-xs font-semibold">𝕏</span>
        </button>
        <button
          onClick={() => handleShare('telegram')}
          className="flex-1 py-2 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="font-display text-xs font-semibold">TG</span>
        </button>
        <button
          onClick={() => handleShare('email')}
          className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
