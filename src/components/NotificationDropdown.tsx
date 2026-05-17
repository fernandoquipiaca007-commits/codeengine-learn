import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  type: string;
  message: string;
  read_status: boolean;
  created_at: string;
  thumbnail_url?: string;
  category?: string;
  link_url?: string;
}

interface NotificationDropdownProps {
  userId: string;
  onNavigate: (screen: string, section?: string) => void;
  onClose?: () => void;
}

export function NotificationDropdown({ userId, onNavigate, onClose }: NotificationDropdownProps) {
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `member_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadNotifications() {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!member) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_status).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_status: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  const VALID_SCREENS = new Set([
    'home', 'library', 'product', 'member', 'auth', 'about', 'releases',
    'contact', 'favorites', 'news', 'settings', 'privacy', 'terms', 'licensing', 'support',
  ]);

  function resolveLink(linkUrl: string): { screen: string; productId?: string } | null {
    try {
      if (linkUrl.includes('/product/')) {
        const productId = linkUrl.split('/product/')[1]?.split(/[?#/]/)[0];
        if (productId) return { screen: 'product', productId };
      }
      const path = linkUrl.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '').split('?')[0];
      const screen = path.split('/').filter(Boolean)[0] || path;
      if (VALID_SCREENS.has(screen)) return { screen };
      return null;
    } catch {
      return null;
    }
  }

  async function handleNotificationClick(notification: Notification) {
    await markAsRead(notification.id);
    if (onClose) onClose();

    if (notification.link_url) {
      const resolved = resolveLink(notification.link_url);
      if (resolved?.screen === 'product' && resolved.productId) {
        sessionStorage.setItem('pendingProductId', resolved.productId);
        onNavigate('product');
        return;
      }
      if (resolved?.screen) {
        onNavigate(resolved.screen);
        return;
      }
    }

    switch (notification.type) {
        case 'new_product':
          onNavigate('library');
          break;
        case 'new_news':
          onNavigate('news');
          break;
        case 'new_release':
          onNavigate('releases');
          break;
        case 'promotion':
          onNavigate('library');
          break;
        default:
          onNavigate('member', 'inicio');
      }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('notifications.justNow');
    if (diffInHours < 24) return t('notifications.hoursAgo', { count: diffInHours });
    if (diffInHours < 48) return t('notifications.yesterday');
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'new_product': return 'text-primary';
      case 'promotion': return 'text-green-400';
      case 'update': return 'text-blue-400';
      case 'news': return 'text-purple-400';
      default: return 'text-on-surface-variant';
    }
  };

  const getCategoryLabel = (type: string) => {
    const key = `notifications.categories.${type}` as const;
    return t(key, { defaultValue: t('notifications.categories.default') });
  };

  return (
    <div className="fixed left-1/2 top-20 sm:top-24 z-50 w-[min(100vw-2rem,420px)] -translate-x-1/2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:translate-x-0 sm:w-96 sm:max-w-none max-h-[70vh] sm:max-h-[600px] overlay-premium rounded-2xl sm:rounded-xl shadow-[0_0_60px_rgba(192,193,255,0.25)] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/15 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t('notifications.title')}
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-display text-xs font-semibold">
              {t(unreadCount === 1 ? 'notifications.newCount' : 'notifications.newCount_plural', { count: unreadCount })}
            </span>
          )}
        </div>
        <p className="font-sans text-xs text-on-surface-variant">
          {t('notifications.stayUpdated')}
        </p>
      </div>

      {/* Notifications List */}
      <div className="max-h-[calc(70vh-180px)] sm:max-h-[450px] overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/5 rounded mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display text-sm font-semibold text-white mb-2">
              {t('notifications.empty')}
            </p>
            <p className="font-sans text-xs text-on-surface-variant">
              {t('notifications.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification) => (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 rounded-xl hover:bg-white/5 transition-all text-left group ${
                  !notification.read_status ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail or Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {notification.thumbnail_url ? (
                      <img
                        src={notification.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Bell className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`font-display text-xs font-semibold uppercase tracking-wider ${getCategoryColor(notification.category)}`}>
                        {getCategoryLabel(notification.type)}
                      </span>
                      <span className="font-sans text-xs text-on-surface-variant flex-shrink-0">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="font-sans text-sm text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {notification.message}
                    </p>
                    
                    {!notification.read_status && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="font-sans text-xs text-primary">{t('notifications.new')}</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-white/15 bg-gradient-to-t from-white/5 to-transparent">
          <button
            onClick={() => onNavigate('member', 'notificacoes')}
            className="w-full font-display text-xs font-semibold tracking-widest uppercase text-primary hover:text-white transition-colors text-center"
          >
            {t('notifications.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
}
