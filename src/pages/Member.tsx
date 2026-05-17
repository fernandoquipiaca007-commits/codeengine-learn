import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MemberDashboard } from '../components/member/MemberDashboard';
import { PurchaseHistory } from '../components/member/PurchaseHistory';
import { NotificationPanel } from '../components/member/NotificationPanel';
import { LearningHub } from '../components/member/LearningHub';
import { MyLibrary } from '../components/member/MyLibrary';
import { downloadProduct } from '../lib/download-file';
import { useLocale } from '../contexts/LocaleContext';
import { useTranslation } from 'react-i18next';

const CoursePlayer = lazy(() =>
  import('../components/member/CoursePlayer').then((m) => ({ default: m.CoursePlayer }))
);
const EbookReader = lazy(() =>
  import('../components/member/EbookReader').then((m) => ({ default: m.EbookReader }))
);

interface MemberProps {
  setScreen: (screen: string, section?: string) => void;
  onProductClick?: (productId: string) => void;
  initialSection?: string;
}

type Section = 'inicio' | 'biblioteca' | 'compras' | 'notificacoes';

type LearnView = {
  type: 'course' | 'ebook';
  productId: string;
  lessonId?: string;
};

const LEGACY_SECTION: Record<string, Section> = {
  dashboard: 'inicio',
  purchases: 'compras',
  downloads: 'biblioteca',
  favorites: 'biblioteca',
  notifications: 'notificacoes',
  inicio: 'inicio',
  biblioteca: 'biblioteca',
  compras: 'compras',
  notificacoes: 'notificacoes',
};

function parseInitial(section: string): { tab: Section; learn: LearnView | null } {
  if (section.startsWith('learn:course:')) {
    const [, , productId, lessonId] = section.split(':');
    return { tab: 'inicio', learn: { type: 'course', productId, lessonId } };
  }
  if (section.startsWith('learn:ebook:')) {
    const [, , productId] = section.split(':');
    return { tab: 'inicio', learn: { type: 'ebook', productId } };
  }
  return { tab: LEGACY_SECTION[section] || 'inicio', learn: null };
}

export function Member({ setScreen, onProductClick, initialSection = 'inicio' }: MemberProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const parsed = parseInitial(initialSection);
  const [currentSection, setCurrentSection] = useState<Section>(parsed.tab);
  const [learnView, setLearnView] = useState<LearnView | null>(parsed.learn);
  const [memberData, setMemberData] = useState<{ id: string; name: string; email: string } | null>(null);
  const [stats, setStats] = useState({
    purchaseCount: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, []);

  useEffect(() => {
    const next = parseInitial(initialSection);
    setCurrentSection(next.tab);
    if (next.learn) setLearnView(next.learn);
  }, [initialSection]);

  async function loadMemberData() {
    setLoading(true);
    try {
      // 1. Check auth session (local, fast)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setScreen('auth');
        return;
      }

      const user = session.user;
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      // 2. Lookup member record
      let { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      // If member not found, wait a moment and retry (trigger may be creating it)
      if (!member) {
        await new Promise(r => setTimeout(r, 1500));
        const { data: retry } = await supabase
          .from('members')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();
        member = retry;
      }

      // If still not found, call backend to create the member record
      if (!member) {
        console.warn('No member record found, calling ensure-member endpoint for:', user.id);
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/ensure-member`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          const data = await response.json();
          if (data.success && data.member) {
            member = {
              id: data.member.id,
              email: data.member.email || user.email,
              profile_data: data.member.profile_data || {},
            };
          }
        } catch (ensureErr) {
          console.error('ensure-member call failed:', ensureErr);
        }
      }

      if (!member || !member.id) {
        console.warn('Could not resolve member record for auth user:', user.id);
        // Show page with limited functionality — user IS authenticated
        setMemberData({
          id: '',
          name: user.email?.split('@')[0] || 'Membro',
          email: user.email || '',
        });
        return;
      }

      setMemberData({
        id: member.id,
        name: member.profile_data?.name || user.email?.split('@')[0] || 'Membro',
        email: member.email || user.email || '',
      });

      await loadStats(member.id);
    } catch (error) {
      console.error('Error loading member data:', error);
      // Only redirect if no session
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (!session) {
        setScreen('auth');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(memberId: string) {
    try {
      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .in('payment_status', ['completed', 'pending']);

      const { count: unreadNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .eq('read_status', false);

      setStats({
        purchaseCount: purchaseCount || 0,
        unreadNotifications: unreadNotifications || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setScreen('home');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async function handleDownload(productId: string) {
    try {
      await downloadProduct(productId, locale);
    } catch (err) {
      console.error('Download failed:', err);
      setCurrentSection('biblioteca');
    }
  }

  function openCourse(productId: string, lessonId?: string) {
    setLearnView({ type: 'course', productId, lessonId });
  }

  function openEbook(productId: string) {
    setLearnView({ type: 'ebook', productId });
  }

  if (loading) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="font-sans text-lg text-on-surface-variant">Carregando área de membros...</p>
        </div>
      </div>
    );
  }

  if (!memberData) return null;

  if (learnView) {
    return (
      <div className="pt-28 pb-32 px-4 sm:px-6 md:px-10 max-w-[min(100%,1100px)] mx-auto min-h-screen page-wrapper">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
          }
        >
          {learnView.type === 'course' ? (
            <CoursePlayer
              productId={learnView.productId}
              initialLessonId={learnView.lessonId}
              onBack={() => setLearnView(null)}
            />
          ) : (
            <EbookReader productId={learnView.productId} onBack={() => setLearnView(null)} />
          )}
        </Suspense>
      </div>
    );
  }

  const tabs: { id: Section; label: string }[] = [
    { id: 'inicio', label: t('member.tabs.home') },
    { id: 'biblioteca', label: t('member.tabs.library') },
    { id: 'compras', label: t('member.tabs.purchases') },
    { id: 'notificacoes', label: t('member.tabs.notifications') },
  ];

  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 md:px-10 max-w-[min(100%,900px)] mx-auto min-h-screen page-wrapper">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{t('member.title')}</h1>
          <p className="font-sans text-sm text-on-surface-variant">{memberData.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 hover:border-red-400/30 transition-all text-on-surface-variant hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-display text-xs font-semibold tracking-widest uppercase">{t('member.logout')}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-2 border border-white/10 mb-8 flex gap-2 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCurrentSection(tab.id);
              if (memberData.id) void loadStats(memberData.id);
            }}
            className={`flex-shrink-0 px-4 py-3 rounded-2xl font-display text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all touch-target ${
              currentSection === tab.id
                ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(192,193,255,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.id === 'notificacoes' && stats.unreadNotifications > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {stats.unreadNotifications}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      <motion.div
        key={currentSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentSection === 'inicio' && (
          <MemberDashboard
            memberName={memberData.name}
            memberEmail={memberData.email}
            purchaseCount={stats.purchaseCount}
            unreadNotifications={stats.unreadNotifications}
            onOpenCourse={openCourse}
            onOpenEbook={openEbook}
            onGoToLibrary={() => setCurrentSection('biblioteca')}
            onGoToPurchases={() => setCurrentSection('compras')}
            onGoToNotifications={() => setCurrentSection('notificacoes')}
          />
        )}

        {currentSection === 'biblioteca' && (
          <MyLibrary
            onOpenCourse={openCourse}
            onOpenEbook={openEbook}
            onDownload={handleDownload}
          />
        )}

        {currentSection === 'compras' && (
          <PurchaseHistory memberId={memberData.id} onDownload={handleDownload} />
        )}

        {currentSection === 'notificacoes' && (
          <NotificationPanel
            memberId={memberData.id}
            onNavigate={(screen, productId) => {
              if (screen === 'product' && productId && onProductClick) {
                onProductClick(productId);
              } else if (screen.startsWith('learn:')) {
                const next = parseInitial(screen);
                if (next.learn) setLearnView(next.learn);
              } else {
                setScreen(screen);
              }
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
