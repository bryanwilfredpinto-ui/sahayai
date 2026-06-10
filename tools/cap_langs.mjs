/* cap_langs.mjs — screenshots the page in Hindi/Telugu/Tamil/Bengali/Marathi for the Language Audit.
 * Reports honestly whether English remains. Backend blocked (DEMO). Run: node tools/cap_langs.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
const LANGS = [['hi', 'Hindi'], ['te', 'Telugu'], ['ta', 'Tamil'], ['bn', 'Bengali'], ['mr', 'Marathi']];

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#lang-select option'), { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal').forEach(e => e.remove()); const oh = document.getElementById('onboarding-host'); if (oh) oh.style.display = 'none'; });
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.ind-table', { timeout: 10000 }).catch(() => {});
  for (const [code, name] of LANGS) {
    await page.selectOption('#lang-select', code).catch(() => {});
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const lang = document.documentElement.lang;
      // does the section chrome show non-Latin script anywhere? + do technical terms stay English?
      const headings = [...document.querySelectorAll('.card h3, .tablist [role=tab]')].map(e => e.innerText).join(' | ');
      const nonLatin = /[ऀ-෿ঀ-৿஀-௿ఀ-౿]/.test(document.body.innerText);
      const termsEnglish = /RSI/.test((document.querySelector('.ind-table') || {}).innerText || '') && /MACD/.test((document.querySelector('.ind-table') || {}).innerText || '');
      const englishHeadings = /Price chart|Technical rating|Indicators|Support|Read a stock/.test(headings);
      return { lang, nonLatin, termsEnglish, englishHeadings };
    });
    console.log(name + ' (' + code + '): html.lang=' + info.lang + ' · non-Latin-present=' + info.nonLatin + ' · technical-terms-English=' + info.termsEnglish + ' · English-section-labels-remain=' + info.englishHeadings);
    await page.screenshot({ path: path.join(SHOTS, 'lang_' + code + '.png'), fullPage: false });
  }
  await browser.close(); server.close();
  console.log('saved lang_{hi,te,ta,bn,mr}.png');
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
