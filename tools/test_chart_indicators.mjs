/* test_chart_indicators.mjs — proves the chart INDICATORS dropdown (overlays on price + RSI/MACD/
 * Stochastic panes), TradingView/Angel-One style. Localhost + backend relay. Screenshots.
 * Run: node tools/test_chart_indicators.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };
const canvasH = page => page.evaluate(() => document.getElementById('tech-canvas').height);

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 980, height: 1000 } });
  await ctx.route('**/api/candles/**', async route => { try { const r = await fetch(route.request().url(), { signal: AbortSignal.timeout(15000) }); const b = await r.text(); await route.fulfill({ status: r.status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: b }); } catch (e) { await route.abort(); } });
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const oh = document.getElementById('onboarding-host'); if (oh) oh.style.display = 'none'; document.body.style.overflow = ''; });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ChittiTechChart && document.querySelector('#tech-symbol'), { timeout: 12000 }).catch(() => {});
  await dp(); await page.waitForTimeout(600);
  await page.selectOption('#tech-symbol', 'RELIANCE').catch(() => {});
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 20000 }); await page.waitForTimeout(2000);

  ok('chart has an Indicators picker (overlays + panes)', await page.locator('#chart-ind-host input[data-ci]').count() >= 10);
  ok('default overlays incl EMA 20/50 + RSI pane', await page.locator('#chart-ind-host input[data-ci="EMA 20"]').isChecked() && await page.locator('#chart-ind-host input[data-ci="RSI"]').isChecked());
  const h1 = await canvasH(page);
  await page.screenshot({ path: path.join(SHOTS, 'chart_ind_default.png'), clip: { x: 0, y: 0, width: 980, height: 700 } }).catch(() => {});

  // add MACD → a new pane → canvas grows
  await page.evaluate(() => document.querySelector('#chart-ind-host input[data-ci="MACD"]').click());
  await page.waitForTimeout(500); const h2 = await canvasH(page);
  ok('adding MACD adds a pane (canvas taller)', h2 > h1);

  // add Stochastic → taller again
  await page.evaluate(() => document.querySelector('#chart-ind-host input[data-ci="Stochastic"]').click());
  await page.waitForTimeout(500); const h3 = await canvasH(page);
  ok('adding Stochastic adds another pane', h3 > h2);

  // add Bollinger overlay (price pane, no height change but redraws)
  await page.evaluate(() => document.querySelector('#chart-ind-host input[data-ci="Bollinger"]').click());
  await page.waitForTimeout(500);
  ok('chart canvas still drawing after overlays', (await page.evaluate(() => { try { return document.getElementById('tech-canvas').toDataURL().length; } catch (e) { return 0; } })) > 5000);
  await page.screenshot({ path: path.join(SHOTS, 'chart_ind_multi.png'), clip: { x: 0, y: 0, width: 980, height: 900 } }).catch(() => {});

  // remove RSI → shorter
  await page.evaluate(() => document.querySelector('#chart-ind-host input[data-ci="RSI"]').click());
  await page.waitForTimeout(500); const h4 = await canvasH(page);
  ok('removing RSI removes its pane (canvas shorter)', h4 < h3);

  ok('0 JS errors', errs.length === 0); if (errs.length) errs.slice(0, 3).forEach(e => console.log('    ' + e.slice(0, 100)));
  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' test_chart_indicators: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
