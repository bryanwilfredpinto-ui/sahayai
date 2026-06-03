/**
 * probe_business_no_cricket.mjs — Sire's trust-failure regression test.
 * Open the live page, switch to Business, scan all visible titles, and
 * assert NONE of them match the cricket / sports leak patterns. If
 * this ever goes RED, the classifier or the source category drifted.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR  = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const PAGE = 'https://sahayai.in/chitti_news.html';
const SPORT_KW = /\b(cricket|wickets?|innings|t20i?|odi series|test (?:match|series|cricket|century)|virat kohli|rohit sharma|west indies vs|india vs (?:australia|england|pakistan|south africa|new zealand|sri lanka)|champions trophy|icc world cup|fifa world cup|premier league|grand slam|olympic medal)\b/i;
const ENT_KW   = /\b(bollywood|tollywood|movie release|web series|box office|red carpet|trailer launch|robert pattinson|harry potter|filmfare|iifa)\b/i;
const POL_KW   = /\b(swearing[ -]in|cabinet (?:expansion|reshuffle)|lok sabha elections?|by[ -]?election|ambassador to|ifs officer)\b/i;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 900 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  try {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'business');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'probe-business',
    }));
  } catch (e) {}
});

await page.goto(PAGE + '?cb=' + Date.now(), {
  waitUntil: 'domcontentloaded', timeout: 45000,
});
// Wait for at least one art-card (linear business feed).
await page.waitForFunction(
  () => document.querySelectorAll('.art-card').length >= 1,
  { timeout: 45000 },
).catch(() => {});

const titles = await page.$$eval('.art-card .art-title', (els) =>
  els.map((e) => e.textContent.trim()),
);

console.log('\n' + '═'.repeat(72));
console.log(`Business titles on ${PAGE} (?cat=business):`);
console.log('═'.repeat(72));

let bad = 0;
titles.forEach((t, i) => {
  const flags = [];
  if (SPORT_KW.test(t)) flags.push('SPORTS');
  if (ENT_KW.test(t))   flags.push('ENT');
  if (POL_KW.test(t))   flags.push('POL');
  const icon = flags.length ? '❌' : '✅';
  if (flags.length) bad++;
  console.log(`  ${icon}  ${flags.length ? '[' + flags.join(',') + '] ' : '       '}${t.slice(0, 90)}`);
});

console.log('═'.repeat(72));
console.log(`Result: ${bad === 0 ? 'GREEN — no category leakage' : 'RED — ' + bad + ' leak(s)'}  (${titles.length} cards scanned)`);

await page.screenshot({
  path: resolve(SHOT_DIR, 'live_business_no_cricket.png'),
  fullPage: true,
});

await browser.close();
process.exit(bad === 0 ? 0 : 1);
