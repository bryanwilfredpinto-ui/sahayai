/* chitti_technical_ai_audio.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * The BLIND differentiator: turn a price chart into SOUND, and every verdict into a
 * recoverable audio + haptic signal. No competitor (of 40 audited) speaks a stock
 * verdict. Zero dependencies, browser-only, lazy AudioContext (created on first user
 * gesture — iOS/Chrome autoplay-safe). Pairs with chitti_a11y.js speak() for TTS.
 *
 * Public API: window.ChittiTechAudio = {
 *   sonify(candles, opts)      // play price line as pitch L→R + earcons at RSI/MACD events
 *   verdictTone(decision)      // ascending(BUY)/descending(SELL)/flat(WAIT) earcon
 *   haptic(name)               // vibration pattern (BUY_STRONG, SELL_STRONG, WARNING, ...)
 *   dataTable(candles, n)      // accessible <table> HTML of the last n OHLC rows (blind win)
 *   summarize(candles)         // one honest sentence: trend + last close (for aria-live + TTS)
 *   speak(text)                // TTS via Chitti.a11y or SpeechSynthesis fallback
 * }
 * The verdict is conveyed by FOUR channels (voice·text·icon+shape·ISL). This file owns
 * the AUDIO channel; remove sight and the verdict is still 100% recoverable.
 */
(function (root) {
  'use strict';
  var AC = null;
  function ctx() {
    if (AC) return AC;
    var C = root.AudioContext || root.webkitAudioContext;
    if (!C) return null;
    try { AC = new C(); } catch (e) { AC = null; }
    return AC;
  }

  // play a sequence of {freq, durMs, pan, type} tones back-to-back
  function playSeq(tones) {
    var c = ctx(); if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    var t = c.currentTime;
    tones.forEach(function (tn) {
      var osc = c.createOscillator(), gain = c.createGain();
      osc.type = tn.type || 'sine';
      osc.frequency.value = tn.freq;
      var dur = (tn.durMs || 180) / 1000;
      // short fade in/out so it doesn't click
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(tn.vol || 0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var node = gain;
      if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = (tn.pan == null ? 0 : tn.pan); osc.connect(p); p.connect(gain); }
      else osc.connect(gain);
      node.connect(c.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
      t += dur;
    });
  }

  // map price → pitch (220..880 Hz), pan left→right across the x-axis. Higher price = higher pitch.
  function sonify(candles, opts) {
    opts = opts || {};
    if (!candles || !candles.length) return;
    var per = opts.perMs || 90;                 // ms per candle (keep total < ~6s)
    var sample = Math.max(1, Math.ceil(candles.length / (opts.maxTones || 60)));
    var picked = candles.filter(function (_, i) { return i % sample === 0; });
    var cl = picked.map(function (c) { return c.close; });
    var lo = Math.min.apply(null, cl), hi = Math.max.apply(null, cl), span = (hi - lo) || 1;
    var tones = picked.map(function (c, i) {
      var norm = (c.close - lo) / span;          // 0..1
      var pan = picked.length > 1 ? (i / (picked.length - 1)) * 2 - 1 : 0; // -1 (L) .. +1 (R)
      return { freq: 220 + norm * 660, durMs: per, pan: pan, type: 'sine', vol: 0.16 };
    });
    // earcons: distinct alert tones layered at the events the user actually needs (caller passes them)
    (opts.events || []).forEach(function (ev) {
      // ev = {kind:'rsi_overbought'|'rsi_oversold'|'macd_bull'|'macd_bear'}
    });
    playSeq(tones);
    // event earcons play AFTER the line so they aren't masked
    if (opts.events && opts.events.length) {
      setTimeout(function () { opts.events.forEach(earcon); }, picked.length * per + 120);
    }
  }

  // short distinct alert tones for threshold-crossing events (the part that drives a decision)
  function earcon(ev) {
    var kind = (typeof ev === 'string') ? ev : (ev && ev.kind);
    var map = {
      rsi_overbought: [{ freq: 880, durMs: 120, type: 'square', vol: 0.14 }, { freq: 660, durMs: 120, type: 'square', vol: 0.14 }],
      rsi_oversold:   [{ freq: 330, durMs: 120, type: 'square', vol: 0.14 }, { freq: 494, durMs: 120, type: 'square', vol: 0.14 }],
      macd_bull:      [{ freq: 523, durMs: 110 }, { freq: 784, durMs: 140 }],
      macd_bear:      [{ freq: 784, durMs: 110 }, { freq: 392, durMs: 140 }]
    };
    if (map[kind]) playSeq(map[kind]);
  }

  // the verdict earcon: ascending = BUY, descending = SELL, flat = WAIT (matches haptic + icon)
  function verdictTone(decision) {
    if (decision === 'BUY') playSeq([{ freq: 440, durMs: 150 }, { freq: 660, durMs: 150 }, { freq: 880, durMs: 200 }]);
    else if (decision === 'SELL') playSeq([{ freq: 880, durMs: 150 }, { freq: 660, durMs: 150 }, { freq: 392, durMs: 220 }]);
    else playSeq([{ freq: 523, durMs: 130 }, { freq: 523, durMs: 130 }]);
  }

  var HAPTICS = {
    BUY_STRONG: [200, 100, 200], SELL_STRONG: [400, 100, 400],
    BUY_WEAK: [120, 60, 120], SELL_WEAK: [220, 60, 220], HOLD: [100],
    WARNING: [500, 200, 500, 200, 500], CONFIRM: [100, 50, 100], REJECT: [300, 100, 300]
  };
  function haptic(name) {
    if (!('vibrate' in navigator)) return false;
    var p = HAPTICS[name]; if (!p) return false;
    try { navigator.vibrate(p); return true; } catch (e) { return false; }
  }

  // accessible data table of the last n bars — the highest-leverage blind win (screen-reader native)
  function dataTable(candles, n) {
    n = n || 12;
    var rows = (candles || []).slice(-n);
    var h = '<table class="tech-data-table"><caption class="sr-only">Last ' + rows.length + ' price bars</caption>' +
      '<thead><tr><th scope="col">Bar</th><th scope="col">Open</th><th scope="col">High</th><th scope="col">Low</th><th scope="col">Close</th></tr></thead><tbody>';
    rows.forEach(function (c, i) {
      h += '<tr><th scope="row">' + (c.date || (rows.length - i) + ' ago') + '</th><td>' + c.open + '</td><td>' + c.high + '</td><td>' + c.low + '</td><td>' + c.close + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  // one honest sentence — trend direction + last close (no fabricated %), for aria-live + TTS
  function summarize(candles) {
    if (!candles || candles.length < 2) return 'Not enough data to read this chart yet.';
    var first = candles[0].close, lastC = candles[candles.length - 1].close;
    var chg = ((lastC - first) / first) * 100;
    var dir = chg > 2 ? 'has been climbing' : chg > 0.3 ? 'is drifting up' : chg < -2 ? 'has been falling' : chg < -0.3 ? 'is drifting down' : 'is moving sideways';
    return 'Over the last ' + candles.length + ' bars the price ' + dir + ', now near ' + lastC + '.';
  }

  function speak(text) {
    if (!text) return;
    try {
      if (root.Chitti && root.Chitti.a11y && root.Chitti.a11y.speak) { root.Chitti.a11y.speak(text); return; }
    } catch (e) {}
    if (root.speechSynthesis) {
      try { var u = new root.SpeechSynthesisUtterance(text); root.speechSynthesis.cancel(); root.speechSynthesis.speak(u); } catch (e) {}
    }
  }

  root.ChittiTechAudio = {
    sonify: sonify, earcon: earcon, verdictTone: verdictTone, haptic: haptic,
    dataTable: dataTable, summarize: summarize, speak: speak, HAPTICS: HAPTICS
  };
})(typeof window !== 'undefined' ? window : this);
