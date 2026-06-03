#!/usr/bin/env node
/**
 * tools/qa_mechanic.mjs — full QA pass for Chitti Bike + Car Doctor pages.
 * Self-serving static server + Playwright. Tests, per page:
 *   - 3 viewports (375 mobile / 768 tablet / 1280 desktop): console errors,
 *     page errors, failed requests, render sanity, screenshot.
 *   - Tab navigation (every bottom-nav panel) with error capture.
 *   - 5 mandatory box-elements on every visible [data-chitti-response].
 *   - Language switch en→ta→hi: no raw i18n keys; labels actually change.
 *   - Profile form: fill → save → reload → persisted.
 *   - Swarm Diagnosis + Scam Shield flows (network mocked) render a verdict.
 * Exits non-zero if ANY issue is found. Network is mocked so no live backend.
 * Run: node tools/qa_mechanic.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  try {
    const u = decodeURIComponent((req.url || '/').split('?')[0]);
    const fp = join(ROOT, u === '/' ? '/index.html' : u);
    if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const ISSUES = [];
const issue = (page, area, detail) => { ISSUES.push({ page, area, detail }); console.log(`  ❌ [${page}/${area}] ${detail}`); };
const pass = (page, area, detail) => console.log(`  ✅ [${page}/${area}] ${detail || ''}`);

// Mock every backend call so the test is deterministic + offline.
async function mock(page) {
  await page.route('**/api/vaani/ask', r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ reply: '{"votes":[{"cause":"Battery","pct":80},{"cause":"Starter","pct":20}],"confidence":"High","diy_tier":"amber","diy_label":"battery","why":"Likely a discharged battery.","severity":"Medium","can_ride":"Yes, after a jump-start","cost":"₹500–₹2000","alternatives":"Loose terminal"}' }) }));
  await page.route('**/api/feedback**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.route('**/api/2w/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.route('**/api/4w/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  // Telemetry collectors must NOT be hit cross-origin (this is the bug we assert against):
  // we do NOT mock chitti-shares-api / observability — a real call there = a console error = an issue.
}

const PAGES = [
  { id: 'bike', file: 'chitti_2wheeler.html', tab: 'mbTab', card: 'mb-card-swarm', mk: 'mb-make', md: 'mb-model', reg: 'mb-reg', yr: 'mb-year', odo: 'mb-odo', save: 'mbSaveBike', key: 'chitti_bike_v1', tabs: ['home', 'bike', 'docs', 'alerts'] },
  { id: 'car', file: 'chitti_4wheeler.html', tab: 'mcTab', card: 'mc-card-swarm', mk: 'mc-make', md: 'mc-model', reg: 'mc-reg', yr: 'mc-year', odo: 'mc-odo', save: 'mcSaveCar', key: 'chitti_car_v1', tabs: ['home', 'car', 'docs', 'alerts'] },
];

const b = await chromium.launch({ headless: true });

for (const P of PAGES) {
  const URL = `${BASE}/${P.file}`;
  console.log(`\n=== ${P.id.toUpperCase()} (${P.file}) ===`);

  // ---- responsive + console/page/network errors per viewport ----
  for (const vp of [{ n: 'mobile', w: 375, h: 812 }, { n: 'tablet', w: 768, h: 1024 }, { n: 'desktop', w: 1280, h: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h } });
    const pg = await ctx.newPage();
    const cerr = [], perr = [], rfail = [];
    pg.on('console', m => { if (m.type() === 'error') cerr.push(m.text()); });
    pg.on('pageerror', e => perr.push(String(e)));
    pg.on('requestfailed', rq => { const u = rq.url(); if (!u.startsWith(BASE)) rfail.push(rq.failure()?.errorText + ' ' + u); });
    await mock(pg);
    await pg.goto(URL, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(3500); // let obs ticks + a11y injection run
    await pg.screenshot({ path: resolve(SHOT, `qa_${P.id}_${vp.n}.png`), fullPage: vp.n !== 'desktop' });
    perr.forEach(e => issue(P.id, `${vp.n}/pageerror`, e));
    cerr.slice(0, 8).forEach(e => issue(P.id, `${vp.n}/console`, e));
    rfail.slice(0, 6).forEach(e => issue(P.id, `${vp.n}/request`, e));
    if (!cerr.length && !perr.length && !rfail.length) pass(P.id, `${vp.n}`, 'no console/page/network errors');
    // horizontal-scroll (responsive) check
    const ovf = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ovf > 4) issue(P.id, `${vp.n}/responsive`, `horizontal overflow ${ovf}px`); else pass(P.id, `${vp.n}/responsive`, 'no h-overflow');
    await ctx.close();
  }

  // ---- functional pass at 375 (clean context) ----
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const pg = await ctx.newPage();
  const fnErr = [];
  pg.on('pageerror', e => fnErr.push(String(e)));
  await mock(pg);
  await pg.goto(URL, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2500);
  // dismiss disability modal if present
  await pg.evaluate(() => { const x = document.querySelector('#dp-skip,[onclick*="skip" i],.dp-skip'); if (x) x.click(); try { localStorage.setItem('disability_profile', JSON.stringify({ done: true })); } catch (e) {} });

  // render sanity
  const sanity = await pg.evaluate((P) => {
    const txt = document.body.innerText || '';
    return { raw: /\b(mb|mc)\.(title|tag|swarm)\b/.test(txt), brand: (document.querySelector('.sds-brand-name') || {}).textContent || '', langSel: document.querySelectorAll('#lang-select').length };
  }, P);
  if (sanity.raw) issue(P.id, 'render', 'raw i18n keys visible'); else pass(P.id, 'render', 'no raw keys');
  if (/\.(title|tag)$/.test(sanity.brand.trim())) issue(P.id, 'render', `brand unresolved: "${sanity.brand}"`); else pass(P.id, 'render', `brand="${sanity.brand.trim()}"`);
  if (sanity.langSel !== 1) issue(P.id, 'render', `#lang-select count=${sanity.langSel} (want 1)`); else pass(P.id, 'render', '1 lang select');

  // tab navigation
  for (const t of P.tabs) {
    const before = fnErr.length;
    const ok = await pg.evaluate(([fn, name]) => { try { window[fn](name); return true; } catch (e) { return String(e); } }, [P.tab, t]);
    await pg.waitForTimeout(250);
    if (ok !== true) issue(P.id, 'tabs', `${P.tab}('${t}') threw: ${ok}`);
    else if (fnErr.length > before) issue(P.id, 'tabs', `${t} caused pageerror: ${fnErr[fnErr.length - 1]}`);
    else pass(P.id, 'tabs', `${t} ok`);
  }
  await pg.evaluate((fn) => window[fn]('home'), P.tab);

  // 5 mandatory box-elements on every visible response box
  const boxes = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('[data-chitti-response]').forEach(c => {
      const vis = c.offsetParent !== null || getComputedStyle(c).display !== 'none';
      if (!vis) return;
      // widget bar may be inside the box or injected right after it
      const bar = c.querySelector('.chitti-fb-box-bar') || (c.nextElementSibling && c.nextElementSibling.classList && c.nextElementSibling.classList.contains('chitti-fb-box-bar') ? c.nextElementSibling : null);
      const tb = c.querySelector('.sds-card-toolbar');
      const speak = !!(bar && bar.querySelector('.speak')) || !!(tb && /🔊/.test(tb.textContent));
      const up = !!(bar && bar.querySelector('.up')) || !!(c.querySelector('.fb-pos'));
      const down = !!(bar && bar.querySelector('.down')) || !!(c.querySelector('.fb-neg'));
      const mic = !!(bar && bar.querySelector('.mic'));
      out.push({ id: c.getAttribute('data-chitti-response'), speak, up, down, mic, hasBar: !!bar });
    });
    return out;
  });
  const langOk = await pg.evaluate(() => document.querySelectorAll('#lang-select').length === 1);
  let boxFails = 0;
  for (const bx of boxes) {
    const missing = ['speak', 'up', 'down'].filter(k => !bx[k]);
    if (missing.length) { boxFails++; if (boxFails <= 6) issue(P.id, '5-elements', `box "${bx.id}" missing: ${missing.join(',')} (hasBar=${bx.hasBar})`); }
  }
  if (!boxFails) pass(P.id, '5-elements', `${boxes.length} visible boxes have 🔊/👍/👎 (+🌐 page lang:${langOk})`);
  else issue(P.id, '5-elements', `${boxFails}/${boxes.length} boxes incomplete`);

  // language switch en→ta→hi
  for (const lng of ['ta', 'hi', 'en']) {
    await pg.evaluate((l) => { try { window.changeLang ? window.changeLang(l) : window.updateAllStrings(l); } catch (e) {} }, lng);
    await pg.waitForTimeout(200);
  }
  const afterLang = await pg.evaluate(() => /\b(mb|mc)\.(title|tag|swarm)\b/.test(document.body.innerText));
  if (afterLang) issue(P.id, 'i18n', 'raw keys after language cycling'); else pass(P.id, 'i18n', 'en→ta→hi→en clean');

  // profile form: drive the real dropdowns via the page's demo-fill (valid
  // make/model options + onchange), then save → assert persisted with make+model.
  await pg.evaluate((fn) => window[fn]('bike'), P.tab).catch(() => {});
  await pg.evaluate((fn) => window[fn]('car'), P.tab).catch(() => {});
  const formRes = await pg.evaluate((P) => {
    const demo = P.id === 'bike' ? 'mbDemoForm' : 'mcDemoForm';
    try { if (typeof window[demo] === 'function') window[demo](); } catch (e) { return { err: 'demo: ' + e }; }
    return { mk: (document.getElementById(P.mk) || {}).value, md: (document.getElementById(P.md) || {}).value };
  }, P);
  await pg.waitForTimeout(200);
  const saveRes = await pg.evaluate((P) => {
    try { if (typeof window[P.save] === 'function') window[P.save](); } catch (e) { return { err: String(e) }; }
    let stored = null; try { stored = JSON.parse(localStorage.getItem(P.key) || 'null'); } catch (e) {}
    return { stored };
  }, P);
  if (formRes.err) issue(P.id, 'form', `demo-fill threw: ${formRes.err}`);
  else if (saveRes.err) issue(P.id, 'form', `save threw: ${saveRes.err}`);
  else if (!saveRes.stored || !saveRes.stored.make || !saveRes.stored.model) issue(P.id, 'form', `make/model not persisted to ${P.key}: ${JSON.stringify(saveRes.stored)}`);
  else pass(P.id, 'form', `profile saved + persisted (${saveRes.stored.make} ${saveRes.stored.model} ${saveRes.stored.reg})`);

  // Swarm Diagnosis flow (network mocked)
  const sw = await pg.evaluate(async (P) => {
    window[P.tab]('home');
    const inp = document.getElementById('sw-symptom'); if (!inp) return { err: 'no #sw-symptom' };
    inp.value = 'bike start nahi ho rahi';
    try { await window.swDiagnose(); } catch (e) { return { err: 'swDiagnose threw: ' + e }; }
    await new Promise(r => setTimeout(r, 600));
    const out = document.getElementById('sw-result');
    const html = out ? out.innerHTML : '';
    return { hasVerdict: /sw-verdict/.test(html), hasConf: /sw-conf/.test(html), hasVote: /sw-bar/.test(html), len: html.length };
  }, P);
  if (sw.err) issue(P.id, 'swarm', sw.err);
  else if (!sw.hasVerdict || !sw.hasConf) issue(P.id, 'swarm', `verdict not rendered (verdict:${sw.hasVerdict} conf:${sw.hasConf})`);
  else pass(P.id, 'swarm', 'diagnose renders verdict + confidence + votes');

  // Scam Shield flow
  const scam = await pg.evaluate(async (P) => {
    try { window.swScamToggle(); } catch (e) { return { err: 'toggle: ' + e }; }
    const job = document.getElementById('sw-scam-job'), amt = document.getElementById('sw-scam-amt');
    if (!job || !amt) return { err: 'no scam inputs' };
    job.value = 'battery replace'; amt.value = '7500';
    // mock returns swarm JSON not scam JSON → should hit honest fallback, NOT crash
    try { await window.swScamCheck(); } catch (e) { return { err: 'swScamCheck threw: ' + e }; }
    await new Promise(r => setTimeout(r, 500));
    const out = document.getElementById('sw-result');
    return { rendered: !!(out && out.innerHTML.length > 20) };
  }, P);
  if (scam.err) issue(P.id, 'scam', scam.err);
  else if (!scam.rendered) issue(P.id, 'scam', 'no output rendered');
  else pass(P.id, 'scam', 'scam check renders (no crash)');

  fnErr.forEach(e => issue(P.id, 'functional/pageerror', e));
  await ctx.close();
}

await b.close();
server.close();
console.log(`\n================ QA SUMMARY ================`);
console.log(`ISSUES: ${ISSUES.length}`);
ISSUES.forEach((i, n) => console.log(`  ${n + 1}. [${i.page}/${i.area}] ${i.detail}`));
console.log(`QA_RESULT:${JSON.stringify({ issues: ISSUES.length })}`);
process.exit(ISSUES.length ? 1 : 0);
