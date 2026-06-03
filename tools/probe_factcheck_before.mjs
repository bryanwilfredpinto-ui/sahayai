/**
 * probe_factcheck_before.mjs — Capture the current pill state on every
 * verdict (verified, partial, disputed, unverified) for the before/after
 * audit. Stubs the backend so we control which verdict each card carries.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(__dirname, '..', 'chitti_news.html')).href;
const SHOT = resolve(__dirname, 'cert_screenshots', 'audit_factcheck_before.png');
mkdirSync(dirname(SHOT), { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 1200 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  try {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'politics');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'audit',
    }));
  } catch (e) {}
});

await page.route('**://chitti-news-api-production.up.railway.app/**', async (route) => {
  const u = route.request().url();
  if (u.includes('/api/news/feed')) {
    const verdicts = [
      { verdict: 'verified',   symbol: '✅', word: 'VERIFIED',   confidence: 92 },
      { verdict: 'partial',    symbol: '🟡', word: 'PARTIAL',    confidence: 70 },
      { verdict: 'disputed',   symbol: '⚠️', word: 'DISPUTED',   confidence: 45 },
      { verdict: 'unverified', symbol: '❔', word: 'UNVERIFIED', confidence: 25 },
    ];
    const items = verdicts.map((v, i) => ({
      id: 9000 + i,
      title: 'Sample headline for ' + v.word + ' verdict — Modi addresses parliament on new policy',
      summary: 'A short summary for the article body.',
      content: '',
      link: 'https://example.com/' + i,
      image_url: '',
      source_name: 'The Hindu',
      source_slug: 'thehindu',
      published_at: new Date().toISOString(),
      factcheck: v,
    }));
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        items, count: items.length,
        state: 'india', language: 'en', category: 'politics',
        speak_en: '4 stories.',
        coverage: { per_category: { politics: 4 }, total_in_language: 4,
                    english_fallback_count: 7000,
                    available_categories: ['national','politics','business'] },
      }),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});
await page.route('**/chitti_a11y.js', (r) =>
  r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));

await page.goto(PAGE);
await page.waitForFunction(
  () => document.querySelectorAll('.art-card').length >= 4,
  { timeout: 10000 },
);

const pills = await page.$$eval('.fc-badge', els => els.map((e, i) => ({
  i,
  text: e.textContent.trim(),
  rect: (() => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
  cls: e.className,
  bg: getComputedStyle(e).backgroundColor,
  color: getComputedStyle(e).color,
  fontSize: getComputedStyle(e).fontSize,
})));

console.log('Pills found:', pills.length);
pills.forEach(p => console.log('  ', JSON.stringify(p)));

await page.screenshot({ path: SHOT, fullPage: true });
console.log('Screenshot:', SHOT);
await browser.close();
