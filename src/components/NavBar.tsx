import { useState, useEffect, useRef } from 'react';
import { LucideSearch, Menu, User, LogOut, Heart, ShoppingBag, Bell, Settings, Briefcase, Percent, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { NotificationDropdown } from './NotificationDropdown';
import { PointsBadge } from './referral/PointsBadge';
import { setAppBadgeCount } from '../lib/app-badge';
import { useAuthSession } from '../hooks/useAuthSession';
import { LanguageSelector } from './LanguageSelector';
import { useLocale } from '../contexts/LocaleContext';
import { usePoints } from '../hooks/usePoints';
import { prefetchLibrary } from '../lib/prefetch';

interface NavBarProps {
  currentScreen: string;
  setScreen: (screen: string, section?: string) => void;
  onSearchClick: () => void;
}

// ── Dropdown animation variants ──────────────────────────────
const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.12, ease: 'easeIn' }
  },
} as any;

const mobileMenuVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.14, ease: 'easeIn' }
  },
} as any;

// ── Nav link component ────────────────────────────────────────
function NavLink({
  label,
  active,
  onClick,
  onMouseEnter,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'relative font-display text-[10px] 2xl:text-[11px] font-semibold tracking-widest uppercase',
        'px-1.5 py-1 transition-colors duration-200 whitespace-nowrap',
        active
          ? 'text-primary'
          : 'text-on-surface-variant hover:text-on-surface'
      )}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-active-dot"
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

export function NavBar({ currentScreen, setScreen, onSearchClick }: NavBarProps) {
  const { t } = useTranslation('common');
  const { user } = useAuthSession();
  const { locale } = useLocale();
  const { balance } = usePoints();

  const [showProfileMenu, setShowProfileMenu]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu]     = useState(false);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [avatarUrl, setAvatarUrl]               = useState<string | null>(null);
  const [collabStatus, setCollabStatus]         = useState<string>('not_applied');

  // ── Scroll behaviour ─────────────────────────────────────────
  const [scrolled, setScrolled]   = useState(false);
  const [visible, setVisible]     = useState(true);
  const lastScrollY               = useRef(0);
  const scrollDelta               = useRef(0);

  useEffect(() => {
    const HIDE_THRESHOLD   = 80;   // px scrolled before hide triggers
    const SCROLL_THRESHOLD = 60;   // accumulated delta before hiding
    const SHOW_THRESHOLD   = 12;   // accumulated delta before revealing

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      // Scrolled state (compact navbar)
      setScrolled(y > 24);

      // Accumulate delta
      scrollDelta.current += delta;

      if (y > HIDE_THRESHOLD) {
        if (scrollDelta.current > SCROLL_THRESHOLD) {
          // Scrolling down — hide
          setVisible(false);
          scrollDelta.current = 0;
        } else if (scrollDelta.current < -SHOW_THRESHOLD) {
          // Scrolling up — reveal
          setVisible(true);
          scrollDelta.current = 0;
        }
      } else {
        // Near top — always visible
        setVisible(true);
        scrollDelta.current = 0;
      }

      lastScrollY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const memberLevel = balance?.level ?? 'starter';
  const isLoggedIn = !!user;

  const handleLibraryHover = () => {
    prefetchLibrary(locale, memberLevel, isLoggedIn);
  };

  // ── Avatar ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setAvatarUrl(null); return; }

    const loadAvatar = async () => {
      try {
        const { data } = await supabase
          .from('members')
          .select('profile_data')
          .eq('auth_id', user.id)
          .maybeSingle();
        setAvatarUrl(data?.profile_data?.avatar_url ?? null);
      } catch (err) {
        console.error('Error loading avatar in navbar:', err);
      }
    };
    void loadAvatar();

    const channel = supabase
      .channel(`navbar-avatar-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'members', filter: `auth_id=eq.${user.id}` },
        (payload: any) => {
          setAvatarUrl(payload.new?.profile_data?.avatar_url ?? null);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Collaborator status ──────────────────────────────────────
  useEffect(() => {
    if (!user) { setCollabStatus('not_applied'); return; }

    const fetchCollabStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.srv1739567.hstgr.cloud';
        const res = await fetch(`${BACKEND_URL}/api/collaborators/status`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (data.success) setCollabStatus(data.status);
      } catch (err) {
        console.error('Error fetching collaborator status in navbar:', err);
      }
    };
    void fetchCollabStatus();
  }, [user]);

  // ── Notification count ───────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const syncUnread = async () => {
      if (!user?.id) { setUnreadCount(0); await setAppBadgeCount(0); return; }
      channel = await loadUnreadCount(user.id);
      if (cancelled && channel) supabase.removeChannel(channel);
    };
    void syncUnread();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Mobile scroll lock not needed (dropdown style)
  useEffect(() => {}, [showMobileMenu]);

  async function loadUnreadCount(userId: string) {
    try {
      const { data: member } = await supabase
        .from('members').select('id').eq('auth_id', userId).maybeSingle();
      if (!member) return null;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('read_status', false);
      if (error) throw error;

      const unread = count ?? 0;
      setUnreadCount(unread);
      void setAppBadgeCount(unread);

      const channel = supabase
        .channel(`notifications-${member.id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `member_id=eq.${member.id}` },
          () => { setUnreadCount(p => { const n = p + 1; void setAppBadgeCount(n); return n; }); }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `member_id=eq.${member.id}` },
          (payload: any) => {
            if (payload.new.read_status && !payload.old.read_status) {
              setUnreadCount(p => { const n = Math.max(0, p - 1); void setAppBadgeCount(n); return n; });
            }
          }
        );
      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn('Notifications realtime channel error');
      });
      return channel;
    } catch (error) {
      console.error('Error loading unread count:', error);
      return null;
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    setScreen('home');
  };

  const closeAll = () => {
    setShowProfileMenu(false);
    setShowNotifications(false);
    setShowMobileMenu(false);
  };

  // ── Nav links config ─────────────────────────────────────────
  const navLinks = [
    { label: t('nav.home'),     screen: 'home' },
    { label: t('nav.library'),  screen: 'library',  onHover: handleLibraryHover },
    { label: t('nav.releases'), screen: 'releases' },
    { label: t('nav.news'),     screen: 'news' },
    { label: t('nav.about'),    screen: 'about' },
    { label: t('nav.contact'),  screen: 'contact' },
  ];

  return (
    <>
      {/* ── Docked Header Navbar ────────────────────────────────── */}
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex flex-nowrap justify-between items-center w-full rounded-none',
          'transition-[padding,box-shadow,background,border-color] duration-300',
          'px-6 md:px-12 shadow-none',
          scrolled
            ? 'py-2 bg-[#050505]/75 backdrop-blur-[6px] border-b border-white/5'
            : 'py-3.5 bg-transparent border-b border-transparent'
        )}
      >
        <div className="nav-beam" />

        {/* ── Logo ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 cursor-pointer flex-shrink-0 min-w-0"
          onClick={() => setScreen('home')}
        >
          <img
            src="/logo.png"
            alt="Logo"
            className={cn(
              'w-auto object-contain flex-shrink-0 transition-all duration-300',
              scrolled ? 'h-4 sm:h-5' : 'h-5 sm:h-6'
            )}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className={cn(
            'hidden md:inline font-display font-bold tracking-tighter text-on-surface whitespace-nowrap transition-all duration-300',
            scrolled ? 'text-xs' : 'text-sm'
          )}>
            CodeEngine 1
          </span>
        </div>

        {/* ── Desktop Nav Links ───────────────────────────────── */}
        <div className="hidden xl:flex items-center gap-2 2xl:gap-4 flex-shrink min-w-0">
          {navLinks.map(link => (
            <NavLink
              key={link.screen}
              label={link.label}
              active={currentScreen === link.screen}
              onClick={() => setScreen(link.screen)}
              onMouseEnter={link.onHover}
            />
          ))}
        </div>

        {/* ── Right Side Actions ──────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
          <LanguageSelector variant="dropdown" className="hidden lg:block flex-shrink-0" />

          {/* Search */}
          <button
            onClick={onSearchClick}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5 flex-shrink-0"
            title={t('nav.search')}
          >
            <LucideSearch className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
          </button>

          {user ? (
            <>
              {/* Points badge */}
              <div className="flex-shrink-0">
                <PointsBadge onClick={() => setScreen('member', 'recompensas')} />
              </div>

              {/* Notification bell */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => { setShowNotifications(v => !v); setShowProfileMenu(false); }}
                  className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5"
                >
                  <Bell className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center border-[1.5px] border-surface shadow-lg animate-pulse">
                      <span className="font-display text-[8px] sm:text-[9px] font-bold text-white leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <NotificationDropdown
                        userId={user.id}
                        onNavigate={(screen) => { setScreen(screen); setShowNotifications(false); }}
                        onClose={() => setShowNotifications(false)}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile avatar */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => { setShowProfileMenu(v => !v); setShowNotifications(false); }}
                  className={cn(
                    'rounded-full overflow-hidden border-2 transition-all flex items-center justify-center flex-shrink-0',
                    'border-transparent hover:border-primary/60',
                    'shadow-[0_0_12px_rgba(255,255,255,0.12)] hover:shadow-[0_0_20px_rgba(192,193,255,0.3)]',
                    scrolled ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
                  )}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-on-surface text-background hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors">
                      <User className="w-4 h-4 flex-shrink-0" />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                          'fixed left-1/2 top-16 sm:top-[4.5rem] z-50',
                          'w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2',
                          'md:absolute md:left-auto md:top-full md:mt-2 md:right-0 md:translate-x-0 md:w-60 md:max-w-none',
                          'rounded-2xl border border-white/10 p-2',
                          'bg-surface/96 backdrop-blur-2xl',
                          'shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_0_1px_rgba(192,193,255,0.06)]',
                          'max-h-[calc(100vh-5rem)] overflow-y-auto'
                        )}
                      >
                        {/* User info */}
                        <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                          <p className="font-display text-xs font-semibold text-white truncate">
                            {user.email}
                          </p>
                          <p className="font-sans text-[10px] text-on-surface-variant mt-0.5">
                            {t('profile.memberSince')}
                          </p>
                        </div>

                        {/* Menu items */}
                        {[
                          { label: t('profile.memberArea'),    screen: 'member',   section: 'inicio',       icon: User },
                          { label: t('profile.myLibrary'),     screen: 'member',   section: 'biblioteca',   icon: Heart,        hover: handleLibraryHover },
                          { label: t('profile.myPurchases'),   screen: 'member',   section: 'compras',      icon: ShoppingBag },
                          { label: t('profile.notifications'), screen: 'member',   section: 'notificacoes', icon: Bell },
                          { label: t('profile.settings'),      screen: 'settings', section: undefined,      icon: Settings },
                        ].map(({ label, screen, section, icon: Icon, hover }) => (
                          <button
                            key={label}
                            onClick={() => { setScreen(screen, section); setShowProfileMenu(false); }}
                            onMouseEnter={hover}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left font-sans text-xs text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                            <span className="truncate">{label}</span>
                          </button>
                        ))}

                        {/* Affiliates + Collaborator */}
                        <div className="border-t border-white/8 mt-1 pt-1">
                          <button
                            onClick={() => { setScreen('afiliados'); setShowProfileMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left font-sans text-xs text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                          >
                            <Percent className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                            <span className="truncate font-medium">Programa de Afiliados</span>
                          </button>
                          <button
                            onClick={() => {
                              setScreen(collabStatus === 'approved' ? 'colaborador' : 'colaborador-candidatura');
                              setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left font-sans text-xs text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                          >
                            <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                            <span className="truncate font-medium">
                              {collabStatus === 'approved' ? 'Painel do Criador' : 'Seja um Colaborador'}
                            </span>
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-white/10 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left font-sans text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{t('profile.logout')}</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(v => !v)}
                className="xl:hidden text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5 flex-shrink-0"
                aria-label={t('nav.openMenu')}
              >
                {showMobileMenu
                  ? <X className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
                  : <Menu className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
                }
              </button>
            </>
          ) : (
            // Guest
            <>
              <button
                onClick={() => setScreen('auth')}
                className="hidden lg:block font-display text-[10px] xl:text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => setScreen('signup')}
                className="font-display text-[10px] xl:text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full bg-on-surface text-background hover:bg-primary hover:text-on-primary transition-all shadow-[0_0_12px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(192,193,255,0.35)] flex-shrink-0 whitespace-nowrap"
              >
                <span className="hidden lg:inline">{t('nav.becomeMember')}</span>
                <span className="lg:hidden">{t('nav.signIn')}</span>
              </button>
              <button
                onClick={() => setShowMobileMenu(v => !v)}
                className="xl:hidden text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5 flex-shrink-0"
                aria-label={t('nav.openMenu')}
              >
                {showMobileMenu
                  ? <X className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
                  : <Menu className="w-[18px] sm:w-5 h-[18px] sm:h-5" />
                }
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMobileMenu(false)}
            />

            <motion.div
              key="mobile-menu"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2',
                'rounded-2xl border border-white/10 p-2',
                'bg-surface/97 backdrop-blur-2xl',
                'shadow-[0_24px_64px_rgba(0,0,0,0.75)]',
                'max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar',
                scrolled ? 'top-14 sm:top-[3.5rem]' : 'top-16 sm:top-[4.5rem]'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
                <span className="font-display text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {t('nav.menu')}
                </span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-white/5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="space-y-0.5">
                {navLinks.map((item, i) => (
                  <motion.button
                    key={item.screen}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => { setScreen(item.screen); setShowMobileMenu(false); }}
                    onMouseEnter={item.onHover}
                    className={cn(
                      'w-full text-left rounded-xl px-4 py-3 font-sans text-sm font-medium transition-all flex items-center justify-between',
                      currentScreen === item.screen
                        ? 'bg-primary/8 text-primary border-l-2 border-primary pl-[calc(1rem-2px)]'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/4'
                    )}
                  >
                    <span>{item.label}</span>
                    {currentScreen === item.screen && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Language */}
              <div className="border-t border-white/8 mt-2 pt-2 px-3 flex items-center justify-between">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  {t('settings.language')}
                </span>
                <LanguageSelector variant="dropdown" />
              </div>

              {/* Sign in (guest only) */}
              {!user && (
                <div className="border-t border-white/8 mt-2 pt-2">
                  <button
                    onClick={() => { setScreen('auth'); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>{t('profile.signInOrCreate')}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
