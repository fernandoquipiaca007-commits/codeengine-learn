// ============================================
// PointsBadge — Compact Points/Level Display
// ============================================

import { motion, AnimatePresence } from 'motion/react';
import { usePoints, LEVEL_COLORS, LEVEL_ICONS } from '../../hooks/usePoints';

interface PointsBadgeProps {
  compact?: boolean;
  showPoints?: boolean;
}

export function PointsBadge({ compact = true, showPoints = true }: PointsBadgeProps) {
  const { balance } = usePoints();

  if (!balance) return null;

  const level = balance.level || 'starter';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.starter;
  const icon = LEVEL_ICONS[level] || '⭐';

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} border ${colors.border} ${colors.glow} shadow-sm cursor-default`}
        title={`${balance.total_points} points · Level ${level}`}
      >
        <span className="text-sm">{icon}</span>
        {showPoints && (
          <AnimatePresence mode="popLayout">
            <motion.span
              key={balance.available_points}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className={`font-mono text-xs font-bold ${colors.text}`}
            >
              {balance.available_points.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${colors.bg} border ${colors.border} ${colors.glow}`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-display text-xs font-bold uppercase tracking-wider ${colors.text}`}>
          {level}
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
            → {balance.levelInfo.nextLevel}
          </p>
        </div>
      )}
    </motion.div>
  );
}
