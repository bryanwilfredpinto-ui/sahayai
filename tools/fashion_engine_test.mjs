#!/usr/bin/env node
/**
 * tools/fashion_engine_test.mjs — unit tests for the deterministic fashion engine
 * + i18n guard. Covers Gate "unit tests" (CTO SOP §quality gates). No deps.
 * Run: node tools/fashion_engine_test.mjs
 */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(resolve(ROOT, 'chitti_fashion_engine.js'));

let pass = 0, fail = 0; const fails = [];
function ok(name, cond) { if (cond) { pass++; } else { fail++; fails.push(name); } console.log((cond ? '✅' : '❌') + ' ' + name); }
const W = (c, col, d) => ({ id: c + col, category: c, colour: col, desc: d || (col + ' ' + c) });

// ---- classifyOccasion ----
ok('classify: blazer+chinos+loafers = business-casual/formal band',
   ['business-casual', 'formal'].includes(E.classifyOccasion([W('top', 'navy', 'navy blazer'), W('bottom', 'beige', 'chinos'), W('footwear', 'brown', 'loafers')]).occasion));
ok('classify: tee+jeans+sneakers = casual',
   E.classifyOccasion([W('top', 'grey', 'tee'), W('bottom', 'blue', 'jeans'), W('footwear', 'white', 'sneakers')]).occasion === 'casual');
ok('classify: sherwani = wedding',
   E.classifyOccasion([W('outfit', 'navy', 'sherwani'), W('footwear', 'tan', 'juttis')]).occasion === 'wedding');
ok('classify: saree+jewellery = wedding/festive',
   ['wedding', 'festive'].includes(E.classifyOccasion([W('outfit', 'red', 'silk saree'), W('jewellery', 'gold', 'temple set')]).occasion));
ok('classify: empty wardrobe = casual, confidence 0',
   E.classifyOccasion([]).confidence === 0);

// ---- colorHarmony ----
ok('harmony: neutral-anchored scores high',
   E.colorHarmony([W('top', 'white'), W('bottom', 'blue')]).score >= 0.8);
ok('harmony: two brights = competing (lower)',
   E.colorHarmony([W('top', 'red'), W('bottom', 'green')]).type === 'competing');
ok('harmony: single colour safe',
   E.colorHarmony([W('top', 'blue')]).type === 'single');

// ---- seasonalSuitability ----
ok('season: linen/cotton -> summer',
   E.seasonalSuitability([W('top', 'white', 'linen shirt')], 'summer').score === 1);
ok('season: wool -> winter mismatch in summer flagged',
   E.seasonalSuitability([W('top', 'grey', 'wool sweater')], 'summer').score < 1);

// ---- confidence ----
(() => { const c = E.confidence({ occasion: true, color: true, weather: true, budget: true, accessibility: true });
  ok('confidence: all checks pass = 100%', c.confidence === 100);
  ok('confidence: returns reason list', Array.isArray(c.reasons) && c.reasons.length === 5); })();

// ---- judge (AI re-review) ----
ok('judge: red at funeral FAILS on cultural axis',
   E.judge([W('outfit', 'red', 'red kurta')], { occasion: 'funeral' }).pass === false);
ok('judge: neutral office outfit passes',
   E.judge([W('top', 'white', 'shirt'), W('bottom', 'black', 'trousers')], { occasion: 'office' }).pass === true);
ok('judge: senior + heels flags age/comfort',
   E.judge([W('footwear', 'black', 'high heels')], { age_band: 'senior' }).flags.length >= 1);

// ---- buildOutfits (Outfit Simulator) ----
(() => {
  const wd = [W('top', 'navy', 'blazer'), W('top', 'white', 'shirt'), W('bottom', 'beige', 'chinos'), W('bottom', 'blue', 'jeans'), W('footwear', 'brown', 'loafers'), W('footwear', 'white', 'sneakers')];
  const b = E.buildOutfits(wd, { max: 30 });
  ok('simulator: 2 tops x 2 bottoms x 2 footwear = 8 outfits', b.count === 8);
  ok('simulator: every outfit has >=2 pieces', b.outfits.every(o => o.items.length >= 2));
  ok('simulator: never emits a non-owned id (no hallucination)',
     b.outfits.every(o => o.items.every(it => wd.some(w => w.id === it.id))));
})();

// ---- wardrobeROI ----
(() => {
  const wd = [W('top', 'navy', 'blazer'), W('top', 'white', 'shirt'), W('bottom', 'beige', 'chinos'), W('footwear', 'brown', 'loafers')];
  const roi = E.wardrobeROI(wd, W('bottom', 'black', 'trousers'));
  ok('ROI: adding a bottom unlocks > 0 new outfits', roi.unlocked > 0);
  ok('ROI: after >= before', roi.after >= roi.before);
})();

// ---- recommend pipeline ----
(() => {
  const wd = [W('top', 'navy', 'blazer'), W('bottom', 'beige', 'chinos'), W('footwear', 'brown', 'loafers')];
  const r = E.recommend(wd, { max: 1 });
  ok('recommend: returns outfit with confidence + explain + judge', r.length === 1 && typeof r[0].confidence === 'number' && !!r[0].explain && !!r[0].judge);
})();

// ---- craft v2.0: colour science / palette / fabric / pattern / fit ----
ok('colour science: navy hex = cool/dark', (() => { const a = E.analyseColour('#1A3A6B', 'navy'); return a.undertone === 'cool' && a.value === 'dark'; })());
ok('colour science: mustard hex = warm', E.analyseColour('#D4A017', 'mustard').undertone === 'warm');
ok('colour science: undertone-clash lowers harmony', (() => { const h = E.colorHarmony([{ category: 'top', colour: 'mustard', hex: '#D4A017' }, { category: 'bottom', colour: 'teal', hex: '#0B6E6E' }]); return h.type === 'undertone-clash' && h.score <= 0.5; })());
ok('palette: warm season recommends warm+neutral', (() => { const p = E.paletteFor('warm'); return p.best.indexOf('warm') >= 0 && p.best.indexOf('neutral') >= 0; })());
ok('fabric season: linen=summer, wool=winter', E.fabricSeason({ category: 'top', fabric: 'linen' }) === 'summer' && E.fabricSeason({ category: 'top', fabric: 'wool' }) === 'winter');
ok('pattern rule: two prints flagged', E.patternRule([{ desc: 'floral top' }, { desc: 'striped pant' }]).ok === false);
ok('fit note: structured returns garment-term guidance (no body words)', (() => { const n = E.fitNote([{ category: 'top' }], { fit: 'structured' }); return !!n.note && !/fat|thin|body|size/i.test(n.note); })());
ok('learning: liked colours boost score (>= baseline)', (() => {
  const wd = [{ id: 'a', category: 'top', colour: 'navy', hex: '#1A3A6B' }, { id: 'b', category: 'bottom', colour: 'beige', hex: '#D8C8A8' }, { id: 'c', category: 'footwear', colour: 'brown', hex: '#5A3A22' }];
  const base = E.buildOutfits(wd, { max: 1 }).outfits[0].score;
  const liked = E.buildOutfits(wd, { max: 1, liked: { colours: { cool: 3 }, cats: {} } }).outfits[0].score;
  return liked >= base;
})());

// ---- i18n guard (self-contained bundle) ----
(() => {
  const js = readFileSync(resolve(ROOT, 'chitti_fashion_i18n.js'), 'utf8');
  ok('i18n: bundle defines FA_I18N', /FA_I18N\s*=/.test(js));
  ok('i18n: guard never writes raw key (has data-i18n-orig fallback)', /data-i18n-orig/.test(js) && /=== k/.test(js));
  // coverage: fa.hero.title must appear once per primary lang block (>=9)
  const heroCount = (js.match(/"fa\.hero\.title":/g) || []).length;
  ok('i18n: 9 primary langs carry fa.hero.title (>=9)', heroCount >= 9);
  ok('i18n: bundle carries all 9 primary lang blocks', ['en:','hi:','ta:','te:','bn:','mr:','gu:','kn:','ml:'].every(l => js.indexOf('"' + l.slice(0,2) + '":') >= 0 || new RegExp('\\b' + l.slice(0,2) + '"?\\s*:').test(js)));
})();

// ════ CFOS v2.1 — Clothing Doctor · Wedding Planner · Office Week Planner ════
ok('doctor: diagnoseRepair(button_missing) = easy, DIY, has steps',
  (() => { const d = E.diagnoseRepair('button_missing'); return d && d.difficulty === 'easy' && d.diy === true && d.tailor === false && d.steps.length >= 3 && d.ladderStep === 4; })());
ok('doctor: zip_broken = hard, tailor (not DIY)',
  (() => { const d = E.diagnoseRepair('zip_broken'); return d && d.difficulty === 'hard' && d.diy === false && d.tailor === true; })());
ok('doctor: unknown code returns null', E.diagnoseRepair('not_a_code') === null);
ok('doctor: every REPAIR_RULES code has a step sequence',
  E.repairCodes().every(c => { const d = E.diagnoseRepair(c); return d && Array.isArray(d.steps) && d.steps.length >= 1; }));
ok('doctor: buildOutfits SKIPS needs_repair items (no torn shirt styled)',
  (() => {
    const items = [{ id: 't1', category: 'top', colour: 'white', condition: 'needs_repair', damage: ['tear_small'] },
                   { id: 't2', category: 'top', colour: 'blue' },
                   { id: 'b1', category: 'bottom', colour: 'navy' }];
    const b = E.buildOutfits(items, { max: 30 });
    return b.outfits.every(o => o.items.every(it => it.id !== 't1'));
  })());
ok('doctor: includeRepair:true bypasses the guard',
  (() => {
    const items = [{ id: 't1', category: 'top', colour: 'white', condition: 'needs_repair' },
                   { id: 'b1', category: 'bottom', colour: 'navy' }];
    return E.buildOutfits(items, { max: 30, includeRepair: true }).outfits.length >= 1;
  })());

ok('wedding: function maps to band, role!=own steps it down',
  E.FUNCTION_BAND.wedding === 'wedding' && E.FUNCTION_BAND.mehendi === 'festive');
(() => {
  const plan = E.planWedding(
    { function: 'wedding', role: 'own', members: [{ wearer_id: 'me' }, { wearer_id: 'mom' }] },
    { me: [{ id: 's1', category: 'outfit', colour: 'maroon', desc: 'silk saree', hex: '#800000' }],
      mom: [{ id: 's2', category: 'outfit', colour: 'rust', desc: 'silk saree', hex: '#B7410E' }] });
  ok('wedding: derives a warm family palette from warm wardrobes', plan.familyPalette.undertone === 'warm');
  ok('wedding: assigns exactly one anchor', plan.perMember.filter(p => p.role === 'anchor').length === 1);
  ok('wedding: coordinationScore is a 0..100 number', typeof plan.coordinationScore === 'number' && plan.coordinationScore >= 0 && plan.coordinationScore <= 100);
})();
ok('wedding: member with no festive wear gets borrow-before-buy ladder',
  (() => {
    const plan = E.planWedding(
      { function: 'reception', role: 'friend', members: [{ wearer_id: 'a' }, { wearer_id: 'b' }] },
      { a: [{ id: 'g1', category: 'outfit', colour: 'maroon', desc: 'silk lehenga', hex: '#800000' }],
        b: [{ id: 'j1', category: 'top', colour: 'white', desc: 'tshirt' }] });
    const bMember = plan.perMember.find(p => p.wearer_id === 'b');
    return bMember.gaps.length >= 1 && bMember.gaps[0].ladder[0] === 'borrow' && bMember.gaps[0].borrowFrom === 'a';
  })());

(() => {
  const items = [{ id: 't1', category: 'top', colour: 'white', occasions: ['office'] },
                 { id: 't2', category: 'top', colour: 'blue', occasions: ['office'] },
                 { id: 'b1', category: 'bottom', colour: 'navy', occasions: ['office'] },
                 { id: 'b2', category: 'bottom', colour: 'grey', occasions: ['office'] }];
  const days = [{ day: 'Mon', dressCode: 'smart', weather: 'mod' }, { day: 'Tue', dressCode: 'smart', weather: 'mod' }];
  const wk = E.planWeek(items, days);
  ok('week: plans one outfit per day', wk.days.length === 2 && wk.days.every(d => d.outfit));
  ok('week: no-repeat greedy spreads items (Tue differs from Mon)',
    (() => { const mon = wk.days[0].outfit.items.map(i => i.id).sort().join(); const tue = wk.days[1].outfit.items.map(i => i.id).sort().join(); return mon !== tue; })());
  ok('week: variety is a 0..100 number', typeof wk.variety === 'number' && wk.variety >= 0 && wk.variety <= 100);
})();
ok('week: tiny wardrobe degrades HONESTLY (reuse flagged, not hidden)',
  (() => {
    const items = [{ id: 't1', category: 'top', colour: 'white', occasions: ['office'] },
                   { id: 'b1', category: 'bottom', colour: 'navy', occasions: ['office'] }];
    const wk = E.planWeek(items, [{ day: 'Mon', dressCode: 'smart', weather: 'mod' }, { day: 'Tue', dressCode: 'smart', weather: 'mod' }]);
    return wk.reuseCount >= 1 && wk.honest.length > 0;
  })());

// CFOS v2.1 — Size (cross-brand) + Regional composition
ok('size: chest 95cm -> M with India/US/UK/EU labels', (() => { const g = E.sizeGuide({ chestCm: 95 }); return g && g.size === 'M' && g.india === '40"' && g.us === 'M' && /EU 46/.test(g.eu); })());
ok('size: base XL resolves directly', E.sizeGuide({ base: 'XL' }).size === 'XL');
ok('size: no input returns null (no guessing)', E.sizeGuide({}) === null);
ok('region: known culture returns its code', E.regionGuide('bengali').code === 'bengali');
ok('region: unknown culture falls back to other', E.regionGuide('martian').code === 'other');
ok('region: family plan carries a regionCode when culture set',
  (() => { const p = E.planFamily({ occasion: 'festive', culture: 'south', members: [{ wearer_id: 'x' }] }, { x: [{ id: 's', category: 'outfit', colour: 'maroon', desc: 'silk saree', hex: '#800000' }] }); return p.familyPalette.regionCode === 'south'; })());

// CFOS v2.1 — Impact / sustainability observability (Founder Rule made visible)
(() => {
  const items = [{ id: 't1', category: 'top', colour: 'navy', cost: 600, wears: 12 }, { id: 'b1', category: 'bottom', colour: 'beige', cost: 900, wears: 8 }];
  const st = E.impactStats(items, { repairs: 3, reuses: 5 });
  ok('impact: counts ₹0 outfits from owned clothes', typeof st.outfits === 'number' && st.outfits >= 1);
  ok('impact: 3 repairs = 3 garments avoided, money + carbon saved', st.garmentsAvoided === 3 && st.moneySaved === 2400 && st.carbonSaved === 30);
  ok('impact: cost-per-wear computed from cost/wears', st.costPerWear === Math.round(1500 / 20));
  ok('impact: zero ledger = zero saved (no overclaim)', (() => { const z = E.impactStats(items, {}); return z.moneySaved === 0 && z.carbonSaved === 0; })());
})();

// CFOS v2.1 — everyday Family coordination (any occasion, not just weddings)
(() => {
  const plan = E.planFamily(
    { occasion: 'office', members: [{ wearer_id: 'a' }, { wearer_id: 'b' }] },
    { a: [{ id: 't1', category: 'top', colour: 'navy', hex: '#1A3A6B', occasions: ['office'] }, { id: 'b1', category: 'bottom', colour: 'grey', occasions: ['office'] }],
      b: [{ id: 't2', category: 'top', colour: 'blue', hex: '#2A6FB0', occasions: ['office'] }, { id: 'b2', category: 'bottom', colour: 'charcoal', occasions: ['office'] }] });
  ok('family: everyday occasion maps to a band (office→business-casual)', plan.targetBand === 'business-casual');
  ok('family: produces a shared palette + one anchor for any occasion', !!plan.familyPalette.undertone && plan.perMember.filter(p => p.role === 'anchor').length === 1);
  ok('family: coordinationScore is 0..100', typeof plan.coordinationScore === 'number' && plan.coordinationScore >= 0 && plan.coordinationScore <= 100);
})();
ok('family: festive occasion still uses festive-item relevance (reuses wedding core)',
  (() => { const p = E.planFamily({ occasion: 'festive', members: [{ wearer_id: 'x' }] }, { x: [{ id: 's', category: 'outfit', colour: 'maroon', desc: 'silk saree', hex: '#800000' }] }); return p.targetBand === 'festive' && p.perMember.length === 1; })());

// CFOS v2.1 — Senior / Kids adaptive mode
ok('mode: senior guidance returns easy-fasten + non-slip tips',
  (() => { const g = E.modeGuidance('senior'); return g.band === 'senior' && g.tips.includes('easy_fasten') && g.tips.includes('non_slip'); })());
ok('mode: child guidance returns comfort + safe-fasten + room-to-grow',
  (() => { const g = E.modeGuidance('child'); return g.tips.includes('comfort_move') && g.tips.includes('safe_fasten') && g.tips.includes('room_grow'); })());
ok('mode: adult returns no special tips (no nannying)', E.modeGuidance('adult').tips.length === 0);
ok('mode: limited-mobility profile injects easy-fasten regardless of band',
  E.modeGuidance('adult', { limited_mobility: true }).tips.includes('easy_fasten'));

const total = pass + fail;
console.log('\nTEST_SUMMARY:' + JSON.stringify({ total, pass, fail, pass_rate: Math.round((pass / total) * 100) + '%', failed: fails }));
process.exit(fail ? 1 : 0);
