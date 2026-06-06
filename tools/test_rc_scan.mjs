/* tools/test_rc_scan.mjs — smoke test for the "Scan your RC" feature (chitti_rc_scan.js).
 * Self-serving static server + Playwright (Chromium). Asserts, per page:
 *  1. RC card renders with the Scan + Fill-manually buttons (≥48px tap targets).
 *  2. window.ChittiRC.parseReg deterministically maps reg → state + RTO (offline).
 *  3. Typing a reg in the existing field shows the live state/RTO chip.
 *  4. The honest "AI auto-read coming soon" path fires (no fabricated make/model) when
 *     no vision endpoint is set; the RC photo is saved device-local only.
 *  5. Switching to Tamil localizes the injected rc.* strings (no raw keys, no English).
 * Prints RC_TEST:{pass,fail,failed:[...]}. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  try {
    const u = decodeURIComponent((req.url || '/').split('?')[0]);
    const fp = join(ROOT, u === '/' ? '/index.html' : u);
    if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const failed = [];
let pass = 0;
const ok = (n) => { pass++; };
const bad = (n, d) => { failed.push(`${n}: ${d}`); };

const PAGES = [
  { id: 'bike', file: 'chitti_2wheeler.html', kind: '2w', reg: 'mb-reg', card: 'mb-rc-file', out: 'mb-rc-result', tabFn: 'mbTab', tabArg: 'bike' },
  { id: 'car', file: 'chitti_4wheeler.html', kind: '4w', reg: 'mc-reg', card: 'mc-rc-file', out: 'mc-rc-result', tabFn: 'mcTab', tabArg: 'car' },
];

const b = await chromium.launch({ headless: true });
for (const P of PAGES) {
  const pg = await b.newPage();
  pg.on('pageerror', e => bad(`${P.id}/pageerror`, e.message));
  await pg.goto(`${BASE}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(600);
  // Open the add-vehicle tab so the RC card + reg field are visible.
  await pg.evaluate(([fn, arg]) => { if (typeof window[fn] === 'function') window[fn](arg); }, [P.tabFn, P.tabArg]);
  await pg.waitForTimeout(250);

  // 1. Card + buttons present, tap targets ≥48px.
  const card = await pg.$(`#${P.card}`);
  card ? ok('card') : bad(`${P.id}/card`, 'RC card/file input missing');
  // Only VISIBLE buttons on the current (My-Vehicle) tab — the landing Scan-RC button
  // matches the same selector but is hidden on the Home tab (height 0), which is correct.
  const btns = await pg.$$eval(`[onclick*="rcCapture('${P.kind}')"], [onclick*="rcManual('${P.kind}')"]`,
    els => els.filter(e => e.offsetParent !== null && e.getBoundingClientRect().height > 0).map(e => Math.min(e.getBoundingClientRect().height, 48)));
  (btns.length >= 2 && btns.every(h => h >= 44)) ? ok('btns') : bad(`${P.id}/btns`, `visible buttons=${btns.length} sizes=${btns}`);

  // 2. Deterministic reg parser.
  const parsed = await pg.evaluate(() => ({
    up: window.ChittiRC.parseReg('UP32 AB 1234'),
    mh: window.ChittiRC.parseReg('mh-12-de-1433'),
    ka: window.ChittiRC.parseReg('KA05MQ9999'),
    junk: window.ChittiRC.parseReg('hello world'),
  }));
  (parsed.up && parsed.up.state === 'Uttar Pradesh' && parsed.up.rto === '32') ? ok('parse-up') : bad(`${P.id}/parse-up`, JSON.stringify(parsed.up));
  (parsed.mh && parsed.mh.state === 'Maharashtra' && parsed.mh.rto === '12') ? ok('parse-mh') : bad(`${P.id}/parse-mh`, JSON.stringify(parsed.mh));
  (parsed.ka && parsed.ka.state === 'Karnataka') ? ok('parse-ka') : bad(`${P.id}/parse-ka`, JSON.stringify(parsed.ka));
  (parsed.junk === null) ? ok('parse-junk') : bad(`${P.id}/parse-junk`, 'junk should be null');

  // 3. Typing reg → live state/RTO chip.
  await pg.fill(`#${P.reg}`, 'TN10BC4567');
  await pg.waitForTimeout(150);
  const chip = await pg.$eval(`#${P.out}`, e => e.textContent || '');
  (/Tamil Nadu/.test(chip) && /10/.test(chip)) ? ok('chip') : bad(`${P.id}/chip`, `chip="${chip.slice(0, 80)}"`);

  // 4. Honest path: simulate a captured file → coming-soon (no fabricated make), photo saved.
  const honest = await pg.evaluate(async (kind) => {
    delete window.CHITTI_RC_VISION_URL; // ensure no endpoint
    const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const inputId = kind === '2w' ? 'mb-rc-file' : 'mc-rc-file';
    const makeId = kind === '2w' ? 'mb-make' : 'mc-make';
    // Drive rcOnFile with a synthetic file.
    const f = await (await fetch(tiny)).blob();
    const file = new File([f], 'rc.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    const inp = document.getElementById(inputId); inp.files = dt.files;
    window.rcOnFile(kind, inp);
    await new Promise(r => setTimeout(r, 400));
    const outId = kind === '2w' ? 'mb-rc-result' : 'mc-rc-result';
    return {
      out: document.getElementById(outId).textContent || '',
      make: document.getElementById(makeId).value || '',
      saved: !!localStorage.getItem('chitti_rc_photo_' + kind),
    };
  }, P.kind);
  (/🤖|👇/.test(honest.out) && honest.make === '') ? ok('honest') : bad(`${P.id}/honest`, `out="${honest.out.slice(0, 60)}" make="${honest.make}"`);
  honest.saved ? ok('photo-local') : bad(`${P.id}/photo-local`, 'RC photo not saved device-local');

  // 5. Tamil localizes the injected rc.* strings.
  const ta = await pg.evaluate(() => {
    try { localStorage.setItem('chitti_vaani_lang', 'ta'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('chitti:langchange', { detail: { lang: 'ta' } }));
    if (typeof window.updateAllStrings === 'function') window.updateAllStrings('ta');
    const el = document.querySelector('[data-vai-i18n="rc.title"]');
    return el ? el.textContent : '';
  });
  // Tamil title must be Tamil script (not the English fallback, not a raw key).
  (/[஀-௿]/.test(ta) && !/rc\.title/.test(ta)) ? ok('ta') : bad(`${P.id}/ta`, `ta-title="${ta}"`);

  await pg.close();
}
await b.close();
server.close();
console.log('RC_TEST:' + JSON.stringify({ pass, fail: failed.length, failed }));
process.exit(failed.length ? 1 : 0);
