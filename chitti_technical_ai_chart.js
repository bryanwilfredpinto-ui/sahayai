/* chitti_technical_ai_chart.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * Accessible candlestick chart (the TradingView heart) — dependency-free <canvas>. Colour is
 * NOT the only channel: the canvas is role="img" with a spoken aria-label, and it always ships
 * beside the "Show data as table" + sonify tools (the blind path). Draws candles + EMA20/50 +
 * S/R zones + entry/stop/target markers. window.ChittiTechChart.draw(canvas, candles, opts).
 */
(function (root) {
  'use strict';
  var T = root.TechEngine;

  function draw(canvas, candles, opts) {
    if (!canvas || !candles || !candles.length) return;
    opts = opts || {};
    var n = Math.min(candles.length, opts.bars || 70);
    var data = candles.slice(-n);
    var dpr = root.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 320, cssH = opts.height || 240;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    var padL = 6, padR = 54, padT = 8, padB = 16, W = cssW - padL - padR, H = cssH - padT - padB;
    var his = data.map(function (c) { return c.high; }), los = data.map(function (c) { return c.low; });
    var hi = Math.max.apply(null, his), lo = Math.min.apply(null, los);
    // include overlay levels in the y-range so markers are visible
    (opts.levels || []).forEach(function (l) { if (l.price > hi) hi = l.price; if (l.price < lo) lo = l.price; });
    var span = (hi - lo) || 1; hi += span * 0.04; lo -= span * 0.04; span = hi - lo;
    function y(p) { return padT + (1 - (p - lo) / span) * H; }
    function x(i) { return padL + (i + 0.5) * (W / n); }
    var cw = Math.max(1.5, (W / n) * 0.62);

    // gridlines + right-axis price labels
    ctx.strokeStyle = '#eee'; ctx.fillStyle = '#888'; ctx.font = '10px system-ui'; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (H / 4) * g, gp = hi - (span / 4) * g;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + W, gy); ctx.stroke();
      ctx.fillText('₹' + (Math.round(gp * 100) / 100), padL + W + 4, gy + 3);
    }

    // EMA20 / EMA50 overlays (the "trend" the verdict leans on)
    if (T) {
      [['#1565c0', 20], ['#FF9933', 50]].forEach(function (pair) {
        var e = T.ema(data.map(function (c) { return c.close; }), pair[1]);
        ctx.strokeStyle = pair[0]; ctx.lineWidth = 1.4; ctx.beginPath(); var started = false;
        for (var i = 0; i < data.length; i++) { if (e[i] == null) continue; var px = x(i), py = y(e[i]); if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py); }
        ctx.stroke();
      });
    }

    // candles
    for (var i = 0; i < data.length; i++) {
      var c = data[i], up = c.close >= c.open;
      ctx.strokeStyle = up ? '#0c5e06' : '#C0341D'; ctx.fillStyle = up ? '#138808' : '#C0341D';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x(i), y(c.high)); ctx.lineTo(x(i), y(c.low)); ctx.stroke();
      var yo = y(c.open), yc = y(c.close), top = Math.min(yo, yc), bh = Math.max(1, Math.abs(yc - yo));
      ctx.fillRect(x(i) - cw / 2, top, cw, bh);
    }

    // S/R + entry/stop/target horizontal levels
    (opts.levels || []).forEach(function (l) {
      ctx.strokeStyle = l.color || '#999'; ctx.setLineDash(l.dash || [4, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(padL, y(l.price)); ctx.lineTo(padL + W, y(l.price)); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = l.color || '#666'; ctx.font = '9px system-ui';
      ctx.fillText(l.label || '', padL + 2, y(l.price) - 2);
    });

    // accessibility: the canvas IS an image with a spoken description (deaf-safe + SR-safe)
    var first = data[0].close, last = data[data.length - 1].close;
    var dir = last > first ? 'rising' : last < first ? 'falling' : 'flat';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', (opts.symbol || 'Price') + ' candlestick chart, last ' + n + ' bars, ' + dir + ', latest close ₹' + (Math.round(last * 100) / 100) + '. Use "Show data as table" or "Hear the chart" for the full read.');
  }

  root.ChittiTechChart = { draw: draw };
})(typeof window !== 'undefined' ? window : this);
