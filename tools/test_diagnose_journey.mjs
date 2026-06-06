/* tools/test_diagnose_journey.mjs — BO-Diagnose, the HERO journey, tested from the
 * landing (CHITTI_MECHANIC_PROCESS.md Phase 4). A roadside user (Ramesh the delivery
 * rider, Fatima broken down after dark, Babu who can't read) must be able to DIAGNOSE
 * on screen 1 — WITHOUT first adding a vehicle. The test does NOT navigate tabs and
 * does NOT save a vehicle. Per page, on a fresh load it asserts:
 *   1. The symptom input is VISIBLE on the landing (not trapped behind "add your bike").
 *   2. A voice entry (mic) for the symptom exists (blind/illiterate first action).
 *   3. Typing a symptom + Diagnose → a verdict renders in the result box.
 *   4. The verdict box carries the per-response widget hook (🔊 + data-chitti-response).
 *   5. No raw i18n keys in the rendered verdict.
 * Vaani API is mocked for determinism. Prints DIAGNOSE:{pass,fail,failed:[...]}. */
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

const PAGES = [{ id: 'bike', file: 'chitti_2wheeler.html' }, { id: 'car', file: 'chitti_4wheeler.html' }];
const failed = []; let pass = 0;
const ok = () => pass++;
const bad = (n, d) => failed.push(`${n}: ${d}`);

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  // Deterministic swarm verdict.
  await pg.route('**/api/vaani/ask', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: '{"votes":[{"cause":"Battery","pct":80},{"cause":"Starter","pct":20}],"confidence":"High","diy_tier":"amber","diy_label":"battery","why":"Likely a discharged battery.","severity":"Medium","can_ride":"Yes, after a jump-start","cost":"₹500–₹2000","alternatives":"Loose terminal"}' }) }));
  await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(900);
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}
  await pg.waitForTimeout(300);
  // NO tab navigation, NO vehicle saved — this is a first-time roadside user on screen 1.

  // 1. Symptom input visible on the landing.
  const symVis = await pg.evaluate(() => { const e = document.getElementById('sw-symptom'); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; });
  symVis ? ok() : bad(`${P.id}/symptom-on-landing`, 'symptom input not visible on landing (trapped behind add-vehicle?)');

  // 2. Voice entry for the symptom exists + visible.
  const micVis = await pg.evaluate(() => { const e = document.querySelector('.sw-mic, [onclick*="swMic"]'); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; });
  micVis ? ok() : bad(`${P.id}/voice-symptom`, 'no visible mic for symptom on landing');

  // 3. Type a symptom + Diagnose → verdict renders.
  const verdict = await pg.evaluate(async () => {
    const inp = document.getElementById('sw-symptom'); if (!inp) return 'no-input';
    inp.value = 'bike not starting';
    try { await window.swDiagnose(); } catch (e) { return 'ERR:' + e.message; }
    await new Promise(r => setTimeout(r, 700));
    const res = document.getElementById('sw-result');
    return res ? res.innerHTML : 'no-result';
  });
  (typeof verdict === 'string' && verdict.length > 40 && /sw-verdict|Battery|Likely|confidence|वोट|जाँच|verdict/i.test(verdict))
    ? ok() : bad(`${P.id}/verdict`, String(verdict).slice(0, 80));

  // 4. The verdict box carries the per-response widget hook.
  const widget = await pg.evaluate(() => {
    const card = document.querySelector('[data-chitti-response="mb-card-swarm"], [data-chitti-response="mc-card-swarm"]');
    if (!card) return false;
    const hasSpeak = !!card.querySelector('[onclick*="swSpeakResult"], .sds-card-toolbar button');
    return !!card.getAttribute('data-chitti-response') && hasSpeak;
  });
  widget ? ok() : bad(`${P.id}/widget`, 'swarm card missing per-response widget hook');

  // 5. No raw i18n keys in the verdict.
  const raw = await pg.evaluate(() => { const r = document.getElementById('sw-result'); return r ? (r.innerText.match(/\b(mb|mc|sw)\.[a-z]+\.[a-z]+/g) || []).length : 0; });
  (raw === 0) ? ok() : bad(`${P.id}/rawkeys`, `${raw} raw keys in verdict`);

  await ctx.close();
}
await b.close(); s.close();
console.log('DIAGNOSE:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
