/**
 * tools/sire_fix_proof_3shots.mjs
 * Sire 2026-05-23 Step 8: 3 real-browser screenshots.
 *   1. Fashion AI in English — no raw fa.* keys visible
 *   2. Fashion AI in Hindi   — 100% Hindi
 *   3. Vaani in Hindi        — 100% Hindi (tab labels + Settings)
 *
 * Also asserts ZERO raw i18n keys (`fa.*` / `mb.*` / `mc.*` / `na.*` / `set.*`
 * / `tab.*` / `hdr.*`) in the visible DOM on each page.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'http://127.0.0.1:8765';

const results = [];
function check(label, ok, detail){ results.push({label, ok, detail}); console.log(`${ok?'✅':'❌'} ${label}${detail?' — '+detail:''}`); }

const b = await chromium.launch({ headless: true });

async function leakSweep(page){
  return await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (!t) return;
      const m = t.match(/\b(fa|mb|mc|na|set|tab|hdr|err)\.[a-z][a-z0-9.]+/);
      if (m) out.push({ tag: el.tagName, key: m[0], text: t.slice(0, 50) });
    });
    return out;
  });
}

async function freshContext(){
  const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
  return ctx;
}

// ─── 1. Fashion AI in English ────────────────────────────────────────
{
  const ctx = await freshContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    try { const req = indexedDB.deleteDatabase('chitti_fashion_almari'); await new Promise(r => { req.onsuccess = r; req.onerror = r; req.onblocked = r; }); } catch(e){}
    localStorage.setItem('chitti_vaani_lang', 'en');
  });
  await page.goto(BASE + '/chitti_fashion.html?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(700);
  const leaks = await leakSweep(page);
  check('1. Fashion AI EN — zero raw keys in DOM', leaks.length === 0, leaks.slice(0,3).map(l => l.key).join(','));
  await page.screenshot({ path: resolve(__dirname, 'sire_fix_1_fashion_en.png'), fullPage: false });
  console.log('   📸 sire_fix_1_fashion_en.png');
  await ctx.close();
}

// ─── 2. Fashion AI in Hindi ──────────────────────────────────────────
{
  const ctx = await freshContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    try { const req = indexedDB.deleteDatabase('chitti_fashion_almari'); await new Promise(r => { req.onsuccess = r; req.onerror = r; req.onblocked = r; }); } catch(e){}
    localStorage.setItem('chitti_vaani_lang', 'hi');
  });
  await page.goto(BASE + '/chitti_fashion.html?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(700);
  const leaks = await leakSweep(page);
  check('2. Fashion AI HI — zero raw keys in DOM', leaks.length === 0, leaks.slice(0,3).map(l => l.key).join(','));
  // Confirm Hindi tab labels
  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('.sds-tabs button span:nth-child(2)')).map(s => s.textContent));
  const hindi = /अलमारी|खरीदारी|आज क्या|ट्रेंड|AI सीखो/.test(tabs.join(' '));
  check('2. Fashion AI HI — tab labels in Hindi', hindi, 'tabs=' + tabs.join(' / '));
  await page.screenshot({ path: resolve(__dirname, 'sire_fix_2_fashion_hi.png'), fullPage: false });
  console.log('   📸 sire_fix_2_fashion_hi.png');
  await ctx.close();
}

// ─── 3. Vaani in Hindi ───────────────────────────────────────────────
{
  const ctx = await freshContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    localStorage.setItem('chitti_vaani_lang', 'hi');
    localStorage.setItem('chitti_vaani_consent_given', '1');
    localStorage.setItem('chitti_vaani_onb_done', '1');
  });
  await page.goto(BASE + '/chitti_vaani.html?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(700);
  const leaks = await leakSweep(page);
  check('3. Vaani HI — zero raw keys in DOM', leaks.length === 0, leaks.slice(0,3).map(l => l.key).join(','));
  // Confirm Sire's exact Hindi tab labels
  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('.vai-bnav button span:nth-child(2)')).map(s => s.textContent));
  const expected = ['बोलें','करें','दस्तावेज़','अपने','SOS'];
  const allMatch = expected.every((e, i) => (tabs[i] || '').trim() === e);
  check('3. Vaani HI — tabs = बोलें/करें/दस्तावेज़/अपने/SOS', allMatch, 'tabs=' + tabs.join('|'));
  await page.screenshot({ path: resolve(__dirname, 'sire_fix_3_vaani_hi.png'), fullPage: false });
  console.log('   📸 sire_fix_3_vaani_hi.png');
  await ctx.close();
}

await b.close();
const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
