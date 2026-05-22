#!/usr/bin/env node
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const URL = process.env.VAANI_URL || 'https://sahayai.in/chitti_vaani.html';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleErrs = [];
page.on('pageerror', e => consoleErrs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

const facts = await page.evaluate(() => {
  const navBtns = document.querySelectorAll('.vai-bnav button').length;
  const nav = document.querySelector('.vai-bnav');
  const navStyle = nav ? getComputedStyle(nav) : null;
  const navVisible = !!nav && navStyle.position === 'fixed' && navStyle.display !== 'none';
  const panels = document.querySelectorAll('.vai-tab-panel').length;
  const activePanels = document.querySelectorAll('.vai-tab-panel.active').length;
  // Are there multiple sections visible at once?
  const visibleSections = Array.from(document.querySelectorAll('main section'))
    .filter(s => s.offsetHeight > 0 && getComputedStyle(s).display !== 'none').length;
  return { navBtns, navVisible, panels, activePanels, visibleSections,
           navBottom: navStyle ? navStyle.bottom : null,
           navHeight: navStyle ? navStyle.height : null };
});
console.log(JSON.stringify(facts, null, 2));

// Capture screenshot of what user sees on first load
await page.screenshot({ path: resolve(__dirname, 'probe_live_initial.png'), fullPage: false });

// Click "I Agree" if consent overlay is visible
const hasConsent = await page.locator('#consent-overlay:not(.hidden)').count();
if (hasConsent) {
  await page.evaluate(() => { if (typeof acceptConsent === 'function') acceptConsent(); });
  await page.waitForTimeout(500);
}
await page.screenshot({ path: resolve(__dirname, 'probe_live_after_consent.png'), fullPage: false });

// Full-page screenshot to see "one long scroll" issue
await page.screenshot({ path: resolve(__dirname, 'probe_live_full.png'), fullPage: true });

console.log('\nConsole errors:', consoleErrs.length);
consoleErrs.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
await b.close();
