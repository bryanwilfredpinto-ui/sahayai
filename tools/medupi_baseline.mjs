// tools/medupi_baseline.mjs — real baseline: render across viewports, count REAL JS errors
// (network/CORS failures to prod are recorded separately, not counted as page bugs),
// verify 5 frontend gates, check no horizontal overflow.
import { chromium } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_medupi.html';
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];
const b = await chromium.launch({ headless: true });
const report = { url: URL, viewports: [] };
for (const vp of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height } });
  const pageerrors = [], consoleErrors = [], netFails = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => pageerrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', r => netFails.push(r.url().split('?')[0]));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const m = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
    return {
      title: document.title,
      bodyLen: document.body.innerText.length,
      overflow,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      gate_feedback: !!document.querySelector('script[src*="feedback-widget"]'),
      gate_a11y: !!document.querySelector('script[src*="chitti_a11y"]'),
      gate_lang: !!(window.Chitti && window.Chitti.lang),
      gate_isl: !!(window.Chitti && window.Chitti.isl) || !!document.querySelector('script[src*="chitti_isl"]'),
      responseBoxes: document.querySelectorAll('[data-chitti-response],.chitti-response').length,
      tabs: document.querySelectorAll('[role="tab"]').length,
      buttons: document.querySelectorAll('button').length,
    };
  });
  // network failures to prod are EXPECTED (no CORS from localhost) — separate them
  const realPageErrors = pageerrors.filter(e => !/Failed to fetch|NetworkError|CORS|ERR_FAILED/i.test(e));
  report.viewports.push({ vp: vp.name, ...m, pageErrorsAll: pageerrors.length, realPageErrors, netFailCount: netFails.length, sampleNetFails: [...new Set(netFails)].slice(0,5) });
  console.log(`[${vp.name}] title="${m.title}" overflow=${m.overflow} boxes=${m.responseBoxes} tabs=${m.tabs} btns=${m.buttons} gates(fb/a11y/lang/isl)=${m.gate_feedback}/${m.gate_a11y}/${m.gate_lang}/${m.gate_isl} realErrs=${realPageErrors.length} netFails=${netFails.length}`);
  if (realPageErrors.length) console.log('   REAL ERRORS:', realPageErrors.slice(0,5));
  await ctx.close();
}
await b.close();
import { writeFileSync } from 'node:fs';
writeFileSync('tools/medupi_baseline_result.json', JSON.stringify(report, null, 2));
console.log('\nwrote tools/medupi_baseline_result.json');
