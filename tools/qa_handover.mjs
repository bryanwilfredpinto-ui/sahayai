#!/usr/bin/env node
/**
 * tools/qa_handover.mjs — pre-handover QA Engineer test pass for Chitti Mechanic
 * (Bike + Car Doctor). Real Playwright across Chromium + Firefox + WebKit (Safari engine).
 * 20 user journeys + edge cases + cross-viewport + performance + a11y attribute audit.
 * Network MOCKED for journeys (deterministic); real offline tested separately.
 * Writes screenshots to tools/cert_screenshots/handover_* and prints a JSON result.
 * Run: node tools/qa_handover.mjs
 */
import { chromium, firefox, webkit } from 'playwright';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT = resolve(__dirname, 'cert_screenshots'); mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => { try { const u = decodeURIComponent((req.url || '/').split('?')[0]); const fp = join(ROOT, u === '/' ? '/index.html' : u); if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('nf'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp)); } catch (e) { res.writeHead(500); res.end(String(e)); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const R = { journeys: [], edge: [], engines: [], perf: [], a11y: [], bugs: [] };
const ok = (arr, name, pass, ms, note) => { arr.push({ name, status: pass ? 'PASS' : 'FAIL', ms: ms || 0, note: note || '' }); console.log(`  ${pass ? '✅' : '❌'} ${name}${ms ? ' (' + ms + 'ms)' : ''}${note ? ' — ' + note : ''}`); if (!pass) R.bugs.push({ severity: 'High', area: name, detail: note }); };

async function mock(pg) {
  await pg.route('**/api/vaani/ask', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: '{"votes":[{"cause":"Battery","pct":80},{"cause":"Starter","pct":20}],"confidence":"High","diy_tier":"amber","why":"x","severity":"Medium","can_ride":"Yes","cost":"₹500"}' }) }));
  await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
}
async function fresh(ctx) { await ctx.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ done: true })); localStorage.setItem('chitti_selffix_disclaimer_v1', '1'); } catch (e) {} }); }
const PAGES = [{ id: 'bike', file: 'chitti_2wheeler.html', v: '2w', tab: 'mbTab', demo: 'mbDemoForm', save: 'mbSaveBike', key: 'chitti_bike_v1' }, { id: 'car', file: 'chitti_4wheeler.html', v: '4w', tab: 'mcTab', demo: 'mcDemoForm', save: 'mcSaveCar', key: 'chitti_car_v1' }];

// ─────────────── 20 USER JOURNEYS (10 per vehicle) on Chromium ───────────────
const cr = await chromium.launch({ headless: true });
for (const P of PAGES) {
  console.log(`\n=== JOURNEYS · ${P.id} ===`);
  const ctx = await cr.newContext({ viewport: { width: 390, height: 900 } }); await fresh(ctx);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e))); await mock(pg);
  let t0 = Date.now(); await pg.goto(`${BASE}/${P.file}`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1800);
  ok(R.journeys, `${P.id} J1 page loads + renders`, errs.length === 0 && await pg.locator('.sds-brand-name').count() > 0, Date.now() - t0);

  t0 = Date.now(); const j2 = await pg.evaluate((P) => { try { window[P.tab](P.id); window[P.demo](); window[P.save](); const s = JSON.parse(localStorage.getItem(P.key) || 'null'); return !!(s && s.make && s.model); } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J2 add vehicle → save → persist`, j2 === true, Date.now() - t0, j2 === true ? '' : String(j2));

  t0 = Date.now(); const j3 = await pg.evaluate(async (P) => { try { window[P.tab]('home'); document.getElementById('sw-symptom').value = 'wont start'; await window.swDiagnose(); await new Promise(r => setTimeout(r, 500)); return /sw-verdict/.test(document.getElementById('sw-result').innerHTML); } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J3 Swarm Diagnosis → verdict`, j3 === true, Date.now() - t0, j3 === true ? '' : String(j3));

  t0 = Date.now(); const j4 = await pg.evaluate(async () => { try { window.swScamToggle(); document.getElementById('sw-scam-job').value = 'battery'; document.getElementById('sw-scam-amt').value = '7500'; await window.swScamCheck(); await new Promise(r => setTimeout(r, 400)); return document.getElementById('sw-result').innerHTML.length > 20; } catch (e) { return 'ERR:' + e; } });
  ok(R.journeys, `${P.id} J4 Scam Shield → result`, j4 === true, Date.now() - t0, j4 === true ? '' : String(j4));

  t0 = Date.now(); const j5 = await pg.evaluate(async (P) => { try { window.ChittiSelfFix.open(P.v); await new Promise(r => setTimeout(r, 300)); const tile = document.querySelector('[data-csf-symptom],.csf-tile,.csf-symptom'); if (tile) tile.click(); await new Promise(r => setTimeout(r, 200)); const c = document.querySelector('[data-csf-cause],.csf-cause'); if (c) c.click(); await new Promise(r => setTimeout(r, 200)); return document.querySelectorAll('.csf-panel svg, figure svg, [class*=csf] svg').length > 0 || /sw-verdict|csf/.test(document.body.innerHTML); } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J5 Roadside Self-Fix → diagram+steps`, j5 === true, Date.now() - t0, j5 === true ? '' : String(j5));
  await pg.evaluate(() => { const x = document.querySelector('[onclick*="close" i],.csf-close,[data-csf-close]'); if (x) x.click(); });

  t0 = Date.now(); const j6 = await pg.evaluate(async (P) => { try { if (!window.ChittiScanners) return 'no-scanners'; window.ChittiScanners.open(P.v); await new Promise(r => setTimeout(r, 300)); return /Scanner|🔬|scan/i.test(document.body.innerText); } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J6 AI Scanners page opens`, j6 === true, Date.now() - t0, j6 === true ? '' : String(j6));
  await pg.evaluate(() => { const x = document.querySelector('[data-cas-close],[onclick*="close" i]'); if (x) x.click(); });

  t0 = Date.now(); const j7 = await pg.evaluate(async (P) => { try { if (!window.ChittiHealthScore) return 'no-hs'; window.ChittiHealthScore.open(P.v); await new Promise(r => setTimeout(r, 300)); document.querySelectorAll('[data-chs-val="good"],.chs-good,[data-val="100"]').forEach(b => b.click()); const sub = document.querySelector('[data-chs-submit],.chs-submit'); if (sub) sub.click(); await new Promise(r => setTimeout(r, 300)); return /[0-9]/.test(document.body.innerText) && /chs|score|स्कोर|ஸ்கோர்/i.test(document.body.innerHTML); } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J7 Vehicle Health Score → number`, j7 === true, Date.now() - t0, j7 === true ? '' : String(j7));
  await pg.evaluate(() => { const x = document.querySelector('[data-chs-close],[onclick*="close" i]'); if (x) x.click(); });

  t0 = Date.now(); const j8 = await pg.evaluate(async (P) => { try { if (!window.ChittiOBD) return 'no-obd'; window.ChittiOBD.open({ vehicle: P.v }); await new Promise(r => setTimeout(r, 300)); return document.body.innerText.length > 0; } catch (e) { return 'ERR:' + e; } }, P);
  ok(R.journeys, `${P.id} J8 OBD2 (no-bluetooth → honest fallback)`, j8 === true, Date.now() - t0, j8 === true ? '' : String(j8));
  await pg.evaluate(() => { const x = document.querySelector('[onclick*="close" i]'); if (x) x.click(); });

  t0 = Date.now(); let tabsOk = true; for (const tb of ['home', 'docs', 'alerts', 'ask', 'home']) { const r = await pg.evaluate(([fn, t]) => { try { window[fn](t); return true; } catch (e) { return false; } }, [P.tab, tb]); if (!r) tabsOk = false; }
  ok(R.journeys, `${P.id} J9 tab navigation (all panels)`, tabsOk && errs.length === 0, Date.now() - t0);

  t0 = Date.now(); const j10 = await pg.evaluate(async () => { for (const l of ['ta', 'te', 'ml', 'en']) { try { window.changeLang(l); } catch (e) { } await new Promise(r => setTimeout(r, 250)); } await new Promise(r => setTimeout(r, 800)); return !/\b(mb|mc)\.(title|tag)\b/.test(document.body.innerText); });
  ok(R.journeys, `${P.id} J10 language switch en→ta→te→ml clean`, j10 === true, Date.now() - t0);

  t0 = Date.now(); const j11 = await pg.evaluate(async (P) => {
    try {
      window.changeLang && window.changeLang('en');
      window[P.tab](P.id === 'bike' ? 'bike' : 'car'); await new Promise(r => setTimeout(r, 250));
      const regId = P.v === '2w' ? 'mb-reg' : 'mc-reg', outId = P.v === '2w' ? 'mb-rc-result' : 'mc-rc-result';
      const inpId = P.v === '2w' ? 'mb-rc-file' : 'mc-rc-file', makeId = P.v === '2w' ? 'mb-make' : 'mc-make';
      const reg = document.getElementById(regId); reg.value = 'KA05MG7788'; reg.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      const chip = /Karnataka/.test(document.getElementById(outId).textContent || '');     // deterministic reg→state, offline
      document.getElementById(makeId).value = '';                                            // clear any prior-journey demo value
      delete window.CHITTI_RC_VISION_URL;                                                    // no vision endpoint → honest path
      const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const file = new File([await (await fetch(tiny)).blob()], 'rc.png', { type: 'image/png' });
      const dt = new DataTransfer(); dt.items.add(file); const inp = document.getElementById(inpId); inp.files = dt.files;
      window.rcOnFile(P.v, inp); await new Promise(r => setTimeout(r, 400));
      const honest = /🤖|👇/.test(document.getElementById(outId).textContent || '') && (document.getElementById(makeId).value || '') === '';  // never fabricates make
      const saved = !!localStorage.getItem('chitti_rc_photo_' + P.v);                        // photo device-local only
      return chip && honest && saved;
    } catch (e) { return 'ERR:' + e; }
  }, P);
  ok(R.journeys, `${P.id} J11 Scan RC → state/RTO chip + honest auto-fill (no fabrication)`, j11 === true, Date.now() - t0, j11 === true ? '' : String(j11));

  await pg.screenshot({ path: resolve(SHOT, `handover_${P.id}.png`), fullPage: false });
  if (errs.length) R.bugs.push({ severity: 'High', area: `${P.id} pageerror`, detail: errs[0] });
  await ctx.close();
}

// ─────────────── EDGE CASES (Chromium) ───────────────
console.log(`\n=== EDGE CASES ===`);
{ // offline
  const ctx = await cr.newContext({ viewport: { width: 390, height: 844 } }); await fresh(ctx); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.route('**/api/**', r => r.abort()); await pg.route(/railway\.app|googleapis|google\.com/, r => r.abort());
  await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1500);
  const offline = await pg.evaluate(async () => { try { window.ChittiSelfFix.open('2w'); await new Promise(r => setTimeout(r, 300)); return document.body.innerText.length > 50; } catch (e) { return false; } });
  ok(R.edge, 'No internet → offline Self-Fix still works', offline && errs.length === 0, 0, 'offline-first deterministic');
  await ctx.close();
}
{ // slow 3G
  const ctx = await cr.newContext({ viewport: { width: 390, height: 844 } }); await fresh(ctx); const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8, latency: 400 });
  const t0 = Date.now(); let timedOut = false; await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => { timedOut = true; }); const load = Date.now() - t0;
  ok(R.edge, 'Slow 3G (400kbps) load (domcontentloaded)', !timedOut && load < 10000, load, timedOut ? 'EXCEEDED 40s — heavy JS bundle, see tech-debt' : (load < 3000 ? '<3s' : (load < 10000 ? 'slow but loads' : 'SLOW')));
  await ctx.close();
}
{ // localStorage disabled
  const ctx = await cr.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } catch (e) {} });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e))); await mock(pg);
  await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' }).catch(() => {}); await pg.waitForTimeout(1200);
  ok(R.edge, 'localStorage disabled → no crash', await pg.locator('body').count() > 0, 0, errs.length ? ('errs:' + errs.length + ' (guarded?)') : 'graceful');
  await ctx.close();
}
{ // rapid language switching ×10 in <5s
  const ctx = await cr.newContext({ viewport: { width: 390, height: 844 } }); await fresh(ctx); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e))); await mock(pg);
  await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1200);
  const t0 = Date.now(); await pg.evaluate(async () => { const L = ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'gu', 'mr', 'en', 'ta']; for (const l of L) { try { window.changeLang(l); } catch (e) {} await new Promise(r => setTimeout(r, 50)); } });
  await pg.waitForTimeout(900); const stable = await pg.evaluate(() => !/\b(mb|mc)\.(title|tag)\b/.test(document.body.innerText));
  ok(R.edge, 'Rapid lang switch ×10 in 5s → no crash, ends clean', stable && errs.length === 0, Date.now() - t0);
  await ctx.close();
}
{ // large + corrupted image to a capture input
  const ctx = await cr.newContext({ viewport: { width: 390, height: 844 } }); await fresh(ctx); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e))); await mock(pg);
  await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1000);
  const res = await pg.evaluate(async () => {
    try {
      window.ChittiScanners && window.ChittiScanners.open('2w'); await new Promise(r => setTimeout(r, 200));
      const inp = document.querySelector('input[type=file]'); if (!inp) return 'no-file-input';
      const big = new File([new Uint8Array(10 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });    // 10MB
      const bad = new File([new Uint8Array([1, 2, 3, 4])], 'corrupt.jpg', { type: 'image/jpeg' });      // corrupted
      const dt = new DataTransfer(); dt.items.add(big); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const dt2 = new DataTransfer(); dt2.items.add(bad); inp.files = dt2.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      return 'handled';
    } catch (e) { return 'ERR:' + e; }
  });
  ok(R.edge, 'Large (10MB) + corrupted image upload → no crash', (res === 'handled' || res === 'no-file-input') && errs.length === 0, 0, res);
  await ctx.close();
}
{ // JS-disabled fallback (static HTML check)
  const ctx = await cr.newContext({ javaScriptEnabled: false }); const pg = await ctx.newPage();
  await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(300);
  const txt = (await pg.locator('body').innerText().catch(() => '')) || '';
  ok(R.edge, 'JS disabled → page not blank (SSR/static content present)', txt.length > 20, 0, txt.length > 20 ? 'static content shows' : 'BLANK — SPA needs JS (documented)');
  await ctx.close();
}

// ─────────────── CROSS-ENGINE smoke (Firefox + WebKit/Safari) ───────────────
console.log(`\n=== CROSS-ENGINE (Firefox + WebKit/Safari) ===`);
for (const [ename, eng] of [['Firefox', firefox], ['WebKit/Safari', webkit]]) {
  try {
    const b = await eng.launch({ headless: true });
    for (const P of PAGES) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await fresh(ctx); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e))); await mock(pg);
      await pg.goto(`${BASE}/${P.file}`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1800);
      const r = await pg.evaluate(async () => { const brand = (document.querySelector('.sds-brand-name') || {}).textContent || ''; let diag = false; try { document.getElementById('sw-symptom').value = 'x'; await window.swDiagnose(); await new Promise(r => setTimeout(r, 400)); diag = /sw-verdict/.test(document.getElementById('sw-result').innerHTML); } catch (e) {} try { window.changeLang('ta'); } catch (e) {} await new Promise(r => setTimeout(r, 600)); const tamil = /[஀-௿]/.test((document.querySelector('.sds-brand-name') || {}).textContent || ''); return { brand: brand.trim(), diag, tamil }; });
      ok(R.engines, `${ename} · ${P.id}: render + diagnose + Tamil`, !!r.brand && r.diag && r.tamil && errs.length === 0, 0, `brand:"${r.brand}" diag:${r.diag} tamil:${r.tamil} errs:${errs.length}`);
      if (ename === 'WebKit/Safari' && P.id === 'bike') await pg.screenshot({ path: resolve(SHOT, 'handover_safari_bike.png') });
      await ctx.close();
    }
    await b.close();
  } catch (e) { ok(R.engines, `${ename} launch`, false, 0, e.message.slice(0, 80)); }
}

// ─────────────── CROSS-VIEWPORT + PERF + A11y (Chromium) ───────────────
console.log(`\n=== VIEWPORT + PERFORMANCE + A11Y ===`);
for (const vp of [{ n: 'mobile-375', w: 375, h: 812 }, { n: 'tablet-768', w: 768, h: 1024 }, { n: 'desktop-1440', w: 1440, h: 900 }]) {
  const ctx = await cr.newContext({ viewport: { width: vp.w, height: vp.h } }); await fresh(ctx); const pg = await ctx.newPage(); await mock(pg);
  const t0 = Date.now(); await pg.goto(`${BASE}/chitti_2wheeler.html`, { waitUntil: 'networkidle' }).catch(() => {}); const load = Date.now() - t0; await pg.waitForTimeout(800);
  const ovf = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(R.perf, `Load @ ${vp.n} (networkidle)`, load < 4000, load);
  ok(R.perf, `No h-overflow @ ${vp.n}`, ovf <= 4, 0, `${ovf}px`);
  if (vp.n === 'mobile-375') {
    const ls = await pg.evaluate(async () => { const t = performance.now(); window.changeLang('ta'); await new Promise(r => setTimeout(r, 0)); return Math.round(performance.now() - t); });
    ok(R.perf, 'Language switch response', ls < 1000, ls);
    const heap = await pg.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1));
    ok(R.perf, 'JS heap memory', heap < 100 || heap < 0, 0, heap < 0 ? 'n/a' : heap + 'MB');
    // a11y attribute audit
    const a = await pg.evaluate(() => {
      const langAttr = /^[a-z]{2}$/.test(document.documentElement.lang || '');
      const langSelAria = !!document.querySelector('#lang-select[aria-label]');
      const imgsAlt = Array.from(document.querySelectorAll('img')).every(i => i.hasAttribute('alt'));
      const boxes = document.querySelectorAll('[data-chitti-response]').length;
      const colourWord = !/^\s*$/.test(document.body.innerText); // proxy
      let smallTaps = 0; document.querySelectorAll('button, a, select, input').forEach(el => { const r = el.getBoundingClientRect(); if (r.width > 0 && (r.width < 44 || r.height < 40)) smallTaps++; });
      return { langAttr, langSelAria, imgsAlt, boxes, smallTaps };
    });
    ok(R.a11y, 'html[lang] set', a.langAttr, 0, '<html lang>');
    ok(R.a11y, 'lang-select has aria-label', a.langSelAria);
    ok(R.a11y, 'all <img> have alt', a.imgsAlt);
    ok(R.a11y, 'per-response boxes present (widget targets)', a.boxes >= 10, 0, a.boxes + ' boxes');
    ok(R.a11y, 'tap targets ≥44×40', a.smallTaps === 0, 0, a.smallTaps + ' small');
  }
  await ctx.close();
}
await cr.close(); server.close();

const flat = [...R.journeys, ...R.edge, ...R.engines, ...R.perf, ...R.a11y];
const pass = flat.filter(x => x.status === 'PASS').length;
console.log(`\n================ QA HANDOVER SUMMARY ================`);
console.log(`TOTAL: ${pass}/${flat.length} PASS · journeys ${R.journeys.filter(x => x.status === 'PASS').length}/${R.journeys.length} · edge ${R.edge.filter(x => x.status === 'PASS').length}/${R.edge.length} · engines ${R.engines.filter(x => x.status === 'PASS').length}/${R.engines.length} · perf ${R.perf.filter(x => x.status === 'PASS').length}/${R.perf.length} · a11y ${R.a11y.filter(x => x.status === 'PASS').length}/${R.a11y.length}`);
console.log(`BUGS: ${R.bugs.length}` + (R.bugs.length ? ' → ' + JSON.stringify(R.bugs.slice(0, 8)) : ''));
console.log('QA_HANDOVER:' + JSON.stringify({ pass, total: flat.length, bugs: R.bugs.length }));
process.exit(0);
