/**
 * Mirror Sire's exact reported flow: click Entertainment tab, then
 * select Malayalam from #pick-lang. Capture all fetches + final render.
 */
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();

const hits = [];
page.on('request', (r) => {
  if (r.url().includes('/api/news/')) hits.push({
    when: Date.now(), url: r.url().replace('https://chitti-news-api-production.up.railway.app', ''),
  });
});

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('https://sahayai.in/chitti_news.html?cb=' + Date.now(), {
  waitUntil: 'domcontentloaded',
});
await page.waitForTimeout(4500);

// Dismiss the chitti_a11y.js disability-profile modal so it doesn't
// intercept clicks. Sire's session must have already dismissed it.
await page.evaluate(() => {
  const m = document.getElementById('chitti-disability-profile-modal');
  if (m) m.remove();
  try { localStorage.setItem('chitti_disability_profile_v1', JSON.stringify({ skipped: true })); } catch (e) {}
});
await page.waitForTimeout(500);

console.log('Build tag:', await page.evaluate(() => document.querySelector('meta[name="chitti-build"]')?.content));

console.log('\n--- Initial fetches ---');
hits.forEach((h) => console.log(' ', h.url));

// Step 1: click Entertainment tab
console.log('\n--- Clicking Entertainment tab ---');
hits.length = 0;
await page.locator('.cat-tab[data-cat="entertainment"]').click();
await page.waitForTimeout(3000);
hits.forEach((h) => console.log(' ', h.url));

// Step 2: select Malayalam
console.log('\n--- Selecting Malayalam ---');
hits.length = 0;
await page.selectOption('#pick-lang', 'ml');
await page.waitForTimeout(4000);
hits.forEach((h) => console.log(' ', h.url));

// Final state
console.log('\n--- Final render state ---');
const cards = await page.locator('.art-card').count();
const status = await page.locator('.status-card').textContent().catch(() => null);
const titles = await page.$$eval('.art-card .art-title', (els) => els.slice(0, 3).map((e) => e.textContent.trim()));
const sources = await page.$$eval('.art-card .art-meta', (els) => els.slice(0, 3).map((e) => e.textContent.trim()));
const activeTab = await page.$$eval('.cat-tab.active', (els) => els.map((e) => e.dataset.cat));
const langValue = await page.locator('#pick-lang').inputValue();
const catValue = await page.locator('#pick-cat').inputValue();
const storage = await page.evaluate(() => ({
  lang: localStorage.getItem('chitti_news_lang'),
  cat: localStorage.getItem('chitti_news_category'),
  state: localStorage.getItem('chitti_news_state'),
}));

console.log('  .art-card count:', cards);
console.log('  .status-card text:', status && status.slice(0, 150));
console.log('  active tab:', activeTab);
console.log('  picker lang value:', langValue);
console.log('  picker cat value:', catValue);
console.log('  localStorage:', storage);
console.log('  visible titles:');
titles.forEach((t) => console.log('   -', t));
console.log('  visible sources:');
sources.forEach((s) => console.log('   -', s));

if (errors.length) {
  console.log('\n--- JS errors ---');
  errors.slice(0, 8).forEach((e) => console.log('  ', e));
}

// Last screenshot for visual confirmation
await page.screenshot({ path: 'tools/cert_screenshots/live_ml_entertainment.png', fullPage: false });
console.log('\nScreenshot: tools/cert_screenshots/live_ml_entertainment.png');

await browser.close();
