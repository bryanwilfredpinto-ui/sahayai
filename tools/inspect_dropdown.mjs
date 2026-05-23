/**
 * Inspect the language dropdown rendering on:
 *  - chitti_vaani.html
 *  - chitti_2wheeler.html
 *  - chitti_4wheeler.html
 * Capture closed + open screenshots and dump option innerText so we know
 * exactly what Sire is seeing.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8765';
const out = (n) => resolve(__dirname, n);

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();

for (const file of ['chitti_vaani.html','chitti_2wheeler.html','chitti_4wheeler.html']) {
  console.log('\n══ ' + file);
  await page.goto(BASE + '/' + file, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'networkidle' });
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const sel = document.getElementById('lang-select');
    if (!sel) return { found: false };
    return {
      found: true,
      currentValue: sel.value,
      displayText: sel.options[sel.selectedIndex]?.textContent || '',
      options: Array.from(sel.options).map(o => ({ v: o.value, t: o.textContent })),
      computedFontFamily: getComputedStyle(sel).fontFamily,
      computedWidth: getComputedStyle(sel).width,
      rect: sel.getBoundingClientRect()
    };
  });
  console.log('Dropdown info:');
  console.log('  found:', info.found);
  if (info.found) {
    console.log('  currentValue:', info.currentValue);
    console.log('  displayText :', JSON.stringify(info.displayText));
    console.log('  width       :', info.computedWidth);
    console.log('  options:');
    info.options.forEach(o => console.log('    ' + o.v + ' → ' + JSON.stringify(o.t)));
  }

  await page.screenshot({ path: out('inspect_' + file.replace('.html','') + '_closed.png'), clip: { x: 0, y: 0, width: 375, height: 200 } });
}

await b.close();
