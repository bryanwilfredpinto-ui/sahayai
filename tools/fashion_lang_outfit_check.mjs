/* Selects EACH language via the real dropdown, generates a sample outfit (Dress-Me) +
   runs Outfit Review, and verifies the output renders localized (non-empty, no raw keys,
   real outfit pieces + swarm). This is the end-to-end "does it actually work in every
   language" check. Run: node tools/fashion_lang_outfit_check.mjs */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRIMARY = ['en','hi','ta','te','bn','mr','gu','kn','ml'];
const COUSINS = ['pa','ur','or'];
const b = await chromium.launch();
const p = await b.newContext({ viewport:{width:390,height:900} }).then(c=>c.newPage());
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(pathToFileURL(resolve(ROOT,'chitti_fashion.html')).href,{waitUntil:'domcontentloaded'});
await p.waitForTimeout(2500);
// seed a real wardrobe
await p.evaluate(async () => {
  await new Promise((res)=>{const r=indexedDB.open('chitti_fashion_almari',1);
    r.onupgradeneeded=()=>{const db=r.result; if(!db.objectStoreNames.contains('items')) db.createObjectStore('items',{keyPath:'id'});};
    r.onsuccess=()=>{const db=r.result,tx=db.transaction('items','readwrite'),st=tx.objectStore('items'),now=new Date().toISOString();
      [['t1','top','navy','blazer','#1A3A6B'],['t2','top','white','shirt','#FFFFFF'],['b1','bottom','beige','chinos','#D9C7A0'],['b2','bottom','blue','jeans','#2A4B7C'],['f1','footwear','brown','loafers','#5A3A20']].forEach(x=>st.put({id:x[0],category:x[1],colour:x[2],desc:x[3],hex:x[4],cost:800,wears:5,occasions:['office','casual'],wearer:'me',added_at:now}));
      tx.oncomplete=()=>res(); tx.onerror=()=>res();};r.onerror=()=>res();});
});
await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);

async function checkLang(lang){
  // switch language the real way: set dropdown + dispatch change (chitti_lang.js path)
  await p.evaluate((L)=>{ const s=document.getElementById('lang-select'); s.value=L; s.dispatchEvent(new Event('change',{bubbles:true})); }, lang);
  await p.waitForTimeout(900);
  // generate an outfit
  await p.evaluate(()=>{ if(typeof faDressMe==='function') faDressMe(); });
  await p.waitForTimeout(900);
  // run a review too (9-agent swarm)
  await p.evaluate(()=>{ const t=document.getElementById('fa-review-text'); if(t){ t.value='navy blazer, beige chinos, brown loafers'; } const rt=document.querySelector('.fa-tabbar button[data-tab="review"]'); if(rt) rt.click(); if(typeof faReview==='function') faReview(); });
  await p.waitForTimeout(900);
  return await p.evaluate(()=>{
    const dm=document.getElementById('fa-dressme-result'); const rv=document.getElementById('fa-review-result');
    const dmTxt=(dm?dm.textContent:'').trim(); const rvTxt=(rv?rv.textContent:'').trim();
    let raw=0; document.querySelectorAll('[data-vai-i18n]').forEach(e=>{ if((e.textContent||'').trim()===e.getAttribute('data-vai-i18n')) raw++; });
    return {
      outfitRendered: !!(dm && dm.querySelector('.fa-outfit')),
      outfitPieces: dm? dm.querySelectorAll('.fa-outfit .pieces .p').length:0,
      outfitTextLen: dmTxt.length,
      swarmAgents: rv? rv.querySelectorAll('.fa-swarm .rows .row').length:0,
      reviewTextLen: rvTxt.length,
      rawKeys: raw,
      htmlLang: document.documentElement.lang,
      sample: dmTxt.slice(0,70)
    };
  });
}
const rows=[];
for (const L of PRIMARY) rows.push({lang:L, tier:'primary', ...await checkLang(L)});
for (const L of COUSINS) rows.push({lang:L, tier:'cousin', ...await checkLang(L)});
await b.close();
console.log('LANG_OUTFIT_CHECK:'+JSON.stringify({rows, pageErrors:errs.slice(0,3)}));
