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
        if (isStandalonePWA) {
          setShowUpdate(true);
        } else {
          // For standard browsers, background service worker will handle updates naturally.
          // Never force reload or trigger updates programmatically on database mismatch to prevent loops!
          console.log('[PWA] Site version mismatch detected (DB: %s, Local: %s). Background update check is handled by SW.', data.value, BUILD_VERSION);
        }
      }
    } catch {
      /* table may not exist yet */
    }
  }

  useEffect(() => {
    if (needRefresh) {
      // Check if running in installed PWA standalone mode
      const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (isStandalonePWA) {
        setShowUpdate(true);
      } else {
        // For standard browsers, silently auto-update!
        console.log('[PWA] Standard browser detected, auto-updating in background...');
        void handleUpdate();
      }
    }
  }, [needRefresh]);

  async function handleUpdate() {
    const reloadKey = 'pwa_last_silent_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    
    // Safety guard: only allow one silent PWA reload every 10 seconds to absolutely prevent loops
    if (lastReload && now - parseInt(lastReload, 10) < 10000) {
      console.warn('[PWA] Prevented rapid infinite silent reload loop.');
      setNeedRefresh(false);
      setShowUpdate(false);
      return;
    }
    
    sessionStorage.setItem(reloadKey, now.toString());
    
    try {
      // updateServiceWorker(true) posts a SKIP_WAITING message to the service worker.
      // When the service worker skips waiting, it claims control, triggering the controllerchange event.
      await updateServiceWorker(true);

      // Fallback reload in case the controllerchange event does not fire (e.g. browser compatibility)
      setTimeout(() => {
        console.log('[PWA] Controller change fallback timeout triggered. Reloading page...');
        window.location.reload();
      }, 2500);
    } catch (err) {
      console.error('[PWA] Error activating update service worker:', err);
      window.location.reload();
    }

    setNeedRefresh(false);
    setShowUpdate(false);
    setDismissed(true);
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
