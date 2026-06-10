/* test_sop_ui.mjs — UI proof for SOP 1/5/8: the Primary/Alternative/Invalidation card + volume note
 * render on every verdict, and the journal reflection form captures the 4 SOP-8 fields. Screenshots.
 * Backend blocked (DEMO, deterministic). Run: node tools/test_sop_ui.mjs
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
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const oh = document.getElementById('onboarding-host'); if (oh) oh.style.display = 'none'; document.body.style.overflow = ''; });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ChittiTechApp && document.querySelector('#tech-symbol'), { timeout: 12000 }).catch(() => {});
  await dp(); await page.waitForTimeout(500);
  await page.selectOption('#tech-symbol', 'RELIANCE').catch(() => {});
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 12000 }); await page.waitForTimeout(800);

  // SOP 5 — views card
  ok('SOP5: Primary view renders', await page.locator('#views-host .view-primary').count() === 1);
  ok('SOP5: Alternative view renders', await page.locator('#views-host .view-alt').count() === 1);
  ok('SOP5: Invalidation renders', await page.locator('#views-host .view-inval').count() === 1);
  // SOP 1 — volume note in the views card
  ok('SOP1: Volume check shown on the verdict', await page.locator('#views-host .view-vol').count() === 1 && /Volume/.test(await page.locator('#views-host .view-vol').innerText()));
  await page.locator('#views-host').scrollIntoViewIfNeeded();
  await page.locator('#views-host').screenshot({ path: path.join(SHOTS, 'sop5_views.png') }).catch(() => {});

  // SOP 8 — log a paper trade programmatically, then drive the reflection FORM through the UI
  await page.evaluate(() => { window.ChittiTechJournal.logPaperTrade({ symbol: 'RELIANCE', mode: 'longterm', side: 'BUY', entry: 1280, quantity: 10, stop: 1240, target: 1340 }); window.ChittiTechApp.selectTab('tab-journal'); window.ChittiTechApp.renderJournal(); });
  await dp(); await page.waitForSelector('.jrnl-reflect', { timeout: 6000 });
  ok('SOP8: journal shows a Reflect button', await page.locator('.jrnl-reflect').count() >= 1);
  await page.evaluate(() => document.querySelector('.jrnl-reflect').click());
  await page.waitForSelector('.reflect-form', { timeout: 5000 });
  ok('SOP8: reflection form has all 4 fields', await page.locator('#rf-emotion').count() === 1 && await page.locator('#rf-mistake').count() === 1 && await page.locator('#rf-lesson').count() === 1 && await page.locator('#rf-improve').count() === 1);
  await page.selectOption('#rf-emotion', { label: 'FOMO' }).catch(() => {});
  await page.selectOption('#rf-mistake', { label: 'No volume confirmation' }).catch(() => {});
  await page.fill('#rf-lesson', 'I entered without volume confirmation.');
  await page.fill('#rf-improve', 'Wait for volume ≥ 20-bar average next time.');
  await page.locator('.reflect-form').screenshot({ path: path.join(SHOTS, 'sop8_reflect_form.png') }).catch(() => {});
  await page.evaluate(() => document.getElementById('rf-save').click());
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => { const t = window.ChittiTechJournal.trades().slice(-1)[0]; return { lesson: t.lesson, mistake: t.mistake_category, emotion: t.emotion, improve: t.improvement }; });
  ok('SOP8: reflection persisted (lesson)', /without volume/.test(saved.lesson || ''));
  ok('SOP8: reflection persisted (mistake category)', saved.mistake === 'No volume confirmation');
  ok('SOP8: reflection persisted (emotional state)', saved.emotion === 'FOMO');
  ok('SOP8: reflection persisted (improvement action)', /20-bar/.test(saved.improve || ''));
  ok('SOP8: journal displays the saved reflection', /Lesson/.test(await page.locator('#journal-host').innerText()));
  await page.locator('#journal-host').screenshot({ path: path.join(SHOTS, 'sop8_journal_saved.png') }).catch(() => {});

  ok('0 JS page errors', errs.length === 0); if (errs.length) errs.slice(0, 3).forEach(e => console.log('    ' + e.slice(0, 110)));
  await browser.close(); server.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' test_sop_ui: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
