/**
 * Study https://prod.mechai.app/ — best practices we should adopt for the
 * Mechanic Bike + Car pages.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();
await page.goto('https://prod.mechai.app/', { waitUntil:'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// Take a screenshot of the landing
await page.screenshot({ path: resolve(__dirname, 'mechai_1_landing.png'), fullPage: true });

// What text is on the landing page?
const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
console.log('── LANDING TEXT (first 800 chars) ──');
console.log(text.slice(0, 800));
console.log();

// Header / nav
const nav = await page.evaluate(() => {
  return {
    title: document.title,
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 8).map(h => h.tagName + ': ' + h.textContent.trim().slice(0, 80)),
    buttons: Array.from(document.querySelectorAll('button, a[role=button]')).slice(0, 20).map(b => b.textContent.trim().slice(0, 60)).filter(t => t),
    inputs: Array.from(document.querySelectorAll('input, select, textarea')).slice(0, 12).map(i => i.tagName + '[' + (i.getAttribute('type') || '') + ']:' + (i.getAttribute('placeholder') || i.getAttribute('aria-label') || '')),
  };
});
console.log('Title:', nav.title);
console.log('Headings:'); nav.headings.forEach(h => console.log('  ' + h));
console.log('Buttons:'); nav.buttons.forEach(t => console.log('  ' + t));
console.log('Inputs:'); nav.inputs.forEach(i => console.log('  ' + i));

// Look for tabs / nav items / categories
const struct = await page.evaluate(() => {
  // common patterns
  const tabs = Array.from(document.querySelectorAll('[role=tab], [role=tablist] *, .tab, .nav-item, [data-tab]')).slice(0, 14).map(e => e.textContent.trim().slice(0, 40)).filter(Boolean);
  const lang = document.querySelector('[aria-label*="language" i], [name*=lang i], #lang, .lang-select');
  return {
    tabs,
    hasLangSelect: !!lang,
    langText: lang ? lang.outerHTML.slice(0, 200) : null,
  };
});
console.log('Tabs/nav:'); struct.tabs.forEach(t => console.log('  ' + t));
console.log('Has language selector?', struct.hasLangSelect);

// Try to find the onboarding flow
const flow = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.card, [class*="card"], [class*="Card"]')).slice(0, 8).map(c => c.textContent.replace(/\s+/g,' ').trim().slice(0, 200));
  return cards;
});
console.log('\nCard texts:'); flow.forEach(c => console.log('  ' + c));

// Click any "Try" / "Get Started" button to see the next screen
const cta = await page.locator('button:has-text("Try"), button:has-text("Get Started"), button:has-text("Start"), button:has-text("Diagnose")').first();
if (await cta.count()) {
  await cta.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: resolve(__dirname, 'mechai_2_after_cta.png'), fullPage: true });
  console.log('\n[clicked first CTA — screenshot taken]');
  const after = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 600));
  console.log(after);
}

await b.close();
