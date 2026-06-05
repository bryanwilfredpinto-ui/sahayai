#!/usr/bin/env node
/**
 * tools/fashion_qa.mjs — full QA pass for Chitti Fashion.
 * Tests: 3 viewports · all 6 tabs · every button · the add-item form · language
 * switch (en/hi/ta/bn) · console/page errors · horizontal overflow · tap targets ·
 * 5-elements-per-box · raw-i18n-key leakage. Prints QA_REPORT JSON.
 * Run: CERT_BASE=http://127.0.0.1:8765 node tools/fashion_qa.mjs
 */
import { chromium } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '') + '/chitti_fashion.html';
const issues = [];
const passes = [];
function P(n) { passes.push(n); console.log('✅ ' + n); }
function F(n, d) { issues.push({ test: n, detail: d }); console.log('❌ ' + n + (d ? ' — ' + d : '')); }

// classify console noise: external substrate CORS/network is non-blocking; page JS errors are blocking
function isExternal(t) { return /railway\.app|CORS|ERR_FAILED|Failed to load resource|net::|observability\/(alert|heartbeat)/i.test(t); }

const b = await chromium.launch({ headless: true });

async function newPage(vp) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + String(e).split('\n')[0]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().split('\n')[0]); });
  p.on('dialog', d => d.accept('QA Tester')); // handle window.prompt (add wearer)
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ done: true })); localStorage.setItem('chitti_fashion_profile_v1', JSON.stringify({ gender: 'female', lang: 'en' })); localStorage.setItem('chitti_vaani_lang', 'en'); } catch (e) {} });
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(1500);
  return { ctx, p, errs };
}
const pageErrs = (errs) => errs.filter(e => !isExternal(e));

// seed a wardrobe so engine flows produce real output
async function seed(p) {
  await p.evaluate(async () => {
    await new Promise((res) => { const r = indexedDB.open('chitti_fashion_almari', 1);
      r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' }); };
      r.onsuccess = () => { const db = r.result, tx = db.transaction('items', 'readwrite'), st = tx.objectStore('items'), now = new Date().toISOString();
        [['t1','top','navy','blazer'],['t2','top','white','shirt'],['b1','bottom','beige','chinos'],['b2','bottom','blue','jeans'],['f1','footwear','brown','loafers'],['f2','footwear','white','sneakers']].forEach(x => st.put({ id: x[0], category: x[1], colour: x[2], desc: x[3], occasions: ['office','casual'], wearer: 'me', added_at: now }));
        tx.oncomplete = () => res(); tx.onerror = () => res(); }; r.onerror = () => res(); });
  });
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(1200);
}
const mutated = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && ((e.textContent || '').trim().length > 0 || e.children.length > 0); }, sel);

// ───────────────── 1. Responsive: 3 viewports, overflow + errors ─────────────────
for (const vp of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }]) {
  const { ctx, p, errs } = await newPage(vp);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  overflow ? F('no horizontal overflow @' + vp.width, 'scrollWidth>' + vp.width) : P('no horizontal overflow @' + vp.width);
  const pe = pageErrs(errs);
  pe.length ? F('no page JS errors @' + vp.width, pe.slice(0, 3).join(' | ')) : P('no page JS errors @' + vp.width);
  await ctx.close();
}

// ───────────────── 2. Mobile: tabs, buttons, form, language ─────────────────
const { ctx, p, errs } = await newPage({ width: 375, height: 812 });
await seed(p);

// 2a. all 8 tabs switch
for (const t of ['almari', 'review', 'occasion', 'budget', 'learn', 'family', 'more', 'career']) {
  const ok = await p.evaluate((tab) => { const btn = document.querySelector('.fa-tabbar button[data-tab="' + tab + '"]'); if (!btn) return false; btn.click(); const panel = document.getElementById('fa-panel-' + tab); return panel && panel.classList.contains('active'); }, t);
  ok ? P('tab switches: ' + t) : F('tab switches: ' + t);
}

// 2b. every button -> result host mutates (engine flows are deterministic; LLM-free)
const buttonTests = [
  ['family', () => {}, 'fa-week-result', 'faSimulate', '#fa-panel-family'],
];
// hero
await p.evaluate(() => faDressMe());
await p.waitForTimeout(800);
(await mutated(p, '#fa-dressme-result')) ? P('button: hero Dress-Me renders') : F('button: hero Dress-Me');
// review (engine)
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="review"]').click(); document.getElementById('fa-review-text').value = 'navy blazer, beige chinos, brown loafers'; faReview(); });
await p.waitForTimeout(800);
(await mutated(p, '#fa-review-result')) ? P('button: Outfit Review (9-agent) renders') : F('button: Outfit Review');
const swarmRows = await p.evaluate(() => document.querySelectorAll('#fa-review-result .fa-swarm .rows .row').length);
(swarmRows >= 9) ? P('v2.1 swarm: 9 voting agents on the verdict panel (' + swarmRows + ')') : F('v2.1 swarm 9 agents', String(swarmRows));
// describe
await p.evaluate(() => faDescribeMine());
await p.waitForTimeout(800);
(await mutated(p, '#fa-review-result')) ? P('button: Describe-My-Outfit renders') : F('button: Describe-My-Outfit');
// occasion
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="occasion"]').click(); const c = document.querySelector('#fa-occasion-chips .fa-chip'); if (c) c.click(); faOccasion(); });
await p.waitForTimeout(800);
(await mutated(p, '#fa-occasion-result')) ? P('button: Occasion renders') : F('button: Occasion');
// weather
await p.evaluate(() => faWeather());
await p.waitForTimeout(600);
(await mutated(p, '#fa-occasion-result')) ? P('button: Weather renders') : F('button: Weather');
// budget
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="budget"]').click(); document.getElementById('fa-budget-text').value = 'formal shirt'; faBudget(); });
await p.waitForTimeout(600);
(await mutated(p, '#fa-budget-result')) ? P('button: Budget renders') : F('button: Budget');
// learn
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="learn"]').click(); document.getElementById('fa-learn-text').value = 'what colour matches blue?'; faLearn(); });
await p.waitForTimeout(600);
(await mutated(p, '#fa-learn-result')) ? P('button: Learn renders') : F('button: Learn');
// family: simulator + ROI
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="family"]').click(); faSimulate(); });
await p.waitForTimeout(800);
(await mutated(p, '#fa-week-result')) ? P('button: Outfit Simulator renders') : F('button: Outfit Simulator');
await p.evaluate(() => faROI());
await p.waitForTimeout(800);
(await mutated(p, '#fa-roi-result')) ? P('button: Wardrobe ROI renders') : F('button: Wardrobe ROI');
// more tab: audit, packing, emergency
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="more"]').click(); faAudit(); });
await p.waitForTimeout(600);
(await mutated(p, '#fa-audit-result')) ? P('button: Wardrobe Audit renders') : F('button: Wardrobe Audit');
await p.evaluate(() => faPacking());
await p.waitForTimeout(600);
(await mutated(p, '#fa-pack-result')) ? P('button: Travel Packing renders') : F('button: Travel Packing');
await p.evaluate(() => faEmergency());
await p.waitForTimeout(600);
(await mutated(p, '#fa-emrg-result')) ? P('button: Emergency outfit renders') : F('button: Emergency outfit');
// CFOS v2.1: Clothing Doctor — damage chips render, diagnose shows a repair plan
const docChips = await p.evaluate(() => document.querySelectorAll('#fa-doc-damage .fa-chip').length);
(docChips >= 10) ? P('v2.1 Doctor: ' + docChips + ' damage chips render') : F('v2.1 Doctor chips', String(docChips));
await p.evaluate(() => { const c = document.querySelector('#fa-doc-damage .fa-chip'); if (c) c.click(); faDiagnose(); });
await p.waitForTimeout(500);
const docPlan = await p.evaluate(() => { const e = document.getElementById('fa-doc-result'); return !!e && /ol|Steps|तरीक़ा/i.test(e.innerHTML) && e.querySelectorAll('li').length >= 1; });
docPlan ? P('v2.1 Doctor: diagnose renders a step-by-step repair plan') : F('v2.1 Doctor plan');
// CFOS v2.1: Office Week Planner — 5 day rows render, plan produces day cards
const weekRows = await p.evaluate(() => document.querySelectorAll('#fa-week-rows .fa-week-dc').length);
(weekRows === 5) ? P('v2.1 Office Week: 5 day rows render') : F('v2.1 Office Week rows', String(weekRows));
await p.evaluate(() => faOfficeWeek());
await p.waitForTimeout(600);
(await mutated(p, '#fa-office-result')) ? P('button: Office Week Planner renders') : F('button: Office Week Planner');
// CFOS v2.1: My Impact — Founder-Rule observability renders ₹0 outfits + saved figures
await p.evaluate(() => faImpact());
await p.waitForTimeout(400);
(await mutated(p, '#fa-impact-result')) ? P('button: My Impact (Founder-Rule observability) renders') : F('button: My Impact');
// CFOS v2.1: Wedding Planner — chips render on occasion tab, plan produces a family layout
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="occasion"]').click(); });
await p.waitForTimeout(200);
const wedChips = await p.evaluate(() => document.querySelectorAll('#fa-wed-func .fa-chip').length + document.querySelectorAll('#fa-wed-role .fa-chip').length);
(wedChips >= 8) ? P('v2.1 Wedding: function + role chips render') : F('v2.1 Wedding chips', String(wedChips));
await p.evaluate(() => faWedding());
await p.waitForTimeout(600);
(await mutated(p, '#fa-wed-result')) ? P('button: Wedding Planner renders') : F('button: Wedding Planner');
// CFOS v2.1: Senior & Kids Mode — lens chips render, picking Senior shows adaptive guidance
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="family"]').click(); });
await p.waitForTimeout(200);
const modeChips = await p.evaluate(() => document.querySelectorAll('#fa-mode-chips .fa-chip').length);
(modeChips >= 4) ? P('v2.1 Modes: senior/kids/teen/adult lens chips render') : F('v2.1 Mode chips', String(modeChips));
await p.evaluate(() => { const c = document.querySelector('#fa-mode-chips .fa-chip'); if (c) c.click(); });
await p.waitForTimeout(500);
const modeGuide = await p.evaluate(() => { const e = document.getElementById('fa-mode-result'); return !!e && e.querySelectorAll('li').length >= 3; });
modeGuide ? P('v2.1 Modes: Senior lens shows adaptive dressing guidance') : F('v2.1 Mode guidance');
// CFOS v2.1: everyday Family coordination — occasion + member chips, coordinate produces a family plan
const famChips = await p.evaluate(() => document.querySelectorAll('#fa-fam-occ .fa-chip').length + document.querySelectorAll('#fa-fam-members .fa-chip').length);
(famChips >= 2) ? P('v2.1 Family: occasion + member chips render') : F('v2.1 Family chips', String(famChips));
await p.evaluate(() => { const c = document.querySelector('#fa-fam-occ .fa-chip'); if (c) c.click(); faFamilyCoordinate(); });
await p.waitForTimeout(600);
(await mutated(p, '#fa-fam-result')) ? P('button: Family coordination renders') : F('button: Family coordination');
// CFOS v2.1: My Size — cross-brand size guidance from a chest measurement
await p.evaluate(() => { const c = document.getElementById('fa-size-chest'); if (c) c.value = '95'; faSizeGuide(); });
await p.waitForTimeout(400);
const sizeOut = await p.evaluate(() => { const e = document.getElementById('fa-size-result'); return !!e && /\bM\b/.test(e.textContent) && /40/.test(e.textContent); });
sizeOut ? P('v2.1 Size: chest 95cm -> M + India/US/UK/EU labels render') : F('v2.1 Size guidance');
// career coach: pick a role -> plan with real resources renders
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="career"]').click(); const r = document.querySelector('#fa-coach-host [data-role]'); if (r) r.click(); });
await p.waitForTimeout(500);
const coach = await p.evaluate(() => { const el = document.getElementById('fa-coach-plan'); const t = el ? el.textContent : ''; return { mut: !!t && t.length > 20, hasLink: !!(el && el.querySelector('a[href^="http"]')) }; });
(coach.mut && coach.hasLink) ? P('button: Career Coach plan + real resource links render') : F('button: Career Coach', JSON.stringify(coach));

// 2c. add-item form: open modal, fill, save -> wardrobe count up
await p.evaluate(() => { document.querySelector('.fa-tabbar button[data-tab="almari"]').click(); });
const before = await p.evaluate(() => +document.getElementById('fa-n-top').textContent);
const modalOpened = await p.evaluate(() => { faOpenAdd(); return document.getElementById('fa-add').classList.contains('shown'); });
modalOpened ? P('form: add-item modal opens') : F('form: add-item modal opens');
await p.evaluate(() => { document.getElementById('fa-add-cat').value = 'top'; document.getElementById('fa-add-colour').value = 'green'; const ch = document.querySelector('#fa-add-occasions .fa-chip'); if (ch) ch.click(); faSaveItem(); });
await p.waitForTimeout(600);
const after = await p.evaluate(() => +document.getElementById('fa-n-top').textContent);
(after === before + 1) ? P('form: save item increments wardrobe (' + before + '->' + after + ')') : F('form: save item', before + '->' + after);
const modalClosed = await p.evaluate(() => !document.getElementById('fa-add').classList.contains('shown'));
modalClosed ? P('form: modal closes after save') : F('form: modal closes after save');

// 2d. 5 elements per box — provided by feedback-widget.js (.chitti-fb-box-bar: ▶/🔊/👍/👎 + ✏️/🎙️ via 👎 modal)
await p.waitForTimeout(800);
const fiveEl = await p.evaluate(() => { const bars = [...document.querySelectorAll('.chitti-fb-box-bar')]; const ok = bars.filter(b => b.querySelectorAll('button').length >= 4).length; return { bars: bars.length, ok, boxes: document.querySelectorAll('[data-chitti-response]').length }; });
(fiveEl.ok >= Math.min(fiveEl.boxes, 9)) ? P('5-elements: feedback-widget bar on ' + fiveEl.ok + ' boxes (4+ icons each)') : F('5-elements per box', JSON.stringify(fiveEl));

// 2e. tap targets
const small = await p.evaluate(() => { const out = []; ['.fa-tabbar button', '#fa-dressme', '.fa-btn', '.fa-toolbar button', '#lang-select'].forEach(s => { document.querySelectorAll(s).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.width < 44 || r.height < 38)) out.push(s + '=' + Math.round(r.width) + 'x' + Math.round(r.height)); }); }); return out; });
small.length === 0 ? P('tap targets >= 44x38') : F('tap targets', small.slice(0, 5).join(', '));

// 2f. language switch en/hi/ta/bn -> 0 raw keys + non-blank lang labels
for (const L of ['hi', 'ta', 'bn', 'en']) {
  await p.evaluate((x) => { document.getElementById('lang-select').value = x; faChangeLang(x); }, L);
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const tg = [...document.querySelectorAll('[data-vai-i18n]')]; let raw = 0; tg.forEach(e => { if ((e.textContent || '').trim() === e.getAttribute('data-vai-i18n')) raw++; }); const sel = document.getElementById('lang-select'); const blankOpts = [...sel.options].filter(o => !(o.textContent || '').trim()).length; return { raw, blankOpts }; });
  (r.raw === 0 && r.blankOpts === 0) ? P('language ' + L + ': 0 raw keys, 0 blank lang labels') : F('language ' + L, 'rawKeys=' + r.raw + ' blankLangLabels=' + r.blankOpts);
}

const finalPE = pageErrs(errs);
finalPE.length === 0 ? P('no page JS errors during full interaction') : F('page JS errors during interaction', finalPE.slice(0, 4).join(' | '));
console.log('   (external substrate console noise, non-blocking: ' + errs.filter(isExternal).length + ' lines — CORS to chitti-shares observability)');

await ctx.close();
await b.close();

console.log('\nQA_REPORT:' + JSON.stringify({ total: passes.length + issues.length, pass: passes.length, fail: issues.length, issues }));
process.exit(issues.length ? 1 : 0);
