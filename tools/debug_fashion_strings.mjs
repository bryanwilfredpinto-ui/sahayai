/**
 * tools/debug_fashion_strings.mjs
 *
 * Step 1 of Sire 2026-05-23 follow-up: capture the EXACT DevTools console
 * error on chitti_fashion.html and dump the rendered DOM to spot any raw
 * i18n keys (`fa.title`, `fa.tab.almari`, etc.) that leak through.
 */
import { chromium } from 'playwright';
const URL_LOCAL = 'http://127.0.0.1:8765/chitti_fashion.html?cb=' + Date.now();
const URL_LIVE  = 'https://sahayai.in/chitti_fashion.html?cb=' + Date.now();

async function probe(label, url) {
  console.log(`\n══════ ${label} — ${url}`);
  const b = await chromium.launch({ headless: true });
  const page = await (await b.newContext({ viewport:{ width:375, height:812 } })).newPage();
  const errs = [];
  const failed = [];
  page.on('pageerror', (e) => errs.push('PAGE_ERROR ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE_ERROR ' + m.text()); });
  page.on('requestfailed', (req) => failed.push(req.url() + ' :: ' + req.failure()?.errorText));
  page.on('response', (r) => { if (r.url().endsWith('strings.js') || r.url().includes('strings.js?')) console.log('  strings.js response: ' + r.status() + ' (' + r.url() + ')'); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log(`  console errors: ${errs.length}`);
  errs.slice(0, 8).forEach((e) => console.log('   • ' + e.slice(0, 200)));
  console.log(`  failed requests: ${failed.length}`);
  failed.slice(0, 6).forEach((f) => console.log('   • ' + f));

  // Are window.updateAllStrings + window.VAI_STRINGS present?
  const state = await page.evaluate(() => ({
    hasFn: typeof window.updateAllStrings === 'function',
    hasBag: !!window.VAI_STRINGS,
    bagKeys: window.VAI_STRINGS ? Object.keys(window.VAI_STRINGS) : [],
    faTitleHi: window.VAI_STRINGS?.hi?.['fa.title'] || null,
    storedLang: (function(){ try { return localStorage.getItem('chitti_vaani_lang'); } catch(e){ return null; } })(),
  }));
  console.log('  window.updateAllStrings function?', state.hasFn);
  console.log('  window.VAI_STRINGS present?     ', state.hasBag);
  console.log('  bag keys                        ', state.bagKeys.join(','));
  console.log('  fa.title (hi)                   ', state.faTitleHi);
  console.log('  localStorage.chitti_vaani_lang  ', state.storedLang);

  // Sweep the DOM for raw `fa.*` or `mb.*` or `na.*` keys leaking into textContent.
  const leaks = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (!t) return;
      const m = t.match(/\b(fa|mb|mc|na|set|tab|hdr|err)\.[a-z][a-z0-9.]+/);
      if (m) out.push({ tag: el.tagName, attr: el.getAttribute('data-vai-i18n') || '-', text: t.slice(0, 80), key: m[0] });
    });
    return out;
  });
  console.log(`  raw i18n keys leaking: ${leaks.length}`);
  leaks.slice(0, 10).forEach((l) => console.log(`   • <${l.tag}> data-vai-i18n="${l.attr}" → "${l.text}" (key=${l.key})`));

  await b.close();
}

await probe('LOCAL', URL_LOCAL);
await probe('LIVE',  URL_LIVE);
