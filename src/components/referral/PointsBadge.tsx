// ============================================
// PointsBadge — Compact Points/Level Display
// ============================================

import { motion, AnimatePresence } from 'motion/react';
import { usePoints, LEVEL_COLORS, LEVEL_ICONS } from '../../hooks/usePoints';
import { useTranslation } from 'react-i18next';

interface PointsBadgeProps {
  compact?: boolean;
  showPoints?: boolean;
  onClick?: () => void;
}

export function PointsBadge({ compact = true, showPoints = true, onClick }: PointsBadgeProps) {
  const { t } = useTranslation('member');
  const { balance } = usePoints();

  if (!balance) return null;

  const level = balance.level || 'starter';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.starter;
  const icon = LEVEL_ICONS[level] || '⭐';

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} border ${colors.border} ${colors.glow} shadow-sm cursor-pointer transition-all hover:shadow-md`}
        title={t('rewardsPanel.pointsBadgeTooltip', { 
          points: balance.total_points, 
          level: t(`rewardsPanel.levels.${level}`)
        })}
      >
        {showPoints && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={balance.available_points}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              <span className={`font-display text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                {t(`rewardsPanel.levels.${level}`)}
              </span>
              <span className={`font-mono text-sm font-bold ${colors.text}`}>
                {balance.available_points.toLocaleString()}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${colors.bg} border ${colors.border} ${colors.glow} cursor-pointer transition-all hover:shadow-md`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-display text-xs font-bold uppercase tracking-wider ${colors.text}`}>
          {t(`rewardsPanel.levels.${level}`)}
        </p>
        <p className="font-mono text-sm font-semibold text-on-surface">
          {balance.available_points.toLocaleString()} pts
        </p>
      </div>
      {balance.levelInfo && !balance.levelInfo.isMaxLevel && (
        <div className="ml-auto">
          <div className="w-16 h-1.5 bg-surface-highest rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${balance.levelInfo.progressToNext}%` }}
            />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-0.5 text-right">
            → {t(`rewardsPanel.levels.${balance.levelInfo.nextLevel}`)}
          </p>
        </div>
      )}
    </motion.button>
  );
}
