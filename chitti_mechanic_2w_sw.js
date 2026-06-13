/* Chitti Mechanic 2 Wheeler — offline service worker (CEOS §33 Service Worker / rural-user).
 * Caches the page shell + engine + substrate so a rural/3G user can open it offline.
 * Deterministic engine runs fully client-side, so the app works with no network. */
var CACHE = 'chitti-mech2w-v1';
var ASSETS = [
  'chitti_mechanic_2w.html',
  'chitti_mechanic_2w_engine.js',
  'chitti_lang.js',
  'chitti_a11y.js',
  'feedback-widget.js'
];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (x) {} });
        return res;
      }).catch(function () { return hit; });
    })
  );
});
