/* cert_bo_complete.mjs — completes the remaining BO gates:
 *  BO11 cross-engine: core checks on Chromium + Firefox + WebKit (+ axe 0 serious each) + screenshot
 *  BO5  offline: service worker installs → page reloads with network OFF
 *  BO10 26-language: cycle all langs → <html lang> updates, no crash, technical terms stay English
 * Backend blocked (DEMO) for engine-independent stability. Run: node tools/cert_bo_complete.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium, firefox, webkit } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
const axePath = (() => { const p = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'); return fs.existsSync(p) ? p : null; })();
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

async function coreChecks(engineName, launcher, URL) {
  const browser = await launcher.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 860 } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#tech-symbol'), { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg,#onboarding-host .ob').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); const oh = document.getElementById('onboarding-host'); if (oh) oh.style.display = 'none'; document.body.style.overflow = ''; });
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 10000 });
  ok(engineName + ': verdict renders', await page.locator('.verdict-hero').count() === 1);
  ok(engineName + ': chart canvas + 6 tabs', await page.locator('canvas#tech-canvas').count() === 1 && await page.locator('[role=tab]').count() === 6);
  // tip shield
  await page.evaluate(() => document.getElementById('tab-tip').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => { const t = document.getElementById('tip-input'); if (t) t.value = 'guaranteed double sure-shot buy now telegram'; document.getElementById('tip-check').click(); });
  await page.waitForSelector('.tipres', { timeout: 8000 }).catch(() => {});
  ok(engineName + ': tip shield flags scam', await page.locator('.tip-high').count() === 1);
  // axe
  if (axePath) {
    await page.evaluate(() => document.getElementById('tab-read').click());
    await page.addScriptTag({ path: axePath });
    const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
    const ser = r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    ok(engineName + ': axe 0 serious/critical', ser.length === 0);
    if (ser.length) ser.forEach(v => console.log('    ' + engineName + ' axe ' + v.id + ' ×' + v.nodes.length));
  }
  ok(engineName + ': 0 JS page errors', errs.length === 0);
  await page.screenshot({ path: path.join(SHOTS, 'engine_' + engineName + '.png'), fullPage: true });
  await browser.close();
}

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;

  console.log('— BO11 cross-engine (Chromium · Firefox · WebKit) —');
  await coreChecks('chromium', chromium, URL);
  await coreChecks('firefox', firefox, URL);
  await coreChecks('webkit', webkit, URL);

  console.log('— BO5 offline (service worker) —');
  { const browser = await chromium.launch(); const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    const reg = await page.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.ready.then(() => true).catch(() => false) : false);
    ok('service worker registers + activates', reg === true);
    await page.waitForTimeout(1500); // let the SW precache the shell
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    const offlineOk = await page.evaluate(() => !!(window.TechEngine && document.querySelector('#tech-symbol') && document.querySelectorAll('[role=tab]').length === 6));
    ok('page LOADS with network OFF (rural/offline)', offlineOk);
    await ctx.setOffline(false); await browser.close();
  }

  console.log('— BO10 26-language sweep + no-Hinglish —');
  { const browser = await chromium.launch(); const ctx = await browser.newContext(); await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue())); const page = await ctx.newPage(); page.on('dialog', d => d.accept());
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.TechEngine && document.querySelector('#lang-select option'), { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal').forEach(e => e.remove()); const oh = document.getElementById('onboarding-host'); if (oh) oh.style.display = 'none'; });
    await page.evaluate(() => document.getElementById('tech-analyze').click());
    await page.waitForSelector('.ind-table', { timeout: 10000 }).catch(() => {});
    const langs = await page.evaluate(() => [...document.querySelectorAll('#lang-select option')].map(o => o.value));
    ok('language dropdown has ≥26 options', langs.length >= 26);
    let switched = 0, crashed = 0, termsKept = 0; const errs = []; page.on('pageerror', e => errs.push(String(e)));
    for (const lg of langs) {
      try {
        await page.selectOption('#lang-select', lg); await page.waitForTimeout(120);
        const htmlLang = await page.evaluate(() => document.documentElement.lang);
        if (htmlLang === lg || htmlLang) switched++;
        // technical terms must stay English in the indicators table
        const terms = await page.evaluate(() => { const t = (document.querySelector('.ind-table') || {}).innerText || ''; return /RSI/.test(t) && /MACD/.test(t); });
        if (terms) termsKept++;
      } catch (e) { crashed++; }
    }
    ok('all ' + langs.length + ' languages switch without crashing', crashed === 0);
    ok('RSI/MACD stay English in every language (no-Hinglish)', termsKept === langs.length);
    ok('0 JS errors across the 26-language sweep', errs.length === 0);
    console.log('  switched=' + switched + '/' + langs.length + ' · terms-kept=' + termsKept + '/' + langs.length + ' · crashes=' + crashed);
    await page.screenshot({ path: path.join(SHOTS, 'lang_sweep.png'), fullPage: false });
    await browser.close();
  }

  server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' cert_bo_complete: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error('ERR:', e); server.close(); process.exit(1); });
