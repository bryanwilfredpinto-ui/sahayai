/**
 * Capture screenshots of 2W + 4W in 4 languages so Sire can verify the lang
 * flips. Mirrors what user would see on a real phone at 375x812.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8765';
const out = (n) => resolve(__dirname, n);

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();
await ctx.route('**/api/vaani/ask', r => r.fulfill({ status:200, contentType:'application/json', body:'{"reply":"{}"}' }));

const cases = [
  { file:'chitti_2wheeler.html', vKey:'chitti_bike_v1', fKey:'chitti_bike_fleet_v1', vehicle:{ make:'Hero', model:'Splendor Plus', variant:'i3S', reg:'UP32AB1234', year:'2018', odo:38000 }, tabs:['home','bike','ask'] },
  { file:'chitti_4wheeler.html', vKey:'chitti_car_v1', fKey:'chitti_car_fleet_v1', vehicle:{ make:'Maruti Suzuki', model:'Swift', variant:'VXi', reg:'DL3CAB5678', year:'2020', odo:52000 }, tabs:['home','car','ask'] },
];
const langs = ['en','hi','bn','te','ta'];

for (const c of cases) {
  await page.goto(BASE + '/' + c.file, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((o) => {
    localStorage.setItem(o.vKey, JSON.stringify(o.vehicle));
    localStorage.setItem(o.fKey, JSON.stringify([o.vehicle]));
  }, c);
  for (const lang of langs) {
    await page.reload({ waitUntil:'networkidle' });
    await page.waitForTimeout(500);
    await page.selectOption('#lang-select', lang);
    await page.waitForTimeout(400);
    for (const tab of c.tabs) {
      await page.evaluate((t) => document.querySelector(`nav.sds-tabs button[data-tab="${t}"]`)?.click(), tab);
      await page.waitForTimeout(400);
      const name = `cert_lang_${c.file.replace('.html','')}_${lang}_${tab}.png`;
      await page.screenshot({ path: out(name), fullPage: false });
      console.log('captured:', name);
    }
  }
}

await b.close();
