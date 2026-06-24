// BO3 cert — Chitti MedUPI drug-interaction checker. Drives the real UI at 375px.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_medupi.html')).href;

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const codeErrors = [];
page.on('pageerror', e => {
  const s = String(e);
  // Ignore environmental network failures from background substrates under file://
  if (/Failed to fetch|NetworkError|ERR_|load failed/i.test(s)) return;
  codeErrors.push(s);
});

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1500);

// Gate 1 — engine present
const hasEngine = await page.evaluate(() => typeof window.MedupiInteractions === 'object' && typeof window.MedupiInteractions.check === 'function');
ok('Interaction engine loaded (window.MedupiInteractions)', hasEngine);

// Gate 2 — Interactions tab switches panel active
const tab = await page.evaluate(() => {
  const btn = document.querySelector('nav.tabs .tab[data-tab="interactions"]');
  if (!btn) return { ok: false };
  showTab('interactions');
  const panel = document.getElementById('tab-interactions');
  return { ok: !!btn && panel && panel.classList.contains('active'), label: btn.textContent.trim() };
});
ok('Interactions tab present + activates', tab.ok, `label="${tab.label}"`);

// Gate 3 — drive UI: add Warfarin + Aspirin, check → SEVERE bleeding shown
const severe = await page.evaluate(() => {
  document.getElementById('ddi-input').value = 'Warfarin'; ddiAdd();
  document.getElementById('ddi-input').value = 'Aspirin'; ddiAdd();
  ddiCheck();
  const r = document.getElementById('ddi-results');
  const txt = r.textContent;
  const card = r.querySelector('[data-chitti-response^="ddi-"]');
  return { hasStop: txt.includes('⛔'), hasSevere: /SEVERE/i.test(txt), hasWidget: !!card, mentions: /warfarin/i.test(txt) && /aspirin/i.test(txt) };
});
ok('Warfarin+Aspirin → ⛔ SEVERE rendered', severe.hasStop && severe.hasSevere, JSON.stringify(severe));
ok('Interaction card has per-response widget hook', severe.hasWidget);
ok('Both medicines named in result', severe.mentions);

// Gate 4 — honest negative: clear, add safe combo → "no known interaction" + disclaimer
const safe = await page.evaluate(() => {
  ddiClear();
  document.getElementById('ddi-input').value = 'Paracetamol'; ddiAdd();
  document.getElementById('ddi-input').value = 'Cetirizine'; ddiAdd();
  ddiCheck();
  const txt = document.getElementById('ddi-results').textContent;
  return { noFound: /No known major interaction/i.test(txt), notSafe: /does NOT mean|not (a )?clearance|not mean a combination is safe/i.test(txt) };
});
ok('Safe combo → honest "no known interaction"', safe.noFound, JSON.stringify(safe));
ok('Honest-empty states NOT a safety clearance', safe.notSafe);

// Gate 5 — sticky medical disclaimer present
const disc = await page.evaluate(() => {
  const d = document.querySelector('.med-bar');
  if (!d) return { ok: false };
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  return { ok: (cs.position === 'sticky' || cs.position === 'fixed') && r.height > 0, pos: cs.position };
});
ok('Sticky medical disclaimer (.med-bar)', disc.ok, `position=${disc.pos}`);

// Gate 6 — no horizontal overflow at 375px (results rendered)
const overflow = await page.evaluate(() => {
  showTab('interactions');
  document.getElementById('ddi-input').value = 'Ramipril'; ddiAdd();
  document.getElementById('ddi-input').value = 'Spironolactone'; ddiAdd();
  ddiCheck();
  const de = document.documentElement;
  return { scrollW: de.scrollWidth, clientW: de.clientWidth };
});
ok('No horizontal overflow at 375px', overflow.scrollW <= overflow.clientW + 1, `scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);

// Gate 7 — 0 uncaught CODE errors (network failures ignored)
ok('0 uncaught code errors on load + interaction', codeErrors.length === 0, codeErrors.join(' | ') || 'none');

const shotDir = path.join(__dirname, 'cert_screenshots');
await page.evaluate(() => { ddiClear(); document.getElementById('ddi-input').value='Warfarin'; ddiAdd(); document.getElementById('ddi-input').value='Aspirin'; ddiAdd(); document.getElementById('ddi-input').value='Sildenafil'; ddiAdd(); document.getElementById('ddi-input').value='Isosorbide Mononitrate'; ddiAdd(); ddiCheck(); });
await page.screenshot({ path: path.join(shotDir, 'chitti_medupi_bo3_375.png'), fullPage: true });

await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
