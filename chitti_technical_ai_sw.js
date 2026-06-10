/* chitti_technical_ai_sw.js — Service Worker (BO5: works offline / 2G / rural).
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * - App shell cached on install → the page opens with NO network (rural/offline).
 * - Static JS/CSS/PNG: stale-while-revalidate (instant on 2G, refreshes in the background).
 * - /api/candles: network-first with cache fallback → live when online, last-known-good when not
 *   (the page still badges DEMO via the engine if nothing is cached). Never blocks the read.
 */
var CACHE = 'chitti-tech-v3';
var SHELL = [
  './chitti_technical_ai.html',
  './chitti_technical_engine.js',
  './chitti_technical_ai_chart.js',
  './chitti_technical_ai_audio.js',
  './chitti_technical_ai_tipshield.js',
  './chitti_technical_ai_journal.js',
  './chitti_technical_ai_data.js',
  './chitti_technical_ai_app.js',
  './chitti_technical_ai_onboarding.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // best-effort precache — a single 404 must not fail the whole install
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // live candles → network-first, cache the good ones, fall back to cache offline
  if (/\/api\/candles\//.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // same-origin static → stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        var net = fetch(req).then(function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return res; }).catch(function () { return cached; });
        return cached || net;
      })
    );
  }
});
