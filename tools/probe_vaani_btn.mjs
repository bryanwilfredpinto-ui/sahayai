// Sharper ← Vaani probe — for "yes(body)" pages, find the TOP-most chitti_vaani link,
// its Y position and text, to tell a real header back-button from a footer/menu link.
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['chitti_car_mechanic.html','chitti_government.html','chitti_news.html',
  'chitti_health_file.html','chitti_voice_factory.html','chitti_isl.html',
  'chitti_psychology.html','chitti_ca_os.html','chitti_legal_os.html','chitti_mechanic_2w.html'];
const b = await chromium.launch();
for (const p of PAGES) {
  const ctx = await b.newContext({ viewport:{width:375,height:800} });
  const pg = await ctx.newPage();
  try {
    await pg.goto(pathToFileURL(path.join(ROOT,p)).href,{waitUntil:'domcontentloaded',timeout:20000});
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(() => {
      const els = Array.from(document.querySelectorAll('a,button')).filter(el =>
        /chitti_vaani\.html/.test((el.getAttribute('href')||'') + (el.getAttribute('onclick')||'')));
      const info = els.map(el => {
        const rc = el.getBoundingClientRect();
        return { t: Math.round(rc.top), txt: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,30), tag: el.tagName };
      }).sort((a,b)=>a.t-b.t);
      return info;
    });
    const top = r[0];
    const isBack = top && top.t < 130 && /(←|⬅|back|vaani)/i.test(top.txt);
    console.log(p.padEnd(28), isBack ? 'HEADER-BACK ✅' : 'no top back ❌',
      '| topmost:', JSON.stringify(top||null), '| count:', r.length);
  } catch(e){ console.log(p.padEnd(28), 'ERR', e.message); }
  await ctx.close();
}
await b.close();
