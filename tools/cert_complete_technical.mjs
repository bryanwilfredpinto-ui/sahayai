/**
 * tools/cert_complete_technical.mjs
 *
 * Chitti CTO 5-gate + per-page-spec cert for chitti_complete_technical.html.
 * Runtime, headless, 375px (mobile-first).
 *
 * 5 frontend gates (G1–G5 per QUALITY_STATUS.md §1a) — same as cert_logo_video.
 *
 * Sire's per-page specs (CTO directive 2026-05-27, priority #2):
 *   T1  Indian flag colors live across the page (chitti_theme.css + tokens)
 *   T2  Full 26-language dropdown wired (#lang-select)
 *   T3  Calls Generator tab is the DEFAULT (per locked 2026-05-27) +
 *       runCallsScanRich exists + the universe dropdown carries 5 buckets
 *       (Nifty50 / Largecap / Midcap / Smallcap / Microcap)
 *   T4  window.NSE substrate exposes all 5 stock universes with the
 *       expected counts (~50/100/150/250/250)
 *   T5  Sticky NOT SEBI REGISTERED bar visible — per locked
 *       project_legal_disclaimer ("never move to footer")
 *   T6  375px viewport — no horizontal scroll
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'https://sahayai.in';
const URL_ = BASE.replace(/\/$/, '') + '/chitti_complete_technical.html';

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

console.log('CERT URL: ' + URL_);
console.log('CERT viewport: 375x812 (mobile-first)\n');

await page.goto(BASE.replace(/\/$/, '') + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.evaluate(() => {
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
}).catch(() => {});

const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));

await page.goto(URL_, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(3500); // technical page is heavier; give substrate + nse_universe.js time

// ─── G1 ─────────────────────────────────────────────────────────
const g1Script = await page.locator('script[src*="feedback-widget.js"]').count();
const responseBoxes = await page.locator('[data-chitti-response]').count();
const iconRows = await page.evaluate(() => {
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
  iconRows + '/' + responseBoxes + ' boxes have a feedback row');

// ─── G2 ─────────────────────────────────────────────────────────
const g2Script = await page.locator('script[src*="chitti_a11y.js"]').count();
const a11yNs = await page.evaluate(() => !!(window.Chitti && (window.Chitti.a11y || window.Chitti.lang)));
check('G2 chitti_a11y.js loaded', g2Script >= 1, 'script tags=' + g2Script);
check('G2b window.Chitti.a11y (or .lang) namespace exists', a11yNs);

// ─── G3 ─ Disability Profile modal ─────────────────────────────
await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 5000 }).catch(() => {});
const dpFound = await page.evaluate(() => {
  function isVisible(el) {
    if (!el) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  var canonical = document.getElementById('chitti-disability-profile-modal');
  if (canonical && isVisible(canonical)) {
    const txt = (canonical.textContent || '').toLowerCase();
    if (/blind|deaf|mute|illiter|disabil/.test(txt)) {
      return { found: true, where: '#chitti-disability-profile-modal' };
    }
  }
  if (window.Chitti && window.Chitti.disabilityProfile && window.Chitti.disabilityProfile.get) {
    const p = window.Chitti.disabilityProfile.get();
    if (p) return { found: true, where: 'profile-already-saved' };
  }
  return { found: false };
});
check('G3 Disability Profile prompt on first visit', dpFound.found,
  dpFound.found ? dpFound.where : 'no visible modal');

if (dpFound.found && dpFound.where && dpFound.where.indexOf('disability') >= 0) {
  try {
    await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 2500 });
    await page.waitForTimeout(400);
  } catch (e) {
    await page.evaluate(() => {
      var m = document.getElementById('chitti-disability-profile-modal');
      if (m && m.parentNode) m.parentNode.removeChild(m);
    });
  }
}

// ─── G4 ─────────────────────────────────────────────────────────
const langInfo = await page.evaluate(() => {
  let current = null;
  try {
    if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.current === 'function') {
      current = window.Chitti.lang.current();
    }
  } catch (e) {}
  return {
    current: current,
    htmlLang: document.documentElement.getAttribute('lang'),
    listLen: (window.Chitti && window.Chitti.lang && window.Chitti.lang.list) ? window.Chitti.lang.list.length : 0,
  };
});
check('G4 language auto-detect + 26-lang substrate', !!langInfo.current && langInfo.listLen >= 26,
  'current=' + langInfo.current + ', list=' + langInfo.listLen + ', <html lang>=' + langInfo.htmlLang);

// ─── G5 ─────────────────────────────────────────────────────────
const g5Script = await page.locator('script[src*="chitti_isl.js"]').count();
const islNs = await page.evaluate(() => !!(window.Chitti && window.Chitti.isl));
check('G5 chitti_isl.js loaded', g5Script >= 1, 'script tags=' + g5Script);
check('G5b window.Chitti.isl namespace exists', islNs);

// ─── T1 ─ Indian flag tokens ──────────────────────────────────
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
check('T1 Indian flag tokens in stylesheets', flagTokens >= 1, 'matches=' + flagTokens);

// ─── T2 ─ Language dropdown ──────────────────────────────────
const langSelect = await page.evaluate(() => {
  // chitti_a11y / chitti_lang inject #lang-select with the 26-lang option list.
  const sel = document.querySelector('#lang-select');
  if (sel) {
    return { found: true, id: 'lang-select', options: (sel.options || []).length };
  }
  return { found: false };
});
check('T2 26-language dropdown #lang-select present', langSelect.found && langSelect.options >= 26,
  langSelect.found ? '#lang-select with ' + langSelect.options + ' options' : 'no #lang-select on page');

// ─── T3 ─ Calls tab default + signals plumbing ───────────────
const callsState = await page.evaluate(() => {
  const callsTab = document.getElementById('tab-calls');
  const isActive = callsTab && callsTab.classList.contains('active');
  const cgUniv = document.getElementById('cg-univ');
  const buckets = cgUniv ? Array.from(cgUniv.options || []).map((o) => o.value) : [];
  const hasRunCallsScanRich = typeof window.runCallsScanRich === 'function';
  const generateBtn = !!document.querySelector('#tab-calls .scan-btn[onclick*="runCallsScanRich"]');
  return { isActive: !!isActive, buckets, hasRunCallsScanRich, generateBtn };
});
check('T3 Calls tab is the default active pane', callsState.isActive,
  callsState.isActive ? 'tab-calls.active' : 'tab-calls NOT active');
check('T3b runCallsScanRich() function exists', callsState.hasRunCallsScanRich);
check('T3c "Generate Calls" button wired to runCallsScanRich', callsState.generateBtn);
const expectedBuckets = ['nifty50', 'largecap', 'midcap', 'smallcap', 'microcap'];
const haveAll = expectedBuckets.every((b) => callsState.buckets.includes(b));
check('T3d universe selector carries all 5 buckets', haveAll,
  'buckets=' + JSON.stringify(callsState.buckets));

// ─── T4 ─ NSE universe substrate populated ───────────────────
const nse = await page.evaluate(() => {
  if (!window.NSE) return { found: false };
  return {
    found: true,
    nifty50: (window.NSE.NIFTY50 || []).length,
    largecap: (window.NSE.LARGECAP || []).length,
    midcap: (window.NSE.MIDCAP150 || window.NSE.MIDCAP || []).length,
    smallcap: (window.NSE.SMALLCAP250 || window.NSE.SMALLCAP || []).length,
    microcap: (window.NSE.MICROCAP250 || window.NSE.MICROCAP || []).length,
  };
});
check('T4 window.NSE substrate exposed', nse.found, JSON.stringify(nse));
const sizesOk =
  nse.found &&
  nse.nifty50 >= 45 && nse.nifty50 <= 55 &&
  nse.largecap >= 90 && nse.largecap <= 110 &&
  nse.midcap >= 140 && nse.midcap <= 160 &&
  nse.smallcap >= 220 && nse.smallcap <= 260 &&
  nse.microcap >= 200 && nse.microcap <= 260;
check('T4b 5 bucket sizes within tolerance (~50/100/150/250/250)', sizesOk);

// ─── T5 ─ Sticky SEBI bar visible (not in footer) ────────────
const sebi = await page.evaluate(() => {
  // The locked rule says STICKY at top, never demoted to footer.
  // chitti_complete_technical uses .sebi-bar at line 543.
  const bar = document.querySelector('.sebi-bar');
  if (!bar) return { found: false };
  const cs = window.getComputedStyle(bar);
  const r = bar.getBoundingClientRect();
  return {
    found: true,
    visible: r.height > 0,
    position: cs.position,
    top: r.top,
    txt: (bar.textContent || '').trim().slice(0, 80),
  };
});
check('T5 NOT SEBI REGISTERED banner visible', sebi.found && sebi.visible,
  sebi.found ? 'pos=' + sebi.position + ', top=' + sebi.top + 'px, txt="' + sebi.txt + '..."' : 'not present');

// ─── T6 ─ 375px no h-scroll ──────────────────────────────────
const scroll = await page.evaluate(() => ({
  docW: document.documentElement.scrollWidth,
  winW: window.innerWidth,
}));
const noHScroll = scroll.docW <= scroll.winW + 2;
check('T6 no horizontal scroll at 375px', noHScroll, `doc=${scroll.docW}px win=${scroll.winW}px`);

// Screenshots — visit each visible tab at 375px
const visibleTabs = ['calls', 'scanner', 'chart', 'watch', 'journal'];
for (const t of visibleTabs) {
  try {
    await page.evaluate((tab) => { if (typeof showTab === 'function') showTab(tab); }, t);
    await page.waitForTimeout(450);
    const out = resolve(__dirname, `cert_complete_technical_${t}_375.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('   📸 ' + out);
  } catch (e) {}
}

// ─── JS errors ──────────────────────────────────────────────
check('No console pageerror events', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : '');

await browser.close();

const summary = {
  page: URL_,
  ts: new Date().toISOString(),
  viewport: '375x812',
  results,
  errors,
  pass: results.every((r) => r.ok),
};
writeFileSync(
  resolve(__dirname, 'cert_complete_technical_result.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

const passed = results.filter((r) => r.ok).length;
const total = results.length;
console.log(`\nCERT ${summary.pass ? 'PASS' : 'FAIL'} · ${passed}/${total} checks passed.`);
process.exit(summary.pass ? 0 : 1);
