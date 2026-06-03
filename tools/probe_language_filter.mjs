/**
 * Probe the live page's behavior when language is switched to Malayalam
 * + category to Entertainment. Confirm whether onFilterChange fires +
 * what gets rendered.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
const page = await ctx.newPage();

const networkHits = [];
page.on('request', (r) => {
  if (r.url().includes('/api/news/')) networkHits.push(r.url());
});
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

await page.goto('https://sahayai.in/chitti_news.html?cb=' + Date.now(), {
  waitUntil: 'domcontentloaded', timeout: 30000,
});
await page.waitForTimeout(4000);

console.log('Build tag:', await page.evaluate(() => document.querySelector('meta[name="chitti-build"]')?.content));
console.log('\n--- Initial network hits (page load) ---');
networkHits.forEach((u) => console.log(' ', u));

// Switch language to Malayalam
const langCount = await page.locator('#pick-lang').count();
console.log('\n#pick-lang exists:', langCount === 1);
networkHits.length = 0;
await page.selectOption('#pick-lang', 'ml');
await page.waitForTimeout(8000);
console.log('\n--- After selecting Malayalam (8s wait) ---');
networkHits.forEach((u) => console.log(' ', u));
console.log('localStorage lang:', await page.evaluate(() => localStorage.getItem('chitti_news_lang')));

// Switch category to Entertainment
networkHits.length = 0;
await page.selectOption('#pick-cat', 'entertainment');
await page.waitForTimeout(2500);
console.log('\n--- After selecting Entertainment ---');
networkHits.forEach((u) => console.log(' ', u));

// What's actually rendered?
const cards = await page.locator('.art-card').count();
const status = await page.locator('.status-card').textContent().catch(() => null);
const visibleArticleTitles = await page.$$eval('.art-card .art-title', (els) =>
  els.slice(0, 3).map((e) => e.textContent.trim()),
);
const visibleSources = await page.$$eval('.art-card .art-meta .src', (els) =>
  els.slice(0, 3).map((e) => e.textContent.trim()),
);

console.log('\n--- Render state after switching to ml + entertainment ---');
console.log('  .art-card count:', cards);
console.log('  .status-card text:', status);
console.log('  visible titles:', visibleArticleTitles);
console.log('  visible source names:', visibleSources);

if (consoleErrors.length) {
  console.log('\n--- JS errors ---');
  consoleErrors.slice(0, 5).forEach((e) => console.log('  ', e));
}

await browser.close();
