// BO5 cert — Chitti News AI 60-day certification coach. Drives the real UI at 375px.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_news_ai.html')).href;

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const codeErrors = [];
page.on('pageerror', e => { const s = String(e); if (/Failed to fetch|NetworkError|ERR_|load failed/i.test(s)) return; codeErrors.push(s); });

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1600);

ok('Engine loaded (CnaiCertCoach)', await page.evaluate(() => typeof window.CnaiCertCoach === 'object' && typeof window.CnaiCertCoach.build === 'function'));

// open the 60-Day Coach tab, build a plan for "teacher"
const built = await page.evaluate(() => {
  try { localStorage.removeItem('cnai_cert_coach_v1'); } catch (e) {}
  cnaiLearnTab('cert');
  const panel = document.getElementById('cert-section');
  document.getElementById('cert-input').value = 'teacher';
  document.getElementById('cert-go').click();
  const txt = document.getElementById('cert-content').textContent;
  return {
    panelShown: panel && panel.style.display !== 'none',
    has60: /\/\s*60|60-day|of 60|\/ 60/.test(txt),
    hasDay1: /Day 1\b/.test(txt),
    hasPhases: /Foundations/.test(txt) && /Exam-ready/.test(txt),
    hasCert: /Microsoft|Education|certification/i.test(txt)
  };
});
ok('60-Day Coach tab opens panel', built.panelShown, JSON.stringify(built));
ok('Builds a 60-day plan (Day 1 + phases)', built.has60 && built.hasDay1 && built.hasPhases);

// mark Day 1 done → streak increments, next day advances
const advanced = await page.evaluate(() => {
  document.getElementById('cert-done-btn').click();
  const txt = document.getElementById('cert-content').textContent;
  return { streak1: /streak 1\b/.test(txt), day2: /Day 2 \/ 60|Day 2\b/.test(txt) };
});
ok('Mark done → streak 1 + advances to Day 2', advanced.streak1 && advanced.day2, JSON.stringify(advanced));

// per-response widget hook + plan persists across reload
ok('Plan card has data-chitti-response', await page.evaluate(() => !!document.querySelector('[data-chitti-response="cert-plan"]')));
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(1200);
const persisted = await page.evaluate(() => {
  cnaiLearnTab('cert');
  return /streak 1\b|1\/60/.test(document.getElementById('cert-content').textContent);
});
ok('Plan + progress persists across reload', persisted);

// engine correctness in-page
ok('engine: build has 60 days', await page.evaluate(() => window.CnaiCertCoach.build('X', 'teacher').days.length === 60));
ok('engine: free-cert, never sits exam (note present)', await page.evaluate(() => /never|teaches/i.test(window.CnaiCertCoach.build('X').note)));

// no overflow + 0 code errors
const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
ok('No horizontal overflow at 375px', ov.s <= ov.c + 1, `scrollW=${ov.s} clientW=${ov.c}`);
ok('0 uncaught code errors', codeErrors.length === 0, codeErrors.join(' | ') || 'none');

await page.evaluate(() => cnaiLearnTab('cert'));
await page.screenshot({ path: path.join(__dirname, 'cert_screenshots', 'chitti_news_ai_bo5_375.png'), fullPage: true });
await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
