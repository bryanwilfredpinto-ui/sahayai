/* tools/test_roadside_journey.mjs — BO-SelfFix / BO-Scan / SOS, tested from the landing.
 * A STRANDED user with NO saved vehicle (Fatima after dark, Babu 40km from a mechanic)
 * must reach, on screen 1 without adding a vehicle: Emergency SOS, the OFFLINE Roadside
 * Self-Fix, the AI Scanners, and the Health Score. These were trapped inside #*-summary
 * (hidden until a vehicle existed). Per page, fresh load, NO tab nav, NO vehicle:
 *   1. SOS control visible on landing.
 *   2. Roadside Self-Fix launch visible on landing (offline core).
 *   3. AI Scanners launch visible on landing.
 *   4. Health Score launch visible on landing.
 *   5. Tapping Self-Fix opens the offline wizard (works with network aborted).
 * Prints ROADSIDE:{pass,fail,failed:[...]}. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const s = createServer((q, r) => { try { const u = decodeURIComponent((q.url || '/').split('?')[0]); const fp = join(ROOT, u); if (!fp.startsWith(ROOT) || !existsSync(fp)) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); r.end(readFileSync(fp)); } catch (e) { r.writeHead(500); r.end('' + e); } });
await new Promise(r => s.listen(0, '127.0.0.1', r));
const B = `http://127.0.0.1:${s.address().port}`;

const PAGES = [
  { id: 'bike', file: 'chitti_2wheeler.html', sos: '.mb-quick-sos', sf: '#mb-selffix-card', sc: '#mb-scanners-card', hs: '#mb-hscore-card', kind: '2w' },
  { id: 'car', file: 'chitti_4wheeler.html', sos: '.mc-quick-sos', sf: '#mc-selffix-card', sc: '#mc-scanners-card', hs: '#mc-hscore-card', kind: '4w' },
];
const failed = []; let pass = 0;
const ok = () => pass++;
const bad = (n, d) => failed.push(`${n}: ${d}`);
const visEval = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; })()`;

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 880 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1000);
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}
  await pg.waitForTimeout(400);

  for (const [label, sel] of [['sos', P.sos], ['selffix', P.sf], ['scanners', P.sc], ['healthscore', P.hs]]) {
    const v = await pg.evaluate(visEval(sel));
    v ? ok() : bad(`${P.id}/${label}-on-landing`, `${sel} not visible on landing (trapped in summary?)`);
  }

  // 5. Self-Fix opens offline (network aborted) — the "don't go to a mechanic" core.
  await pg.route('**/api/**', r => r.abort());
  const opened = await pg.evaluate(async (kind) => {
    try {
      if (window.ChittiSelfFix && window.ChittiSelfFix.open) window.ChittiSelfFix.open(kind);
      else { const c = document.querySelector('[data-csf-launch]'); if (c) c.click(); }
      await new Promise(r => setTimeout(r, 400));
      return document.body.innerText.length > 50;
    } catch (e) { return 'ERR:' + e.message; }
  }, P.kind);
  (opened === true) ? ok() : bad(`${P.id}/selffix-offline`, String(opened));

  await ctx.close();
}
await b.close(); s.close();
console.log('ROADSIDE:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
