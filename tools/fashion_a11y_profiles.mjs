/* fashion_a11y_profiles.mjs — automates ALL 4 disability profiles (blind/deaf/mute/
   illiterate). For each: sets the profile, seeds a wardrobe, generates an outfit + review,
   and asserts that profile's four-user CONTRACT on the live DOM. PASS/FAIL per profile.
   Run: node tools/fashion_a11y_profiles.mjs */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL = pathToFileURL(resolve(ROOT,'chitti_fashion.html')).href;
const EMOJI = /[←-⇿⌀-➿ἀ0-ᾯF️☀-⛿]|[\uD83C-􏰀-\uDFFF]/u;

const b = await chromium.launch();
async function run(profile){
  const ctx = await b.newContext({ viewport:{width:390,height:900} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(URL,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
  // set the disability profile (substrate + Fashion profile) and seed a wardrobe
  await p.evaluate(async (prof) => {
    const flags = { blind:{blind:true,low_vision:true}, deaf:{deaf:true}, mute:{mute:true,speech:true}, illiterate:{illiterate:true} }[prof] || {};
    localStorage.setItem('disability_profile', JSON.stringify({ needs:[prof], profile:[prof], ...flags, ts:new Date().toISOString() }));
    try { const k='chitti_fashion_profile_v1'; const pr=JSON.parse(localStorage.getItem(k)||'{}'); pr.disability=flags; localStorage.setItem(k, JSON.stringify(pr)); } catch(e){}
    await new Promise((res)=>{const r=indexedDB.open('chitti_fashion_almari',1);
      r.onupgradeneeded=()=>{const db=r.result; if(!db.objectStoreNames.contains('items')) db.createObjectStore('items',{keyPath:'id'});};
      r.onsuccess=()=>{const db=r.result,tx=db.transaction('items','readwrite'),st=tx.objectStore('items'),now=new Date().toISOString();
        [['t1','top','navy','blazer','#1A3A6B'],['b1','bottom','beige','chinos','#D9C7A0'],['f1','footwear','brown','loafers','#5A3A20']].forEach(x=>st.put({id:x[0],category:x[1],colour:x[2],desc:x[3],hex:x[4],occasions:['office'],wearer:'me',added_at:now}));
        tx.oncomplete=()=>res(); tx.onerror=()=>res();};r.onerror=()=>res();});
  }, profile);
  await p.reload({waitUntil:'domcontentloaded'}); await p.waitForTimeout(2000);
  // generate output via TAP (no voice/typing required — proves mute path too)
  await p.evaluate(()=>{ const btn=document.getElementById('fa-dressme'); if(btn) btn.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(()=>{ const rt=document.querySelector('.fa-tabbar button[data-tab="review"]'); if(rt) rt.click(); const t=document.getElementById('fa-review-text'); if(t) t.value='navy blazer, beige chinos, brown loafers'; const rb=document.querySelector('[onclick="faReview()"]'); if(rb) rb.click(); });
  await p.waitForTimeout(900);
  const a = await p.evaluate((emojiSrc)=>{
    const EM = new RegExp(emojiSrc,'u');
    const dm=document.getElementById('fa-dressme-result'); const rv=document.getElementById('fa-review-result');
    const dmTxt=(dm?dm.textContent:'').trim();
    const speakControls = document.querySelectorAll('.fa-spk, [onclick^="faSpeak"], .chitti-fb-bbtn').length;
    const tapTargets = [...document.querySelectorAll('.fa-tabbar button,.fa-btn,#fa-dressme,.fa-chip')];
    const smallTap = tapTargets.filter(el=>{const r=el.getBoundingClientRect(); return r.width&&(r.width<44||r.height<40);}).length;
    return {
      ariaLive: dm? dm.getAttribute('aria-live')==='polite' : false,
      spoken: !!(dm && dm.dataset && dm.dataset.spoken && dm.dataset.spoken.length>0),
      hasText: dmTxt.length>20,
      hasSymbol: EM.test(dmTxt) || EM.test((rv?rv.textContent:'')),
      islHook: !!document.querySelector('[class*="isl" i],[data-isl],[id*="isl" i]'),
      tapReachable: tapTargets.length>5 && smallTap===0,
      speakControls: speakControls>0,
      iconChips: [...document.querySelectorAll('.fa-occasion-chips .fa-chip,.fa-chip')].some(c=>EM.test(c.textContent||''))
    };
  }, EMOJI.source);
  await ctx.close();
  // contract per profile
  let pass, need;
  if (profile==='blind'){ pass = a.ariaLive && a.spoken && a.speakControls && errs.length===0; need='aria-live result + spoken text + 🔊 controls'; }
  else if (profile==='deaf'){ pass = a.hasText && a.hasSymbol && errs.length===0; need='visible text + symbol, never audio-only (ISL hook: '+a.islHook+')'; }
  else if (profile==='mute'){ pass = a.tapReachable && a.hasText && errs.length===0; need='full tap path (≥44px), no voice required'; }
  else { pass = a.iconChips && a.speakControls && a.spoken && errs.length===0; need='icon chips + 🔊 + spoken'; }
  return { profile, pass, need, signals:a, pageErrors:errs.length };
}
const rows=[]; for (const prof of ['blind','deaf','mute','illiterate']) rows.push(await run(prof));
await b.close();
const pass = rows.filter(r=>r.pass).length;
rows.forEach(r=>console.log((r.pass?'✅':'❌')+' '+r.profile.padEnd(11)+' '+JSON.stringify(r.signals)));
console.log('\nA11Y_PROFILES:'+JSON.stringify({total:4, pass, fail:4-pass, verdict: pass===4?'PASS':'FAIL', rows}));
