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

  // master list — exactly what indicatorSet can produce (drives the indicator dropdown)
  var INDICATOR_NAMES = ['RSI', 'MACD', 'Stochastic', 'Williams %R', 'Supertrend', 'EMA 50', 'EMA 200',
    'Bollinger Bands', 'OBV', 'ADX', 'CCI', 'ROC', 'Momentum', 'MFI', 'Aroon', 'Donchian Channels',
    'Awesome Oscillator', 'Stochastic RSI', 'VWAP', 'Keltner Channels', 'TRIX', 'Roshan Indicator'];

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
    var tfBias = { monthly: 1.0, weekly: 0.8, daily: 0.5, '4h': 0.3, '1h': 0.15 }[timeframe] || 0.5;
    var drift = ((biasPick - 2) / 2) * 0.0018 * tfBias; // -0.0018..+0.0018 scaled
    var price = basePrice || (50 + (strHash(symbol) % 4000));
    var vol0 = 100000 + (strHash(symbol + 'v') % 900000);
    var candles = [];
    for (var i = 0; i < n; i++) {
      var shock = (rnd() - 0.5) * 0.03;
      var wave = Math.sin(i / 9 + biasPick) * 0.004;
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
      '1h': genCandles(symbol, '1h', 260, basePrice)
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
  var BANNED = ['guaranteed', 'sure-shot', 'sureshot', 'sure shot', '100% accurate', '100%',
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
    VERSION: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.TechEngine = API;
})(typeof window !== 'undefined' ? window : null);
