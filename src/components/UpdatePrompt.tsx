import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * UpdatePrompt — Silent Auto-Update
 *
 * When a new Service Worker is activated, this component silently reloads
 * the page so users always see the latest version without any banner or prompt.
 *
 * Anti-loop guard: only one silent reload per 30 seconds via sessionStorage.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Guard key to prevent infinite reload loops
  const RELOAD_KEY = 'pwa_silent_reload_ts';
  const RELOAD_COOLDOWN_MS = 30_000;

  function safeReload() {
    const last = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();
    if (last && now - parseInt(last, 10) < RELOAD_COOLDOWN_MS) {
      // Already reloaded recently — do nothing to prevent loops
      return;
    }
    sessionStorage.setItem(RELOAD_KEY, now.toString());
    window.location.reload();
  }

  // Triggered by Workbox when it detects a new SW is waiting
  useEffect(() => {
    if (!needRefresh) return;

    // Activate the new SW immediately (posts SKIP_WAITING message),
    // then do a silent reload to serve new assets
    updateServiceWorker(true)
      .then(() => {
        setTimeout(safeReload, 500);
      })
      .catch(() => safeReload());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh]);

  // Triggered directly by the SW after it activates and claims clients
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'SW_ACTIVATED') {
        safeReload();
      }
    }
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component renders nothing — updates happen invisibly
  return null;
}
