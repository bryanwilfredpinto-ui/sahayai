// DS-retrofit visual cert — renders each retrofitted page at 375px,
// reads back computed body font-size + background, confirms the tricolour
// stripe renders, and writes a screenshot. UI/UX agent, 2026-06-16.
import { chromium } from 'playwright';
import path from 'node:path';
import url from 'node:url';

const repo = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const pages = [
  'chitti_medupi','chitti_upi','chitti_scanner','chitti_news_ai','chitti_technical_ai',
  'chitti_vaani','chitti_news','chitti_ca','chitti_legal','chitti_government',
  'chitti_2wheeler','chitti_4wheeler'
];
const outDir = path.join(repo, 'tools', 'cert_screenshots');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const results = [];
for (const p of pages) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,120)));
  const fileUrl = url.pathToFileURL(path.join(repo, p + '.html')).href;
  try {
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1200);
    const data = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      // first <p> or text node-ish element font size
      const stripe = [...document.querySelectorAll('div,header')].find(el => {
        const bg = getComputedStyle(el).backgroundImage || '';
        return bg.includes('gradient') && el.getBoundingClientRect().top < 12 && el.getBoundingClientRect().height <= 12 && el.getBoundingClientRect().width > 200;
      });
      const dsLoaded = [...document.styleSheets].some(s => (s.href||'').includes('sahayai_design_system.css'));
      return {
        bodyFont: cs.fontSize,
        bodyBg: cs.backgroundColor,
        bgImg: (cs.backgroundImage||'').slice(0,40),
        stripeFound: !!stripe,
        stripeGrad: stripe ? getComputedStyle(stripe).backgroundImage.slice(0,90) : null,
        dsLoaded,
      };
    });
    await page.screenshot({ path: path.join(outDir, `ds_${p}_375.png`) });
    results.push({ p, ...data, errs: errs.slice(0,2) });
  } catch (e) {
    results.push({ p, error: String(e).slice(0,140), errs: errs.slice(0,2) });
  }
  await page.close();
}
await browser.close();
for (const r of results) {
  if (r.error) { console.log(`${r.p.padEnd(20)} ERROR ${r.error}`); continue; }
  console.log(`${r.p.padEnd(20)} font=${r.bodyFont.padEnd(6)} bg=${r.bodyBg.padEnd(20)} ds=${r.dsLoaded} stripe=${r.stripeFound} ${r.errs.length?'JSERR:'+r.errs.join('|'):''}`);
}
