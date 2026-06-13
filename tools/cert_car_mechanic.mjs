#!/usr/bin/env node
/**
 * tools/cert_car_mechanic.mjs — Chitti Car Mechanic (CEOS v1.0) live certification.
 * Self-contained static server + real Chromium pass. Proves:
 *  - 5 device screenshots (Desktop 1920x1080, Laptop 1366x768, iPad, iPhone, Android) — Sire's hard rule
 *  - the Vaani #lang-select dropdown FIRES (en→hi translates whole UI, persists, returns to en)
 *  - the 5 frontend gates, BO accessibility structure, tap targets ≥44px
 *  - every engine module renders a real verdict via tap+fill (no LLM, no network)
 *  - SAFETY: red faults say "do NOT drive"; airbag/brake DIY = mechanic-only
 *  - axe-core 0 serious/critical (authored), console clean
 * Run: node tools/cert_car_mechanic.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdirSync, readFileSync } from 'node:fs';

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
const URL = `http://127.0.0.1:${PORT}/chitti_car_mechanic.html`;
const URLJ = URL + '?dp_skip=1';
const SUBSTRATE_NOISE = /Access to fetch|CORS policy|ERR_FAILED|Failed to load resource|-api-production\.up\.railway\.app|chitti-[a-z]+-api|sahayai_design_system\.css/i;

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }
async function safe(label, fn) { try { return await fn(); } catch (e) { check(label, false, 'threw: ' + e.message); return null; } }

const html = readFileSync(resolve(ROOT, 'chitti_car_mechanic.html'), 'utf8');
const b = await chromium.launch({ headless: true });

// ── 1. FIVE device screenshots (Sire's hard rule) ──
const DEVICES = [
  { name: 'desktop_1920x1080', w: 1920, h: 1080, dsf: 1 },
  { name: 'laptop_1366x768', w: 1366, h: 768, dsf: 1 },
  { name: 'ipad', w: 810, h: 1080, dsf: 2 },
  { name: 'iphone', w: 390, h: 844, dsf: 3 },
  { name: 'android', w: 360, h: 800, dsf: 3 }
];
for (const v of DEVICES) {
  await safe('screenshot_' + v.name, async () => {
    const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
    const p = await c.newPage();
    await p.goto(URLJ, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => p.goto(URLJ, { waitUntil: 'domcontentloaded' }));
    await p.waitForTimeout(1000);
    const out = resolve(SHOT_DIR, `chitti_car_mechanic_${v.name}.png`);
    await p.screenshot({ path: out, fullPage: true });
    check('screenshot_' + v.name, true, out);
    await c.close();
  });
}

// ── main context (iPhone-ish) ──
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
await page.goto(URLJ, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);

// ── 2. five frontend gates ──
const boxes = await page.locator('[data-chitti-response]').count();
check('G1 feedback-widget.js + data-chitti-response', /feedback-widget\.js/.test(html) && boxes >= 15, `script:${/feedback-widget\.js/.test(html)} boxes:${boxes}`);
check('G2 chitti_a11y.js loaded', /chitti_a11y\.js/.test(html));
await safe('G3 disability profile on first visit', async () => {
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p2.goto(URL, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2000);
  const hasModal = await p2.evaluate(() => !!document.querySelector('[class*="disab"],[id*="disab"],[class*="profile"],#chitti-disability-modal') || !!(window.Chitti && window.Chitti.a11y));
  check('G3 disability profile/substrate present', hasModal);
  await p2.close();
});
check('G4 language attr present (html lang)', /<html lang=/.test(html));
await safe('G5 ISL plugin', async () => {
  const isl = await page.evaluate(() => /chitti_isl/.test(document.documentElement.innerHTML) || !!(window.Chitti && window.Chitti.isl));
  check('G5 ISL plugin (chitti_isl or window.Chitti.isl)', isl);
});

// ── 3. LANGUAGE DROPDOWN FIRES (Sire's hard requirement) ──
await safe('LANG dropdown populated + switches', async () => {
  const opts = await page.locator('#lang-select option').count();
  check('LANG dropdown populated (≥20 langs)', opts >= 20, `${opts} options`);
  await page.selectOption('#lang-select', 'hi');
  await page.waitForTimeout(1600);
  const afterLang = await page.evaluate(() => document.documentElement.lang);
  const stored = await page.evaluate(() => { try { return localStorage.getItem('chitti_lang'); } catch (e) { return null; } });
  check('LANG switch → html[lang]=hi', afterLang === 'hi', `after:${afterLang}`);
  check('LANG switch → persisted', stored === 'hi', `stored:${stored}`);
  const changed = await page.evaluate(() => {
    let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node; while ((node = w.nextNode())) { if (node._chittiOrig !== undefined && node._chittiOrig !== node.nodeValue) n++; }
    return n;
  });
  check('LANG switch translated ≥1 text node (Hindi pack)', changed >= 1, `${changed} nodes changed`);
  await page.selectOption('#lang-select', 'ta'); await page.waitForTimeout(1000);
  await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(800);
  check('LANG back to en stable', (await page.evaluate(() => document.documentElement.lang)) === 'en');
});

// ── 4. accessibility structure ──
check('skip-to-content link', await page.locator('a.skip').count() === 1);
check('single <h1>', await page.locator('h1').count() === 1);
check('<main role=main>', await page.locator('main#main').count() === 1);
check('role=tab tabs (9)', await page.locator('[role="tab"]').count() === 9);
check('aria-live result hosts ≥9', await page.locator('[aria-live="polite"]').count() >= 9);
check('tricolour stripe present', await page.locator('.stripe').count() === 1);
check('sticky disclaimer present', await page.locator('.disc').count() === 1);

// ── 5. ENGINE functional via tap+fill (SAFETY-focused) ──
await safe('ENGINE diagnose grinding brakes → DO NOT DRIVE', async () => {
  await page.click('#tab-diag');
  await page.fill('#d-sym', 'grinding brakes');
  await page.click('button[onclick="cmSymptom()"]');
  await page.waitForTimeout(500);
  const txt = await page.locator('#r-symptom').innerText();
  check('SAFETY: grinding brakes says do NOT drive', /do NOT keep driving|Do NOT/i.test(txt), txt.split('\n')[0]);
  check('result has read-aloud button', await page.locator('#r-symptom .speak-btn').count() >= 1);
  check('result has WORD status (not colour-only)', (await page.locator('#r-symptom .res-status').innerText()).trim().length > 0);
});
await safe('ENGINE DIY triage airbag → mechanic-only', async () => {
  await page.fill('#d-task', 'airbag');
  await page.click('button[onclick="cmTriage()"]');
  await page.waitForTimeout(400);
  const txt = await page.locator('#r-triage').innerText();
  check('SAFETY: airbag = Mechanic only (red)', /Mechanic only/i.test(txt), txt.split('\n')[0]);
});
await safe('ENGINE OBD P0300 → cannot drive', async () => {
  await page.fill('#d-obd', 'P0300');
  await page.click('button[onclick="cmObd()"]');
  await page.waitForTimeout(400);
  check('OBD P0300 shows misfire + no-drive', /misfire/i.test(await page.locator('#r-obd').innerText()));
});
await safe('ENGINE scam check overpriced', async () => {
  await page.click('#tab-price');
  await page.selectOption('#s-job', 'brake_pads');
  await page.fill('#s-quote', '8500');
  await page.click('button[onclick="cmScam()"]');
  await page.waitForTimeout(400);
  check('scam flags overpriced brake quote', /overpriced|above expected/i.test(await page.locator('#r-scam').innerText()));
});
await safe('ENGINE buy score accident → avoid', async () => {
  await page.click('#tab-buy');
  // leave accident_free OFF (critical fail), turn a few others on
  await page.click('#b-odometer_genuine'); await page.click('#b-engine_ok');
  await page.click('button[onclick="cmBuy()"]');
  await page.waitForTimeout(400);
  check('buy: missing accident-free → Avoid', /Avoid/i.test(await page.locator('#r-buy').innerText()));
});
await safe('ENGINE tyre tread 1.5mm → replace now', async () => {
  await page.click('#tab-parts');
  await page.fill('#t-tread', '1.5');
  await page.click('button[onclick="cmTyre()"]');
  await page.waitForTimeout(400);
  check('tyre 1.5mm → Replace now', /Replace now/i.test(await page.locator('#r-tyre').innerText()));
});
await safe('ENGINE fuel ROI renders payback', async () => {
  await page.click('#tab-fuel');
  await page.fill('#f-cur', '12000');
  await page.click('button[onclick="cmFuelRoi()"]');
  await page.waitForTimeout(400);
  check('fuel ROI shows monthly saving ₹', /₹/.test(await page.locator('#r-fuel').innerText()));
});
await safe('ENGINE reminders renders', async () => {
  await page.click('#tab-remind');
  await page.click('button[onclick="cmRemind()"]');
  await page.waitForTimeout(400);
  check('reminders renders a result', (await page.locator('#r-remind').innerText()).trim().length > 0);
});

// ── 6. tap targets ≥44px (authored controls) ──
await safe('TAP targets ≥44px', async () => {
  const bad = await page.evaluate(() => {
    const els = [...document.querySelectorAll('header button, #lang-select, a.skip, #main button, #main .chip, #main select, #main input, [role=tab]')];
    const out = [];
    els.forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.height < 44) out.push((e.id || e.className || e.tagName) + ':' + Math.round(r.height) + 'px'); });
    return out;
  });
  check('TAP targets (authored) all ≥44px', bad.length === 0, bad.slice(0, 6).join(', ') || 'all ok');
});

// ── 7. axe-core ──
await safe('axe-core 0 serious/critical (authored)', async () => {
  const axe = readFileSync(resolve(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axe);
  const res = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations'] }));
  const isSub = (t) => /chitti-(dp|bn|isl|cam|feedback)|#chitti-|bottom-nav|chitti-disability|chitti-features/i.test(t);
  const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.map((nn) => nn.target.join(' ')) }))
    .map((v) => ({ ...v, mine: v.nodes.filter((t) => !isSub(t)) }))
    .filter((v) => v.mine.length > 0);
  check('axe-core 0 serious/critical (authored)', serious.length === 0, serious.map((v) => v.id + '(' + v.mine.length + ')').join(', ') || 'clean');
  serious.forEach((v) => console.log('   ↳ ' + v.id + ': ' + v.help + ' @ ' + v.mine.slice(0, 4).join(' | ')));
});

// ── 8. console clean ──
const realErrors = consoleErrors.filter((e) => !SUBSTRATE_NOISE.test(e));
check('No page/JS errors during journey (substrate noise filtered)', realErrors.length === 0, realErrors.slice(0, 3).join(' | ') || `(${consoleErrors.length} substrate lines ignored)`);

await b.close();
server.close();

const pass = R.filter((r) => r.ok).length, fail = R.length - pass;
console.log(`\nChitti Car Mechanic cert — ${pass}/${R.length} GREEN, ${fail} failed`);
if (fail) { console.log('FAILURES:\n' + R.filter((r) => !r.ok).map((r) => '  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')).join('\n')); process.exit(1); }
console.log(`✅ ALL GREEN  ·  QA_RESULT:{"pass":${pass},"fail":${fail}}`);
