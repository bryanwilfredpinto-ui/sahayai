// BO11 cert — Chitti Jobs: Kanban pipeline board, 0 JS errors, sticky disclaimer,
// ← Vaani (substrate-injected), 375px clean even with a full board of cards.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_jobs.html')).href;

const results = [];
const ok = (n, c, d = '') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1600); // let substrate inject ← Vaani

// Gate 1 — 0 uncaught JS errors on load
ok('0 uncaught JS errors on load', pageErrors.length === 0, pageErrors.join(' | ') || 'none');

// Gate 2 — ← Vaani present near top (substrate-injected)
const back = await page.evaluate(() => {
  const b = document.querySelector('a[data-chitti-vaani-back], header a[href*="chitti_vaani"]');
  if (!b) return { ok: false };
  const r = b.getBoundingClientRect();
  return { ok: r.top < 150 && r.height > 0, text: b.textContent.trim(), href: b.getAttribute('href'), h: Math.round(r.height) };
});
ok('← Vaani present near top', back.ok, `text="${back.text}" href=${back.href} h=${back.h}px`);
ok('← Vaani tap target >= 44px', back.h >= 44, `${back.h}px`);

// Gate 3 — sticky disclaimer bar
const disc = await page.evaluate(() => {
  const d = document.querySelector('.jobs-bar');
  if (!d) return { ok: false };
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  return { ok: cs.position === 'sticky' && r.height > 0, pos: cs.position, h: Math.round(r.height) };
});
ok('Sticky disclaimer bar (sticky)', disc.ok, `position=${disc.pos} h=${disc.h}px`);

// Gate 4 — BO11 structure: board container + view toggle present
const struct = await page.evaluate(() => ({
  board: !!document.getElementById('pipeline-board'),
  list: !!document.getElementById('pipeline-list'),
  tBoard: !!document.getElementById('view-board'),
  tList: !!document.getElementById('view-list'),
  hasRender: typeof window === 'object' && typeof renderKanban === 'function',
}));
ok('BO11 board + toggle markup present', struct.board && struct.list && struct.tBoard && struct.tList, JSON.stringify(struct));
ok('renderKanban() function defined', struct.hasRender, String(struct.hasRender));

// Gate 5 — render a FULL board of fake apps across all stages, on the active pipeline panel
const kan = await page.evaluate(() => {
  // activate the pipeline tab so the panel is visible
  const tab = document.querySelector('.tab[data-tab="pipeline"]');
  if (tab) tab.click();
  document.getElementById('view-board').click(); // board view
  const stages = ['found', 'reviewed', 'applied', 'replied', 'interview', 'offer', 'rejected'];
  const apps = [];
  let id = 1;
  for (const s of stages) for (let k = 0; k < 3; k++) {
    apps.push({ id: 'a' + (id++), status: s, job: { title: 'Senior Data Engineer ' + id, company: 'Acme Corp Pvt Ltd', location: 'Bengaluru' } });
  }
  renderKanban(apps);
  const cols = document.querySelectorAll('#pipeline-board .kcol');
  const cards = document.querySelectorAll('#pipeline-board .kcard');
  const kb = document.querySelector('#pipeline-board .kanban');
  const overflowX = kb ? getComputedStyle(kb).overflowX : 'none';
  const de = document.documentElement;
  return { cols: cols.length, cards: cards.length, overflowX, scrollW: de.scrollWidth, clientW: de.clientWidth };
});
ok('Kanban renders 7 stage columns', kan.cols === 7, `cols=${kan.cols}`);
ok('Kanban renders all 21 cards', kan.cards === 21, `cards=${kan.cards}`);
ok('Board scrolls internally (overflow-x auto)', kan.overflowX === 'auto', `overflow-x=${kan.overflowX}`);
ok('No page horizontal overflow at 375px (full board)', kan.scrollW <= kan.clientW + 1, `scrollW=${kan.scrollW} clientW=${kan.clientW}`);

// Gate 6 — toggle switches Board <-> List
const toggle = await page.evaluate(() => {
  document.getElementById('view-list').click();
  const listShown = !document.getElementById('pipeline-list').hidden && document.getElementById('pipeline-board').hidden;
  document.getElementById('view-board').click();
  const boardShown = !document.getElementById('pipeline-board').hidden && document.getElementById('pipeline-list').hidden;
  return { listShown, boardShown };
});
ok('View toggle Board <-> List works', toggle.listShown && toggle.boardShown, JSON.stringify(toggle));

const shotDir = path.join(__dirname, 'cert_screenshots');
await page.evaluate(() => { const t = document.querySelector('.tab[data-tab="pipeline"]'); if (t) t.click(); });
await page.screenshot({ path: path.join(shotDir, 'chitti_jobs_bo11_375.png'), fullPage: true });

await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c ? '✅' : '❌'}  ${r.n}${r.d ? '  — ' + r.d : ''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
