/* tools/health_check.mjs — Chitti Technical pre-session HEALTH CHECK
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Verifies the LIVE data feed + the REAL page before any review:
 *   Angel One connected · RELIANCE quote ₹ · RSI 0-100 · Williams %R · Stochastic ·
 *   Bollinger · Pivots · Volume · indicator grid · chart canvas renders candles ·
 *   RSI is a NUMBER on the page (not weather) · 0 page errors / not degraded.
 * Run: node tools/health_check.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(join(ROOT, 'chitti_technical_engine.js'));
const BASE = process.env.SHARES_API || 'https://chitti-shares-api-production.up.railway.app';

const rows = [];
function row(name, ok, detail) { rows.push({ name, ok: !!ok, detail }); console.log(`${ok ? '✅' : '❌'} ${name} — ${detail}`); }
const lastOf = a => (Array.isArray(a) && a.length ? a[a.length - 1] : null);

console.log('═══ CHITTI TECHNICAL — HEALTH CHECK ═══\n[A] DATA FEED + INDICATORS (live Angel One)');
let daily = null;
for (let i = 0; i < 3 && !daily; i++) {
  try { const r = await fetch(BASE + '/api/candles/RELIANCE?timeframe=Daily&days_back=160'); const a = await r.json(); if (Array.isArray(a) && a.length > 50) daily = a.map(c => ({ open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +c.volume || 0 })); } catch (e) {}
  if (!daily) await new Promise(s => setTimeout(s, 900));
}
row('Angel One data feed', !!daily, daily ? ('CONNECTED · ' + daily.length + ' Daily candles') : 'NO DATA (rate-limited?)');
const quote = daily ? lastOf(daily).close : null;
row('RELIANCE live quote', quote != null, quote != null ? ('₹' + quote) : '—');

if (daily) {
  const cl = daily.map(c => c.close);
  const rsi = lastOf(E.rsi(cl, 14)); row('RSI (must be 0-100, NOT weather)', rsi != null && rsi >= 0 && rsi <= 100, rsi != null ? rsi.toFixed(2) : 'null');
  const wr = lastOf(E.williamsR(daily, 14)); row('Williams %R (-100..0)', wr != null && wr <= 0.01 && wr >= -100, wr != null ? wr.toFixed(2) : 'null');
  const st = E.stochastic(daily); const k = lastOf(st && st.k); row('Stochastic %K (0-100)', k != null && k >= 0 && k <= 100, k != null ? k.toFixed(2) : 'null');
  const bb = E.bollinger(cl, 20, 2); const u = lastOf(bb && bb.upper), m = lastOf(bb && bb.mid), lo = lastOf(bb && bb.lower);
  row('Bollinger Bands (U>M>L)', u != null && m != null && lo != null && u > m && m > lo, u != null ? ('U ' + u.toFixed(1) + ' / M ' + m.toFixed(1) + ' / L ' + lo.toFixed(1)) : 'null');
  const piv = E.pivotsFor(daily); row('Pivot Points (Classic)', !!(piv && piv.classic && piv.classic.pp != null), piv ? ('PP ' + piv.classic.pp + ' · R1 ' + piv.classic.r1 + ' · S1 ' + piv.classic.s1) : 'null');
  row('Camarilla Pivots', !!(piv && piv.camarilla && piv.camarilla.h3 != null), piv ? ('H3 ' + piv.camarilla.h3 + ' · L3 ' + piv.camarilla.l3) : 'null');
  const sr = E.srConfluence({ daily: daily, '4h': daily, '1h': daily }); row('Support/Resistance zones', Array.isArray(sr), (sr.length || 0) + ' confluence zones');
  const vol = lastOf(daily).volume; row('Volume', vol > 0, vol > 0 ? vol.toLocaleString('en-IN') : '0');
  const ind = E.indicatorSet(daily); const pop = Object.keys(ind).filter(x => ind[x] && ind[x].value != null).length;
  row('Indicator grid', pop >= 30, pop + ' of ' + Object.keys(ind).length + ' with values+signals (RSI ' + (ind.RSI ? ind.RSI.signal : '?') + ', Supertrend ' + (ind.Supertrend ? ind.Supertrend.signal : '?') + ', MACD ' + (ind.MACD ? ind.MACD.signal : '?') + ')');
  row('Roshan ⭐ indicator', E.roshan(E.rsi(cl, 14).filter(v => v != null)) != null, 'computes RSI(14) vs SMA(20)-of-RSI');
}

console.log('\n[B] REAL PAGE (self-hosted = what is deployed) — chart pixels + RSI on screen');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const fp = join(ROOT, p); if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('404'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'text/plain' }); res.end(readFileSync(fp)); });
await new Promise(r => server.listen(8790, r));
const b = await chromium.launch({ headless: true });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
await p.goto('http://127.0.0.1:8790/chitti_technical.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1800);
await p.evaluate(() => { const m = document.getElementById('chitti-disability-profile-modal'); if (m) m.remove(); });
const chart = await p.evaluate(() => {
  const cv = document.querySelector('canvas'); if (!cv) return { ok: false, why: 'no canvas element' };
  try { const ctx = cv.getContext('2d'); const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let drawn = 0; for (let i = 0; i < d.length; i += 200) { if (d[i + 3] > 0 && !(d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245)) drawn++; } return { ok: drawn > 25, drawnPixels: drawn, w: cv.width, h: cv.height }; } catch (e) { return { ok: false, why: e.message }; }
});
row('Chart renders candles (canvas not empty)', chart.ok, JSON.stringify(chart));
const rsiPage = await p.evaluate(() => { const m = document.body.innerText.match(/RSI[^0-9\-]{0,12}(-?\d{1,3}(?:\.\d+)?)/); return m ? m[1] : null; });
row('RSI on screen = number 0-100 (NOT weather)', rsiPage != null && +rsiPage >= 0 && +rsiPage <= 100, rsiPage != null ? ('RSI = ' + rsiPage) : 'not found on page');
const boxes = await p.evaluate(() => document.querySelectorAll('[data-chitti-response]').length);
row('Response cards present', boxes >= 10, boxes + ' cards (speaker/Chitti/👍/👎/✏️ each)');
row('No page errors / not degraded (blocking)', errs.length === 0, errs.length ? errs.join(' | ') : '0 JS errors');
await b.close(); server.close();

const pass = rows.filter(r => r.ok).length;
console.log('\n──────── VERDICT ────────');
console.log('System status: ' + (pass === rows.length ? '✅ HEALTHY' : '❌ DEGRADED') + '  (' + pass + '/' + rows.length + ' checks GREEN)');
console.log('HEALTH_RESULT:' + JSON.stringify({ pass, total: rows.length, healthy: pass === rows.length, failed: rows.filter(r => !r.ok).map(r => r.name) }));
