const CACHE_NAME = 'chapterly-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API routes: network-first, no cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => null);
      return cached ?? await networkPromise ?? new Response('Offline', { status: 503 });
    })
  );
});
