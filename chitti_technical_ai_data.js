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
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 12000) : null;
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
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 12000) : null;
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); return r.ok ? r.json() : null; })
      .then(function (arr) {
        if (!Array.isArray(arr) || arr.length < 8) return { candles: demoTf(symbol, 'daily'), source: 'demo' };
        var candles = arr.map(function (c) { var t = c.time || c.t; return { date: typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : t, open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0), t: t }; }).filter(function (c) { return isFinite(c.close) && c.close > 0; });
        return { candles: candles, source: 'live' };
      })
      .catch(function () { if (to) clearTimeout(to); return { candles: demoTf(symbol, 'daily'), source: 'demo' }; });
  }

  // ───────── chart timeframe dropdown (M/W/D/4h/1h/15m/5m/1m) ─────────
  // Backend serves Monthly/Weekly/Daily/15min/5min LIVE. 4h/1h are DERIVED by resampling 15min
  // (×16, ×4). 1min is not served by the backend and cannot be derived → honest "unavailable".
  var CHART_TF = {
    monthly: { tf: 'Monthly', days: 36 }, weekly: { tf: 'Weekly', days: 160 }, daily: { tf: 'Daily', days: 260 },
    '15m': { tf: '15min', days: 200 }, '5m': { tf: '5min', days: 200 },
    '4h': { from: '15min', days: 200, group: 16 }, '1h': { from: '15min', days: 200, group: 4 }
  };
  function parseCandles(arr) {
    if (!Array.isArray(arr)) return null;
    return arr.map(function (c) { var t = c.time || c.t || c.date; return { date: (typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : t) || null, open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0), t: t }; }).filter(function (c) { return isFinite(c.close) && c.close > 0; });
  }
  function fetchRaw(symbol, backendTf, days) {
    if (typeof fetch === 'undefined') return Promise.resolve(null);
    var url = apiBase() + '/api/candles/' + encodeURIComponent(plain(symbol)) + '?timeframe=' + encodeURIComponent(backendTf) + '&days_back=' + days;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 12000) : null;
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); return r.ok ? r.json() : null; })
      .then(function (arr) { var c = parseCandles(arr); return (c && c.length >= 8) ? c : null; })
      .catch(function () { if (to) clearTimeout(to); return null; });
  }
  function resample(candles, group) {
    var out = []; if (!candles) return out;
    for (var i = 0; i < candles.length; i += group) {
      var slice = candles.slice(i, i + group); if (!slice.length) continue;
      var hi = -Infinity, lo = Infinity, vol = 0;
      slice.forEach(function (c) { if (c.high > hi) hi = c.high; if (c.low < lo) lo = c.low; vol += c.volume || 0; });
      out.push({ date: slice[slice.length - 1].date, open: slice[0].open, high: hi, low: lo, close: slice[slice.length - 1].close, volume: vol, t: slice[slice.length - 1].t });
    }
    return out;
  }
  // chartTf ∈ monthly/weekly/daily/4h/1h/15m/5m/1m → { candles, source: 'live'|'live-derived'|'demo'|'unavailable', note }
  function getChartTf(symbol, chartTf) {
    if (chartTf === '1m') return Promise.resolve({ candles: null, source: 'unavailable', note: '1-minute not served by the data feed' });
    var spec = CHART_TF[chartTf];
    if (!spec) return Promise.resolve({ candles: null, source: 'unavailable', note: chartTf + ' unavailable' });
    if (spec.tf) return fetchRaw(symbol, spec.tf, spec.days).then(function (c) { return c ? { candles: c, source: 'live', note: '🟢 LIVE ' + chartTf } : { candles: demoTf(symbol, chartTf === 'daily' ? 'daily' : '15m'), source: 'demo', note: '🟠 DEMO ' + chartTf }; });
    return fetchRaw(symbol, spec.from, spec.days).then(function (c) { return c ? { candles: resample(c, spec.group), source: 'live-derived', note: '🟢 LIVE ' + chartTf + ' (from 15min)' } : { candles: demoTf(symbol, '15m'), source: 'demo', note: '🟠 DEMO ' + chartTf }; });
  }

  root.ChittiTechData = { getCandles: getCandles, getDaily: getDaily, getChartTf: getChartTf, resample: resample, CHART_TF: CHART_TF, TF_MAP: TF_MAP, apiBase: apiBase };
})(typeof window !== 'undefined' ? window : this);
