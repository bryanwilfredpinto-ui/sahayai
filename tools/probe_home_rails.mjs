/**
 * probe_home_rails.mjs — Smoke-test the new Amazon-style home rails
 * on the LOCAL file://chitti_news.html. Stubs the backend with a
 * deterministic per-category payload so we can assert:
 *   • The home view fires 6 parallel category fetches (national + 5 rails)
 *   • One hero + 5 rail sections render with correct titles
 *   • Tap on a rail card triggers SpeechSynthesisUtterance
 *   • Tap on "See all <Politics>" switches to that category linear feed
 * Writes a screenshot for visual inspection.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_URL  = pathToFileURL(resolve(__dirname, '..', 'chitti_news.html')).href;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const apiHits = [];
const titles = {
  national:      [['National 1','National 2','National 3','National 4','National 5']],
  politics:      [['Politics 1','Politics 2','Politics 3','Politics 4']],
  business:      [['Business 1','Business 2','Business 3','Business 4']],
  sports:        [['Sports 1','Sports 2','Sports 3','Sports 4']],
  entertainment: [['Entertainment 1','Entertainment 2','Entertainment 3','Entertainment 4']],
  tech:          [['Tech 1','Tech 2','Tech 3','Tech 4']],
};

await page.route('**://chitti-news-api-production.up.railway.app/**', async (route) => {
  const u = route.request().url();
  apiHits.push(u);
  if (u.includes('/api/news/feed')) {
    const catMatch = u.match(/category=([a-z]+)/);
    const cat = (catMatch && catMatch[1]) || 'national';
    const langMatch = u.match(/language=([a-z]+)/);
    const lang = (langMatch && langMatch[1]) || 'en';
    const list = (titles[cat] && titles[cat][0]) || [];
    const items = list.map((t, i) => ({
      id: 1000 + (Object.keys(titles).indexOf(cat) * 100) + i,
      title: lang === 'en' ? t : (t + ' (' + lang + ')'),
      summary: t + ' summary.',
      content: t + ' full body content goes here. ' + 'Paragraph text. '.repeat(20),
      link: 'https://example.com/' + cat + '/' + i,
      image_url: '',
      source_name: 'ExampleNews',
      source_slug: 'example',
      published_at: new Date().toISOString(),
      factcheck: { verdict: 'verified', word: 'VERIFIED', symbol: '✓' },
    }));
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        items, count: items.length,
        state: 'india', language: lang, category: cat,
        speak_en: items.length + ' ' + cat + ' stories.',
        coverage: {
          per_category: { national: 5, politics: 4, business: 4, sports: 4, entertainment: 4, tech: 4 },
          total_in_language: 25, english_fallback_count: 7014,
          available_categories: Object.keys(titles),
        },
      }),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});
await page.route('**/chitti_a11y.js', (r) =>
  r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));

await page.addInitScript(() => {
  window.__speakLog = [];
  const Orig = window.SpeechSynthesisUtterance;
  window.SpeechSynthesisUtterance = function (text) {
    const u = new Orig(text);
    window.__speakLog.push({ text: String(text) });
    return u;
  };
});

await page.goto(PAGE_URL);
await page.waitForSelector('#feed-root', { timeout: 8000 });
// Wait for the home rails to render — look for 5 rail-section nodes
await page.waitForFunction(
  () => document.querySelectorAll('.rail-section').length >= 5,
  { timeout: 8000 },
);

// Count + verify
const railTitles = await page.$$eval('.rail-title', els => els.map(e => e.textContent.trim()));
const hasHero = await page.$$eval('.hero-card', els => els.length === 1);
const railCardCount = await page.$$eval('.rail-card', els => els.length);
const feedCalls = apiHits.filter(u => u.includes('/api/news/feed')).length;

console.log('Build tag:', await page.evaluate(() => document.querySelector('meta[name="chitti-build"]')?.content));
console.log('\n--- HOME render ---');
console.log('  hero card present:', hasHero);
console.log('  rail titles      :', railTitles);
console.log('  rail card count  :', railCardCount);
console.log('  feed API hits    :', feedCalls);

// Tap a rail card → assert speak fires
await page.locator('.rail-card').nth(2).click();
await page.waitForTimeout(500);
const speakLog = await page.evaluate(() => window.__speakLog);
console.log('  speak utterances :', speakLog.length, '| last:',
  speakLog.length ? speakLog[speakLog.length - 1].text.slice(0, 80) : '(none)');

// Tap "See all Politics" → assert linear feed renders
await page.locator('.rail-see-all', { hasText: 'Politics' }).click();
await page.waitForTimeout(1000);
const linearCards = await page.$$eval('.art-card', els => els.length);
const activeTab = await page.$$eval('.cat-tab.active', els => els.map(e => e.dataset.cat));
console.log('\n--- After tapping "See all Politics" ---');
console.log('  linear art-card count:', linearCards);
console.log('  active cat tab       :', activeTab);

if (errors.length) {
  console.log('\n--- JS errors ---');
  errors.slice(0, 8).forEach(e => console.log('  ', e));
} else {
  console.log('\nNo JS errors.');
}

await page.screenshot({ path: 'tools/cert_screenshots/probe_home_rails.png', fullPage: true });
console.log('\nScreenshot → tools/cert_screenshots/probe_home_rails.png');

await browser.close();
