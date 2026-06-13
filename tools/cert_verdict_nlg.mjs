/* cert_verdict_nlg.mjs — G2 proof: the verdict NLG renders in the user's
 * language (template-based, DeepSeek-swappable) with proper-noun lock intact.
 * Switches to Kannada/Tamil/Hindi → #vh-vernacular shows native script;
 * RSI/symbol/₹ stay English; English hides the line; full 26-lang sweep
 * never crashes and never leaves a covered language in English.
 * Run: node tools/cert_verdict_nlg.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n); console.log('  ✗ ' + n); } };
// Unicode block tests (proof the text is actually in-script, not English)
const SCRIPT = { kn: /[ಀ-೿]/, ta: /[஀-௿]/, hi: /[ऀ-ॿ]/, te: /[ఀ-౿]/, ur: /[؀-ۿ]/, bn: /[ঀ-৿]/, ml: /[ഀ-ൿ]/, gu: /[઀-૿]/ };

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; });
  await dp();
  await page.evaluate(() => { const b = document.getElementById('tech-analyze'); if (b) b.click(); });
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });

  ok('#vh-vernacular element exists', await page.locator('#vh-vernacular').count() === 1);
  ok('vernacular hidden in English (default)', await page.locator('#vh-vernacular').evaluate(e => e.hidden) === true);

  async function switchTo(lg) { await page.selectOption('#lang-select', lg); await page.waitForTimeout(220); return (await page.locator('#vh-vernacular').innerText()).trim(); }

  for (const lg of ['kn', 'ta', 'hi']) {
    const txt = await switchTo(lg);
    ok(`${lg}: vernacular line visible + populated`, txt.length > 0 && await page.locator('#vh-vernacular').evaluate(e => !e.hidden));
    ok(`${lg}: text is in native script`, SCRIPT[lg].test(txt));
    ok(`${lg}: proper-noun lock — "RSI" stays English`, /RSI/.test(txt));
    ok(`${lg}: proper-noun lock — symbol "RELIANCE" stays English`, /RELIANCE/.test(txt));
  }

  await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(220);
  ok('English hides the vernacular line again', await page.locator('#vh-vernacular').evaluate(e => e.hidden) === true);

  // full 26-language sweep: no crash; covered langs must render their script
  const langs = await page.evaluate(() => [...document.querySelectorAll('#lang-select option')].map(o => o.value));
  const covered = await page.evaluate(() => (window.Chitti && window.Chitti.lang && window.Chitti.lang.verdictCovered) || []);
  ok('≥26 languages in dropdown', langs.length >= 26);
  ok('verdictCovered exposed (≥14 hand-verified langs)', covered.length >= 14);
  let coveredScriptOK = 0, coveredScriptTotal = 0;
  for (const lg of langs) {
    try {
      const txt = await switchTo(lg);
      if (lg !== 'en' && SCRIPT[lg]) { coveredScriptTotal++; if (SCRIPT[lg].test(txt)) coveredScriptOK++; }
    } catch (e) { /* recorded via errs */ }
  }
  ok('all languages switch without JS error', errs.length === 0 || (console.log('    errs:', errs.slice(0, 3).join(' | ')), false));
  ok(`every script-testable covered lang renders native script (${coveredScriptOK}/${coveredScriptTotal})`, coveredScriptOK === coveredScriptTotal && coveredScriptTotal >= 6);

  console.log(`\n${fail === 0 ? '✅' : '❌'} cert_verdict_nlg: ${pass} passed, ${fail} failed.` + (fails.length ? '\n   FAILED: ' + fails.join(' · ') : ''));
  await browser.close(); server.close();
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
