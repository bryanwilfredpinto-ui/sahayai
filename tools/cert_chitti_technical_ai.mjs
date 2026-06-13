/* cert_chitti_technical_ai.mjs — Playwright visual + functional cert for Chitti Technicals.
 * Serves the repo locally, blocks the external backend (so the engine's honest DEMO data
 * renders — no fake "live"), verifies structure + the 4-channel verdict + Tip Shield + per-
 * response boxes, runs axe-core, and screenshots all 5 devices.
 *
 * G3 (2026-06-13): runs the full 30-check suite on Chromium + Firefox + WebKit (Art. 2 —
 * Access First is not done until all three engines pass) and emits per-engine results.
 * The disability-profile modal (chitti_disability_profile.js, z-index 99998, injected by a
 * dynamically-loaded script) is waited-for then removed right before the real analyze click —
 * a real user dismisses it first; without the wait, the modal re-injects after an early
 * removal and intercepts the pointer click (this was the latent Chromium hang).
 * Run: node tools/cert_chitti_technical_ai.mjs
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, firefox, webkit } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html';
  const fp = path.join(ROOT, f);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

const DEVICES = [
  { name: 'desktop_1920x1080', w: 1920, h: 1080 },
  { name: 'laptop_1366x768', w: 1366, h: 768 },
  { name: 'ipad_810x1080', w: 810, h: 1080 },
  { name: 'iphone_390x844', w: 390, h: 844 },
  { name: 'android_360x800', w: 360, h: 800 }
];
const ENGINES = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]];

// Wait for the first-visit disability modal (dynamically injected) then remove it +
// the SEBI / feedback overlays, exactly as a real user dismissing the profile would.
async function dismiss(page) {
  await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 2500 }).catch(() => {});
  await page.evaluate(() => {
    ['#chitti-disability-profile-modal', '.chitti-dp-modal', '.chitti-fb-modal-bg', '#sebi-modal'].forEach(s => document.querySelectorAll(s).forEach(e => e.remove()));
    document.body.style.overflow = '';
  });
}

async function runEngine(engineName, launcher, URL) {
  let pass = 0, fail = 0; const fails = [];
  const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ [' + engineName + '] ' + n); } };
  const browser = await launcher.launch();
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  // Ignore the deliberately-blocked-backend noise — phrasings differ per engine
  // (Chromium "Failed to load resource"/"net::", Firefox "Failed to load '<url>'"/
  // "Cross-Origin Request Blocked", WebKit variants). Only real JS errors count.
  const IGNORE = /Failed to load|Cross-Origin Request Blocked|ERR_FAILED|ERR_ABORTED|net::|NetworkError|chitti-shares-api|railway\.app/i;
  const errs = []; page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  page.on('dialog', d => d.accept());

  await page.goto(URL, { waitUntil: 'networkidle' });

  console.log('— [' + engineName + '] SUBSTRATE GATES —');
  // chitti_disability_profile.js is dynamically injected; Firefox can resolve the
  // deferred chain after networkidle, so wait for the modal rather than snapshot it.
  const modalFired = await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 5000 }).then(() => true).catch(() => false);
  ok('G3: Disability Profile modal fires on first visit', modalFired);
  await dismiss(page);

  console.log('— [' + engineName + '] STRUCTURE (BO1) —');
  ok('skip link', await page.locator('a.skip').count() === 1);
  ok('single <h1>', await page.locator('h1').count() === 1);
  ok('role=main', await page.locator('main#main').count() === 1);
  ok('6 tabs (read/screener/watchlist/backtest/tip/journal)', await page.locator('[role=tab]').count() === 6);
  ok('SEBI sticky bar present', await page.locator('#sebi-bar').count() === 1);
  ok('aria-live region', await page.locator('#tech-live[aria-live=polite]').count() === 1);
  ok('language #lang-select present', await page.locator('#lang-select').count() === 1);
  ok('symbol + mode selects populated', (await page.locator('#tech-symbol option').count()) > 5 && (await page.locator('#tech-mode option').count()) >= 3);
  ok('≥8 per-response boxes (widget anchors)', await page.locator('[data-chitti-response]').count() >= 8);

  console.log('— [' + engineName + '] FUNCTIONAL VERDICT (BO6/BO7) —');
  await dismiss(page); // re-kill the modal in case it injected after the first removal
  await page.locator('#tech-analyze').click({ timeout: 10000 });
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });
  const word = (await page.locator('.vh-word').first().innerText()).trim();
  ok('verdict word renders (BUY/SELL/WAIT)', /BUY|SELL|WAIT|HOLD/.test(word));
  ok('icon+SHAPE present (non-colour)', /[▲■▼]/.test(await page.locator('.vh-shape').first().innerText()));
  ok('confidence shown', /\d+%/.test(await page.locator('.vh-sub').first().innerText()));
  ok('"most traders lose" honesty rail', (await page.locator('.tech-rail').count()) >= 1 && /most short-term traders lose/i.test(await page.locator('.tech-rail').first().innerText()));
  ok('NOT SEBI on verdict', /NOT SEBI/i.test(await page.locator('#verdict-host').innerText()));
  ok('gauge rating renders', await page.locator('.gauge-label').count() === 1);
  ok('vote tally renders', /say BUY|say SELL/i.test(await page.locator('#votes-host').innerText()));
  ok('mood dial renders', await page.locator('.mood-word').count() === 1);
  ok('pros/cons reasons render', (await page.locator('#reasons-host .pros').count()) === 1);
  ok('listen (audio channel) button', await page.locator('#vh-listen').count() === 1);
  ok('🤟 ISL four-channel button present', await page.locator('#vh-isl').count() === 1);
  ok('blind: "show data as table" present', await page.locator('details.data-table-wrap').count() === 1);

  console.log('— [' + engineName + '] TIP SHIELD (BO8) —');
  await page.locator('#tab-tip').click();
  await page.locator('#tip-input').fill('Buy XYZ now! guaranteed double your money, sure-shot, no risk, join VIP telegram, pay ₹999');
  await page.locator('#tip-check').click();
  await page.waitForSelector('.tipres', { timeout: 4000 });
  ok('scam tip → HIGH risk class', await page.locator('.tip-high').count() === 1);
  ok('tip verdict says NOT telling you to buy', /not telling you to buy/i.test(await page.locator('#tip-host').innerText()));

  console.log('— [' + engineName + '] AXE-CORE ACCESSIBILITY —');
  let axePath = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
  if (fs.existsSync(axePath)) {
    await page.locator('#tab-read').click();
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
    const serious = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    ok('axe-core 0 serious/critical', serious.length === 0);
    if (serious.length) serious.forEach(v => console.log('    [' + engineName + '] axe: ' + v.id + ' (' + v.impact + ') ×' + v.nodes.length));
  } else { console.log('  (axe-core not installed — accessibility scan AUTOMATION-LIMITED, flagged honestly)'); }

  ok('no console errors', errs.length === 0);
  if (errs.length) errs.slice(0, 5).forEach(e => console.log('    [' + engineName + '] console: ' + e.slice(0, 120)));

  console.log('— [' + engineName + '] SCREENSHOTS (5 devices) —');
  for (const d of DEVICES) {
    await page.setViewportSize({ width: d.w, height: d.h });
    await page.locator('#tab-read').click();
    await dismiss(page);
    await page.locator('#tech-analyze').click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
    const file = path.join(SHOTS, 'chitti_technical_ai_' + engineName + '_' + d.name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    ok('screenshot ' + d.name + ' (>8KB)', fs.existsSync(file) && fs.statSync(file).size > 8192);
  }

  await browser.close();
  console.log((fail === 0 ? '  ✅' : '  ❌') + ' [' + engineName + '] ' + pass + '/' + (pass + fail) + ' passed.');
  return { engineName, pass, fail, fails };
}

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port, URL = `http://localhost:${port}/chitti_technical_ai.html`;
  const results = [];
  for (const [name, launcher] of ENGINES) {
    try { results.push(await runEngine(name, launcher, URL)); }
    catch (e) { console.log('  ❌ [' + name + '] ENGINE THREW: ' + String(e.message || e).slice(0, 120)); results.push({ engineName: name, pass: 0, fail: 1, fails: ['engine threw: ' + String(e.message || e).slice(0, 80)] }); }
  }
  server.close();
  const totalFail = results.reduce((s, r) => s + r.fail, 0);
  console.log('\n══ cert_chitti_technical_ai — cross-engine summary ══');
  results.forEach(r => console.log('  ' + (r.fail === 0 ? '✅' : '❌') + ' ' + r.engineName + ': ' + r.pass + '/' + (r.pass + r.fail) + (r.fails.length ? ' · FAILED: ' + r.fails.join(' · ') : '')));
  console.log('\n' + (totalFail === 0 ? '✅' : '❌') + ' cert_chitti_technical_ai: ' + (totalFail === 0 ? 'GREEN on Chromium + Firefox + WebKit' : totalFail + ' check(s) failed across engines') + '.');
  process.exit(totalFail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
