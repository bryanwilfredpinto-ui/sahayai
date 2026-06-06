/* tools/test_lang_dropdown.mjs — proves the language dropdown WORKS (Sire 2026-06-06:
 * "language dropdown HAS TO WORK, refer Chitti Vaani"). Per page, asserts:
 *   1. #lang-select has EXACTLY the 9 fully-translated languages (no 28-option bloat).
 *   2. Switching to each of the 9 → brand title renders in the right SCRIPT, the select
 *      value syncs, localStorage('chitti_vaani_lang') persists, and NO raw mb./mc. keys show.
 *   3. Stale-lang guard: a saved unsupported lang ('pa') falls back to a valid one on load.
 * Prints LANGDROP:{pass,fail,failed:[...]}. */
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

const WANT = ['hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
const SCRIPT = { en: /[A-Za-z]/, hi: /[ऀ-ॿ]/, mr: /[ऀ-ॿ]/, bn: /[ঀ-৿]/, ta: /[஀-௿]/, te: /[ఀ-౿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/, gu: /[઀-૿]/ };
const PAGES = [{ id: 'bike', file: 'chitti_2wheeler.html' }, { id: 'car', file: 'chitti_4wheeler.html' }];

const failed = []; let pass = 0;
const ok = () => pass++;
const bad = (n, d) => failed.push(`${n}: ${d}`);

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const pg = await b.newPage({ viewport: { width: 390, height: 820 } });
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}

  // 1. exactly the 9 wanted options
  const opts = await pg.$$eval('#lang-select option', os => os.map(o => o.value));
  (JSON.stringify(opts) === JSON.stringify(WANT)) ? ok() : bad(`${P.id}/options`, `got [${opts}]`);

  // 2. each language switches cleanly
  for (const lang of WANT) {
    const res = await pg.evaluate((lang) => {
      const sel = document.getElementById('lang-select');
      sel.value = lang;
      sel.dispatchEvent(new Event('change', { bubbles: true }));   // drives onchange="changeLang"
      return null;
    }, lang);
    await pg.waitForTimeout(220);
    const out = await pg.evaluate(() => ({
      brand: (document.querySelector('.sds-brand-name') || {}).textContent || '',
      selVal: document.getElementById('lang-select').value,
      saved: (() => { try { return localStorage.getItem('chitti_vaani_lang'); } catch (e) { return ''; } })(),
      rawKeys: (document.body.innerText.match(/\b(mb|mc|rc)\.[a-z]+\.[a-z]+/g) || []).length,
    }));
    const scriptOk = SCRIPT[lang].test(out.brand);
    (scriptOk && out.selVal === lang && out.saved === lang && out.rawKeys === 0)
      ? ok()
      : bad(`${P.id}/${lang}`, `brand="${out.brand}" sel=${out.selVal} saved=${out.saved} raw=${out.rawKeys}`);
  }

  // 3. stale-lang guard — saved 'pa' (no longer offered) must fall back to a valid 9
  await pg.evaluate(() => { try { localStorage.setItem('chitti_vaani_lang', 'pa'); } catch (e) {} });
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);
  const guard = await pg.evaluate(() => document.getElementById('lang-select').value);
  (WANT.indexOf(guard) !== -1) ? ok() : bad(`${P.id}/staleguard`, `select shows "${guard}" (not in 9)`);

  await pg.close();
}
await b.close(); s.close();
console.log('LANGDROP:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
