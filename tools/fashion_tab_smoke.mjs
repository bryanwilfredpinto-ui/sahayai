import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const SHOT = resolve(dirname(fileURLToPath(import.meta.url)), 'cert_screenshots');
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765') + '/chitti_fashion.html';
const b = await chromium.launch({ headless: true });
const c = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const p = await c.newPage();
await p.goto(BASE, { waitUntil: 'domcontentloaded' });
const seed = [['t1','top','navy','navy blazer'],['t2','top','white','formal shirt'],['b1','bottom','beige','beige chinos'],['b2','bottom','blue','jeans'],['f1','footwear','brown','brown loafers'],['f2','footwear','white','sneakers'],['o1','outfit','maroon','maroon saree'],['j1','jewellery','gold','gold studs']];
await p.evaluate(async (seed) => {
  try { localStorage.clear(); } catch (e) {}
  localStorage.setItem('chitti_fashion_profile_v1', JSON.stringify({ gender: 'female', lang: 'en' }));
  localStorage.setItem('chitti_vaani_lang', 'en');
  localStorage.setItem('disability_profile', JSON.stringify({ done: true }));
  await new Promise((res) => {
    const r = indexedDB.open('chitti_fashion_almari', 1);
    r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' }); };
    r.onsuccess = () => { const db = r.result, tx = db.transaction('items', 'readwrite'), st = tx.objectStore('items'), now = new Date().toISOString();
      seed.forEach((x) => st.put({ id: x[0], category: x[1], colour: x[2], desc: x[3], occasions: ['office', 'casual'], wearer: 'me', added_at: now }));
      tx.oncomplete = () => res(); tx.onerror = () => res(); };
    r.onerror = () => res();
  });
}, seed);
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
const tabLabel = await p.evaluate(() => document.querySelector('.fa-tabbar button[data-tab=almari]').textContent.trim());
const grab = (id) => p.evaluate((i) => { const e = document.getElementById(i); return e ? e.textContent.replace(/\s+/g, ' ').trim().slice(0, 140) : ''; }, id);

await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab=review]').click(); document.getElementById('fa-review-text').value = 'navy blazer, beige chinos, white sneakers'; faReview(); });
await p.waitForTimeout(700); const review = await grab('fa-review-result');
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab=occasion]').click(); const ch = document.querySelector('#fa-occasion-chips .fa-chip'); if (ch) ch.click(); faOccasion(); });
await p.waitForTimeout(700); const occ = await grab('fa-occasion-result');
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab=budget]').click(); document.getElementById('fa-budget-text').value = 'formal shirt for office'; faBudget(); });
await p.waitForTimeout(500); const bud = await grab('fa-budget-result');
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab=learn]').click(); document.getElementById('fa-learn-text').value = 'what colour matches blue?'; faLearn(); });
await p.waitForTimeout(500); const learn = await grab('fa-learn-result');
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab=review]').click(); document.getElementById('fa-review-text').value=''; faDescribeMine(); });
await p.waitForTimeout(500); const describe = await grab('fa-review-result');
await p.evaluate(() => document.querySelector('.fa-tabbar button[data-tab=review]').click());
await p.screenshot({ path: resolve(SHOT, 'engine_tabs_english.png'), fullPage: true });
console.log('TAB LABEL (English i18n):', tabLabel);
console.log('REVIEW   :', review);
console.log('OCCASION :', occ);
console.log('BUDGET   :', bud);
console.log('LEARN    :', learn);
console.log('DESCRIBE :', describe);
await b.close();
