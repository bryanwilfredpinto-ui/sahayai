/**
 * tools/qa_webkit_smoke.mjs — cross-engine smoke on WebKit (the Safari/iOS
 * rendering engine). This is the honest proxy for "Safari desktop" + "Safari
 * iOS" coverage — it exercises the same engine Safari uses, though NOT on real
 * Apple hardware (no device cloud here). Firefox engine also smoked if present.
 */
import { webkit, firefox } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_health_scanner.html?dp_skip=1';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');

async function smoke(engine, name) {
  const out = { engine: name, checks: [] };
  let browser;
  try { browser = await engine.launch(); }
  catch (e) { out.checks.push({ k: 'launch', pass: false, d: String(e.message || e).slice(0, 80) }); return out; }
  for (const vp of [{ n: 'iphone-375', w: 375, h: 812 }, { n: 'ipad-768', w: 768, h: 1024 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 80)));
    try {
      await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
      const m = await p.evaluate(() => ({ cards: document.querySelectorAll('.scan-card').length, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, lang: !!document.querySelector('#lang-select') }));
      out.checks.push({ k: vp.n + ' render', pass: m.cards === 13 && (m.sw - m.cw) <= 2, d: 'cards=' + m.cards + ' overflow=' + (m.sw - m.cw) + 'px lang=' + m.lang });
      // key journey: scan→confirm→upload→save→memory
      await p.click('.scan-card .scan-btn'); await p.waitForTimeout(200);
      await p.click('#confirm-overlay .haan'); await p.waitForTimeout(200);
      await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(400);
      await p.click('button[onclick="confirmSaveToTimeline()"]'); await p.waitForTimeout(150);
      await p.click('#confirm-overlay .haan'); await p.waitForTimeout(300);
      const sites = await p.$$('#mem-body .mem-site');
      out.checks.push({ k: vp.n + ' journey save→memory', pass: sites.length >= 1, d: 'memory sites=' + sites.length });
      // language switch
      await p.evaluate(() => window.Chitti.lang.set('ta')).catch(() => {}); await p.waitForTimeout(700);
      const tamil = await p.evaluate(() => /[஀-௿]/.test(document.body.innerText));
      out.checks.push({ k: vp.n + ' Tamil switch', pass: tamil, d: 'tamil rendered=' + tamil });
      await p.screenshot({ path: 'tools/qa_handover_shots/WEBKIT_' + name + '_' + vp.n + '.png' }).catch(() => {});
      if (errs.length) out.checks.push({ k: vp.n + ' console', pass: false, d: errs[0] });
    } catch (e) { out.checks.push({ k: vp.n + ' journey', pass: false, d: String(e.message || e).slice(0, 80) }); }
    await ctx.close();
  }
  await browser.close();
  return out;
}

const results = [];
results.push(await smoke(webkit, 'WebKit (Safari engine)'));
try { results.push(await smoke(firefox, 'Firefox (Gecko engine)')); } catch (e) { results.push({ engine: 'Firefox', checks: [{ k: 'launch', pass: false, d: 'not available' }] }); }
for (const r of results) {
  const pass = r.checks.filter(c => c.pass).length, tot = r.checks.length;
  console.log('\n===== ' + r.engine + ': ' + pass + '/' + tot + ' =====');
  r.checks.forEach(c => console.log((c.pass ? '✅' : '❌') + ' ' + c.k + ' — ' + c.d));
}
import('node:fs').then(fs => fs.writeFileSync('tools/qa_webkit_result.json', JSON.stringify(results, null, 2)));
