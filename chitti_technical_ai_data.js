/* chitti_technical_ai_data.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * Live market data via Angel One SmartAPI (through chitti-shares-api /api/historical),
 * with an HONEST per-timeframe DEMO fallback (TechEngine.genCandles) so the page works
 * offline and on a cold backend — never a fake "live" badge. Day/Week/Month are
 * backend-aggregated from Angel One. Intraday (4h/1h/15m) falls back to DEMO until the
 * live intraday feed (BO12) is wired — surfaced explicitly, not hidden.
 *
 * window.ChittiTechData.getCandles(symbol, tfs) → Promise<{ byTf, source, liveTfs[], demoTfs[], note }>
 */
(function (root) {
  'use strict';
  // configurable; defaults to the shared shares-api. Override: window.CHITTI_TECH_API = '...'
  function apiBase() { return (root.CHITTI_TECH_API != null ? root.CHITTI_TECH_API : 'https://chitti-shares-api-production.up.railway.app'); }

  // tf → {interval, days} the backend understands (day/week/month aggregated from Angel One)
  var TF_FETCH = {
    monthly: { interval: 'month', days: 2200 },
    weekly:  { interval: 'week',  days: 900 },
    daily:   { interval: 'day',   days: 320 },
    '1h':    { interval: 'hour',  days: 40 },
    '15m':   { interval: '15minute', days: 10 },
    '5m':    { interval: '5minute',  days: 7 }
    // '4h' / '1m' → no reliable backend interval yet → DEMO (honest)
  };

  function nseSym(symbol) { return symbol.indexOf(':') >= 0 ? symbol : ('NSE:' + symbol); }

  function fetchTf(symbol, tf) {
    var spec = TF_FETCH[tf];
    if (!spec || typeof fetch === 'undefined') return Promise.resolve(null);
    var url = apiBase() + '/api/historical?symbol=' + encodeURIComponent(nseSym(symbol)) +
      '&days=' + spec.days + '&interval=' + spec.interval;
    // 6s hard timeout — a slow/hanging backend must NEVER freeze the read; fall back to DEMO
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 6000) : null;
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); return r.ok ? r.json() : null; })
      .then(function (j) {
        var arr = Array.isArray(j) ? j : (j && Array.isArray(j.candles) ? j.candles : null);
        if (!arr || arr.length < 30) return null;
        return arr.map(function (c) {
          return { date: c.date || c.t || null, open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0) };
        }).filter(function (c) { return isFinite(c.close) && c.close > 0; });
      })
      .catch(function () { if (to) clearTimeout(to); return null; });
  }

  function demoTf(symbol, tf) {
    var T = root.TechEngine;
    if (!T || !T.genCandles) return null;
    var n = (tf === 'daily' || tf === '4h' || tf === '1h') ? 260 : 220;
    return T.genCandles(symbol.replace(/^NSE:/, ''), tf, n);
  }

  // fetch each needed TF live; fall back to DEMO per-TF. Honest source label.
  function getCandles(symbol, tfs) {
    tfs = (tfs && tfs.length) ? tfs : ['monthly', 'weekly', 'daily'];
    return Promise.all(tfs.map(function (tf) { return fetchTf(symbol, tf).then(function (live) { return { tf: tf, live: live }; }); }))
      .then(function (results) {
        var byTf = {}, liveTfs = [], demoTfs = [];
        results.forEach(function (r) {
          if (r.live && r.live.length >= 30) { byTf[r.tf] = r.live; liveTfs.push(r.tf); }
          else { byTf[r.tf] = demoTf(symbol, r.tf); demoTfs.push(r.tf); }
        });
        var source = demoTfs.length === 0 ? 'live' : (liveTfs.length === 0 ? 'demo' : 'mixed');
        var note = source === 'live' ? 'LIVE — Angel One (NSE)'
          : source === 'demo' ? 'DEMO data — tap Refresh to fetch live (needs backend)'
          : 'MIXED — ' + liveTfs.join('/') + ' live · ' + demoTfs.join('/') + ' demo (intraday live = BO12)';
        return { byTf: byTf, source: source, liveTfs: liveTfs, demoTfs: demoTfs, note: note };
      })
      .catch(function () {
        // total failure → full DEMO, honestly labelled
        var byTf = {}; tfs.forEach(function (tf) { byTf[tf] = demoTf(symbol, tf); });
        return { byTf: byTf, source: 'demo', liveTfs: [], demoTfs: tfs, note: 'DEMO data — backend unreachable' };
      });
  }

  root.ChittiTechData = { getCandles: getCandles, TF_FETCH: TF_FETCH, apiBase: apiBase };
})(typeof window !== 'undefined' ? window : this);
