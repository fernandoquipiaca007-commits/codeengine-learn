import { motion } from 'motion/react';
import { User, ShoppingBag, Bell, BookOpen, Play } from 'lucide-react';
import { LearningHub } from './LearningHub';
import { useTranslation } from 'react-i18next';
import { LevelCard } from '../referral/LevelCard';
import { RewardsList } from '../referral/RewardsList';
import { ReferralShareCard } from '../referral/ReferralShareCard';

interface MemberDashboardProps {
  memberName: string;
  memberEmail: string;
  purchaseCount: number;
  unreadNotifications: number;
  onOpenCourse: (productId: string, lessonId?: string) => void;
  onOpenEbook: (productId: string) => void;
  onGoToLibrary: () => void;
  onGoToPurchases: () => void;
  onGoToNotifications: () => void;
}

export function MemberDashboard({
  memberName,
  memberEmail,
  purchaseCount,
  unreadNotifications,
  onOpenCourse,
  onOpenEbook,
  onGoToLibrary,
  onGoToPurchases,
  onGoToNotifications,
}: MemberDashboardProps) {
  const { t } = useTranslation('pages');
  
  return (
    <div className="space-y-6 sm:space-y-8 max-w-[min(100%,720px)] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-4 sm:p-8 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-white/20 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-grow">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('memberDashboard.greeting', { name: memberName })}
            </h1>
            <p className="font-sans text-base text-on-surface-variant">{memberEmail}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onGoToPurchases}
          className="glass-panel rounded-xl p-4 border border-white/10 text-left hover:border-primary/30 transition-all"
        >
          <ShoppingBag className="w-6 h-6 text-primary mb-2" />
          <p className="font-mono text-2xl font-bold text-white">{purchaseCount}</p>
          <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.purchases')}</p>
        </button>
        <button
          type="button"
          onClick={onGoToNotifications}
          className="glass-panel rounded-xl p-4 border border-white/10 text-left hover:border-primary/30 transition-all"
        >
          <Bell className="w-6 h-6 text-primary mb-2" />
          <p className="font-mono text-2xl font-bold text-white">{unreadNotifications}</p>
          <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.unread')}</p>
        </button>
      </div>

      <LearningHub
        onOpenCourse={onOpenCourse}
        onOpenEbook={onOpenEbook}
        onGoToLibrary={onGoToLibrary}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-6 py-4 rounded-xl font-display text-sm font-semibold tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          {t('memberDashboard.myLibrary')}
        </button>
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-6 py-4 rounded-xl font-display text-sm font-semibold tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          {t('memberDashboard.myCourses')}
        </button>
      </div>

      {/* Gamification Panel */}
      <div className="space-y-6">
        <LevelCard />
        <ReferralShareCard />
        <RewardsList />
      </div>
    </div>
  );
}
