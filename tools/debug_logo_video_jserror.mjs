import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push({ msg: e.message, stack: e.stack }));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log('[console.' + m.type() + ']', m.text());
});
await page.goto('https://sahayai.in/', { waitUntil: 'domcontentloaded' }).catch(()=>{});
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
await page.goto('https://sahayai.in/chitti_logo_video.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
console.log('\n--- pageerror events ---');
errs.forEach((e, i) => {
  console.log('\n#' + (i + 1) + '  ' + e.msg);
  console.log(String(e.stack || '').split('\n').slice(0, 8).join('\n'));
});
await b.close();
