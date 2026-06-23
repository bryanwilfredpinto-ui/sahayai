// Phase 4A probe — for each page: ← Vaani link in header? runtime #lang-select option count? JS errors?
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAGES = [
  'chitti_car_mechanic.html', 'chitti_medupi.html', 'chitti_government.html',
  'chitti_news.html', 'chitti_fundamentals.html', 'chitti_health_file.html',
  'chitti_voice_factory.html', 'chitti_isl.html', 'chitti_upi.html',
  'chitti_scanner.html', 'chitti_fashion.html', 'chitti_psychology.html',
  'chitti_news_ai.html', 'chitti_ca_os.html', 'chitti_legal_os.html',
  'chitti_mechanic_2w.html', 'chitti_kisan.html',
];

const browser = await chromium.launch();
const rows = [];
for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  let res = { p, exists: true };
  try {
    await page.goto(pathToFileURL(path.join(ROOT, p)).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1800);
    res = await page.evaluate(() => {
      const sels = Array.from(document.querySelectorAll('select')).map(s => ({ id: s.id, n: s.options.length }));
      const langSel = document.querySelector('#lang-select');
      const vaaniLink = Array.from(document.querySelectorAll('header a, header button, a, button'))
        .find(el => /chitti_vaani\.html/.test(el.getAttribute('href') || el.getAttribute('onclick') || '')
          || /(←|⬅|back).{0,12}vaani/i.test((el.textContent || '').trim()));
      const inHeader = vaaniLink ? !!vaaniLink.closest('header') : false;
      return {
        langSelOpts: langSel ? langSel.options.length : null,
        anySelects: sels.filter(s => s.id).slice(0, 6),
        hasVaani: !!vaaniLink,
        vaaniInHeader: inHeader,
        vaaniText: vaaniLink ? (vaaniLink.textContent || '').trim().slice(0, 24) : null,
      };
    });
    res.p = p; res.exists = true;
  } catch (e) {
    res = { p, exists: false, err: String(e).split('\n')[0] };
  }
  res.jsErrors = errs.length;
  res.firstErr = errs[0] || '';
  rows.push(res);
  await ctx.close();
}
await browser.close();

console.log('PAGE'.padEnd(30), 'lang#'.padStart(6), ' ←Vaani(hdr)', ' JSerr', '  note');
for (const r of rows) {
  if (!r.exists) { console.log(r.p.padEnd(30), '  —  MISSING/err:', r.err); continue; }
  const lang = r.langSelOpts === null ? 'no#sel' : String(r.langSelOpts);
  const vaani = r.hasVaani ? (r.vaaniInHeader ? 'YES(hdr)' : 'yes(body)') : 'NO';
  console.log(
    r.p.padEnd(30), lang.padStart(6), vaani.padStart(12), String(r.jsErrors).padStart(6),
    '  ', r.langSelOpts === null ? ('selects=' + JSON.stringify(r.anySelects)) : '',
    r.firstErr ? ('ERR:' + r.firstErr.slice(0, 60)) : ''
  );
}
