/* chitti_technical_sw.js — Service Worker for Chitti Technical (CEOS BO6.4).
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Offline cache for RURAL / low-bandwidth users (PDF §3 RURAL archetype, Article: Lightweight).
 * IMPORTANT: the HTML document is NETWORK-FIRST so a deploy is never trapped behind a stale cache;
 * static JS assets are cache-first (fast, offline-capable); /api/ is network-first (live data).
 */
var CACHE = 'chitti-tech-v15';
var ASSETS = [
  'chitti_technical.html', 'chitti_technical_engine.js', 'chitti_technical_a11y.js',
  'chitti_technical_i18n.js', 'nse_universe.js', 'chitti_a11y.js', 'feedback-widget.js',
  'chitti_lang.js', 'chitti_features.js', 'chitti_isl.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (a) { return c.add(a).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u;
  try { u = new URL(e.request.url); } catch (_) { return; }
  var isDoc = e.request.mode === 'navigate' || u.pathname.endsWith('chitti_technical.html') || u.pathname.endsWith('/');
  var isApi = u.pathname.indexOf('/api/') >= 0;

  if (isDoc || isApi) {
    // NETWORK-FIRST — always try fresh (avoids the stale-cache trap on the document + keeps live data live).
    e.respondWith(
      fetch(e.request).then(function (resp) {
        if (isDoc) { try { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } catch (_) {} }
        return resp;
      }).catch(function () {
        return caches.match(e.request).then(function (r) { return r || caches.match('chitti_technical.html'); });
      })
    );
    return;
  }

  // STATIC ASSETS — cache-first with background refresh (fast + offline; ?v= query busts on deploy).
  e.respondWith(caches.match(e.request).then(function (r) {
    var net = fetch(e.request).then(function (resp) {
      try { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } catch (_) {}
      return resp;
    }).catch(function () { return r; });
    return r || net;
  }));
});
