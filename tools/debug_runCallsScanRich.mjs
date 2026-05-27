import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{width:375,height:812}})).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('https://sahayai.in/chitti_complete_technical.html', { waitUntil:'networkidle' });
await page.waitForTimeout(3500);
const r = await page.evaluate(() => ({
  window_runCallsScanRich: typeof window.runCallsScanRich,
  global_runCallsScanRich: (function() { try { return typeof runCallsScanRich; } catch(e) { return 'ReferenceError'; } })(),
  showTab_window: typeof window.showTab,
  showTab_global: (function() { try { return typeof showTab; } catch(e) { return 'ReferenceError'; } })(),
  chittiLoaded: typeof window._chittiLoaded + '=' + window._chittiLoaded,
}));
console.log(JSON.stringify(r, null, 2));
// Try clicking the Generate Calls button and see if anything errors.
try {
  await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 2000 });
} catch (e) {}
await page.waitForTimeout(200);
try {
  await page.locator('button[onclick*="runCallsScanRich"]').first().click({ timeout: 3000 });
  await page.waitForTimeout(1500);
  const cgStatus = await page.evaluate(() => {
    const s = document.getElementById('cg-status');
    return s ? { display: window.getComputedStyle(s).display, text: (s.textContent||'').slice(0,140) } : null;
  });
  console.log('cg-status after click:', JSON.stringify(cgStatus));
} catch (e) {
  console.log('click failed:', e.message);
}
console.log('errors:', errs);
await b.close();
