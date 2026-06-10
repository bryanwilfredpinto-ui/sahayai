/* verify_chart_tf_live.mjs — switches the chart timeframe on the DEPLOYED public URL (real CORS,
 * no relay) and proves each redraws live. Screenshots weekly + 4h. Run: node tools/verify_chart_tf_live.mjs
 */
import path from 'path'; import { fileURLToPath } from 'url'; import { chromium } from 'playwright';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tools', 'cert_screenshots');
const URL = 'https://sahayai.in/chitti_technical_ai.html';
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('  ✗ ' + n); } };
const run = async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
  page.on('dialog', d => d.accept());
  const dp = () => page.evaluate(() => { document.querySelectorAll('#chitti-disability-profile-modal,.chitti-dp-modal,.chitti-fb-modal-bg').forEach(e => e.remove()); const sm = document.getElementById('sebi-modal'); if (sm) sm.classList.remove('show'); document.body.style.overflow = ''; }).catch(() => {});
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.TechEngine && document.querySelector('#chart-tf'), { timeout: 15000 }).catch(() => {});
  await dp(); await page.waitForTimeout(1000);
  await page.selectOption('#tech-symbol', 'RELIANCE').catch(() => {});
  await page.evaluate(() => document.getElementById('tech-analyze').click());
  await page.waitForSelector('.verdict-hero', { timeout: 25000 }); await page.waitForTimeout(2500);
  ok('chart-tf dropdown present on live URL', await page.locator('#chart-tf option').count() === 8);
  for (const tf of ['weekly', '4h', '1h', '5m']) {
    await dp(); await page.selectOption('#chart-tf', tf).catch(() => {});
    await page.waitForFunction(() => { const s = document.getElementById('chart-tf-src'); return s && !/loading/.test(s.innerText) && s.innerText.length > 2; }, { timeout: 18000 }).catch(() => {});
    const info = await page.evaluate(() => { const c = document.getElementById('tech-canvas'); let len = 0; try { len = c.toDataURL().length; } catch (e) {} return { src: (document.getElementById('chart-tf-src') || {}).innerText.replace(/\s+/g, ' ').trim(), pix: len }; });
    ok(tf + ' redraws live on the deployed page', info.pix > 3000 && /LIVE/i.test(info.src));
    console.log('  ' + tf + ': ' + info.src + ' · pix=' + info.pix);
    if (tf === '4h' || tf === 'weekly') { await page.evaluate(() => document.querySelector('canvas#tech-canvas').scrollIntoView()); await page.screenshot({ path: path.join(SHOTS, 'live_charttf_' + tf + '.png') }); }
  }
  await browser.close();
  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' verify_chart_tf_live: ' + pass + ' passed, ' + fail + ' failed.');
  process.exit(fail === 0 ? 0 : 1);
};
run().catch(e => { console.error(e); process.exit(1); });
