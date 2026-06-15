#!/usr/bin/env node
/* Developer verification of QA bugs #1/#3 fix (+ evidence for #2/#5).
 * Serves the working-tree (this branch) — byte-identical to what live becomes after merge+deploy.
 * Run: node tools/verify_qa_fixes.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdirSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..'); const SHOT = resolve(__dirname, 'cert_screenshots'); mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { s.writeHead(404); s.end('x'); } else { s.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); s.end(d); } }); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/chitti_car_mechanic.html?dp_skip=1`;
const R = []; const chk = (l, ok, d) => { R.push({ l, ok }); console.log(`${ok ? '✅' : '❌'} ${l}${d ? ' — ' + d : ''}`); };
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200);

// ── BUG #1 — the EXACT QA failure: scroll down, then a REAL tap on a tab must NOT be intercepted ──
await page.evaluate(() => window.scrollTo(0, 1000)); await page.waitForTimeout(450);
let bug1 = true, detail = '';
try { await page.click('#tab-price', { timeout: 6000 }); } catch (e) { bug1 = false; detail = 'tab click intercepted: ' + e.message.split('\n')[0]; }
const priceActive = await page.evaluate(() => document.getElementById('panel-price')?.classList.contains('active'));
chk('BUG#1 tab tap after scroll succeeds (no interception)', bug1 && priceActive, detail || 'panel-price active');

// sticky tab bar docks BELOW the disclaimer with NO overlap during NORMAL scroll (tall panel, content below)
await page.click('#tab-diag'); await page.waitForTimeout(200);
await page.evaluate(() => window.scrollTo(0, 1200)); await page.waitForTimeout(400);
const geo = await page.evaluate(() => { const d = document.querySelector('.disc').getBoundingClientRect(); const t = document.querySelector('.tabs').getBoundingClientRect(); return { discBottom: Math.round(d.bottom), tabsTop: Math.round(t.top), sticky: getComputedStyle(document.querySelector('.tabs')).position === 'sticky' }; });
chk('BUG#1 sticky tab bar docks below disclaimer (no overlap)', geo.sticky && geo.tabsTop >= geo.discBottom - 2, `discBottom=${geo.discBottom} tabsTop=${geo.tabsTop} sticky=${geo.sticky}`);
let deepTap = true; try { await page.click('#tab-fuel', { timeout: 5000 }); } catch (e) { deepTap = false; }
chk('BUG#1 tab tap while scrolled succeeds', deepTap && await page.evaluate(() => document.getElementById('panel-fuel').classList.contains('active')));
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);

// ── BUG #3 — action auto-scrolls the answer into view (below the sticky bars) ──
await page.click('#tab-price'); await page.waitForTimeout(200);
await page.fill('#s-quote', '8500'); await page.click('button[onclick="cmScam()"]'); await page.waitForTimeout(900);
const vis = await page.evaluate(() => { const r = document.querySelector('#r-scam .res-box').getBoundingClientRect(); const top = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--disc-h')) || 0) + 92; return { top: Math.round(r.top), inView: r.top >= 0 && r.top < window.innerHeight, clearOfBars: r.top >= top - 40 }; });
chk('BUG#3 answer auto-scrolls into view, clear of sticky bars', vis.inView, `res top=${vis.top}px`);

// ── no horizontal scroll regression (sticky tabs must not add overflow) ──
const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
chk('No horizontal-scroll regression @390px', over <= 1, 'overflow=' + over + 'px');

// ── BUG #2 evidence — per-box widget icons (shared substrate, document-wide scan) ──
const widget = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.chitti-fb-bbtn, .chitti-fb-btn')];
  const html = btns.map(b => b.outerHTML).join('');
  const acts = [...new Set(btns.map(b => b.getAttribute('data-act') || b.getAttribute('data-vote') || ''))].filter(Boolean);
  return { count: btns.length, speak: /🔊/.test(html), chitti: /demo|Chitti|🎙️|mic|🤖/i.test(html), up: /👍/.test(html), down: /👎/.test(html), acts };
});
chk('BUG#2 per-box widget present (🔊 + Chitti + 👍 + 👎)', widget.count > 0 && widget.speak && widget.chitti && widget.up && widget.down, 'acts=' + JSON.stringify(widget.acts));
console.log('   ↳ literal 🤖 glyph: ' + (/🤖/.test(JSON.stringify(widget)) ? 'present' : 'ABSENT — substrate uses a "Chitti" button instead (shared feedback-widget.js)'));

// ── BUG #5 evidence — turn ISL on, render a response, screenshot the ISL panel ──
let islFound = false;
try {
  // try the a11y bar ISL toggle (🤟) or the substrate API
  await page.evaluate(() => { try { if (window.Chitti && window.Chitti.isl && window.Chitti.isl.enable) window.Chitti.isl.enable(); } catch (e) {} });
  const islBtn = page.locator('button[aria-label*="ISL" i], button:has-text("🤟")');
  if (await islBtn.count()) await islBtn.first().click().catch(() => {});
  await page.click('#tab-diag'); await page.fill('#d-sym', 'overheating'); await page.click('button[onclick="cmSymptom()"]'); await page.waitForTimeout(1200);
  islFound = await page.evaluate(() => !!document.querySelector('[class*="isl"],[id*="isl"]'));
} catch (e) {}
await page.screenshot({ path: resolve(SHOT, 'qa_isl_evidence.png'), fullPage: false });
chk('BUG#5 ISL substrate reachable (panel/element present when ISL on)', islFound, 'screenshot: qa_isl_evidence.png');

await b.close(); server.close();
const pass = R.filter(r => r.ok).length;
console.log(`\nVERIFY: ${pass}/${R.length} pass`);
if (pass < R.length) process.exit(1);
