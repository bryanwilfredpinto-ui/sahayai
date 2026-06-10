/* chitti_technical_ai_chart.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * TradingView/Angel-One-style multi-pane candlestick chart — dependency-free <canvas>.
 *  • Price pane: candles + OVERLAY indicators (EMA 20/50/200 · Bollinger · VWAP · Supertrend · PSAR)
 *    + S/R / entry / stop / target level lines.
 *  • Separate sub-panes (stacked below): RSI · MACD · Stochastic · Williams %R · ADX.
 * Indicators are chosen by the page's "📊 Indicators" dropdown and passed in opts.indicators.
 * Accessible: role="img" + spoken aria-label; always shipped beside Show-data-table + sonify.
 * window.ChittiTechChart.{ draw, OVERLAYS, PANES }.
 */
(function (root) {
  'use strict';
  function T() { return root.TechEngine; }
  function closes(c) { return c.map(function (x) { return x.close; }); }
  function tail(arr, n) { return arr.slice(arr.length - n); }
  var R2 = function (v) { return Math.round(v * 100) / 100; };

  // ── overlay indicators (drawn ON the price pane). Each returns one or more line series. ──
  var OVERLAYS = {
    'EMA 20': function (c) { return [{ data: T().ema(closes(c), 20), color: '#1565c0', w: 1.4 }]; },
    'EMA 50': function (c) { return [{ data: T().ema(closes(c), 50), color: '#FF9933', w: 1.4 }]; },
    'EMA 200': function (c) { return [{ data: T().ema(closes(c), 200), color: '#7b1fa2', w: 1.6 }]; },
    'Bollinger': function (c) { var b = T().bollinger(closes(c), 20, 2); return [{ data: b.upper, color: '#888', w: 1 }, { data: b.mid, color: '#aaa', w: 1, dash: [3, 3] }, { data: b.lower, color: '#888', w: 1 }]; },
    'VWAP': function (c) { return [{ data: T().vwapRolling(c, 20), color: '#00897b', w: 1.4 }]; },
    'Supertrend': function (c) { var s = T().supertrend(c, 10, 3); return [{ data: s.value, color: '#138808', w: 1.6, dirColor: s.dir }]; },
    'PSAR': function (c) { return [{ data: T().psar(c), color: '#444', dots: true }]; }
  };
  // ── oscillator panes (each gets its own stacked sub-pane). ──
  var PANES = {
    'RSI': { calc: function (c) { return { line: T().rsi(closes(c), 14) }; }, range: [0, 100], guides: [30, 70], kind: 'line', color: '#6a1b9a' },
    'MACD': { calc: function (c) { return T().macd(closes(c)); }, kind: 'macd' },
    'Stochastic': { calc: function (c) { var s = T().stochastic(c); return { line: s.k, line2: s.d }; }, range: [0, 100], guides: [20, 80], kind: 'kd', color: '#1565c0', color2: '#FF9933' },
    'Williams %R': { calc: function (c) { return { line: T().williamsR(c) }; }, range: [-100, 0], guides: [-80, -20], kind: 'line', color: '#c62828' },
    'ADX': { calc: function (c) { return { line: T().adx(c).map(function (x) { return x && x.adx != null ? x.adx : null; }) }; }, range: [0, 100], guides: [25], kind: 'line', color: '#00695c' }
  };

  function lineSeries(ctx, series, n, x, y, padT, H) {
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
    overlays.forEach(function (k) { OVERLAYS[k](candles).forEach(function (s) { tail(s.data, n).forEach(function (v) { if (v != null) { if (v > hi) hi = v; if (v < lo) lo = v; } }); }); });
    var span = (hi - lo) || 1; hi += span * 0.04; lo -= span * 0.04; span = hi - lo;
    function yP(p) { return padT + (1 - (p - lo) / span) * priceH; }
    ctx.font = '10px system-ui';
    for (var g = 0; g <= 4; g++) { var gy = padT + (priceH / 4) * g, gp = hi - (span / 4) * g; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + W, gy); ctx.stroke(); ctx.fillStyle = '#888'; ctx.fillText('₹' + R2(gp), padL + W + 4, gy + 3); }
    overlays.forEach(function (k) { OVERLAYS[k](candles).forEach(function (s) { lineSeries(ctx, s, n, x, yP); }); });
    var cw = Math.max(1.5, (W / n) * 0.6);
    for (var i = 0; i < data.length; i++) { var c = data[i], up = c.close >= c.open; ctx.strokeStyle = up ? '#0c5e06' : '#C0341D'; ctx.fillStyle = up ? '#138808' : '#C0341D'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x(i), yP(c.high)); ctx.lineTo(x(i), yP(c.low)); ctx.stroke(); var yo = yP(c.open), yc = yP(c.close); ctx.fillRect(x(i) - cw / 2, Math.min(yo, yc), cw, Math.max(1, Math.abs(yc - yo))); }
    (opts.levels || []).forEach(function (l) { ctx.strokeStyle = l.color || '#999'; ctx.setLineDash(l.dash || [4, 3]); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(padL, yP(l.price)); ctx.lineTo(padL + W, yP(l.price)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = l.color || '#666'; ctx.font = '9px system-ui'; ctx.fillText(l.label || '', padL + 2, yP(l.price) - 2); });
    // overlay legend
    if (overlays.length) { ctx.font = '9px system-ui'; var lx = padL + 2; overlays.forEach(function (k) { ctx.fillStyle = (OVERLAYS[k](candles)[0] || {}).color || '#333'; ctx.fillText(k, lx, padT + 9); lx += ctx.measureText(k).width + 10; }); }

    // ── OSCILLATOR PANES ──
    paneKeys.forEach(function (k, pi) {
      var def = PANES[k], top = padT + priceH + gap + pi * (paneH + gap);
      ctx.strokeStyle = '#e3e3e3'; ctx.strokeRect(padL, top, W, paneH);
      ctx.fillStyle = '#555'; ctx.font = 'bold 9px system-ui'; ctx.fillText(k, padL + 3, top + 10);
      if (def.kind === 'macd') {
        var m = def.calc(candles), line = tail(m.line, n), sig = tail(m.signal, n), hist = tail(m.hist, n);
        var vals = line.concat(sig).concat(hist).filter(function (v) { return v != null; });
        var mx = Math.max.apply(null, vals.map(Math.abs)) || 1; function yM(v) { return top + paneH / 2 - (v / (mx * 1.1)) * (paneH / 2); }
        ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(padL, yM(0)); ctx.lineTo(padL + W, yM(0)); ctx.stroke();
        for (var hi2 = 0; hi2 < hist.length; hi2++) { if (hist[hi2] == null) continue; ctx.fillStyle = hist[hi2] >= 0 ? '#9ccc9c' : '#e0a0a0'; var y0 = yM(0), yh = yM(hist[hi2]); ctx.fillRect(x(hi2) - cw / 2, Math.min(y0, yh), cw, Math.max(1, Math.abs(yh - y0))); }
        lineSeries(ctx, { data: m.line, color: '#1565c0', w: 1.2 }, n, x, yM); lineSeries(ctx, { data: m.signal, color: '#FF9933', w: 1.2 }, n, x, yM);
      } else {
        var r = def.range, res = def.calc(candles); function yV(v) { return top + (1 - (v - r[0]) / (r[1] - r[0])) * paneH; }
        (def.guides || []).forEach(function (gv) { ctx.strokeStyle = '#ddd'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(padL, yV(gv)); ctx.lineTo(padL + W, yV(gv)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#aaa'; ctx.fillText('' + gv, padL + W + 2, yV(gv) + 3); });
        lineSeries(ctx, { data: res.line, color: def.color, w: 1.3 }, n, x, yV);
        if (def.kind === 'kd' && res.line2) lineSeries(ctx, { data: res.line2, color: def.color2, w: 1.1 }, n, x, yV);
        var lastV = tail(res.line, n).filter(function (v) { return v != null; }).pop();
        if (lastV != null) { ctx.fillStyle = def.color; ctx.font = 'bold 9px system-ui'; ctx.fillText(R2(lastV), padL + W + 2, top + 10); }
      }
    });

    var first = data[0].close, lastC = data[data.length - 1].close, dir = lastC > first ? 'rising' : lastC < first ? 'falling' : 'flat';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (opts.symbol || 'Price') + ' candlestick chart, last ' + n + ' bars, ' + dir + ', latest close ₹' + R2(lastC) + (overlays.length ? ', with ' + overlays.join(', ') : '') + (paneKeys.length ? ' and ' + paneKeys.join(', ') + ' below' : '') + '. Use Show data as table or Hear the chart for the full read.');
  }

  root.ChittiTechChart = { draw: draw, OVERLAYS: OVERLAYS, PANES: PANES,
    OVERLAY_KEYS: Object.keys(OVERLAYS), PANE_KEYS: Object.keys(PANES) };
})(typeof window !== 'undefined' ? window : this);
