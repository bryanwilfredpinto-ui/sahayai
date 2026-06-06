/* test_all_fashion_samples.mjs — loops EVERY real sample file in test_samples/fashion/
   (readdir, NO hardcoded list) and runs each through the deterministic engine, asserting
   the file's expectation. PASS/FAIL per file + per category. Run: node tools/test_all_fashion_samples.mjs */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(resolve(ROOT, 'chitti_fashion_engine.js'));
const base = resolve(ROOT, 'test_samples', 'fashion');
if (!existsSync(base)) { console.log('No samples — run: node tools/gen_fashion_samples.mjs'); process.exit(1); }

// tiny text->items parser for the free-text review samples (mirrors the page's faParseOutfit)
function parse(text){
  const COLS=['navy','white','black','grey','beige','brown','maroon','red','green','olive','yellow','pink','gold','blue','cream'];
  const CATS=[['footwear',/sneaker|loafer|oxford|sandal|jutti|heel|shoe/i],['outfit',/saree|sherwani|lehenga|suit|kurta\s*set|anarkali|gown/i],['jewellery',/jhumka|earring|necklace|kada|watch|jewel/i],['bottom',/jean|pant|trouser|chino|palazzo|skirt|churidar|pyjama/i],['top',/shirt|tee|t-shirt|kurta|kurti|blazer|top|hoodie|sweater|jacket|saree/i]];
  return text.split(/[,;+]/).map(s=>s.trim()).filter(Boolean).map(seg=>{ const low=seg.toLowerCase(); let category='top'; for(const[c,re]of CATS) if(re.test(low)){category=c;break;} let colour=''; for(const c of COLS) if(low.includes(c)){colour=c;break;} return {category,colour,desc:seg}; });
}
const run = {
  wardrobe_sets:(f)=>{ const d=JSON.parse(readFileSync(f,'utf8')); const b=E.buildOutfits(d.items,{max:50}); return { pass:b.count>=(d.expectOutfitsMin||1), detail:b.count+' outfits' }; },
  outfit_reviews:(f)=>{ const items=parse(readFileSync(f,'utf8')); const o=E.classifyOccasion(items); const h=E.colorHarmony(items); const j=E.judge(items,{}); return { pass: !!o.occasion && typeof h.score==='number' && items.length>=2, detail:o.occasion+' / harmony '+h.type+' / judge '+(j.pass?'ok':'flag') }; },
  occasions:(f)=>{ const d=JSON.parse(readFileSync(f,'utf8')); const o=E.classifyOccasion(d.items); let ok=true; if(d.expectOccasion) ok=o.occasion===d.expectOccasion; if(d.expectOneOf) ok=d.expectOneOf.includes(o.occasion); if(d.expectBandMin!=null) ok=ok&&o.band>=d.expectBandMin; if(d.expectBandMax!=null) ok=ok&&o.band<=d.expectBandMax; return { pass:ok, detail:o.occasion+' band '+o.band }; },
  colours:(f)=>{ const d=JSON.parse(readFileSync(f,'utf8')); const a=E.analyseColour(d.hex,d.name); let ok=true; if(d.expectUndertone) ok=a.undertone===d.expectUndertone; if(d.expectValue) ok=ok&&a.value===d.expectValue; return { pass:ok, detail:a.undertone+'/'+a.value+'/'+a.chroma }; },
  repairs:(f)=>{ const d=JSON.parse(readFileSync(f,'utf8')); const r=E.diagnoseRepair(d.damage); if(!r) return {pass:false,detail:'no rule'}; let ok=true; if(d.expectDIY!=null) ok=r.diy===d.expectDIY; if(d.expectTailor!=null) ok=ok&&r.tailor===d.expectTailor; if(d.expectDifficulty) ok=ok&&r.difficulty===d.expectDifficulty; return { pass:ok, detail:r.difficulty+(r.diy?' DIY':' tailor') }; },
};
let total=0, pass=0; const cats={};
for (const cat of readdirSync(base)){
  const cdir=resolve(base,cat); let files; try{ files=readdirSync(cdir); }catch{ continue; }
  cats[cat]={pass:0,total:0};
  for (const f of files){
    const fp=resolve(cdir,f); total++; cats[cat].total++;
    let r; try{ r=run[cat]? run[cat](fp):{pass:false,detail:'no runner'}; }catch(e){ r={pass:false,detail:'ERR '+e.message}; }
    if(r.pass){ pass++; cats[cat].pass++; }
    console.log((r.pass?'✅':'❌')+' '+cat+'/'+f+' — '+r.detail);
  }
}
console.log('\nSAMPLE_TEST:'+JSON.stringify({total, pass, fail:total-pass, verdict: pass===total?'PASS':'FAIL', byCategory:cats}));
