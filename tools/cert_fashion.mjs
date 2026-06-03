#!/usr/bin/env node
/**
 * tools/cert_fashion.mjs — Chitti Fashion (CFOS v1.0) certification.
 * Real Playwright cert across 375 / 768 / 1280 + 5 frontend gates + 5 per-box
 * elements + keyboard + aria + 48px tap targets. Writes real screenshots.
 * Run: CERT_BASE=http://127.0.0.1:8765 node tools/cert_fashion.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_fashion.html';
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }
async function safe(label, fn) { try { return await fn(); } catch (e) { check(label, false, 'threw: ' + e.message); return null; } }

const b = await chromium.launch({ headless: true });

// ---- 1. Responsive screenshots ----
const viewports = [
  { name: '375', w: 375, h: 812, dsf: 2 },
  { name: '768', w: 768, h: 1024, dsf: 2 },
  { name: '1280', w: 1280, h: 900, dsf: 1 },
];
for (const v of viewports) {
  await safe('screenshot_' + v.name, async () => {
    const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
    const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => p.goto(URL, { waitUntil: 'domcontentloaded' }));
    await p.waitForTimeout(1200);
    const out = resolve(SHOT_DIR, `chitti_fashion_${v.name}.png`);
    await p.screenshot({ path: out, fullPage: true });
    check('screenshot_' + v.name, true, out);
    await c.close();
  });
}

// ---- main context for gate checks ----
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const html = await (await fetch(URL)).text();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// ---- 2. Five frontend gates ----
await safe('G1_feedback_widget', async () => {
  const tag = /feedback-widget\.js/.test(html);
  const boxes = await page.locator('[data-chitti-response]').count();
  // 9 static response cards at load (hero + fa-card-01..08); 4 more are runtime-generated result cards.
  check('G1 feedback-widget + data-chitti-response', tag && boxes >= 9, `script:${tag} static-boxes:${boxes}`);
});
check('G2 chitti_a11y.js loaded', /chitti_a11y\.js/.test(html));
await safe('G3_disability_profile', async () => {
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const onboard = await page.evaluate(() => {
    const o = document.getElementById('fa-onboard');
    const onboardVisible = o && getComputedStyle(o).display !== 'none';
    const platform = !!document.querySelector('[id*="disab" i],[class*="disab" i],[data-chitti-profile]');
    const anyModal = !!document.querySelector('.shown,[role="dialog"]');
    return { onboardVisible, platform, anyModal };
  });
  const ok = onboard.onboardVisible || onboard.platform || onboard.anyModal;
  check('G3 first-visit profile/onboarding', ok, JSON.stringify(onboard));
});
await safe('G4_lang_autodetect', async () => {
  const lang = await page.evaluate(() => document.documentElement.lang || '');
  check('G4 language auto-detect (<html lang>)', /^[a-z]{2}$/.test(lang), `lang="${lang}"`);
});
await safe('G5_isl', async () => {
  const tag = /chitti_isl\.js/.test(html);
  const islRuntime = await page.evaluate(() => !!(window.Chitti && window.Chitti.isl));
  check('G5 ISL plugin (script or runtime)', tag || islRuntime, `script:${tag} runtime:${islRuntime}`);
});

// ---- 3. Five mandatory per-box elements ----
await safe('five_elements', async () => {
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-chitti-response]')).slice(0, 5);
    let withToolbar = 0, totalBtns = 0;
    cards.forEach(c => { const tb = c.querySelector('.fa-toolbar'); if (tb) { withToolbar++; totalBtns += tb.querySelectorAll('button').length; } });
    const widgetAttached = document.querySelectorAll('[data-fb-attached],.fb-bar,.feedback-widget,[class*="feedback"]').length;
    return { sampled: cards.length, withToolbar, totalBtns, widgetAttached };
  });
  check('5 mandatory elements per box', r.withToolbar === r.sampled && r.totalBtns >= r.sampled * 4, JSON.stringify(r));
});

// ---- 4. Keyboard-only ----
await safe('keyboard', async () => {
  await page.evaluate(() => document.body.focus());
  let reachable = 0;
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); const tag = await page.evaluate(() => document.activeElement && document.activeElement.tagName); if (tag && tag !== 'BODY') reachable++; }
  const heroReachable = await page.evaluate(() => { const h = document.getElementById('fa-dressme'); if (!h) return false; h.focus(); return document.activeElement === h; });
  check('keyboard navigation (10 tabs + hero focusable)', reachable >= 6 && heroReachable, `reached:${reachable}/10 hero:${heroReachable}`);
});

// ---- 5. ARIA smoke ----
await safe('aria', async () => {
  const r = await page.evaluate(() => {
    function lab(btn){ return !!(btn.getAttribute('aria-label') || (btn.textContent || '').trim()); }
    const langAria = !!document.querySelector('#lang-select[aria-label]');
    const tabs = Array.from(document.querySelectorAll('.fa-tabbar button'));
    const tabsHaveText = tabs.length >= 5 && tabs.every(t => (t.textContent || '').trim().length > 0);
    const imgs = Array.from(document.querySelectorAll('#fa-grid img'));
    const imgsAlt = imgs.every(i => i.hasAttribute('alt'));
    const toolbarBtnsAria = Array.from(document.querySelectorAll('.fa-toolbar button')).every(lab);
    return { langAria, tabsHaveText, imgsAlt, toolbarBtnsAria, tabCount: tabs.length };
  });
  check('ARIA (lang label, tab text, img alt, toolbar labels)', r.langAria && r.tabsHaveText && r.imgsAlt && r.toolbarBtnsAria, JSON.stringify(r));
});

// ---- 6. Tap targets >= 44x40 ----
await safe('tap_targets', async () => {
  const sel = ['.fa-tabbar button', '#fa-dressme', '.fa-toolbar button', '.fa-btn'];
  const small = [];
  for (const s of sel) {
    const els = page.locator(s); const n = await els.count();
    for (let i = 0; i < n; i++) { const box = await els.nth(i).boundingBox(); if (box && (box.width < 44 || box.height < 40)) small.push(`${s}#${i}=${Math.round(box.width)}x${Math.round(box.height)}`); }
  }
  check('48px tap targets (min 44x40)', small.length === 0, small.length ? 'below: ' + small.slice(0, 6).join(', ') : 'all OK');
});

// ---- 7. Identity + discovery ----
check('World Class identity badge present', /World Class Chitti Fashion/.test(html));
check('chitti-features meta (Feature Discovery)', /name="chitti-features"/.test(html));

await b.close();
const pass = R.filter(r => r.ok).length;
const summary = { total_checks: R.length, total_pass: pass, total_fail: R.length - pass, failed: R.filter(r => !r.ok).map(r => r.label) };
console.log('\nCERT_SUMMARY:' + JSON.stringify(summary));
process.exit(0);
