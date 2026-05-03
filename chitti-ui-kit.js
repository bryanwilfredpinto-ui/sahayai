/**
 * CHITTI UI KIT v1.0
 * One <script src="chitti-ui-kit.js"></script> on every Chitti page.
 *
 * window.Chitti:
 *   .Speech   — sp(text,lang), speakDisclaimer(lang), cancel()
 *   .SEBI     — renderBanner(el), DISCLAIMER_EN, DISCLAIMER_HI
 *   .Colours  — TF_STYLE, TF_ORDER, visibleTFs(currentTF)
 *   .SR       — computeSR(candles), computeTrendlines(candles)
 *   .Utils    — formatINR(n), formatPct(n), hexAlpha(hex,a)
 */
(function (global) {
  'use strict';

  /* ── SEBI COPY (never change) ─────────────────────────────────────── */
  const DISCLAIMER_EN = 'Not SEBI Registered. This is an educational tool only — not investment advice. Chitti shows direction, not a guarantee. Never invest money you cannot afford to lose.';
  const DISCLAIMER_HI = 'SEBI पंजीकृत नहीं। यह केवल शैक्षिक उपकरण है — निवेश सलाह नहीं। चिट्टी दिशा दिखाता है, गारंटी नहीं। वही पैसा लगाएं जो खो सकते हैं।';

  /* ── SPEECH ───────────────────────────────────────────────────────── */
  const Speech = {
    sp(text, lang = 'en') {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      u.rate = 0.88; u.pitch = 1.05;
      speechSynthesis.speak(u);
    },
    cancel() { if (window.speechSynthesis) speechSynthesis.cancel(); },
    speakDisclaimer(lang) { this.sp(lang === 'hi' ? DISCLAIMER_HI : DISCLAIMER_EN, lang || 'en'); }
  };

  /* ── SEBI BANNER ──────────────────────────────────────────────────── */
  function renderSEBIBanner(el) {
    el.innerHTML = `
      <span>⚠️ <strong>Not SEBI Registered</strong> · Educational only · Not investment advice</span>
      <button onclick="Chitti.Speech.speakDisclaimer()" aria-label="Hear SEBI disclaimer aloud"
        style="background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.35);
               color:#fbbf24;border-radius:4px;padding:2px 10px;font-size:11px;
               cursor:pointer;font-family:inherit;flex-shrink:0;min-height:28px">🔊 Hear</button>`;
  }

  /* ── TF COLOUR SYSTEM ─────────────────────────────────────────────── */
  /*
   * Visual hierarchy — matches TradingView / Zerodha Kite convention:
   *   Monthly  solid   2.5px  amber   — most important level, never miss
   *   Weekly   solid   2px    sky     — major swing level
   *   Daily    dashed  1.5px  green   — common trader reference
   *   4H       dashed  1.5px  orange  — intraday swing
   *   1H       dotted  1px    violet
   *   15min    dotted  1px    pink
   *   5min     dotted  1px    teal
   *   1min     dotted  1px    grey
   *
   * Trendlines use same colour, slightly lower opacity than S/R.
   */
  const TF_STYLE = {
    Monthly: { color:'#f59e0b', width:2.5, dash:[],     label:'Mo',  srAlpha:.90, tlAlpha:.75 },
    Weekly:  { color:'#38bdf8', width:2,   dash:[],     label:'Wk',  srAlpha:.80, tlAlpha:.65 },
    Daily:   { color:'#4ade80', width:1.5, dash:[7,4],  label:'D',   srAlpha:.70, tlAlpha:.55 },
    '4H':    { color:'#fb923c', width:1.5, dash:[5,4],  label:'4H',  srAlpha:.65, tlAlpha:.50 },
    '1H':    { color:'#a78bfa', width:1,   dash:[3,3],  label:'1H',  srAlpha:.55, tlAlpha:.40 },
    '15min': { color:'#f472b6', width:1,   dash:[2,3],  label:'15m', srAlpha:.50, tlAlpha:.38 },
    '5min':  { color:'#2dd4bf', width:1,   dash:[2,3],  label:'5m',  srAlpha:.45, tlAlpha:.35 },
    '1min':  { color:'#94a3b8', width:1,   dash:[2,3],  label:'1m',  srAlpha:.40, tlAlpha:.30 },
  };

  const TF_ORDER = ['Monthly','Weekly','Daily','4H','1H','15min','5min','1min'];

  /**
   * Returns which TFs should be drawn when viewing currentTF.
   * Rule: current TF + ALL higher TFs (higher = longer period).
   * e.g. viewing Daily → ['Monthly','Weekly','Daily']
   *      viewing 5min  → all 7 TFs above + 5min
   */
  function visibleTFs(currentTF) {
    const idx = TF_ORDER.indexOf(currentTF);
    return idx < 0 ? [currentTF] : TF_ORDER.slice(0, idx + 1);
  }

  /* ── S/R COMPUTATION ──────────────────────────────────────────────── */
  /**
   * Pivot High/Low method (n-bar lookback) — identical to TradingView's
   * built-in "Pivot Points High Low" indicator.
   * Clusters levels within 0.3% to avoid duplicate lines.
   *
   * @param  {Array}  candles  [{time,open,high,low,close,volume}]
   * @param  {number} n        lookback bars (default 5)
   * @returns {{ supports:number[], resistances:number[] }}
   */
  function computeSR(candles, n = 5) {
    if (!candles || candles.length < n * 2 + 2)
      return { supports: [], resistances: [] };
    const ph = [], pl = [];
    for (let i = n; i < candles.length - n; i++) {
      let isH = true, isL = true;
      for (let j = i - n; j <= i + n; j++) {
        if (j === i) continue;
        if (candles[j].high >= candles[i].high) isH = false;
        if (candles[j].low  <= candles[i].low)  isL = false;
      }
      if (isH) ph.push(candles[i].high);
      if (isL) pl.push(candles[i].low);
    }
    function cluster(arr) {
      const s = [...arr].sort((a, b) => a - b), r = [];
      for (const v of s) {
        if (!r.length || v > r[r.length - 1] * 1.003) r.push(v);
        else r[r.length - 1] = (r[r.length - 1] + v) / 2;
      }
      return r.slice(-6); // keep 6 strongest
    }
    return { supports: cluster(pl), resistances: cluster(ph) };
  }

  /* ── TRENDLINE COMPUTATION ────────────────────────────────────────── */
  /**
   * Real wick-to-wick trendlines.
   * 1. Find pivot highs + pivot lows (n-bar lookback).
   * 2. Connect pairs where NO candle body pierces the line between them.
   * 3. Extend to latest bar.
   * Returns up to 2 support lines + 2 resistance lines.
   *
   * @param  {Array} candles  [{time,open,high,low,close}]
   * @returns {{ upLines:Line[], downLines:Line[] }}
   *   Line = { x1, y1, x2, y2 }  (x = bar index, y = price)
   */
  function computeTrendlines(candles) {
    if (!candles || candles.length < 14) return { upLines: [], downLines: [] };
    const n = 5, pH = [], pL = [];
    for (let i = n; i < candles.length - n; i++) {
      let isH = true, isL = true;
      for (let j = i - n; j <= i + n; j++) {
        if (j === i) continue;
        if (candles[j].high >= candles[i].high) isH = false;
        if (candles[j].low  <= candles[i].low)  isL = false;
      }
      if (isH) pH.push({ idx: i, price: candles[i].high });
      if (isL) pL.push({ idx: i, price: candles[i].low  });
    }
    function buildLines(pivots, type) {
      const lines = [];
      for (let a = 0; a < pivots.length - 1; a++) {
        for (let b = a + 1; b < pivots.length; b++) {
          const p1 = pivots[a], p2 = pivots[b];
          const slope = (p2.price - p1.price) / (p2.idx - p1.idx);
          let valid = true;
          for (let k = p1.idx; k <= p2.idx; k++) {
            const proj = p1.price + slope * (k - p1.idx);
            if (type === 'res' && candles[k].high > proj * 1.002) { valid = false; break; }
            if (type === 'sup' && candles[k].low  < proj * 0.998) { valid = false; break; }
          }
          if (valid) {
            const last = candles.length - 1;
            lines.push({
              x1: p1.idx, y1: p1.price,
              x2: last,   y2: p1.price + slope * (last - p1.idx),
              strength: b - a,
            });
          }
        }
      }
      return lines.sort((a, b) => b.strength - a.strength).slice(0, 2);
    }
    return {
      upLines:   buildLines(pL, 'sup'),
      downLines: buildLines(pH, 'res'),
    };
  }

  /* ── UTILS ────────────────────────────────────────────────────────── */
  const Utils = {
    formatINR: n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formatPct: n => (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%',
    hexAlpha(hex, a) {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    },
  };

  /* ── EXPORT ───────────────────────────────────────────────────────── */
  global.Chitti = {
    Speech,
    SEBI: { renderSEBIBanner, DISCLAIMER_EN, DISCLAIMER_HI },
    Colours: { TF_STYLE, TF_ORDER, visibleTFs },
    SR: { computeSR, computeTrendlines },
    Utils,
  };

  console.log('[ChittiKit v1.0] ready — Speech · SEBI · SR · Trendlines · Utils');
})(window);
