const CACHE_NAME = 'checkin-pwa-v6';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old PWA Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-first strategy for instant app updates
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.method === 'GET' && event.request.url.startsWith('http')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ======================================================
// 🔔 Web Push Notification Event Handlers
// ======================================================
self.addEventListener('push', event => {
  let data = { title: 'ONE UNITED Check-in', body: 'มีการแจ้งเตือนใหม่ในระบบ', url: './' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'มีการแจ้งเตือนใหม่ในระบบ',
    icon: './one123.png',
    badge: './one123.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ONE UNITED Check-in', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
