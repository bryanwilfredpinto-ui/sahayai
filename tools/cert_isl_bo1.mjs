// BO1 cert — Chitti ISL grammar (SOV) engine + demo. Drives the real UI at 375px.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_isl.html')).href;

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const codeErrors = [];
page.on('pageerror', e => { const s = String(e); if (/Failed to fetch|NetworkError|ERR_|load failed/i.test(s)) return; codeErrors.push(s); });

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1300);

ok('Grammar engine loaded (ChittiISLGrammar)', await page.evaluate(() => typeof window.ChittiISLGrammar === 'object' && typeof window.ChittiISLGrammar.gloss === 'function'));
ok('Exposed on window.Chitti.isl.gloss', await page.evaluate(() => !!(window.Chitti && window.Chitti.isl && typeof window.Chitti.isl.gloss === 'function')));

// Drive the demo: "I am going to school tomorrow" → TOMORROW ME SCHOOL GO
const demo = await page.evaluate(() => {
  const inp = document.getElementById('isl-gram-in');
  inp.value = 'I am going to school tomorrow';
  document.getElementById('isl-gram-go').click();
  return document.getElementById('isl-gram-out').textContent.replace(/\s+/g, ' ');
});
ok('Demo SOV: time-first + verb-last', /TOMORROW.*ME.*SCHOOL.*GO/.test(demo), `out="${demo.slice(0, 80)}"`);
ok('Demo shows honesty note (not certified ISL)', /not certified ISL/i.test(demo));

// Negation + WH via engine directly in-page
const neg = await page.evaluate(() => window.ChittiISLGrammar.gloss('You are not coming').glossString);
ok('Negation moved to end (YOU COME NOT)', neg === 'YOU COME NOT', neg);
const wh = await page.evaluate(() => window.ChittiISLGrammar.gloss('Where are you going?').glossString);
ok('WH moved to end (YOU GO WHERE)', wh === 'YOU GO WHERE', wh);

// Per-response widget hook on the demo card
ok('Grammar card has data-chitti-response', await page.evaluate(() => !!document.querySelector('[data-chitti-response="isl-grammar"]')));

// No horizontal overflow at 375px
const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
ok('No horizontal overflow at 375px', ov.s <= ov.c + 1, `scrollW=${ov.s} clientW=${ov.c}`);

ok('0 uncaught code errors', codeErrors.length === 0, codeErrors.join(' | ') || 'none');

await page.screenshot({ path: path.join(__dirname, 'cert_screenshots', 'chitti_isl_bo1_375.png'), fullPage: true });
await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
