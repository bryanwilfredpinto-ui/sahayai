import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('tools/ui_audit_v2', { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const [name, vp] of [
  ['mobile_375', { width: 375, height: 812 }],
  ['desktop',    { width: 1366, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto('https://sahayai.in/chitti_complete_technical.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(5000);
  // Try to skip the disability profile prompt
  const skip = await p.$('button:has-text("Skip"), button:has-text("skip"), button:has-text("Skip — none of these")');
  if (skip) { await skip.click(); }
  // Also try the X close
  const close = await p.$('[aria-label="Close"], .close, button:has-text("✕")');
  if (close) { try { await close.click(); } catch (e) {} }
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `tools/ui_audit_v2/clean_${name}_full.png`, fullPage: true });
  await p.screenshot({ path: `tools/ui_audit_v2/clean_${name}_fold.png`, fullPage: false });
  await ctx.close();
}
await browser.close();
console.log('done');
