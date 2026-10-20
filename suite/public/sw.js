// Keeps the launcher itself available offline. /inventory/ and /bookings/ are handled by those apps' own service workers.
const CACHE = 'suite-launcher-v2'
const FILES = ['/', '/index.html', '/config.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())) })
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url)
  if (u.origin !== location.origin || e.request.method !== 'GET') return
  if (!(FILES.includes(u.pathname) || u.pathname.startsWith('/assets/'))) return
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r }).catch(() => caches.match(e.request)))
})
