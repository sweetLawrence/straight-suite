/* Push alerts: shown even when the app is closed. Loaded by the app's service worker. */
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Straight', body: event.data ? event.data.text() : '' }; }
  var critical = data.severity === 'critical';
  var warning = data.severity === 'warning';
  event.waitUntil(
    self.registration.showNotification(data.title || 'Straight', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      tag: data.tag || 'straight',
      renotify: true,
      timestamp: data.at || Date.now(),
      vibrate: critical ? [300, 120, 300, 120, 300] : warning ? [200, 100, 200] : [120],
      requireInteraction: critical,
      silent: !critical && !warning,
      actions: [{ action: 'open', title: 'Open' }],
      data: { url: data.url || '/notifications' }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      // Prefer the window the person is looking at, then any open window, else open a new one
      var pick = list.find(function (c) { return c.focused; }) || list.find(function (c) { return c.visibilityState === 'visible'; }) || list[0];
      if (pick && 'focus' in pick) {
        return pick.focus().then(function (c) { return c && 'navigate' in c ? c.navigate(url) : c; });
      }
      return self.clients.openWindow(url);
    })
  );
});
