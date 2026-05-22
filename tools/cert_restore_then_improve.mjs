/**
 * tools/cert_restore_then_improve.mjs — Sire 2026-05-23 Step 5.
 * Open Chrome on the local server, set Hindi, take a real-browser
 * screenshot of each of the 3 pages with the Launching Soon cards visible.
 * Assert: zero raw i18n keys, 5 tabs, Launching Soon section present.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'http://127.0.0.1:8765';

const results = [];
function check(l, ok, d){ results.push({l,ok,d}); console.log(`${ok?'✅':'❌'} ${l}${d?' — '+d:''}`); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

async function freshState(){
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    try { const r = indexedDB.deleteDatabase('chitti_fashion_almari'); await new Promise(res => { r.onsuccess=res; r.onerror=res; r.onblocked=res; }); } catch(e){}
  });
}
async function leakSweep(){
  return await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      const m = t && t.match(/\b(fa|mb|mc|na|set|tab|hdr|err|fb|ui|chai|vai)\.[a-z][a-z0-9.]+/);
      if (m) out.push({ key:m[0], text:t.slice(0,80), attr: el.getAttribute('data-vai-i18n') || '' });
    });
    return out;
  });
}

// ── 1. chitti_4wheeler.html · Hindi · Launching Soon on Ask tab ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_4wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(700);
await page.evaluate(() => mcTab('ask'));
await page.waitForTimeout(400);
const m4 = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  soon: document.querySelectorAll('.mc-soon-item').length,
  feats: Array.from(document.querySelectorAll('.mc-soon-title')).map(t => t.textContent.replace(/Phase 2/g,'').trim().slice(0, 32)),
  toolbars: document.querySelectorAll('.mc-soon-bar').length,
}));
const leaks4 = await leakSweep();
check('4Wheeler — 5 tabs', m4.tabs === 5);
check('4Wheeler — 4 Launching Soon items', m4.soon === 4, m4.feats.join(' | '));
check('4Wheeler — each has 🔊/👍/👎 bar', m4.toolbars === 4);
check('4Wheeler — zero raw i18n keys', leaks4.length === 0, leaks4.slice(0,3).map(l=>l.key).join(','));
await page.screenshot({ path: resolve(__dirname, 'sire5_1_4wheeler_hi.png'), fullPage: true });
console.log('   📸 sire5_1_4wheeler_hi.png');

// ── 2. chitti_2wheeler.html · Hindi · Launching Soon ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_2wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(700);
await page.evaluate(() => mbTab('ask'));
await page.waitForTimeout(400);
const m2 = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  soon: document.querySelectorAll('.mb-soon-item').length,
  feats: Array.from(document.querySelectorAll('.mb-soon-title')).map(t => t.textContent.replace(/Phase 2/g,'').trim().slice(0, 32)),
  toolbars: document.querySelectorAll('.mb-soon-bar').length,
}));
const leaks2 = await leakSweep();
check('2Wheeler — 5 tabs', m2.tabs === 5);
check('2Wheeler — 4 Launching Soon items', m2.soon === 4, m2.feats.join(' | '));
check('2Wheeler — each has 🔊/👍/👎 bar', m2.toolbars === 4);
check('2Wheeler — zero raw i18n keys', leaks2.length === 0, leaks2.slice(0,3).map(l=>l.key).join(','));
await page.screenshot({ path: resolve(__dirname, 'sire5_2_2wheeler_hi.png'), fullPage: true });
console.log('   📸 sire5_2_2wheeler_hi.png');

// ── 3. chitti_fashion.html · Hindi · zero raw keys ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_fashion.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(700);
const fashLeaks = await leakSweep();
check('Fashion HI — zero raw i18n keys', fashLeaks.length === 0, fashLeaks.slice(0,3).map(l=>l.key).join(','));
await page.screenshot({ path: resolve(__dirname, 'sire5_3_fashion_hi.png'), fullPage: false });
console.log('   📸 sire5_3_fashion_hi.png');

await b.close();
console.log(`\nConsole errors observed: ${errs.length}`);
errs.slice(0, 4).forEach(e => console.log('   • ' + e));
const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
