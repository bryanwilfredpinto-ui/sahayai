/**
 * tools/cert_all_pages.mjs
 *
 * Chitti CTO batch cert — runs the 5 frontend gates (G1–G5 per
 * QUALITY_STATUS.md §1a) + the cross-cutting Sire specs (Indian flag
 * colors, language dropdown, no horizontal scroll at 375px) against
 * EVERY user-facing Chitti page in the repo.
 *
 * Pages with a dedicated per-page cert (cert_logo_video, cert_complete_technical)
 * are skipped here — see CERT_LOG.md for their richer cert artifacts.
 *
 * Output:
 *   tools/cert_all_pages_result.json   — full machine-readable summary
 *   one-line console row per page (✅ / 🟡 / ❌)
 *
 * Usage:
 *   node tools/cert_all_pages.mjs                       # live, all pages
 *   CERT_BASE=http://127.0.0.1:8765 node tools/cert_all_pages.mjs
 *   ONLY=chitti_vaani,chitti_medupi node tools/cert_all_pages.mjs
 *
 * Per-Chitti spec compliance (Indian flag · lang dropdown · widget · 375px)
 * is checked uniformly. Page-specific deep-cert (Calls Generator on
 * technical, Roshan composite, etc.) lives in tools/cert_<page>.mjs.
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');

// Every user-facing Chitti page in the repo. Set EXCLUDE_LANGS=1 to
// skip the 26 Voice Factory language mirrors (faster cert runs when
// only the canonical product pages matter).
const VOICE_FACTORY_LANGS = [
  'chitti_hi', 'chitti_bn', 'chitti_te', 'chitti_ta', 'chitti_kn', 'chitti_ml',
  'chitti_mr', 'chitti_gu', 'chitti_or', 'chitti_as', 'chitti_pa', 'chitti_ur',
  'chitti_bho', 'chitti_hne', 'chitti_mai', 'chitti_kok', 'chitti_doi',
  'chitti_sd', 'chitti_ks', 'chitti_mni', 'chitti_brx', 'chitti_sat',
  'chitti_sa', 'chitti_tcy', 'chitti_kfa', 'chitti_kru',
];

const PAGES = [
  'chitti_vaani',           // USER-CANONICAL per §2 row 1
  'chitti_medupi',
  'chitti_news',
  'chitti_news_ai',
  'chitti_ca',
  'chitti_legal',
  'chitti_government',
  'chitti_upi',
  'chitti_scanner',
  'chitti_fundamentals',
  'chitti_voice_factory',
  'chitti_voice_hall_of_fame',
  'chitti_2wheeler',
  'chitti_4wheeler',
  'chitti_health_file',
  'chitti_fashion',
  'chitti_isl',
  'chitti_offline',
  'chitti_quality',
  'chitti_complete',
  'chitti_claude_complete',
  'chitti_admin_products',
  'chitti_admin_feedback',
  'index',
  ...(process.env.EXCLUDE_LANGS ? [] : VOICE_FACTORY_LANGS),
];

const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);

async function certPage(browser, slug) {
  const url = BASE + '/' + (slug === 'index' ? 'index.html' : slug + '.html');
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  const results = [];
  function add(label, ok, detail) {
    results.push({ label, ok, detail });
  }

  // Clear storage so G3 fires on fresh visit.
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  } catch (e) {}

  // Backend-fetch failures (chitti-*-api.up.railway.app sleeping, network
  // hiccup from the cert environment) aren't frontend cert failures —
  // they're honest "backend unreachable" surfaced through unhandled
  // promise rejections. Filter them so the page's JS health is judged
  // on its own code, not on transient backend availability.
  const isBackendFetchNoise = (msg) => {
    if (!msg) return false;
    if (/^Failed to fetch$/.test(msg.trim())) return true;
    if (/NetworkError|net::ERR_FAILED|net::ERR_NAME_NOT_RESOLVED|ECONNREFUSED/.test(msg)) return true;
    return false;
  };
  page.on('pageerror', (e) => {
    const m = String(e.message || e).slice(0, 240);
    if (!isBackendFetchNoise(m)) errors.push(m);
  });

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (!resp || !resp.ok()) {
      add('HTTP 200', false, 'HTTP ' + (resp ? resp.status() : 'n/a'));
      await ctx.close();
      return { slug, url, results, errors, pass: false, http: resp ? resp.status() : 0 };
    }
    add('HTTP 200', true);
  } catch (e) {
    add('HTTP 200', false, 'goto failed: ' + e.message.slice(0, 100));
    await ctx.close();
    return { slug, url, results, errors, pass: false, http: 0 };
  }

  await page.waitForTimeout(3000);

  // ─── G1 feedback-widget ──────────────────────────────────────
  const g1 = await page.evaluate(() => {
    const s = document.querySelector('script[src*="feedback-widget.js"]');
    const boxes = document.querySelectorAll('[data-chitti-response]').length;
    let bars = 0;
    document.querySelectorAll('[data-chitti-response]').forEach((el) => {
      const next = el.nextElementSibling;
      if (next && next.classList && next.classList.contains('chitti-fb-box-bar')) bars++;
    });
    return { scriptLoaded: !!s, boxes, bars };
  });
  add('G1 feedback-widget.js loaded', g1.scriptLoaded);
  // Content-only pages (landing / status / admin / hall-of-fame) have no
  // user-facing response boxes by design — G1b is N/A for them. The
  // locked §7 contract is "every response box has the 4-icon row" — if
  // there are no response boxes there's nothing to attach to.
  const CONTENT_ONLY_PAGES = new Set([
    'chitti_voice_hall_of_fame',
    'chitti_offline',
    'chitti_quality',
    'chitti_complete',
    'chitti_claude_complete',
    'chitti_admin_products',
    'chitti_admin_feedback',
    'index',
  ]);
  if (CONTENT_ONLY_PAGES.has(slug)) {
    add('G1b data-chitti-response boxes (N/A for content-only page)', true, 'boxes=' + g1.boxes + ' — honest YELLOW-by-design');
  } else {
    add('G1b data-chitti-response boxes >= 1', g1.boxes >= 1, 'boxes=' + g1.boxes);
    if (g1.boxes >= 1) {
      add('G1c >= 1 box has feedback row attached', g1.bars >= 1, g1.bars + '/' + g1.boxes);
    }
  }

  // ─── G2 a11y substrate ──────────────────────────────────────
  const g2 = await page.evaluate(() => {
    const s = document.querySelector('script[src*="chitti_a11y.js"]');
    const ns = !!(window.Chitti && (window.Chitti.a11y || window.Chitti.lang));
    return { scriptLoaded: !!s, ns };
  });
  add('G2 chitti_a11y.js loaded', g2.scriptLoaded);
  add('G2b window.Chitti namespace exists', g2.ns);

  // ─── G3 Disability Profile ──────────────────────────────────
  await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 5000 }).catch(() => {});
  const g3 = await page.evaluate(() => {
    function isVisible(el) {
      if (!el) return false;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    const m = document.getElementById('chitti-disability-profile-modal');
    if (m && isVisible(m)) {
      const t = (m.textContent || '').toLowerCase();
      if (/blind|deaf|mute|illiter|disabil/.test(t)) return { found: true, where: 'modal-visible' };
    }
    if (window.Chitti && window.Chitti.disabilityProfile) {
      return { found: true, where: 'substrate-loaded' };
    }
    return { found: false };
  });
  add('G3 Disability Profile substrate active', g3.found, g3.where || '');

  // Dismiss modal so subsequent checks aren't blocked.
  if (g3.found && g3.where === 'modal-visible') {
    try {
      await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 2500 });
      await page.waitForTimeout(300);
    } catch (e) {
      await page.evaluate(() => {
        const m = document.getElementById('chitti-disability-profile-modal');
        if (m && m.parentNode) m.parentNode.removeChild(m);
      });
    }
  }

  // ─── G4 lang substrate ──────────────────────────────────────
  const g4 = await page.evaluate(() => {
    let cur = null;
    try {
      if (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.current === 'function') {
        cur = window.Chitti.lang.current();
      }
    } catch (e) {}
    const listLen = (window.Chitti && window.Chitti.lang && Array.isArray(window.Chitti.lang.list)) ? window.Chitti.lang.list.length : 0;
    return { current: cur, listLen };
  });
  add('G4 Chitti.lang.current() returns a value', !!g4.current, 'current=' + g4.current);
  add('G4b 26-language list registered', g4.listLen >= 26, 'listLen=' + g4.listLen);

  // ─── G5 ISL ─────────────────────────────────────────────────
  const g5 = await page.evaluate(() => {
    const s = document.querySelector('script[src*="chitti_isl.js"]');
    const ns = !!(window.Chitti && window.Chitti.isl);
    return { scriptLoaded: !!s, ns };
  });
  add('G5 chitti_isl.js loaded', g5.scriptLoaded);
  // G5b is best-effort — some pages may load the script but not expose the namespace.
  add('G5b window.Chitti.isl namespace', g5.ns);

  // ─── Sire cross-cutting specs ───────────────────────────────
  // Indian flag tokens in stylesheets
  const flag = await page.evaluate(() => {
    let hits = 0;
    for (const sh of Array.from(document.styleSheets)) {
      try {
        for (const rule of sh.cssRules || []) {
          const t = (rule.cssText || '').toLowerCase();
          if (/--saffron|--green-flag|--navy|#ff9933|#138808|#000080/.test(t)) { hits++; if (hits > 3) return hits; }
        }
      } catch (e) {}
    }
    return hits;
  });
  add('Sire-S1 Indian flag tokens present', flag >= 1, 'matches=' + flag);

  // Language dropdown — chitti_lang.js wireDropdown accepts any of:
  //   #lang-select, #lang, #hdr-lang, #pick-lang, #onb-lang,
  //   [name="lang"], [name="language"], [aria-label="Language"], etc.
  // Cert should accept any of them as the wired select.
  const langSel = await page.evaluate(() => {
    const sel = document.querySelector(
      'select#lang-select, select#lang, select#hdr-lang, ' +
      'select#pick-lang, select#onb-lang, ' +
      'select[name="lang"], select[name="language"], ' +
      'select[aria-label="Language"], select[aria-label="Choose language"], select[aria-label="Change language"]'
    );
    return { found: !!sel, id: sel ? sel.id : '', n: sel ? (sel.options || []).length : 0 };
  });
  add('Sire-S2 language dropdown wired (any chitti_lang.js selector)', langSel.found && langSel.n >= 5,
    langSel.found ? '#' + langSel.id + ' options=' + langSel.n : 'no compatible <select> on page');

  // 375px no horizontal scroll
  const scroll = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, winW: window.innerWidth }));
  add('Sire-S3 no horizontal scroll @ 375px', scroll.docW <= scroll.winW + 2, `${scroll.docW}/${scroll.winW}`);

  // Screenshot at 375px
  const shotPath = resolve(__dirname, 'cert_all_pages_' + slug + '_375.png');
  try {
    await page.screenshot({ path: shotPath, fullPage: false });
  } catch (e) {}

  add('No pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await ctx.close();
  return { slug, url, results, errors, pass: results.every((r) => r.ok), shotPath };
}

const browser = await chromium.launch({ headless: true });
const out = [];
const target = ONLY.length ? PAGES.filter((p) => ONLY.includes(p)) : PAGES;

console.log('Batch cert against ' + BASE);
console.log('Pages: ' + target.length);
console.log('');

for (const slug of target) {
  const r = await certPage(browser, slug);
  const passed = r.results.filter((x) => x.ok).length;
  const total = r.results.length;
  const status = r.pass ? '✅' : (passed >= total - 2 ? '🟡' : '❌');
  console.log(`${status} ${slug.padEnd(28)} ${passed}/${total}`);
  if (!r.pass) {
    r.results.filter((x) => !x.ok).forEach((x) => console.log(`     ❌ ${x.label}${x.detail ? ' — ' + x.detail : ''}`));
  }
  out.push(r);
}

await browser.close();

writeFileSync(
  resolve(__dirname, 'cert_all_pages_result.json'),
  JSON.stringify({ ts: new Date().toISOString(), base: BASE, pages: out }, null, 2),
  'utf8'
);

const greens = out.filter((r) => r.pass).length;
const total = out.length;
console.log(`\nBatch cert complete: ${greens}/${total} GREEN`);
process.exit(greens === total ? 0 : 1);
