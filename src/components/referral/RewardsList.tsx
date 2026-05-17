// ============================================
// RewardsList — Available & Locked Rewards
// ============================================

import { motion } from 'motion/react';
import { Gift, Lock, Check, Ticket, Eye, Sparkles, Award } from 'lucide-react';
import { usePoints, LEVEL_COLORS, LEVEL_ICONS, type Reward } from '../../hooks/usePoints';

const REWARD_ICONS: Record<string, typeof Gift> = {
  coupon: Ticket,
  early_access: Eye,
  bonus_points: Sparkles,
  exclusive_offer: Award,
};

export function RewardsList() {
  const { rewards, claimReward } = usePoints();

  if (!rewards.length) return null;

  const available = rewards.filter((r) => r.status === 'available');
  const claimed = rewards.filter((r) => r.status === 'claimed');
  const locked = rewards.filter((r) => r.status === 'locked');

  const handleClaim = async (rewardId: string) => {
    await claimReward(rewardId);
  };

  const renderReward = (reward: Reward, idx: number) => {
    const Icon = REWARD_ICONS[reward.reward_type] || Gift;
    const colors = LEVEL_COLORS[reward.level] || LEVEL_COLORS.starter;
    const levelIcon = LEVEL_ICONS[reward.level] || '⭐';
    const isLocked = reward.status === 'locked';
    const isClaimed = reward.status === 'claimed';

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

        {/* Action */}
        {reward.status === 'available' && (
          <button
            onClick={() => handleClaim(reward.id)}
            className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-surface font-display text-xs font-bold tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            Claim Reward
          </button>
        )}
        {isClaimed && !reward.is_used && (
          <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
            <Check className="w-3 h-3" /> Claimed
          </div>
        )}
        {isLocked && (
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant/30 text-xs">
            <Lock className="w-3 h-3" /> Reach {reward.level} to unlock
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
            <Gift className="w-4 h-4" /> Available Rewards ({available.length})
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
            <Check className="w-4 h-4" /> Claimed ({claimed.length})
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
            <Lock className="w-4 h-4" /> Locked ({locked.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {locked.map((r, i) => renderReward(r, i))}
          </div>
        </div>
      )}
    </div>
  );
}
