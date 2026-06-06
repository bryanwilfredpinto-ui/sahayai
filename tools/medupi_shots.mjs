// tools/medupi_shots.mjs — rendered screenshots for the handover: 3 viewports + Hindi + tabs.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_medupi.html';
const DIR = 'test_screenshots/medupi';
mkdirSync(DIR, { recursive: true });
const INIT = () => { try { localStorage.setItem('disability_profile', JSON.stringify({ lang: 'en', ts: 't', skipped: true })); localStorage.setItem('chitti_medupi_disclaimer_ack', '1'); } catch (e) {} };
const b = await chromium.launch({ headless: true });
const shots = [];
for (const [name, w, h] of [['375', 375, 812], ['768', 768, 1024], ['1440', 1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${DIR}/medupi_scan_${name}.png`, fullPage: false });
  shots.push(`medupi_scan_${name}.png`);
  // Compare tab
  await p.evaluate(() => { if (typeof showTab === 'function') showTab('compare'); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${DIR}/medupi_compare_${name}.png`, fullPage: false });
  shots.push(`medupi_compare_${name}.png`);
  await ctx.close();
}
// Hindi @375
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(INIT);
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.Chitti.lang.set('hi'));
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${DIR}/medupi_hindi_375.png`, fullPage: false });
  shots.push('medupi_hindi_375.png');
  await ctx.close();
}
await b.close();
console.log('Saved screenshots to ' + DIR + ':\n  ' + shots.join('\n  '));
