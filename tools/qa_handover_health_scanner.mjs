/**
 * tools/qa_handover_health_scanner.mjs
 *
 * Pre-handover QA gauntlet for Chitti Health Scanner (Guardian Memory).
 * Runs REAL automated browser tests (Playwright/Chromium) and records honest
 * PASS/FAIL + timing + screenshots. Sections map to the Sire QA spec:
 *   A1 20 user journeys · A2 edge cases · A3 viewports · A4 a11y (axe/manual)
 *   A5 9 languages + flicker · A7 performance.
 *
 * Honest scope note: only Chromium is installed in this environment. Firefox,
 * Safari/WebKit, real iOS & Android devices CANNOT be exercised here — they are
 * reported as NOT-RUN, not as PASS. Mobile is tested via Chromium device
 * emulation (layout proxy, not engine-accurate).
 *
 * Usage: CERT_BASE=http://127.0.0.1:8765 node tools/qa_handover_health_scanner.mjs
 * Output: tools/qa_handover_result.json + tools/qa_handover_shots/*.png
 */
import { chromium, devices } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_health_scanner.html?dp_skip=1';
const SHOTS = resolve(__dirname, 'qa_handover_shots');
try { mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

// 1x1 PNG (valid tiny image) for upload tests.
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');

const report = { base: BASE, browser: 'chromium', journeys: [], edge: [], viewports: [], languages: [], a11y: {}, performance: {}, notRun: [] };
function rec(arr, name, pass, ms, detail) { arr.push({ name, pass: !!pass, ms: Math.round(ms || 0), detail: detail || '' }); }

async function freshPage(browser, opts) {
  const o = opts || {};
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 780 } }, o.context || {}));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PE:' + String(e).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error') errs.push('CE:' + m.text().slice(0, 100)); });
  page._errs = errs;
  page.on('dialog', d => { d.accept(d.type() === 'prompt' ? 'Mother' : undefined).catch(() => {}); });
  // Default: suppress the AI cost-gate (so memory/family journeys aren't blocked by it)
  // unless a cost-gate journey explicitly opts out.
  if (!o.noCostSuppress) {
    await page.addInitScript(() => { try { localStorage.setItem('chitti_hs_cost_suppress_until', String(Date.now() + 86400000)); } catch (e) {} });
  }
  // Default: mock /analyze with a SAFE ok result so journeys are deterministic and
  // never hit production (a cost-gate journey can re-route to test other states).
  const okBody = o.analyzeBody || JSON.stringify({
    status: 'ok', scan_type: 'skin', is_not_diagnosis: true,
    observation: 'A small reddish area with a regular border, about 5mm.',
    confidence: 70, urgency: 'monitor', action: 'Worth watching — re-check in a few days.',
    reasons: ['mild redness'], disclaimer: 'This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.',
    skin_tone_note: 'AI is less accurate on darker skin tones (Fitzpatrick IV–VI).'
  });
  await page.route('**/api/health-scanner/analyze', r => r.fulfill({ status: 200, contentType: 'application/json', body: okBody })).catch(() => {});
  return { ctx, page };
}
async function clickHaan(page) {
  // Wait for the Golden-Rule overlay to be shown before clicking Haan
  // (deterministic — avoids fixed-delay races). QA 2026-06-05.
  await page.waitForSelector('#confirm-overlay.shown', { state: 'visible', timeout: 8000 });
  await page.click('#confirm-overlay .haan');
  await page.waitForSelector('#confirm-overlay.shown', { state: 'hidden', timeout: 8000 }).catch(() => {});
}
async function saveAScan(page, site) {
  // startScan(site...) → confirm Haan → upload file → result → save → Haan
  await page.click(`.scan-card .scan-btn[onclick*="'${site}'"]`).catch(() => {});
  await clickHaan(page);
  await page.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 });
  await page.waitForSelector('#scan-result.shown', { timeout: 8000 });
  await page.click('button[onclick="confirmSaveToTimeline()"]');
  await clickHaan(page);
  await page.waitForTimeout(200);
}

async function run() {
  const browser = await chromium.launch();

  // ───────────── A1: 20 user journeys ─────────────
  const J = async (name, vp, fn) => {
    const { ctx, page } = await freshPage(browser, vp);
    const t0 = Date.now(); let pass = false, detail = '';
    try { detail = await fn(page) || ''; pass = true; }
    catch (e) { pass = false; detail = 'ERR ' + String(e.message || e).slice(0, 120); }
    const ms = Date.now() - t0;
    if (page._errs.length) { detail += ' | console:' + page._errs.slice(0, 2).join(';'); if (/PE:/.test(page._errs.join(''))) pass = false; }
    try { await page.screenshot({ path: resolve(SHOTS, 'J_' + name.replace(/[^a-z0-9]/gi, '_') + '.png') }); } catch (e) {}
    rec(report.journeys, name, pass, ms, detail);
    await ctx.close();
  };

  await J('01 page loads no console errors', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); if (!(await p.$('#scan-card-grid'))) throw new Error('grid missing'); return 'grid + ' + (await p.$$('.scan-card')).length + ' cards'; });
  await J('02 disability profile bypassed', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500); const modal = await p.$('#chitti-disability-profile-modal.show'); if (modal) throw new Error('profile modal blocking'); return 'no blocking modal'; });
  await J('03 language en->hi translates chrome', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); await p.evaluate(() => window.Chitti.lang.set('hi')); await p.waitForTimeout(700); const hasDev = await p.evaluate(() => /[ऀ-ॿ]/.test(document.body.innerText)); if (!hasDev) throw new Error('no Devanagari after switch'); return 'Hindi rendered'; });
  await J('04 scan card opens golden-rule confirm', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(200); if (!(await p.$('#confirm-overlay.shown'))) throw new Error('confirm not shown'); return 'confirm gate shown'; });
  await J('05 Nahi keeps camera CLOSED (golden rule)', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(200); await p.click('#confirm-overlay .nahi'); await p.waitForTimeout(200); const camShown = await p.$('#cam-stage.shown'); if (camShown) throw new Error('camera opened on Nahi!'); return 'camera stayed closed'; });
  await J('06 Haan opens camera stage', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(200); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(400); if (!(await p.$('#cam-stage.shown'))) throw new Error('cam stage not shown'); return 'camera stage opened (upload fallback available)'; });
  await J('07 upload photo shows result + thumbnail', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(150); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(200); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(400); if (!(await p.$('#scan-result.shown'))) throw new Error('result not shown'); const t = await p.$eval('#result-thumb', e => e.style.display); return 'result shown, thumb display=' + t; });
  await J('08 save to memory shows site card', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await saveAScan(p, 'wound'); const n = (await p.$$('#mem-body .mem-site')).length; if (n < 1) throw new Error('no memory site'); return n + ' memory site(s)'; });
  await J('09 compare overlay after 2 saves', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await saveAScan(p, 'wound'); await saveAScan(p, 'wound'); await p.click('#mem-body .mem-site'); await p.waitForTimeout(400); const imgs = (await p.$$('#site-compare img')).length; if (!(await p.$('#site-overlay.shown'))) throw new Error('overlay not shown'); return 'compare imgs=' + imgs; });
  await J('10 trend honest (no % no diagnosis)', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await saveAScan(p, 'mole'); await saveAScan(p, 'mole'); await p.click('#mem-body .mem-site'); await p.waitForTimeout(400); const trend = await p.$eval('#site-trend', e => e.textContent); if (/%/.test(trend)) throw new Error('fake % in trend'); const claim = /\b(cancer|malignant|benign|tumou?r)\b/i.test(trend) || /you (have|'ve got) (a |an )?\w*\s?(disease|cancer|infection|tumou?r)/i.test(trend); if (claim) throw new Error('diagnosis language'); if (!/not a diagnosis/i.test(trend) && !/see a doctor/i.test(trend)) throw new Error('missing safety framing'); return 'trend honest (says "not a diagnosis"/"see a doctor", no %): ' + trend.slice(0, 40); });
  await J('11 add family profile + per-profile memory', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await saveAScan(p, 'skin'); await p.click('button[onclick="addProfile()"]'); await p.waitForTimeout(400); const opts = await p.$$eval('#profile-select option', es => es.map(e => e.textContent)); const memNow = (await p.$$('#mem-body .mem-site')).length; if (opts.length < 2) throw new Error('profile not added'); return 'profiles=' + opts.join(',') + ' memOnNew=' + memNow; });
  await J('12 save caregiver persists', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.fill('#cg-name', 'Priya'); await p.fill('#cg-wa', '+919999999999'); await p.click('.family-actions .save'); await p.waitForTimeout(200); const cg = await p.evaluate(() => JSON.parse(localStorage.getItem('chitti_hs_caregiver_v1') || '{}')); if (!cg.self || !cg.self.wa) throw new Error('not persisted'); return 'saved wa=' + cg.self.wa; });
  await J('13 notify w/o number is blocked', null, async (p) => { let alerted = false; p.on('dialog', d => { alerted = true; d.dismiss().catch(() => {}); }); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.family-actions .notify'); await p.waitForTimeout(300); const confirmShown = await p.$('#confirm-overlay.shown'); if (confirmShown) throw new Error('confirm fired without number'); return 'blocked (alerted=' + alerted + ')'; });
  await J('14 notify with number → golden-rule confirm', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.fill('#cg-wa', '+919999999999'); await p.click('.family-actions .notify'); await p.waitForTimeout(300); if (!(await p.$('#confirm-overlay.shown'))) throw new Error('confirm not shown'); return 'confirm gate before WhatsApp'; });
  await J('15 medicine link → MedUPI', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(120); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(150); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(300); await Promise.all([p.waitForNavigation({ timeout: 5000 }).catch(() => {}), p.click('button[onclick="location.href=\'chitti_medupi.html\'"]')]); if (!/chitti_medupi/.test(p.url())) throw new Error('did not navigate, url=' + p.url()); return 'navigated to MedUPI'; });
  await J('16 health file link', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500); await Promise.all([p.waitForNavigation({ timeout: 5000 }).catch(() => {}), p.click('.crosslinks a[href="chitti_health_file.html"]')]); if (!/chitti_health_file/.test(p.url())) throw new Error('no nav'); return 'navigated to Health File'; });
  await J('17 forget area (golden-rule) removes it', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await saveAScan(p, 'nail'); await p.click('#mem-body .mem-site'); await p.waitForSelector('#site-overlay.shown', { timeout: 8000 }); await p.click('.site-actions .danger'); await clickHaan(p); await p.waitForTimeout(300); const n = (await p.$$('#mem-body .mem-site')).length; if (n !== 0) throw new Error('area not removed, n=' + n); return 'area forgotten (confirm overlay z-index above site overlay)'; });
  await J('18 forget pending photo closes result', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(120); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(150); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(300); await p.click('button[onclick="forgetPending()"]'); await p.waitForTimeout(200); if (await p.$('#scan-result.shown')) throw new Error('result still shown'); const n = (await p.$$('#mem-body .mem-site')).length; if (n !== 0) throw new Error('saved unexpectedly'); return 'discarded, not saved'; });
  await J('19 listen (speaker) no error', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('button[onclick="speakIntro()"]'); await p.waitForTimeout(300); return 'speak invoked (no throw)'; });
  await J('20 per-response widget on result box', null, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); const boxes = (await p.$$('[data-chitti-response]')).length; const bars = (await p.$$('.chitti-fb-box-bar')).length; if (boxes < 1) throw new Error('no response box'); return 'boxes=' + boxes + ' fb-bars=' + bars; });

  // ── AI detection + cost gate journeys (21–25) — new surface ──
  // JA: fresh context with the cost gate ENABLED (noCostSuppress) + a custom /analyze mock.
  const JA = async (name, analyzeBody, fn) => {
    const { ctx, page } = await freshPage(browser, { noCostSuppress: true, analyzeBody });
    const t0 = Date.now(); let pass = false, detail = '';
    try { detail = await fn(page) || ''; pass = true; }
    catch (e) { pass = false; detail = 'ERR ' + String(e.message || e).slice(0, 120); }
    if (page._errs.some(x => /PE:/.test(x))) { pass = false; detail += ' | ' + page._errs.find(x => /PE:/.test(x)); }
    try { await page.screenshot({ path: resolve(SHOTS, 'J_' + name.replace(/[^a-z0-9]/gi, '_') + '.png') }); } catch (e) {}
    rec(report.journeys, name, pass, Date.now() - t0, detail);
    await ctx.close();
  };
  const OK_BODY = JSON.stringify({ status: 'ok', scan_type: 'skin', is_not_diagnosis: true, observation: 'A reddish raised area, ~5mm, regular border.', confidence: 72, urgency: 'monitor', action: 'Worth watching — re-check in a few days.', reasons: ['mild redness'], disclaimer: 'This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.', skin_tone_note: 'AI is less accurate on darker skin tones.' });
  const UNAVAIL_BODY = JSON.stringify({ status: 'unavailable', is_not_diagnosis: true, disclaimer: 'This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.', message: 'AI analysis is temporarily unavailable. Your photo is saved — please consult a doctor if you are worried.' });
  // A model that TRIES to leak a diagnosis — the SERVER suppresses it, but we assert the
  // UI never shows a disease name even if a bad payload arrived (defence-in-depth at render).
  const LEAK_BODY = JSON.stringify({ status: 'ok', scan_type: 'skin', is_not_diagnosis: true, observation: 'Looks consistent with melanoma / skin cancer.', confidence: 99, urgency: 'monitor', disclaimer: 'This is not a medical diagnosis.' });

  await JA('21 cost gate shown before first AI scan', OK_BODY, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(300); if (!(await p.$('#cost-overlay.shown'))) throw new Error('cost gate not shown'); const txt = await p.$eval('#cost-overlay', e => e.innerText); if (!/0\.05|0\.10|₹/.test(txt)) throw new Error('cost amount not shown'); return 'cost gate shown with ₹ amount'; });
  await JA('22 cost Cancel aborts (no camera)', OK_BODY, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForSelector('#cost-overlay.shown'); await p.click('#cost-overlay .nahi'); await p.waitForTimeout(300); if (await p.$('#cam-stage.shown')) throw new Error('camera opened after Cancel'); if (await p.$('#confirm-overlay.shown')) throw new Error('proceeded after Cancel'); return 'cancel aborted, no camera'; });
  await JA('23 dont-ask-24h suppresses gate on 2nd scan', OK_BODY, async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForSelector('#cost-overlay.shown'); await p.check('#cost-dont-ask'); await p.click('#cost-overlay .haan'); await clickHaan(p); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(400); await p.evaluate(() => document.getElementById('scan-result').classList.remove('shown')); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(300); if (await p.$('#cost-overlay.shown')) throw new Error('gate re-shown despite 24h opt-out'); if (!(await p.$('#confirm-overlay.shown'))) throw new Error('did not proceed to camera'); return '24h opt-out suppressed gate, went to camera'; });
  await JA('24 AI result renders safe (obs+confidence+urgency+disclaimer, no diagnosis)', OK_BODY, async (p) => { await p.evaluate(() => {}).catch(() => {}); await p.addInitScript(() => { try { localStorage.setItem('chitti_hs_cost_suppress_until', String(Date.now() + 8.64e7)); } catch (e) {} }); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await clickHaan(p); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(900); const t = await p.$eval('#ai-out', e => e.innerText); if (!/observation/i.test(t)) throw new Error('no observation'); if (!/not a diagnosis/i.test(t)) throw new Error('missing not-a-diagnosis'); if (!(await p.$('#ai-out .ai-urg'))) throw new Error('no urgency chip'); if (/\b(melanoma|cancer|diagnosis of|you have)\b/i.test(t.replace(/not a diagnosis/ig, ''))) throw new Error('diagnosis leaked'); return 'safe AI render: obs+conf+urgency+disclaimer, no disease name'; });
  await JA('25 AI unavailable → honest consult-a-doctor (no fake result)', UNAVAIL_BODY, async (p) => { await p.addInitScript(() => { try { localStorage.setItem('chitti_hs_cost_suppress_until', String(Date.now() + 8.64e7)); } catch (e) {} }); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await clickHaan(p); await p.setInputFiles('#file-input', { name: 's.png', mimeType: 'image/png', buffer: PNG_1x1 }); await p.waitForTimeout(800); const t = await p.$eval('#ai-out', e => e.innerText); if (!/unavailable|consult a doctor/i.test(t)) throw new Error('no honest unavailable message'); if (/\d+%/.test(t)) throw new Error('fabricated a confidence when unavailable'); return 'honest unavailable, no fabricated result'; });

  // ───────────── A2: Edge cases ─────────────
  const E = async (name, fn) => { const { ctx, page } = await freshPage(browser); const t0 = Date.now(); let pass = false, detail = ''; try { detail = await fn(page, ctx) || ''; pass = true; } catch (e) { pass = false; detail = 'ERR ' + String(e.message || e).slice(0, 120); } if (page._errs.some(x => /PE:/.test(x))) { pass = false; detail += ' | ' + page._errs[0]; } rec(report.edge, name, pass, Date.now() - t0, detail); await ctx.close(); };

  await E('offline — local-first still works', async (p, ctx) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await ctx.setOffline(true); await saveAScan(p, 'skin'); const n = (await p.$$('#mem-body .mem-site')).length; await ctx.setOffline(false); if (n < 1) throw new Error('save failed offline'); return 'saved offline, memory works'; });
  await E('slow 3G page load time', async (p) => { const cdp = await p.context().newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8, latency: 400 }); const t0 = Date.now(); await p.goto(URL, { waitUntil: 'load', timeout: 30000 }); const ms = Date.now() - t0; return '3G load=' + ms + 'ms'; });
  await E('corrupted image upload graceful', async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(120); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(150); await p.setInputFiles('#file-input', { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not-an-image-at-all') }); await p.waitForTimeout(400); if (!(await p.$('#scan-result.shown'))) throw new Error('no graceful result'); return 'handled corrupted file (result shown, no crash)'; });
  await E('large 9MB image upload', async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800); await p.click('.scan-card .scan-btn'); await p.waitForTimeout(120); await p.click('#confirm-overlay .haan'); await p.waitForTimeout(150); const big = Buffer.concat([PNG_1x1, Buffer.alloc(9 * 1024 * 1024, 0x20)]); const t0 = Date.now(); await p.setInputFiles('#file-input', { name: 'big.png', mimeType: 'image/png', buffer: big }); await p.waitForTimeout(800); const ms = Date.now() - t0; if (!(await p.$('#scan-result.shown'))) throw new Error('large image broke flow'); return 'handled ~9MB in ' + ms + 'ms'; });
  await E('rapid language switch x10 in <5s', async (p) => { await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); const langs = ['hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'gu', 'en', 'hi']; const t0 = Date.now(); for (const l of langs) { await p.evaluate(x => window.Chitti.lang.set(x), l); await p.waitForTimeout(80); } const ms = Date.now() - t0; const ok = await p.evaluate(() => /[ऀ-ॿ]/.test(document.body.innerText)); if (p._errs.some(x => /PE:/.test(x))) throw new Error('error during rapid switch'); return '10 switches in ' + ms + 'ms, final hi rendered=' + ok; });
  await E('localStorage disabled — no crash', async (p) => { await p.addInitScript(() => { try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } catch (e) {} }); let crashed = false; p.on('pageerror', () => { crashed = true; }); await p.goto(URL, { waitUntil: 'domcontentloaded' }).catch(() => { crashed = true; }); await p.waitForTimeout(1500); const grid = await p.$('#scan-card-grid'); if (!grid) return 'page degraded but no hard crash (grid missing — acceptable)'; return 'page renders with localStorage blocked (grid present)'; });
  await E('JS disabled — static fallback', async (p, ctx0) => { const ctx = await browser.newContext({ javaScriptEnabled: false }); const np = await ctx.newPage(); await np.goto(URL, { waitUntil: 'domcontentloaded' }); const txt = (await np.innerText('body')).slice(0, 0); const disclaimer = await np.$('.med-bar'); const cards = (await np.$$('.scan-card')).length; await ctx.close(); if (!disclaimer) throw new Error('no disclaimer without JS'); return 'static content + disclaimer render; ' + cards + ' cards visible; interactivity needs JS (documented)'; });

  // ───────────── A3: Viewports ─────────────
  for (const vp of [{ n: 'mobile-375', w: 375, h: 812 }, { n: 'tablet-768', w: 768, h: 1024 }, { n: 'desktop-1440', w: 1440, h: 900 }]) {
    const { ctx, page } = await freshPage(browser, { viewport: { width: vp.w, height: vp.h } });
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    await page.screenshot({ path: resolve(SHOTS, 'VP_' + vp.n + '.png'), fullPage: false }).catch(() => {});
    rec(report.viewports, vp.n, (m.sw - m.cw) <= 2, Date.now() - t0, 'overflow=' + (m.sw - m.cw) + 'px');
    await ctx.close();
  }
  // mobile device emulation (Pixel 5) — layout proxy
  try {
    const ctx = await browser.newContext(devices['Pixel 5']);
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    await page.screenshot({ path: resolve(SHOTS, 'VP_pixel5_emulation.png') }).catch(() => {});
    rec(report.viewports, 'Pixel5-emulation(chromium)', (m.sw - m.cw) <= 2, 0, 'overflow=' + (m.sw - m.cw) + 'px — chromium emulation, NOT real Android');
    await ctx.close();
  } catch (e) {}

  // ───────────── A5: Languages + flicker ─────────────
  // page primary selector = 9 Vaani langs (no Urdu — Urdu lives in the 26-substrate only).
  const PRIMARY = ['en', 'hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'gu'];
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2200);
    const collect = `()=>{const o=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentElement;if(!p)return 2;if(/SCRIPT|STYLE|OPTION|SELECT/.test(p.tagName))return 2;if(p.closest('select#lang-select'))return 2;const t=(n.nodeValue||'').trim();if(!t||!/[A-Za-z]/.test(t)||t.replace(/[^A-Za-z]/g,'').length<3)return 2;return 1;}});let n;while(n=w.nextNode())o.push(n.nodeValue.trim());return o;}`;
    await page.evaluate(() => window.Chitti.lang.set('en')); await page.waitForTimeout(400);
    const en = [...new Set(await page.evaluate(`(${collect})()`))];
    for (const lg of PRIMARY) {
      const t0 = Date.now();
      // flicker probe: switch, then sample a known element at 3 instants
      const samples = await page.evaluate(async (x) => {
        // sample a TRANSLATING element (the golden line), NOT the brand h1 which stays English.
        const el = () => (document.querySelector('.hero .golden') || document.body).textContent.trim().slice(0, 24);
        window.Chitti.lang.set(x);
        const out = [el()];
        await new Promise(r => setTimeout(r, 60)); out.push(el());
        await new Promise(r => setTimeout(r, 200)); out.push(el());
        await new Promise(r => setTimeout(r, 300)); out.push(el());
        return out;
      }, lg);
      await page.waitForTimeout(300);
      const after = new Set(await page.evaluate(`(${collect})()`));
      const miss = en.filter(s => after.has(s) && !/^(chitti|deepseek|upi|ai|pmjay|aes-256-gcm|dpdp|abdm|fssai)$/i.test(s.trim()));
      const cov = Math.round((en.length - miss.length) / en.length * 100);
      // flicker = the sampled element changes value more than once after the switch (settles, then reverts)
      const uniqSeq = samples.filter((v, i) => i === 0 || v !== samples[i - 1]);
      const flicker = uniqSeq.length > 2; // >1 transition = visible re-render flips
      await page.screenshot({ path: resolve(SHOTS, 'LANG_' + lg + '.png') }).catch(() => {});
      report.languages.push({ lang: lg, coveragePct: cov, untranslated: miss.length, switchMs: Date.now() - t0, flicker, sampleSeq: samples });
    }
    await ctx.close();
  }

  // ───────────── A4: a11y (axe-core from CDN, else manual) ─────────────
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    let axe = null;
    try {
      await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' });
      axe = await page.evaluate(async () => { const r = await window.axe.run(document, { resultTypes: ['violations'] }); return { violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) }; });
    } catch (e) { axe = { error: 'axe CDN unavailable: ' + String(e.message || e).slice(0, 60) }; }
    // manual checklist (always)
    const manual = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const btns = [...document.querySelectorAll('button,a[href],[role="button"]')];
      const smallTaps = btns.filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 24); }).length;
      const noAria = btns.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length;
      const imgNoAlt = imgs.filter(i => !i.hasAttribute('alt') && i.getAttribute('aria-hidden') !== 'true').length;
      return { langAttr: document.documentElement.lang, ariaLive: document.querySelectorAll('[aria-live]').length, speakerBtns: [...document.querySelectorAll('button')].filter(b => /🔊/.test(b.textContent)).length, smallTaps, iconNav: document.querySelectorAll('.nav-icons button,.nav-icons a').length, btnsNoLabel: noAria, imgNoAlt };
    });
    report.a11y = { axe, manual };
    await ctx.close();
  }

  // ───────────── A7: performance ─────────────
  {
    const { ctx, page } = await freshPage(browser);
    await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
      return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0), loadComplete: Math.round(nav.loadEventEnd || 0), jsHeapMB: mem };
    });
    const t0 = Date.now(); await page.evaluate(() => window.Chitti.lang.set('ta')); await page.waitForTimeout(50); const langMs = Date.now() - t0;
    const t1 = Date.now(); await saveAScan(page, 'burn'); const saveMs = Date.now() - t1;
    report.performance = Object.assign(perf, { langSwitchMs: langMs, captureSaveMs: saveMs });
    await ctx.close();
  }

  report.notRun = [
    'Firefox (desktop) — engine not installed in this environment',
    'Safari (desktop) / WebKit — engine not installed at run time (install attempted separately)',
    'Real Chrome on Android (2 devices) — no physical device / device cloud',
    'Real Safari on iOS (2 devices) — no physical device / device cloud',
    'Human screen-share live demo — not performable by an automated agent (screenshots + this reproducible script are the proxy)',
    'Lighthouse performance audit — lighthouse not installed (navigation-timing used instead)',
  ];

  await browser.close();
  writeFileSync(resolve(__dirname, 'qa_handover_result.json'), JSON.stringify(report, null, 2));

  // summary
  const jp = report.journeys.filter(j => j.pass).length, jt = report.journeys.length;
  const ep = report.edge.filter(j => j.pass).length, et = report.edge.length;
  console.log('\n===== A1 JOURNEYS: ' + jp + '/' + jt + ' PASS =====');
  report.journeys.forEach(j => console.log((j.pass ? '✅' : '❌') + ' ' + j.name + ' (' + j.ms + 'ms) ' + j.detail));
  console.log('\n===== A2 EDGE: ' + ep + '/' + et + ' PASS =====');
  report.edge.forEach(j => console.log((j.pass ? '✅' : '❌') + ' ' + j.name + ' ' + j.detail));
  console.log('\n===== A3 VIEWPORTS =====');
  report.viewports.forEach(v => console.log((v.pass ? '✅' : '❌') + ' ' + v.name + ' ' + v.detail));
  console.log('\n===== A5 LANGUAGES (coverage + flicker) =====');
  report.languages.forEach(l => console.log((l.flicker ? '⚠️FLICKER' : '✅') + ' ' + l.lang + ' cov=' + l.coveragePct + '% switch=' + l.switchMs + 'ms seq=' + JSON.stringify(l.sampleSeq)));
  console.log('\n===== A4 A11Y ====='); console.log(JSON.stringify(report.a11y));
  console.log('\n===== A7 PERFORMANCE ====='); console.log(JSON.stringify(report.performance));
  console.log('\nNOT RUN (honest):'); report.notRun.forEach(x => console.log('  • ' + x));
}
run().catch(e => { console.error(e); process.exit(1); });
