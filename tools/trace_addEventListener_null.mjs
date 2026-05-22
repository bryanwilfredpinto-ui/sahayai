/**
 * Track down the "Cannot read properties of null (reading 'addEventListener')"
 * errors on live pages. Capture the FULL stack so we know which script + line.
 */
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{ width:375, height:812 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push({ msg: String(e), stack: e.stack || '' }));
page.on('console', (m) => { if (m.type() === 'error') errs.push({ msg: m.text(), stack: m.location ? JSON.stringify(m.location()) : '' }); });
for (const url of ['chitti_4wheeler.html','chitti_2wheeler.html','chitti_fashion.html']) {
  console.log('\n══ ' + url);
  await page.goto('https://sahayai.in/' + url + '?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(800);
}
await b.close();
errs.slice(0, 12).forEach(e => { console.log('• ' + e.msg.slice(0, 200)); if (e.stack) console.log('   ' + e.stack.split('\n').slice(0, 3).join(' | ').slice(0, 250)); });
console.log('\ntotal errors: ' + errs.length);
