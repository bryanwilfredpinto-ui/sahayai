/* verify_isl_autoattach.mjs — Task 1: ISL panel auto-attaches to EVERY
 * [data-chitti-response] box via chitti_a11y.js when ISL mode is on, and
 * is absent by default (no regression for non-ISL users). Mobile profile.
 * Run: node tools/verify_isl_autoattach.mjs   (optional arg: a base URL for LIVE)
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium, devices } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const LIVE = process.argv[2] || null;
const server = LIVE ? null : http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n); console.log('  ✗ ' + n); } };
const run = async () => {
  let URL;
  if (LIVE) URL = LIVE; else { await new Promise(r => server.listen(0, r)); URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`; }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 5'] });
  if (!LIVE) await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#tech-symbol option'), { timeout: 20000 }).catch(() => {});
  const dismiss = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); const ob = document.getElementById('onboarding-host'); if (ob) ob.style.display = 'none'; document.body.style.overflow = ''; });
  await dismiss();
  await page.evaluate(() => { const s = document.getElementById('tech-symbol'); if ([...s.options].some(o => o.value === 'RELIANCE')) { s.value = 'RELIANCE'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
  await dismiss();
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 25000 });
  await page.waitForTimeout(5000); await dismiss();

  // DEFAULT (ISL off): no auto panels, no regression
  const offCount = await page.evaluate(() => document.querySelectorAll('.chitti-isl-autobox').length);
  ok('default OFF — zero auto ISL panels (other products safe)', offCount === 0);
  ok('🤟 ISL toggle present', await page.locator('#chitti-isl-toggle').count() === 1);

  const boxCount = await page.evaluate(() => document.querySelectorAll('[data-chitti-response]').length);
  console.log('  [data-chitti-response] boxes on page:', boxCount);

  // turn ISL ON via the toggle (real user action)
  await page.evaluate(() => document.getElementById('chitti-isl-toggle').click());
  await page.waitForTimeout(800);
  const cov = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-chitti-response]')];
    const withPanel = boxes.filter(b => b.querySelector('.chitti-isl-autobox')).length;
    const sections = boxes.map(b => ({ sec: b.getAttribute('data-chitti-section') || '(none)', hasPanel: !!b.querySelector('.chitti-isl-autobox') }));
    return { total: boxes.length, withPanel, sections };
  });
  ok('ISL ON — EVERY [data-chitti-response] box has an auto ISL panel', cov.total > 0 && cov.withPanel === cov.total);
  console.log('  per-box ISL panel coverage:');
  cov.sections.forEach(s => console.log('    ' + (s.hasPanel ? '✓' : '✗') + ' ' + s.sec));

  // each panel actually rendered the ISL UI (region + Replay + fallback text)
  const panelOk = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('.chitti-isl-autobox')];
    return ps.length && ps.every(p => p.querySelector('.chitti-isl-panel[role=region]') && p.querySelector('.chitti-isl-replay') && /ISL:/.test((p.querySelector('.chitti-isl-fallback') || {}).innerText || ''));
  });
  ok('each ISL panel renders region + Replay + lossless letters', panelOk);

  // Replay plays a panel (fingerspell animates) without error
  const played = await page.evaluate(async () => {
    const p = document.querySelector('.chitti-isl-autobox'); const stage = p.querySelector('.chitti-isl-stage');
    p.querySelector('.chitti-isl-replay').click();
    await new Promise(r => setTimeout(r, 700));
    return !!(stage.getAttribute('data-isl-letter') || '').trim();
  });
  ok('Replay animates fingerspelling on a per-box panel', played);

  // toggle OFF removes them all (clean)
  await page.evaluate(() => document.getElementById('chitti-isl-toggle').click());
  await page.waitForTimeout(500);
  ok('toggle OFF removes all auto ISL panels', await page.evaluate(() => document.querySelectorAll('.chitti-isl-autobox').length) === 0);

  // REGRESSION: G1 verdict ISL button still present + works
  ok('G1 regression — #vh-isl verdict button still present', await page.locator('#vh-isl').count() === 1);

  ok('no page errors', errs.length === 0);
  if (errs.length) errs.slice(0, 4).forEach(e => console.log('    err: ' + e));
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' verify_isl_autoattach (' + (LIVE ? 'LIVE ' + LIVE : 'local') + '): ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\n   FAILED: ' + fails.join(' · ') : ''));
  await browser.close(); if (server) server.close();
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); if (server) server.close(); process.exit(1); });
