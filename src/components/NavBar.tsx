import { useState, useEffect } from 'react';
import { LucideSearch, Menu, User, LogOut, Heart, ShoppingBag, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { NotificationDropdown } from './NotificationDropdown';
import { PointsBadge } from './referral/PointsBadge';
import { setAppBadgeCount } from '../lib/app-badge';

interface NavBarProps {
  currentScreen: string;
  setScreen: (screen: string, section?: string) => void;
  onSearchClick: () => void;
}

export function NavBar({ currentScreen, setScreen, onSearchClick }: NavBarProps) {
  const { t } = useTranslation('common');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUnreadCount(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUnreadCount(session.user.id);
      } else {
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!showMobileMenu) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  async function loadUnreadCount(userId: string) {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!member) return;

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
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileMenu(false);
    setScreen('home');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-nowrap justify-between items-center px-4 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-3.5 md:py-4 bg-surface/80 backdrop-blur-xl rounded-full mt-3 sm:mt-3 lg:mt-4 mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-[95%] lg:w-[90%] max-w-[1280px] border border-white/10 shadow-[0_0_40px_rgba(192,193,255,0.1)] transition-all duration-200">
      <div className="nav-beam"></div>
      
      {/* Logo - Progressive sizing */}
      <div 
        className="font-display text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold tracking-tighter text-on-surface cursor-pointer whitespace-nowrap flex-shrink-0 min-w-0"
        onClick={() => setScreen('home')}
      >
        <span className="inline sm:hidden">CE</span>
        <span className="hidden sm:inline md:hidden">CodeEngine</span>
        <span className="hidden md:inline">CodeEngine Learn</span>
      </div>
      
      {/* Desktop Navigation - Hidden on tablet and below */}
      <div className="hidden xl:flex items-center space-x-4 2xl:space-x-6 flex-shrink min-w-0">
        <button 
          onClick={() => setScreen('home')}
          className={cn(
            "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'home' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.home')}
        </button>
        
        <button 
          onClick={() => setScreen('library')}
          className={cn(
            "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
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
            "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'releases' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.releases')}
        </button>
        
        {user && (
          <button 
            onClick={() => setScreen('news')}
            className={cn(
              "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
              currentScreen === 'news' 
                ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
                : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
            )}
          >
            {t('nav.news')}
          </button>
        )}
        
        <button 
          onClick={() => setScreen('about')}
          className={cn(
            "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
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
            "font-display text-[10px] 2xl:text-xs font-semibold tracking-widest uppercase transition-all duration-200 px-1.5 2xl:px-2 py-1 whitespace-nowrap",
            currentScreen === 'contact' 
              ? "text-primary drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]" 
              : "text-on-surface-variant hover:text-primary hover:drop-shadow-[0_0_8px_rgba(192,193,255,0.5)]"
          )}
        >
          {t('nav.contact')}
        </button>
      </div>
      
      {/* Right Side Actions - Intelligent Progressive Collapse */}
      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5 xl:gap-4 flex-shrink-0 min-w-0">
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
                className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-on-surface text-background hover:bg-primary hover:text-on-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] flex items-center justify-center flex-shrink-0"
              >
                <User className="w-5 sm:w-[22px] md:w-6 h-5 sm:h-[22px] md:h-6 flex-shrink-0" />
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
              className="hidden lg:block font-display text-xs xl:text-sm font-semibold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-all whitespace-nowrap"
            >
              {t('nav.signIn')}
            </button>
            <button 
              onClick={() => setScreen('signup')}
              className="font-display text-xs sm:text-sm font-semibold tracking-widest uppercase px-3 sm:px-4 md:px-5 xl:px-6 py-2 sm:py-2.5 rounded-full bg-on-surface text-background hover:bg-primary hover:text-on-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)] flex-shrink-0 whitespace-nowrap"
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
      
      {/* Mobile Menu Drawer - Intelligent Responsive */}
      {showMobileMenu && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Drawer - Adaptive width */}
          <div className="fixed inset-y-0 right-0 z-[70] h-screen w-[min(90vw,380px)] sm:w-[min(85vw,360px)] md:w-[min(70vw,340px)] rounded-l-2xl sm:rounded-l-[1.75rem] bg-surface/98 backdrop-blur-xl border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent flex-shrink-0">
              <span className="font-display text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-on-surface-variant">{t('nav.menu')}</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-white/5 transition-all"
                aria-label={t('nav.closeMenu')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4">
              
              {/* Navigation Links */}
              <div className="space-y-1.5 sm:space-y-2">
                {[
                  { label: t('nav.home'), screen: 'home' },
                  { label: t('nav.library'), screen: 'library' },
                  { label: t('nav.releases'), screen: 'releases' },
                  ...(user ? [{ label: t('nav.news'), screen: 'news' }] : []),
                  { label: t('nav.about'), screen: 'about' },
                  { label: t('nav.contact'), screen: 'contact' },
                ].map((item) => (
                  <button
                    key={item.screen}
                    onClick={() => {
                      setScreen(item.screen);
                      setShowMobileMenu(false);
                    }}
                    className={cn(
                      "w-full text-left rounded-xl sm:rounded-2xl px-4 py-3.5 sm:py-4 font-sans text-sm sm:text-base font-semibold transition-all",
                      currentScreen === item.screen
                        ? 'bg-primary/15 text-primary shadow-[0_0_20px_rgba(192,193,255,0.15)]'
                        : 'text-on-surface-variant hover:text-primary hover:bg-white/5'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* User Actions - Only show if NOT logged in */}
              {!user && (
                <>
                  <div className="my-4 border-t border-white/10" />
                  <div className="space-y-1.5">
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
          </div>
        </>
      )}
    </nav>
  );
}
