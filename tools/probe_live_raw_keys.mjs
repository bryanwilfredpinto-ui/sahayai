/**
 * tools/probe_live_raw_keys.mjs
 * Headless Chrome against LIVE sahayai.in — sweep DOM for ANY visible
 * raw i18n key (fa.* / mb.* / mc.* / na.* / set.* / fb.* / chai.* / ui.*).
 * Run for English + Hindi + Telugu. Reports keys + element + visible text.
 */
import { chromium } from 'playwright';
const PAGES = ['chitti_4wheeler.html', 'chitti_2wheeler.html', 'chitti_fashion.html'];
const LANGS = ['en','hi','te'];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 } });
const page = await ctx.newPage();

let totalLeaks = 0;
const consoleErrs = [];
page.on('pageerror', e => consoleErrs.push('PAGE ' + e));
page.on('console', m => { if (m.type() === 'error') consoleErrs.push('CONSOLE ' + m.text()); });

for (const pg of PAGES) {
  for (const lang of LANGS) {
    const cb = Date.now() + Math.random();
    await page.goto('https://sahayai.in/' + pg + '?cb=' + cb, { waitUntil:'domcontentloaded' });
    // Clear + set lang
    await page.evaluate((l) => {
      try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
      localStorage.setItem('chitti_vaani_lang', l);
    }, lang);
    await page.goto('https://sahayai.in/' + pg + '?cb=' + (cb+1), { waitUntil:'networkidle' });
    await page.waitForTimeout(700);
    const leaks = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('body *').forEach(el => {
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
        if (el.children.length) return;
        const t = (el.textContent || '').trim();
        const m = t && t.match(/\b(fa|mb|mc|na|set|tab|hdr|err|fb|ui|chai|vai)\.[a-z][a-z0-9.]+/);
        if (m) out.push({ tag: el.tagName, key: m[0], text: t.slice(0, 80), attr: el.getAttribute('data-vai-i18n') || '' });
      });
      return out;
    });
    const state = await page.evaluate(() => ({
      hasFn: typeof window.updateAllStrings === 'function',
      hasBag: !!window.VAI_STRINGS,
    }));
    console.log(`${pg} [${lang}]  leaks=${leaks.length}  updateAllStrings=${state.hasFn}  bag=${state.hasBag}`);
    leaks.slice(0, 5).forEach(l => console.log(`   • <${l.tag}> data-vai-i18n="${l.attr}" → "${l.text}" (key=${l.key})`));
    totalLeaks += leaks.length;
  }
}

await b.close();
console.log(`\nTotal raw-key leaks across live LIVE pages × 3 langs: ${totalLeaks}`);
console.log(`Console errors observed: ${consoleErrs.length}`);
consoleErrs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 200)));
