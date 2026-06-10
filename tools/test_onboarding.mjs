/* test_onboarding.mjs — proves the onboarding: demo cards, icon legend, persona picker, and that
 * "Try it" / a persona actually drives the real feature. Backend blocked (DEMO, fast). Screenshot.
 * Run: node tools/test_onboarding.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); document.body.style.overflow = ''; });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ChittiOnboard && document.querySelector('#onboarding-host'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(900); await dp();

  ok('onboarding shows on first visit', await page.locator('#onboarding-host .ob').count() === 1);
  ok('6 demo cards', await page.locator('.ob-card').count() === 6);
  ok('icon legend present', await page.locator('.ob-legend').count() === 1 && /Read this box aloud/.test(await page.locator('.ob-legend').innerText()));
  ok('5 persona buttons', await page.locator('.ob-persona').count() === 5);
  ok('each card has a Try-it + a 🔊 listen', await page.locator('.ob-try').count() === 6 && await page.locator('.ob-listen').count() === 6);
  await page.screenshot({ path: path.join(SHOTS, 'onboarding.png'), fullPage: true });

  // Try-it (read) → dismisses onboarding + drives the Read feature
  await dp(); await page.evaluate(() => document.querySelector('[data-ob-try="read"]').click());
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });
  ok('Try-it (Read a Stock) dismisses onboarding + runs analyze', !(await page.locator('#onboarding-host').isVisible()) && await page.locator('.verdict-hero').count() === 1);

  // reopen via header button
  await dp(); await page.evaluate(() => document.getElementById('ob-open').click());
  await page.waitForTimeout(300);
  ok('"How to use" button reopens onboarding', await page.locator('#onboarding-host .ob').count() === 1);

  // persona tour → dismisses + drives Read with the persona's mode
  await dp(); await page.evaluate(() => document.querySelector('[data-ob-persona="1"]').click()); // Swing Trader
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });
  const mode = await page.evaluate(() => document.getElementById('tech-mode').value);
  ok('Persona tour (Swing) sets mode=swing + analyzes', !(await page.locator('#onboarding-host').isVisible()) && mode === 'swing');

  ok('0 JS page errors', errs.length === 0); if (errs.length) errs.slice(0, 3).forEach(e => console.log('    ' + e.slice(0, 100)));

  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' test_onboarding: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
