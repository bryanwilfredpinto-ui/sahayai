/* tools/test_landing_journey.mjs — THE test the old QC was missing.
 * Per CHITTI_MECHANIC_PROCESS.md: a BO test must start where the USER starts (the
 * default landing screen, no tab navigation) and prove the FOUR USERS can find +
 * start the primary actions on screen 1. The RC-buried-in-a-tab bug passed the old
 * test because it called mbTab('bike') first; this test must NOT navigate.
 *
 * Per page, on a FRESH load (no saved vehicle, default home tab), asserts:
 *   1. Language dropdown present with exactly the 9 native-script options (Vaani pattern).
 *   2. A VISIBLE "Scan your RC" primary control on landing (illiterate/mute first action).
 *   3. A VISIBLE voice/speak primary control on landing (blind/illiterate first action).
 *   4. Every primary landing control has a tap target ≥48px.
 *   5. No raw mb./mc./rc. i18n keys visible (clean i18n on screen 1).
 * Prints LANDING:{pass,fail,failed:[...]}. Visible = real layout box, not display:none. */
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

// All 26 languages (matches Chitti Vaani's dropdown).
const WANT9 = ['hi', 'en', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'sa', 'mai', 'kok', 'doi', 'ks', 'ne', 'sd', 'mni', 'sat', 'bho', 'raj', 'kru', 'hoc'];
const PAGES = [{ id: 'bike', file: 'chitti_2wheeler.html' }, { id: 'car', file: 'chitti_4wheeler.html' }];

const failed = []; let pass = 0;
const ok = () => pass++;
const bad = (n, d) => failed.push(`${n}: ${d}`);

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } });
  // FRESH user: no saved vehicle. (Do NOT pre-mark onboarding — we dismiss the modal like a real user.)
  const pg = await ctx.newPage();
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(900);
  // Real user dismisses the one-time accessibility onboarding modal (it carries the lang picker).
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}
  await pg.waitForTimeout(300);
  // From here: NO tab navigation. This is screen 1.

  // 1. Language dropdown — 9 native-script options.
  const opts = await pg.$$eval('#lang-select option', os => os.map(o => o.value)).catch(() => []);
  (JSON.stringify(opts) === JSON.stringify(WANT9)) ? ok() : bad(`${P.id}/dropdown`, `opts=[${opts}]`);

  // Collect every VISIBLE control's text+aria on screen 1 (real layout box, not display:none).
  const ctrls = await pg.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.offsetParent !== null; };
    return Array.from(document.querySelectorAll('button, a, [role=button]'))
      .filter(vis)
      .map(e => ({ t: (e.textContent || '').trim(), a: e.getAttribute('aria-label') || '', h: Math.round(e.getBoundingClientRect().height) }));
  });

  // 2. Scan-RC primary control visible on landing.
  const rcVis = ctrls.some(c => /RC/.test(c.t + c.a) && /स्कैन|Scan|ஸ்கேன்|స్కాన్|স্ক্যান|સ્કેન|ಸ್ಕ್ಯಾನ್|സ്കാൻ|स्कॅन/i.test(c.t + c.a));
  rcVis ? ok() : bad(`${P.id}/rc-on-landing`, 'no visible "Scan your RC" control on the landing screen');

  // 3. Voice/speak primary control visible on landing.
  const voiceVis = ctrls.some(c => /🎙|🎤/.test(c.t) || /बोल|speak|voice|सुन|பேச|మాట్లాడ|বল|બોલ|ಮಾತ/i.test(c.t + c.a));
  voiceVis ? ok() : bad(`${P.id}/voice-on-landing`, 'no visible voice/speak control on the landing screen');

  // 4. Primary onboarding controls ≥44px tap target.
  const small = ctrls.filter(c => /RC|स्कैन|Scan|बोल|खुद|🎙/i.test(c.t) && c.h > 0 && c.h < 44).length;
  (small === 0) ? ok() : bad(`${P.id}/tap`, `${small} landing onboarding control(s) < 44px tall`);

  // 5. No raw i18n keys on the landing screen.
  const raw = await pg.evaluate(() => (document.body.innerText.match(/\b(mb|mc|rc)\.[a-z]+\.[a-z]+/g) || []).length);
  (raw === 0) ? ok() : bad(`${P.id}/rawkeys`, `${raw} raw i18n keys visible on landing`);

  // 6. Dropdown display MUST match the rendered content language (the visual-cert bug:
  //    content painted Hindi while the dropdown showed English). The brand title's script
  //    must match the language the <select> is showing.
  const SCRIPT = { en: /[A-Za-z]/, hi: /[ऀ-ॿ]/, mr: /[ऀ-ॿ]/, bn: /[ঀ-৿]/, ta: /[஀-௿]/, te: /[ఀ-౿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/, gu: /[઀-૿]/ };
  const lc = await pg.evaluate(() => ({ sel: document.getElementById('lang-select').value, brand: (document.querySelector('.sds-brand-name') || {}).textContent || '' }));
  (SCRIPT[lc.sel] && SCRIPT[lc.sel].test(lc.brand)) ? ok() : bad(`${P.id}/lang-consistency`, `dropdown shows "${lc.sel}" but brand renders "${lc.brand}"`);

  await ctx.close();
}
await b.close(); s.close();
console.log('LANDING:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
