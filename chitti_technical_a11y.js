/* chitti_technical_a11y.js — multi-modal accessibility for Chitti Technical (CEOS FINAL v1.0).
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Article 2 (Multi-Modal by Default): every signal expressible in ≥3 modalities.
 *   • Audio  — sonification (price→220-880 Hz pitch sequence) + verdict tone (PDF §11.1)
 *   • Haptic — vibration patterns (PDF §11.3)
 *   • Icon   — 🟢 BUY / 🔴 SELL / 🟡 HOLD board for illiterate users (PDF §11.4)
 * UMD: window.TechA11y in the browser; module.exports in Node (for tests).
 */
(function (root) {
  'use strict';
  var ctx = null;
  function audioCtx() { try { if (!ctx && typeof window !== 'undefined') ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} return ctx; }

  // Sonify the last N closes as a rising/falling pitch sequence (blind users "hear" the trend).
  function playAudioGraph(prices, onDone) {
    var ac = audioCtx();
    if (!ac || !prices || !prices.length) { if (onDone) onDone(); return; }
    try { if (ac.state === 'suspended') ac.resume(); } catch (e) {}
    var mn = Math.min.apply(null, prices), mx = Math.max.apply(null, prices), span = (mx - mn) || 1;
    var t = ac.currentTime, dur = 0.18;
    prices.forEach(function (p, i) {
      var f = 220 + ((p - mn) / span) * 660; // 220Hz (low) → 880Hz (high)
      var osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * dur);
      g.gain.exponentialRampToValueAtTime(0.14, t + i * dur + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * dur + dur);
      osc.connect(g).connect(ac.destination);
      osc.start(t + i * dur); osc.stop(t + i * dur + dur);
    });
    if (onDone) setTimeout(onDone, prices.length * dur * 1000 + 60);
  }

  function trendWord(prices) {
    if (!prices || prices.length < 2) return 'flat';
    var ch = (prices[prices.length - 1] - prices[0]) / prices[0] * 100;
    return ch > 2 ? 'strongly up' : ch > 0.5 ? 'up' : ch < -2 ? 'strongly down' : ch < -0.5 ? 'down' : 'sideways';
  }

  // Verdict tone: BUY ascends, SELL descends, HOLD flat (PDF §8.2 accessibility.audio.tone).
  function tone(verdict) {
    var ac = audioCtx(); if (!ac) return;
    try { if (ac.state === 'suspended') ac.resume(); } catch (e) {}
    var map = { BUY: [440, 880], SELL: [440, 220], HOLD: [330, 330] }, f = map[verdict] || [330, 330];
    var osc = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f[0], t); osc.frequency.linearRampToValueAtTime(f[1], t + 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g).connect(ac.destination); osc.start(t); osc.stop(t + 0.5);
  }

  // Haptic patterns (PDF §11.3). iOS needs a prior user tap — call from a click handler.
  var HAPTIC = { BUY: [200, 100, 200], SELL: [400, 100, 400], HOLD: [100], WARNING: [500, 200, 500, 200, 500], SQUEEZE: [50, 50, 50, 50, 50], CONFIRM: [100, 50, 100], REJECT: [300, 100, 300] };
  function vibrate(name) { try { if (typeof navigator !== 'undefined' && navigator.vibrate && HAPTIC[name]) navigator.vibrate(HAPTIC[name]); } catch (e) {} }

  // Icon board for illiterate users (PDF §11.4): colour-state, no text dependency.
  function icon(verdict) { return { BUY: '🟢', SELL: '🔴', HOLD: '🟡' }[verdict] || '⏸️'; }

  var API = { playAudioGraph: playAudioGraph, trendWord: trendWord, tone: tone, vibrate: vibrate, icon: icon, HAPTIC: HAPTIC };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.TechA11y = API;
})(typeof window !== 'undefined' ? window : null);
