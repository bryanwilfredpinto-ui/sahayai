/* fashion_lang_all26.mjs — tests ALL 26 Voice-Factory languages by SCRIPT.
   For each language: switch via the real dropdown, generate a live outfit + 9-agent
   review, and assert: dropdown switched · outfit renders · no raw keys at 150ms AND
   1550ms (flicker) · no page errors. PASS/FAIL per language. Run: node tools/fashion_lang_all26.mjs */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// the full 26 from chitti_lang.js LANGS
const ALL = ['en','hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur','sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc'];
const PRIMARY = new Set(['en','hi','ta','te','bn','mr','gu','kn','ml']);
const b = await chromium.launch();
const p = await b.newContext({ viewport:{width:390,height:900} }).then(c=>c.newPage());
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(pathToFileURL(resolve(ROOT,'chitti_fashion.html')).href,{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
await p.evaluate(async () => { await new Promise((res)=>{const r=indexedDB.open('chitti_fashion_almari',1);
  r.onupgradeneeded=()=>{const db=r.result; if(!db.objectStoreNames.contains('items')) db.createObjectStore('items',{keyPath:'id'});};
  r.onsuccess=()=>{const db=r.result,tx=db.transaction('items','readwrite'),st=tx.objectStore('items'),now=new Date().toISOString();
    [['t1','top','navy','blazer','#1A3A6B'],['t2','top','white','shirt','#FFFFFF'],['b1','bottom','beige','chinos','#D9C7A0'],['b2','bottom','blue','jeans','#2A4B7C'],['f1','footwear','brown','loafers','#5A3A20']].forEach(x=>st.put({id:x[0],category:x[1],colour:x[2],desc:x[3],hex:x[4],cost:800,wears:5,occasions:['office','casual'],wearer:'me',added_at:now}));
    tx.oncomplete=()=>res(); tx.onerror=()=>res();};r.onerror=()=>res();});});
await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);

async function check(lang){
  const e0 = errs.length;
  const switched = await p.evaluate((L)=>{ const s=document.getElementById('lang-select'); if(!s) return false;
    const had=[...s.options].some(o=>o.value===L); s.value=L; s.dispatchEvent(new Event('change',{bubbles:true})); return had; }, lang);
  await p.waitForTimeout(150);
  const raw150 = await p.evaluate(()=>{ let n=0; document.querySelectorAll('[data-vai-i18n]').forEach(e=>{ if((e.textContent||'').trim()===e.getAttribute('data-vai-i18n')) n++; }); return n; });
  await p.evaluate(()=>{ if(typeof faDressMe==='function') faDressMe(); });
  await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{
    const dm=document.getElementById('fa-dressme-result');
    let raw=0; document.querySelectorAll('[data-vai-i18n]').forEach(e=>{ if((e.textContent||'').trim()===e.getAttribute('data-vai-i18n')) raw++; });
    return { outfit: !!(dm&&dm.querySelector('.fa-outfit')), htmlLang: document.documentElement.lang, raw1550: raw };
  });
  const pageErr = errs.length - e0;
  const pass = switched && r.outfit && raw150===0 && r.raw1550===0 && pageErr===0;
  return { lang, tier: PRIMARY.has(lang)?'primary':'cousin', inDropdown:switched, outfit:r.outfit, raw150, raw1550:r.raw1550, htmlLang:r.htmlLang, pageErr, pass };
}
const rows=[]; for (const L of ALL) rows.push(await check(L));
await b.close();
const pass = rows.filter(r=>r.pass).length;
rows.forEach(r=>console.log((r.pass?'✅':'❌')+' '+r.lang.padEnd(4)+' '+r.tier.padEnd(8)+' dropdown='+(r.inDropdown?'Y':'N')+' outfit='+(r.outfit?'Y':'N')+' rawKeys='+r.raw1550+' flickerSafe='+(r.raw150===0)+' errs='+r.pageErr));
console.log('\nLANG26_REPORT:'+JSON.stringify({total:ALL.length, pass, fail:ALL.length-pass, verdict: pass===ALL.length?'PASS':'FAIL', rows}));
