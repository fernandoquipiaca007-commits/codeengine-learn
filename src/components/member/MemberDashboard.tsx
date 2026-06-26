import { motion } from 'motion/react';
import { User, ShoppingBag, Bell, BookOpen, Play } from 'lucide-react';
import { LearningHub } from './LearningHub';
import { useTranslation } from 'react-i18next';

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
  memberAvatarUrl?: string;
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
  memberAvatarUrl,
}: MemberDashboardProps) {
  const { t } = useTranslation('pages');
  
  return (
    <div className="space-y-3 max-w-[min(100%,720px)] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-3 sm:p-4 border border-white/10 relative overflow-hidden animate__animated animate__fadeInDown"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-white/20 shadow-lg overflow-hidden flex-shrink-0">
            {memberAvatarUrl ? (
              <img src={memberAvatarUrl} alt={memberName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-grow">
            <h1 className="font-display text-lg sm:text-xl font-bold text-white mb-0.5 animate__animated animate__slideInDown">
              {t('memberDashboard.greeting', { name: memberName })}
            </h1>
            <p className="font-sans text-xs text-on-surface-variant animate__animated animate__fadeInUp">{memberEmail}</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2,
            },
          },
        }}
      >
        <motion.button
          type="button"
          onClick={onGoToPurchases}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-panel rounded-xl p-3 border border-white/10 text-left hover:border-primary/30 transition-all animate__animated animate__slideInUp"
        >
          <ShoppingBag className="w-4.5 h-4.5 text-primary mb-1" />
          <p className="font-mono text-lg font-bold text-white">{purchaseCount}</p>
          <p className="font-display text-[10px] uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.purchases')}</p>
        </motion.button>
        <motion.button
          type="button"
          onClick={onGoToNotifications}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-panel rounded-xl p-3 border border-white/10 text-left hover:border-primary/30 transition-all animate__animated animate__slideInUp"
        >
          <Bell className="w-4.5 h-4.5 text-primary mb-1" />
          <p className="font-mono text-lg font-bold text-white">{unreadNotifications}</p>
          <p className="font-display text-[10px] uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.unread')}</p>
        </motion.button>
      </motion.div>

      <LearningHub
        onOpenCourse={onOpenCourse}
        onOpenEbook={onOpenEbook}
        onGoToLibrary={onGoToLibrary}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-4 py-2.5 rounded-lg font-display text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          {t('memberDashboard.myLibrary')}
        </button>
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-4 py-2.5 rounded-lg font-display text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {t('memberDashboard.myCourses')}
        </button>
      </div>
    </div>
  );
}
