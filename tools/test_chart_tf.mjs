/* test_chart_tf.mjs — proves the chart TIMEFRAME DROPDOWN (Monthly/Weekly/Daily/4h/1h/15m/5m/1m).
 * Localhost + backend relay (server-side fetch past CORS). Analyzes RELIANCE, cycles every TF,
 * asserts the canvas redraws (pixels) + shows the right live/derived/unavailable badge. Screenshots.
 * Run: node tools/test_chart_tf.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
const TFS = ['monthly', 'weekly', 'daily', '4h', '1h', '15m', '5m', '1m'];
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 900, height: 820 } });
  await ctx.route('**/api/candles/**', async route => { try { const r = await fetch(route.request().url(), { signal: AbortSignal.timeout(15000) }); const b = await r.text(); await route.fulfill({ status: r.status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: b }); } catch (e) { await route.abort(); } });
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#tech-symbol'), { timeout: 12000 }).catch(() => {});
  await dp(); await page.waitForTimeout(800);
  await page.selectOption('#tech-symbol', 'RELIANCE').catch(() => {});
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 20000 }); await page.waitForTimeout(2000);

  ok('chart TF dropdown has 8 options', await page.locator('#chart-tf option').count() === 8);

  for (const tf of TFS) {
    await dp();
    await page.selectOption('#chart-tf', tf).catch(() => {});
    // wait for redraw (badge updates) — derived/live calls take a moment
    await page.waitForFunction((t) => { const s = document.getElementById('chart-tf-src'); return s && !/loading/.test(s.innerText) && s.innerText.length > 2; }, tf, { timeout: 18000 }).catch(() => {});
    const info = await page.evaluate(() => { const c = document.getElementById('tech-canvas'); let len = 0; try { len = c.toDataURL().length; } catch (e) {} return { src: (document.getElementById('chart-tf-src') || {}).innerText || '', pix: len }; });
    if (tf === '1m') { ok(tf + ' → honest "not available"', /not available|unavailable|not served/i.test(info.src)); }
    else { ok(tf + ' → drew candles + LIVE/derived badge', info.pix > 3000 && /LIVE|DEMO|bars/i.test(info.src)); }
    console.log('  ' + tf + ': ' + info.src.replace(/\s+/g, ' ').trim() + ' · pix=' + info.pix);
    if (['daily', 'weekly', '4h', '5m'].indexOf(tf) >= 0) { await page.screenshot({ path: path.join(SHOTS, 'charttf_' + tf + '.png') }); }
  }

  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' test_chart_tf: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
