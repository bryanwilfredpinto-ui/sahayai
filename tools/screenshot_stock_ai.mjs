import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('tools/ui_audit', { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const [name, vp] of [
  ['mobile_375', { width: 375, height: 812 }],
  ['mobile_414', { width: 414, height: 896 }],
  ['desktop',    { width: 1366, height: 900 }],
]) {
  const ctx = await browser.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto('https://sahayai.in/chitti_complete_technical.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `tools/ui_audit/stock_ai_${name}_full.png`, fullPage: true });
  await p.screenshot({ path: `tools/ui_audit/stock_ai_${name}_fold.png`, fullPage: false });
  await ctx.close();
}
// And Vaani for comparison
for (const [name, vp] of [
  ['mobile_375', { width: 375, height: 812 }],
]) {
  const ctx = await browser.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto('https://sahayai.in/chitti_vaani.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `tools/ui_audit/vaani_${name}_full.png`, fullPage: true });
  await p.screenshot({ path: `tools/ui_audit/vaani_${name}_fold.png`, fullPage: false });
  await ctx.close();
}
await browser.close();
console.log('done');
