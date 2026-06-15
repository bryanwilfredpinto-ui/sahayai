#!/usr/bin/env node
/* Verify SOP8 / CEOS §24 crisis handling is reachable in the UI (branch build = post-deploy).
 * Run: node tools/verify_crisis.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { s.writeHead(404); s.end('x'); } else { s.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); s.end(d); } }); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${srv.address().port}/chitti_car_mechanic.html?dp_skip=1`;
const R = []; const chk = (l, ok, d) => { R.push({ l, ok }); console.log(`${ok ? '✅ PASS' : '❌ FAIL'} — ${l}${d ? ' — ' + d : ''}`); };
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
// guard: catch any attempt to auto-navigate to tel: (auto-dial) — must NEVER happen
let autoDial = false; page.on('framenavigated', f => { if (/^tel:/i.test(f.url())) autoDial = true; });
await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200);
const txt = async () => (await page.locator('#r-symptom').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

// 1) crisis keyword typed in Diagnose → family-cascade card
await page.click('#tab-diag'); await page.fill('#d-sym', 'I had an accident, smoke from engine'); await page.click('button[onclick="cmSymptom()"]'); await page.waitForTimeout(500);
let t = await txt();
chk('SOP8 crisis keyword → family-cascade card', /emergency|safe|family/i.test(t), t.slice(0, 70));
chk('SOP8 never auto-dials (Chitti will never dial)', /never dial/i.test(t) && !autoDial, 'autoDial=' + autoDial);
chk('SOP8 family-first BEFORE any call option', t.toLowerCase().indexOf('family') < t.toLowerCase().indexOf('108') || /alert your family/i.test(t), 'cascade order ok');

// 2) explicit 🆘 button → cascade
await page.fill('#d-sym', ''); await page.click('button[onclick="cmCrisis()"]'); await page.waitForTimeout(400);
t = await txt();
chk('SOP8 🆘 button → cascade card', /emergency|family|safe/i.test(t), t.slice(0, 50));

// 3) regression: ordinary symptom still diagnoses (NOT hijacked as crisis)
await page.fill('#d-sym', 'grinding brakes'); await page.click('button[onclick="cmSymptom()"]'); await page.waitForTimeout(400);
t = await txt();
chk('REGRESSION grinding brakes → diagnosis (not crisis)', /do NOT keep driving|brake/i.test(t) && !/family/i.test(t), t.slice(0, 50));

await b.close(); srv.close();
const pass = R.filter(r => r.ok).length;
console.log(`\nCRISIS verify: ${pass}/${R.length} pass`);
if (pass < R.length) process.exit(1);
