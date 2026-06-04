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

const total = pass + fail;
console.log('\nTEST_SUMMARY:' + JSON.stringify({ total, pass, fail, pass_rate: Math.round((pass / total) * 100) + '%', failed: fails }));
process.exit(fail ? 1 : 0);
