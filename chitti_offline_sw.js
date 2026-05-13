/* eslint-disable no-restricted-globals */
/**
 * CHITTI OFFLINE — Service Worker
 *
 * P1 (2026-05-13) — 2G offline mode for rural / low-connectivity users.
 * Co-named with chitti_offline.js (the page-side registrar). Together
 * they implement SAHAYAI_MASTER §5b row "Offline mode for low-
 * connectivity areas" + §5c row "RURAL · 2G mode — works on slow
 * internet."
 *
 * Strategy per request type:
 *
 *   - GET HTML (navigation): network-first with a 4-second budget,
 *     fall back to cached shell. If even the cached shell is missing,
 *     fall back to the offline fallback page (`chitti_offline.html`,
 *     same origin, repo-root).
 *
 *   - GET shared substrate (chitti_a11y.js / chitti_features.js /
 *     chitti_camera.js / chitti_isl_dictionary.json / feedback-widget.js):
 *     stale-while-revalidate. The substrate is the foundation — even an
 *     old copy is better than a blank page.
 *
 *   - GET other same-origin static (css / js / json / png / svg /
 *     audio): cache-first with background refresh.
 *
 *   - All other (API / cross-origin): never cache, never intercept;
 *     pass through transparently so live data + auth stays correct.
 *
 * Versioning: CACHE_VERSION bumps invalidate the entire cache on the
 * next activate. The page-side registrar can also force a refresh by
 * posting `{ type: 'CHITTI_OFFLINE_RESET' }`.
 *
 * Honest stub: this SW never pretends an offline request "succeeded".
 * Cached responses get a `Chitti-Source: offline-cache` response
 * header so the page can show an "Offline reply (cached X ago)" badge.
 */

const CACHE_VERSION = 'v1-2026-05-14';
const SHELL_CACHE = 'chitti-shell-' + CACHE_VERSION;
const STATIC_CACHE = 'chitti-static-' + CACHE_VERSION;
const FALLBACK_PAGE = '/chitti_offline.html';

// Files we pre-cache on install so they're available immediately offline.
// Kept short on purpose — the SW shouldn't try to mirror the whole repo.
const PRECACHE_URLS = [
  FALLBACK_PAGE,
  '/chitti_a11y.js',
  '/chitti_features.js',
  '/chitti_camera.js',
  '/chitti_isl_dictionary.json',
  '/feedback-widget.js',
];

// Substrate scripts → stale-while-revalidate.
const SUBSTRATE_RX = /\/(chitti_a11y|chitti_features|chitti_camera|chitti_offline|feedback-widget)\.js(\?.*)?$/;
const SUBSTRATE_JSON_RX = /\/chitti_isl_dictionary\.json(\?.*)?$/;
// Static assets → cache-first.
const STATIC_RX = /\.(css|js|json|svg|png|webp|jpg|jpeg|gif|woff2?|mp3|ogg)(\?.*)?$/;
// Anything in /api/ — never intercept, never cache. Live data only.
const API_RX = /\/api\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CHITTI_OFFLINE_RESET') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE_URLS).catch(() => {});
    })());
  }
});

function withSourceHeader(resp, source) {
  if (!resp) return resp;
  try {
    const headers = new Headers(resp.headers);
    headers.set('Chitti-Source', source);
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  } catch (_) {
    return resp;
  }
}

async function networkWithBudget(request, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
  try {
    const resp = await fetch(request, { signal: ctrl.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function handleNavigation(event) {
  const request = event.request;
  try {
    const fresh = await networkWithBudget(request, 4000);
    if (fresh && fresh.ok) {
      try {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, fresh.clone()).catch(() => {});
      } catch (_) {}
      return withSourceHeader(fresh, 'network');
    }
    throw new Error('non-ok ' + (fresh && fresh.status));
  } catch (_) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return withSourceHeader(cached, 'offline-cache');
    const fallback = await cache.match(FALLBACK_PAGE);
    if (fallback) return withSourceHeader(fallback, 'offline-fallback');
    return new Response('Offline. Cached shell unavailable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain', 'Chitti-Source': 'offline-no-cache' },
    });
  }
}

async function staleWhileRevalidate(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((resp) => {
    if (resp && resp.ok) {
      cache.put(request, resp.clone()).catch(() => {});
    }
    return resp;
  }).catch(() => null);
  if (cached) {
    event.waitUntil(networkPromise);          // refresh in the background
    return withSourceHeader(cached, 'offline-cache');
  }
  const fresh = await networkPromise;
  if (fresh) return withSourceHeader(fresh, 'network');
  return new Response('Offline. Asset not cached yet.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain', 'Chitti-Source': 'offline-no-cache' },
  });
}

async function cacheFirst(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return withSourceHeader(cached, 'offline-cache');
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return withSourceHeader(fresh, 'network');
  } catch (_) {
    return new Response('Offline. Asset unavailable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain', 'Chitti-Source': 'offline-no-cache' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;            // never intercept POST / PUT / DELETE
  const url = new URL(req.url);

  // Pass through cross-origin AND every /api/ call. Live data must be live.
  if (url.origin !== self.location.origin) return;
  if (API_RX.test(url.pathname)) return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(handleNavigation(event));
    return;
  }
  if (SUBSTRATE_RX.test(url.pathname) || SUBSTRATE_JSON_RX.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
    return;
  }
  if (STATIC_RX.test(url.pathname)) {
    event.respondWith(cacheFirst(event, STATIC_CACHE));
    return;
  }
  // Default: do not intercept (passes through to network).
});
