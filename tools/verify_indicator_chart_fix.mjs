/* verify_indicator_chart_fix.mjs — confirms the two reported fixes:
 *  (1) chart PSAR overlay no longer throws (engine now exports psar) and chart redraws;
 *  (2) the indicator picker stays OPEN after ticking (no rebuild/collapse), so all 39
 *      indicators are reachable. Mobile viewport, real taps, backend blocked (demo).
 *  Run: node tools/verify_indicator_chart_fix.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium, devices } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n); console.log('  ✗ ' + n); } };
const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 5'] });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  const dismiss = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); const ob = document.getElementById('onboarding-host'); if (ob) ob.style.display = 'none'; document.body.style.overflow = ''; });
  await dismiss();
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });
  await page.waitForTimeout(800);
  await dismiss();

  // (2) picker stays open after a tick + indicator appears in table
  const pick = await page.evaluate(async () => {
    const host = document.getElementById('indicator-picker-host');
    const det = host.querySelector('details.ind-picker'); det.open = true;
    const box = [...host.querySelectorAll('input[data-ind]')].find(b => !b.checked);
    const nm = box.getAttribute('data-ind'); box.click();
    await new Promise(r => setTimeout(r, 250));
    const det2 = document.querySelector('#indicator-picker-host details.ind-picker');
    const inTable = [...document.querySelectorAll('#indicators-host table tbody tr th')].map(t => t.innerText.trim()).includes(nm);
    // tick a SECOND one without re-opening (proves it stayed usable)
    const box2 = [...document.querySelectorAll('#indicator-picker-host input[data-ind]')].find(b => !b.checked);
    const nm2 = box2.getAttribute('data-ind'); box2.click();
    await new Promise(r => setTimeout(r, 250));
    const inTable2 = [...document.querySelectorAll('#indicators-host table tbody tr th')].map(t => t.innerText.trim()).includes(nm2);
    const summary = (document.querySelector('#indicator-picker-host .ind-picker > summary') || {}).textContent || '';
    return { stillOpen: det2.open, inTable, inTable2, summary };
  });
  ok('indicator picker STAYS OPEN after a tick', pick.stillOpen === true);
  ok('ticked indicator appears in the table', pick.inTable);
  ok('a 2nd indicator can be ticked without re-opening', pick.inTable2);
  ok('summary count updates in place', /Choose indicators \(\d+ of 39\)/.test(pick.summary));

  // (1) toggle PSAR (and every chart indicator) — must not throw, chart stays drawn
  const errsBefore = errs.length;
  const toggles = await page.evaluate(async () => {
    const det = document.querySelector('details.chart-ind-pick'); if (det) det.open = true;
    const host = document.getElementById('chart-ind-host');
    function drawn() { const cv = document.getElementById('tech-canvas'); if (!cv.width) return 0; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) n++; return n; }
    const res = {};
    for (const b of [...host.querySelectorAll('input[data-ci]')]) {
      const k = b.getAttribute('data-ci');
      b.click(); await new Promise(r => setTimeout(r, 250));
      res[k] = drawn() > 1000;   // chart still has content after toggling this on
      b.click(); await new Promise(r => setTimeout(r, 150));
    }
    return res;
  });
  ok('no page errors during chart toggles (PSAR fixed)', errs.length === errsBefore);
  Object.keys(toggles).forEach(k => ok('chart draws with "' + k + '" toggled on', toggles[k]));
  // PSAR specifically: turn it on and confirm chart still renders + no throw
  const psarErrBefore = errs.length;
  await page.evaluate(async () => { const b = [...document.querySelectorAll('#chart-ind-host input[data-ci]')].find(x => x.getAttribute('data-ci') === 'PSAR'); b.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const s = document.getElementById('chart-tf'); s.value = 'weekly'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.waitForTimeout(800);
  const psarDrawn = await page.evaluate(() => { const cv = document.getElementById('tech-canvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) n++; return n; });
  ok('with PSAR on, switching timeframe still draws the chart (no blank cascade)', psarDrawn > 1000 && errs.length === psarErrBefore);

  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' verify_indicator_chart_fix: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\n   FAILED: ' + fails.join(' · ') : '') + (errs.length ? '\n   page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close(); server.close();
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
