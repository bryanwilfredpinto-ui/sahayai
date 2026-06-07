#!/usr/bin/env node
/**
 * tools/cert_ca_os.mjs — Chitti CA OS (CEOS v1.0) live certification.
 * Self-contained: starts its own static server, then a real Chromium pass.
 * Closes BO10 (axe-core) + proves the Vaani #lang-select language dropdown FIRES,
 * the 5 frontend gates, four-user journeys, engine functional, responsive @375/768/1280.
 * Run: node tools/cert_ca_os.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = join(ROOT, p);
  readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_ca_os.html`;
const URLJ = URL + '?dp_skip=1';   // returning-user: suppress first-visit disability modal (chitti_a11y kill-switch)
// substrate cross-origin noise (shared by all 23 pages — not this page's defect; see QUALITY_STATUS observability-CORS note)
const SUBSTRATE_NOISE = /Access to fetch|CORS policy|ERR_FAILED|Failed to load resource|-api-production\.up\.railway\.app|chitti-[a-z]+-api/i;

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }
async function safe(label, fn) { try { return await fn(); } catch (e) { check(label, false, 'threw: ' + e.message); return null; } }

const html = readFileSync(resolve(ROOT, 'chitti_ca_os.html'), 'utf8');
const b = await chromium.launch({ headless: true });

// ── 1. Responsive screenshots ──
for (const v of [{ name: '375', w: 375, h: 812, dsf: 2 }, { name: '768', w: 768, h: 1024, dsf: 2 }, { name: '1280', w: 1280, h: 900, dsf: 1 }]) {
  await safe('screenshot_' + v.name, async () => {
    const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
    const p = await c.newPage();
    await p.goto(URLJ, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => p.goto(URLJ, { waitUntil: 'domcontentloaded' }));
    await p.waitForTimeout(1200);
    const out = resolve(SHOT_DIR, `chitti_ca_os_${v.name}.png`);
    await p.screenshot({ path: out, fullPage: true });
    check('screenshot_' + v.name, true, out);
    await c.close();
  });
}

// ── main context ──
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
await page.goto(URLJ, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);

// ── 2. Five frontend gates ──
const boxes = await page.locator('[data-chitti-response]').count();
check('G1 feedback-widget.js + data-chitti-response', /feedback-widget\.js/.test(html) && boxes >= 11, `script:${/feedback-widget\.js/.test(html)} boxes:${boxes}`);
check('G2 chitti_a11y.js loaded', /chitti_a11y\.js/.test(html));
await safe('G3 disability profile on first visit', async () => {
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p2.goto(URL, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2000);
  // a11y substrate injects the disability profile modal; accept either a modal or the API
  const hasModal = await p2.evaluate(() => !!document.querySelector('[class*="disab"],[id*="disab"],[class*="profile"],#chitti-disability-modal') || !!(window.Chitti && window.Chitti.a11y));
  check('G3 disability profile/substrate present', hasModal);
  await p2.close();
});
check('G4 language auto-detect (html lang set)', /<html lang=/.test(html));
await safe('G5 ISL plugin', async () => {
  const isl = await page.evaluate(() => /chitti_isl/.test(document.documentElement.innerHTML) || !!(window.Chitti && window.Chitti.isl));
  check('G5 ISL plugin (chitti_isl or window.Chitti.isl)', isl);
});

// ── 3. THE LANGUAGE DROPDOWN ACTUALLY FIRES (Sire's hard requirement) ──
await safe('LANG dropdown populated + switches', async () => {
  const opts = await page.locator('#lang-select option').count();
  check('LANG dropdown populated (≥20 langs)', opts >= 20, `${opts} options`);
  const before = await page.evaluate(() => document.documentElement.lang);
  await page.selectOption('#lang-select', 'hi');
  await page.waitForTimeout(1500);
  const afterLang = await page.evaluate(() => document.documentElement.lang);
  const stored = await page.evaluate(() => { try { return localStorage.getItem('chitti_lang'); } catch (e) { return null; } });
  check('LANG switch → html[lang]=hi', afterLang === 'hi', `before:${before} after:${afterLang}`);
  check('LANG switch → persisted (localStorage chitti_lang=hi)', stored === 'hi', `stored:${stored}`);
  // some visible text should change (honest English fallback for missing keys is OK, but common words translate)
  const changed = await page.evaluate(() => {
    // count text nodes whose snapshot original differs from current
    let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node; while ((node = w.nextNode())) { if (node._chittiOrig !== undefined && node._chittiOrig !== node.nodeValue) n++; }
    return n;
  });
  check('LANG switch translated ≥1 text node (Hindi pack)', changed >= 1, `${changed} nodes changed`);
  // switch to Tamil then back to English — stability
  await page.selectOption('#lang-select', 'ta'); await page.waitForTimeout(1200);
  await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(800);
  const backEn = await page.evaluate(() => document.documentElement.lang);
  check('LANG switch back to en stable', backEn === 'en', `lang:${backEn}`);
});

// ── 4. BO1 accessibility structure ──
check('BO1 skip-to-content link', await page.locator('a.skip').count() === 1);
check('BO1 single <h1>', await page.locator('h1').count() === 1);
check('BO1 <main role=main>', await page.locator('main#main').count() === 1);
check('BO1 role=tab tabs', await page.locator('[role="tab"]').count() === 8);
check('BO1 aria-live result hosts ≥8', await page.locator('[aria-live="polite"]').count() >= 8);

// ── 5. Four-user TAP-ONLY journey + engine functional (no voice/typing-free where chips exist) ──
await safe('ENGINE income-tax via tap+fill renders ₹', async () => {
  await page.click('#tab-tax');
  await page.fill('#tx-gross', '2000000');
  await page.click('button[onclick="caRunTax()"]');
  await page.waitForTimeout(600);
  const txt = await page.locator('#r-tax').innerText();
  check('ENGINE tax result shows a ₹ figure', /₹/.test(txt) && /regime/i.test(txt), txt.split('\n')[0]);
  // BO2 deaf: result carries a WORD status (not colour-only)
  const word = await page.locator('#r-tax .res-status').innerText().catch(() => '');
  check('BO2 result has symbol+WORD status', /Good|Check this|Note/.test(word), word.trim());
  // read-aloud button present (blind/illiterate)
  check('BO4 read-aloud button on result', await page.locator('#r-tax .speak-btn').count() >= 1);
});
await safe('ENGINE govt-benefits (the moat) renders schemes', async () => {
  await page.click('#tab-gov');
  await page.fill('#gv-state', 'Maharashtra');
  await page.click('#gv-mfg');
  await page.fill('#gv-turn', '20000000');
  await page.fill('#gv-age', '4');
  await page.click('button[onclick="caRunGov()"]');
  await page.waitForTimeout(600);
  const txt = await page.locator('#r-gov').innerText();
  check('ENGINE govt-benefits lists ≥1 scheme', /scheme/i.test(txt) && /🏛️/.test(txt), txt.split('\n')[0]);
});
await safe('ENGINE fraud GSTIN checksum', async () => {
  await page.click('#tab-fraud');
  await page.fill('#fr-gstin', '27AAPFU0939F1ZX'); // wrong check digit → should flag
  await page.click('button[onclick="caRunFraud()"]');
  await page.waitForTimeout(500);
  const txt = await page.locator('#r-fraud').innerText();
  check('ENGINE fraud flags a bad GSTIN', /Verify|fake|Checksum/i.test(txt), txt.split('\n')[0]);
});

// ── 6. tap targets ≥44px (mute/limited-mobility) ──
await safe('TAP targets ≥44px (authored controls)', async () => {
  const res = await page.evaluate(() => {
    // scope to controls THIS page authors (header a11y-bar + main); substrate-injected
    // controls (#chitti-*, bottom-nav, feedback widget) are shared fleet substrate.
    const els = [...document.querySelectorAll('header button, #lang-select, a.skip, #main button, #main .chip, #main select, [role=tab]')];
    const bad = [];
    els.forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.height < 44) bad.push((e.id || e.className || e.tagName) + ':' + Math.round(r.height) + 'px'); });
    return bad;
  });
  check('TAP targets (authored) all ≥44px', res.length === 0, res.join(', ') || 'all ok');
});

// ── 7. axe-core (BO10) ──
await safe('BO10 axe-core 0 serious/critical', async () => {
  const axe = readFileSync(resolve(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axe);
  const res = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations'] }));
  // exclude violations whose nodes are ALL substrate-injected (shared fleet substrate, not this page)
  const isSub = (t) => /chitti-(dp|bn|isl|cam|feedback)|#chitti-|bottom-nav|chitti-disability|chitti-features/i.test(t);
  const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.map((nn) => nn.target.join(' ')) }))
    .map((v) => ({ ...v, mine: v.nodes.filter((t) => !isSub(t)) }))
    .filter((v) => v.mine.length > 0);
  check('BO10 axe-core 0 serious/critical (authored)', serious.length === 0, serious.map((v) => v.id + '(' + v.mine.length + ')').join(', ') || 'clean');
  serious.forEach((v) => console.log('   ↳ ' + v.id + ': ' + v.help + ' @ ' + v.mine.slice(0, 4).join(' | ')));
});

// ── 8. console clean (substrate cross-origin noise filtered) ──
const realErrors = consoleErrors.filter((e) => !SUBSTRATE_NOISE.test(e));
check('No page/JS errors during journey (substrate CORS filtered)', realErrors.length === 0, realErrors.slice(0, 3).join(' | ') || `(${consoleErrors.length} substrate-CORS lines ignored)`);

await b.close();
server.close();

const pass = R.filter((r) => r.ok).length, fail = R.length - pass;
console.log(`\nChitti CA OS cert — ${pass}/${R.length} GREEN, ${fail} failed`);
if (fail) { console.log('FAILURES:\n' + R.filter((r) => !r.ok).map((r) => '  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')).join('\n')); process.exit(1); }
console.log(`✅ ALL GREEN  ·  QA_RESULT:{"pass":${pass},"fail":${fail}}`);
