// chitti_disclaimer.js
// One file. Include on every Chitti page with:
// <script src="chitti_disclaimer.js"></script>

(function() {

  // ── SEBI & LEGAL DISCLAIMER ──────────────────────────────
  const DISCLAIMER = {
    sebi_en: "Not SEBI Registered. This is an educational tool only. Not investment advice. Invest at your own risk.",
    sebi_hi: "SEBI पंजीकृत नहीं। यह केवल शैक्षिक उपकरण है। यह निवेश सलाह नहीं है।",
    not_guaranteed: "Chitti shows direction — not a guarantee. Never invest money you cannot afford to lose.",
    not_guaranteed_hi: "चिट्टी दिशा दिखाता है — गारंटी नहीं। वही पैसा लगाएं जो खो सकते हैं।",
  };

  // ── ACCESSIBILITY ────────────────────────────────────────
  // Speak any text aloud. Works for blind users.
  window.chitti = window.chitti || {};

  window.chitti.speak = function(text, lang) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = 0.88;
    speechSynthesis.speak(u);
  };

  // Speak SEBI disclaimer aloud
  window.chitti.speakDisclaimer = function(lang) {
    const text = lang === 'hi' ? DISCLAIMER.sebi_hi : DISCLAIMER.sebi_en;
    window.chitti.speak(text, lang);
  };

  // ── RENDER DISCLAIMER BAR ────────────────────────────────
  // Call this to inject a SEBI disclaimer bar into any element.
  // Usage: chitti.renderDisclaimer('my-div-id')
  window.chitti.renderDisclaimer = function(containerId, lang) {
    lang = lang || 'en';
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        flex-wrap:wrap;gap:8px;
        padding:7px 12px;
        background:#fff8e1;
        border:1px solid #ffe082;
        border-radius:7px;
        font-size:11px;
        color:#e65100;
        margin-bottom:12px;
      " role="note" aria-label="Legal disclaimer">
        <span>
          ⚠️ <b>Not SEBI Registered.</b> Educational only. Not investment advice. |
          <b>SEBI पंजीकृत नहीं।</b> यह निवेश सलाह नहीं है।
        </span>
        <button onclick="chitti.speakDisclaimer('${lang}')"
          aria-label="Hear disclaimer read aloud"
          style="
            background:#f59e0b;border:none;border-radius:5px;
            padding:4px 10px;font-size:11px;cursor:pointer;
            color:#000;font-weight:700;flex-shrink:0;
          ">
          🔊 Hear
        </button>
      </div>`;
  };

  // ── RENDER SPEAK BAR ─────────────────────────────────────
  // Accessibility bar for blind users — shown at top of every page.
  window.chitti.renderSpeakBar = function(containerId, pageDescription, lang) {
    lang = lang || 'en';
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="
        display:flex;align-items:center;gap:8px;
        padding:7px 12px;
        background:#1e3a5f;
        border-radius:7px;
        font-size:11px;
        color:#bae6fd;
        margin-bottom:10px;
      " role="navigation" aria-label="Accessibility controls">
        <span style="flex:1">
          👁️ <b>Blind user?</b> Tap 🔊 to hear this page.
        </span>
        <button onclick="chitti.speak('${pageDescription}', '${lang}')"
          aria-label="Hear page description"
          style="
            background:#1d4ed8;border:none;border-radius:5px;
            padding:5px 12px;font-size:12px;cursor:pointer;
            color:#fff;font-weight:700;flex-shrink:0;
          ">
          🔊 Read page
        </button>
      </div>`;
  };

  // ── AUTO-INJECT ON PAGE LOAD ─────────────────────────────
  // If page has <div id="chitti-disclaimer"></div> — auto fill it.
  // If page has <div id="chitti-speak-bar"></div> — auto fill it.
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('chitti-disclaimer')) {
      window.chitti.renderDisclaimer('chitti-disclaimer');
    }
    if (document.getElementById('chitti-speak-bar')) {
      const desc = document.querySelector('meta[name="chitti-page-desc"]')?.content
        || 'Chitti page loaded. Use tab key to navigate.';
      window.chitti.renderSpeakBar('chitti-speak-bar', desc);
    }
  });

})();
