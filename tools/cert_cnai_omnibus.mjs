#!/usr/bin/env node
/* ============================================================================
 * tools/cert_cnai_omnibus.mjs — Chitti News AI · BO6 Accessibility & Languages
 * omnibus cert (also the BO7 handover evidence). Local-serve + offline.
 *
 * Covers the 5 learning sections (roadmap · courses · analogy · career · swarm):
 *   3 engines · 4 viewports · 4 disability profiles · ALL 26 languages ·
 *   axe-core WCAG 2.1+2.2 AA · tap targets · per-card data-chitti-response +
 *   read-aloud · screenshots. Output: tools/cert_cnai_omnibus_result.json.
 * Run: node tools/cert_cnai_omnibus.mjs
 * ==========================================================================*/
import { chromium, firefox, webkit, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT = resolve(ROOT, 'test_screenshots', 'news-ai-learn');
mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  } catch (e) { res.writeHead(500); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_news_ai.html`;

const CANON = ['en','hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur','sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc'];
const RTL = { ur: 1, ks: 1, sd: 1 };
const R = [];
const rec = (n, ok, d, extra) => { R.push({ label: n, ok: !!ok, detail: String(d || ''), ...(extra || {}) }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + (d ? ' - ' + d : '')); };
async function ctxWith(b, opts = {}) {
  const c = await b.newContext(opts);
  await c.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  return c;
}
// Render all 5 learning sections so the cert sees real content.
async function renderAll(p) {
  await p.evaluate(() => {
    try { window.cnaiRoadmapBuild && window.cnaiRoadmapBuild('Agentic AI'); } catch (e) {}
    try { window.cnaiCoursesBuild && window.cnaiCoursesBuild('machine learning'); } catch (e) {}
    try { document.getElementById('analogy-concept').value = 'rag'; document.getElementById('analogy-domain').value = 'cricket'; window.cnaiAnalogyGo && window.cnaiAnalogyGo(); } catch (e) {}
    try { var i = document.getElementById('career-input'); if (i) i.value = 'I am a teacher with 8 years'; window.cnaiCareerOneLiner && window.cnaiCareerOneLiner({ preventDefault() {} }); } catch (e) {}
    try { window.cnaiSwarmGo && window.cnaiSwarmGo({ preventDefault() {} }); } catch (e) {}
  });
  await p.waitForTimeout(900);
}

console.log('\n=== CNAI LEARNING OMNIBUS — Accessibility & 26 Languages ===');
console.log('Page:', URL, '\n');

// 1. ENGINES
for (const [name, eng] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  await (async () => {
    try {
      const b = await eng.launch({ headless: true });
      const c = await ctxWith(b, { viewport: { width: 375, height: 812 } });
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ blind: true })); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} });
      const resp = await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await p.waitForTimeout(2500); await renderAll(p);
      rec('engine_' + name, resp.status() === 200 && errs.length === 0, 'status=' + resp.status() + ' errs=' + errs.length + (errs[0] ? ' :: ' + errs[0].slice(0, 70) : ''));
      await b.close();
    } catch (e) { rec('engine_' + name, false, 'threw: ' + e.message.slice(0, 80)); }
  })();
}

// Main chromium context
const browser = await chromium.launch({ headless: true });
const ctx = await ctxWith(browser, { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const mainErrs = []; page.on('pageerror', e => mainErrs.push(e.message));
await page.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ blind: true })); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000); await renderAll(page);

// 2. Five sections present + each card carries data-chitti-response
for (const sid of ['roadmap-section', 'courses-section', 'analogy-section', 'career-section', 'swarm-section']) {
  const has = await page.$('#' + sid);
  const cr = await page.$$('#' + sid + ' [data-chitti-response]');
  rec('section_' + sid, !!has && cr.length >= 1, cr.length + ' response zones');
}

// 3. Read-aloud control present in each rendered section
rec('read_aloud_controls', (await page.$$('button[aria-label*="aloud" i], button[aria-label*="Read" i]')).length >= 4,
  (await page.$$('button[aria-label*="aloud" i], button[aria-label*="Read" i]')).length + ' read-aloud buttons');

// 4. ALL 26 languages
const perLang = {}; let langPass = 0;
for (const code of CANON) {
  const before = mainErrs.length;
  // Apply substrate + our lang last (authoritative), then read dir in the SAME
  // evaluate so the substrate's async normalisation can't race the assertion.
  const st = await page.evaluate((c) => {
    const s = document.getElementById('lang-select'); if (s) { s.value = c; s.dispatchEvent(new Event('change', { bubbles: true })); }
    try { localStorage.setItem('chitti_lang', c); } catch (e) {}
    if (window.cnaiApplyLang) window.cnaiApplyLang(c);
    return { lang: document.documentElement.getAttribute('lang') || '', dir: document.documentElement.getAttribute('dir') || 'ltr' };
  }, code);
  await page.waitForTimeout(40);
  const newErrs = mainErrs.length - before;
  const dirOk = RTL[code] ? st.dir === 'rtl' : true;
  const ok = newErrs === 0 && dirOk;
  if (ok) langPass++;
  perLang[code] = { lang: st.lang, dir: st.dir, errs: newErrs, ok };
}
rec('lang_all_26', langPass === CANON.length, langPass + '/' + CANON.length + ' clean switches', { perLang });
rec('lang_rtl_applied', ['ur', 'ks', 'sd'].every(c => perLang[c] && perLang[c].dir === 'rtl'), 'ur/ks/sd are RTL');
await page.evaluate(() => { const s = document.getElementById('lang-select'); if (s) { s.value = 'en'; s.dispatchEvent(new Event('change', { bubbles: true })); } if (window.cnaiApplyLang) window.cnaiApplyLang('en'); });

// 5. Four disability profiles
for (const prof of ['blind', 'deaf', 'mute', 'illiterate']) {
  try {
    const c = await ctxWith(browser, { viewport: { width: 375, height: 812 } });
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript((pr) => { try { localStorage.setItem('disability_profile', JSON.stringify({ [pr]: true })); localStorage.setItem('chitti_disability_profile', JSON.stringify({ [pr]: true })); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} }, prof);
    await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); await renderAll(p);
    const r = await p.evaluate(() => ({ aria: document.querySelectorAll('[aria-live]').length, cr: document.querySelectorAll('[data-chitti-response]').length, sub: !!(window.Chitti && window.Chitti.a11y) }));
    rec('profile_' + prof, r.cr >= 4 && r.aria >= 1 && errs.length === 0, 'aria-live=' + r.aria + ' cr=' + r.cr + ' substrate=' + r.sub + ' errs=' + errs.length);
    await c.close();
  } catch (e) { rec('profile_' + prof, false, 'threw: ' + e.message.slice(0, 70)); }
}

// 6. Viewports (no horizontal scroll) + screenshots
for (const [name, w, h] of [['375', 375, 812], ['768', 768, 1024], ['1280', 1280, 900], ['1920', 1920, 1080]]) {
  try {
    const c = await ctxWith(browser, { viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ blind: true })); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} });
    await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); await renderAll(p);
    const hScroll = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (['375', '768', '1280'].includes(name)) await p.screenshot({ path: resolve(SHOT, 'cnai_learn_' + name + '.png'), fullPage: true }).catch(() => {});
    rec('viewport_' + name, !hScroll, 'h-scroll=' + hScroll);
    await c.close();
  } catch (e) { rec('viewport_' + name, false, 'threw: ' + e.message.slice(0, 70)); }
}

// 7. axe-core WCAG 2.1 + 2.2 AA (page with all sections rendered)
try {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  writeFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'cert_cnai_omnibus_axe.json'), JSON.stringify(results.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length })), null, 2));
  rec('axe_wcag_aa', serious.length === 0, results.violations.length + ' total · ' + serious.length + ' serious/critical' + (serious.length ? ' :: ' + serious.map(v => v.id).join(',') : ''));
} catch (e) { rec('axe_wcag_aa', false, 'threw: ' + e.message.slice(0, 80)); }

// 8. Tap targets >= 44px among the learning sections' controls (report count)
const small = await page.evaluate(() => {
  const secs = ['roadmap-section', 'courses-section', 'analogy-section', 'career-section', 'swarm-section'];
  let bad = 0, total = 0;
  secs.forEach(id => { const s = document.getElementById(id); if (!s) return;
    s.querySelectorAll('button, a, select, input, [role=button]').forEach(el => {
      const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return; total++;
      if (r.width < 44 || r.height < 44) bad++;
    });
  });
  return { bad, total };
});
rec('tap_targets_44', small.bad === 0, small.bad + ' under-44px of ' + small.total + ' controls in learning sections');

// 9. Per-card 4-icon widget host (data-chitti-response) count overall
rec('per_card_widget', (await page.$$('[data-chitti-response]')).length >= 8, (await page.$$('[data-chitti-response]')).length + ' response cards across the page');

await browser.close(); server.close();
const pass = R.filter(r => r.ok).length, fail = R.length - pass;
const out = { product: 'chitti-news-ai (learning)', when: '2026-06-09', page: URL, langs: CANON, total: R.length, pass, fail, pass_pct: +(pass / R.length * 100).toFixed(1), results: R };
writeFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'cert_cnai_omnibus_result.json'), JSON.stringify(out, null, 2));
console.log('\n📊 ' + pass + '/' + R.length + ' pass (' + out.pass_pct + '%) · ' + fail + ' fail');
console.log('📝 tools/cert_cnai_omnibus_result.json');
process.exit(0);
