// BO1 cert — Chitti News AI: ← Vaani button in HEADER, 0 JS errors, sticky disclaimer, 375px clean.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(__dirname, '..', 'chitti_news_ai.html')).href;

const results = [];
const ok = (n, c, d='') => results.push({ n, c, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(1500); // let substrates init

// Gate 1 — 0 uncaught JS errors on load
ok('0 uncaught JS errors on load', pageErrors.length === 0, pageErrors.join(' | ') || 'none');

// Gate 2 — ← Vaani button lives INSIDE <header>, not in the ⋯ menu
const backInHeader = await page.evaluate(() => {
  const b = document.querySelector('header .hdr-back');
  if (!b) return { ok:false, reason:'no .hdr-back in header' };
  const inMenu = !!document.querySelector('.hdr-more-menu a[href="chitti_vaani.html"]');
  const r = b.getBoundingClientRect();
  return { ok: !!b && !inMenu, text:b.textContent.trim(), href:b.getAttribute('href'),
           h:Math.round(r.height), visible:r.height>0 && r.width>0, stillInMenu:inMenu };
});
ok('← Vaani button in HEADER (not menu)', backInHeader.ok,
   `text="${backInHeader.text}" href=${backInHeader.href} h=${backInHeader.h}px visible=${backInHeader.visible} stillInMenu=${backInHeader.stillInMenu}`);

// Gate 3 — tap target >= 44px
ok('← Vaani tap target >= 44px', backInHeader.h >= 44, `${backInHeader.h}px`);

// Gate 4 — sticky disclaimer bar present & visible at top
const disc = await page.evaluate(() => {
  const d = document.getElementById('cnai-disclaimer-bar');
  if (!d) return { ok:false };
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  return { ok: cs.position==='sticky' && r.height>0, pos:cs.position, top:r.top, h:Math.round(r.height) };
});
ok('Sticky disclaimer bar visible', disc.ok, `position=${disc.pos} top=${disc.top} h=${disc.h}px`);

// Gate 5 — no horizontal overflow at 375px
const overflow = await page.evaluate(() => {
  const de = document.documentElement;
  return { scrollW: de.scrollWidth, clientW: de.clientWidth };
});
ok('No horizontal overflow at 375px', overflow.scrollW <= overflow.clientW + 1,
   `scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);

// Gate 6 — header back button actually navigates to Vaani
ok('Back button href = chitti_vaani.html', backInHeader.href === 'chitti_vaani.html', backInHeader.href);

const shotDir = path.join(__dirname, 'cert_screenshots');
await page.screenshot({ path: path.join(shotDir, 'chitti_news_ai_bo1_375.png') });

await browser.close();

let pass = 0;
for (const r of results) { console.log(`${r.c?'✅':'❌'}  ${r.n}${r.d?'  — '+r.d:''}`); if (r.c) pass++; }
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
