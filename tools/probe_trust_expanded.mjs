/**
 * Capture a screenshot of the verified-card Trust Strip in its
 * EXPANDED state — used for the before/after proof bundle so the
 * "tap to reveal matched_source_names" behaviour is visible at a
 * glance, not just GREEN in a probe log.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(__dirname, '..', 'chitti_news.html')).href;
const SHOT = resolve(__dirname, 'cert_screenshots', 'trust_strip_expanded.png');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  try {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'politics');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'expanded-probe',
    }));
  } catch (e) {}
});

await page.route('**://chitti-news-api-production.up.railway.app/**', async (route) => {
  const u = route.request().url();
  if (u.includes('/api/news/feed')) {
    const items = [{
      id: 9001,
      title: 'Modi addresses parliament on a major new policy reform',
      summary: 'The Prime Minister announced a new initiative covering education and healthcare reform.',
      content: 'Body paragraph one. '.repeat(20),
      link: 'https://example.com/0',
      image_url: '',
      source_name: 'The Hindu',
      source_slug: 'thehindu',
      published_at: new Date().toISOString(),
      factcheck: {
        verdict: 'verified', symbol: '✅', word: 'VERIFIED', confidence: 92,
        matched_sources: ['thehindu', 'ndtv', 'indianexpress', 'toi', 'hindustantimes'],
        matched_source_names: ['The Hindu', 'NDTV', 'Indian Express', 'Times of India', 'Hindustan Times'],
        match_count: 5,
        rationale_en: '5 other trusted sources are running this story; key facts agree.',
      },
    }];
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        items, count: items.length,
        state: 'india', language: 'en', category: 'politics',
        speak_en: '1 politics story.',
        coverage: { per_category: { politics: 1 }, total_in_language: 1,
                    english_fallback_count: 7000, available_categories: ['politics'] },
      }),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});
await page.route('**/chitti_a11y.js', (r) =>
  r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));

await page.goto(PAGE);
await page.waitForSelector('.trust-strip', { timeout: 8000 });
await page.locator('.trust-strip').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: SHOT, fullPage: false });
console.log('Expanded screenshot:', SHOT);
await browser.close();
