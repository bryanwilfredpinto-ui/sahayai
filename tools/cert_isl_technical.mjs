/* cert_isl_technical.mjs — G1 proof: the ISL four-channel actually animates.
 * Opens chitti_technical_ai.html (backend blocked → DEMO), renders a verdict,
 * clicks the 🤟 ISL button, and proves the panel fingerspells RELIANCE
 * letter-by-letter, the lossless "ISL: R-E-L-I-A-N-C-E" fallback renders,
 * Replay works, and axe finds 0 serious/critical. Run: node tools/cert_isl_technical.mjs
 */
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => { let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/chitti_technical_ai.html'; const fp = path.join(ROOT, f); if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

const run = async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://localhost:${server.address().port}/chitti_technical_ai.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => (/chitti-shares-api|railway\.app|up\.railway/.test(r.request().url()) ? r.abort() : r.continue()));
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  // dismiss first-visit modals programmatically (same as faces cert)
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; });
  await dp();
  // render a verdict (programmatic click — avoids unrelated overlay interception)
  await page.evaluate(() => { const b = document.getElementById('tech-analyze'); if (b) b.click(); });
  await page.waitForSelector('.verdict-hero', { timeout: 8000 });

  ok('🤟 ISL button present in verdict surface', await page.locator('#vh-isl').count() === 1);
  ok('ISL button aria-label set', /Indian Sign Language/i.test(await page.locator('#vh-isl').getAttribute('aria-label') || ''));
  ok('ISL button ≥48px tall', (await page.locator('#vh-isl').boundingBox()).height >= 48);
  ok('ISL panel starts hidden', await page.locator('#isl-panel-host').evaluate(e => e.hidden) === true);

  await dp();
  await page.evaluate(() => document.getElementById('vh-isl').click());
  await page.waitForSelector('.chitti-isl-panel', { timeout: 4000 });
  ok('panel opens on ISL click', await page.locator('.chitti-isl-panel').count() === 1);
  ok('aria-expanded flips to true', await page.locator('#vh-isl').getAttribute('aria-expanded') === 'true');
  ok('panel is a labelled region', await page.locator('.chitti-isl-panel[role=region]').count() === 1);

  // fingerspell proof: capture the data-isl-letter sequence AND the fallback
  // text over time (the panel advances through several words, so collect all).
  const seen = new Set(), fbSeen = new Set();
  for (let i = 0; i < 30; i++) {
    const l = await page.locator('.chitti-isl-stage').getAttribute('data-isl-letter'); if (l && l.trim()) seen.add(l.trim());
    const f = (await page.locator('#chitti-isl-fallback').innerText()).trim(); if (f) fbSeen.add(f);
    await page.waitForTimeout(150);
  }
  ok('letters animate (≥3 distinct letters seen for RELIANCE)', seen.size >= 3);
  ok('R-E-L-I-A-N letters all observed', ['R', 'E', 'L', 'I', 'A', 'N'].every(c => seen.has(c)));
  ok('lossless fallback "ISL: R-E-L-I-A-N-C-E"', [...fbSeen].some(f => /ISL:\s*R-E-L-I-A-N-C-E/.test(f)));
  ok('interpreter note present', /certified interpreter/i.test(await page.locator('.chitti-isl-note').innerText()));
  ok('placeholder honesty note present', /placeholder/i.test(await page.locator('.chitti-isl-note').innerText()));

  // Replay works
  const replay = page.locator('.chitti-isl-replay');
  ok('Replay button present + ≥48px', await replay.count() === 1 && (await replay.boundingBox()).height >= 48);
  await page.evaluate(() => document.querySelector('.chitti-isl-replay').click());
  await page.waitForTimeout(250);
  ok('Replay restarts (index resets near 0)', (+(await page.locator('.chitti-isl-stage').getAttribute('data-isl-index'))) <= 3);

  // toggle closed
  await page.evaluate(() => document.getElementById('vh-isl').click());
  ok('panel hides on second click', await page.locator('#isl-panel-host').evaluate(e => e.hidden) === true);

  // axe — 0 serious/critical on the panel-open page
  await page.evaluate(() => document.getElementById('vh-isl').click());
  await page.waitForSelector('.chitti-isl-panel', { timeout: 4000 });
  await page.addScriptTag({ path: path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js') }).catch(() => {});
  const axe = await page.evaluate(async () => { if (!window.axe) return { skip: true }; const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }); return { serious: r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id) }; });
  if (axe.skip) ok('axe present (axe-core installed)', false);
  else ok('axe 0 serious/critical', axe.serious.length === 0 || (console.log('    serious:', axe.serious.join(', ')), false));

  console.log(`\n${fail === 0 ? '✅' : '❌'} cert_isl_technical: ${pass} passed, ${fail} failed.` + (fails.length ? '\n   FAILED: ' + fails.join(' · ') : ''));
  await browser.close(); server.close();
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); server.close(); process.exit(1); });
