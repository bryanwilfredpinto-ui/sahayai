/* chitti_technical_ai_chart.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * TradingView/Angel-One-style multi-pane candlestick chart — dependency-free <canvas>.
 *  • Price pane: candles + OVERLAY indicators + S/R / entry / stop / target level lines.
 *  • Separate sub-panes (stacked below) for oscillators.
 * ALL 39 engine indicators are chartable (2026-06-16): 14 price overlays + 26 oscillator panes.
 * Indicators whose engine fn returns only the latest value (Ichimoku · Vortex · Chandelier ·
 * Chande Kroll · Elder Ray · Heikin Ashi · Elder Impulse · TTM Squeeze) are turned into per-bar
 * series by `roll()` (rolling-window call of the EXISTING engine fn — no math re-authored).
 * Accessible: role="img" + spoken aria-label; shipped beside Show-data-table + sonify.
 * window.ChittiTechChart.{ draw, OVERLAYS, PANES, OVERLAY_KEYS, PANE_KEYS, ALL_KEYS }.
 */
(function (root) {
  'use strict';
  function T() { return root.TechEngine; }
  function closes(c) { return c.map(function (x) { return x.close; }); }
  function tail(arr, n) { return arr.slice(arr.length - n); }
  var R2 = function (v) { return Math.round(v * 100) / 100; };

  // Build a per-bar series from an engine fn that only returns the latest value,
  // by calling it on rolling windows candles[0..i]. minN = first index it can produce.
  function roll(candles, minN, fn, pick) {
    var out = new Array(candles.length).fill(null);
    for (var i = Math.max(1, minN); i < candles.length; i++) {
      try { var r = fn(candles.slice(0, i + 1)); if (r == null) continue; var v = pick(r); if (v != null && isFinite(v)) out[i] = v; } catch (e) {}
    }
    return out;
  }

  // ── overlay indicators (drawn ON the price pane). Each returns one or more line series. ──
  var OVERLAYS = {
    'EMA 20': function (c) { return [{ data: T().ema(closes(c), 20), color: '#1565c0', w: 1.4 }]; },
    'EMA 50': function (c) { return [{ data: T().ema(closes(c), 50), color: '#FF9933', w: 1.4 }]; },
    'EMA 200': function (c) { return [{ data: T().ema(closes(c), 200), color: '#7b1fa2', w: 1.6 }]; },
    'Hull MA': function (c) { return [{ data: T().hma(closes(c), 20), color: '#00838f', w: 1.5 }]; },
    'Bollinger Bands': function (c) { var b = T().bollinger(closes(c), 20, 2); return [{ data: b.upper, color: '#8a8a8a', w: 1 }, { data: b.mid, color: '#bbb', w: 1, dash: [3, 3] }, { data: b.lower, color: '#8a8a8a', w: 1 }]; },
    'Keltner Channels': function (c) { var k = T().keltner(c, 20, 2); return [{ data: k.upper, color: '#9c27b0', w: 1 }, { data: k.mid, color: '#ce93d8', w: 1, dash: [3, 3] }, { data: k.lower, color: '#9c27b0', w: 1 }]; },
    'Donchian Channels': function (c) { var d = T().donchian(c, 20); return [{ data: d.map(function (x) { return x ? x.upper : null; }), color: '#5d4037', w: 1 }, { data: d.map(function (x) { return x ? x.lower : null; }), color: '#5d4037', w: 1 }]; },
    'VWAP': function (c) { return [{ data: T().vwapRolling(c, 20), color: '#00897b', w: 1.4 }]; },
    'Supertrend': function (c) { var s = T().supertrend(c, 10, 3); return [{ data: s.value, color: '#138808', w: 1.6, dirColor: s.dir }]; },
    'Parabolic SAR': function (c) { return [{ data: T().psar(c), color: '#444', dots: true }]; },
    'Ichimoku': function (c) { return [{ data: roll(c, 52, T().ichimoku, function (r) { return r.cloudTop; }), color: '#1976d2', w: 1.2 }, { data: roll(c, 52, T().ichimoku, function (r) { return r.cloudBot; }), color: '#ef6c00', w: 1.2 }]; },
    'Chandelier Exit': function (c) { return [{ data: roll(c, 22, T().chandelier, function (r) { return r.longStop; }), color: '#c2185b', w: 1.3, dash: [4, 2] }]; },
    'Chande Kroll Stop': function (c) { return [{ data: roll(c, 19, T().chandeKroll, function (r) { return r.longStop; }), color: '#6d4c41', w: 1.3, dash: [4, 2] }]; },
    'Heikin Ashi Trend': function (c) { return [{ data: roll(c, 1, T().heikinTrend, function (r) { return r.close; }), color: '#3949ab', w: 1.5 }]; }
  };

  // ── oscillator panes (each gets its own stacked sub-pane). range omitted = auto-scale. ──
  var PANES = {
    'RSI': { calc: function (c) { return { line: T().rsi(closes(c), 14) }; }, range: [0, 100], guides: [30, 70], color: '#6a1b9a' },
    'Stochastic': { calc: function (c) { var s = T().stochastic(c); return { line: s.k, line2: s.d }; }, range: [0, 100], guides: [20, 80], kind: 'kd', color: '#1565c0', color2: '#FF9933' },
    'Stochastic RSI': { calc: function (c) { return { line: T().stochRsi(closes(c), 14) }; }, range: [0, 100], guides: [20, 80], color: '#00838f' },
    'Williams %R': { calc: function (c) { return { line: T().williamsR(c) }; }, range: [-100, 0], guides: [-80, -20], color: '#c62828' },
    'CCI': { calc: function (c) { return { line: T().cci(c, 20) }; }, guides: [-100, 0, 100], color: '#5e35b1' },
    'ROC': { calc: function (c) { return { line: T().roc(closes(c), 12) }; }, guides: [0], color: '#00695c' },
    'Momentum': { calc: function (c) { return { line: T().momentum(closes(c), 10) }; }, guides: [0], color: '#00838f' },
    'TRIX': { calc: function (c) { return { line: T().trix(closes(c), 15) }; }, guides: [0], color: '#ad1457' },
    'Ultimate Oscillator': { calc: function (c) { return { line: T().ultimateOsc(c) }; }, range: [0, 100], guides: [30, 70], color: '#3949ab' },
    'Awesome Oscillator': { calc: function (c) { return { line: T().awesome(c) }; }, guides: [0], kind: 'hist', color: '#43a047' },
    'Laguerre RSI': { calc: function (c) { return { line: T().laguerreRsi(closes(c), 0.5) }; }, range: [0, 1], guides: [0.2, 0.8], color: '#6a1b9a' },
    'Balance of Power': { calc: function (c) { return { line: T().balanceOfPower(c, 14) }; }, range: [-1, 1], guides: [0], color: '#ef6c00' },
    'MACD': { calc: function (c) { return T().macd(closes(c)); }, kind: 'macd' },
    'ADX': { calc: function (c) { return { line: T().adx(c).map(function (x) { return x && x.adx != null ? x.adx : null; }) }; }, range: [0, 100], guides: [25], color: '#00695c' },
    'Aroon': { calc: function (c) { var a = T().aroon(c, 25); return { line: a.map(function (x) { return x ? x.up : null; }), line2: a.map(function (x) { return x ? x.down : null; }) }; }, range: [0, 100], guides: [50], kind: 'kd', color: '#2e7d32', color2: '#c62828' },
    'Vortex Indicator': { calc: function (c) { return { line: roll(c, 15, T().vortex, function (r) { return r.viP; }), line2: roll(c, 15, T().vortex, function (r) { return r.viM; }) }; }, guides: [1], kind: 'kd', color: '#2e7d32', color2: '#c62828' },
    'Elder Ray': { calc: function (c) { return { line: roll(c, 14, T().elderRay, function (r) { return r.bull; }), line2: roll(c, 14, T().elderRay, function (r) { return r.bear; }) }; }, guides: [0], kind: 'kd', color: '#2e7d32', color2: '#c62828' },
    'Elder Impulse': { calc: function (c) { return { line: roll(c, 30, T().elderImpulse, function (r) { return (r.emaUp && r.histUp) ? 1 : ((!r.emaUp && !r.histUp) ? -1 : 0); }) }; }, range: [-1.2, 1.2], guides: [0], kind: 'hist', color: '#1565c0' },
    'ATR': { calc: function (c) { return { line: T().atr(c, 14) }; }, color: '#5d4037' },
    'TTM Squeeze': { calc: function (c) { return { line: roll(c, 20, T().ttmSqueeze, function (r) { return r.mom; }) }; }, guides: [0], kind: 'hist', color: '#7b1fa2' },
    'OBV': { calc: function (c) { return { line: T().obv(c) }; }, color: '#00897b' },
    'Force Index': { calc: function (c) { return { line: T().forceIndex(c, 13) }; }, guides: [0], color: '#c62828' },
    'Accumulation/Distribution': { calc: function (c) { return { line: T().adl(c) }; }, color: '#1565c0' },
    'Chaikin Money Flow': { calc: function (c) { return { line: T().cmf(c, 20) }; }, range: [-1, 1], guides: [0], color: '#00695c' },
    'MFI': { calc: function (c) { return { line: T().mfi(c, 14) }; }, range: [0, 100], guides: [20, 80], color: '#6a1b9a' },
    'Roshan Indicator': { calc: function (c) { var r = T().roshan(closes(c)); return { line: r.rsi, line2: r.rsiSma }; }, range: [0, 100], guides: [50], kind: 'kd', color: '#6a1b9a', color2: '#FF9933' }
  };

  function lineSeries(ctx, series, n, x, y) {
    if (!series || !series.data) return;
    var d = tail(series.data, n);
    if (series.dots) { ctx.fillStyle = series.color; for (var i = 0; i < d.length; i++) { if (d[i] == null) continue; ctx.beginPath(); ctx.arc(x(i), y(d[i]), 1.4, 0, 7); ctx.fill(); } return; }
    ctx.strokeStyle = series.color; ctx.lineWidth = series.w || 1.2; if (series.dash) ctx.setLineDash(series.dash);
    ctx.beginPath(); var started = false;
    for (var j = 0; j < d.length; j++) { if (d[j] == null) continue; var px = x(j), py = y(d[j]); if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);
  }

  function draw(canvas, candles, opts) {
    if (!canvas || !candles || !candles.length || !T()) return;
    opts = opts || {};
    var inds = opts.indicators || ['EMA 20', 'EMA 50', 'RSI'];
    var overlays = inds.filter(function (i) { return OVERLAYS[i]; });
    var paneKeys = inds.filter(function (i) { return PANES[i]; });
    var n = Math.min(candles.length, opts.bars || 90);
    var data = tail(candles, n);

    // compute each overlay's series ONCE (roll-based overlays are O(n²)).
    var ovSeries = {};
    overlays.forEach(function (k) { try { ovSeries[k] = OVERLAYS[k](candles) || []; } catch (e) { ovSeries[k] = []; } });

    var dpr = root.devicePixelRatio || 1, cssW = canvas.clientWidth || 320;
    var priceH = opts.priceHeight || 230, paneH = 66, gap = 8, padT = 8, padB = 16, padL = 6, padR = 56;
    var cssH = padT + priceH + paneKeys.length * (paneH + gap) + padB;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr; canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cssW, cssH);
    var W = cssW - padL - padR;
    function x(i) { return padL + (i + 0.5) * (W / n); }

    // ── PRICE PANE ──
    var his = data.map(function (c) { return c.high; }), los = data.map(function (c) { return c.low; });
    var hi = Math.max.apply(null, his), lo = Math.min.apply(null, los);
    (opts.levels || []).forEach(function (l) { if (l.price > hi) hi = l.price; if (l.price < lo) lo = l.price; });
    overlays.forEach(function (k) { ovSeries[k].forEach(function (s) { tail(s.data, n).forEach(function (v) { if (v != null && isFinite(v)) { if (v > hi) hi = v; if (v < lo) lo = v; } }); }); });
    var span = (hi - lo) || 1; hi += span * 0.04; lo -= span * 0.04; span = hi - lo;
    function yP(p) { return padT + (1 - (p - lo) / span) * priceH; }
    ctx.font = '10px system-ui';
    for (var g = 0; g <= 4; g++) { var gy = padT + (priceH / 4) * g, gp = hi - (span / 4) * g; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + W, gy); ctx.stroke(); ctx.fillStyle = '#888'; ctx.fillText('₹' + R2(gp), padL + W + 4, gy + 3); }
    overlays.forEach(function (k) { ovSeries[k].forEach(function (s) { lineSeries(ctx, s, n, x, yP); }); });
    var cw = Math.max(1.5, (W / n) * 0.6);
    for (var i = 0; i < data.length; i++) { var c = data[i], up = c.close >= c.open; ctx.strokeStyle = up ? '#0c5e06' : '#C0341D'; ctx.fillStyle = up ? '#138808' : '#C0341D'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x(i), yP(c.high)); ctx.lineTo(x(i), yP(c.low)); ctx.stroke(); var yo = yP(c.open), yc = yP(c.close); ctx.fillRect(x(i) - cw / 2, Math.min(yo, yc), cw, Math.max(1, Math.abs(yc - yo))); }
    (opts.levels || []).forEach(function (l) { ctx.strokeStyle = l.color || '#999'; ctx.setLineDash(l.dash || [4, 3]); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(padL, yP(l.price)); ctx.lineTo(padL + W, yP(l.price)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = l.color || '#666'; ctx.font = '9px system-ui'; ctx.fillText(l.label || '', padL + 2, yP(l.price) - 2); });
    // overlay legend
    if (overlays.length) { ctx.font = '9px system-ui'; var lx = padL + 2, ly = padT + 9; overlays.forEach(function (k) { var col = (ovSeries[k][0] || {}).color || '#333'; if (lx + ctx.measureText(k).width > padL + W) { lx = padL + 2; ly += 11; } ctx.fillStyle = col; ctx.fillText(k, lx, ly); lx += ctx.measureText(k).width + 10; }); }

    // ── OSCILLATOR PANES ──
    paneKeys.forEach(function (k, pi) {
      var def = PANES[k], top = padT + priceH + gap + pi * (paneH + gap);
      ctx.strokeStyle = '#e3e3e3'; ctx.lineWidth = 1; ctx.strokeRect(padL, top, W, paneH);
      ctx.fillStyle = '#555'; ctx.font = 'bold 9px system-ui'; ctx.fillText(k, padL + 3, top + 10);
      var res = null; try { res = def.calc(candles); } catch (e) { res = null; }
      if (!res) { ctx.fillStyle = '#aaa'; ctx.fillText('—', padL + W - 12, top + 10); return; }

      if (def.kind === 'macd') {
        var line = tail(res.line, n), sig = tail(res.signal, n), hist = tail(res.hist, n);
        var vals = line.concat(sig).concat(hist).filter(function (v) { return v != null; });
        var mx = Math.max.apply(null, vals.map(Math.abs)) || 1; var yM = function (v) { return top + paneH / 2 - (v / (mx * 1.1)) * (paneH / 2); };
        ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(padL, yM(0)); ctx.lineTo(padL + W, yM(0)); ctx.stroke();
        for (var h2 = 0; h2 < hist.length; h2++) { if (hist[h2] == null) continue; ctx.fillStyle = hist[h2] >= 0 ? '#9ccc9c' : '#e0a0a0'; var y0 = yM(0), yh = yM(hist[h2]); ctx.fillRect(x(h2) - cw / 2, Math.min(y0, yh), cw, Math.max(1, Math.abs(yh - y0))); }
        lineSeries(ctx, { data: res.line, color: '#1565c0', w: 1.2 }, n, x, yM); lineSeries(ctx, { data: res.signal, color: '#FF9933', w: 1.2 }, n, x, yM);
        var lvM = tail(res.line, n).filter(function (v) { return v != null; }).pop();
        if (lvM != null) { ctx.fillStyle = '#1565c0'; ctx.fillText(R2(lvM), padL + W + 2, top + 10); }
        return;
      }

      var lineT = tail(res.line || [], n), line2T = res.line2 ? tail(res.line2, n) : null;
      var rLo, rHi;
      if (def.range) { rLo = def.range[0]; rHi = def.range[1]; }
      else {
        var dv = lineT.concat(line2T || []).concat(def.guides || []).filter(function (v) { return v != null && isFinite(v); });
        if (!dv.length) { ctx.fillStyle = '#aaa'; ctx.fillText('—', padL + W - 12, top + 10); return; }
        rLo = Math.min.apply(null, dv); rHi = Math.max.apply(null, dv); var pd = (rHi - rLo) * 0.08 || 1; rLo -= pd; rHi += pd;
      }
      var dnm = (rHi - rLo) || 1; var yV = function (v) { return top + (1 - (v - rLo) / dnm) * paneH; };
      (def.guides || []).forEach(function (gv) { if (gv < rLo || gv > rHi) return; ctx.strokeStyle = '#ddd'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(padL, yV(gv)); ctx.lineTo(padL + W, yV(gv)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#aaa'; ctx.fillText('' + R2(gv), padL + W + 2, yV(gv) + 3); });
      if (def.kind === 'hist') {
        var zero = (rLo <= 0 && rHi >= 0) ? 0 : rLo;
        for (var hb = 0; hb < lineT.length; hb++) { if (lineT[hb] == null) continue; ctx.fillStyle = lineT[hb] >= 0 ? '#9ccc9c' : '#e0a0a0'; var z0 = yV(zero), zh = yV(lineT[hb]); ctx.fillRect(x(hb) - cw / 2, Math.min(z0, zh), cw, Math.max(1, Math.abs(zh - z0))); }
      } else {
        lineSeries(ctx, { data: res.line, color: def.color, w: 1.3 }, n, x, yV);
        if (line2T) lineSeries(ctx, { data: res.line2, color: def.color2 || '#FF9933', w: 1.1 }, n, x, yV);
      }
      var lastV = lineT.filter(function (v) { return v != null; }).pop();
      if (lastV != null) { ctx.fillStyle = def.color; ctx.font = 'bold 9px system-ui'; ctx.fillText(R2(lastV), padL + W + 2, top + 10); }
    });

    var first = data[0].close, lastC = data[data.length - 1].close, dir = lastC > first ? 'rising' : lastC < first ? 'falling' : 'flat';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (opts.symbol || 'Price') + ' candlestick chart, last ' + n + ' bars, ' + dir + ', latest close ₹' + R2(lastC) + (overlays.length ? ', with ' + overlays.join(', ') : '') + (paneKeys.length ? ' and ' + paneKeys.join(', ') + ' below' : '') + '. Use Show data as table or Hear the chart for the full read.');
  }

  root.ChittiTechChart = {
    draw: draw, OVERLAYS: OVERLAYS, PANES: PANES,
    OVERLAY_KEYS: Object.keys(OVERLAYS), PANE_KEYS: Object.keys(PANES),
    ALL_KEYS: Object.keys(OVERLAYS).concat(Object.keys(PANES))
  };
})(typeof window !== 'undefined' ? window : this);
