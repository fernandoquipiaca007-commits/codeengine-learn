import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, ShoppingBag, Download, Gift, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  link_url?: string | null;
  read_status: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  memberId: string;
  onNavigate?: (screen: string, productId?: string) => void;
}

export function NotificationPanel({ memberId, onNavigate }: NotificationPanelProps) {
  console.log('NotificationPanel rendered with memberId:', memberId);
  
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [memberId]);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      if (!memberId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.message || t('notificationPanel.error'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel(`notifications-realtime-${memberId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `member_id=eq.${memberId}`,
        },
        () => void loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_status: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter((n) => !n.read_status).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="w-5 h-5 text-primary" />;
      case 'download':
        return <Download className="w-5 h-5 text-secondary" />;
      case 'promotion':
        return <Gift className="w-5 h-5 text-tertiary-container" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-on-surface-variant" />;
      default:
        return <Bell className="w-5 h-5 text-on-surface-variant" />;
    }
  }

  function handleNotificationClick(notification: Notification) {
    void markAsRead(notification.id);

    if (!notification.link_url || !onNavigate) return;

    try {
      const url = new URL(notification.link_url, window.location.origin);
      let productId = url.searchParams.get('productId') || url.searchParams.get('id');
      let newsId = url.searchParams.get('newsId');
      let screen = url.searchParams.get('screen');

      // Check pathnames
      if (url.pathname.includes('/product/')) {
        productId = url.pathname.split('/product/')[1]?.split(/[?#/]/)[0];
        screen = 'product';
      } else if (url.pathname.includes('/news/')) {
        newsId = url.pathname.split('/news/')[1]?.split(/[?#/]/)[0];
        screen = 'news';
      } else if (!screen) {
        screen = url.pathname.replace(/^\//, '') || 'library';
      }

      if (productId) {
        onNavigate('product', productId);
      } else if (newsId) {
        sessionStorage.setItem('pendingNewsId', newsId);
        onNavigate('news');
      } else {
        onNavigate(screen);
      }
    } catch {
      if (notification.link_url.startsWith('product:')) {
        onNavigate('product', notification.link_url.replace('product:', ''));
      } else {
        onNavigate(notification.link_url);
      }
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('notificationPanel.time.now');
    if (diffMins < 60) return t('notificationPanel.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notificationPanel.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notificationPanel.time.daysAgo', { count: diffDays });

    const localeString = i18n.language === 'en' ? 'en-US' : i18n.language === 'fr' ? 'fr-FR' : 'pt-BR';
    return date.toLocaleDateString(localeString, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read_status;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-sans text-sm text-on-surface-variant">{t('notificationPanel.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-red-500/20 bg-red-500/5 min-h-[400px] flex items-center justify-center">
        <div>
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            {t('notificationPanel.error')}
          </h3>
          <p className="font-sans text-base text-on-surface-variant mb-6">
            {error}
          </p>
          <button
            onClick={loadNotifications}
            className="px-6 py-3 rounded-full bg-primary text-on-primary font-display text-sm font-semibold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(192,193,255,0.5)] transition-all"
          >
            {t('notificationPanel.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 glass-panel rounded-lg p-3.5 border border-white/10">
        <div>
          <h2 className="font-display text-sm sm:text-base font-bold text-white mb-0.5">
            {t('notificationPanel.title')}
          </h2>
          <p className="font-sans text-[10px] text-on-surface-variant">
            {unreadCount > 0 ? (
              <>
                <span className="font-semibold text-primary">{unreadCount}</span>{' '}
                {t('notificationPanel.status.unreadCount', { count: unreadCount })}
              </>
            ) : (
              t('notificationPanel.status.allRead')
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded font-display text-[9px] font-semibold tracking-widest uppercase transition-all ${
                filter === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'glass-panel border border-white/10 text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {t('notificationPanel.tabs.all')}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded font-display text-[9px] font-semibold tracking-widest uppercase transition-all ${
                filter === 'unread'
                  ? 'bg-primary text-on-primary'
                  : 'glass-panel border border-white/10 text-on-surface-variant hover:border-primary/30'
              }`}
            >
              {t('notificationPanel.tabs.unread')} {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-2.5 py-1 rounded glass-panel border border-white/10 font-display text-[9px] font-semibold tracking-widest uppercase flex items-center gap-1.5 text-on-surface hover:text-primary hover:border-primary/30 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {t('notificationPanel.actions.markAll')}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-8 text-center border border-white/10"
        >
          <Bell className="w-10 h-10 text-on-surface-variant mx-auto mb-2 opacity-50" />
          <h3 className="font-display text-sm font-bold text-white mb-1">
            {filter === 'unread' ? t('notificationPanel.empty.unread') : t('notificationPanel.empty.all')}
          </h3>
          <p className="font-sans text-xs text-on-surface-variant">
            {filter === 'unread'
              ? t('notificationPanel.empty.unreadDesc')
              : t('notificationPanel.empty.allDesc')}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.18, delay: index * 0.02 }}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                className={`glass-panel rounded-lg p-2.5 border transition-all group relative cursor-pointer ${
                  notification.read_status
                    ? 'border-white/10 opacity-70'
                    : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.read_status ? 'bg-surface-container' : 'bg-primary/20'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0 pr-8">
                    {notification.title && (
                      <p className="font-display text-xs font-semibold text-white mb-0.5">
                        {notification.title}
                      </p>
                    )}
                    <p className="font-sans text-xs text-on-surface mb-0.5">
                      {notification.message}
                    </p>
                    <p className="font-display text-[9px] font-semibold tracking-widest uppercase text-on-surface-variant">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read_status && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void markAsRead(notification.id);
                        }}
                        className="w-6 h-6 rounded-full bg-surface/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all"
                        title={t('notificationPanel.actions.markAsRead')}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteNotification(notification.id);
                      }}
                      className="w-6 h-6 rounded-full bg-surface/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 hover:border-red-400/50 transition-all"
                      title={t('notificationPanel.actions.delete')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read_status && (
                    <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
