// ============================================
// RewardsList — Available & Locked Rewards
// ============================================

import { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Lock, Check, Ticket, Eye, Sparkles, Award, Copy, CheckCircle } from 'lucide-react';
import { usePoints, LEVEL_COLORS, LEVEL_ICONS, type Reward } from '../../hooks/usePoints';

const REWARD_ICONS: Record<string, typeof Gift> = {
  coupon: Ticket,
  early_access: Eye,
  bonus_points: Sparkles,
  exclusive_offer: Award,
};

export function RewardsList() {
  const { rewards, claimReward } = usePoints();
  const [claimedCoupons, setClaimedCoupons] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (!rewards.length) return null;

  const available = rewards.filter((r) => r.status === 'available');
  const claimed = rewards.filter((r) => r.status === 'claimed');
  const locked = rewards.filter((r) => r.status === 'locked');

  const handleClaim = async (rewardId: string) => {
    setClaimingId(rewardId);
    try {
      const result = await claimReward(rewardId);
      // If the API returned a coupon code, store it for display
      if (result?.couponCode) {
        setClaimedCoupons((prev) => ({ ...prev, [rewardId]: result.couponCode }));
      }
    } finally {
      setClaimingId(null);
    }
  };

  const copyToClipboard = async (code: string, rewardId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(rewardId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(rewardId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const renderReward = (reward: Reward, idx: number) => {
    const Icon = REWARD_ICONS[reward.reward_type] || Gift;
    const colors = LEVEL_COLORS[reward.level] || LEVEL_COLORS.starter;
    const levelIcon = LEVEL_ICONS[reward.level] || '⭐';
    const isLocked = reward.status === 'locked';
    const isClaimed = reward.status === 'claimed';
    const couponCode = claimedCoupons[reward.id];

    return (
      <motion.div
        key={reward.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className={`glass-panel rounded-xl p-4 border ${
          isLocked
            ? 'border-white/5 opacity-50'
            : isClaimed
              ? 'border-green-500/20'
              : `${colors.border} border-opacity-30`
        } relative overflow-hidden`}
      >
        {/* Level badge */}
        <div className="absolute top-2 right-2 text-xs">{levelIcon}</div>

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${isLocked ? 'bg-surface-highest/30' : colors.bg}`}>
            {isLocked ? (
              <Lock className="w-5 h-5 text-on-surface-variant/30" />
            ) : isClaimed ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Icon className={`w-5 h-5 ${colors.text}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-display text-sm font-semibold ${isLocked ? 'text-on-surface-variant/50' : 'text-on-surface'}`}>
              {reward.description}
            </p>
            <p className={`text-xs mt-0.5 capitalize ${isLocked ? 'text-on-surface-variant/30' : 'text-on-surface-variant'}`}>
              {reward.level} · {reward.reward_type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Coupon code display after claiming */}
        {couponCode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <p className="text-xs text-green-400 font-semibold mb-1.5">
              🎉 Seu cupom foi gerado!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-surface-highest/50 font-mono text-sm text-primary font-bold tracking-wider">
                {couponCode}
              </code>
              <button
                onClick={() => copyToClipboard(couponCode, reward.id)}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                title="Copiar código"
              >
                {copiedId === reward.id ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1.5">
              Use este código no checkout para obter o desconto
            </p>
          </motion.div>
        )}

        {/* Action */}
        {reward.status === 'available' && (
          <button
            onClick={() => handleClaim(reward.id)}
            disabled={claimingId === reward.id}
            className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-surface font-display text-xs font-bold tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {claimingId === reward.id ? 'Liberando...' : 'Liberar Recompensa'}
          </button>
        )}
        {isClaimed && !reward.is_used && !couponCode && (
          <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
            <Check className="w-3 h-3" /> Resgatado
          </div>
        )}
        {isLocked && (
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant/30 text-xs">
            <Lock className="w-3 h-3" /> Alcance o nível {reward.level} para desbloquear
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Available */}
      {available.length > 0 && (
        <div>
          <h4 className="font-display text-xs font-semibold tracking-widest uppercase text-primary mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Recompensas Disponíveis ({available.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((r, i) => renderReward(r, i))}
          </div>
        </div>
      )}

      {/* Claimed */}
      {claimed.length > 0 && (
        <div>
          <h4 className="font-display text-xs font-semibold tracking-widest uppercase text-green-400 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" /> Resgatados ({claimed.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {claimed.map((r, i) => renderReward(r, i))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h4 className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant/50 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Bloqueados ({locked.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((r, i) => renderReward(r, i))}
          </div>
        </div>
      )}
    </div>
  );
}

