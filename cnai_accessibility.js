/* ============================================================================
 * cnai_accessibility.js — Chitti News AI · Build Order 6 · Accessibility layer
 * ----------------------------------------------------------------------------
 * Wraps every other skill (Skill 9). Adds: senior mode (24px), skip-link, focus
 * management, an aria-live announcer, TTS read-aloud + STT mic with the language
 * synced to the selected UI language, and touch-target enforcement helpers.
 * Complements (does not replace) chitti_a11y.js. Deterministic; no network.
 *
 * API (window.CNAIa11y / module.exports):
 *   announce(msg) · setSeniorMode(on) · isSeniorMode() · speak(text,lang) ·
 *   listen(onResult,lang) · srLang(uiLang) · ensureSkipLink() ·
 *   focusFirst(container) · auditTouchTargets()
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.CNAIa11y = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function _doc() { try { return (typeof document !== 'undefined') ? document : null; } catch (e) { return null; } }
  function _ls() { try { return (typeof localStorage !== 'undefined') ? localStorage : null; } catch (e) { return null; } }

  // BCP-47 voice code per supported UI language (for Web Speech TTS + STT).
  const SR_LANG = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN', ta: 'ta-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN' };
  function srLang(uiLang) { return SR_LANG[uiLang] || 'en-IN'; }
  function currentLang() { const ls = _ls(); try { return (ls && (ls.getItem('cnai_lang') || ls.getItem('chitti_lang'))) || 'en'; } catch (e) { return 'en'; } }

  // aria-live announcer (polite) — single shared region.
  function announce(msg) {
    const doc = _doc(); if (!doc) return false;
    let r = doc.getElementById('cnai-aria-live');
    if (!r) { r = doc.createElement('div'); r.id = 'cnai-aria-live'; r.setAttribute('aria-live', 'polite'); r.setAttribute('role', 'status'); r.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap'; doc.body && doc.body.appendChild(r); }
    r.textContent = ''; setTimeout(() => { r.textContent = String(msg || ''); }, 30); return true;
  }

  // Senior mode — 24px base text via a class on <html>; remembered.
  const SKEY = 'cnai_senior_mode';
  function setSeniorMode(on) {
    const v = !!on; const doc = _doc(); const ls = _ls();
    if (doc && doc.documentElement) doc.documentElement.classList[v ? 'add' : 'remove']('cnai-senior');
    if (ls) { try { ls.setItem(SKEY, v ? '1' : '0'); } catch (e) {} }
    if (v) ensureSeniorCSS();
    announce(v ? 'Senior mode on — larger text.' : 'Senior mode off.');
    return { senior: v };
  }
  function isSeniorMode() { const ls = _ls(); try { return ls ? ls.getItem(SKEY) === '1' : false; } catch (e) { return false; } }
  function ensureSeniorCSS() {
    const doc = _doc(); if (!doc) return;
    if (doc.getElementById('cnai-senior-css')) return;
    const st = doc.createElement('style'); st.id = 'cnai-senior-css';
    st.textContent = 'html.cnai-senior{font-size:24px}html.cnai-senior button,html.cnai-senior input,html.cnai-senior select{font-size:1rem;min-height:48px}html.cnai-senior .learn-tab{min-height:52px}';
    doc.head && doc.head.appendChild(st);
  }

  // Skip-link for keyboard/screen-reader users.
  function ensureSkipLink() {
    const doc = _doc(); if (!doc || !doc.body) return false;
    if (doc.getElementById('cnai-skip')) return true;
    const a = doc.createElement('a'); a.id = 'cnai-skip'; a.href = '#main'; a.textContent = 'Skip to main content';
    a.style.cssText = 'position:absolute;left:-999px;top:0;background:#138808;color:#fff;padding:10px 14px;z-index:9999;border-radius:0 0 8px 0';
    a.addEventListener('focus', () => { a.style.left = '0'; });
    a.addEventListener('blur', () => { a.style.left = '-999px'; });
    doc.body.insertBefore(a, doc.body.firstChild);
    return true;
  }

  function focusFirst(container) {
    const doc = _doc(); if (!doc) return false;
    const root = (typeof container === 'string') ? doc.querySelector(container) : (container || doc);
    if (!root) return false;
    const el = root.querySelector('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (el && el.focus) { el.focus(); return true; }
    return false;
  }

  // TTS read-aloud in the selected language (deaf users: every audio has text).
  function speak(text, lang) {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return false;
      const u = new SpeechSynthesisUtterance(String(text || ''));
      u.lang = srLang(lang || currentLang());
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }

  // STT mic in the selected language (mute users: never REQUIRED; this is optional).
  function listen(onResult, lang) {
    try {
      const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (!SR) return false;
      const rec = new SR(); rec.lang = srLang(lang || currentLang()); rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = e => { try { onResult && onResult(e.results[0][0].transcript); } catch (_) {} };
      rec.start(); return true;
    } catch (e) { return false; }
  }

  // Audit touch targets ≥44×44 (WCAG 2.2). Returns list of too-small interactive els.
  function auditTouchTargets() {
    const doc = _doc(); if (!doc) return [];
    const small = [];
    doc.querySelectorAll('button,a,input,select,[role="tab"],[role="button"]').forEach(el => {
      const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: 48, height: 48 };
      if ((r.width && r.width < 44) || (r.height && r.height < 44)) small.push({ tag: el.tagName, label: (el.getAttribute('aria-label') || el.textContent || '').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    });
    return small;
  }

  function init() {
    const doc = _doc(); if (!doc) return;
    ensureSkipLink();
    if (isSeniorMode()) setSeniorMode(true);
  }
  try { const doc = _doc(); if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init(); } } catch (e) {}

  return { announce, setSeniorMode, isSeniorMode, speak, listen, srLang, ensureSkipLink, focusFirst, auditTouchTargets, init, _SR_LANG: SR_LANG };
});
