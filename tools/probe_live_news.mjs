/**
 * Probe what the LIVE sahayai.in/chitti_news.html actually renders.
 * Hits production backend (no mocks), screenshots at 375px, dumps any
 * visible text containing "NaN" or raw template fragments.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT = resolve(__dirname, 'cert_screenshots/live_news_375.png');
const CONSOLE_LOG = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 375, height: 1200 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.on('console', (m) => CONSOLE_LOG.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => CONSOLE_LOG.push(`[ERROR] ${e.message}`));

// Pre-set the Business category since that's what Sire is viewing.
await page.addInitScript(() => {
  try {
    localStorage.setItem('chitti_news_category', 'business');
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang', 'en');
  } catch (e) {}
});

await page.goto('https://sahayai.in/chitti_news.html?cb=' + Date.now(), {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForTimeout(3000);

// Dump build tag if present
const buildTag = await page.locator('meta[name="chitti-build"]').getAttribute('content').catch(() => 'not present');
console.log('Build tag in head:', buildTag);

// Find any text node in the body that contains "NaN" or "data-chitti-" as raw text.
const leaks = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const hits = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = (n.textContent || '').trim();
    if (!t) continue;
    if (/NaN\d/.test(t) || /data-chitti-response/i.test(t) || /<div class=/i.test(t)) {
      const parent = n.parentElement;
      hits.push({
        snippet: t.slice(0, 200),
        parentTag: parent ? parent.tagName : '?',
        parentClass: parent ? parent.className.toString().slice(0, 60) : '',
      });
    }
  }
  return hits.slice(0, 10);
});

console.log('\n=== TEXT LEAKS containing NaN/data-chitti/<div> ===');
if (leaks.length === 0) {
  console.log('  none found — page is clean');
} else {
  leaks.forEach((h, i) =>
    console.log(`  [${i}] in <${h.parentTag} class="${h.parentClass}">\n      ${h.snippet}`));
}

// Card count
const cards = await page.locator('.art-card').count();
console.log(`\nVisible .art-card count: ${cards}`);

await page.screenshot({ path: SHOT, fullPage: true });
console.log(`\nScreenshot: ${SHOT}`);

console.log('\n=== Console messages from the page ===');
CONSOLE_LOG.slice(0, 15).forEach((m) => console.log(' ', m));

await browser.close();
