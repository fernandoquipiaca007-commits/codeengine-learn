import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { supabase } from '../lib/supabase';

const BUILD_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export function UpdatePrompt() {
  const { t } = useTranslation();
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      checkServerVersion();
    },
  });

  async function checkServerVersion() {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_version')
        .maybeSingle();
      if (data?.value && data.value !== BUILD_VERSION) {
        setServerVersion(data.value);

        // Check if running in installed PWA standalone mode
        const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        if (!isStandalonePWA) {
          console.log('[PWA] Site version mismatch detected. Silent auto-updating...');
          try {
            await updateServiceWorker(true);
            window.location.reload();
          } catch {
            window.location.reload();
          }
          return;
        }

        setShowUpdate(true);
      }
    } catch {
      /* table may not exist yet */
    }
  }

  useEffect(() => {
    if (needRefresh) {
      const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (!isStandalonePWA) {
        console.log('[PWA] Silent auto-updating service worker on website...');
        void handleUpdate();
      } else {
        setShowUpdate(true);
      }
    }
  }, [needRefresh]);

  async function handleUpdate() {
    try {
      await updateServiceWorker(true);
    } catch {}
    setNeedRefresh(false);
    setShowUpdate(false);
    setDismissed(true);
    window.location.reload();
  }

  if (dismissed || (!showUpdate && !needRefresh)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
      >
        <div className="glass-panel rounded-xl p-4 border border-primary/30 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">{t('pwa.updateTitle')}</p>
            <p className="font-sans text-xs text-on-surface-variant">
              {serverVersion ? `v${BUILD_VERSION} → v${serverVersion}` : t('pwa.updateDesc')}
            </p>
          </div>
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-display text-xs font-bold"
          >
            {t('actions.updateNow')}
          </button>
          <button
            onClick={() => {
              setShowUpdate(false);
              setDismissed(true);
            }}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-on-surface-variant font-display text-xs"
          >
            {t('actions.updateLater')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
