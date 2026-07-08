import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MemberDashboard } from '../components/member/MemberDashboard';
import { PurchaseHistory } from '../components/member/PurchaseHistory';
import { NotificationPanel } from '../components/member/NotificationPanel';
import { LearningHub } from '../components/member/LearningHub';
import { MyLibrary } from '../components/member/MyLibrary';
import { RewardsPanel } from '../components/member/RewardsPanel';
import { OrderStatusTracker } from '../components/member/OrderStatusTracker';
import { downloadProduct } from '../lib/download-file';
import { useLocale } from '../contexts/LocaleContext';
import { useTranslation } from 'react-i18next';
import { useAuthSession } from '../hooks/useAuthSession';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { CourseDownloadModal } from '../components/CourseDownloadModal';
import { AppLocale } from '../lib/locale';

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
  onLearnViewChange?: (isImmersive: boolean) => void;
}

type Section = 'inicio' | 'biblioteca' | 'compras' | 'notificacoes' | 'recompensas';

type LearnView = {
  type: 'course' | 'ebook';
  productId: string;
  lessonId?: string;
  lang?: any;
};

const LEGACY_SECTION: Record<string, Section> = {
  dashboard: 'inicio',
  purchases: 'compras',
  downloads: 'biblioteca',
  favorites: 'biblioteca',
  notifications: 'notificacoes',
  rewards: 'recompensas',
  inicio: 'inicio',
  biblioteca: 'biblioteca',
  compras: 'compras',
  notificacoes: 'notificacoes',
  recompensas: 'recompensas',
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

export function Member({ setScreen, onProductClick, initialSection = 'inicio', onLearnViewChange }: MemberProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, session, loading: authLoading } = useAuthSession();
  const parsed = parseInitial(initialSection);
  const [currentSection, setCurrentSection] = useState<Section>(parsed.tab);
  const [learnView, setLearnView] = useState<LearnView | null>(parsed.learn);
  const [ebookLangOpen, setEbookLangOpen] = useState(false);
  const [ebookLangAction, setEbookLangAction] = useState<{ type: 'read' | 'download'; productId: string } | null>(null);
  const [ebookAvailableLangs, setEbookAvailableLangs] = useState<AppLocale[]>([]);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseModalProduct, setCourseModalProduct] = useState<{ id: string; title: string } | null>(null);
  const [memberData, setMemberData] = useState<{ id: string; name: string; email: string; avatarUrl?: string } | null>(null);
  const [stats, setStats] = useState({
    purchaseCount: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    onLearnViewChange?.(learnView !== null);
    return () => {
      onLearnViewChange?.(false);
    };
  }, [learnView, onLearnViewChange]);

  useEffect(() => {
    if (authLoading) return;
    void loadMemberData();
  }, [authLoading, user?.id]);

  useEffect(() => {
    const next = parseInitial(initialSection);
    setCurrentSection(next.tab);
    if (next.learn) setLearnView(next.learn);
  }, [initialSection]);

  async function loadMemberData() {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    let currentUser = user;
    let currentSession = session;

    try {
      if (!currentUser) {
        // Double check directly on Supabase to prevent PWA state sync lag redirection loops
        const { data: activeSessionData } = await supabase.auth.getSession();
        if (!activeSessionData?.session) {
          setScreen('auth');
          return;
        }
        currentUser = activeSessionData.session.user;
        currentSession = activeSessionData.session;
      }

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production.up.railway.app';

      // 2. Lookup member record
      let { data: member } = (await withTimeout(
        supabase
          .from('members')
          .select('*')
          .eq('auth_id', currentUser.id)
          .maybeSingle() as any,
        7000
      )) as any;

      // If member not found, wait a moment and retry (trigger may be creating it)
      if (!member) {
        await new Promise(r => setTimeout(r, 1500));
        const { data: retry } = (await withTimeout(
          supabase
            .from('members')
            .select('*')
            .eq('auth_id', currentUser.id)
            .maybeSingle() as any,
          7000
        )) as any;
        member = retry;
      }

      // If still not found, call backend to create the member record
      if (!member) {
        console.warn('No member record found, calling ensure-member endpoint for:', currentUser.id);
        try {
          const response = await fetchWithTimeout(`${BACKEND_URL}/api/auth/ensure-member`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(currentSession?.access_token ? { Authorization: `Bearer ${currentSession.access_token}` } : {}),
            },
          }, 6000);
          const data = await response.json();
          if (data.success && data.member) {
            member = {
              id: data.member.id,
              email: data.member.email || currentUser.email,
              profile_data: data.member.profile_data || {},
            };
          }
        } catch (ensureErr) {
          console.error('ensure-member call failed:', ensureErr);
        }
      }

      if (!member || !member.id) {
        console.warn('Could not resolve member record for auth user:', currentUser.id);
        // Show page with limited functionality — user IS authenticated
        setMemberData({
          id: '',
          name: currentUser.email?.split('@')[0] || 'Membro',
          email: currentUser.email || '',
        });
        return;
      }

      if (seq !== loadSeqRef.current) return;

      setMemberData({
        id: member.id,
        name: member.profile_data?.name || user.email?.split('@')[0] || 'Membro',
        email: member.email || user.email || '',
        avatarUrl: member.profile_data?.avatar_url || '',
      });

      await loadStats(member.id);
    } catch (error) {
      console.error('Error loading member data:', error);
      // Fallback: If we have currentUser, set basic memberData to avoid lock-out
      if (currentUser) {
        setMemberData({
          id: '',
          name: currentUser.email?.split('@')[0] || 'Membro',
          email: currentUser.email || '',
        });
      } else {
        setScreen('auth');
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }

  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
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

  const handleEbookLangSelect = async (selectedLocale: AppLocale) => {
    setEbookLangOpen(false);
    if (!ebookLangAction) return;

    if (ebookLangAction.type === 'read') {
      setLearnView({ type: 'ebook', productId: ebookLangAction.productId, lang: selectedLocale });
    } else {
      try {
        await downloadProduct(ebookLangAction.productId, selectedLocale);
      } catch (err) {
        console.error('Ebook download failed:', err);
      }
    }
    setEbookLangAction(null);
  };

  async function resolveEbookLanguageAction(actionType: 'read' | 'download', productId: string) {
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('file_storage_path, storage_url')
        .eq('id', productId)
        .single();
      
      const { data: translations } = await supabase
        .from('products_translations')
        .select('language, storage_url')
        .eq('product_id', productId);
      
      const available: AppLocale[] = [];
      if (prod?.file_storage_path || prod?.storage_url) {
        available.push('pt');
      }

      if (translations) {
        translations.forEach(t => {
          if (t.storage_url && t.storage_url.trim() !== '') {
            const langCode = t.language as AppLocale;
            if (!available.includes(langCode)) {
              available.push(langCode);
            }
          }
        });
      }

      // Default to pt if none found
      if (available.length === 0) {
        available.push('pt');
      }

      if (available.length === 1) {
        const lang = available[0];
        if (actionType === 'read') {
          setLearnView({ type: 'ebook', productId, lang });
        } else {
          await downloadProduct(productId, lang).catch(() => {});
        }
      } else {
        setEbookAvailableLangs(available);
        setEbookLangAction({ type: actionType, productId });
        setEbookLangOpen(true);
      }
    } catch (err) {
      console.error('Error resolving ebook languages:', err);
      if (actionType === 'read') {
        setLearnView({ type: 'ebook', productId, lang: 'pt' });
      } else {
        await downloadProduct(productId, 'pt').catch(() => {});
      }
    }
  }

  async function handleDownload(productId: string) {
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('product_type, title')
        .eq('id', productId)
        .single();
      
      if (prod?.product_type === 'course') {
        setCourseModalProduct({ id: productId, title: prod.title });
        setCourseModalOpen(true);
      } else if (prod?.product_type === 'ebook') {
        await resolveEbookLanguageAction('download', productId);
      } else {
        await downloadProduct(productId, locale);
      }
    } catch (err) {
      console.error('Download failed:', err);
      await downloadProduct(productId, locale).catch(() => {});
    }
  }

  function openCourse(productId: string, lessonId?: string) {
    setLearnView({ type: 'course', productId, lessonId });
  }

  function openEbook(productId: string) {
    void resolveEbookLanguageAction('read', productId);
  }

  if (loading) {
    return (
      <div className="pt-24 pb-12 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="font-sans text-lg text-on-surface-variant">{t('member:loading')}</p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="pt-24 pb-12 px-6 md:px-16 max-w-[1080px] mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-sans text-base text-on-surface-variant">{t('member:errorLoadingData')}</p>
          <button
            onClick={() => setScreen('auth')}
            className="px-4 py-2 rounded-full border border-white/15 hover:border-primary/50 text-on-surface-variant hover:text-primary transition-colors"
          >
            {t('member:backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  if (learnView) {
    return (
      <div className="w-full min-h-screen bg-black text-white pt-0 pb-16">
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
            <EbookReader productId={learnView.productId} lang={learnView.lang} onBack={() => setLearnView(null)} />
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
    { id: 'recompensas', label: t('member:rewards').toUpperCase() },
  ];

  return (
    <div className="collab-compact-wrapper">
    <div className="pt-20 pb-3 px-3 sm:px-6 max-w-[min(100%,820px)] mx-auto min-h-[calc(100vh-80px)] page-wrapper">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="font-display text-lg font-bold text-white">{t('member.title')}</h1>
          <p className="font-sans text-[10px] text-on-surface-variant">{memberData.email}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-1 border border-white/10 mb-3 flex gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCurrentSection(tab.id);
              if (memberData.id) void loadStats(memberData.id);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-display text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-all touch-target ${
              currentSection === tab.id
                ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(192,193,255,0.2)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.id === 'notificacoes' && stats.unreadNotifications > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
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
            memberAvatarUrl={memberData.avatarUrl}
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
          <div className="space-y-8">
            <OrderStatusTracker />
            <PurchaseHistory memberId={memberData.id} onDownload={handleDownload} />
          </div>
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

        {currentSection === 'recompensas' && (
          <RewardsPanel memberId={memberData.id} />
        )}
      </motion.div>

      <LanguageSelectorModal
        isOpen={ebookLangOpen}
        availableLanguages={ebookAvailableLangs}
        onClose={() => {
          setEbookLangOpen(false);
          setEbookLangAction(null);
        }}
        onSelect={handleEbookLangSelect}
      />

      {courseModalProduct && (
        <CourseDownloadModal
          isOpen={courseModalOpen}
          onClose={() => {
            setCourseModalOpen(false);
            setCourseModalProduct(null);
          }}
          productId={courseModalProduct.id}
          productTitle={courseModalProduct.title}
        />
      )}
    </div>
    </div>
  );
}
