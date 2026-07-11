import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushPermissionPrompt() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    let timer: any;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (Notification.permission === 'granted') {
          void subscribe();
          return;
        }

        if (Notification.permission !== 'default') return;

        const dismissed = localStorage.getItem('push_prompt_dismissed');
        if (!dismissed) {
          timer = setTimeout(() => setShow(true), 1500);
        }
      } else {
        setShow(false);
        if (timer) clearTimeout(timer);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  async function subscribe() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const keyRes = await fetch(`${BACKEND_URL}/api/push/vapid-public-key`);
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch(`${BACKEND_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          browser: navigator.userAgent.slice(0, 100),
          language: locale,
        }),
      });

      setShow(false);
    } catch (err) {
      console.error('Push subscribe failed:', err);
    }
  }

  async function handleAllow() {
    try {
      const permission = await new Promise<NotificationPermission>((resolve) => {
        try {
          const p = Notification.requestPermission(resolve);
          if (p && typeof p.then === 'function') {
            p.then(resolve).catch(() => resolve('default'));
          }
        } catch (e) {
          resolve('default');
        }
      });
      
      // Close the modal immediately once the native permission choice is made
      setShow(false);
      
      if (permission === 'granted') {
        // Run subscribe in background without blocking or waiting
        void subscribe();
      }
    } catch (err) {
      console.error('Request permission failed:', err);
      setShow(false);
    }
  }

  function handleDeny() {
    localStorage.setItem('push_prompt_dismissed', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60"
      >
        <div className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-primary/30 text-center">
          <Bell className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-white mb-2">
            {t('actions.allowNotifications')}
          </h3>
          <p className="font-sans text-sm text-on-surface-variant mb-6">
            {t('notifications.newCount', { count: 0 }).replace('0 ', '')}
          </p>
          <motion.div className="flex gap-3">
            <button
              onClick={handleDeny}
              className="flex-1 py-3 rounded-lg border border-white/10 text-on-surface-variant font-display text-sm"
            >
              {t('actions.deny')}
            </button>
            <button
              onClick={handleAllow}
              className="flex-1 py-3 rounded-lg bg-primary text-on-primary font-display text-sm font-bold"
            >
              {t('actions.allow')}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
