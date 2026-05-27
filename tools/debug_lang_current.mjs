import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{width:375,height:812}})).newPage();
await page.goto('https://sahayai.in/chitti_logo_video.html', { waitUntil:'networkidle' });
await page.waitForTimeout(3000);
const r = await page.evaluate(() => ({
  Chitti: typeof window.Chitti,
  Chitti_lang: typeof (window.Chitti && window.Chitti.lang),
  Chitti_lang_current: typeof (window.Chitti && window.Chitti.lang && window.Chitti.lang.current),
  current_value: (window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.current === 'function') ? window.Chitti.lang.current() : '(no fn)',
  Chitti_a11y: typeof (window.Chitti && window.Chitti.a11y),
  Chitti_isl: typeof (window.Chitti && window.Chitti.isl),
  htmlLang: document.documentElement.lang,
}));
console.log(JSON.stringify(r, null, 2));
await b.close();
