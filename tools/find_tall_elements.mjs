import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const p = await ctx.newPage();
await p.goto('https://sahayai.in/chitti_complete_technical.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(6000);
// Skip the disability prompt
const skip = await p.$('button:has-text("Skip")'); if (skip) await skip.click();
await p.waitForTimeout(2000);
const tall = await p.evaluate(() => {
  const all = Array.from(document.querySelectorAll('#tab-calls *'));
  const rows = [];
  all.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 200) {
      rows.push({
        tag: el.tagName,
        id: el.id || '',
        cls: el.className || '',
        h: Math.round(rect.height),
        y: Math.round(rect.top + window.scrollY),
        children: el.children.length
      });
    }
  });
  return rows;
});
console.log(JSON.stringify(tall, null, 2));
await ctx.close();
await browser.close();
