/**
 * Chapterly Service Worker — Multi-strategy caching
 *
 * Strategies:
 *  - Static assets (JS/CSS/_next/fonts): Cache-first, long-lived
 *  - Book cover images (covers.openlibrary, books.google): Cache-first, up to 200 entries
 *  - API routes: Network-first, falls back to cached response if offline
 *  - Pages / navigation: Network-first, falls back to offline.html
 */

const STATIC_CACHE  = 'chapterly-static-v2';
const IMAGE_CACHE   = 'chapterly-images-v2';
const API_CACHE     = 'chapterly-api-v2';
const PAGE_CACHE    = 'chapterly-pages-v2';
const ALL_CACHES    = [STATIC_CACHE, IMAGE_CACHE, API_CACHE, PAGE_CACHE];

const OFFLINE_URL   = '/offline.html';
const IMAGE_CACHE_LIMIT = 200;

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/manifest.json']))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trim a cache to at most `limit` entries (FIFO). */
async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > limit) {
    await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
  }
}

/** Network-first; stores successful response in `cacheName`. */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) ?? null;
  }
}

/** Cache-first; populates cache on miss. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return null;
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // ── Static _next assets (JS, CSS, fonts) — cache-first, same origin ────────
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/')) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).then((r) => r ?? fetch(request))
    );
    return;
  }

  // ── Book cover images — cache-first with size cap ──────────────────────────
  if (
    url.hostname === 'covers.openlibrary.org' ||
    url.hostname === 'books.google.com' ||
    url.hostname.endsWith('.googleusercontent.com')
  ) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE).then(async (r) => {
        if (!r) return fetch(request);
        await trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT);
        return r;
      })
    );
    return;
  }

  // Skip other cross-origin requests (Supabase, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // ── API routes — network-first, cached fallback ────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request, API_CACHE).then((r) =>
        r ?? new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // ── Navigation / pages — network-first, offline fallback ──────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).then(async (r) => {
        if (r) return r;
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // ── Other same-origin assets — stale-while-revalidate ─────────────────────
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      }).catch(() => null);
      return cached ?? (await networkPromise) ?? new Response('Offline', { status: 503 });
    })
  );
});
