/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; icon?: string; badge?: string; image?: string; badgeCount?: number; data?: { url?: string; badgeCount?: number } } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'CodeEngine 1', body: event.data.text() };
  }

  // Set App Badge on PWA icon
  if ('setAppBadge' in navigator) {
    const count = payload.badgeCount || payload.data?.badgeCount || 1;
    (navigator as any).setAppBadge(count).catch(() => {});
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'CodeEngine 1', {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.svg',
      badge: payload.badge || '/icons/icon-192.svg',
      image: payload.image || undefined,
      data: payload.data || { url: '/' },
    } as any)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let url = event.notification.data?.url || '/';

  const swOrigin = self.location.origin;

  // Comprehensive localhost/dev environment URL rewriting
  try {
    const swUrl = new URL(self.location.href);
    const targetUrl = new URL(url, self.location.href);

    // If the target URL is on a local development host but the SW is running on a production host,
    // rewrite the target URL's origin to match the SW origin.
    const devHostnames = ['localhost', '127.0.0.1', '0.0.0.0'];
    const isTargetDev = devHostnames.some(h => targetUrl.hostname === h || targetUrl.hostname.startsWith('192.168.') || targetUrl.hostname.startsWith('10.'));
    const isSwDev = devHostnames.some(h => swUrl.hostname === h || swUrl.hostname.startsWith('192.168.') || swUrl.hostname.startsWith('10.'));

    if (isTargetDev && !isSwDev) {
      targetUrl.protocol = swUrl.protocol;
      targetUrl.host = swUrl.host;
      url = targetUrl.href;
    } else {
      url = targetUrl.href;
    }
  } catch (e) {
    url = new URL('/', swOrigin).href;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle skipWaiting messages from the client to successfully activate the service worker update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

