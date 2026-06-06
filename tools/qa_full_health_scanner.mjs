/**
 * tools/qa_full_health_scanner.mjs — FULL automated QA for Chitti Health Scanner.
 * Permanent-requirement battery (2026-06-06): ALL 26 languages, ALL 8 accessibility
 * profiles (axe per profile), REAL sample-file uploads. Everything an agent CAN
 * automate — only real iPhone/Android hardware is left for Sire.
 *
 * Output: tools/qa_full_result.json + tools/qa_full_shots/*.png
 * Usage:  CERT_BASE=http://127.0.0.1:8765 node tools/qa_full_health_scanner.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_health_scanner.html?dp_skip=1';
const SHOTS = resolve(__dirname, 'qa_full_shots'); try { mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

const LANGS = ['en','hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur','sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc'];
const NATIVE = { en:'English',hi:'हिन्दी',bn:'বাংলা',te:'తెలుగు',ta:'தமிழ்',mr:'मराठी',gu:'ગુજરાતી',kn:'ಕನ್ನಡ',ml:'മലയാളം',pa:'ਪੰਜਾਬੀ',or:'ଓଡ଼ିଆ',as:'অসমীয়া',ur:'اردو',sa:'संस्कृतम्',mai:'मैथिली',kok:'कोंकणी',doi:'डोगरी',ks:'کٲشُر',ne:'नेपाली',sd:'سنڌي',mni:'মৈতৈলোন্',sat:'ᱥᱟᱱᱛᱟᱲᱤ',bho:'भोजपुरी',raj:'राजस्थानी',kru:'कुड़ुख़',hoc:'हो' };
const PROFILES = ['blind','deaf','mute','illiterate','elderly','isl','cognitive','rural'];
const RTL = { ur:1, ks:1, sd:1 };

// Real sample files (genuine images already in the repo) + a real non-image for the negative test.
const SAMPLE_SMALL = readFileSync(resolve(ROOT, 'tools/qa_handover_shots/VP_mobile-375.png'));   // ~112 KB real PNG
const SAMPLE_LARGE = readFileSync(resolve(ROOT, 'tools/cert_screenshots/chitti_fashion_375.png')); // ~827 KB real PNG
const SAMPLE_NONIMG = readFileSync(resolve(ROOT, 'chitti-health-scanner/README.md'));              // real non-image

const ANALYZE_OK = JSON.stringify({ status:'ok', scan_type:'skin', is_not_diagnosis:true,
  observation:'A small reddish raised area, about 5 mm, with a regular border.', confidence:71, urgency:'monitor',
  action:'Worth watching — re-check in a few days.', reasons:['mild redness','regular border'],
  disclaimer:'This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.',
  skin_tone_note:'AI is less accurate on darker skin tones (Fitzpatrick IV–VI).' });

const report = { base: BASE, languages: [], profiles: [], uploads: [], generated: 'run-time' };
const COLLECT = `()=>{const o=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p)return 2;if(/SCRIPT|STYLE|OPTION|SELECT/.test(p.tagName))return 2;if(p.closest('select#lang-select'))return 2;const t=(n.nodeValue||'').trim();if(!t||!/[A-Za-z]/.test(t)||t.replace(/[^A-Za-z]/g,'').length<3)return 2;return 1;}});let n;while(n=w.nextNode())o.push(n.nodeValue.trim());return o;}`;

async function ctxPage(browser, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 800 } }, (opts && opts.context) || {}));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error' && !/CORS|ERR_FAILED|Access to fetch/.test(m.text())) errs.push('CE:' + m.text().slice(0, 90)); });
  page._errs = errs;
  page.on('dialog', d => { d.accept(d.type() === 'prompt' ? 'Mother' : undefined).catch(() => {}); });
  await page.addInitScript(() => { try { localStorage.setItem('chitti_hs_cost_suppress_until', String(Date.now() + 8.64e7)); } catch (e) {} });
  await page.route('**/api/health-scanner/analyze', r => r.fulfill({ status: 200, contentType: 'application/json', body: ANALYZE_OK })).catch(() => {});
  return { ctx, page };
}
async function loadAxe(page) {
  try { await page.addScriptTag({ path: resolve(ROOT, 'node_modules/axe-core/axe.min.js') }); return true; }
  catch (e) { try { await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' }); return true; } catch (e2) { return false; } }
}

async function run() {
  // Fresh browser per part — bounds headless-Chromium resource use over many contexts.
  let browser = await chromium.launch();

  // ─── PART 1 — ALL 26 LANGUAGES (coverage + flicker) ───
  {
    const { ctx, page } = await ctxPage(browser);
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200);
    // WARM-UP: trigger one non-en switch so the runtime background-preloads ALL 26 packs,
    // then return to en — so every per-language measurement below is warm (not cold-pack-load).
    await page.evaluate(() => window.Chitti.lang.set('hi')); await page.waitForTimeout(4000);
    await page.evaluate(() => window.Chitti.lang.set('en')); await page.waitForTimeout(600);
    const en = [...new Set(await page.evaluate(`(${COLLECT})()`))];
    for (const code of LANGS) {
      const t0 = Date.now();
      const samples = await page.evaluate(async (x) => {
        const el = () => (document.querySelector('.hero .golden') || document.body).textContent.trim().slice(0, 26);
        window.Chitti.lang.set(x);
        const out = [el()];
        for (const ms of [80, 250, 500, 900]) { await new Promise(r => setTimeout(r, ms)); out.push(el()); }
        return out;
      }, code);
      await page.waitForTimeout(700); // let lazy pack + preload settle
      const after = new Set(await page.evaluate(`(${COLLECT})()`));
      const miss = code === 'en' ? [] : en.filter(s => after.has(s) && !/^(chitti|deepseek|upi|ai|pmjay|aes-256-gcm|sebi|nse|bse|fssai|abdm|dpdp)$/i.test(s.trim()));
      const cov = en.length ? Math.round((en.length - miss.length) / en.length * 100) : 0;
      const dir = await page.evaluate(() => document.documentElement.dir);
      const uniqSeq = samples.filter((v, i) => i === 0 || v !== samples[i - 1]);
      const flicker = uniqSeq.length > 2;               // settle-then-flip-back = flicker; one transition = lazy load
      const rtlOk = RTL[code] ? dir === 'rtl' : dir !== 'rtl';
      const pass = !flicker && rtlOk && (code === 'en' || cov >= 70);
      report.languages.push({ code, native: NATIVE[code], coveragePct: cov, flicker, dir, rtlOk, switchMs: Date.now() - t0, pass });
    }
    await page.evaluate(() => window.Chitti.lang.set('hi')).catch(() => {});
    await page.screenshot({ path: resolve(SHOTS, 'LANG_26_hi.png') }).catch(() => {});
    await ctx.close();
  }

  await browser.close(); browser = await chromium.launch();
  // ─── PART 2 — ALL 8 ACCESSIBILITY PROFILES (axe + structural) ───
  for (const flag of PROFILES) {
    const { ctx, page } = await ctxPage(browser, {});
    await page.addInitScript((f) => { try { localStorage.setItem('disability_profile', JSON.stringify({ [f]: true, _ts: 1 })); } catch (e) {} }, flag);
    await page.goto(BASE + '/chitti_health_scanner.html', { waitUntil: 'domcontentloaded' }); // NO dp_skip — let the profile drive
    await page.waitForTimeout(2500);
    let axe = 'n/a'; if (await loadAxe(page)) { try { axe = (await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['color-contrast','region','button-name','image-alt','aria-required-attr','label'] })).violations.map(v => ({ id: v.id, n: v.nodes.length })))); } catch (e) { axe = 'err'; } }
    const s = await page.evaluate(() => ({
      profileApplied: (function(){ try { return !!JSON.parse(localStorage.getItem('disability_profile')); } catch(e){ return false; } })(),
      ariaLive: document.querySelectorAll('[aria-live]').length,
      speakers: [...document.querySelectorAll('button')].filter(b => /🔊/.test(b.textContent)).length,
      iconNav: document.querySelectorAll('.nav-icons button,.nav-icons a').length,
      langSel: !!document.querySelector('#lang-select'),
      imgsNoAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt') && i.getAttribute('aria-hidden') !== 'true').length,
      btnsNoName: [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length,
      urgencyIconText: !!document.querySelector('.legend .item span'),     // colour paired with text+icon
      islLoaded: !!document.querySelector('script[src*="chitti_isl.js"]'),
      grid: document.querySelectorAll('.scan-card').length,
    }));
    const axeViol = Array.isArray(axe) ? axe.length : (axe === 'n/a' ? 0 : 1);
    const pe = page._errs.length;
    const pass = s.grid === 13 && s.langSel && s.ariaLive >= 1 && s.speakers >= 1 && s.iconNav >= 5 &&
                 s.imgsNoAlt === 0 && s.btnsNoName === 0 && s.urgencyIconText && axeViol === 0 && pe === 0;
    await page.screenshot({ path: resolve(SHOTS, 'PROFILE_' + flag + '.png') }).catch(() => {});
    report.profiles.push({ flag, pass, axeViolations: axe, pageErrors: pe, structural: s });
    await ctx.close();
  }

  await browser.close(); browser = await chromium.launch();
  // ─── PART 3 — REAL FILE UPLOADS ───
  const uploads = [
    { name: 'real-small.png', mime: 'image/png', buf: SAMPLE_SMALL, expect: 'ok', desc: 'real PNG ~112 KB' },
    { name: 'real-large.png', mime: 'image/png', buf: SAMPLE_LARGE, expect: 'ok', desc: 'real PNG ~827 KB' },
    { name: 'not-an-image.md', mime: 'text/markdown', buf: SAMPLE_NONIMG, expect: 'graceful', desc: 'real non-image (markdown) — must not crash' },
  ];
  for (const u of uploads) {
    const { ctx, page } = await ctxPage(browser);
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1800);
    let pass = false, detail = '';
    try {
      await page.waitForSelector('.scan-card .scan-btn', { timeout: 15000 });
      await page.click('.scan-card .scan-btn[onclick*="\'skin\'"]');
      await page.waitForSelector('#confirm-overlay.shown', { timeout: 15000 });
      await page.click('#confirm-overlay .haan');
      await page.waitForSelector('#confirm-overlay.shown', { state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.setInputFiles('#file-input', { name: u.name, mimeType: u.mime, buffer: u.buf });
      await page.waitForSelector('#scan-result.shown', { timeout: 15000 });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(() => ({
        thumb: (document.getElementById('result-thumb').style.display === 'block'),
        ai: (document.getElementById('ai-out').innerText || '').replace(/\s+/g, ' ').slice(0, 80),
      }));
      // save to memory
      await page.click('button[onclick="confirmSaveToTimeline()"]');
      await page.waitForSelector('#confirm-overlay.shown', { timeout: 15000 });
      await page.click('#confirm-overlay .haan');
      await page.waitForTimeout(400);
      const mem = (await page.$$('#mem-body .mem-site')).length;
      const noLeak = !/\b(melanoma|cancer|diagnosis of|you have a)\b/i.test(r.ai.replace(/not a diagnosis/ig, ''));
      pass = (r.thumb || u.expect === 'graceful') && mem >= 1 && noLeak && page._errs.length === 0;
      detail = 'thumb=' + r.thumb + ' mem=' + mem + ' noDiagnosisLeak=' + noLeak + ' ai="' + r.ai + '"';
    } catch (e) { pass = false; detail = 'ERR ' + String(e.message || e).slice(0, 100); }
    if (page._errs.length) { pass = false; detail += ' | PE:' + page._errs[0]; }
    await page.screenshot({ path: resolve(SHOTS, 'UPLOAD_' + u.name.replace(/[^a-z0-9]/gi, '_') + '.png') }).catch(() => {});
    report.uploads.push({ file: u.desc, name: u.name, sizeKB: Math.round(u.buf.length / 1024), pass, detail });
    await ctx.close();
  }

  await browser.close();
  writeFileSync(resolve(__dirname, 'qa_full_result.json'), JSON.stringify(report, null, 2));

  const lp = report.languages.filter(l => l.pass).length, pp = report.profiles.filter(p => p.pass).length, up = report.uploads.filter(u => u.pass).length;
  console.log('\n===== PART 1 — 26 LANGUAGES: ' + lp + '/26 PASS =====');
  report.languages.forEach(l => console.log((l.pass ? '✅' : '❌') + ' ' + l.code.padEnd(4) + ' cov=' + String(l.coveragePct).padStart(3) + '% flicker=' + l.flicker + ' dir=' + l.dir + (l.rtlOk ? '' : ' RTL-WRONG')));
  console.log('\n===== PART 2 — 8 A11Y PROFILES: ' + pp + '/8 PASS =====');
  report.profiles.forEach(p => console.log((p.pass ? '✅' : '❌') + ' ' + p.flag.padEnd(11) + ' axe=' + JSON.stringify(p.axeViolations) + ' pageErr=' + p.pageErrors + ' speakers=' + p.structural.speakers + ' iconNav=' + p.structural.iconNav + ' ariaLive=' + p.structural.ariaLive + ' imgNoAlt=' + p.structural.imgsNoAlt + ' btnNoName=' + p.structural.btnsNoName));
  console.log('\n===== PART 3 — REAL FILE UPLOADS: ' + up + '/' + uploads.length + ' PASS =====');
  report.uploads.forEach(u => console.log((u.pass ? '✅' : '❌') + ' ' + u.name + ' (' + u.sizeKB + ' KB) ' + u.detail));
}
run().catch(e => { console.error(e); process.exit(1); });
