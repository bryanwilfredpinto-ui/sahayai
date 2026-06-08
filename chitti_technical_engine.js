/* chitti_technical_engine.js
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Deterministic technical-analysis engine for Chitti Technical (CEOS).
 * Doctrine: rules are the product, the LLM is an enhancement. This file has ZERO
 * dependencies, runs in the browser (window.TechEngine) AND in Node (module.exports),
 * so the signal logic is unit-testable without a browser or any network.
 *
 * Implements: 12 core indicators, the Roshan Indicator (RSI14 vs SMA20-of-RSI14),
 * multi-timeframe confluence (higher TF governs), the risk engine (NO stop → NO
 * signal), a seeded deterministic candle synthesizer (honest DEMO data until the
 * backend feed is wired), and the screener universe + filters by market-cap tier.
 */
(function (root) {
  'use strict';

  // ───────────────────────── helpers ─────────────────────────
  function closes(c) { return c.map(function (x) { return x.close; }); }
  function highs(c)  { return c.map(function (x) { return x.high; }); }
  function lows(c)   { return c.map(function (x) { return x.low; }); }
  function vols(c)   { return c.map(function (x) { return x.volume || 0; }); }
  function last(a)   { return a.length ? a[a.length - 1] : null; }
  function round2(v) { return v == null ? null : Math.round(v * 100) / 100; }

  // ───────────────────────── indicators ─────────────────────────
  function sma(values, period) {
    var out = new Array(values.length).fill(null);
    if (values.length < period) return out;
    var run = 0;
    for (var i = 0; i < values.length; i++) {
      run += values[i];
      if (i >= period) run -= values[i - period];
      if (i >= period - 1) out[i] = run / period;
    }
    return out;
  }

  function ema(values, period) {
    var out = new Array(values.length).fill(null);
    if (values.length < period) return out;
    var k = 2 / (period + 1);
    var seed = 0;
    for (var i = 0; i < period; i++) seed += values[i];
    out[period - 1] = seed / period;
    for (var j = period; j < values.length; j++) {
      out[j] = values[j] * k + out[j - 1] * (1 - k);
    }
    return out;
  }

  function rsi(values, period) {
    period = period || 14;
    var out = new Array(values.length).fill(null);
    if (values.length <= period) return out;
    var gain = 0, loss = 0, i;
    for (i = 1; i <= period; i++) {
      var d = values[i] - values[i - 1];
      if (d >= 0) gain += d; else loss -= d;
    }
    var ag = gain / period, al = loss / period;
    out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    for (i = period + 1; i < values.length; i++) {
      var ch = values[i] - values[i - 1];
      var g = ch > 0 ? ch : 0, l = ch < 0 ? -ch : 0;
      ag = (ag * (period - 1) + g) / period;
      al = (al * (period - 1) + l) / period;
      out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    }
    return out;
  }

  function macd(values, fast, slow, signal) {
    fast = fast || 12; slow = slow || 26; signal = signal || 9;
    var ef = ema(values, fast), es = ema(values, slow);
    var line = values.map(function (_, i) {
      return ef[i] == null || es[i] == null ? null : ef[i] - es[i];
    });
    var compact = line.filter(function (v) { return v != null; });
    var sigCompact = ema(compact, signal);
    // re-align signal to full length
    var sig = new Array(line.length).fill(null);
    var off = line.length - compact.length;
    for (var i = 0; i < sigCompact.length; i++) sig[off + i] = sigCompact[i];
    var hist = line.map(function (v, i) {
      return v == null || sig[i] == null ? null : v - sig[i];
    });
    return { line: line, signal: sig, hist: hist };
  }

  function atr(candles, period) {
    period = period || 14;
    var tr = [], i;
    for (i = 0; i < candles.length; i++) {
      if (i === 0) { tr.push(candles[i].high - candles[i].low); continue; }
      var h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
      tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    return sma(tr, period); // Wilder approx via SMA of TR — stable + testable
  }

  function stochastic(candles, k, d) {
    k = k || 14; d = d || 3;
    var hi = highs(candles), lo = lows(candles), cl = closes(candles);
    var kArr = new Array(candles.length).fill(null);
    for (var i = k - 1; i < candles.length; i++) {
      var hh = -Infinity, ll = Infinity;
      for (var j = i - k + 1; j <= i; j++) { if (hi[j] > hh) hh = hi[j]; if (lo[j] < ll) ll = lo[j]; }
      kArr[i] = hh === ll ? 50 : ((cl[i] - ll) / (hh - ll)) * 100;
    }
    var kComp = kArr.filter(function (v) { return v != null; });
    var dComp = sma(kComp, d);
    var dArr = new Array(kArr.length).fill(null);
    var off = kArr.length - kComp.length;
    for (var m = 0; m < dComp.length; m++) dArr[off + m] = dComp[m];
    return { k: kArr, d: dArr };
  }

  function williamsR(candles, period) {
    period = period || 14;
    var hi = highs(candles), lo = lows(candles), cl = closes(candles);
    var out = new Array(candles.length).fill(null);
    for (var i = period - 1; i < candles.length; i++) {
      var hh = -Infinity, ll = Infinity;
      for (var j = i - period + 1; j <= i; j++) { if (hi[j] > hh) hh = hi[j]; if (lo[j] < ll) ll = lo[j]; }
      out[i] = hh === ll ? -50 : ((hh - cl[i]) / (hh - ll)) * -100;
    }
    return out;
  }

  function bollinger(values, period, mult) {
    period = period || 20; mult = mult || 2;
    var mid = sma(values, period);
    var up = new Array(values.length).fill(null);
    var lo = new Array(values.length).fill(null);
    for (var i = period - 1; i < values.length; i++) {
      var m = mid[i], s = 0;
      for (var j = i - period + 1; j <= i; j++) s += Math.pow(values[j] - m, 2);
      var sd = Math.sqrt(s / period);
      up[i] = m + mult * sd; lo[i] = m - mult * sd;
    }
    return { mid: mid, upper: up, lower: lo };
  }

  function obv(candles) {
    var out = [0];
    for (var i = 1; i < candles.length; i++) {
      var v = candles[i].volume || 0;
      if (candles[i].close > candles[i - 1].close) out.push(out[i - 1] + v);
      else if (candles[i].close < candles[i - 1].close) out.push(out[i - 1] - v);
      else out.push(out[i - 1]);
    }
    return out;
  }

  function supertrend(candles, period, mult) {
    period = period || 10; mult = mult || 3;
    var a = atr(candles, period);
    var out = new Array(candles.length).fill(null);
    var dir = new Array(candles.length).fill(null);
    var prevUp = null, prevLo = null, prevDir = 1;
    for (var i = 0; i < candles.length; i++) {
      if (a[i] == null) continue;
      var hl2 = (candles[i].high + candles[i].low) / 2;
      var up = hl2 + mult * a[i], lo = hl2 - mult * a[i];
      if (prevUp != null) {
        up = candles[i - 1].close > prevUp ? Math.max(up, prevUp) : up;
        lo = candles[i - 1].close < prevLo ? Math.min(lo, prevLo) : lo;
      }
      var d = prevDir;
      if (prevUp != null) {
        if (candles[i].close > prevUp) d = 1;
        else if (candles[i].close < prevLo) d = -1;
      }
      out[i] = d === 1 ? lo : up; dir[i] = d;
      prevUp = up; prevLo = lo; prevDir = d;
    }
    return { value: out, dir: dir };
  }

  // simplified ADX (trend strength 0..100)
  function adx(candles, period) {
    period = period || 14;
    var out = new Array(candles.length).fill(null);
    if (candles.length < period * 2) return out;
    var plusDM = [0], minusDM = [0], tr = [0];
    for (var i = 1; i < candles.length; i++) {
      var up = candles[i].high - candles[i - 1].high;
      var dn = candles[i - 1].low - candles[i].low;
      plusDM.push(up > dn && up > 0 ? up : 0);
      minusDM.push(dn > up && dn > 0 ? dn : 0);
      var h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
      tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    var trS = sma(tr, period), pS = sma(plusDM, period), mS = sma(minusDM, period);
    for (var k = period; k < candles.length; k++) {
      if (trS[k] == null || trS[k] === 0) continue;
      var pdi = 100 * pS[k] / trS[k], mdi = 100 * mS[k] / trS[k];
      var dx = (pdi + mdi) === 0 ? 0 : 100 * Math.abs(pdi - mdi) / (pdi + mdi);
      out[k] = { adx: dx, pdi: pdi, mdi: mdi };
    }
    return out;
  }

  // ───────────────────────── Roshan Indicator ⭐ ─────────────────────────
  // Sire's custom composite: RSI(14) vs SMA(20) of RSI(14). RSI > its SMA = BUY.
  function roshan(values) {
    var r = rsi(values, 14);
    var rComp = r.filter(function (v) { return v != null; });
    var sComp = sma(rComp, 20);
    var rsiSma = new Array(r.length).fill(null);
    var off = r.length - rComp.length;
    for (var i = 0; i < sComp.length; i++) rsiSma[off + i] = sComp[i];
    var vr = last(r), vs = last(rsiSma);
    var sig = 'WAIT';
    if (vr != null && vs != null) sig = vr > vs ? 'BUY' : (vr < vs ? 'SELL' : 'WAIT');
    return { rsi: r, rsiSma: rsiSma, value: round2(vr), avg: round2(vs), signal: sig };
  }

  // ───────────────────────── more indicators (so the dropdown is real) ─────────────────────────
  function cci(candles, period) {
    period = period || 20; var out = new Array(candles.length).fill(null);
    var tp = candles.map(function (c) { return (c.high + c.low + c.close) / 3; });
    var s = sma(tp, period);
    for (var i = period - 1; i < candles.length; i++) {
      var md = 0; for (var j = i - period + 1; j <= i; j++) md += Math.abs(tp[j] - s[i]); md /= period;
      out[i] = md === 0 ? 0 : (tp[i] - s[i]) / (0.015 * md);
    }
    return out;
  }
  function roc(values, period) {
    period = period || 12; var out = new Array(values.length).fill(null);
    for (var i = period; i < values.length; i++) out[i] = values[i - period] === 0 ? 0 : (values[i] - values[i - period]) / values[i - period] * 100;
    return out;
  }
  function momentum(values, period) {
    period = period || 10; var out = new Array(values.length).fill(null);
    for (var i = period; i < values.length; i++) out[i] = values[i] - values[i - period];
    return out;
  }
  function mfi(candles, period) {
    period = period || 14; var out = new Array(candles.length).fill(null);
    var tp = candles.map(function (c) { return (c.high + c.low + c.close) / 3; });
    for (var i = period; i < candles.length; i++) {
      var pos = 0, neg = 0;
      for (var j = i - period + 1; j <= i; j++) { var rmf = tp[j] * (candles[j].volume || 0); if (tp[j] > tp[j - 1]) pos += rmf; else if (tp[j] < tp[j - 1]) neg += rmf; }
      out[i] = neg === 0 ? 100 : 100 - 100 / (1 + pos / neg);
    }
    return out;
  }
  function aroon(candles, period) {
    period = period || 25; var out = new Array(candles.length).fill(null);
    for (var i = period; i < candles.length; i++) {
      var hh = -Infinity, ll = Infinity, hi = i, li = i;
      for (var j = i - period; j <= i; j++) { if (candles[j].high >= hh) { hh = candles[j].high; hi = j; } if (candles[j].low <= ll) { ll = candles[j].low; li = j; } }
      out[i] = { up: ((period - (i - hi)) / period) * 100, down: ((period - (i - li)) / period) * 100 };
    }
    return out;
  }
  function donchian(candles, period) {
    period = period || 20; var out = new Array(candles.length).fill(null);
    for (var i = period - 1; i < candles.length; i++) {
      var hh = -Infinity, ll = Infinity;
      for (var j = i - period + 1; j <= i; j++) { if (candles[j].high > hh) hh = candles[j].high; if (candles[j].low < ll) ll = candles[j].low; }
      out[i] = { upper: hh, lower: ll };
    }
    return out;
  }
  function awesome(candles) {
    var med = candles.map(function (c) { return (c.high + c.low) / 2; });
    var s5 = sma(med, 5), s34 = sma(med, 34);
    return med.map(function (_, i) { return (s5[i] == null || s34[i] == null) ? null : s5[i] - s34[i]; });
  }
  function stochRsi(values, period) {
    period = period || 14; var r = rsi(values, period); var out = new Array(values.length).fill(null);
    for (var i = period * 2; i < values.length; i++) {
      var win = []; for (var j = i - period + 1; j <= i; j++) if (r[j] != null) win.push(r[j]);
      if (win.length < period) continue;
      var hh = Math.max.apply(null, win), ll = Math.min.apply(null, win);
      out[i] = hh === ll ? 50 : ((r[i] - ll) / (hh - ll)) * 100;
    }
    return out;
  }
  function vwapRolling(candles, period) {
    period = period || 20; var out = new Array(candles.length).fill(null);
    for (var i = period - 1; i < candles.length; i++) {
      var pv = 0, vv = 0;
      for (var j = i - period + 1; j <= i; j++) { var tp = (candles[j].high + candles[j].low + candles[j].close) / 3; pv += tp * (candles[j].volume || 0); vv += (candles[j].volume || 0); }
      out[i] = vv === 0 ? null : pv / vv;
    }
    return out;
  }
  function keltner(candles, period, mult) {
    period = period || 20; mult = mult || 2; var cl = closes(candles); var mid = ema(cl, period); var a = atr(candles, period);
    var up = new Array(candles.length).fill(null), lo = new Array(candles.length).fill(null);
    for (var i = 0; i < candles.length; i++) if (mid[i] != null && a[i] != null) { up[i] = mid[i] + mult * a[i]; lo[i] = mid[i] - mult * a[i]; }
    return { mid: mid, upper: up, lower: lo };
  }
  function trix(values, period) {
    period = period || 15;
    var e1 = ema(values, period).filter(function (v) { return v != null; });
    var e2 = ema(e1, period).filter(function (v) { return v != null; });
    var e3 = ema(e2, period);
    var out = new Array(values.length).fill(null); var off = values.length - e3.length;
    for (var i = 1; i < e3.length; i++) if (e3[i - 1]) out[off + i] = (e3[i] - e3[i - 1]) / e3[i - 1] * 100;
    return out;
  }

  // ── full catalogue extras (so the dropdown matches the legacy scanner) ──
  function wma(values, period) {
    var out = new Array(values.length).fill(null), denom = period * (period + 1) / 2;
    for (var i = period - 1; i < values.length; i++) { var s = 0; for (var k = 0; k < period; k++) s += values[i - k] * (period - k); out[i] = s / denom; }
    return out;
  }
  function hma(values, period) {
    period = period || 20;
    var half = wma(values, Math.max(1, Math.floor(period / 2))), full = wma(values, period);
    var raw = values.map(function (_, i) { return (half[i] == null || full[i] == null) ? null : 2 * half[i] - full[i]; });
    var rawC = raw.filter(function (v) { return v != null; });
    var h = wma(rawC, Math.max(1, Math.round(Math.sqrt(period))));
    var out = new Array(values.length).fill(null), off = values.length - h.length;
    for (var i = 0; i < h.length; i++) out[off + i] = h[i];
    return out;
  }
  function ultimateOsc(candles) {
    var bp = [], tr = [];
    for (var i = 0; i < candles.length; i++) {
      if (i === 0) { bp.push(0); tr.push(candles[i].high - candles[i].low); continue; }
      var pc = candles[i - 1].close, minLP = Math.min(candles[i].low, pc), maxHP = Math.max(candles[i].high, pc);
      bp.push(candles[i].close - minLP); tr.push(maxHP - minLP);
    }
    function avg(n, i) { var sb = 0, st = 0; for (var j = i - n + 1; j <= i; j++) { sb += bp[j]; st += tr[j]; } return st === 0 ? 0 : sb / st; }
    var out = new Array(candles.length).fill(null);
    for (var i = 27; i < candles.length; i++) out[i] = 100 * (4 * avg(7, i) + 2 * avg(14, i) + avg(28, i)) / 7;
    return out;
  }
  function psar(candles, step, maxAf) {
    step = step || 0.02; maxAf = maxAf || 0.2;
    var out = new Array(candles.length).fill(null);
    if (candles.length < 2) return out;
    var bull = true, af = step, ep = candles[0].high, sar = candles[0].low;
    for (var i = 1; i < candles.length; i++) {
      sar = sar + af * (ep - sar);
      if (bull) {
        if (candles[i].low < sar) { bull = false; sar = ep; ep = candles[i].low; af = step; }
        else if (candles[i].high > ep) { ep = candles[i].high; af = Math.min(maxAf, af + step); }
      } else {
        if (candles[i].high > sar) { bull = true; sar = ep; ep = candles[i].high; af = step; }
        else if (candles[i].low < ep) { ep = candles[i].low; af = Math.min(maxAf, af + step); }
      }
      out[i] = sar;
    }
    return out;
  }
  function ichimoku(candles) {
    function hh(n, i) { var m = -Infinity; for (var j = i - n + 1; j <= i; j++) if (candles[j] && candles[j].high > m) m = candles[j].high; return m; }
    function ll(n, i) { var m = Infinity; for (var j = i - n + 1; j <= i; j++) if (candles[j] && candles[j].low < m) m = candles[j].low; return m; }
    var i = candles.length - 1; if (i < 52) return null;
    var tenkan = (hh(9, i) + ll(9, i)) / 2, kijun = (hh(26, i) + ll(26, i)) / 2;
    var sa = (tenkan + kijun) / 2, sb = (hh(52, i) + ll(52, i)) / 2;
    return { cloudTop: Math.max(sa, sb), cloudBot: Math.min(sa, sb) };
  }
  function forceIndex(candles, period) {
    period = period || 13; var fi = [0];
    for (var i = 1; i < candles.length; i++) fi.push((candles[i].close - candles[i - 1].close) * (candles[i].volume || 0));
    return ema(fi, period);
  }
  function adl(candles) {
    var out = [], run = 0;
    for (var i = 0; i < candles.length; i++) { var c = candles[i], hl = c.high - c.low, mfm = hl === 0 ? 0 : ((c.close - c.low) - (c.high - c.close)) / hl; run += mfm * (c.volume || 0); out.push(run); }
    return out;
  }
  function cmf(candles, period) {
    period = period || 20; var out = new Array(candles.length).fill(null);
    for (var i = period - 1; i < candles.length; i++) {
      var mfv = 0, vol = 0;
      for (var j = i - period + 1; j <= i; j++) { var c = candles[j], hl = c.high - c.low, m = hl === 0 ? 0 : ((c.close - c.low) - (c.high - c.close)) / hl; mfv += m * (c.volume || 0); vol += (c.volume || 0); }
      out[i] = vol === 0 ? 0 : mfv / vol;
    }
    return out;
  }
  function ttmSqueeze(candles) {
    var cl = closes(candles), bb = bollinger(cl, 20, 2), kc = keltner(candles, 20, 1.5), s20 = sma(cl, 20), i = candles.length - 1;
    var mom = (cl[i] != null && s20[i] != null) ? cl[i] - s20[i] : 0;
    var on = (bb.upper[i] != null && kc.upper[i] != null) ? (bb.upper[i] < kc.upper[i] && bb.lower[i] > kc.lower[i]) : false;
    return { on: on, mom: mom };
  }
  function vortex(candles, period) {
    period = period || 14; var i = candles.length - 1; if (i < period) return null;
    var vmP = 0, vmM = 0, tr = 0;
    for (var j = i - period + 1; j <= i; j++) {
      if (j === 0) continue;
      vmP += Math.abs(candles[j].high - candles[j - 1].low); vmM += Math.abs(candles[j].low - candles[j - 1].high);
      var pc = candles[j - 1].close; tr += Math.max(candles[j].high - candles[j].low, Math.abs(candles[j].high - pc), Math.abs(candles[j].low - pc));
    }
    return tr === 0 ? null : { viP: vmP / tr, viM: vmM / tr };
  }
  function chandelier(candles, period, mult) {
    period = period || 22; mult = mult || 3; var i = candles.length - 1; if (i < period) return null;
    var a = last(atr(candles, period)); if (a == null) return null;
    var hh = -Infinity, ll = Infinity;
    for (var j = i - period + 1; j <= i; j++) { if (candles[j].high > hh) hh = candles[j].high; if (candles[j].low < ll) ll = candles[j].low; }
    return { longStop: hh - mult * a, shortStop: ll + mult * a };
  }
  function laguerreRsi(values, gamma) {
    gamma = gamma || 0.5; var L0 = 0, L1 = 0, L2 = 0, L3 = 0, out = new Array(values.length).fill(null);
    for (var i = 0; i < values.length; i++) {
      var p = values[i], L0p = L0, L1p = L1, L2p = L2, L3p = L3;
      L0 = (1 - gamma) * p + gamma * L0p; L1 = -gamma * L0 + L0p + gamma * L1p; L2 = -gamma * L1 + L1p + gamma * L2p; L3 = -gamma * L2 + L2p + gamma * L3p;
      var cu = 0, cd = 0;
      if (L0 >= L1) cu += L0 - L1; else cd += L1 - L0;
      if (L1 >= L2) cu += L1 - L2; else cd += L2 - L1;
      if (L2 >= L3) cu += L2 - L3; else cd += L3 - L2;
      out[i] = (cu + cd) === 0 ? 0 : cu / (cu + cd);
    }
    return out;
  }
  function heikinTrend(candles) {
    var haOpen = candles[0].open, haClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;
    for (var i = 1; i < candles.length; i++) { var c = candles[i]; haOpen = (haOpen + haClose) / 2; haClose = (c.open + c.high + c.low + c.close) / 4; }
    return { open: haOpen, close: haClose };
  }
  function balanceOfPower(candles, period) {
    period = period || 14;
    var bop = candles.map(function (c) { var r = c.high - c.low; return r === 0 ? 0 : (c.close - c.open) / r; });
    return sma(bop, period);
  }
  function chandeKroll(candles, p, x, q) {
    p = p || 10; x = x || 1; q = q || 9; var i = candles.length - 1; if (i < p + q) return null;
    var a = atr(candles, p), hStops = [], lStops = [];
    for (var k = 0; k < candles.length; k++) {
      if (a[k] == null) { hStops.push(null); lStops.push(null); continue; }
      var hh = -Infinity, ll = Infinity;
      for (var j = Math.max(0, k - p + 1); j <= k; j++) { if (candles[j].high > hh) hh = candles[j].high; if (candles[j].low < ll) ll = candles[j].low; }
      hStops.push(hh - x * a[k]); lStops.push(ll + x * a[k]);
    }
    var longStop = -Infinity, shortStop = Infinity;
    for (var j2 = i - q + 1; j2 <= i; j2++) { if (hStops[j2] != null && hStops[j2] > longStop) longStop = hStops[j2]; if (lStops[j2] != null && lStops[j2] < shortStop) shortStop = lStops[j2]; }
    return { longStop: longStop, shortStop: shortStop };
  }
  function elderRay(candles, period) {
    period = period || 13; var e = last(ema(closes(candles), period)); if (e == null) return null;
    var c = candles[candles.length - 1]; return { bull: c.high - e, bear: c.low - e };
  }
  function elderImpulse(candles) {
    var cl = closes(candles), e = ema(cl, 13), m = macd(cl), i = candles.length - 1;
    if (e[i] == null || e[i - 1] == null || m.hist[i] == null || m.hist[i - 1] == null) return null;
    return { emaUp: e[i] > e[i - 1], histUp: m.hist[i] > m.hist[i - 1] };
  }

  // master list — exactly what indicatorSet can produce (drives the indicator dropdown). 39 indicators.
  var INDICATOR_NAMES = [
    'RSI', 'Stochastic', 'Stochastic RSI', 'Williams %R', 'CCI', 'ROC', 'Momentum', 'TRIX',
    'Ultimate Oscillator', 'Awesome Oscillator', 'Laguerre RSI', 'Balance of Power',
    'MACD', 'ADX', 'Aroon', 'Parabolic SAR', 'Supertrend', 'Ichimoku', 'Vortex Indicator',
    'Hull MA', 'Heikin Ashi Trend', 'Elder Ray', 'Elder Impulse', 'EMA 50', 'EMA 200',
    'Bollinger Bands', 'ATR', 'Keltner Channels', 'Donchian Channels', 'TTM Squeeze',
    'Chandelier Exit', 'Chande Kroll Stop',
    'OBV', 'Force Index', 'Accumulation/Distribution', 'Chaikin Money Flow', 'MFI', 'VWAP',
    'Roshan Indicator'];

  // ───────────────────────── per-indicator signals ─────────────────────────
  function indicatorSet(candles) {
    var cl = closes(candles);
    var out = {};
    function add(name, value, sig, note) { out[name] = { value: round2(value), signal: sig, note: note }; }

    var r = last(rsi(cl, 14));
    if (r != null) add('RSI', r, r < 30 ? 'BUY' : (r > 70 ? 'SELL' : 'WAIT'), 'RSI(14): <30 oversold, >70 overbought');

    var m = macd(cl); var ml = last(m.line), ms = last(m.signal);
    if (ml != null && ms != null) add('MACD', ml - ms, ml > ms ? 'BUY' : 'SELL', 'MACD: line vs signal cross');

    var st = stochastic(candles); var sk = last(st.k);
    if (sk != null) add('Stochastic', sk, sk < 20 ? 'BUY' : (sk > 80 ? 'SELL' : 'WAIT'), 'Stochastic %K: <20 / >80');

    var wr = last(williamsR(candles));
    if (wr != null) add('Williams %R', wr, wr < -80 ? 'BUY' : (wr > -20 ? 'SELL' : 'WAIT'), 'Williams %R: <-80 / >-20');

    var sup = supertrend(candles); var sd = last(sup.dir);
    if (sd != null) add('Supertrend', last(sup.value), sd === 1 ? 'BUY' : 'SELL', 'Supertrend(10,3)');

    var e50 = last(ema(cl, 50)), price = last(cl);
    if (e50 != null) add('EMA 50', e50, price > e50 ? 'BUY' : 'SELL', 'Price vs EMA(50)');

    var e200 = last(ema(cl, 200));
    if (e200 != null) add('EMA 200', e200, price > e200 ? 'BUY' : 'SELL', 'Price vs EMA(200)');

    var bb = bollinger(cl); var bu = last(bb.upper), bl = last(bb.lower);
    if (bu != null) add('Bollinger Bands', last(bb.mid), price <= bl ? 'BUY' : (price >= bu ? 'SELL' : 'WAIT'), 'BB(20,2) band touch');

    var ob = obv(candles); var obSlope = ob.length > 5 ? ob[ob.length - 1] - ob[ob.length - 6] : 0;
    add('OBV', ob[ob.length - 1], obSlope > 0 ? 'BUY' : (obSlope < 0 ? 'SELL' : 'WAIT'), 'OBV slope (5-bar)');

    var ax = last(adx(candles));
    if (ax) add('ADX', ax.adx, ax.adx > 25 ? (ax.pdi > ax.mdi ? 'BUY' : 'SELL') : 'WAIT', 'ADX(14): >25 strong; +DI>-DI buy');

    var p2 = price;
    var vcci = last(cci(candles)); if (vcci != null) add('CCI', vcci, vcci < -100 ? 'BUY' : (vcci > 100 ? 'SELL' : 'WAIT'), 'CCI(20): <-100 BUY, >100 SELL');
    var vroc = last(roc(cl)); if (vroc != null) add('ROC', vroc, vroc > 0 ? 'BUY' : (vroc < 0 ? 'SELL' : 'WAIT'), 'ROC(12): >0 BUY');
    var vmom = last(momentum(cl)); if (vmom != null) add('Momentum', vmom, vmom > 0 ? 'BUY' : (vmom < 0 ? 'SELL' : 'WAIT'), 'Momentum(10)');
    var vmfi = last(mfi(candles)); if (vmfi != null) add('MFI', vmfi, vmfi < 20 ? 'BUY' : (vmfi > 80 ? 'SELL' : 'WAIT'), 'MFI(14): <20 / >80');
    var var_ar = last(aroon(candles)); if (var_ar) add('Aroon', Math.round(var_ar.up - var_ar.down), var_ar.up > var_ar.down ? 'BUY' : (var_ar.down > var_ar.up ? 'SELL' : 'WAIT'), 'Aroon(25): up>down BUY');
    var dc = last(donchian(candles)); if (dc) add('Donchian Channels', dc.upper, p2 >= dc.upper ? 'BUY' : (p2 <= dc.lower ? 'SELL' : 'WAIT'), 'Donchian(20) breakout');
    var vao = last(awesome(candles)); if (vao != null) add('Awesome Oscillator', vao, vao > 0 ? 'BUY' : (vao < 0 ? 'SELL' : 'WAIT'), 'AO: >0 bullish');
    var vsr = last(stochRsi(cl)); if (vsr != null) add('Stochastic RSI', vsr, vsr < 20 ? 'BUY' : (vsr > 80 ? 'SELL' : 'WAIT'), 'Stoch RSI: <20 / >80');
    var vvw = last(vwapRolling(candles)); if (vvw != null) add('VWAP', vvw, p2 > vvw ? 'BUY' : 'SELL', 'VWAP(20): price above BUY');
    var kc = keltner(candles); var kU = last(kc.upper), kL = last(kc.lower), kM = last(kc.mid);
    if (kU != null) add('Keltner Channels', kM, p2 >= kU ? 'SELL' : (p2 <= kL ? 'BUY' : 'WAIT'), 'Keltner(20): band touch');
    var vtx = last(trix(cl)); if (vtx != null) add('TRIX', vtx, vtx > 0 ? 'BUY' : (vtx < 0 ? 'SELL' : 'WAIT'), 'TRIX(15): >0 BUY');

    // ── full-catalogue indicators ──
    var vuo = last(ultimateOsc(candles)); if (vuo != null) add('Ultimate Oscillator', vuo, vuo < 30 ? 'BUY' : (vuo > 70 ? 'SELL' : 'WAIT'), 'UO: <30 BUY, >70 SELL');
    var vsar = last(psar(candles)); if (vsar != null) add('Parabolic SAR', vsar, p2 > vsar ? 'BUY' : 'SELL', 'PSAR: price above = BUY');
    var ich = ichimoku(candles); if (ich) add('Ichimoku', round2(ich.cloudTop), p2 > ich.cloudTop ? 'BUY' : (p2 < ich.cloudBot ? 'SELL' : 'WAIT'), 'Ichimoku: above cloud BUY');
    var vvor = vortex(candles); if (vvor) add('Vortex Indicator', round2(vvor.viP), vvor.viP > vvor.viM ? 'BUY' : 'SELL', 'Vortex(14): VI+>VI- BUY');
    var vhma = last(hma(cl, 20)); if (vhma != null) add('Hull MA', round2(vhma), p2 > vhma ? 'BUY' : 'SELL', 'Hull MA(20): price above BUY');
    var hat = heikinTrend(candles); if (hat) add('Heikin Ashi Trend', round2(hat.close), hat.close > hat.open ? 'BUY' : 'SELL', 'Heikin Ashi: green = BUY');
    var er = elderRay(candles); if (er) add('Elder Ray', round2(er.bull), (er.bull > 0 && er.bear > 0) ? 'BUY' : ((er.bull < 0 && er.bear < 0) ? 'SELL' : 'WAIT'), 'Elder Ray: bull/bear vs EMA13');
    var eimp = elderImpulse(candles); if (eimp) add('Elder Impulse', null, (eimp.emaUp && eimp.histUp) ? 'BUY' : ((!eimp.emaUp && !eimp.histUp) ? 'SELL' : 'WAIT'), 'Elder Impulse: EMA13 + MACD hist');
    var vatr = last(atr(candles, 14)); if (vatr != null) add('ATR', round2(vatr), 'WAIT', 'ATR(14): volatility unit for stops');
    var ttm = ttmSqueeze(candles); if (ttm) add('TTM Squeeze', round2(ttm.mom), ttm.on ? 'WAIT' : (ttm.mom > 0 ? 'BUY' : 'SELL'), 'TTM: squeeze on = wait');
    var vce = chandelier(candles); if (vce) add('Chandelier Exit', round2(vce.longStop), p2 > vce.longStop ? 'BUY' : 'SELL', 'Chandelier(22,3) trailing stop');
    var vck = chandeKroll(candles); if (vck) add('Chande Kroll Stop', round2(vck.longStop), p2 > vck.longStop ? 'BUY' : 'SELL', 'Chande Kroll trailing stop');
    var vfi = last(forceIndex(candles)); if (vfi != null) add('Force Index', round2(vfi), vfi > 0 ? 'BUY' : 'SELL', 'Force Index(13): >0 BUY');
    var vadl = adl(candles); var adlSlope = vadl.length > 5 ? vadl[vadl.length - 1] - vadl[vadl.length - 6] : 0; add('Accumulation/Distribution', round2(last(vadl)), adlSlope > 0 ? 'BUY' : (adlSlope < 0 ? 'SELL' : 'WAIT'), 'A/D line slope');
    var vcmf = last(cmf(candles)); if (vcmf != null) add('Chaikin Money Flow', Math.round(vcmf * 1000) / 1000, vcmf > 0 ? 'BUY' : (vcmf < 0 ? 'SELL' : 'WAIT'), 'CMF(20): >0 BUY');
    var vlag = last(laguerreRsi(cl)); if (vlag != null) add('Laguerre RSI', Math.round(vlag * 100) / 100, vlag < 0.2 ? 'BUY' : (vlag > 0.8 ? 'SELL' : 'WAIT'), 'Laguerre RSI: <0.2 BUY, >0.8 SELL');
    var vbop = last(balanceOfPower(candles)); if (vbop != null) add('Balance of Power', Math.round(vbop * 1000) / 1000, vbop > 0 ? 'BUY' : (vbop < 0 ? 'SELL' : 'WAIT'), 'BOP: >0 buyers in control');

    var ro = roshan(cl);
    add('Roshan Indicator', ro.value, ro.signal, 'Roshan: RSI(14) vs SMA20 of RSI (custom)');

    return out;
  }

  // ───────────────────────── trend / momentum / volume ─────────────────────────
  function trendOf(candles) {
    var cl = closes(candles);
    var e20 = last(ema(cl, 20)), e50 = last(ema(cl, 50)), e200 = last(ema(cl, 200)), price = last(cl);
    var ax = last(adx(candles));
    var strength = ax ? Math.min(1, ax.adx / 50) : 0.3;
    if (e50 == null) return { dir: 'sideways', strength: 0.2 };
    var up = price > e50 && (e20 == null || e20 >= e50) && (e200 == null || price > e200);
    var dn = price < e50 && (e20 == null || e20 <= e50) && (e200 == null || price < e200);
    var trendStrong = ax && ax.adx > 22;
    if (up && trendStrong) return { dir: 'up', strength: strength };
    if (dn && trendStrong) return { dir: 'down', strength: strength };
    if (up) return { dir: 'up', strength: Math.max(0.35, strength * 0.7) };
    if (dn) return { dir: 'down', strength: Math.max(0.35, strength * 0.7) };
    return { dir: 'sideways', strength: 0.25 };
  }

  function tfVerdict(candles) {
    // a per-timeframe BUY/SELL/HOLD from a small indicator vote, governed by trend
    var t = trendOf(candles);
    var ind = indicatorSet(candles);
    var buy = 0, sell = 0, tot = 0;
    Object.keys(ind).forEach(function (k) {
      var s = ind[k].signal; if (s === 'WAIT') return;
      tot++; if (s === 'BUY') buy++; else if (s === 'SELL') sell++;
    });
    var lean = tot === 0 ? 0 : (buy - sell) / tot;
    var verdict = 'HOLD';
    if (t.dir === 'up' && lean > 0.15) verdict = 'BUY';
    else if (t.dir === 'down' && lean < -0.15) verdict = 'SELL';
    else if (t.dir === 'sideways') verdict = 'HOLD';
    return { trend: t.dir, strength: t.strength, lean: lean, verdict: verdict, indicators: ind, buy: buy, sell: sell, total: tot };
  }

  // ───────────────────────── ladders + confluence ─────────────────────────
  var LADDERS = {
    longterm:   { dir: ['monthly', 'weekly'], trigger: 'daily',  rr: 3 },
    positional: { dir: ['weekly'],            trigger: 'daily',  rr: 3 },
    swing:      { dir: ['daily'],             trigger: '4h',     rr: 2 },
    intraday:   { dir: ['4h'],                trigger: '1h',     rr: 1.5 }
  };

  function confluence(candlesByTf, tradeType) {
    var L = LADDERS[tradeType] || LADDERS.swing;
    var perTf = {};
    var dirVerdicts = [];
    L.dir.forEach(function (tf) {
      if (!candlesByTf[tf]) return;
      var v = tfVerdict(candlesByTf[tf]); perTf[tf] = v; dirVerdicts.push(v);
    });
    var trig = candlesByTf[L.trigger] ? tfVerdict(candlesByTf[L.trigger]) : null;
    if (trig) perTf[L.trigger] = trig;

    // higher TF governs direction
    var dirSide = 'sideways';
    if (dirVerdicts.length) {
      var ups = dirVerdicts.filter(function (v) { return v.trend === 'up'; }).length;
      var dns = dirVerdicts.filter(function (v) { return v.trend === 'down'; }).length;
      if (ups === dirVerdicts.length) dirSide = 'up';
      else if (dns === dirVerdicts.length) dirSide = 'down';
      else dirSide = 'mixed';
    }

    var verdict = 'HOLD', why = '';
    if (dirSide === 'sideways' || dirSide === 'mixed') {
      verdict = 'HOLD';
      why = dirSide === 'mixed' ? 'higher timeframes disagree — wait for alignment'
                                : 'no clean trend on the higher timeframe';
    } else if (trig) {
      if (dirSide === 'up' && trig.verdict === 'BUY') { verdict = 'BUY'; why = 'higher timeframe up, trigger confirms'; }
      else if (dirSide === 'down' && trig.verdict === 'SELL') { verdict = 'SELL'; why = 'higher timeframe down, trigger confirms'; }
      else { verdict = 'HOLD'; why = 'higher timeframe (' + dirSide + ') and trigger (' + trig.verdict + ') disagree — wait'; }
    } else { verdict = 'HOLD'; why = 'trigger timeframe unavailable'; }

    // confidence
    var avgStrength = dirVerdicts.length ? dirVerdicts.reduce(function (a, v) { return a + v.strength; }, 0) / dirVerdicts.length : 0;
    var conf = 'LOW';
    if (verdict !== 'HOLD') {
      var triggerLean = Math.abs(trig ? trig.lean : 0);
      if (avgStrength > 0.5 && triggerLean > 0.4) conf = 'HIGH';
      else if (avgStrength > 0.3 && triggerLean > 0.2) conf = 'MEDIUM';
      else conf = 'LOW';
    }
    var score = Math.max(0, Math.min(1, (avgStrength + Math.abs(trig ? trig.lean : 0)) / 2));

    // contributing / contradicting (from trigger indicators)
    var contributing = [], contradicting = [];
    if (trig) {
      Object.keys(trig.indicators).forEach(function (k) {
        var s = trig.indicators[k].signal; if (s === 'WAIT') return;
        var aligns = (verdict === 'BUY' && s === 'BUY') || (verdict === 'SELL' && s === 'SELL');
        (aligns ? contributing : contradicting).push(k + ' ' + s);
      });
    }
    return {
      verdict: verdict, confidence: conf, score: round2(score), why: why,
      direction_side: dirSide, ladder: L, per_tf: perTf,
      contributing: contributing, contradicting: contradicting
    };
  }

  // ───────────────────────── risk engine (NO stop → NO signal) ─────────────────────────
  function riskBlock(candles, side, rrFloor, riskBudget) {
    rrFloor = rrFloor || 2; riskBudget = riskBudget || 2000;
    var cl = closes(candles);
    var price = last(cl);
    var a = last(atr(candles, 14)) || (price * 0.01);
    // structure: recent swing low/high over last 20 bars
    var win = candles.slice(-20);
    var swingLow = Math.min.apply(null, win.map(function (c) { return c.low; }));
    var swingHigh = Math.max.apply(null, win.map(function (c) { return c.high; }));

    var entryIdeal = round2(price);
    var stopStruct, stopAtr, stopPrice, valid = true, targets = [];
    if (side === 'BUY') {
      stopStruct = round2(Math.min(swingLow, price - a));
      stopAtr = round2(price - 1.5 * a);
      stopPrice = round2(Math.min(stopStruct, stopAtr)); // safer (lower) stop
      if (stopPrice >= price) valid = false;
      var riskUnit = price - stopPrice;
      [1, 2, 3].forEach(function (n, idx) {
        var mult = [rrFloor, rrFloor + 1.5, rrFloor + 3][idx];
        targets.push({ price: round2(price + riskUnit * mult), rr: '1:' + mult });
      });
    } else if (side === 'SELL') {
      stopStruct = round2(Math.max(swingHigh, price + a));
      stopAtr = round2(price + 1.5 * a);
      stopPrice = round2(Math.max(stopStruct, stopAtr));
      if (stopPrice <= price) valid = false;
      var ru = stopPrice - price;
      [1, 2, 3].forEach(function (n, idx) {
        var mult = [rrFloor, rrFloor + 1.5, rrFloor + 3][idx];
        targets.push({ price: round2(price - ru * mult), rr: '1:' + mult });
      });
    } else {
      return { valid: false, reason: 'no_direction' };
    }

    var riskUnitAbs = Math.abs(price - stopPrice);
    var rrFirst = riskUnitAbs === 0 ? 0 : Math.abs(targets[0].price - price) / riskUnitAbs;
    if (!valid || riskUnitAbs <= 0) return { valid: false, reason: 'no_clean_stop' };
    if (rrFirst + 1e-9 < rrFloor) return { valid: false, reason: 'rr_below_floor', rr: round2(rrFirst) };

    var qty = Math.max(0, Math.floor(riskBudget / riskUnitAbs));
    var pct = round2((riskUnitAbs / price) * 100);
    return {
      valid: true,
      entry: { ideal: entryIdeal, aggressive: round2(price + (side === 'BUY' ? -0.2 * a : 0.2 * a)),
               conservative: round2(price + (side === 'BUY' ? 0.3 * a : -0.3 * a)),
               zone: side === 'BUY' ? [round2(price - 0.3 * a), round2(price + 0.2 * a)]
                                    : [round2(price - 0.2 * a), round2(price + 0.3 * a)] },
      stop: { price: stopPrice, pct: pct, atr: stopAtr, structure: stopStruct, recommended: 'structure' },
      targets: targets,
      position_size: { qty: qty, rupee_risk: round2(qty * riskUnitAbs) },
      invalidation: side === 'BUY' ? 'wrong if price closes below ' + stopPrice
                                   : 'wrong if price closes above ' + stopPrice
    };
  }

  // ───────────────────────── top-level scan ─────────────────────────
  function scan(candlesByTf, opts) {
    opts = opts || {};
    var tradeType = opts.tradeType || 'swing';
    var riskBudget = opts.riskBudget || 2000;
    var conf = confluence(candlesByTf, tradeType);
    var triggerTf = conf.ladder.trigger;
    var triggerCandles = candlesByTf[triggerTf];
    var out = {
      trade_type: tradeType,
      verdict: conf.verdict,
      confidence: conf.confidence,
      confluence_score: conf.score,
      why: conf.why,
      timeframes: {},
      contributing: conf.contributing,
      contradicting: conf.contradicting,
      disclaimer: 'NOT SEBI REGISTERED — educational analysis, not advice'
    };
    Object.keys(conf.per_tf).forEach(function (tf) {
      var v = conf.per_tf[tf];
      out.timeframes[tf] = { trend: v.trend, verdict: v.verdict };
    });

    if (conf.verdict === 'BUY' || conf.verdict === 'SELL') {
      var rb = riskBlock(triggerCandles, conf.verdict, conf.ladder.rr, riskBudget);
      if (!rb.valid) {
        // GUARDRAIL: no clean stop / RR below floor → downgrade to HOLD
        out.verdict = 'HOLD';
        out.confidence = 'LOW';
        out.why = rb.reason === 'rr_below_floor'
          ? 'reward does not justify the risk (RR below ' + conf.ladder.rr + ') — skip this trade'
          : 'no clean stop here — skip this trade';
        out.risk_downgraded = true;
      } else {
        out.entry = rb.entry;
        out.stop = rb.stop;
        out.targets = rb.targets;
        out.position_size = rb.position_size;
        out.invalidation = rb.invalidation;
      }
    }
    // Roshan surfaced explicitly
    if (triggerCandles) out.roshan = roshan(closes(triggerCandles));
    return out;
  }

  // ───────────────────────── seeded DEMO candle synthesizer ─────────────────────────
  // Honest: this is deterministic demo data so the page works offline. The UI labels
  // it "DEMO — tap Refresh to fetch live (needs backend)". Live candles replace it.
  function strHash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function genCandles(symbol, timeframe, n, basePrice) {
    n = n || 220;
    var seed = strHash(symbol + '|' + timeframe);
    var rnd = mulberry32(seed);
    // per-symbol structural bias so different stocks show different setups
    var biasPick = strHash(symbol) % 5; // 0..4
    var tfBias = { monthly: 1.0, weekly: 0.8, daily: 0.5, '4h': 0.3, '1h': 0.15, '15m': 0.1, '5m': 0.06, '1m': 0.03 }[timeframe] || 0.5;
    // realistic stock model = drift (trend) + slow wave + bounded noise (geometric-Brownian-ish),
    // so trending names trend and choppy names chop — far more honest than pure noise.
    var drift = ((biasPick - 2) / 2) * 0.0042 * tfBias; // up to ±0.42%/bar (daily) — a visible trend
    var price = basePrice || (50 + (strHash(symbol) % 4000));
    var vol0 = 100000 + (strHash(symbol + 'v') % 900000);
    var candles = [];
    for (var i = 0; i < n; i++) {
      var shock = (rnd() - 0.5) * 0.018;            // ±0.9% bounded noise
      var wave = Math.sin(i / 11 + biasPick) * 0.006; // ±0.6% slow cycle
      var ret = drift + wave + shock;
      var open = price;
      var close = Math.max(1, open * (1 + ret));
      var hi = Math.max(open, close) * (1 + rnd() * 0.012);
      var lo = Math.min(open, close) * (1 - rnd() * 0.012);
      var volume = Math.floor(vol0 * (0.6 + rnd() * 0.9));
      candles.push({ open: round2(open), high: round2(hi), low: round2(lo), close: round2(close), volume: volume, t: i });
      price = close;
    }
    return candles;
  }

  function genAllTf(symbol, basePrice) {
    return {
      monthly: genCandles(symbol, 'monthly', 220, basePrice),
      weekly: genCandles(symbol, 'weekly', 220, basePrice),
      daily: genCandles(symbol, 'daily', 260, basePrice),
      '4h': genCandles(symbol, '4h', 260, basePrice),
      '1h': genCandles(symbol, '1h', 260, basePrice),
      '15m': genCandles(symbol, '15m', 260, basePrice),
      '5m': genCandles(symbol, '5m', 260, basePrice),
      '1m': genCandles(symbol, '1m', 260, basePrice)
    };
  }

  // ───────────────────────── universe + screener ─────────────────────────
  // market-cap tiers (₹ crore): Nifty50 | Large >1L | Mid 50k-1L | Small 5k-50k | Micro <5k
  function tierOf(mcapCr, inNifty50) {
    if (inNifty50) return 'Nifty 50';
    if (mcapCr > 100000) return 'Large Cap';
    if (mcapCr >= 50000) return 'Mid Cap';
    if (mcapCr >= 5000) return 'Small Cap';
    return 'Micro Cap';
  }

  // representative NSE universe (honest subset; full list loads from backend)
  var UNIVERSE = [
    { sym: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', mcap: 1900000, n50: true },
    { sym: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', mcap: 1400000, n50: true },
    { sym: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', mcap: 1250000, n50: true },
    { sym: 'INFY', name: 'Infosys', sector: 'IT', mcap: 650000, n50: true },
    { sym: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', mcap: 800000, n50: true },
    { sym: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', mcap: 900000, n50: true },
    { sym: 'ITC', name: 'ITC', sector: 'FMCG', mcap: 550000, n50: true },
    { sym: 'SBIN', name: 'State Bank of India', sector: 'Banking', mcap: 720000, n50: true },
    { sym: 'LT', name: 'Larsen & Toubro', sector: 'Infra', mcap: 480000, n50: true },
    { sym: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', mcap: 560000, n50: true },
    { sym: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', mcap: 320000, n50: true },
    { sym: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', mcap: 280000, n50: false },
    { sym: 'PIIND', name: 'PI Industries', sector: 'Chemicals', mcap: 62000, n50: false },
    { sym: 'CUMMINSIND', name: 'Cummins India', sector: 'Capital Goods', mcap: 78000, n50: false },
    { sym: 'ASTRAL', name: 'Astral', sector: 'Building', mcap: 52000, n50: false },
    { sym: 'CDSL', name: 'Central Depository', sector: 'Financial', mcap: 28000, n50: false },
    { sym: 'IEX', name: 'Indian Energy Exchange', sector: 'Financial', mcap: 16000, n50: false },
    { sym: 'KPITTECH', name: 'KPIT Technologies', sector: 'IT', mcap: 38000, n50: false },
    { sym: 'TANLA', name: 'Tanla Platforms', sector: 'IT', mcap: 9000, n50: false },
    { sym: 'RAILTEL', name: 'RailTel', sector: 'Telecom', mcap: 12000, n50: false },
    { sym: 'HCC', name: 'Hindustan Construction', sector: 'Infra', mcap: 4200, n50: false },
    { sym: 'SUZLON', name: 'Suzlon Energy', sector: 'Energy', mcap: 4800, n50: false },
    { sym: 'GTLINFRA', name: 'GTL Infrastructure', sector: 'Telecom', mcap: 2300, n50: false },
    { sym: 'RTNPOWER', name: 'RattanIndia Power', sector: 'Energy', mcap: 3900, n50: false }
  ].map(function (s) { return Object.assign({}, s, { tier: tierOf(s.mcap, s.n50) }); });

  function matchFilters(stock, scanResult, filters) {
    if (!filters) return true;
    if (filters.tiers && filters.tiers.length && filters.tiers.indexOf(stock.tier) === -1) return false;
    if (filters.sectors && filters.sectors.length && filters.sectors.indexOf(stock.sector) === -1) return false;
    var ind = scanResult.roshan ? scanResult : null;
    if (filters.roshan && (!scanResult.roshan || scanResult.roshan.signal !== filters.roshan)) return false;
    if (filters.verdict && scanResult.verdict !== filters.verdict) return false;
    // RSI filter against trigger tf
    if (filters.rsi) {
      var t = scanResult.timeframes;
      // derive RSI from a fresh compute on trigger candles handled by caller; skip if absent
    }
    return true;
  }

  // only the timeframes a trade type actually needs (keeps the screener fast over a big universe)
  function neededTfs(tradeType) { var L = LADDERS[tradeType] || LADDERS.swing; return L.dir.concat([L.trigger]); }
  function scanSymbol(sym, tradeType) {
    var tfs = {};
    neededTfs(tradeType).forEach(function (tf) {
      var n = (tf === 'daily' || tf === '4h' || tf === '1h') ? 260 : 220;
      tfs[tf] = genCandles(sym, tf, n);
    });
    return scan(tfs, { tradeType: tradeType });
  }
  // universe: array of {sym, tier, name, sector?}. Defaults to the curated UNIVERSE.
  // cap: max symbols to scan per run (browser-perf guard over the full ~800-name NSE list).
  function screen(filters, tradeType, universe, cap) {
    tradeType = tradeType || 'swing';
    universe = universe || UNIVERSE;
    var list = (cap && cap < universe.length) ? universe.slice(0, cap) : universe;
    var rows = [];
    list.forEach(function (stock) {
      var res = scanSymbol(stock.sym, tradeType);
      if (matchFilters(stock, res, filters)) {
        rows.push({ stock: stock, verdict: res.verdict, confidence: res.confidence,
                    score: res.confluence_score, roshan: res.roshan ? res.roshan.signal : null });
      }
    });
    rows.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    return rows;
  }

  // ───────────────────────── Chitti Explain (deterministic template) ─────────────────────────
  // NB: a bare "100%" is legitimate (confluence can be 100%); only certainty/accuracy claims are banned.
  var BANNED = ['guaranteed', 'sure-shot', 'sureshot', 'sure shot', '100% accurate', '100% accuracy',
    'cannot lose', "can't lose", 'risk-free', 'risk free', 'multibagger guaranteed', 'definitely will',
    'no stop loss needed', 'no need for a stop'];

  function explain(signal) {
    var v = signal.verdict;
    if (v === 'HOLD') {
      return 'This is a HOLD — no clean trade right now. ' + (signal.why || '') +
             '. Waiting is a valid decision. This is educational analysis, not advice. NOT SEBI REGISTERED.';
    }
    var s = signal;
    var txt = 'This is a ' + (s.confidence || '').toLowerCase() + '-confidence ' + v.toLowerCase() + '. ' +
      (s.why || '') + '. ';
    if (s.entry && s.stop && s.targets) {
      txt += (v === 'BUY' ? 'Buy near ' : 'Sell near ') + s.entry.ideal + ', keep a stop at ' + s.stop.price +
        ' (' + s.invalidation + '). First target ' + s.targets[0].price + ' (' + s.targets[0].rr + '). ' +
        'You decide the size that fits your risk. ';
    }
    txt += 'This is education, not advice. NOT SEBI REGISTERED.';
    return txt;
  }

  function hasBannedPhrase(text) {
    var low = (text || '').toLowerCase();
    for (var i = 0; i < BANNED.length; i++) { if (low.indexOf(BANNED[i]) !== -1) return BANNED[i]; }
    return null;
  }

  // ═══════════════════ CEOS FINAL v1.0 LAYER (on top of the 39 indicators) ═══════════════════
  // Classic floor-trader pivots from the PREVIOUS completed period's H/L/C (PDF §5.4).
  function classicPivots(ph, pl, pc) {
    var pp = (ph + pl + pc) / 3;
    return { pp: round2(pp),
      r1: round2(2 * pp - pl), r2: round2(pp + (ph - pl)), r3: round2(ph + 2 * (pp - pl)),
      s1: round2(2 * pp - ph), s2: round2(pp - (ph - pl)), s3: round2(pl - 2 * (ph - pp)) };
  }
  // Camarilla pivots — simplified gravity grid Close ± (H-L)×{0.25..1.25} (PDF §5.3).
  function camarillaPivots(ph, pl, pc) {
    var r = ph - pl;
    return {
      h5: round2(pc + r * 1.25), h4: round2(pc + r * 1.00), h3: round2(pc + r * 0.75),
      h2: round2(pc + r * 0.50), h1: round2(pc + r * 0.25),
      l1: round2(pc - r * 0.25), l2: round2(pc - r * 0.50), l3: round2(pc - r * 0.75),
      l4: round2(pc - r * 1.00), l5: round2(pc - r * 1.25)
    };
  }
  function pivotsFor(candles) {
    if (!candles || candles.length < 2) return null;
    var p = candles[candles.length - 2]; // previous completed period
    return { classic: classicPivots(p.high, p.low, p.close), camarilla: camarillaPivots(p.high, p.low, p.close) };
  }
  // Swing pivots: a bar that is the local extreme over ±2 bars.
  function swingLevels(candles) {
    var hi = [], lo = [], n = candles.length;
    for (var i = 2; i < n - 2; i++) {
      var c = candles[i];
      if (c.high > candles[i-1].high && c.high > candles[i-2].high && c.high > candles[i+1].high && c.high > candles[i+2].high) hi.push(c.high);
      if (c.low  < candles[i-1].low  && c.low  < candles[i-2].low  && c.low  < candles[i+1].low  && c.low  < candles[i+2].low ) lo.push(c.low);
    }
    return { highs: hi.slice(-60), lows: lo.slice(-60) };
  }
  // MTF S/R confluence zones — aggregate swing levels across Daily/4H/1H, group ≤0.5%, score (PDF §7.1).
  function srConfluence(candlesByTf) {
    var tfWeight = { daily: 3, '4h': 2, '1h': 1 }, levels = [];
    Object.keys(tfWeight).forEach(function (tf) {
      if (!candlesByTf[tf] || candlesByTf[tf].length < 10) return;
      var sw = swingLevels(candlesByTf[tf]);
      sw.highs.forEach(function (p) { levels.push({ price: p, type: 'R', w: tfWeight[tf], tf: tf }); });
      sw.lows.forEach(function (p) { levels.push({ price: p, type: 'S', w: tfWeight[tf], tf: tf }); });
    });
    if (!levels.length) return [];
    levels.sort(function (a, b) { return a.price - b.price; });
    var zones = [], cur = null;
    levels.forEach(function (l) {
      if (cur && Math.abs(l.price - cur.center) / cur.center <= 0.005) {
        cur.members.push(l); cur.score += l.w; cur.tfs[l.tf] = true;
        cur.center = cur.members.reduce(function (a, m) { return a + m.price; }, 0) / cur.members.length;
      } else { cur = { center: l.price, members: [l], score: l.w, tfs: {}, type: l.type }; cur.tfs[l.tf] = true; zones.push(cur); }
    });
    return zones.map(function (z) {
      var sc = Math.min(10, z.score + (z.members.length - 1) * 2);
      return { price: round2(z.center), score: sc, type: z.type, timeframes: Object.keys(z.tfs),
        touches: z.members.length, strength: (sc >= 8 ? 'STRONG' : (sc >= 5 ? 'MODERATE' : 'WEAK')) };
    }).filter(function (z) { return z.score >= 3; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }

  // ATR-based risk: SL = Entry ∓ ATR×2 · T1 = ±ATR×1.5 · T2 = ±ATR×3 + position sizing (PDF §8, §8.3).
  function atrRiskBlock(dailyCandles, side, opts) {
    opts = opts || {};
    var capital = opts.capital || 100000, riskPct = opts.riskPercent || 2;
    var price = last(closes(dailyCandles));
    var a = last(atr(dailyCandles, 14)); if (a == null || a <= 0) a = price * 0.01;
    var sl, t1, t2;
    if (side === 'BUY') { sl = price - a * 2; t1 = price + a * 1.5; t2 = price + a * 3; }
    else { sl = price + a * 2; t1 = price - a * 1.5; t2 = price - a * 3; }
    var rps = Math.abs(price - sl), rrr = rps ? Math.abs(t1 - price) / rps : 0;
    var riskAmt = capital * (riskPct / 100), shares = rps ? Math.floor(riskAmt / rps) : 0;
    return {
      entry: round2(price), atr: round2(a),
      stop_loss: { price: round2(sl), percentage: round2((sl - price) / price * 100), calculation: 'Entry ' + (side === 'BUY' ? '-' : '+') + ' (ATR × 2), ATR=' + round2(a) },
      target_1: { price: round2(t1), percentage: round2((t1 - price) / price * 100), action: 'Book 50% here' },
      target_2: { price: round2(t2), percentage: round2((t2 - price) / price * 100), action: 'Book remaining 50% here' },
      risk_reward_ratio: '1:' + round2(rrr),
      position_size: { capital: capital, risk_percent: riskPct, risk_amount: round2(riskAmt), risk_per_share: round2(rps), shares: shares, investment: round2(shares * price) }
    };
  }

  // 4 preset confluence modes (PDF §6.4): trend TFs set direction, entry TF triggers.
  var CONFLUENCE_MODES = {
    longterm:  { label: 'Long-Term Investor', trend: ['monthly', 'weekly'], entry: 'daily' },
    swing:     { label: 'Aggressive Swing',   trend: ['weekly', 'daily'],   entry: '4h' },
    daytrader: { label: 'Day Trader',         trend: ['daily', '4h'],       entry: '1h' },
    scalper:   { label: 'Scalper',            trend: ['4h', '1h'],          entry: '15m' }
  };
  // Per-timeframe BULL/BEAR/NEUTRAL per the CEOS conditions table (PDF §6.2).
  function tfBias(tf, candles) {
    if (!candles || candles.length < 30) return 'NEUTRAL';
    var cl = closes(candles), price = last(cl);
    var e200 = last(ema(cl, 200)), e50 = last(ema(cl, 50)), e21 = last(ema(cl, 21)), e9 = last(ema(cl, 9));
    var r = last(rsi(cl, 14)), ax = last(adx(candles)), adxV = ax ? ax.adx : 0;
    var hist = last(macd(cl).hist), vw = last(vwapRolling(candles));
    switch (tf) {
      case 'monthly': if (e200 != null) return price > e200 ? 'BULL' : (price < e200 ? 'BEAR' : 'NEUTRAL'); break;
      case 'weekly':  if (e50 != null)  return price > e50 ? 'BULL' : (price < e50 ? 'BEAR' : 'NEUTRAL'); break;
      case 'daily':   if (e21 != null) { if (price > e21 && r > 50 && adxV > 25) return 'BULL'; if (price < e21 && r < 50 && adxV > 25) return 'BEAR'; return price > e21 ? 'BULL' : (price < e21 ? 'BEAR' : 'NEUTRAL'); } break;
      case '4h':      if (vw != null)   return price > vw ? 'BULL' : (price < vw ? 'BEAR' : 'NEUTRAL'); break;
      case '1h':      if (e200 != null) { var mb = hist != null && hist > 0; return (price > e200 && mb) ? 'BULL' : ((price < e200 && !mb) ? 'BEAR' : (price > e200 ? 'BULL' : 'BEAR')); } break;
      case '15m':     if (e9 != null && e21 != null) return e9 > e21 ? 'BULL' : 'BEAR'; break;
      case '5m':      var c = candles[candles.length - 1]; return c.close > c.open ? 'BULL' : 'BEAR';
    }
    return 'NEUTRAL';
  }
  function confluenceScore(candlesByTf, tfs) {
    var perTf = {}, bull = 0, bear = 0;
    tfs.forEach(function (tf) { var b = tfBias(tf, candlesByTf[tf]); perTf[tf] = b; if (b === 'BULL') bull++; else if (b === 'BEAR') bear++; });
    var total = tfs.length, dominant = Math.max(bull, bear);
    var bias = bull > bear ? 'BULLISH' : (bear > bull ? 'BEARISH' : 'NEUTRAL');
    var pct = total ? Math.round(dominant / total * 100) : 0;
    var quality = pct >= 100 ? 'PERFECT' : (pct >= 80 ? 'STRONG' : (pct >= 60 ? 'MODERATE' : (pct >= 40 ? 'WEAK' : 'NONE')));
    return { score: dominant, total: total, percent: pct, bias: bias, quality: quality, per_tf: perTf, bull: bull, bear: bear };
  }

  // The CEOS signal — confluence (mode) → direction (≥60%) → ATR SL/T1/T2 + sizing → full JSON (PDF §8.2).
  var TF_ORDER = ['monthly', 'weekly', 'daily', '4h', '1h', '15m', '5m', '1m'];
  function generateSignal(candlesByTf, opts) {
    opts = opts || {};
    var mode = CONFLUENCE_MODES[opts.mode || 'swing'] || CONFLUENCE_MODES.swing;
    // User-picked timeframes (R-BO1/R-BO2) take precedence over a preset mode.
    var tfs = (opts.tfs && opts.tfs.length) ? opts.tfs.slice() : mode.trend.concat([mode.entry]);
    var conf = confluenceScore(candlesByTf, tfs);
    // Price anchor = the lowest (fastest) selected TF with data — that's where you actually enter.
    var anchorTf = null;
    for (var ai = TF_ORDER.length - 1; ai >= 0; ai--) { if (tfs.indexOf(TF_ORDER[ai]) >= 0 && candlesByTf[TF_ORDER[ai]] && candlesByTf[TF_ORDER[ai]].length) { anchorTf = TF_ORDER[ai]; break; } }
    var daily = candlesByTf.daily || (anchorTf ? candlesByTf[anchorTf] : null) || candlesByTf.weekly;
    var price = daily ? last(closes(daily)) : null;
    var verdict = 'HOLD';
    if (conf.percent >= 60 && conf.bias === 'BULLISH') verdict = 'BUY';
    else if (conf.percent >= 60 && conf.bias === 'BEARISH') verdict = 'SELL';
    var out = {
      mode: opts.mode || (opts.tfs ? 'custom' : 'swing'), mode_label: (opts.tfs && opts.tfs.length) ? ('Custom: ' + tfs.join(', ')) : mode.label, timeframes: tfs,
      confluence_score: conf.score + '/' + conf.total + ' (' + conf.percent + '%)',
      confluence_quality: conf.quality, confluence: conf,
      signal: verdict, confidence: Math.round(conf.percent * (verdict === 'HOLD' ? 0.5 : 0.95)),
      entry_price: price != null ? round2(price) : null,
      pivots: daily ? pivotsFor(daily) : null, sr_zones: srConfluence(candlesByTf),
      indicators: daily ? indicatorSet(daily) : {},
      disclaimer: 'Past performance does not guarantee future results. Trading involves risk of loss. NOT SEBI REGISTERED — not financial advice.'
    };
    if (verdict === 'BUY' || verdict === 'SELL') {
      var rb = atrRiskBlock(daily, verdict, opts);
      if (!rb || rb.position_size.risk_per_share <= 0) { out.signal = 'HOLD'; out.why = 'no valid ATR stop — skip'; }
      else {
        out.atr = rb.atr; out.stop_loss = rb.stop_loss; out.target_1 = rb.target_1; out.target_2 = rb.target_2;
        out.risk_reward_ratio = rb.risk_reward_ratio; out.position_size = rb.position_size;
        out.invalidation = (verdict === 'BUY' ? 'wrong if price closes below ' : 'wrong if price closes above ') + rb.stop_loss.price;
      }
    } else { out.why = conf.percent < 40 ? 'no alignment — NO TRADE' : 'weak confluence — wait for alignment'; }
    return out;
  }

  // ─────────────── Safety guardrails (deterministic, NO LLM) — PDF §13 ───────────────
  var CRISIS_KEYWORDS = ['suicide', 'kill myself', 'kill my self', 'end my life', 'want to die',
    'end it all', 'self harm', 'self-harm', 'no reason to live', 'better off dead',
    'khudkushi', 'marna chahta', 'jaan dena', 'help me die'];
  function detectCrisis(text) { if (!text) return false; var t = String(text).toLowerCase(); return CRISIS_KEYWORDS.some(function (k) { return t.indexOf(k) >= 0; }); }
  function crisisResponse() {
    return { visual: '🆘 CRISIS SUPPORT: Tele-MANAS 14416 — free, confidential, 24/7',
      audio: 'This sounds very difficult. Please call Tele dash MANAS at 1 4 4 1 6. They are available 24 by 7 and can help.',
      haptic: 'WARNING', number: '14416' };
  }
  // Loss spiral: 3 consecutive losers summing > 5% of capital → mandatory cool-down (PDF §13.4).
  function detectLossSpiral(trades, capital) {
    if (!trades || trades.length < 3) return { isSpiral: false };
    var last3 = trades.slice(-3);
    if (!last3.every(function (t) { return (t.pnl || 0) < 0; })) return { isSpiral: false };
    var loss = Math.abs(last3.reduce(function (s, t) { return s + (t.pnl || 0); }, 0));
    var pct = capital ? loss / capital * 100 : 0;
    if (pct > 5) return { isSpiral: true, lossPercent: round2(pct), coolDownMinutes: 30,
      message: 'You lost ' + round2(pct) + '% over your last 3 trades. Mandatory 30-minute cool-down — review your strategy before trading again.' };
    return { isSpiral: false };
  }
  // AI insights after ≥10 trades (PDF §9.3) — deterministic pattern detection, no LLM.
  function aiInsights(trades) {
    var out = []; if (!trades || trades.length < 10) return out;
    var wins = trades.filter(function (t) { return (t.pnl || 0) > 0; }), losses = trades.filter(function (t) { return (t.pnl || 0) < 0; });
    out.push('Across ' + trades.length + ' trades your win rate is ' + Math.round(wins.length / trades.length * 100) + '% (' + wins.length + ' wins / ' + losses.length + ' losses).');
    if (trades.length > 40) out.push('High activity (' + trades.length + ' trades) — fewer, higher-confluence setups usually beat over-trading.');
    var byMode = {};
    trades.forEach(function (t) { var m = t.mode || '?'; byMode[m] = byMode[m] || { w: 0, n: 0 }; byMode[m].n++; if ((t.pnl || 0) > 0) byMode[m].w++; });
    var modes = Object.keys(byMode).filter(function (m) { return byMode[m].n >= 3; });
    if (modes.length) {
      modes.sort(function (a, b) { return (byMode[b].w / byMode[b].n) - (byMode[a].w / byMode[a].n); });
      var best = modes[0], worst = modes[modes.length - 1];
      out.push('Best mode: ' + best + ' (' + Math.round(byMode[best].w / byMode[best].n * 100) + '% win over ' + byMode[best].n + ' trades).');
      if (worst !== best) out.push('Weakest mode: ' + worst + ' (' + Math.round(byMode[worst].w / byMode[worst].n * 100) + '% win) — tighten the rules or avoid it.');
    }
    var emo = 0; for (var i = 1; i < trades.length; i++) if ((trades[i - 1].pnl || 0) < 0 && (trades[i].quantity || 0) > (trades[i - 1].quantity || 0)) emo++;
    if (emo >= 2) out.push('You increased size right after a loss ' + emo + ' times — that is revenge trading. Pause instead.');
    return out;
  }

  // ═══════════════ BO-NEXT: Signal Outcome Tracking & Accuracy Scorecard (deterministic) ═══════════════
  // Walk forward from a signal and resolve its outcome. SL/T1 same-bar ambiguity → assume SL first
  // (conservative; never inflates win rate). Returns outcome + R-multiple + MFE/MAE (in R) + bars.
  function evaluateSignal(sig, future) {
    var out = { outcome: 'PENDING', barsToOutcome: null, rMultiple: 0, mfe: 0, mae: 0 };
    if (!sig || !sig.stop_loss || !future || !future.length) return out;
    var side = sig.signal, entry = sig.entry_price, sl = sig.stop_loss.price;
    var t1 = sig.target_1 ? sig.target_1.price : null, t2 = sig.target_2 ? sig.target_2.price : null;
    var risk = Math.abs(entry - sl) || 1;
    for (var i = 0; i < future.length; i++) {
      var hi = future[i].high, lo = future[i].low;
      if (side === 'BUY') {
        out.mfe = Math.max(out.mfe, (hi - entry) / risk); out.mae = Math.min(out.mae, (lo - entry) / risk);
        if (lo <= sl) { out.outcome = 'SL_HIT'; out.rMultiple = round2((sl - entry) / risk); out.barsToOutcome = i + 1; return out; }
        if (t2 != null && hi >= t2) { out.outcome = 'T2_HIT'; out.rMultiple = round2((t2 - entry) / risk); out.barsToOutcome = i + 1; return out; }
        if (t1 != null && hi >= t1) { out.outcome = 'T1_HIT'; out.rMultiple = round2((t1 - entry) / risk); out.barsToOutcome = i + 1; return out; }
      } else {
        out.mfe = Math.max(out.mfe, (entry - lo) / risk); out.mae = Math.min(out.mae, (entry - hi) / risk);
        if (hi >= sl) { out.outcome = 'SL_HIT'; out.rMultiple = round2((entry - sl) / risk); out.barsToOutcome = i + 1; return out; }
        if (t2 != null && lo <= t2) { out.outcome = 'T2_HIT'; out.rMultiple = round2((entry - t2) / risk); out.barsToOutcome = i + 1; return out; }
        if (t1 != null && lo <= t1) { out.outcome = 'T1_HIT'; out.rMultiple = round2((entry - t1) / risk); out.barsToOutcome = i + 1; return out; }
      }
    }
    out.mfe = round2(out.mfe); out.mae = round2(out.mae);
    return out; // never resolved within the window → PENDING
  }

  // Accuracy scorecard from evaluated signals (TradingView/TrendSpider KPI set + Go/No-Go flag).
  function scorecard(evals) {
    var resolved = (evals || []).filter(function (e) { return e.outcome !== 'PENDING'; });
    var n = resolved.length;
    var wins = resolved.filter(function (e) { return e.outcome === 'T1_HIT' || e.outcome === 'T2_HIT'; });
    var losses = resolved.filter(function (e) { return e.outcome === 'SL_HIT'; });
    var grossWin = wins.reduce(function (a, e) { return a + Math.max(0, e.rMultiple); }, 0);
    var grossLoss = Math.abs(losses.reduce(function (a, e) { return a + Math.min(0, e.rMultiple); }, 0));
    var cum = 0, peak = 0, maxDD = 0, curve = [];
    resolved.forEach(function (e) { cum += e.rMultiple; curve.push(round2(cum)); peak = Math.max(peak, cum); maxDD = Math.min(maxDD, cum - peak); });
    return {
      sample: n, wins: wins.length, losses: losses.length,
      winRate: n ? Math.round(wins.length / n * 100) : 0,
      profitFactor: grossLoss > 0 ? round2(grossWin / grossLoss) : (grossWin > 0 ? '∞' : 0),
      expectancy: n ? round2(resolved.reduce(function (a, e) { return a + e.rMultiple; }, 0) / n) : 0,
      avgWin: wins.length ? round2(grossWin / wins.length) : 0,
      avgLoss: losses.length ? round2(-grossLoss / losses.length) : 0,
      maxDrawdownR: round2(maxDD), equityCurve: curve,
      goNoGo: n >= 10 ? 'GO' : 'NO-GO', note: n < 10 ? ('Only ' + n + ' resolved — need ≥10 for a reliable read.') : ''
    };
  }

  // Calibration (the AI-app differentiator): is a 90%-confidence call actually right ~90% of the time?
  function calibration(evals) {
    var resolved = (evals || []).filter(function (e) { return e.outcome !== 'PENDING' && e.confidence != null; });
    var bins = [[60, 70], [70, 80], [80, 90], [90, 101]];
    var buckets = bins.map(function (b) {
      var inb = resolved.filter(function (e) { return e.confidence >= b[0] && e.confidence < b[1]; });
      var w = inb.filter(function (e) { return e.outcome === 'T1_HIT' || e.outcome === 'T2_HIT'; }).length;
      return { range: b[0] + '-' + Math.min(b[1], 100) + '%', count: inb.length, predicted: (b[0] + Math.min(b[1], 100)) / 2, actual: inb.length ? Math.round(w / inb.length * 100) : null };
    });
    var tot = resolved.length, ece = 0;
    buckets.forEach(function (bk) { if (bk.count && bk.actual != null) ece += (bk.count / tot) * Math.abs(bk.predicted - bk.actual); });
    return { buckets: buckets, ece: tot ? round2(ece) : null, sample: tot, verdict: tot < 10 ? 'insufficient sample' : (ece <= 10 ? 'well-calibrated' : ece <= 20 ? 'fairly calibrated' : 'over-confident') };
  }

  // confidence proxy for a historical bar = % of indicators that agree with the side (varies → calibratable)
  function confFromIndicators(candles, side) {
    var ind = indicatorSet(candles), keys = Object.keys(ind), agree = 0, tot = 0;
    keys.forEach(function (k) { var s = ind[k] && ind[k].signal; if (s === 'BUY' || s === 'SELL') { tot++; if (s === side) agree++; } });
    return tot ? Math.max(55, Math.min(99, Math.round(agree / tot * 100))) : 65;
  }
  // Walk the symbol's history, generate a signal at each bar on data-up-to-that-bar (NO lookahead bias),
  // resolve it forward → a real sample of outcomes for the scorecard + calibration.
  function backtest(candles, opts) {
    opts = opts || {}; var look = opts.lookahead || 40, start = opts.start || 60, results = [];
    if (!candles || candles.length < start + 10) return results;
    for (var i = start; i < candles.length - 2; i++) {
      var win = candles.slice(0, i + 1), v = tfVerdict(win);
      if (!v || v.verdict === 'HOLD') continue;
      var entry = last(closes(win)), a = last(atr(win, 14)); if (!a || a <= 0) a = entry * 0.01;
      var side = v.verdict;
      var sig = { signal: side, entry_price: round2(entry),
        stop_loss: { price: round2(side === 'BUY' ? entry - 2 * a : entry + 2 * a) },
        target_1: { price: round2(side === 'BUY' ? entry + 1.5 * a : entry - 1.5 * a) },
        target_2: { price: round2(side === 'BUY' ? entry + 3 * a : entry - 3 * a) },
        confidence: confFromIndicators(win, side) };
      var ev = evaluateSignal(sig, candles.slice(i + 1, i + 1 + look));
      if (ev.outcome !== 'PENDING') { results.push({ confidence: sig.confidence, side: side, bar: i, outcome: ev.outcome, rMultiple: ev.rMultiple, barsToOutcome: ev.barsToOutcome, mfe: ev.mfe, mae: ev.mae }); i += 4; }
    }
    return results;
  }

  // ═══════════════ BO: Chart & Candlestick Pattern Recognition (deterministic, NO LLM) ═══════════════
  // Historical edge per pattern (Bulkowski-style literature), as a reliability %.
  var PATTERN_RELIABILITY = {
    'Bullish Engulfing': 63, 'Bearish Engulfing': 63, 'Hammer': 60, 'Inverted Hammer': 57, 'Shooting Star': 59,
    'Bullish Harami': 53, 'Bearish Harami': 53, 'Morning Star': 65, 'Evening Star': 65, 'Three White Soldiers': 70,
    'Three Black Crows': 70, 'Piercing Line': 64, 'Dark Cloud Cover': 60, 'Doji': 50, 'Bullish Marubozu': 58, 'Bearish Marubozu': 58,
    'Double Top': 65, 'Double Bottom': 66, 'Head & Shoulders': 66, 'Inverse Head & Shoulders': 66,
    'Ascending Triangle': 62, 'Descending Triangle': 62, 'Symmetrical Triangle': 54
  };
  function _cs(c) {
    var body = Math.abs(c.close - c.open), range = (c.high - c.low) || 1e-9;
    return { body: body, range: range, up: c.close > c.open, uw: c.high - Math.max(c.open, c.close), lw: Math.min(c.open, c.close) - c.low, bodyPct: body / range, mid: (c.open + c.close) / 2 };
  }
  // Candlestick patterns on the last 1-3 bars (actionable). Each → {name, dir, reliability, kind}.
  function detectCandles(candles) {
    var out = [], n = candles ? candles.length : 0; if (n < 3) return out;
    var c = candles[n - 1], p = candles[n - 2], p2 = candles[n - 3], C = _cs(c), P = _cs(p), P2 = _cs(p2);
    function add(name, dir) { out.push({ name: name, dir: dir, reliability: PATTERN_RELIABILITY[name] || 50, kind: 'candlestick' }); }
    if (C.bodyPct <= 0.1) add('Doji', 'neutral');
    if (C.bodyPct >= 0.95) add(C.up ? 'Bullish Marubozu' : 'Bearish Marubozu', C.up ? 'bullish' : 'bearish');
    if (C.body > 0 && C.lw >= 2 * C.body && C.uw <= C.body) add('Hammer', 'bullish');
    if (C.body > 0 && C.uw >= 2 * C.body && C.lw <= C.body) add(C.up ? 'Inverted Hammer' : 'Shooting Star', C.up ? 'bullish' : 'bearish');
    if (!P.up && C.up && c.close >= p.open && c.open <= p.close) add('Bullish Engulfing', 'bullish');
    if (P.up && !C.up && c.open >= p.close && c.close <= p.open) add('Bearish Engulfing', 'bearish');
    if (!P.up && C.up && c.open > p.close && c.close < p.open) add('Bullish Harami', 'bullish');
    if (P.up && !C.up && c.open < p.close && c.close > p.open) add('Bearish Harami', 'bearish');
    if (!P.up && C.up && c.open < p.low && c.close > P.mid && c.close < p.open) add('Piercing Line', 'bullish');
    if (P.up && !C.up && c.open > p.high && c.close < P.mid && c.close > p.open) add('Dark Cloud Cover', 'bearish');
    if (!P2.up && P.bodyPct < 0.4 && C.up && c.close > P2.mid) add('Morning Star', 'bullish');
    if (P2.up && P.bodyPct < 0.4 && !C.up && c.close < P2.mid) add('Evening Star', 'bearish');
    if (C.up && P.up && P2.up && c.close > p.close && p.close > p2.close) add('Three White Soldiers', 'bullish');
    if (!C.up && !P.up && !P2.up && c.close < p.close && p.close < p2.close) add('Three Black Crows', 'bearish');
    return out;
  }
  // ordered swing pivots (local extreme over ±2 bars)
  function swingPivots(candles) {
    var piv = [], n = candles.length;
    for (var i = 2; i < n - 2; i++) {
      var c = candles[i];
      if (c.high > candles[i - 1].high && c.high > candles[i - 2].high && c.high > candles[i + 1].high && c.high > candles[i + 2].high) piv.push({ idx: i, price: c.high, type: 'H' });
      if (c.low < candles[i - 1].low && c.low < candles[i - 2].low && c.low < candles[i + 1].low && c.low < candles[i + 2].low) piv.push({ idx: i, price: c.low, type: 'L' });
    }
    return piv;
  }
  // Structural patterns via pivots — Double Top/Bottom, H&S (+inverse), Triangles. Actionable-only (fresh).
  function detectChartPatterns(candles) {
    var out = [], n = candles ? candles.length : 0; if (n < 20) return out;
    var piv = swingPivots(candles), recent = n - 1;
    var near = function (a, b, tol) { return Math.abs(a - b) / ((a + b) / 2) <= (tol || 0.02); };
    var fresh = function (idx) { return (recent - idx) <= 12; };
    var highs = piv.filter(function (p) { return p.type === 'H'; }), lows = piv.filter(function (p) { return p.type === 'L'; });
    function push(name, dir, level) { out.push({ name: name, dir: dir, level: level != null ? round2(level) : null, reliability: PATTERN_RELIABILITY[name] || 50, kind: 'chart' }); }
    if (highs.length >= 2) { var h1 = highs[highs.length - 2], h2 = highs[highs.length - 1]; if (near(h1.price, h2.price, 0.02) && fresh(h2.idx)) push('Double Top', 'bearish', (h1.price + h2.price) / 2); }
    if (lows.length >= 2) { var l1 = lows[lows.length - 2], l2 = lows[lows.length - 1]; if (near(l1.price, l2.price, 0.02) && fresh(l2.idx)) push('Double Bottom', 'bullish', (l1.price + l2.price) / 2); }
    if (highs.length >= 3) { var a = highs[highs.length - 3], b = highs[highs.length - 2], c2 = highs[highs.length - 1]; if (b.price > a.price && b.price > c2.price && near(a.price, c2.price, 0.03) && fresh(c2.idx)) push('Head & Shoulders', 'bearish', Math.min(a.price, c2.price)); }
    if (lows.length >= 3) { var la = lows[lows.length - 3], lb = lows[lows.length - 2], lc = lows[lows.length - 1]; if (lb.price < la.price && lb.price < lc.price && near(la.price, lc.price, 0.03) && fresh(lc.idx)) push('Inverse Head & Shoulders', 'bullish', Math.max(la.price, lc.price)); }
    if (highs.length >= 3 && lows.length >= 3) {
      var hs = highs.slice(-3), ls = lows.slice(-3);
      var hSlope = (hs[2].price - hs[0].price) / Math.max(1, hs[2].idx - hs[0].idx), lSlope = (ls[2].price - ls[0].price) / Math.max(1, ls[2].idx - ls[0].idx);
      var flatH = Math.abs(hSlope) < 0.0006 * hs[2].price, flatL = Math.abs(lSlope) < 0.0006 * ls[2].price, fr = fresh(Math.max(hs[2].idx, ls[2].idx));
      if (fr && flatH && lSlope > 0) push('Ascending Triangle', 'bullish', hs[2].price);
      else if (fr && flatL && hSlope < 0) push('Descending Triangle', 'bearish', ls[2].price);
      else if (fr && hSlope < 0 && lSlope > 0) push('Symmetrical Triangle', 'neutral', null);
    }
    return out;
  }
  // Combine → the single strongest FRESH pattern + the full list (structural breaks reliability ties).
  function detectPatterns(candles) {
    var cs = detectCandles(candles), ch = detectChartPatterns(candles), all = cs.concat(ch);
    all.sort(function (a, b) { return (b.reliability || 0) - (a.reliability || 0) || ((b.kind === 'chart' ? 1 : 0) - (a.kind === 'chart' ? 1 : 0)); });
    return { top: all[0] || null, candlesticks: cs, structural: ch, all: all };
  }

  // ═══════════════ BO: Backtest Journal (user-ticked TF · ₹1 lakh/trade · batch Nifty 50) ═══════════════
  // Walk the FASTEST ticked TF (trigger); higher ticked TFs are time-aligned (proportional, NO look-ahead)
  // and must concur (confluence ≥60%). Each trade deploys a fixed capital. Returns per-trade journal rows.
  function backtestJournal(candlesByTf, opts) {
    opts = opts || {};
    var capital = opts.capital || 100000, look = opts.lookahead || 40;
    var tfs = (opts.tfs && opts.tfs.length) ? opts.tfs.slice() : ['daily'];
    var trig = null;
    for (var ti = TF_ORDER.length - 1; ti >= 0; ti--) { var t = TF_ORDER[ti]; if (tfs.indexOf(t) >= 0 && candlesByTf[t] && candlesByTf[t].length) { trig = t; break; } }
    if (!trig) return [];
    var tc = candlesByTf[trig], n = tc.length, rows = [], higher = tfs.filter(function (x) { return x !== trig; });
    var start = 60; if (opts.lastN && opts.lastN < n) start = Math.max(start, n - opts.lastN);
    for (var i = start; i < n - 2; i++) {
      var win = tc.slice(0, i + 1), tv = tfVerdict(win);
      if (!tv || tv.verdict === 'HOLD') continue;
      var bull = tv.verdict === 'BUY' ? 1 : 0, bear = tv.verdict === 'SELL' ? 1 : 0;
      for (var hi = 0; hi < higher.length; hi++) {
        var hc = candlesByTf[higher[hi]]; if (!hc || !hc.length) continue;
        var hIdx = Math.max(30, Math.floor((i + 1) / n * hc.length)), hb = tfBias(higher[hi], hc.slice(0, hIdx));
        if (hb === 'BULL') bull++; else if (hb === 'BEAR') bear++;
      }
      var total = tfs.length, dom = Math.max(bull, bear);
      if (dom / total * 100 < 60) continue;
      var side = bull >= bear ? 'BUY' : 'SELL';
      if ((side === 'BUY' && tv.verdict !== 'BUY') || (side === 'SELL' && tv.verdict !== 'SELL')) continue;
      var entry = last(closes(win)), a = last(atr(win, 14)); if (!a || a <= 0) a = entry * 0.01;
      var sl = side === 'BUY' ? entry - 2 * a : entry + 2 * a, t1 = side === 'BUY' ? entry + 1.5 * a : entry - 1.5 * a, t2 = side === 'BUY' ? entry + 3 * a : entry - 3 * a;
      var sig = { signal: side, entry_price: round2(entry), stop_loss: { price: round2(sl) }, target_1: { price: round2(t1) }, target_2: { price: round2(t2) } };
      var ev = evaluateSignal(sig, tc.slice(i + 1, i + 1 + look));
      var exit = ev.outcome === 'SL_HIT' ? sl : ev.outcome === 'T2_HIT' ? t2 : ev.outcome === 'T1_HIT' ? t1 : last(closes(tc.slice(0, Math.min(n, i + 1 + look))));
      var shares = Math.floor(capital / entry);
      var pnl = Math.round(shares * (side === 'BUY' ? (exit - entry) : (entry - exit)));
      rows.push({ date: tc[i].date || ('P' + (i + 1)), side: side, entry: round2(entry), target: round2(t1), sl: round2(sl), exit: round2(exit), outcome: ev.outcome, shares: shares, pnl: pnl, rMultiple: ev.rMultiple, tf: trig });
      i += 2;
    }
    return rows;
  }
  // Aggregate journal rows → win rate, profit factor, total P&L ₹, return % on the deployed capital, max DD ₹.
  function aggregateBacktest(rows, deployed) {
    deployed = deployed || 100000;
    var n = (rows || []).length, wins = rows.filter(function (r) { return r.pnl > 0; }), losses = rows.filter(function (r) { return r.pnl < 0; });
    var gw = wins.reduce(function (a, r) { return a + r.pnl; }, 0), gl = Math.abs(losses.reduce(function (a, r) { return a + r.pnl; }, 0));
    var totalPnl = rows.reduce(function (a, r) { return a + r.pnl; }, 0), cum = 0, peak = 0, maxDD = 0;
    rows.forEach(function (r) { cum += r.pnl; peak = Math.max(peak, cum); maxDD = Math.min(maxDD, cum - peak); });
    return { trades: n, wins: wins.length, losses: losses.length, winRate: n ? Math.round(wins.length / n * 100) : 0,
      profitFactor: gl > 0 ? round2(gw / gl) : (gw > 0 ? '∞' : 0), totalPnl: totalPnl, deployed: deployed,
      returnPct: deployed ? round2(totalPnl / deployed * 100) : 0, maxDrawdown: Math.round(maxDD), avgPnl: n ? Math.round(totalPnl / n) : 0 };
  }
  // Batch runner — one backtest per stock (e.g. Nifty 50), aggregated on (capital × N stocks) deployed.
  function batchBacktest(map, opts) {
    opts = opts || {}; var capital = opts.capital || 100000, syms = Object.keys(map), per = [], allRows = [];
    syms.forEach(function (s) { var rows = backtestJournal(map[s], opts); per.push({ sym: s, agg: aggregateBacktest(rows, capital), trades: rows.length }); allRows = allRows.concat(rows); });
    var aggregate = aggregateBacktest(allRows, capital * syms.length); aggregate.stocks = syms.length;
    return { perStock: per, aggregate: aggregate, rows: allRows };
  }

  // ───────────────────────── exports ─────────────────────────
  var API = {
    // indicators
    sma: sma, ema: ema, rsi: rsi, macd: macd, atr: atr, stochastic: stochastic,
    williamsR: williamsR, bollinger: bollinger, obv: obv, supertrend: supertrend, adx: adx,
    roshan: roshan, indicatorSet: indicatorSet, INDICATOR_NAMES: INDICATOR_NAMES,
    cci: cci, roc: roc, momentum: momentum, mfi: mfi, aroon: aroon, donchian: donchian,
    awesome: awesome, stochRsi: stochRsi, vwapRolling: vwapRolling, keltner: keltner, trix: trix,
    // analysis
    trendOf: trendOf, tfVerdict: tfVerdict, confluence: confluence, riskBlock: riskBlock, scan: scan,
    // data + universe
    genCandles: genCandles, genAllTf: genAllTf, UNIVERSE: UNIVERSE, tierOf: tierOf, screen: screen,
    neededTfs: neededTfs, scanSymbol: scanSymbol,
    // explain + guardrails
    explain: explain, hasBannedPhrase: hasBannedPhrase, BANNED: BANNED, LADDERS: LADDERS,
    // CEOS FINAL v1.0 layer
    classicPivots: classicPivots, camarillaPivots: camarillaPivots, pivotsFor: pivotsFor,
    srConfluence: srConfluence, atrRiskBlock: atrRiskBlock, CONFLUENCE_MODES: CONFLUENCE_MODES,
    tfBias: tfBias, confluenceScore: confluenceScore, generateSignal: generateSignal,
    // CEOS safety + journal intelligence
    detectCrisis: detectCrisis, crisisResponse: crisisResponse, detectLossSpiral: detectLossSpiral, aiInsights: aiInsights,
    // BO-NEXT: outcome tracking + accuracy scorecard + calibration
    evaluateSignal: evaluateSignal, scorecard: scorecard, calibration: calibration, backtest: backtest,
    // BO: pattern recognition
    detectCandles: detectCandles, detectChartPatterns: detectChartPatterns, detectPatterns: detectPatterns,
    swingPivots: swingPivots, PATTERN_RELIABILITY: PATTERN_RELIABILITY,
    // BO: backtest journal
    backtestJournal: backtestJournal, aggregateBacktest: aggregateBacktest, batchBacktest: batchBacktest,
    TF_ORDER: TF_ORDER, VERSION: '2.5.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.TechEngine = API;
})(typeof window !== 'undefined' ? window : null);
