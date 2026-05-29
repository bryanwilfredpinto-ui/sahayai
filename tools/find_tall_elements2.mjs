import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const p = await ctx.newPage();
await p.goto('https://sahayai.in/chitti_complete_technical.html?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(6000);
const skip = await p.$('button:has-text("Skip")'); if (skip) await skip.click();
await p.waitForTimeout(2000);
const tall = await p.evaluate(() => {
  const all = Array.from(document.querySelectorAll('body *'));
  const rows = [];
  all.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 400 && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
      rows.push({
        tag: el.tagName,
        id: el.id || '',
        cls: (el.className || '').toString().slice(0, 60),
        h: Math.round(rect.height),
        y: Math.round(rect.top + window.scrollY),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
      });
    }
  });
  rows.sort((a,b) => b.h - a.h);
  return rows.slice(0, 30);
});
console.log(JSON.stringify(tall, null, 2));
console.log('---page total:', await p.evaluate(() => document.body.scrollHeight));
await ctx.close();
await browser.close();
