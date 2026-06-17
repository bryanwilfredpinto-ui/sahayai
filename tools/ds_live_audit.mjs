// Live design-system audit — renders the DEPLOYED pages at sahayai.in at
// 375px and reads back computed tokens (the real cascade incl. live
// chitti_theme.css). UI/UX agent, 2026-06-17.
import { chromium } from 'playwright';

const pages = [
  'chitti_medupi','chitti_upi','chitti_scanner','chitti_news_ai','chitti_technical_ai',
  'chitti_vaani','chitti_news','chitti_ca','chitti_legal','chitti_government',
  'chitti_2wheeler','chitti_4wheeler','chitti_fashion'
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:375,height:812} });
const out = [];
for (const p of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://sahayai.in/${p}.html`, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      const dsLoaded = [...document.styleSheets].some(s => (s.href||'').includes('sahayai_design_system.css'));
      const fw = !!document.querySelector('script[src*="feedback-widget"]');
      const a11y = !!document.querySelector('script[src*="chitti_a11y"]');
      // navy: scan headers/brand bars for a dark-navy background
      let navy = null;
      for (const el of document.querySelectorAll('header,.sds-header,[class*=header],[class*=brand],[class*=hero]')) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m){ const [r,g,b]=[+m[1],+m[2],+m[3]]; if (b>40 && b<140 && r<60 && g<60){ navy=`rgb(${r}, ${g}, ${b})`; break; } }
      }
      const stripe = [...document.querySelectorAll('div,header')].find(el=>{
        const bg=getComputedStyle(el).backgroundImage||''; const rc=el.getBoundingClientRect();
        return bg.includes('gradient') && rc.top<14 && rc.height<=14 && rc.width>200;
      });
      return { font:cs.fontSize, bg:cs.backgroundColor, dsLoaded, fw, a11y, navy, stripe:!!stripe };
    });
    out.push({ p, ...d });
  } catch(e){ out.push({ p, error:String(e).slice(0,90) }); }
  await page.close();
}
await browser.close();
for (const r of out){
  if (r.error){ console.log(`${r.p.padEnd(20)} ERROR ${r.error}`); continue; }
  console.log(`${r.p.padEnd(20)} font=${String(r.font).padEnd(6)} bg=${String(r.bg).padEnd(20)} navy=${String(r.navy).padEnd(16)} ds=${r.dsLoaded?'Y':'N'} stripe=${r.stripe?'Y':'N'} fw=${r.fw?'Y':'N'} a11y=${r.a11y?'Y':'N'}`);
}
