// Cert the substrate-injected ← Vaani back button across all product pages.
// Pass = exactly ONE top-of-page (<150px) control linking to chitti_vaani.html,
// 0 uncaught JS errors, no horizontal overflow at 375px.
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  // were missing — must now have the injected chip
  'chitti_car_mechanic.html','chitti_government.html','chitti_news.html',
  'chitti_health_file.html','chitti_voice_factory.html','chitti_isl.html',
  'chitti_psychology.html','chitti_ca_os.html','chitti_legal_os.html','chitti_mechanic_2w.html',
  // already had one — must NOT get a duplicate
  'chitti_medupi.html','chitti_fundamentals.html','chitti_upi.html',
  'chitti_scanner.html','chitti_fashion.html','chitti_news_ai.html','chitti_kisan.html',
];

const b = await chromium.launch();
let pass = 0; const fails = [];
for (const p of PAGES) {
  const ctx = await b.newContext({ viewport:{width:375,height:800} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  let r;
  try {
    await pg.goto(pathToFileURL(path.join(ROOT,p)).href,{waitUntil:'domcontentloaded',timeout:20000});
    await pg.waitForTimeout(1200); // let substrate inject (250ms) + settle
    r = await pg.evaluate(() => {
      const all = Array.from(document.querySelectorAll('a,button')).filter(el =>
        /chitti_vaani\.html/.test((el.getAttribute('href')||'')+(el.getAttribute('onclick')||'')));
      const top = all.map(el=>{const rc=el.getBoundingClientRect();return {top:Math.round(rc.top),h:Math.round(rc.height),w:Math.round(rc.width),txt:(el.textContent||'').trim().slice(0,16)};})
        .filter(x=>x.w>0 && x.top<150);
      const de=document.documentElement;
      return { topCount: top.length, top, overflow: de.scrollWidth>de.clientWidth+1, scrollW:de.scrollWidth };
    });
  } catch(e){ fails.push(`${p}: load error ${e.message}`); await ctx.close(); continue; }
  const okOne = r.topCount === 1;
  const okTap = r.top[0] && r.top[0].h >= 44;
  const okErr = errs.length === 0;
  const okOf = !r.overflow;
  const ok = okOne && okTap && okErr && okOf;
  if (ok) pass++;
  else fails.push(`${p}: topCount=${r.topCount} tap=${r.top[0]?r.top[0].h:'-'} jsErr=${errs.length}${errs[0]?'('+errs[0].slice(0,50)+')':''} overflow=${r.overflow}`);
  console.log(`${ok?'✅':'❌'} ${p.padEnd(28)} topVaani=${r.topCount} h=${r.top[0]?r.top[0].h:'-'} jsErr=${errs.length} overflow=${r.overflow}`);
  await ctx.close();
}
await b.close();
console.log(`\n${pass}/${PAGES.length} GREEN`);
if (fails.length) { console.log('FAILS:'); fails.forEach(f=>console.log('  - '+f)); }
process.exit(pass===PAGES.length?0:1);
