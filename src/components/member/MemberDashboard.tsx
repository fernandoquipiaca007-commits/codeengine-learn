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
    <div className="space-y-2.5 max-w-[min(100%,720px)] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-2.5 sm:p-3 border border-white/10 relative overflow-hidden animate__animated animate__fadeInDown"
      >
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border border-white/20 shadow-lg overflow-hidden flex-shrink-0">
            {memberAvatarUrl ? (
              <img src={memberAvatarUrl} alt={memberName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-grow">
            <h1 className="font-display text-base font-bold text-white mb-0.5 animate__animated animate__slideInDown">
              {t('memberDashboard.greeting', { name: memberName })}
            </h1>
            <p className="font-sans text-[10px] text-on-surface-variant animate__animated animate__fadeInUp">{memberEmail}</p>
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
              staggerChildren: 0.08,
              delayChildren: 0.15,
            },
          },
        }}
      >
        <motion.button
          type="button"
          onClick={onGoToPurchases}
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-panel rounded-lg p-2 border border-white/10 text-left hover:border-primary/30 transition-all animate__animated animate__slideInUp"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-primary mb-0.5" />
          <p className="font-mono text-base font-bold text-white">{purchaseCount}</p>
          <p className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.purchases')}</p>
        </motion.button>
        <motion.button
          type="button"
          onClick={onGoToNotifications}
          variants={{
            hidden: { opacity: 0, y: 15 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-panel rounded-lg p-2 border border-white/10 text-left hover:border-primary/30 transition-all animate__animated animate__slideInUp"
        >
          <Bell className="w-3.5 h-3.5 text-primary mb-0.5" />
          <p className="font-mono text-base font-bold text-white">{unreadNotifications}</p>
          <p className="font-display text-[9px] uppercase tracking-widest text-on-surface-variant">{t('memberDashboard.unread')}</p>
        </motion.button>
      </motion.div>

      <LearningHub
        onOpenCourse={onOpenCourse}
        onOpenEbook={onOpenEbook}
        onGoToLibrary={onGoToLibrary}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-3 py-2 rounded-md font-display text-[10px] font-semibold tracking-widest uppercase flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {t('memberDashboard.myLibrary')}
        </button>
        <button
          type="button"
          onClick={onGoToLibrary}
          className="secondary-btn px-3 py-2 rounded-md font-display text-[10px] font-semibold tracking-widest uppercase flex items-center justify-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          {t('memberDashboard.myCourses')}
        </button>
      </div>
    </div>
  );
}
