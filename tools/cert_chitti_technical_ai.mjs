/* cert_chitti_technical_ai.mjs — Playwright visual + functional cert for Chitti Technicals.
 * Serves the repo locally, blocks the external backend (so the engine's honest DEMO data
 * renders — no fake "live"), verifies structure + the 4-channel verdict + Tip Shield + per-
 * response boxes, runs axe-core, and screenshots all 5 devices. Run: node tools/cert_chitti_technical_ai.mjs
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

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

let pass = 0, fail = 0; const fails = [];
function ok(n, c) { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } }

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port, URL = `http://localhost:${port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  // block the external backend → engine uses honest DEMO data, fast
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  // ignore resource-load failures from the deliberately-blocked backend / offline lang packs
  // (the page is DESIGNED to fall back to DEMO data offline) — only real JS errors count
  const errs = []; page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|ERR_ABORTED|net::/.test(m.text())) errs.push(m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  console.log('— SUBSTRATE GATES —');
  // G3: the User Disability Profile modal fires on first visit (chitti_a11y.js)
  const dpFired = await page.locator('#chitti-disability-profile-modal').count() > 0;
  ok('G3: Disability Profile modal fires on first visit', dpFired);
  // dismiss it so it doesn't intercept clicks during the functional cert
  await page.evaluate(() => {
    ['#chitti-disability-profile-modal', '.chitti-dp-modal', '#sebi-modal'].forEach(s => document.querySelectorAll(s).forEach(e => e.remove()));
    document.body.style.overflow = '';
  });

  console.log('— STRUCTURE (BO1) —');
  ok('skip link', await page.locator('a.skip').count() === 1);
  ok('single <h1>', await page.locator('h1').count() === 1);
  ok('role=main', await page.locator('main#main').count() === 1);
  ok('3 tabs', await page.locator('[role=tab]').count() === 3);
  ok('SEBI sticky bar present', await page.locator('#sebi-bar').count() === 1);
  ok('aria-live region', await page.locator('#tech-live[aria-live=polite]').count() === 1);
  ok('language #lang-select present', await page.locator('#lang-select').count() === 1);
  ok('symbol + mode selects populated', (await page.locator('#tech-symbol option').count()) > 5 && (await page.locator('#tech-mode option').count()) >= 3);
  ok('≥8 per-response boxes (widget anchors)', await page.locator('[data-chitti-response]').count() >= 8);

  console.log('— FUNCTIONAL VERDICT (BO6/BO7) —');
  await page.locator('#tech-analyze').click();
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
  ok('blind: "show data as table" present', await page.locator('details.data-table-wrap').count() === 1);

  console.log('— TIP SHIELD (BO8) —');
  await page.locator('#tab-tip').click();
  await page.locator('#tip-input').fill('Buy XYZ now! guaranteed double your money, sure-shot, no risk, join VIP telegram, pay ₹999');
  await page.locator('#tip-check').click();
  await page.waitForSelector('.tipres', { timeout: 4000 });
  ok('scam tip → HIGH risk class', await page.locator('.tip-high').count() === 1);
  ok('tip verdict says NOT telling you to buy', /not telling you to buy/i.test(await page.locator('#tip-host').innerText()));

  console.log('— AXE-CORE ACCESSIBILITY —');
  let axePath = null;
  try { axePath = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'); if (!fs.existsSync(axePath)) axePath = null; } catch (e) {}
  if (axePath) {
    await page.locator('#tab-read').click();
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
    const serious = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    ok('axe-core 0 serious/critical', serious.length === 0);
    if (serious.length) serious.forEach(v => console.log('    axe: ' + v.id + ' (' + v.impact + ') ×' + v.nodes.length));
  } else { console.log('  (axe-core not installed — accessibility scan AUTOMATION-LIMITED, flagged honestly)'); }

  ok('no console errors', errs.length === 0);
  if (errs.length) errs.slice(0, 5).forEach(e => console.log('    console: ' + e.slice(0, 120)));

  console.log('— SCREENSHOTS (5 devices) —');
  for (const d of DEVICES) {
    await page.setViewportSize({ width: d.w, height: d.h });
    await page.locator('#tab-read').click();
    await page.locator('#tech-analyze').click().catch(() => {});
    await page.waitForTimeout(400);
    const file = path.join(SHOTS, 'chitti_technical_ai_' + d.name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    ok('screenshot ' + d.name + ' (>8KB)', fs.existsSync(file) && fs.statSync(file).size > 8192);
  }

  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' cert_chitti_technical_ai: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
