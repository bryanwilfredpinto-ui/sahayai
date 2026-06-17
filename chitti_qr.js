/* chitti_qr.js
 * 🎖️ World Class Chitti — Commando Discipline. Zero Excuses.
 *
 * Universal "📱 Open on phone" QR — every Chitti must carry a QR of its own page,
 * placed in the Settings section, so a desktop user can scan and hand off to mobile.
 * (Sire 2026-06-16: "every Chitti should have a QR code in [the] Settings section.")
 *
 * Auto-loaded by chitti_a11y.js — every page that loads the a11y substrate inherits
 * the QR without per-page edits (same contract as the per-response widget / Feature
 * Discovery / camera substrate). Opt-out per page:
 *   <meta name="chitti-qr" content="off">
 *
 * Behaviour:
 *  - Skips pages that already render a QR (.chitti-qr-block or a #*-settings-qr image),
 *    so the ~9 pages with a hand-rolled QR (Vaani, MedUPI, CA, …) are untouched.
 *  - Encodes the canonical page URL (origin + pathname) — no query/hash, no PII.
 *  - Renders a standard .chitti-qr-block so chitti_a11y.js translates its labels into
 *    all 26 languages (the QR strings already live in the a11y T-table).
 *  - Prefers a Settings container; falls back to end-of-main so the QR still appears.
 */
(function (root, doc) {
  'use strict';
  if (!doc) return;
  if (root.__chittiQrLoaded) return; root.__chittiQrLoaded = true;

  function optedOut() {
    var m = doc.querySelector('meta[name="chitti-qr"]');
    return !!(m && /^off$/i.test(m.getAttribute('content') || ''));
  }
  function alreadyHasQr() {
    return !!doc.querySelector('.chitti-qr-block, img[src*="qrserver"], [id*="settings-qr" i]');
  }
  function canonicalUrl() {
    try { return root.location.origin + root.location.pathname; } catch (e) { return root.location.href.split(/[?#]/)[0]; }
  }
  function qrImgSrc(url) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=' + encodeURIComponent(url);
  }

  // Find the page's Settings container so the QR lands "in the Settings section".
  function findSettingsHost() {
    // Strongest → weakest signals. Only block-level containers qualify — never a
    // link/button/control (appending into an <a>/<button> is invalid + nested-interactive).
    var sels = [
      '[data-tab="settings"]', '#settings', '#vai-panel-settings',
      '[role="tabpanel"][aria-labelledby*="setting" i]',
      'section[id*="settings" i]', 'div[id*="settings" i]',
      'section[class*="settings" i]', 'div[class*="settings" i]'
    ];
    var OK = { DIV: 1, SECTION: 1, MAIN: 1, ASIDE: 1, ARTICLE: 1, FORM: 1 };
    for (var i = 0; i < sels.length; i++) {
      var list = doc.querySelectorAll(sels[i]);
      for (var j = 0; j < list.length; j++) {
        var el = list[j];
        if (!OK[el.tagName]) continue;                 // container tags only
        if (el.closest && el.closest('a,button,select,label,summary')) continue; // not inside an interactive
        return el;
      }
    }
    return null;
  }

  function buildBlock(url) {
    var wrap = doc.createElement('div');
    wrap.className = 'chitti-qr-block';
    wrap.setAttribute('aria-label', 'QR code — open this Chitti on your phone');
    wrap.setAttribute('data-injected-by', 'chitti_qr');
    wrap.style.cssText = 'margin:24px auto;max-width:480px;padding:16px 18px;background:#F8F4EE;' +
      'border:1px solid #D4AF37;border-radius:14px;font-family:Inter,system-ui,sans-serif;' +
      'display:flex;align-items:center;gap:16px;box-shadow:0 2px 10px rgba(14,35,68,.08)';
    var img = doc.createElement('img');
    img.src = qrImgSrc(url);
    img.width = 116; img.height = 116; img.loading = 'lazy';
    img.alt = 'QR code — open this Chitti on your phone at ' + url;
    img.style.cssText = 'border-radius:8px;background:#fff;padding:6px;flex-shrink:0';
    var txt = doc.createElement('div');
    txt.style.cssText = 'flex:1;min-width:0';
    txt.innerHTML =
      '<div style="font-weight:800;color:#0E2344;font-size:15px;margin-bottom:4px">📱 Open on phone</div>' +
      '<div style="font-size:12.5px;color:#5b637a;line-height:1.5">QR code — open this Chitti on your phone</div>';
    wrap.appendChild(img); wrap.appendChild(txt);
    return wrap;
  }

  function inject() {
    try {
      if (optedOut() || alreadyHasQr()) return;
      var url = canonicalUrl();
      // Don't QR the local dev file:// scheme.
      if (/^file:/.test(root.location.protocol)) return;
      var block = buildBlock(url);
      var host = findSettingsHost();
      if (host) { host.appendChild(block); }
      else {
        var main = doc.querySelector('main') || doc.body;
        if (main) main.appendChild(block);
      }
      // Re-translate the freshly-added block if the a11y substrate is present.
      try { if (root.Chitti && root.Chitti.a11y && typeof root.Chitti.a11y.applyLang === 'function') root.Chitti.a11y.applyLang(); } catch (e) {}
    } catch (e) { /* honest skip — non-blocking */ }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(inject, 500); });
  else setTimeout(inject, 500);

  root.ChittiQR = { inject: inject };
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
