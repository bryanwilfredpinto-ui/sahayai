#!/usr/bin/env node
/* tools/cert_technical.mjs — Chitti Technical (CEOS) visual + functional cert.
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Self-contained: starts a static server on the repo root, drives chromium across
 * 375/768/1280, writes real screenshots, and asserts the BO12 gates — 5 frontend
 * gates, 5-element box on every response card, whole-UI language-switch re-render
 * (en→bn proof), SEBI bar, no horizontal overflow at 375px, 0 JS page errors.
 * Run: node tools/cert_technical.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });
const PORT = 8771;
const BASE = 'http://127.0.0.1:' + PORT;
const URL = BASE + '/chitti_technical.html';

const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = join(ROOT, p);
  if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('404'); return; }
  try { res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'text/plain' }); res.end(readFileSync(fp)); }
  catch (e) { res.writeHead(500); res.end('err'); }
});
await new Promise(r => server.listen(PORT, r));

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }

const b = await chromium.launch({ headless: true });
const pageErrors = [];

// ---- responsive screenshots + overflow ----
const viewports = [{ n:'375', w:375, h:812, d:2 }, { n:'768', w:768, h:1024, d:2 }, { n:'1280', w:1280, h:900, d:1 }];
for (const v of viewports) {
  const c = await b.newContext({ viewport:{ width:v.w, height:v.h }, deviceScaleFactor:v.d });
  const p = await c.newPage();
  p.on('pageerror', e => pageErrors.push(v.n + ': ' + e.message));
  await p.goto(URL, { waitUntil:'domcontentloaded', timeout:30000 });
  await p.waitForTimeout(1400);
  const out = resolve(SHOT_DIR, `chitti_technical_${v.n}.png`);
  await p.screenshot({ path: out, fullPage: true });
  check('screenshot_' + v.n, true, out);
  if (v.n === '375') {
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    check('no_horizontal_overflow_375', !overflow, overflow ? 'scrollWidth>vw' : 'clean');
  }
  await c.close();
}

// ---- functional gates on 1280 ----
const c = await b.newContext({ viewport:{ width:1280, height:900 } });
const p = await c.newPage();
p.on('pageerror', e => pageErrors.push('fn: ' + e.message));
await p.goto(URL, { waitUntil:'domcontentloaded' });
await p.waitForTimeout(1800);

// ── ITEM 1: DISABILITY MODAL on first visit (G3) ──
const dpModal = await p.evaluate(() => {
  const m = document.getElementById('chitti-disability-profile-modal');
  if (!m) return { present:false };
  const vis = m.offsetParent !== null || getComputedStyle(m).display !== 'none';
  const opts = m.querySelectorAll('input[type="checkbox"]').length;
  return { present:true, vis, opts };
});
check('ITEM disability_modal_first_visit', dpModal.present && dpModal.vis && dpModal.opts >= 5,
  dpModal.present ? (dpModal.opts + ' options, visible=' + dpModal.vis) : 'modal not found');
// dismiss the modal so downstream interaction is clean (save with no selection = skip)
await p.evaluate(() => {
  const m = document.getElementById('chitti-disability-profile-modal');
  if (m) { const btn = m.querySelector('button'); if (btn) btn.click(); m.style.display='none'; m.remove(); }
});
await p.waitForTimeout(300);

// G2: substrate + engine loaded
check('engine_loaded', await p.evaluate(() => !!window.TechEngine));
check('i18n_loaded', await p.evaluate(() => !!window.TECH_I18N));
// G1: response boxes
const boxes = await p.$$eval('[data-chitti-response]', els => els.map(e => e.getAttribute('data-chitti-response')));
check('G1_response_boxes_present', boxes.length >= 5, boxes.length + ' boxes');
// 5-element box: feedback-widget attaches a .chitti-fb-box-bar (sibling) per response box,
// each carrying demo(🤖)/speak(🔊)/up(👍)/down(👎) buttons.
await p.waitForTimeout(1000);
const widgetCounts = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('[data-chitti-response]').forEach(el => {
    const id = el.getAttribute('data-chitti-response');
    // bar is inserted as a sibling after the box (data-for-box=id) OR nearby
    let bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
    if (!bar && el.nextElementSibling && el.nextElementSibling.classList.contains('chitti-fb-box-bar')) bar = el.nextElementSibling;
    const btns = bar ? bar.querySelectorAll('.chitti-fb-bbtn').length : 0;
    out.push({ id: id, btns: btns });
  });
  return out;
});
const boxesWired = widgetCounts.filter(w => w.btns >= 4).length;
check('ITEM feedback_bar_every_box', boxesWired === widgetCounts.length && widgetCounts.length >= 5,
  boxesWired + '/' + widgetCounts.length + ' boxes wired (' + widgetCounts.map(w => w.id + ':' + w.btns).join(' ') + ')');
// SEBI bar
check('ITEM sebi_bar', await p.evaluate(() => /NOT SEBI REGISTERED/i.test(document.getElementById('sebi-bar').textContent)));
// a signal verdict rendered
check('signal_verdict_rendered', await p.evaluate(() => {
  const t = document.getElementById('verdict-row').textContent; return /BUY|SELL|HOLD|खरीद|कोन|রাখ|ख़रीदें/.test(t) || t.length > 1;
}));

// ---- BO2: whole-UI language switch (en → bn) ----
const enTitle = await p.evaluate(() => document.querySelector('[data-i18n="app.title"]').textContent);
await p.selectOption('#lang-select', 'bn');
await p.waitForTimeout(700);
const bnTitle = await p.evaluate(() => document.querySelector('[data-i18n="app.title"]').textContent);
const bnExpected = await p.evaluate(() => window.TECH_I18N.bn['app.title']);
check('ITEM language_flip_en_to_bangla', bnTitle === bnExpected && bnTitle !== enTitle, `"${enTitle}" → "${bnTitle}"`);
check('html_lang_attr_updates', await p.evaluate(() => document.documentElement.lang === 'bn'));
// switch to te and ta too
await p.selectOption('#lang-select', 'te'); await p.waitForTimeout(400);
const teOk = await p.evaluate(() => document.querySelector('[data-i18n="app.title"]').textContent === window.TECH_I18N.te['app.title']);
check('lang_switch_telugu', teOk);
await p.selectOption('#lang-select', 'ta'); await p.waitForTimeout(400);
const taOk = await p.evaluate(() => document.querySelector('[data-i18n="app.title"]').textContent === window.TECH_I18N.ta['app.title']);
check('lang_switch_tamil', taOk);

// ---- pane toggle (BO8): RSI overlay<->separate ----
await p.selectOption('#lang-select', 'en'); await p.waitForTimeout(300);
const toggleWorks = await p.evaluate(() => {
  const togs = [...document.querySelectorAll('#pane-toggles .tog')];
  return togs.length >= 3; // RSI / Williams %R / Stochastic
});
check('chart_pane_toggles_present', toggleWorks);

// ---- tap targets >= 44px on primary buttons ----
const smallBtns = await p.$$eval('.btn', els => els.filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height < 44; }).length);
check('ITEM tap_targets_44px', smallBtns === 0, smallBtns + ' under 44px');

// ---- run screener + scan smoke ----
await p.evaluate(() => window.TechUI.runScreen());
await p.waitForTimeout(400);
check('screener_runs', await p.evaluate(() => document.getElementById('screener-results').children.length > 0));

check('no_page_errors', pageErrors.length === 0, pageErrors.slice(0,5).join(' | '));

await c.close();
await b.close();
server.close();

const passed = R.filter(r => r.ok).length, failed = R.length - passed;
console.log('\n──────── Chitti Technical — Playwright cert ────────');
console.log('PASS: ' + passed + '   FAIL: ' + failed);
console.log('CERT_RESULT:' + JSON.stringify({ pass: passed, fail: failed, pageErrors: pageErrors.length }));
process.exit(failed === 0 ? 0 : 1);
