self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Mercy T International College', {
    body: payload.body || 'You have a new notification.',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [150, 80, 150],
    tag: payload.tag || 'mic-school-notification',
    renotify: true,
    data: { url: payload.url || '/pages/admin/notifications.html' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/pages/admin/notifications.html', self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
