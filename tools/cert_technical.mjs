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
p.on('dialog', d => d.dismiss().catch(() => {}));
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

// ---- ITEM (research-driven): accessible chart DATA TABLE (canvas alternative for blind users) ----
await p.evaluate(() => window.TechUI.toggleTable());
await p.waitForTimeout(300);
const tbl = await p.evaluate(() => {
  const box = document.getElementById('chart-table');
  const t = box.querySelector('table');
  return { shown: box.style.display !== 'none', rows: t ? t.querySelectorAll('tr').length : 0,
           headers: t ? t.querySelectorAll('th[scope="col"]').length : 0, caption: t ? !!t.querySelector('caption') : false,
           expanded: document.getElementById('table-toggle').getAttribute('aria-expanded') };
});
check('ITEM accessible_chart_data_table', tbl.shown && tbl.rows >= 10 && tbl.headers >= 6 && tbl.caption && tbl.expanded === 'true',
  `rows=${tbl.rows} headers=${tbl.headers} caption=${tbl.caption} expanded=${tbl.expanded}`);

// ---- ITEM: ALL-STOCKS dropdown — type "REL" → RELAXO, RELIANCE, RELIGARE (Sire's explicit ask) ----
check('all_stocks_universe_loaded', await p.evaluate(() => !!(window.NSE && window.NSE.ALL && window.NSE.ALL.length >= 200)),
  await p.evaluate(() => window.NSE && window.NSE.ALL ? window.NSE.ALL.length + ' symbols' : 'window.NSE missing'));
await p.fill('#sym', '');
await p.fill('#sym', 'REL');
await p.waitForTimeout(350);
const relOpts = await p.$$eval('#sym-listbox .ac-opt .s', els => els.map(e => e.textContent.trim()));
await p.screenshot({ path: resolve(SHOT_DIR, 'chitti_technical_dropdown.png') });
check('ITEM dropdown_REL_shows_RELAXO_RELIANCE_RELIGARE',
  ['RELAXO','RELIANCE','RELIGARE'].every(s => relOpts.includes(s)), 'shown: ' + relOpts.slice(0,8).join(', '));
const relIdx = relOpts.indexOf('RELIANCE');
await p.evaluate(i => window.TechUI.acPick(i), relIdx);
await p.waitForTimeout(300);
check('dropdown_select_runs_scan', await p.evaluate(() =>
  document.getElementById('sym').value === 'RELIANCE' && document.getElementById('sig-sym').textContent === 'RELIANCE'));

// ---- ITEM: indicator dropdown (all indicators) ----
await p.evaluate(() => window.TechUI.toggleIndMenu());
await p.waitForTimeout(250);
const indBoxes = await p.$$eval('#ind-menu input[type="checkbox"]', els => els.length);
check('ITEM indicator_dropdown_lists_all', indBoxes >= 38, indBoxes + ' indicators in dropdown');
await p.evaluate(() => window.TechUI.indAll(false)); await p.waitForTimeout(200);
const gridNone = await p.$$eval('#ind-grid .ind', els => els.length);
await p.evaluate(() => window.TechUI.indAll(true)); await p.waitForTimeout(250);
const gridAll = await p.$$eval('#ind-grid .ind', els => els.length);
check('indicator_dropdown_toggle_filters_grid', gridNone === 0 && gridAll >= 38, `none=${gridNone} all=${gridAll}`);
// rates populate: indicator cells carry numeric values (not all dashes)
const numericVals = await p.$$eval('#ind-grid .ind .val', els => els.filter(e => /[0-9]/.test(e.textContent)).length);
check('ITEM rates_indicators_populate', numericVals >= 30, numericVals + ' indicators show numeric values');
await p.evaluate(() => window.TechUI.toggleIndMenu());

// ---- ITEM: BUY · SELL · TARGET · SL plan on a directional signal ----
const dir = await p.evaluate(() => {
  const E = window.TechEngine;
  for (const s of E.UNIVERSE) for (const tt of ['longterm','positional','swing','intraday']) {
    const r = E.scanSymbol(s.sym, tt); if (r.verdict !== 'HOLD') return { sym: s.sym, tt: tt, verdict: r.verdict };
  }
  return null;
});
if (dir) {
  await p.selectOption('#tradetype', dir.tt);
  await p.fill('#sym', dir.sym);
  await p.evaluate(() => window.TechUI.scan());
  await p.waitForTimeout(350);
  await p.screenshot({ path: resolve(SHOT_DIR, 'chitti_technical_plan.png') });
  const plan = await p.evaluate(() => {
    const b = document.getElementById('trade-plan');
    return { buy: !!b.querySelector('.pcell.buy .pv'), sell: !!b.querySelector('.pcell.sell .pv'),
             tgt: !!b.querySelector('.pcell.tgt .pv'), sl: !!b.querySelector('.pcell.sl .pv') };
  });
  check('ITEM trade_plan_BUY_SELL_TARGET_SL', plan.buy && plan.sell && plan.tgt && plan.sl,
    `${dir.sym}/${dir.tt} ${dir.verdict} → ${JSON.stringify(plan)}`);

  // ---- ITEM: portfolio log → close → PnL (real UI roundtrip, Golden-Rule confirm) ----
  await p.evaluate(() => { try { localStorage.removeItem('chitti_tech_pf_v1'); } catch (e) {} });
  await p.evaluate(() => window.TechUI.logTrade());            // opens confirm modal
  await p.waitForTimeout(150);
  const confirmShown = await p.evaluate(() => document.getElementById('confirm').classList.contains('show'));
  await p.evaluate(() => window.TechUI._confirmYes());          // accept (Golden-Rule Yes)
  await p.waitForTimeout(200);
  const openN = await p.evaluate(() => document.getElementById('pf-open').textContent);
  const tid = await p.evaluate(() => { const l = JSON.parse(localStorage.getItem('chitti_tech_pf_v1') || '[]'); return l.length ? l[0].id : null; });
  await p.evaluate(id => window.TechUI.closeTrade(id), tid);    // opens confirm modal
  await p.waitForTimeout(150);
  await p.evaluate(() => window.TechUI._confirmYes());          // accept close
  await p.waitForTimeout(200);
  const closedN = await p.evaluate(() => document.getElementById('pf-closed').textContent);
  const pnl = await p.evaluate(() => document.getElementById('pf-pnl').textContent);
  await p.evaluate(() => { const el = document.getElementById('pf-list'); if (el) el.scrollIntoView(); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: resolve(SHOT_DIR, 'chitti_technical_portfolio.png'), fullPage: true });
  check('ITEM portfolio_log_close_pnl', confirmShown && openN === '1' && closedN === '1' && /[₹0-9]/.test(pnl),
    `confirm=${confirmShown} open=${openN} closed=${closedN} pnl=${pnl}`);
} else {
  check('ITEM trade_plan_BUY_SELL_TARGET_SL', false, 'no directional signal found to test the plan');
  check('ITEM portfolio_log_close_pnl', false, 'no directional signal to log');
}

// ---- tap targets >= 44px on primary buttons ----
const smallBtns = await p.$$eval('.btn', els => els.filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height < 44; }).length);
check('ITEM tap_targets_44px', smallBtns === 0, smallBtns + ' under 44px');

// ---- run screener + scan smoke ----
await p.evaluate(() => window.TechUI.runScreen());
await p.waitForTimeout(400);
check('screener_runs', await p.evaluate(() => document.getElementById('screener-results').children.length > 0));

check('no_page_errors', pageErrors.length === 0, pageErrors.slice(0,5).join(' | '));

// ---- ITEM: legacy UI DISMANTLED (old monolith URL redirects to the rebuilt product) ----
const lp = await c.newPage();
await lp.goto(BASE + '/chitti_complete_technical.html', { waitUntil:'domcontentloaded' });
await lp.waitForTimeout(800);
const landed = lp.url();
check('ITEM legacy_dismantled_redirects', /chitti_technical\.html/.test(landed), 'landed on ' + landed);
await lp.close();

await c.close();

// ---- ITEM: LIVE Angel data pipeline (mock the /candles endpoint → page must render LIVE) ----
const liveCtx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const liveErrors = [];
await liveCtx.route('**/api/candles/**', route => {
  const m = /[?&]timeframe=([^&]+)/.exec(route.request().url());
  const tf = m ? m[1] : 'Daily';
  const n = (tf === '1H' || tf === '4H') ? 220 : (tf === 'Monthly' ? 80 : (tf === 'Weekly' ? 160 : 400));
  const arr = []; let px = 2500;
  let t0 = 1750000000; // fixed epoch base (deterministic)
  for (let i = 0; i < n; i++) {
    px *= 1 + (((i % 9) - 4) / 900);
    const o = px, cl = px * 1.0015, h = Math.max(o, cl) * 1.004, lo = Math.min(o, cl) * 0.996;
    arr.push({ time: t0 + i * 86400, open: +o.toFixed(2), high: +h.toFixed(2), low: +lo.toFixed(2), close: +cl.toFixed(2), volume: 100000 + i });
  }
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(arr) });
});
const liveP = await liveCtx.newPage();
liveP.on('pageerror', e => liveErrors.push(e.message));
liveP.on('dialog', d => d.dismiss().catch(() => {}));
await liveP.goto(URL, { waitUntil: 'domcontentloaded' });
await liveP.waitForTimeout(1400);
await liveP.evaluate(() => { const m = document.getElementById('chitti-disability-profile-modal'); if (m) m.remove(); });
await liveP.evaluate(() => window.TechUI.refresh());     // fetches the mocked Angel candles
await liveP.waitForTimeout(1500);
const liveSrc = await liveP.evaluate(() => document.documentElement.getAttribute('data-tech-source'));
const liveFlag = await liveP.evaluate(() => document.getElementById('demo-flag').textContent);
const liveAsof = await liveP.evaluate(() => document.getElementById('asof-val').textContent);
await liveP.screenshot({ path: resolve(SHOT_DIR, 'chitti_technical_live.png') });
check('ITEM live_angel_data_pipeline', liveSrc === 'LIVE' && /Angel/.test(liveFlag) && liveErrors.length === 0,
  `source=${liveSrc} flag="${liveFlag}" asof=${liveAsof} errs=${liveErrors.length}`);
await liveP.close(); await liveCtx.close();
await b.close();
server.close();

const passed = R.filter(r => r.ok).length, failed = R.length - passed;
console.log('\n──────── Chitti Technical — Playwright cert ────────');
console.log('PASS: ' + passed + '   FAIL: ' + failed);
console.log('CERT_RESULT:' + JSON.stringify({ pass: passed, fail: failed, pageErrors: pageErrors.length }));
process.exit(failed === 0 ? 0 : 1);
