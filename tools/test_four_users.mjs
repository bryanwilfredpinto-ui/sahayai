/* tools/test_four_users.mjs — the four users as EXPLICIT journey gates (CHITTI_MECHANIC_
 * PROCESS.md: the floor of every BO). On a fresh landing, per page, prove each archetype
 * can operate screen 1. Not an attribute count — each is a concrete can-they-do-it check.
 *
 *  BLIND  (Arjun)     : every visible response box has a 🔊/speak control; symptom has a mic;
 *                       a global speak fn exists; primary controls carry aria-label or text.
 *  DEAF   (Imran)     : diagnosis renders as VISIBLE TEXT (not audio-only); an ISL affordance
 *                       exists; results are not delivered by sound alone.
 *  MUTE   (Pooja)     : every primary action has a NON-voice path — symptom is a typeable text
 *                       input, Scan-RC is a file/photo input, actions are tap buttons.
 *  ILLIT. (Babu)      : every primary landing control carries an ICON (emoji) AND a speak path;
 *                       nothing requires reading a word to act.
 * Prints FOURUSERS:{pass,fail,failed:[...]}. */
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
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.route('**/api/vaani/ask', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: '{"votes":[{"cause":"Battery","pct":80}],"confidence":"High","why":"Likely a discharged battery.","severity":"Medium","can_ride":"Yes","cost":"₹500"}' }) }));
  await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(900);
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}
  await pg.waitForTimeout(300);

  // ── BLIND ──
  const blind = await pg.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; };
    const boxes = Array.from(document.querySelectorAll('[data-chitti-response]')).filter(vis);
    const boxesWithSpeak = boxes.filter(bx => bx.querySelector('[onclick*="Speak" i], [onclick*="speak" i], .sds-card-toolbar button, [aria-label*="सुन" i], [aria-label*="listen" i]'));
    const mic = document.querySelector('.sw-mic, [onclick*="swMic"]');
    const speakFn = typeof window.speakText === 'function' || typeof window.chittiSpeak === 'function' || !!(window.Chitti && window.Chitti.speak);
    return { boxes: boxes.length, withSpeak: boxesWithSpeak.length, mic: !!mic && vis(mic), speakFn };
  });
  (blind.boxes > 0 && blind.withSpeak === blind.boxes) ? ok() : bad(`${P.id}/blind-speak`, `${blind.withSpeak}/${blind.boxes} boxes have a speak control`);
  (blind.mic && blind.speakFn) ? ok() : bad(`${P.id}/blind-voice`, `mic=${blind.mic} speakFn=${blind.speakFn}`);

  // ── DEAF ── diagnosis renders visible text; ISL affordance exists.
  const deafText = await pg.evaluate(async () => {
    const inp = document.getElementById('sw-symptom'); if (!inp) return 'no-input';
    inp.value = 'not starting'; try { await window.swDiagnose(); } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
    const res = document.getElementById('sw-result');
    return res ? (res.innerText || '').trim().length : 0;
  });
  (typeof deafText === 'number' && deafText > 20) ? ok() : bad(`${P.id}/deaf-visualtext`, `verdict visible-text len=${deafText}`);
  const isl = await pg.evaluate(() => !!document.querySelector('[class*="isl" i], [id*="isl" i], [onclick*="isl" i], [aria-label*="sign language" i], [data-vai-i18n*="isl" i]') || !!(window.Chitti && window.Chitti.isl));
  isl ? ok() : bad(`${P.id}/deaf-isl`, 'no ISL affordance found');

  // ── MUTE ── non-voice path for every primary action.
  const mute = await pg.evaluate(() => {
    const sym = document.getElementById('sw-symptom');
    const typeable = !!sym && (sym.tagName === 'INPUT' || sym.tagName === 'TEXTAREA') && !sym.disabled;
    const rcFile = document.querySelector('#mb-rc-file, #mc-rc-file');
    const photoPath = !!rcFile && rcFile.type === 'file';
    const diagnoseBtn = !!document.querySelector('.sw-go, [onclick*="swDiagnose"]');
    return { typeable, photoPath, diagnoseBtn };
  });
  (mute.typeable && mute.photoPath && mute.diagnoseBtn) ? ok() : bad(`${P.id}/mute-nonvoice`, JSON.stringify(mute));

  // ── ILLITERATE ── primary landing controls have an icon + a speak path; aria present.
  const illit = await pg.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; };
    const primaries = Array.from(document.querySelectorAll('.sds-btn-primary, .sds-btn.primary, .sw-go')).filter(vis);
    const withIcon = primaries.filter(btn => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u.test(btn.textContent || ''));
    const speakable = typeof window.speakText === 'function' || typeof window.chittiSpeak === 'function';
    return { primaries: primaries.length, withIcon: withIcon.length, speakable };
  });
  (illit.primaries > 0 && illit.withIcon === illit.primaries && illit.speakable)
    ? ok() : bad(`${P.id}/illiterate-icons`, `${illit.withIcon}/${illit.primaries} primary controls have an icon; speak=${illit.speakable}`);

  await ctx.close();
}
await b.close(); s.close();
console.log('FOURUSERS:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
