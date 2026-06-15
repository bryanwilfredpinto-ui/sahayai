#!/usr/bin/env node
/** QA RETEST — Chitti Mechanic 2 Wheeler, fixed branch (PR #3) via local serve.
 * Mirrors the original live QA: how-to, four users, language, mobile, every button, dropdowns. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); res.end('x'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(d); }); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_mechanic_2w.html?dp_skip=1`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('PE:' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
const o = (k, v) => console.log(k + '::' + (typeof v === 'object' ? JSON.stringify(v) : v));
const txt = async s => ((await page.locator(s).first().innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
async function tab(k) { await page.locator('#tab-' + k).click({ timeout: 8000 }); await page.locator('#panel-' + k).waitFor({ state: 'visible', timeout: 8000 }); await page.waitForTimeout(80); }
async function setv(id, v) { const el = page.locator('#' + id); await el.waitFor({ state: 'visible', timeout: 8000 }); await el.fill(v); }
async function hl(id) { return (await txt('#' + id)).length; }

// HOW-TO
await page.evaluate(() => window.mechTour()); await page.waitForTimeout(200);
o('HOWTO_HEADING', await txt('#how-to-use .howto-h'));
o('HOWTO_STEPS_LEN', (await txt('#r-tour')).length);
await tab('bike'); await setv('bk-make', 'Honda Activa'); await setv('bk-odo', '13000'); await setv('bk-ins', '2026-07-10'); await setv('bk-puc', '2026-06-25'); await page.evaluate(() => window.mechSaveBike()); await page.waitForTimeout(150);
o('STEP_ADDBIKE_OK', (await txt('#r-bike')).toLowerCase().includes('saved'));
await tab('remind'); await page.evaluate(() => window.mechReminders()); await page.waitForTimeout(150); o('STEP_REMIND_OK', (await hl('r-remind')) > 10);
await tab('doctor'); await page.evaluate(() => window.mechCoach()); await page.waitForTimeout(150); o('STEP_DOCTOR_OK', (await hl('r-coach')) > 10);
await tab('buy'); await setv('by-mkt', '42000'); await setv('by-ask', '45000'); await page.evaluate(() => window.mechInspect()); await page.waitForTimeout(150); o('STEP_BUY_OK', (await txt('#r-buy')).includes('Buy Score'));

// FOUR USERS
o('READPAGE_BTN', await page.locator('button:has-text("Read page")').count());
o('SPEAK_API', await page.evaluate(() => typeof window.speechSynthesis !== 'undefined'));
const widget = await page.evaluate(() => { let ok = 0; const boxes = document.querySelectorAll('[data-chitti-response]'); boxes.forEach(box => { const bar = box.nextElementSibling; if (bar && bar.classList.contains('chitti-fb-box-bar')) { const a = [...bar.querySelectorAll('.chitti-fb-bbtn')].map(x => x.getAttribute('data-act')); if (['speak', 'up', 'down', 'edit'].every(z => a.includes(z))) ok++; } }); return { boxes: boxes.length, ok }; });
o('WIDGET', widget);
await tab('bike'); await page.evaluate(() => window.mechHealth()); await page.waitForTimeout(150);
o('DEAF_HEALTH_WORDSYMBOL', /good|check|needs|act|note/i.test(await txt('#r-health .res-status')) && (await page.locator('#r-health .vh-zone').count()) === 5);
const isl = await page.evaluate(async () => { const off = document.querySelectorAll('.chitti-isl-autobox').length; if (!(window.Chitti && window.Chitti.a11y && window.Chitti.a11y.setIslMode)) return { off, on: -1 }; window.Chitti.a11y.setIslMode(true); await new Promise(r => setTimeout(r, 600)); const on = document.querySelectorAll('.chitti-isl-autobox').length; window.Chitti.a11y.setIslMode(false); return { off, on }; });
o('ISL', isl);
o('EMOJI_TABS', await page.evaluate(() => document.querySelectorAll('.tab .em').length));
o('TAP_TARGETS', await page.evaluate(() => document.querySelectorAll('button,select,input').length));

// LANGUAGE
async function lang(c) { await page.selectOption('#lang-select', c); await page.waitForTimeout(1600); const r = await page.evaluate(() => { let t = 0, ch = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let n; while ((n = w.nextNode())) { if (n._chittiOrig !== undefined) { t++; if (n._chittiOrig !== n.nodeValue) ch++; } } return { lang: document.documentElement.lang, dir: document.documentElement.dir, t, ch }; }); return r; }
o('LANG_HI', await lang('hi')); o('LANG_KN', await lang('kn'));
await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(400);

// MOBILE 375
const c375 = await b.newContext({ viewport: { width: 375, height: 812 } }); const p375 = await c375.newPage(); await p375.goto(URL, { waitUntil: 'domcontentloaded' }); await p375.waitForTimeout(1200);
const sc = await p375.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); o('MOBILE_375', { ...sc, overflow: sc.sw > sc.cw + 1 }); await c375.close();

// DARK MODE
await page.click('#dark-toggle'); await page.waitForTimeout(120); o('DARK_ON', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark'); await page.click('#dark-toggle'); await page.waitForTimeout(80);

// HOME GRID
o('HOME_GRID_CARDS', await page.locator('.home-grid .home-card').count());

// BUTTON AUDIT (real tap, local)
let bp = 0, bf = 0; const bfail = [];
async function tapBtn(t, label, hostId, sel, prep) { try { await tab(t); if (prep) await prep(); const before = await hl(hostId); const btn = sel ? page.locator(sel) : page.locator('#panel-' + t + ' button', { hasText: label }).first(); await btn.scrollIntoViewIfNeeded(); await btn.click({ timeout: 6000 }); await page.waitForTimeout(200); const after = await hl(hostId); (after > 3 && (after !== before || after > 10)) ? bp++ : (bf++, bfail.push(label)); } catch (e) { bf++; bfail.push(label + ' (' + e.message.split('\n')[0] + ')'); } }
await tapBtn('bike', 'How it works', 'r-tour', 'section.hero button:has-text("How it works")');
await tapBtn('bike', 'Save my bike', 'r-bike', null, async () => { await setv('bk-make', 'Honda Activa'); await setv('bk-odo', '13000'); });
await tapBtn('bike', 'My scores', 'r-bike');
await tapBtn('bike', 'Save document', 'r-bike');
await tapBtn('bike', 'My documents', 'r-bike');
await tapBtn('bike', 'Show my bike health', 'r-health');
await tapBtn('remind', 'Check my reminders', 'r-remind');
await tapBtn('doctor', 'Diagnose', 'r-coach');
await tapBtn('doctor', 'Explain code', 'r-obd', null, async () => { await setv('dr-code', 'P0300'); });
await tapBtn('doctor', 'Find mechanic', 'r-coach');
await tapBtn('buy', 'Get Buy Score', 'r-buy', null, async () => { await setv('by-mkt', '42000'); await setv('by-ask', '45000'); });
await tapBtn('sell', 'Suggest price', 'r-sell', null, async () => { await setv('sl-mkt', '68000'); });
await tapBtn('sell', 'List on OLX', 'r-sell');
await tapBtn('insure', 'Compare insurers', 'r-insure', null, async () => { await setv('in-idv', '60000'); });
await tapBtn('insure', 'Buy / renew now', 'r-insure');
await tapBtn('puc', 'Check PUC', 'r-puc');
await tapBtn('puc', 'Nearest PUC centre', 'r-puc');
await tapBtn('service', 'Service & oil plan', 'r-service');
await tapBtn('service', 'Schedule service', 'r-service');
await tapBtn('service', 'Nearest service centre', 'r-service');
await tapBtn('tyre', 'Are mine worn', 'r-tyre');
await tapBtn('tyre', 'Recommend tyres', 'r-tyre');
await tapBtn('tyre', 'Find tyre deals', 'r-tyre');
await tapBtn('tyre', 'Log replacement', 'r-tyre');
await tapBtn('battery', 'Check battery', 'r-battery');
await tapBtn('fuel', 'Calculate ROI', 'r-fuel', null, async () => { await setv('fu-km', '1000'); });
await tapBtn('scam', 'Check the quote', 'r-scam', null, async () => { await setv('sc-item', 'brake shoes'); await setv('sc-quote', '3000'); });
await tapBtn('learn', 'Show the steps', 'r-learn');
await tapBtn('learn', 'Watch DIY video', 'r-learn');
await tapBtn('learn', 'All guides', 'r-learn');
await tapBtn('savings', 'Log a saving', 'r-savings', null, async () => { await setv('sv-amt', '1700'); });
await tapBtn('savings', 'Show total', 'r-savings');
await tapBtn('savings', 'Vehicle Twin', 'r-savings');
await tapBtn('sos', 'Show emergency', 'r-sos');
try { await tab('bike'); await page.locator('header button', { hasText: 'Read page' }).click({ timeout: 5000 }); bp++; } catch (e) { bf++; bfail.push('Read page'); }
try { await page.selectOption('#lang-select', 'hi'); await page.waitForTimeout(1000); ((await page.evaluate(() => document.documentElement.lang)) === 'hi') ? bp++ : (bf++, bfail.push('Lang dropdown')); await page.selectOption('#lang-select', 'en'); } catch (e) { bf++; bfail.push('Lang dropdown'); }
o('BUTTONS', { pass: bp, fail: bf, failures: bfail });

// DROPDOWNS
const drops = {}; for (const d of ['#lang-select', '#bk-class', '#bk-doctype', '#dr-sym', '#ty-use', '#sl-cond', '#ln-mod']) drops[d] = await page.evaluate(s => { const el = document.querySelector(s); return el && el.options ? el.options.length : 'MISSING'; }, d);
o('DROPDOWNS', drops);
o('CONSOLE_ERRORS', errs.length);
await b.close(); server.close();
