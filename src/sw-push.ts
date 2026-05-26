/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; icon?: string; badge?: string; badgeCount?: number; data?: { url?: string; badgeCount?: number } } = {};
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
      data: payload.data || { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
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
