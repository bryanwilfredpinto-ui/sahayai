/* record_technicals_demo.mjs — records a ~2-min walkthrough video (Playwright recordVideo) of
 * every face: Read+Chart → Screener → Watchlist → Backtest → Language switch. Backend blocked →
 * honest DEMO data. Saves tools/cert_screenshots/chitti_technicals_demo.webm + a focused chart PNG.
 * Run: node tools/record_technicals_demo.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const VIDDIR = path.join(SHOTS, '_vid'); if (!fs.existsSync(VIDDIR)) fs.mkdirSync(VIDDIR, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, recordVideo: { dir: VIDDIR, size: { width: 1180, height: 820 } } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; });
  const click = async sel => { await dp(); await page.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); };
  const wait = ms => page.waitForTimeout(ms);

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#tech-symbol'), { timeout: 12000 }).catch(() => {});
  await dp(); await wait(2500);

  // 1) READ + CHART
  await page.selectOption('#tech-symbol', 'RELIANCE').catch(() => {});
  await click('#tech-analyze'); await page.waitForSelector('.verdict-hero', { timeout: 8000 }); await wait(1500);
  // focused chart screenshot
  try { const card = page.locator('canvas#tech-canvas'); await card.scrollIntoViewIfNeeded(); await wait(600); await card.screenshot({ path: path.join(SHOTS, 'shot_chart.png') }); } catch (e) {}
  await page.mouse.wheel(0, 500); await wait(1800);
  await page.mouse.wheel(0, 600); await wait(1800);
  await page.mouse.wheel(0, -1100); await wait(1200);
  // change symbol to show it's general
  await page.selectOption('#tech-symbol', 'SUZLON').catch(() => {});
  await click('#tech-analyze'); await wait(2500);

  // 2) SCREENER
  await click('#tab-screener'); await wait(1200);
  await click('#scr-run'); await page.waitForSelector('.scr-table', { timeout: 4000 }); await wait(2800);
  await page.mouse.wheel(0, 500); await wait(1500);

  // 3) WATCHLIST
  await click('#tab-watchlist'); await wait(1000);
  await page.selectOption('#watch-sym', 'TCS').catch(() => {});
  await click('#watch-add'); await page.waitForSelector('.wl-table', { timeout: 4000 }); await wait(1500);
  await page.selectOption('#watch-sym', 'INFY').catch(() => {});
  await click('#watch-add'); await wait(2500);

  // 4) BACKTEST
  await click('#tab-backtest'); await wait(1000);
  await click('#bt-run'); await page.waitForSelector('.bt-table', { timeout: 5000 }); await wait(3500);

  // 5) TIP SHIELD (the moat) — quick
  await click('#tab-tip'); await wait(800);
  await page.fill('#tip-input', 'Buy XYZ now! guaranteed double, sure-shot, join VIP telegram, pay 999').catch(() => {});
  await click('#tip-check'); await wait(2800);

  // 6) LANGUAGE SWITCH
  await click('#tab-read'); await wait(800);
  await page.selectOption('#lang-select', 'hi').catch(() => {}); await wait(2000);
  await page.selectOption('#lang-select', 'ta').catch(() => {}); await wait(2000);
  await page.selectOption('#lang-select', 'bn').catch(() => {}); await wait(2000);
  await page.selectOption('#lang-select', 'en').catch(() => {}); await wait(1500);

  const vid = page.video();
  await ctx.close(); // flushes the video
  let outPath = path.join(SHOTS, 'chitti_technicals_demo.webm');
  try { const p = await vid.path(); if (p && fs.existsSync(p)) { fs.copyFileSync(p, outPath); } } catch (e) { console.log('video path err: ' + e); }
  await browser.close(); server.close();
  const sz = fs.existsSync(outPath) ? (fs.statSync(outPath).size / 1024 | 0) + ' KB' : 'NOT SAVED';
  console.log('✅ recording saved: tools/cert_screenshots/chitti_technicals_demo.webm (' + sz + ') + shot_chart.png');
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
