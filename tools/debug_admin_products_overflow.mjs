import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{width:375,height:812}})).newPage();
await page.goto('https://sahayai.in/chitti_admin_products.html', { waitUntil:'networkidle' });
await page.waitForTimeout(2000);
// Skip disability profile modal
try { await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 2000 }); } catch(e){}
await page.waitForTimeout(500);
const wide = await page.evaluate(() => {
  const offenders = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > 380 && r.width > 0 && r.height > 0) {
      offenders.push({
        tag: el.tagName + (el.id ? '#'+el.id : '') + (el.className ? ('.'+String(el.className).split(/\s+/).slice(0,2).join('.')) : ''),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: ((el.textContent||'').trim().replace(/\s+/g, ' ')).slice(0, 60),
      });
    }
  });
  // Top-most offenders only (sort by right desc, dedupe by closest parent)
  return offenders.sort((a,b) => b.right - a.right).slice(0, 20);
});
console.log(JSON.stringify(wide, null, 2));
await b.close();
