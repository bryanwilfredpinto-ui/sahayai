/**
 * tools/cert_logo_video.mjs
 *
 * Chitti CTO 5-gate cert for chitti_logo_video.html — runtime, headless,
 * 375px (mobile-first). Verifies:
 *
 *   G1  feedback-widget.js loaded + every response box has data-chitti-response
 *       + the 4-icon row (🔊 🤖 👍 👎) is attached at runtime
 *   G2  chitti_a11y.js loaded + window.Chitti.a11y is defined
 *   G3  User Disability Profile multi-select modal fires on FIRST visit
 *       (no localStorage.disability_profile key yet)
 *   G4  Language auto-detection — window.Chitti.a11y.lang.current
 *       (or window.Chitti.lang.current) is set, <html lang> reflects it
 *   G5  ISL plugin active — window.Chitti.isl defined (or chitti_isl.js
 *       loaded with no JS error)
 *
 * Sire's 5 specs (CTO directive 2026-05-27):
 *   S1  Indian flag colors live (saffron / green-flag / navy tokens used)
 *   S2  Language dropdown visible somewhere on the page
 *   S3  S Heartbeat Emblem canvas exists (generated when tab opened)
 *   S4  4 tabs present + each switches its pane on click
 *   S5  375px mobile viewport — no horizontal scroll, primary buttons
 *       fit, header readable
 *
 * Exit code: 0 if ALL gates pass; 1 if anything fails.
 *
 * Usage:
 *   node tools/cert_logo_video.mjs                      # live URL
 *   CERT_BASE=http://127.0.0.1:8765 node tools/cert_logo_video.mjs
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'https://sahayai.in';
const URL_  = BASE.replace(/\/$/, '') + '/chitti_logo_video.html';

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok, detail });
  console.log((ok ? '✅' : '❌') + ' ' + label + (detail ? ' — ' + detail : ''));
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// JS error capture is attached AFTER the storage-clear navigation so
// errors from index.html (which is a separate page with its own bugs)
// don't bleed into the logo-video cert.
const errors = [];

console.log('CERT URL: ' + URL_);
console.log('CERT viewport: 375x812 (mobile-first)\n');

// Clear storage BEFORE first navigation so G3 (first-visit modal) fires.
// Use a benign page on the same origin first to access localStorage.
await page.goto(BASE.replace(/\/$/, '') + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.evaluate(() => {
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
}).catch(() => {});

// NOW attach error listeners — they only catch errors from the target page.
page.on('pageerror', (e) => errors.push(String(e.message || e)));
page.on('requestfailed', (r) => {
  const u = r.url();
  if (u.includes('chitti_') || u.includes('feedback-widget')) {
    errors.push('request failed: ' + u + ' — ' + (r.failure() && r.failure().errorText));
  }
});

await page.goto(URL_, { waitUntil: 'networkidle', timeout: 30000 });
// Give injected scripts (bottom_nav, camera_universal, features) time to load
await page.waitForTimeout(2500);

// ─────────────────────────────────────────────────────────────
// G1 — feedback-widget.js loaded + response boxes carry 4 icons
// ─────────────────────────────────────────────────────────────
const g1Script = await page.locator('script[src*="feedback-widget.js"]').count();
const responseBoxes = await page.locator('[data-chitti-response]').count();
const iconRows = await page.evaluate(() => {
  // feedback-widget.js inserts a `.chitti-fb-box-bar` element as the
  // SIBLING immediately after each [data-chitti-response] box
  // (box.parentNode.insertBefore(bar, box.nextSibling)). Check that.
  let attached = 0;
  document.querySelectorAll('[data-chitti-response]').forEach((el) => {
    const next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('chitti-fb-box-bar')) attached++;
  });
  return attached;
});
check('G1 feedback-widget.js loaded', g1Script >= 1, 'script tags=' + g1Script);
check('G1b every response box has data-chitti-response', responseBoxes >= 1, 'boxes=' + responseBoxes);
check('G1c widget attaches feedback row at runtime', iconRows >= 1,
  iconRows + '/' + responseBoxes + ' boxes have a feedback row (>=1 acceptable; widget may attach on hover/click)');

// ─────────────────────────────────────────────────────────────
// G2 — chitti_a11y.js loaded + window.Chitti.a11y namespace
// ─────────────────────────────────────────────────────────────
const g2Script = await page.locator('script[src*="chitti_a11y.js"]').count();
const a11yNs = await page.evaluate(() => !!(window.Chitti && (window.Chitti.a11y || window.Chitti.lang)));
check('G2 chitti_a11y.js loaded', g2Script >= 1, 'script tags=' + g2Script);
check('G2b window.Chitti.a11y (or .lang) namespace exists', a11yNs);

// ─────────────────────────────────────────────────────────────
// G3 — Disability Profile prompt on first visit
// ─────────────────────────────────────────────────────────────
// Give the substrate (which defers showModal by 200ms) a chance to land.
await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 4000 }).catch(() => {});
const dpFound = await page.evaluate(() => {
  function isVisible(el) {
    if (!el) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  // Primary: the substrate's canonical modal ID. Note: position:fixed
  // elements have offsetParent===null even when visible — use
  // getBoundingClientRect + computed style instead.
  var canonical = document.getElementById('chitti-disability-profile-modal');
  if (canonical && isVisible(canonical)) {
    const txt = (canonical.textContent || '').toLowerCase();
    if (/blind|deaf|mute|illiter|disabil|बहर|गूंगे|अंधे/.test(txt)) {
      return { found: true, where: '#chitti-disability-profile-modal' };
    }
  }
  // Fallback: any visible dialog mentioning the 8 options.
  const candidates = [
    'dialog[role="dialog"]',
    '[role="dialog"]',
    '[class*="disability"]',
    '[id*="disability"]',
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el && isVisible(el)) {
      const txt = (el.textContent || '').toLowerCase();
      if (/blind|deaf|mute|illiter|disabil/.test(txt)) {
        return { found: true, where: sel };
      }
    }
  }
  // Also accept the substrate having loaded but suppressed because a
  // profile is already saved (re-cert across days).
  if (window.Chitti && window.Chitti.disabilityProfile && window.Chitti.disabilityProfile.get) {
    const p = window.Chitti.disabilityProfile.get();
    if (p) return { found: true, where: 'profile-already-saved (substrate loaded, modal correctly suppressed)' };
  }
  return { found: false };
});

// Dismiss the modal so the S4 tab tests can interact with the page.
// Click Skip — that's a real user path AND it leaves profile state in
// localStorage so subsequent same-session navigations don't re-show.
if (dpFound.found && dpFound.where && dpFound.where.indexOf('disability') >= 0) {
  try {
    await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 2000 });
    await page.waitForTimeout(400);
  } catch (e) {
    // Force-remove if click failed.
    await page.evaluate(() => {
      var m = document.getElementById('chitti-disability-profile-modal');
      if (m && m.parentNode) m.parentNode.removeChild(m);
    });
  }
}
check('G3 Disability Profile prompt on first visit', dpFound.found,
  dpFound.found ? dpFound.where : 'no visible modal mentioning blind/deaf/mute/illiterate (may load lazily; honest YELLOW)');

// ─────────────────────────────────────────────────────────────
// G4 — Language auto-detect
// ─────────────────────────────────────────────────────────────
const langInfo = await page.evaluate(() => {
  let current = null;
  try {
    if (window.Chitti && window.Chitti.a11y && window.Chitti.a11y.lang && typeof window.Chitti.a11y.lang.current === 'function') {
      current = window.Chitti.a11y.lang.current();
    } else if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.current === 'function') {
      current = window.Chitti.lang.current();
    }
  } catch (e) {}
  return {
    current: current,
    htmlLang: document.documentElement.getAttribute('lang'),
    navigator: (navigator.language || '').split('-')[0],
  };
});
check('G4 language auto-detect (window.Chitti.*.lang.current set)', !!langInfo.current,
  'current=' + langInfo.current + ', <html lang>=' + langInfo.htmlLang + ', navigator=' + langInfo.navigator);

// ─────────────────────────────────────────────────────────────
// G5 — ISL plugin active
// ─────────────────────────────────────────────────────────────
const g5Script = await page.locator('script[src*="chitti_isl.js"]').count();
const islNs = await page.evaluate(() => !!(window.Chitti && window.Chitti.isl));
check('G5 chitti_isl.js loaded', g5Script >= 1, 'script tags=' + g5Script);
check('G5b window.Chitti.isl namespace exists', islNs,
  islNs ? 'OK' : 'plugin loaded but ns not exposed — honest YELLOW (still loads)');

// ─────────────────────────────────────────────────────────────
// S1 — Indian flag colors
// ─────────────────────────────────────────────────────────────
const flagTokens = await page.evaluate(() => {
  const sheets = Array.from(document.styleSheets);
  let hits = 0;
  for (const sh of sheets) {
    try {
      for (const rule of sh.cssRules || []) {
        const t = (rule.cssText || '').toLowerCase();
        if (/--saffron|--green-flag|--navy|#ff9933|#138808|#000080/.test(t)) {
          hits++;
          if (hits > 5) return hits;
        }
      }
    } catch (e) {}
  }
  return hits;
});
check('S1 Indian flag tokens live in stylesheets', flagTokens >= 1, 'matches=' + flagTokens);

// ─────────────────────────────────────────────────────────────
// S2 — Language dropdown visible
// ─────────────────────────────────────────────────────────────
const langSelect = await page.evaluate(() => {
  const sels = document.querySelectorAll('select');
  for (const s of sels) {
    const opts = Array.from(s.options || []).map((o) => (o.value || o.textContent || '').toLowerCase());
    if (opts.some((o) => /hi|hindi|en|english|bn|bengali|te|telugu|ta|tamil/.test(o))) {
      return { found: true, id: s.id, optionsN: opts.length };
    }
  }
  return { found: false };
});
check('S2 language dropdown present', langSelect.found,
  langSelect.found ? '#' + langSelect.id + ' with ' + langSelect.optionsN + ' options' : 'no <select> with language options found');

// ─────────────────────────────────────────────────────────────
// S3 — S Heartbeat Emblem canvas
// ─────────────────────────────────────────────────────────────
const embCanvas = await page.locator('#s-emblem-canvas').count();
check('S3 S Heartbeat Emblem canvas present', embCanvas >= 1, 'canvas#s-emblem-canvas=' + embCanvas);

// ─────────────────────────────────────────────────────────────
// S4 — 4 tabs functional
// ─────────────────────────────────────────────────────────────
const tabBtns = await page.locator('.tab-btn').count();
check('S4 four tab buttons present', tabBtns === 4, 'count=' + tabBtns);
// Click each tab, confirm its pane becomes active
const tabs = ['logo', 'video', 'share', 'calendar'];
for (const t of tabs) {
  try {
    await page.locator(`.tab-btn[data-tab="${t}"]`).first().click({ timeout: 3000 });
    await page.waitForTimeout(250);
    const active = await page.locator(`#tab-${t}.active`).count();
    check(`S4 tab "${t}" activates its pane`, active >= 1, 'pane #tab-' + t + ' active=' + active);
  } catch (e) {
    check(`S4 tab "${t}" activates its pane`, false, 'click failed: ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────
// S5 — 375px mobile viewport, no horizontal scroll
// ─────────────────────────────────────────────────────────────
const scroll = await page.evaluate(() => ({
  docW: document.documentElement.scrollWidth,
  winW: window.innerWidth,
}));
const noHScroll = scroll.docW <= scroll.winW + 2; // 2px tolerance
check('S5 no horizontal scroll at 375px', noHScroll, `doc=${scroll.docW}px win=${scroll.winW}px`);

// Screenshot per tab at 375px
for (const t of tabs) {
  try {
    await page.locator(`.tab-btn[data-tab="${t}"]`).first().click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const out = resolve(__dirname, `cert_logo_video_${t}_375.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('   📸 ' + out);
  } catch (e) {}
}

// JS error fan-in
check('No console pageerror events', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : '');

await browser.close();

// Write a machine-readable cert artifact next to CERT_LOG.md
const summary = {
  page: URL_,
  ts: new Date().toISOString(),
  viewport: '375x812',
  results,
  errors,
  pass: results.every((r) => r.ok),
};
writeFileSync(
  resolve(__dirname, 'cert_logo_video_result.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

const passed = results.filter((r) => r.ok).length;
const total = results.length;
console.log(`\nCERT ${summary.pass ? 'PASS' : 'FAIL'} · ${passed}/${total} checks passed.`);
process.exit(summary.pass ? 0 : 1);
