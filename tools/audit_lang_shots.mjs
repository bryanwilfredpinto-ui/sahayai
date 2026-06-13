#!/usr/bin/env node
/* tools/audit_lang_shots.mjs — Section 8 (Language Audit) evidence for Chitti Car Mechanic.
 * For each language: switch #lang-select, assert html[lang], count translated nodes (English-left proxy),
 * detect RTL, and save a screenshot. Run: node tools/audit_lang_shots.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT = resolve(__dirname, 'cert_screenshots'); mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); res.end('404'); } else { res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(d); } }); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/chitti_car_mechanic.html?dp_skip=1`;
const LANGS = [['hi', 'Hindi'], ['te', 'Telugu'], ['ta', 'Tamil'], ['kn', 'Kannada'], ['bn', 'Bengali'], ['mr', 'Marathi'], ['ur', 'Urdu (RTL)']];
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
const rows = [];
for (const [code, name] of LANGS) {
  await page.selectOption('#lang-select', code); await page.waitForTimeout(1400);
  const info = await page.evaluate(() => {
    let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let node;
    while ((node = w.nextNode())) { if (node._chittiOrig !== undefined && node._chittiOrig !== node.nodeValue) n++; }
    return { lang: document.documentElement.lang, dir: getComputedStyle(document.body).direction, translated: n };
  });
  const shot = `chitti_car_mechanic_lang_${code}.png`;
  await page.screenshot({ path: resolve(SHOT, shot), fullPage: false });
  rows.push({ code, name, ...info, shot });
  console.log(`${code} ${name}: lang=${info.lang} dir=${info.dir} translated=${info.translated} → ${shot}`);
}
await page.selectOption('#lang-select', 'en'); await b.close(); server.close();
const rtlOk = rows.find(r => r.code === 'ur').dir === 'rtl';
console.log(`\nRTL (Urdu) applies dir=rtl: ${rtlOk ? 'YES' : 'NO'}`);
console.log(`LANG_AUDIT:${JSON.stringify(rows.map(r => ({ c: r.code, lang: r.lang, t: r.translated })))}`);
