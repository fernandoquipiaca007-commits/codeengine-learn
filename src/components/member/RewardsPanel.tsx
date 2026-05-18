import { useEffect, useState } from 'react';
import { Trophy, Star, Gift, TrendingUp, Award, Zap, Medal, Crown, Gem } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePoints, LEVEL_COLORS, LEVEL_NAMES } from '../../hooks/usePoints';
import { ReferralShareCard } from '../referral/ReferralShareCard';
import { LevelCard } from '../referral/LevelCard';
import { RewardsList } from '../referral/RewardsList';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

// Map level names to Lucide icon components
const LEVEL_ICON_COMPONENTS: Record<string, typeof Star> = {
  starter: Star,
  bronze: Award,
  silver: Medal,
  gold: Crown,
  platinum: Gem,
};

interface RewardsPanelProps {
  memberId: string;
}

export function RewardsPanel({ memberId }: RewardsPanelProps) {
  const { t } = useTranslation('member');
  const { balance, transactions, loading, rewards } = usePoints();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Pegar as 5 transações mais recentes
      setRecentActivity(transactions.slice(0, 5));
    }
  }, [transactions]);

  useEffect(() => {
    // After first load completes, mark as loaded
    if (!loading && initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, initialLoad]);

  // Show loading only on initial load
  if (loading && initialLoad) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  const level = balance?.level || 'starter';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.starter;
  const LevelIcon = LEVEL_ICON_COMPONENTS[level] || Star;
  const levelName = LEVEL_NAMES[level] || 'Starter';

  return (
    <div className="space-y-8">
      {/* Card de Nível Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LevelCard />
      </motion.div>

      {/* Compartilhar e Ganhar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ReferralShareCard productId={null} compact={false} />
      </motion.div>

      {/* Lista de Recompensas Disponíveis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RewardsList />
      </motion.div>

      {/* Atividade Recente */}
      {recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {t('rewardsPanel.recentActivity')}
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id || index}
                className="glass-panel rounded-xl p-4 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${
                    activity.points_change > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                  } flex items-center justify-center`}>
                    {activity.points_change > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <Gift className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-white">{activity.description}</p>
                    <p className="font-sans text-xs text-on-surface-variant">
                      {new Date(activity.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className={`font-mono text-lg font-bold ${
                  activity.points_change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {activity.points_change > 0 ? '+' : ''}{activity.points_change}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Como Ganhar Pontos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl p-8 border border-white/10"
      >
        <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          {t('rewardsPanel.howToEarnPoints')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-white">{t('rewardsPanel.buyProducts')}</p>
              <p className="font-sans text-xs text-on-surface-variant">{t('rewardsPanel.buyProductsDesc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-white">{t('rewardsPanel.referFriends')}</p>
              <p className="font-sans text-xs text-on-surface-variant">{t('rewardsPanel.referFriendsDesc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-tertiary-container/20 border border-tertiary-container/30 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-tertiary-container" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-white">{t('rewardsPanel.completeCourses')}</p>
              <p className="font-sans text-xs text-on-surface-variant">{t('rewardsPanel.completeCoursesDesc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-white">{t('rewardsPanel.participateEvents')}</p>
              <p className="font-sans text-xs text-on-surface-variant">{t('rewardsPanel.participateEventsDesc')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
