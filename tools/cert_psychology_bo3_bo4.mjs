// BO3/BO4 cert — Chitti Psychology: mood 7-day trend + CBT reframer. Drives the real UI at 375px.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_psychology.html')).href;

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const codeErrors = [];
page.on('pageerror', e => { const s = String(e); if (/Failed to fetch|NetworkError|ERR_|load failed/i.test(s)) return; codeErrors.push(s); });

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1400);

ok('Engine loaded (ChittiPsychologyEngine)', await page.evaluate(() => typeof window.ChittiPsychologyEngine === 'object'));

// BO3 — log 4 days incl. 3 consecutive low → trend + SOP-05 escalation
const trend = await page.evaluate(() => {
  localStorage.setItem('chitti_ps_mood_v1', JSON.stringify([
    { date: 'd1', score: 4 }, { date: 'd2', score: 2 }, { date: 'd3', score: 1 }, { date: 'd4', score: 2 }
  ]));
  document.getElementById('mood-trend').click();
  const t = document.getElementById('mood-out').textContent;
  return { hasTrend: /average/i.test(t), escalated: /trained person/i.test(t), helpline: /14416|1098|181/.test(t) };
});
ok('BO3 mood trend renders (avg + direction)', trend.hasTrend, JSON.stringify(trend));
ok('BO3 SOP-05: 3 low days → gentle helpline offer', trend.escalated && trend.helpline);

// BO3 — mood emoji + save works
const save = await page.evaluate(() => {
  document.querySelector('.mood-emo[data-score="4"]').click();
  document.getElementById('mood-save').click();
  return /सेव|Saved|saved/i.test(document.getElementById('mood-out').textContent);
});
ok('BO3 mood save (emoji → save today)', save);

// BO4 — CBT reframe names distortion + 3 perspectives
const cbt = await page.evaluate(() => {
  document.getElementById('cbt-in').value = 'I always fail at everything and everyone thinks I am stupid';
  document.getElementById('cbt-go').click();
  const out = document.getElementById('cbt-out');
  const txt = out.textContent;
  const lis = out.querySelectorAll('ul li').length;
  return { hasDistortion: out.querySelectorAll('.em').length > 0, perspectives: lis, hasQuestion: /What else could be true/i.test(txt) };
});
ok('BO4 CBT names a distortion', cbt.hasDistortion, JSON.stringify(cbt));
ok('BO4 CBT gives exactly 3 perspectives', cbt.perspectives === 3, `li=${cbt.perspectives}`);
ok('BO4 CBT asks a Socratic question', cbt.hasQuestion);

// Crisis safety still present (sticky FAB + Tele-MANAS in page)
ok('Crisis FAB + Tele-MANAS 14416 present', await page.evaluate(() => !!document.getElementById('crisis-fab') && /14416/.test(document.body.textContent)));

// New cards carry per-response widget hooks
ok('BO3/BO4 cards have data-chitti-response', await page.evaluate(() => !!document.querySelector('[data-chitti-response="ps-mood"]') && !!document.querySelector('[data-chitti-response="ps-cbt"]')));

// No horizontal overflow at 375px
const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
ok('No horizontal overflow at 375px', ov.s <= ov.c + 1, `scrollW=${ov.s} clientW=${ov.c}`);

// 0 code errors
ok('0 uncaught code errors', codeErrors.length === 0, codeErrors.join(' | ') || 'none');

await page.screenshot({ path: path.join(__dirname, 'cert_screenshots', 'chitti_psychology_bo3_bo4_375.png'), fullPage: true });
await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
