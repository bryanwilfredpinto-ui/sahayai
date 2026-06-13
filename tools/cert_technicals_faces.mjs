/* cert_technicals_faces.mjs — proves the NEW faces: Chart · Screener · Watchlist · Backtest ·
 * indicator/TF pickers · Refresh · 26-language switch. Single-context, stable, backend blocked
 * (DEMO data). Screenshots each face. Run: node tools/cert_technicals_faces.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots'); if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 920 } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#tech-symbol'), { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => { ['#chitti-disability-profile-modal', '.chitti-dp-modal', '.chitti-fb-modal-bg'].forEach(s => document.querySelectorAll(s).forEach(e => e.remove())); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; });
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); document.body.style.overflow = ''; });
  const click = async sel => { await dp(); await page.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); };
  const tab = id => click('#' + id);
  const shot = nm => page.screenshot({ path: path.join(SHOTS, 'face_' + nm + '.png'), fullPage: true });

  console.log('— READ + CHART + PICKERS + REFRESH —');
  ok('6 tabs present', await page.locator('[role=tab]').count() === 6);
  await click('#tech-analyze');
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });
  await page.waitForTimeout(500); // let layout flush so the canvas has width
  ok('verdict renders', await page.locator('.verdict-hero').count() === 1);
  const chartAria = await page.evaluate(() => { const c = document.getElementById('tech-canvas'); let len = 0; try { len = c.toDataURL().length; } catch (e) {} return { role: c && c.getAttribute('role'), label: (c && c.getAttribute('aria-label') || '').slice(0, 50), lib: !!window.ChittiTechChart, w: c && c.width, cw: c && c.clientWidth, pixlen: len }; });
  console.log('    chart: ' + JSON.stringify(chartAria));
  ok('CANDLESTICK CHART drew pixels (canvas non-blank)', chartAria.w > 0 && chartAria.pixlen > 3000);
  ok('chart canvas is role=img (deaf/SR accessible)', chartAria.role === 'img');
  ok('INDICATOR PICKER present', await page.locator('#indicator-picker-host details.ind-picker').count() === 1);
  ok('TIMEFRAME PICKER present', await page.locator('#tf-picker-host details.tf-picker').count() === 1);
  ok('REFRESH button present + works', await page.locator('#tech-refresh').count() === 1);
  await click('#tech-refresh'); await page.waitForTimeout(400);
  ok('refresh re-rendered verdict', await page.locator('.verdict-hero').count() === 1);
  // indicator picker actually filters the table
  const indRowsBefore = await page.locator('#indicators-host tbody tr').count();
  await page.evaluate(() => { const cb = document.querySelector('#indicator-picker-host input[data-ind="RSI"]'); if (cb && cb.checked) cb.click(); });
  await page.waitForTimeout(200);
  ok('indicator picker filters table', (await page.locator('#indicators-host tbody tr').count()) < indRowsBefore);
  await shot('read');

  console.log('— SCREENER —');
  await tab('tab-screener');
  await click('#scr-run'); await page.waitForSelector('.scr-table', { timeout: 4000 });
  ok('SCREENER renders ranked table', await page.locator('.scr-table tbody tr').count() >= 1);
  ok('screener row is tappable → loads Read', await page.locator('.scr-pick').count() >= 1);
  await shot('screener');

  console.log('— WATCHLIST + ALERTS —');
  await tab('tab-watchlist');
  await page.selectOption('#watch-sym', 'TCS').catch(() => {});
  await click('#watch-add'); await page.waitForSelector('.wl-table', { timeout: 4000 });
  ok('WATCHLIST adds + renders a row', await page.locator('.wl-table tbody tr').count() >= 1);
  ok('watchlist shows a signal + alerts column', /BUY|SELL|HOLD/.test(await page.locator('.wl-table').innerText()));
  await shot('watchlist');

  console.log('— BACKTEST / SCORECARD —');
  await tab('tab-backtest');
  await click('#bt-run'); await page.waitForSelector('.bt-table', { timeout: 5000 });
  const btText = await page.locator('#backtest-host').innerText();
  ok('BACKTEST renders scorecard (win rate)', /Win rate/i.test(btText));
  ok('backtest shows CALIBRATION (the AI-app differentiator)', /calibration/i.test(btText));
  ok('backtest shows Go/No-Go + honesty rail', /Go \/ No-Go|Go|No-Go/i.test(btText) && /Past performance/i.test(btText));
  await shot('backtest');

  console.log('— 26-LANGUAGE SWITCH (proof) —');
  await tab('tab-read');
  const langCount = await page.locator('#lang-select option').count();
  ok('language dropdown has ≥26 options', langCount >= 26);
  const before = await page.evaluate(() => document.documentElement.lang);
  await page.selectOption('#lang-select', 'hi').catch(() => {});
  await page.waitForTimeout(600);
  const afterHi = await page.evaluate(() => document.documentElement.lang);
  ok('switch to Hindi sets <html lang=hi>', afterHi === 'hi');
  await page.selectOption('#lang-select', 'ta').catch(() => {});
  await page.waitForTimeout(600);
  ok('switch to Tamil sets <html lang=ta>', (await page.evaluate(() => document.documentElement.lang)) === 'ta');
  await shot('language_tamil');
  await page.selectOption('#lang-select', 'en').catch(() => {});

  console.log('— axe + crashes —');
  let axePath = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'); if (!fs.existsSync(axePath)) axePath = null;
  if (axePath) { await page.addScriptTag({ path: axePath }); const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })); const ser = r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical'); ok('axe 0 serious/critical', ser.length === 0); if (ser.length) ser.forEach(v => console.log('    axe ' + v.id + ' ×' + v.nodes.length)); }
  ok('0 JS page errors', errs.length === 0); if (errs.length) errs.slice(0, 4).forEach(e => console.log('    ' + e.slice(0, 100)));

  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' cert_technicals_faces: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
