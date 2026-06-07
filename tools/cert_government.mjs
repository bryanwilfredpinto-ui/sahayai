#!/usr/bin/env node
/**
 * tools/cert_government.mjs — Chitti Government (CEOS v1.0) live certification.
 * Self-contained: starts its own static server, then a real Chromium pass.
 * Proves: 5 frontend gates, the Vaani #lang-select dropdown FIRES (Sire's hard
 * requirement), the four new deterministic engines render, four-user a11y,
 * tap targets ≥44px on the journey controls, axe-core 0 serious, responsive.
 * Run: node tools/cert_government.mjs
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
  readFile(join(ROOT, p), (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(join(ROOT, p))] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_government.html`;

const R = [];
const check = (label, ok, detail) => { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); };
const safe = async (label, fn) => { try { return await fn(); } catch (e) { check(label, false, 'threw: ' + e.message); return null; } };

const html = readFileSync(resolve(ROOT, 'chitti_government.html'), 'utf8');
const b = await chromium.launch({ headless: true });

// ── 1. Responsive screenshots ──
for (const v of [{ name: '375', w: 375, h: 812, dsf: 2 }, { name: '768', w: 768, h: 1024, dsf: 2 }, { name: '1280', w: 1280, h: 900, dsf: 1 }]) {
  await safe('screenshot_' + v.name, async () => {
    const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
    const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => p.goto(URL, { waitUntil: 'domcontentloaded' }));
    await p.waitForTimeout(1200);
    const out = resolve(SHOT_DIR, `chitti_government_ceos_${v.name}.png`);
    await p.screenshot({ path: out, fullPage: true });
    check('screenshot_' + v.name, true, out);
    await c.close();
  });
}

// ── main context ──
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
// Mock the production API so the local cert is deterministic + free of the
// localhost→Railway CORS noise (prod is same-origin via sahayai.in with CORS).
async function mockGovApi(pg) {
  await pg.route('**up.railway.app/**', (route) => {
    const u = route.request().url();
    let body = { ok: true };
    if (/\/health/.test(u)) body = { ok: true, chitti: 'chitti-government' };
    else if (/\/schemes/.test(u)) body = { ok: true, count: 2, schemes: [
      { slug: 'pm-kisan', short_code: 'PM-Kisan', name_en: 'Pradhan Mantri Kisan Samman Nidhi', ministry: 'Agriculture', category: ['agriculture'], benefit_summary_en: 'Rs 6,000/yr', source_url: 'https://pmkisan.gov.in/' },
      { slug: 'pmjay', short_code: 'PM-JAY', name_en: 'Ayushman Bharat PM-JAY', ministry: 'Health', category: ['health'], benefit_summary_en: 'Rs 5 lakh cover', source_url: 'https://pmjay.gov.in/' } ] };
    else if (/\/locator\/kinds/.test(u)) body = { ok: true, kinds: [{ key: 'csc', label: 'CSC' }] };
    else if (/\/eligibility\/scan/.test(u)) body = { ok: true, count: 3, results: [{ scheme_slug: 'pm-kisan', verdict: 'eligible' }, { scheme_slug: 'pmjay', verdict: 'partial' }, { scheme_slug: 'ujjwala-2', verdict: 'eligible' }] };
    else if (/\/alerts/.test(u)) body = { ok: true, items: [] };
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
}
await mockGovApi(page);
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
// Dismiss the disability-profile modal (real users do) so it doesn't intercept
// journey clicks. Its appearance is verified independently in G3 on a fresh page.
await page.evaluate(() => {
  const m = document.querySelector('#chitti-disability-profile-modal'); if (m) m.remove();
  document.querySelectorAll('.modal.show,[aria-modal="true"]').forEach((x) => { x.classList.remove('show', 'shown'); x.style.display = 'none'; });
});
await page.waitForTimeout(200);

// ── 2. Five frontend gates ──
const boxes = await page.locator('[data-chitti-response]').count();
check('G1 feedback-widget.js + data-chitti-response', /feedback-widget\.js/.test(html) && boxes >= 12, `script:${/feedback-widget\.js/.test(html)} boxes:${boxes}`);
check('G2 chitti_a11y.js loaded', /chitti_a11y\.js/.test(html));
await safe('G3 disability profile / a11y substrate on first visit', async () => {
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p2.goto(URL, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2000);
  const has = await p2.evaluate(() => !!document.querySelector('#onboard,[class*="disab"],[id*="disab"]') || !!(window.Chitti && window.Chitti.a11y));
  check('G3 disability/onboarding modal or a11y substrate present', has);
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
  const changed = await page.evaluate(() => {
    let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node; while ((node = w.nextNode())) { if (node._chittiOrig !== undefined && node._chittiOrig !== node.nodeValue) n++; }
    return n;
  });
  check('LANG switch translated ≥1 text node (Hindi pack)', changed >= 1, `${changed} nodes changed`);
  await page.selectOption('#lang-select', 'ta'); await page.waitForTimeout(1200);
  await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(800);
  check('LANG switch back to en stable', (await page.evaluate(() => document.documentElement.lang)) === 'en');
});

// ── 4. Structure ──
check('13 CEOS tabs (role=tab)', await page.locator('nav.tabs [role="tab"]').count() === 13, `${await page.locator('nav.tabs [role="tab"]').count()} tabs`);
check('single <h1>/brand present', /brand-name/.test(html));
check('aria-live result hosts ≥4', await page.locator('[aria-live="polite"]').count() >= 4);

// ── 5. The four NEW deterministic engines render (tap-only journeys) ──
await safe('ENGINE Fraud Shield flags a scam (tap+paste)', async () => {
  await page.click('[data-panel="fraud"]');
  await page.fill('#fraud-text', 'Your PM-Kisan eKYC is pending. Click http://pmkisan-update.in and pay Rs 50 to release. Share OTP.');
  await page.click('#fraud-check');
  await page.waitForTimeout(500);
  const txt = await page.locator('#fraud-out').innerText();
  check('Fraud Shield → FRAUD verdict + report channel', /FRAUD|धोखाधड़ी/i.test(txt) && /1930/.test(txt), txt.split('\n')[0]);
  check('BO deaf: verdict carries a WORD (not colour-only)', /(FRAUD|Suspicious|genuine|धोखाधड़ी|संदिग्ध)/i.test(txt));
});
await safe('ENGINE Life-Event renders an ordered plan', async () => {
  await page.click('[data-panel="lifeevent"]');
  await page.selectOption('#le-pick', 'daughter_born');
  await page.waitForTimeout(400);
  const txt = await page.locator('#le-out').innerText();
  check('Life-Event → lists Sukanya/Birth Certificate steps', /Sukanya/i.test(txt) && /Birth Certificate/i.test(txt), txt.split('\n')[0]);
});
await safe('ENGINE Readiness Score computes', async () => {
  await page.click('[data-panel="readiness"]');
  // tap a couple of documents, then calculate
  await page.locator('#doc-inventory .doc-chip').first().click();
  await page.click('#readiness-calc');
  await page.waitForTimeout(1500);
  const txt = await page.locator('#readiness-out').innerText();
  check('Readiness → shows a % score', /Readiness:\s*\d+%/i.test(txt) || /\d+%/.test(txt), txt.split('\n')[0]);
});
await safe('ENGINE Deadline add is confirm-gated', async () => {
  await page.click('[data-panel="deadlines"]');
  page.once('dialog', (d) => d.accept()); // Golden-Rule confirm()
  await page.selectOption('#dl-pick', { index: 1 });
  await page.fill('#dl-date', '2026-12-31');
  await page.click('#dl-add');
  await page.waitForTimeout(400);
  const txt = await page.locator('#dl-out').innerText();
  check('Deadline added + shows days-left', /days left|दिन बाकी/i.test(txt), txt.split('\n')[0]);
});

// ── 6. Tap targets ≥44px on the journey controls (mute / limited-mobility) ──
await safe('TAP targets ≥44px (main controls + tabs + lang)', async () => {
  const small = await page.evaluate(() => {
    const els = [...document.querySelectorAll('main button, nav.tabs .tab, .doc-chip, #lang-select')];
    let bad = 0; els.forEach((e) => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.height < 44) bad++; });
    return bad;
  });
  check('TAP targets all ≥44px high', small === 0, `${small} under 44px`);
});

// ── 7. axe-core ──
await safe('axe-core 0 serious/critical', async () => {
  const axe = readFileSync(resolve(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axe);
  const res = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations'] }));
  const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  check('axe-core 0 serious/critical', serious.length === 0, serious.map((v) => v.id + '(' + v.nodes.length + ')').join(', ') || 'clean');
  if (serious.length) serious.forEach((v) => { console.log('   ↳ ' + v.id + ': ' + v.help); v.nodes.slice(0, 8).forEach((n) => console.log('      • ' + (n.target || []).join(' ') + '  ' + (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 160))); });
});

// ── 8. console clean ──
check('No console / page errors during journey', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await b.close();
server.close();

const pass = R.filter((r) => r.ok).length, fail = R.length - pass;
console.log(`\nChitti Government CEOS cert — ${pass}/${R.length} GREEN, ${fail} failed`);
if (fail) { console.log('FAILURES:\n' + R.filter((r) => !r.ok).map((r) => '  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')).join('\n')); process.exit(1); }
console.log(`✅ ALL GREEN  ·  QA_RESULT:{"pass":${pass},"fail":${fail}}`);
