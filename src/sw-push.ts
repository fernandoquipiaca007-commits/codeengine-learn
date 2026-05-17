/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; icon?: string; badge?: string; data?: { url?: string } } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'CodeEngine Learn', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'CodeEngine Learn', {
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
