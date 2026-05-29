import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('tools/ui_audit_v2', { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const [name, url] of [
  ['medupi_375', 'https://sahayai.in/chitti_medupi.html'],
  ['stock_scanner_375', 'https://sahayai.in/chitti_complete_technical.html'],
]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  await p.goto(url + '?cb=' + Date.now(), { waitUntil: 'commit', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(5000);
  const skip = await p.$('button:has-text("Skip")'); if (skip) await skip.click({ timeout: 3000 }).catch(()=>{});
  await p.waitForTimeout(3000);
  // For the stock page, jump to Scanner tab
  if (name.includes('stock')) {
    await p.evaluate(() => { if (typeof showTab === 'function') showTab('scanner'); });
    await p.waitForTimeout(2000);
  }
  await p.screenshot({ path: `tools/ui_audit_v2/${name}_fold.png`, fullPage: false });
  await ctx.close();
}
await browser.close();
console.log('done');
