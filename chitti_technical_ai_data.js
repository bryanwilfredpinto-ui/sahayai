/* chitti_technical_ai_data.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * LIVE market data via chitti-shares-api `/api/candles/{symbol}?timeframe=&days_back=` (the
 * backend fetches Yahoo server-side, DATA_SOURCE="yahoo", CORS-enabled — verified returning
 * real NSE OHLC for TCS/RELIANCE/INFY 2026-06-10). Falls back to the engine's honest DEMO
 * synthesizer per-timeframe ONLY when a TF is unavailable (4h/1h not served) or the backend is
 * down — never a fake "live" badge. 6s hard timeout so a slow backend can't freeze the read.
 *
 * window.ChittiTechData.getCandles(symbol, tfs) → Promise<{ byTf, source, liveTfs[], demoTfs[], note }>
 * window.ChittiTechData.getDaily(symbol, days)   → Promise<{ candles, source }>   (single-TF, for screener/backtest)
 */
(function (root) {
  'use strict';
  function apiBase() { return (root.CHITTI_TECH_API != null ? root.CHITTI_TECH_API : 'https://chitti-shares-api-production.up.railway.app'); }
  // engine tf → backend timeframe + how many bars to pull
  var TF_MAP = { monthly: { tf: 'Monthly', days: 18 }, weekly: { tf: 'Weekly', days: 60 }, daily: { tf: 'Daily', days: 260 }, '15m': { tf: '15min', days: 200 } };
  function plain(symbol) { return String(symbol).replace(/^NSE:/i, '').replace(/\.NS$/i, ''); }

  function fetchTf(symbol, tf) {
    var spec = TF_MAP[tf];
    if (!spec || typeof fetch === 'undefined') return Promise.resolve(null); // 4h/1h unsupported → DEMO
    var url = apiBase() + '/api/candles/' + encodeURIComponent(plain(symbol)) + '?timeframe=' + encodeURIComponent(spec.tf) + '&days_back=' + spec.days;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 7000) : null;
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); return r.ok ? r.json() : null; })
      .then(function (arr) {
        if (!Array.isArray(arr) || arr.length < 8) return null;
        return arr.map(function (c) {
          var t = c.time || c.t || c.date;
          return { date: (typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : t) || null,
                   open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0), t: t };
        }).filter(function (c) { return isFinite(c.close) && c.close > 0; });
      })
      .catch(function () { if (to) clearTimeout(to); return null; });
  }

  function demoTf(symbol, tf) { var T = root.TechEngine; if (!T || !T.genCandles) return null; var n = (tf === 'daily') ? 260 : tf === 'weekly' ? 60 : tf === 'monthly' ? 18 : 200; return T.genCandles(plain(symbol), tf, n); }

  function getCandles(symbol, tfs) {
    tfs = (tfs && tfs.length) ? tfs : ['monthly', 'weekly', 'daily'];
    return Promise.all(tfs.map(function (tf) { return fetchTf(symbol, tf).then(function (live) { return { tf: tf, live: live }; }); }))
      .then(function (results) {
        var byTf = {}, liveTfs = [], demoTfs = [];
        results.forEach(function (r) { if (r.live && r.live.length >= 8) { byTf[r.tf] = r.live; liveTfs.push(r.tf); } else { byTf[r.tf] = demoTf(symbol, r.tf); demoTfs.push(r.tf); } });
        var source = demoTfs.length === 0 ? 'live' : (liveTfs.length === 0 ? 'demo' : 'mixed');
        var note = source === 'live' ? '🟢 LIVE — NSE via Angel/Yahoo (' + liveTfs.join('/') + ')'
          : source === 'demo' ? '🟠 DEMO data — backend unreachable'
          : '🟡 MIXED — ' + liveTfs.join('/') + ' LIVE · ' + demoTfs.join('/') + ' demo (4h/1h not served)';
        return { byTf: byTf, source: source, liveTfs: liveTfs, demoTfs: demoTfs, note: note };
      })
      .catch(function () { var byTf = {}; tfs.forEach(function (tf) { byTf[tf] = demoTf(symbol, tf); }); return { byTf: byTf, source: 'demo', liveTfs: [], demoTfs: tfs, note: '🟠 DEMO data — backend error' }; });
  }

  // single-TF live daily (for screener + backtest); falls back to DEMO daily honestly
  function getDaily(symbol, days) {
    var spec = { tf: 'Daily', days: days || 260 };
    if (typeof fetch === 'undefined') return Promise.resolve({ candles: demoTf(symbol, 'daily'), source: 'demo' });
    var url = apiBase() + '/api/candles/' + encodeURIComponent(plain(symbol)) + '?timeframe=Daily&days_back=' + spec.days;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 7000) : null;
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); return r.ok ? r.json() : null; })
      .then(function (arr) {
        if (!Array.isArray(arr) || arr.length < 8) return { candles: demoTf(symbol, 'daily'), source: 'demo' };
        var candles = arr.map(function (c) { var t = c.time || c.t; return { date: typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : t, open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0), t: t }; }).filter(function (c) { return isFinite(c.close) && c.close > 0; });
        return { candles: candles, source: 'live' };
      })
      .catch(function () { if (to) clearTimeout(to); return { candles: demoTf(symbol, 'daily'), source: 'demo' }; });
  }

  root.ChittiTechData = { getCandles: getCandles, getDaily: getDaily, TF_MAP: TF_MAP, apiBase: apiBase };
})(typeof window !== 'undefined' ? window : this);
