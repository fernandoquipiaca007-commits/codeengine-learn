// ============================================
// LevelCard — Level Progress & Benefits
// ============================================

import { motion } from 'motion/react';
import { Trophy, ChevronRight, Zap, Star } from 'lucide-react';
import { usePoints, LEVEL_COLORS, LEVEL_ICONS, LEVEL_ORDER } from '../../hooks/usePoints';

export function LevelCard() {
  const { balance } = usePoints();

  if (!balance) return null;

  const level = balance.level || 'starter';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.starter;
  const icon = LEVEL_ICONS[level] || '⭐';
  const li = balance.levelInfo;

  const benefits: Record<string, string[]> = {
    starter: ['Earn points on every purchase', 'Share referral links', '1x point multiplier'],
    bronze: ['1.2x point multiplier', '5% discount coupon', 'All starter benefits'],
    silver: ['1.5x point multiplier', '10% discount coupon', '3-day early access', 'All bronze benefits'],
    gold: ['2x point multiplier', '20% discount coupon', '7-day early access', 'Exclusive products', 'All silver benefits'],
    platinum: ['3x point multiplier', '30% discount coupon', '14-day early access', 'VIP support', 'Exclusive content', 'All gold benefits'],
  };

  const levelIdx = LEVEL_ORDER.indexOf(level as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl overflow-hidden border border-white/10"
    >
      {/* Level Header */}
      <div className={`p-6 ${colors.bg} relative`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-4xl">{icon}</div>
          <div>
            <p className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              Your Level
            </p>
            <h3 className={`font-display text-2xl font-bold capitalize ${colors.text}`}>
              {level}
            </h3>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="font-mono text-sm font-bold text-secondary">{li?.multiplier || 1}x</span>
          </div>
        </div>

        {/* Progress to next level */}
        {li && !li.isMaxLevel && (
          <div className="mt-4 relative z-10">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>{balance.total_points.toLocaleString()} pts</span>
              <span className="flex items-center gap-1">
                {li.nextThreshold?.toLocaleString()} pts
                <ChevronRight className="w-3 h-3" />
                <span className="capitalize font-semibold">{li.nextLevel}</span>
              </span>
            </div>
            <div className="h-2.5 bg-surface-highest/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${li.progressToNext}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
        {li?.isMaxLevel && (
          <p className="mt-3 text-xs text-cyan-300 font-display tracking-wider uppercase relative z-10">
            ✨ Maximum Level Reached
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="p-5">
        <h4 className="font-display text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Your Benefits
        </h4>
        <ul className="space-y-2">
          {(benefits[level] || []).map((benefit, i) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 text-sm text-on-surface-variant"
            >
              <Star className="w-3 h-3 text-primary flex-shrink-0" />
              {benefit}
            </motion.li>
          ))}
        </ul>

        {/* Level roadmap */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1">
            {LEVEL_ORDER.map((l, i) => (
              <div key={l} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    i <= levelIdx
                      ? `${LEVEL_COLORS[l].bg} ${LEVEL_COLORS[l].border} border`
                      : 'bg-surface-highest/30 border border-white/5'
                  }`}
                >
                  {LEVEL_ICONS[l]}
                </div>
                {i < LEVEL_ORDER.length - 1 && (
                  <div className={`w-4 h-0.5 ${i < levelIdx ? 'bg-primary/50' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
