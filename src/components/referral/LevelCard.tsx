// ============================================
// LevelCard — Level Progress & Benefits
// ============================================

import { motion } from 'motion/react';
import { Trophy, ChevronRight, Zap, Star, Award, Medal, Crown, Gem, Sparkles } from 'lucide-react';
import { usePoints, LEVEL_COLORS, LEVEL_ORDER } from '../../hooks/usePoints';
import { useTranslation } from 'react-i18next';

// Map level names to Lucide icon components
const LEVEL_ICON_COMPONENTS: Record<string, typeof Star> = {
  starter: Star,
  bronze: Award,
  silver: Medal,
  gold: Crown,
  platinum: Gem,
};

export function LevelCard() {
  const { t } = useTranslation('member');
  const { balance } = usePoints();

  if (!balance || typeof balance.available_points !== 'number' || typeof balance.total_points !== 'number') return null;

  const level = balance.level || 'starter';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.starter;
  const LevelIcon = LEVEL_ICON_COMPONENTS[level] || Star;
  const li = balance.levelInfo;

  const benefits: Record<string, string[]> = {
    starter: [
      t('rewardsPanel.benefits.starter.1'),
      t('rewardsPanel.benefits.starter.2'),
      t('rewardsPanel.benefits.starter.3')
    ],
    bronze: [
      t('rewardsPanel.benefits.bronze.1'),
      t('rewardsPanel.benefits.bronze.2'),
      t('rewardsPanel.benefits.bronze.3')
    ],
    silver: [
      t('rewardsPanel.benefits.silver.1'),
      t('rewardsPanel.benefits.silver.2'),
      t('rewardsPanel.benefits.silver.3'),
      t('rewardsPanel.benefits.silver.4')
    ],
    gold: [
      t('rewardsPanel.benefits.gold.1'),
      t('rewardsPanel.benefits.gold.2'),
      t('rewardsPanel.benefits.gold.3'),
      t('rewardsPanel.benefits.gold.4'),
      t('rewardsPanel.benefits.gold.5')
    ],
    platinum: [
      t('rewardsPanel.benefits.platinum.1'),
      t('rewardsPanel.benefits.platinum.2'),
      t('rewardsPanel.benefits.platinum.3'),
      t('rewardsPanel.benefits.platinum.4'),
      t('rewardsPanel.benefits.platinum.5'),
      t('rewardsPanel.benefits.platinum.6')
    ],
  };

  const levelIdx = LEVEL_ORDER.indexOf(level as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl overflow-hidden border border-white/10"
    >
      {/* Level Header */}
      <div className={`p-4 sm:p-5 ${colors.bg} relative`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
            <LevelIcon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="font-display text-[9px] font-semibold tracking-widest uppercase text-on-surface-variant">
              {t('rewardsPanel.yourLevel')}
            </p>
            <h3 className={`font-display text-lg font-bold capitalize ${colors.text}`}>
              {t(`rewardsPanel.levels.${level}`)}
            </h3>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 text-secondary" />
            <span className="font-mono text-xs font-bold text-secondary">{li?.multiplier || 1}x</span>
          </div>
        </div>

        {/* Progress to next level */}
        {li && !li.isMaxLevel && (
          <div className="mt-3.5 relative z-10">
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
              <span>{balance.total_points.toLocaleString()} pts</span>
              <span className="flex items-center gap-0.5">
                {li.nextThreshold?.toLocaleString()} pts
                <ChevronRight className="w-3 h-3" />
                <span className="capitalize font-semibold">{t(`rewardsPanel.levels.${li.nextLevel}`)}</span>
              </span>
            </div>
            <div className="h-2 bg-surface-highest/50 rounded-full overflow-hidden">
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
          <p className="mt-2 text-[10px] text-cyan-300 font-display tracking-wider uppercase relative z-10 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t('rewardsPanel.maximumLevelReached')}
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="p-4">
        <h4 className="font-display text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-2.5 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          {t('rewardsPanel.yourBenefits')}
        </h4>
        <ul className="space-y-1.5">
          {(benefits[level] || []).map((benefit, i) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant"
            >
              <Star className="w-2.5 h-2.5 text-primary flex-shrink-0" />
              {benefit}
            </motion.li>
          ))}
        </ul>

        {/* Level roadmap */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex justify-center items-center gap-1">
            {LEVEL_ORDER.map((l, i) => {
              const LevelRoadmapIcon = LEVEL_ICON_COMPONENTS[l];
              return (
                <div key={l} className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      i <= levelIdx
                        ? `${LEVEL_COLORS[l].bg} ${LEVEL_COLORS[l].border} border`
                        : 'bg-surface-highest/30 border border-white/5'
                    }`}
                  >
                    <LevelRoadmapIcon className={`w-3 h-3 ${i <= levelIdx ? LEVEL_COLORS[l].text : 'text-on-surface-variant/30'}`} />
                  </div>
                  {i < LEVEL_ORDER.length - 1 && (
                    <div className={`w-3.5 h-0.5 ${i < levelIdx ? 'bg-primary/50' : 'bg-white/5'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
