// Synapse Professional Service Worker
// Handles push notifications for workout and meal reminders

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for push events
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '💪 Synapse Professional';
  const options = {
    body: data.body || 'È ora di allenarsi!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'synapse-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Apri App' },
      { action: 'dismiss', title: 'Chiudi' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Listen for messages from the main app to schedule notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, tag } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200, 100, 200],
        tag: tag || 'synapse-reminder',
        renotify: true
      });
    }, delay);
  }
});
