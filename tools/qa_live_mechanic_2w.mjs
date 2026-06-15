#!/usr/bin/env node
/** QA Agent — LIVE test of Chitti Mechanic 2 Wheeler against the production URL.
 * Real Playwright run against https://sahayai.in/chitti_mechanic_2w.html. Evidence, no claims. */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const SHOT = resolve(dirname(fileURLToPath(import.meta.url)), 'cert_screenshots');
mkdirSync(SHOT, { recursive: true });
const URL = 'https://sahayai.in/chitti_mechanic_2w.html';
const out = (k, v) => console.log(k + '::' + (typeof v === 'object' ? JSON.stringify(v) : v));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }));
await page.waitForTimeout(2500);
const txt = async s => (await page.locator(s).first().innerText().catch(() => '')) || '';
const tab = async k => { await page.click('#tab-' + k).catch(() => {}); await page.waitForTimeout(120); };

out('LOADED_TITLE', await page.title());

// ── How-to-use section ──
const howText = await page.evaluate(() => {
  const want = ['how to use', 'how it works', 'how chitti'];
  const els = [...document.querySelectorAll('h2,h3,button,.hero,p')];
  const hit = els.find(e => want.some(w => (e.innerText || '').toLowerCase().includes(w)));
  return hit ? hit.innerText.slice(0, 80) : '';
});
out('HOWTO_SECTION', howText);
await page.evaluate(() => window.mechTour && window.mechTour());
await page.waitForTimeout(300);
out('HOWTO_STEPS', await txt('#r-tour'));
// Follow the tour steps:
await tab('bike');
await page.fill('#bk-make', 'Honda Activa').catch(() => {});
await page.selectOption('#bk-class', 'scooter').catch(() => {});
await page.fill('#bk-odo', '12500').catch(() => {});
await page.fill('#bk-ins', '2026-07-10').catch(() => {});
await page.fill('#bk-puc', '2026-06-25').catch(() => {});
await page.evaluate(() => window.mechSaveBike());
await page.waitForTimeout(200);
out('STEP_ADDBIKE', await txt('#r-bike'));
await tab('remind'); await page.evaluate(() => window.mechReminders()); await page.waitForTimeout(200);
out('STEP_REMINDERS', await txt('#r-remind'));
await tab('doctor'); await page.evaluate(() => window.mechCoach()); await page.waitForTimeout(200);
out('STEP_DOCTOR', await txt('#r-coach'));
await tab('buy'); await page.fill('#by-mkt', '42000').catch(() => {}); await page.fill('#by-ask', '45000').catch(() => {}); await page.evaluate(() => window.mechInspect()); await page.waitForTimeout(200);
out('STEP_BUY', await txt('#r-buy'));

// ── Four users ──
out('READPAGE_BTN', await page.locator('button:has-text("Read page")').count());
out('SPEAK_API', await page.evaluate(() => typeof window.speechSynthesis !== 'undefined'));
out('SPEAK_BTNS_ON_RESULTS', await page.locator('.speak-btn').count());
// 5-element widget per box (deaf captions/symbols + illiterate icons + mute tap)
const widget = await page.evaluate(() => {
  let ok = 0; const boxes = document.querySelectorAll('[data-chitti-response]');
  boxes.forEach(box => { const bar = box.nextElementSibling; if (bar && bar.classList.contains('chitti-fb-box-bar')) { const a = [...bar.querySelectorAll('.chitti-fb-bbtn')].map(x => x.getAttribute('data-act')); if (['speak', 'up', 'down', 'edit'].every(z => a.includes(z))) ok++; } });
  return { boxes: boxes.length, ok };
});
out('WIDGET', widget);
// status word+symbol (deaf, not colour-only)
await tab('bike'); await page.evaluate(() => window.mechScores()); await page.waitForTimeout(150);
out('STATUS_WORD', await txt('#r-bike .res-status'));
// ISL panel
const isl = await page.evaluate(() => ({ apiIsl: !!(window.Chitti && window.Chitti.isl), islScript: !!document.querySelector('script[src*="isl"]'), islDom: document.querySelectorAll('[class*="isl"],[id*="isl"]').length, a11y: !!(window.Chitti && window.Chitti.a11y) }));
out('ISL', isl);
// mute: any action requiring voice? (all primary actions are buttons)
out('TAP_ONLY', await page.evaluate(() => document.querySelectorAll('button,select,input').length));
// illiterate: emoji tabs
out('EMOJI_TABS', await page.evaluate(() => document.querySelectorAll('.tab .em').length));

// ── Language ──
async function lang(code) {
  await page.selectOption('#lang-select', code); await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    let total = 0, changed = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let n;
    while ((n = w.nextNode())) { if (n._chittiOrig !== undefined) { total++; if (n._chittiOrig !== n.nodeValue) changed++; } }
    return { lang: document.documentElement.lang, dir: document.documentElement.dir, total, changed };
  });
  await page.screenshot({ path: resolve(SHOT, `qa_live_lang_${code}.png`), fullPage: true });
  return r;
}
out('LANG_HI', await lang('hi'));
out('LANG_KN', await lang('kn'));
await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(600);

// ── Mobile 375 horizontal scroll ──
const c375 = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const p375 = await c375.newPage();
await p375.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p375.waitForTimeout(2000);
const scroll = await p375.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
out('MOBILE_375', { ...scroll, overflow: scroll.sw > scroll.cw + 1 });
await p375.screenshot({ path: resolve(SHOT, 'qa_live_375.png'), fullPage: true });
await c375.close();

// ── Every button responds + every dropdown works ──
await page.selectOption('#lang-select', 'en').catch(() => {});
const btnAudit = await page.evaluate(() => {
  return [...document.querySelectorAll('button')].map(b => ({ label: ((b.innerText || '').trim() || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').slice(0, 40), disabled: b.disabled, name: !!((b.innerText || '').trim() || b.getAttribute('aria-label')) }));
});
out('BTN_COUNT', btnAudit.length);
out('BTN_NO_NAME', btnAudit.filter(x => !x.name).length);
// click each onclick-bearing control across all tabs, capture errors
const beforeErr = errs.length;
const tabs = ['bike', 'remind', 'doctor', 'buy', 'sell', 'insure', 'puc', 'service', 'tyre', 'battery', 'fuel', 'scam', 'learn', 'savings', 'sos'];
let clicked = 0;
for (const t of tabs) {
  await tab(t);
  const btns = await page.locator('.panel.active button').all();
  for (const bt of btns) { try { await bt.click({ timeout: 1500 }); clicked++; await page.waitForTimeout(40); } catch (e) {} }
}
out('CLICKED_BUTTONS', clicked);
out('CLICK_ERRORS', errs.slice(beforeErr));
// dropdowns
const drops = ['#lang-select', '#bk-class', '#bk-doctype', '#dr-sym', '#ty-use', '#sl-cond', '#ln-mod'];
const dropRes = {};
for (const d of drops) {
  const r = await page.evaluate(s => { const el = document.querySelector(s); if (!el) return 'MISSING'; return el.options ? el.options.length : 'n/a'; }, d);
  dropRes[d] = r;
}
out('DROPDOWNS', dropRes);
out('TOTAL_CONSOLE_ERRORS', errs.length);
out('CONSOLE_ERRORS_SAMPLE', errs.slice(0, 5));

await b.close();
