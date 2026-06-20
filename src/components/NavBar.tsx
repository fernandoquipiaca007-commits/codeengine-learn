import { useState, useEffect } from 'react';
import { LucideSearch, Menu, User, LogOut, Heart, ShoppingBag, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

export function NavBar({ currentScreen, setScreen, onSearchClick }: NavBarProps) {
  const { t } = useTranslation('common');
  const { user } = useAuthSession();
  const { locale } = useLocale();
  const { balance } = usePoints();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const memberLevel = balance?.level ?? 'starter';
  const isLoggedIn = !!user;

  const handleLibraryHover = () => {
    prefetchLibrary(locale, memberLevel, isLoggedIn);
  };

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }

    const loadAvatar = async () => {
      try {
        const { data } = await supabase
          .from('members')
          .select('profile_data')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (data?.profile_data?.avatar_url) {
          setAvatarUrl(data.profile_data.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.error('Error loading avatar in navbar:', err);
      }
    };

    void loadAvatar();
    
    // Also listen for any profile changes or uploads to dynamically update
    const channel = supabase
      .channel(`navbar-avatar-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'members',
          filter: `auth_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new?.profile_data?.avatar_url) {
            setAvatarUrl(payload.new.profile_data.avatar_url);
          } else {
            setAvatarUrl(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const syncUnread = async () => {
      if (!user?.id) {
        setUnreadCount(0);
        await setAppBadgeCount(0);
        return;
      }
      channel = await loadUnreadCount(user.id);
      if (cancelled && channel) {
        supabase.removeChannel(channel);
      }
    };

    void syncUnread();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  // Since mobile menu is now a dropdown, we don't lock body scroll
  useEffect(() => {
    // Commented out to allow natural scrolling while dropdown is open
    /*
    if (!showMobileMenu) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
    */
  }, [showMobileMenu]);

  async function loadUnreadCount(userId: string) {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();

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

      // Subscribe to new notifications
      const channel = supabase
        .channel(`notifications-${member.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `member_id=eq.${member.id}`
          },
          () => {
            setUnreadCount(prev => {
              const next = prev + 1;
              void setAppBadgeCount(next);
              return next;
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `member_id=eq.${member.id}`
          },
          (payload: any) => {
            if (payload.new.read_status && !payload.old.read_status) {
              setUnreadCount(prev => {
                const next = Math.max(0, prev - 1);
                void setAppBadgeCount(next);
                return next;
              });
            }
          }
        );
      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Notifications realtime channel error for member:', member.id);
        }
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-nowrap justify-between items-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-surface/80 backdrop-blur-xl rounded-full mt-2 sm:mt-2.5 lg:mt-3 mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-[95%] lg:w-[90%] max-w-[1080px] border border-white/10 shadow-[0_0_40px_rgba(192,193,255,0.1)] transition-all duration-200">
      <div className="nav-beam"></div>
      
      {/* Logo - Brand Icon and Name */}
      <div 
        className="flex items-center gap-2 cursor-pointer flex-shrink-0 min-w-0"
        onClick={() => setScreen('home')}
      >
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="hidden 2xl:inline font-display text-sm sm:text-base md:text-lg font-bold tracking-tighter text-on-surface whitespace-nowrap">
          CodeEngine 1
        </span>
      </div>
      
      {/* Desktop Navigation - Hidden on tablet and below */}
      <div className="hidden xl:flex items-center gap-1 xl:gap-1.5 2xl:gap-3 flex-shrink min-w-0">
        <button 
          onClick={() => setScreen('home')}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'home' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.home')}
        </button>
        
        <button 
          onClick={() => setScreen('library')}
          onMouseEnter={handleLibraryHover}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'library' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.library')}
        </button>
        
        <button 
          onClick={() => setScreen('releases')}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'releases' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.releases')}
        </button>
        
        <button 
          onClick={() => setScreen('news')}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'news' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.news')}
        </button>
        
        <button 
          onClick={() => setScreen('about')}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'about' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.about')}
        </button>
        
        <button 
          onClick={() => setScreen('contact')}
          className={cn(
            "font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase transition-all duration-200 px-1 xl:px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'contact' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.contact')}
        </button>
      </div>
      
      {/* Right Side Actions - Intelligent Progressive Collapse */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0 min-w-0">
        <LanguageSelector variant="dropdown" className="hidden lg:block flex-shrink-0" />
        {/* Search Button - Always visible */}
        <button 
          onClick={onSearchClick}
          className="text-on-surface-variant hover:text-primary transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/5 flex-shrink-0"
          title={t('nav.search')}
        >
          <LucideSearch className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6" />
        </button>
        
        {user ? (
          // Logged in: Progressive display
          <>
            {/* Points Badge - Always visible */}
            <div className="flex-shrink-0">
              <PointsBadge onClick={() => setScreen('member', 'recompensas')} />
            </div>
 
            {/* Notification Bell - Always visible */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative text-on-surface-variant hover:text-primary transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/5"
              >
                <Bell className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] px-1 sm:px-1.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-surface shadow-lg animate-pulse">
                    <span className="font-display text-[9px] sm:text-[10px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <NotificationDropdown
                    userId={user.id}
                    onNavigate={(screen) => {
                      setScreen(screen);
                      setShowNotifications(false);
                    }}
                    onClose={() => setShowNotifications(false)}
                  />
                </>
              )}
            </div>
 
            {/* Profile Button - Always visible but adaptive */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] flex items-center justify-center flex-shrink-0"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-on-surface text-background hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors">
                    <User className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6 flex-shrink-0" />
                  </div>
                )}
              </button>
              
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="fixed left-1/2 top-20 sm:top-24 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 rounded-2xl sm:rounded-xl bg-surface/95 backdrop-blur-xl border border-white/10 p-3 sm:p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)] max-h-[calc(100vh-6rem)] overflow-y-auto md:absolute md:left-auto md:top-full md:mt-2 md:right-0 md:translate-x-0 md:w-64 md:max-w-none">
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/15 bg-gradient-to-b from-white/5 to-transparent">
                      <p className="font-display text-xs sm:text-sm font-semibold text-white truncate">
                        {user.email}
                      </p>
                      <p className="font-sans text-[10px] sm:text-xs text-on-surface-variant mt-1">
                        {t('profile.memberSince')}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setScreen('member', 'inicio');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{t('profile.memberArea')}</span>
                    </button>
 
                    <button
                      onClick={() => {
                        setScreen('member', 'biblioteca');
                        setShowProfileMenu(false);
                      }}
                      onMouseEnter={handleLibraryHover}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Heart className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{t('profile.myLibrary')}</span>
                    </button>
 
                    <button
                      onClick={() => {
                        setScreen('member', 'compras');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <ShoppingBag className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{t('profile.myPurchases')}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setScreen('member', 'notificacoes');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Bell className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{t('profile.notifications')}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setScreen('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Settings className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{t('profile.settings')}</span>
                    </button>
                    
                    <div className="border-t border-white/15 mt-2 pt-2 bg-gradient-to-t from-white/5 to-transparent">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-sans text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{t('profile.logout')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button - Always visible on non-desktop */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden text-on-surface-variant hover:text-primary transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/5 flex-shrink-0"
              aria-label={t('nav.openMenu')}
            >
              <Menu className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6" />
            </button>
          </>
        ) : (
          // Not logged in: Progressive display
          <>
            <button 
              onClick={() => setScreen('auth')}
              className="hidden lg:block font-display text-[10px] xl:text-xs font-semibold tracking-wider uppercase text-on-surface-variant hover:text-primary transition-all whitespace-nowrap"
            >
              {t('nav.signIn')}
            </button>
            <button 
              onClick={() => setScreen('signup')}
              className="font-display text-[9px] xl:text-[10px] 2xl:text-xs font-semibold tracking-wider uppercase px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-full bg-on-surface text-background hover:bg-primary hover:text-on-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] flex-shrink-0 whitespace-nowrap"
            >
              <span className="hidden lg:inline">{t('nav.becomeMember')}</span>
              <span className="lg:hidden">{t('nav.signIn')}</span>
            </button>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden text-on-surface-variant hover:text-primary transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/5 flex-shrink-0"
              aria-label={t('nav.openMenu')}
            >
              <Menu className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6" />
            </button>
          </>
        )}
      </div>
      
      {/* Mobile Menu Dropdown Overlay */}
      {showMobileMenu && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Floating Dropdown - Matching Profile/Notifications */}
          <div className="fixed left-1/2 top-20 sm:top-24 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 rounded-2xl bg-surface/95 backdrop-blur-xl border border-white/10 p-3 sm:p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)] max-h-[calc(100vh-6rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/15 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl mb-2">
              <span className="font-display text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                {t('nav.menu')}
              </span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-white/5 transition-all"
                aria-label={t('nav.closeMenu')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Navigation Links */}
            <div className="space-y-1">
              {[
                { label: t('nav.home'), screen: 'home' },
                { label: t('nav.library'), screen: 'library' },
                { label: t('nav.releases'), screen: 'releases' },
                { label: t('nav.news'), screen: 'news' },
                { label: t('nav.about'), screen: 'about' },
                { label: t('nav.contact'), screen: 'contact' },
              ].map((item) => (
                <button
                  key={item.screen}
                  onClick={() => {
                    setScreen(item.screen);
                    setShowMobileMenu(false);
                  }}
                  onMouseEnter={() => {
                    if (item.screen === 'library') {
                      handleLibraryHover();
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-all flex items-center justify-between",
                    currentScreen === item.screen
                      ? 'bg-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-l-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary hover:bg-white/5'
                  )}
                >
                  <span>{item.label}</span>
                  {currentScreen === item.screen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Language Selector inside mobile menu */}
            <div className="my-2 border-t border-white/10" />
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {t('settings.language')}
              </span>
              <LanguageSelector variant="dropdown" />
            </div>
            
            {/* User Actions - Only show if NOT logged in */}
            {!user && (
              <>
                <div className="my-2 border-t border-white/10" />
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setScreen('auth');
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-sm text-on-surface hover:text-primary hover:bg-white/5 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>{t('profile.signInOrCreate')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
