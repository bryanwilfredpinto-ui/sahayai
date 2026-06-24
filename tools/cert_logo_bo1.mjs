// BO1 cert — Chitti Logo & Video: ?from=vaani handoff prefills the brand field + ← Vaani back.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = pathToFileURL(path.join(__dirname, '..', 'chitti_logo_video.html')).href;
// Vaani handoff payload: base64 of {content:"Saraswati Kirana"} (substrate convention)
const payload = Buffer.from(JSON.stringify({ content: 'Saraswati Kirana' }), 'utf8').toString('base64');
const PAGE = base + '?from=vaani&input=' + encodeURIComponent(payload);

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const codeErrors = [];
page.on('pageerror', e => { const s = String(e); if (/Failed to fetch|NetworkError|ERR_|load failed/i.test(s)) return; codeErrors.push(s); });

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1500);

// brand field prefilled from the Vaani payload
const brand = await page.evaluate(() => (document.getElementById('brand') || {}).value);
ok('Brand field prefilled from Vaani payload', brand === 'Saraswati Kirana', `brand="${brand}"`);

// visible "opened from Vaani" note
ok('Shows "opened from Vaani" prefill note', await page.evaluate(() => !!document.getElementById('vaani-prefill-note')));

// ← Vaani back control present (substrate back-to-vaani-btn OR data-chitti-vaani-back)
const back = await page.evaluate(() => {
  const b = document.getElementById('back-to-vaani-btn') || document.querySelector('a[data-chitti-vaani-back]');
  if (!b) return { ok: false };
  const r = b.getBoundingClientRect();
  return { ok: r.height > 0, text: b.textContent.trim(), h: Math.round(r.height) };
});
ok('← Vaani back control present', back.ok, `text="${back.text}" h=${back.h}px`);
ok('← Vaani tap target >= 44px', back.h >= 44, `${back.h}px`);

// Real-world: Vaani passes the RAW sentence, not a pre-isolated name. The page must
// extract the brand (drop command/filler words) rather than dump the whole sentence.
const sentencePayload = Buffer.from(JSON.stringify({ content: 'logo banao mere Sharma General Store ka', lang: 'hi' }), 'utf8').toString('base64');
const sent = await ctx.newPage();
await sent.goto(base + '?from=vaani&input=' + encodeURIComponent(sentencePayload), { waitUntil: 'load' });
await sent.waitForTimeout(1200);
const sbrand = await sent.evaluate(() => (document.getElementById('brand') || {}).value);
ok('Extracts brand from a raw command sentence (drops "logo"/"banao")', /sharma/i.test(sbrand) && !/\b(logo|banao)\b/i.test(sbrand), `brand="${sbrand}"`);

// Negative control: WITHOUT ?from=vaani, brand keeps its own default (no spurious prefill note)
const plain = await ctx.newPage();
await plain.goto(base, { waitUntil: 'load' });
await plain.waitForTimeout(800);
ok('No prefill note when not from Vaani', await plain.evaluate(() => !document.getElementById('vaani-prefill-note')));

// no overflow + 0 code errors
const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
ok('No horizontal overflow at 375px', ov.s <= ov.c + 1, `scrollW=${ov.s} clientW=${ov.c}`);
ok('0 uncaught code errors', codeErrors.length === 0, codeErrors.join(' | ') || 'none');

await page.screenshot({ path: path.join(__dirname, 'cert_screenshots', 'chitti_logo_bo1_375.png'), fullPage: true });
await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
