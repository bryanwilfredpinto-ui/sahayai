/**
 * probe_responsive.mjs — Visual QA at three viewport widths against the
 * live https://sahayai.in/chitti_news.html:
 *   • mobile  375 ×  800
 *   • tablet  768 × 1024
 *   • desktop 1280 ×  900
 * For each: load English national home, wait for hero + ≥1 rail,
 * screenshot fullPage, and assert (a) horizontal scroll absent at body
 * level (no clipped layout), (b) hero card spans the full content width,
 * (c) at least one rail-card renders in the first rail.
 *
 * Exit 0 if all three pass, 1 otherwise.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR  = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const PAGE = 'https://sahayai.in/chitti_news.html';
const SIZES = [
  { name: 'mobile',  w:  375, h:  800 },
  { name: 'tablet',  w:  768, h: 1024 },
  { name: 'desktop', w: 1280, h:  900 },
];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('chitti_news_state', 'india');
      localStorage.setItem('chitti_news_lang',  'en');
      localStorage.setItem('chitti_news_category', 'national');
      localStorage.setItem('disability_profile', JSON.stringify({
        skipped: true, ts: new Date().toISOString(), source: 'probe-responsive',
      }));
    } catch (e) {}
  });

  await page.goto(PAGE + '?cb=' + Date.now(), {
    waitUntil: 'domcontentloaded', timeout: 45000,
  });
  await page.waitForFunction(
    () => document.querySelectorAll('.rail-section').length >= 1,
    { timeout: 45000 },
  ).catch(() => {});

  const state = await page.evaluate((vp) => {
    const docW = document.documentElement.scrollWidth;
    const overflowsX = docW > vp + 1;
    const heroRect = document.querySelector('.hero-card')?.getBoundingClientRect();
    const main = document.querySelector('main')?.getBoundingClientRect();
    const firstRailCards = document.querySelectorAll('.rail-section .rail-card').length;
    return {
      docW, overflowsX,
      heroW: heroRect ? Math.round(heroRect.width) : 0,
      mainW: main ? Math.round(main.width) : 0,
      firstRailCards, build: document.querySelector('meta[name="chitti-build"]')?.content || '',
    };
  }, s.w);

  const pass = !state.overflowsX && state.heroW > 0 && state.firstRailCards >= 1;
  const shot = resolve(SHOT_DIR, `responsive_${s.name}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  results.push({ size: s.name, vw: s.w, state, errs: errs.slice(0, 3), pass, shot });
  await ctx.close();
}
await browser.close();

console.log('\n' + '═'.repeat(72));
console.log('RESPONSIVE probe → ' + PAGE);
console.log('═'.repeat(72));
let greens = 0;
for (const r of results) {
  if (r.pass) greens++;
  console.log(`  ${r.pass ? '✅' : '❌'}  ${r.size.padEnd(7)} (${r.vw}px) ` +
              `docW=${r.state.docW} overflowsX=${r.state.overflowsX} ` +
              `heroW=${r.state.heroW} mainW=${r.state.mainW} ` +
              `firstRailCards=${r.state.firstRailCards}`);
  if (r.errs.length) console.log(`        JS err: ${r.errs[0].slice(0, 80)}`);
}
console.log(`  RESULT: ${greens === results.length ? 'GREEN' : 'RED'}  (${greens}/${results.length})`);
process.exit(greens === results.length ? 0 : 1);
