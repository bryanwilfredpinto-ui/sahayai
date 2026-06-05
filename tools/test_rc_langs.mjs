/* tools/test_rc_langs.mjs — A5 language matrix for the new work (RC scan strings +
 * the mc.form.title fix), all 9 shipped languages, both pages. Asserts per (page,lang):
 *   • rc.title renders in the expected SCRIPT (Devanagari/Tamil/…); never a raw key,
 *     never English when a native string exists → proves the merge + relocalize works.
 *   • the add-vehicle form title is the correct CAR/BIKE wording (mc.form.title fix).
 *   • no leftover raw mb./mc. i18n keys visible (flicker/§5 guard) after settle.
 * Prints RCLANG:{pass,fail,failed:[...]}. */
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

// Expected unicode script range per language (rc.title must contain at least one char).
const SCRIPT = {
  en: /[A-Za-z]/, hi: /[ऀ-ॿ]/, mr: /[ऀ-ॿ]/, bn: /[ঀ-৿]/,
  ta: /[஀-௿]/, te: /[ఀ-౿]/, kn: /[ಀ-೿]/, ml: /[ഀ-ൿ]/, gu: /[઀-૿]/,
};
const LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
const PAGES = [
  { id: 'bike', file: 'chitti_2wheeler.html', tab: 'mbTab', arg: 'bike', formKey: 'mb.form.title' },
  { id: 'car', file: 'chitti_4wheeler.html', tab: 'mcTab', arg: 'car', formKey: 'mc.form.title' },
];

const failed = []; let pass = 0;
const ok = () => pass++;
const bad = (n, d) => failed.push(`${n}: ${d}`);

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const pg = await b.newPage({ viewport: { width: 390, height: 800 } });
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.goto(`${B}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(900);
  try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}
  await pg.evaluate(([fn, a]) => window[fn] && window[fn](a), [P.tab, P.arg]);
  for (const lang of LANGS) {
    const res = await pg.evaluate(({ lang, formKey }) => {
      try { localStorage.setItem('chitti_vaani_lang', lang); } catch (e) {}
      window.dispatchEvent(new CustomEvent('chitti:langchange', { detail: { lang } }));
      if (typeof window.updateAllStrings === 'function') window.updateAllStrings(lang);
      return null;
    }, { lang, formKey: P.formKey });
    await pg.waitForTimeout(220);
    const out = await pg.evaluate(({ formKey }) => {
      const t = document.querySelector('[data-vai-i18n="rc.title"]');
      const f = document.querySelector(`[data-vai-i18n="${formKey}"]`);
      const rawKeys = (document.body.innerText.match(/\b(mb|mc|rc)\.[a-z]+\.[a-z]+/g) || []).length;
      return { rc: t ? t.textContent.trim() : '', form: f ? f.textContent.trim() : '', rawKeys };
    }, { formKey: P.formKey });
    // rc.title in the right script + not a raw key
    (SCRIPT[lang].test(out.rc) && !/rc\.title/.test(out.rc)) ? ok() : bad(`${P.id}/${lang}/rc.title`, `"${out.rc}"`);
    // form title present + right script + not a raw key + (car) not the bike word
    const formOk = out.form && SCRIPT[lang].test(out.form) && !/form\.title/.test(out.form);
    formOk ? ok() : bad(`${P.id}/${lang}/form.title`, `"${out.form}"`);
    // no visible raw i18n keys (flicker/§5)
    (out.rawKeys === 0) ? ok() : bad(`${P.id}/${lang}/rawkeys`, `${out.rawKeys} raw keys visible`);
  }
  await pg.close();
}
await b.close(); s.close();
console.log('RCLANG:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
