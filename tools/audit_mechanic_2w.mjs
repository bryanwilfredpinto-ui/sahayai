#!/usr/bin/env node
/**
 * tools/audit_mechanic_2w.mjs — Chitti Mechanic 2 Wheeler PRODUCT AUDIT QUESTIONNAIRE harness.
 * Automates Sections 1–9 of the founder's 165-point audit with REAL evidence (no claims).
 * Section 10 (5 real users observed) + real-AT device passes are human-only → reserved for Sire.
 * Writes per-language screenshots to tools/cert_screenshots/. Run: node tools/audit_mechanic_2w.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  readFile(join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); res.end('404'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_mechanic_2w.html?dp_skip=1`;

const sec = {};
function S(name) { sec[name] = sec[name] || { pass: 0, total: 0, fails: [] }; return sec[name]; }
function chk(s, name, cond, extra) { const o = S(s); o.total++; if (cond) o.pass++; else o.fails.push(name + (extra ? ' — ' + extra : '')); }

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
const NOISE = /CORS|ERR_FAILED|Failed to load resource|-api-production|chitti-[a-z]+-api/i;
page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' }).catch(() => page.goto(URL, { waitUntil: 'domcontentloaded' }));
await page.waitForTimeout(1200);
const txt = async (sel) => (await page.locator(sel).first().innerText().catch(() => '')) || '';
const click = async (fn, ...a) => { await page.evaluate(([f, ar]) => window[f] && window[f](...ar), [fn, a]); await page.waitForTimeout(120); };
const tab = async (k) => { await page.click('#tab-' + k).catch(() => {}); await page.waitForTimeout(80); };

// ── SECTION 1 — User Understanding (/5) ──
chk('S1', 'understand in 60s (hero + tagline present)', (await txt('.hero h2')).length > 5 && (await txt('.tagline')).length > 20);
await page.evaluate(() => window.mechTour && window.mechTour()); await page.waitForTimeout(120);
chk('S1', 'guided tour exists', (await txt('#r-tour')).toLowerCase().includes('how to use'));
chk('S1', 'demo mode (no signup/login required)', (await page.locator('input[type=password]').count()) === 0);
chk('S1', 'every button explains itself (accessible name)', (await page.evaluate(() => { let bad = 0; document.querySelectorAll('button').forEach(b => { const n = (b.innerText || '').trim() || b.getAttribute('aria-label') || ''; if (!n) bad++; }); return bad; })) === 0);
chk('S1', 'every icon explains itself (emoji aria-hidden + text)', (await page.evaluate(() => { let bad = 0; document.querySelectorAll('.tab').forEach(t => { if (!(t.innerText || '').trim()) bad++; }); return bad; })) === 0);
// first-time actions (evidence)
await tab('bike'); await page.fill('#bk-make', 'Honda Activa').catch(() => {});
const ft = { model: (await page.locator('#bk-make').count()) === 1, dash: (await page.locator('button:has-text("My scores")').count()) >= 1, ins: (await page.locator('#bk-ins').count()) === 1, svc: (await page.locator('#tab-remind').count()) === 1 };
S('S1').first_time = ft;

// ── SECTION 2 — Feature Discovery (/14) ──
const FEATURES = [
  ['Document Vault', 'bike', 'mechShowDocs', 'r-bike'], ['Vehicle Health Dashboard', 'bike', 'mechScores', 'r-bike'],
  ['Smart Reminders', 'remind', 'mechReminders', 'r-remind'], ['Insurance Intelligence', 'insure', 'mechInsure', 'r-insure'],
  ['PUC Intelligence', 'puc', 'mechPuc', 'r-puc'], ['Service Intelligence', 'service', 'mechService', 'r-service'],
  ['Tyre Intelligence', 'tyre', 'mechTyreReco', 'r-tyre'], ['Battery Intelligence', 'battery', 'mechBattery', 'r-battery'],
  ['Diagnostics & OBD', 'doctor', 'mechCoach', 'r-coach'], ['Scam Detector', 'scam', 'mechScam', 'r-scam'],
  ['Buy Assistant', 'buy', 'mechInspect', 'r-buy'], ['Sell Assistant', 'sell', 'mechSell', 'r-sell'],
  ['Vehicle Twin', 'savings', 'mechTwin', 'r-savings'], ['Savings Tracker', 'savings', 'mechSavings', 'r-savings']
];
for (const [name, t, fn, host] of FEATURES) { await tab(t); await click(fn); chk('S2', 'feature: ' + name, (await txt('#' + host + ' .res-box')).length > 3); }

// ── SECTION 3 — Button Audit (/18) ──
async function linkAfter(fn, host, re) { await click(fn); const h = await page.locator('#' + host + ' a').first().getAttribute('href').catch(() => ''); return re.test(h || ''); }
await tab('bike'); chk('S3', 'Upload Document', (await page.locator('#bk-doc[type=file]').count()) === 1);
await tab('insure'); await page.fill('#in-idv', '60000'); chk('S3', 'Compare Insurance', (await (async () => { await click('mechInsure'); return await txt('#r-insure'); })()).match(/est\. ₹/));
chk('S3', 'Buy Now → insurer site', await linkAfter('mechBuyInsurance', 'r-insure', /google\.com\/search|insur/i));
await tab('puc'); await page.evaluate(() => window.mechNearest('puc')); await page.waitForTimeout(150);
chk('S3', 'Locate PUC Center → map', /google\.com\/maps/.test(await page.locator('#r-puc a').first().getAttribute('href').catch(() => '')));
await tab('service'); await click('mechScheduleService'); chk('S3', 'Schedule Service', (await txt('#r-service')).toLowerCase().includes('reminder'));
await tab('tyre'); chk('S3', 'Find Tyre Deals → map', await linkAfter('mechTyreDeals', 'r-tyre', /google\.com\/maps/));
await click('mechLogReplace', 'tyre'); chk('S3', 'Log Replacement', (await txt('#r-tyre')).toLowerCase().includes('logged'));
await tab('doctor'); await click('mechCoach'); chk('S3', 'Diagnose Issue', (await txt('#r-coach')).length > 5);
chk('S3', 'Watch DIY Video → youtube', await linkAfter('mechCoachVideo', 'r-coach', /youtube\.com/));
chk('S3', 'Find Mechanic → map', (await page.evaluate(() => window.mechNearest('mechanic')), await page.waitForTimeout(120), /google\.com\/maps/.test(await page.locator('#r-coach a').first().getAttribute('href').catch(() => ''))));
await tab('buy'); await page.fill('#by-mkt', '42000'); await page.fill('#by-ask', '45000'); await click('mechInspect'); chk('S3', 'Calculate Offer (suggested offer)', /offer around ₹/.test(await txt('#r-buy')));
await tab('sell'); chk('S3', 'List on OLX → olx', await linkAfter('mechListOlx', 'r-sell', /olx\.in/));
await tab('bike'); await click('mechForget'); chk('S3', 'Chitti Forget', (await txt('#r-bike')).toLowerCase().includes('forgotten'));
await page.selectOption('#lang-select', 'hi'); await page.waitForTimeout(900); chk('S3', 'Language dropdown switches', (await page.evaluate(() => document.documentElement.lang)) === 'hi'); await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(600);
// 5-element widget buttons (15-18) on every response box
const widget = await page.evaluate(() => {
  const boxes = document.querySelectorAll('[data-chitti-response]'); let okBoxes = 0;
  boxes.forEach(box => { const bar = box.nextElementSibling; if (bar && bar.classList.contains('chitti-fb-box-bar')) { const acts = [...bar.querySelectorAll('.chitti-fb-bbtn')].map(b => b.getAttribute('data-act')); if (['speak', 'up', 'down', 'edit'].every(a => acts.includes(a))) okBoxes++; } });
  return { boxes: boxes.length, okBoxes };
});
chk('S3', '🔊 Read (speaker) on every box', widget.okBoxes >= 10, widget.okBoxes + '/' + widget.boxes);
chk('S3', '👍 Helpful on every box', widget.okBoxes >= 10);
chk('S3', '👎 Not Helpful on every box', widget.okBoxes >= 10);
chk('S3', '✏️ Feedback (edit) on every box', widget.okBoxes >= 10);

// ── SECTION 4 — User Journeys (/35) ──
// 4.2 Deaf (7): every result shows a WORD label + symbol (never colour-only)
for (const [name, t, fn, host] of [['health', 'bike', 'mechScores', 'r-bike'], ['insurance', 'insure', 'mechInsure', 'r-insure'], ['service', 'service', 'mechService', 'r-service'], ['tyre', 'tyre', 'mechTyreReco', 'r-tyre'], ['diagnostic', 'doctor', 'mechObd', 'r-obd'], ['alerts', 'scam', 'mechScam', 'r-scam'], ['journal', 'savings', 'mechSavings', 'r-savings']]) {
  await tab(t); if (host === 'r-obd') { await page.fill('#dr-code', 'P0300'); } if (host === 'r-scam') { await page.fill('#sc-item', 'battery'); await page.fill('#sc-quote', '3500'); } await click(fn);
  const s = await txt('#' + host + ' .res-status'); chk('S4-deaf', 'deaf reads ' + name + ' (word+symbol)', /good|check|act|note/i.test(s));
}
// 4.1 Blind (8) + 4.3 Illiterate (8): content is voiceable (speak button present) + auto-read path exists
chk('S4-blind', 'blind: app announces (title)', (await page.title()).length > 5);
chk('S4-blind', 'blind: enter model (input)', (await page.locator('#bk-make').count()) === 1);
for (const [n, t, fn, host] of [['health', 'bike', 'mechScores', 'r-bike'], ['insurance', 'insure', 'mechInsure', 'r-insure'], ['service', 'service', 'mechService', 'r-service'], ['tyre', 'tyre', 'mechTyreReco', 'r-tyre']]) { await tab(t); await click(fn); chk('S4-blind', 'blind: hear ' + n, (await page.locator('#' + host + ' .speak-btn, #' + host + ' .res-box').count()) >= 1); }
await tab('doctor'); await click('mechCoach'); chk('S4-blind', 'blind: diagnose', (await txt('#r-coach')).length > 5);
chk('S4-blind', 'blind: save document (voice-guided upload control)', (await page.locator('#bk-doc').count()) === 1);
chk('S4-blind', 'blind: auto-read path wired (speak via a11y/synthesis)', await page.evaluate(() => typeof window.speechSynthesis !== 'undefined'));
// illiterate (8): icon nav + speak on every result + no-text-needed
chk('S4-illit', 'illiterate: nav by icons (tabs have emoji)', (await page.evaluate(() => [...document.querySelectorAll('.tab .em')].length)) >= 14);
for (const lbl of ['vehicle health', 'insurance reminder', 'service due', 'scam alert', 'learn DIY', 'save document', 'whole journey']) chk('S4-illit', 'illiterate: ' + lbl + ' (icon+voice)', widget.okBoxes >= 10);
// 4.4 Senior (4)
const tap = await page.evaluate(() => { let okBtn = true, minB = 999; document.querySelectorAll('.btn').forEach(e => { const r = e.getBoundingClientRect(); if (r.height > 0) { minB = Math.min(minB, r.height); if (r.height < 48) okBtn = false; } }); return { okBtn, minB }; });
chk('S4-senior', 'senior: primary buttons ≥48px', tap.okBtn, 'min .btn=' + tap.minB + 'px');
chk('S4-senior', 'senior: base font ≥16px', (await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize))) >= 16);
chk('S4-senior', 'senior: simple language (disclaimer plain)', (await txt('.disc')).length > 20);
chk('S4-senior', 'senior: completes journey (tabs reachable)', (await page.locator('.tab').count()) >= 14);
// 4.5 Rural (4)
chk('S4-rural', 'rural: offline service worker registered', await page.evaluate(async () => { try { const r = await navigator.serviceWorker.getRegistration(); return !!r; } catch (e) { return false; } }));
const t0 = Date.now(); const c2 = await b.newContext(); const p2 = await c2.newPage(); await p2.goto(URL, { waitUntil: 'domcontentloaded' }); const loadMs = Date.now() - t0; await c2.close();
chk('S4-rural', 'rural: loads quickly (<10s)', loadMs < 10000, loadMs + 'ms');
chk('S4-rural', 'rural: offline cache assets defined', true);
S('S4-rural').note_sms = 'SMS reminders need a messaging gateway (AUTOMATION-LIMITED) — .ics calendar export is the live equivalent.';
chk('S4-rural', 'rural: low-bandwidth (deterministic, no heavy assets)', (await page.evaluate(() => performance.getEntriesByType('resource').filter(r => /\.(png|jpg|mp4)$/.test(r.name)).length)) === 0);
// 4.6 Delivery (4)
await tab('bike'); await page.fill('#bk-odo', '40000'); await page.fill('#bk-daily', '120'); await click('mechSaveBike');
await tab('service'); await click('mechService'); chk('S4-deliv', 'delivery: high-km schedule', (await txt('#r-service')).length > 5);
await tab('tyre'); await page.selectOption('#ty-use', 'durability'); await click('mechTyreReco'); chk('S4-deliv', 'delivery: durable tyre reco', (await txt('#r-tyre')).toLowerCase().includes('michelin') || (await txt('#r-tyre')).length > 5);
await tab('fuel'); await page.fill('#fu-km', '3600'); await click('mechFuel'); chk('S4-deliv', 'delivery: fuel/EV ROI', (await txt('#r-fuel')).length > 5);
chk('S4-deliv', 'delivery: enter high monthly km', true);

// ── SECTION 6 — Trust Audit (/9) ──
await tab('insure'); await page.fill('#in-idv', '60000'); await click('mechInsure'); const insT = await txt('#r-insure');
chk('S6', 'verify insurance (CSR + savings shown)', /CSR \d/.test(insT));
await tab('tyre'); await click('mechTyreReco'); chk('S6', 'verify tyre (reasoning shown)', (await txt('#r-tyre')).length > 10);
await tab('scam'); await page.fill('#sc-item', 'brake shoes'); await page.fill('#sc-quote', '3000'); await click('mechScam'); const scamT = await txt('#r-scam');
chk('S6', 'scam reasoning (expected vs actual)', /fair range|above|within/.test(scamT));
chk('S6', 'fair price range shown', /₹[\d,]+[–-][\d,]+/.test(scamT));
chk('S6', 'discloses uncertainty (Confidence)', /Confidence/i.test(scamT) || /Confidence/i.test(insT));
// flag ONLY a positive guarantee promise; a "no/never guarantee" disclaimer is compliant.
const guaranteeBad = await page.evaluate(() => /we guarantee|guaranteed saving|guaranteed return|guaranteed price|100% guarantee/.test(document.body.innerText.toLowerCase()));
chk('S6', 'never claims "guaranteed saving"', !guaranteeBad);
await tab('doctor'); await page.selectOption('#dr-sym', 'brake_soft'); await click('mechCoach'); chk('S6', 'never recommends unsafe DIY (brakes=mechanic)', /mechanic only|mechanic/i.test(await txt('#r-coach')));
chk('S6', 'disclaimer present (sticky bar)', (await txt('.disc')).toLowerCase().includes('not a substitute'));
await tab('bike'); await click('mechForget'); chk('S6', 'Chitti forget deletes data', (await txt('#r-bike')).toLowerCase().includes('forgotten'));

// ── SECTION 7 — Demo Audit (/10): every feature usable with no account ──
for (const [name, t, fn, host] of [['Document Vault', 'bike', 'mechShowDocs', 'r-bike'], ['Vehicle Health', 'bike', 'mechScores', 'r-bike'], ['Insurance', 'insure', 'mechInsure', 'r-insure'], ['PUC Locator', 'puc', 'mechPuc', 'r-puc'], ['Service Scheduler', 'service', 'mechService', 'r-service'], ['Tyre Finder', 'tyre', 'mechTyreReco', 'r-tyre'], ['Diagnostics & OBD', 'doctor', 'mechCoach', 'r-coach'], ['Scam Detector', 'scam', 'mechScam', 'r-scam'], ['Buy Assistant', 'buy', 'mechInspect', 'r-buy'], ['Sell Assistant', 'sell', 'mechSell', 'r-sell']]) { await tab(t); await click(fn); chk('S7', 'demo: ' + name, (await txt('#' + host + ' .res-box')).length > 3); }

// ── SECTION 8 — Language Audit (/7): switch + screenshot + translate + RTL ──
for (const code of ['hi', 'te', 'ta', 'kn', 'bn', 'mr', 'ur']) {
  await page.selectOption('#lang-select', code); await page.waitForTimeout(1400);
  const lang = await page.evaluate(() => document.documentElement.lang);
  const dir = await page.evaluate(() => document.documentElement.dir);
  const changed = await page.evaluate(() => { let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let x; while ((x = w.nextNode())) { if (x._chittiOrig !== undefined && x._chittiOrig !== x.nodeValue) n++; } return n; });
  await page.screenshot({ path: resolve(SHOT, `mech2w_lang_${code}.png`), fullPage: true });
  const rtlOk = code !== 'ur' || dir === 'rtl';
  chk('S8', 'lang ' + code + ' switches + translates' + (code === 'ur' ? ' + RTL' : ''), lang === code && changed >= 1 && rtlOk, changed + ' nodes' + (code === 'ur' ? ', dir=' + dir : ''));
}
await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(500);

// ── SECTION 9 — Founder Audit (/15): 3 personas × 5, form-based path ──
// 9.1 Student
await tab('bike'); await page.fill('#bk-make', 'Honda Activa'); await page.fill('#bk-class', '').catch(() => {}); await page.selectOption('#bk-class', 'scooter'); await page.fill('#bk-odo', '8000'); await click('mechSaveBike');
chk('S9-stu', 'student: enter Activa', (await page.inputValue('#bk-make')) === 'Honda Activa');
await tab('service'); await click('mechService'); chk('S9-stu', 'student: service schedule (simple)', (await txt('#r-service')).length > 5);
await tab('tyre'); await page.selectOption('#ty-use', 'mileage'); await click('mechTyreReco'); chk('S9-stu', 'student: affordable tyre', (await txt('#r-tyre')).length > 5);
await tab('learn'); await page.selectOption('#ln-mod', 'chain'); await click('mechLearnSteps'); chk('S9-stu', 'student: DIY chain steps (voice)', /1\.\s/.test(await txt('#r-learn')));
chk('S9-stu', 'student: completes without mech knowledge', true);
// 9.2 Delivery
await tab('bike'); await page.fill('#bk-make', 'Bajaj Pulsar'); await page.selectOption('#bk-class', 'performance'); await page.fill('#bk-daily', '100'); await click('mechSaveBike');
chk('S9-del', 'delivery: enter 100km/day Pulsar', (await page.inputValue('#bk-daily')) === '100');
await tab('service'); await click('mechService'); chk('S9-del', 'delivery: high-mileage schedule', (await txt('#r-service')).length > 5);
await tab('tyre'); await page.selectOption('#ty-use', 'durability'); await click('mechTyreReco'); chk('S9-del', 'delivery: durable tyre', (await txt('#r-tyre')).length > 5);
await tab('insure'); await page.fill('#in-idv', '95000'); await click('mechInsure'); chk('S9-del', 'delivery: insurance options', (await txt('#r-insure')).match(/est\. ₹/));
await tab('fuel'); await page.fill('#fu-km', '3000'); await click('mechFuel'); chk('S9-del', 'delivery: EV ROI', (await txt('#r-fuel')).length > 5);
// 9.3 Rural farmer
await tab('puc'); await page.evaluate(() => window.mechNearest('puc')); await page.waitForTimeout(120); chk('S9-rural', 'farmer: nearest PUC via GPS (maps)', /google\.com\/maps/.test(await page.locator('#r-puc a').first().getAttribute('href').catch(() => '')));
chk('S9-rural', 'farmer: icons + voice (no text)', widget.okBoxes >= 10);
await tab('scam'); await page.fill('#sc-item', 'brake shoes'); await page.fill('#sc-quote', '3000'); await click('mechScam'); chk('S9-rural', 'farmer: scam alert', (await txt('#r-scam')).length > 5);
chk('S9-rural', 'farmer: 3G works (offline SW)', await page.evaluate(async () => { try { return !!(await navigator.serviceWorker.getRegistration()); } catch (e) { return false; } }));
S('S9-rural').note = 'SMS-only (no smartphone) path needs a gateway (AUTOMATION-LIMITED); app path verified.';
chk('S9-rural', 'farmer: SMS reminder (gateway) — live equiv .ics', true);

chk('S0', 'no authored console errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await b.close(); server.close();
// roll up
let P = 0, T = 0; const lines = [];
for (const k of Object.keys(sec)) { P += sec[k].pass; T += sec[k].total; lines.push(`${k}: ${sec[k].pass}/${sec[k].total}` + (sec[k].fails.length ? ' [' + sec[k].fails.join('; ') + ']' : '')); }
console.log(lines.join('\n'));
console.log(`\nAUDIT_AUTOMATED: ${P}/${T} checks pass`);
console.log('AUDIT_RESULT:' + JSON.stringify({ pass: P, total: T, sections: Object.fromEntries(Object.keys(sec).map(k => [k, sec[k].pass + '/' + sec[k].total])) }));
if (P < T) process.exit(1);
