/* tools/gates_shots.mjs — Gate 1 evidence: full-page screenshot on all 5 device classes,
 * with a signal generated so EVERY box is populated. Evidence, not claims. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT = resolve(ROOT, 'tools', 'cert_screenshots'); mkdirSync(SHOT, { recursive: true });
const AXE = readFileSync(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = createServer((rq, rs) => { let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html'; const fp = join(ROOT, p); if (!fp.startsWith(ROOT) || !existsSync(fp)) { rs.writeHead(404); rs.end(); return; } rs.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'text/plain' }); rs.end(readFileSync(fp)); });
await new Promise(r => srv.listen(8807, r));
function candles() { let px = 1906, a = []; for (let i = 0; i < 200; i++) { px *= 1 + (((i % 11) - 5) / 700); const o = px, c = px * 1.001, h = Math.max(o, c) * 1.004, l = Math.min(o, c) * 0.996; a.push({ time: 1700000000 + i * 86400, open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +c.toFixed(2), volume: 1e6 + i }); } return a; }
const DEVS = [
  { n: 'desktop_1920x1080', w: 1920, h: 1080, d: 1 },
  { n: 'laptop_1366x768', w: 1366, h: 768, d: 1 },
  { n: 'tablet_ipad_810x1080', w: 810, h: 1080, d: 2 },
  { n: 'mobile_android_360x800', w: 360, h: 800, d: 3 },
  { n: 'mobile_iphone_390x844', w: 390, h: 844, d: 3 },
];
const b = await chromium.launch({ headless: true }); const out = [];
for (const v of DEVS) {
  const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.d });
  await c.route('**/api/candles/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(candles()) }));
  await c.addInitScript(() => { try { localStorage.setItem('disability_profile', '{"done":true}'); } catch (e) {} });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8807/chitti_technical.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('[id^=chitti-disability]').forEach(e => e.remove()); });
  try { await p.evaluate(() => window.TechUI && window.TechUI.generate && window.TechUI.generate()); } catch (e) {}
  await p.waitForTimeout(1400);
  const boxes = await p.evaluate(() => document.querySelectorAll('[data-chitti-response]').length);
  await p.addScriptTag({ content: AXE });
  const serious = await p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }); return r.violations.filter(x => x.impact === 'serious' || x.impact === 'critical').map(x => x.id); });
  const file = 'tools/cert_screenshots/gate1_full_' + v.n + '.png';
  await p.screenshot({ path: resolve(ROOT, file), fullPage: true });
  out.push({ device: v.n, file, boxes, axeSerious: serious, pageErrors: errs.length });
  console.log(`OK ${v.n}: ${boxes} boxes; axe ${serious.length ? 'FAIL ' + serious.join(',') : '0'}; errs ${errs.length}`);
  await c.close();
}
await b.close(); srv.close();
writeFileSync(resolve(ROOT, 'tools', 'gates_shots_result.json'), JSON.stringify(out, null, 2));
const allClean = out.every(o => o.axeSerious.length === 0 && o.pageErrors === 0 && o.boxes >= 13);
console.log('GATE1_RESULT:' + JSON.stringify({ devices: out.length, allClean, minBoxes: Math.min(...out.map(o => o.boxes)) }));
