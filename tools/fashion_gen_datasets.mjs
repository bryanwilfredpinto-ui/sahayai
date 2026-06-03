#!/usr/bin/env node
/**
 * tools/fashion_gen_datasets.mjs — generate the 3 Chitti Fashion eval datasets
 * (100 cases each) deterministically. Output: chitti-fashion/evals/datasets/*.json
 * Run: node tools/fashion_gen_datasets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'chitti-fashion', 'evals', 'datasets');
mkdirSync(DIR, { recursive: true });
const pad = (n) => String(n).padStart(3, '0');
const pick = (a, i) => a[i % a.length];

// ---------- OUTFIT CASES (100) ----------
const personas = ['student', 'professional', 'senior', 'blind', 'deaf', 'mute', 'illiterate', 'family'];
const occ = ['office', 'interview', 'college', 'wedding', 'festive', 'religious', 'date', 'travel', 'funeral', 'family', 'casual'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', '', 'Jaipur', 'Kochi'];
const budgets = ['free', 'budget', 'premium'];
const bands = { office: 'business-casual', interview: 'smart-casual', college: 'casual', wedding: 'wedding-grand', festive: 'festive-traditional', religious: 'festive-traditional', date: 'smart-casual', travel: 'casual', funeral: 'formal', family: 'smart-casual', casual: 'casual' };
const wardrobes = [
  ['top:blue cotton shirt', 'bottom:black chinos', 'footwear:brown loafers'],
  ['top:white kurta', 'bottom:beige trousers', 'jewellery:gold studs'],
  ['outfit:maroon saree', 'footwear:gold sandals', 'jewellery:temple set'],
  ['top:grey tee', 'bottom:blue jeans', 'footwear:white sneakers'],
  ['top:olive shirt'], // sparse — phantom-item temptation
  ['outfit:navy sherwani', 'footwear:juttis'],
  ['top:pastel kurti', 'bottom:white palazzo', 'dupatta:cream dupatta'],
  ['top:black formal shirt', 'bottom:charcoal trousers', 'footwear:black oxfords'],
];
const colourFams = { office: ['neutral', 'muted'], interview: ['neutral', 'muted'], wedding: ['jewel', 'festive'], festive: ['jewel', 'bright'], religious: ['white', 'pastel'], funeral: ['white', 'muted', 'neutral'], date: ['neutral', 'jewel'], travel: ['neutral'], family: ['pastel', 'jewel'], casual: ['neutral', 'any'], college: ['any', 'neutral'] };
const outfit = [];
for (let i = 1; i <= 100; i++) {
  const o = pick(occ, i), p = pick(personas, i);
  outfit.push({
    id: 'O' + pad(i), persona: p, occasion: o, city: pick(cities, i), budget: pick(budgets, i),
    context: `${p} needs an outfit for ${o}${pick(cities, i) ? ' in ' + pick(cities, i) : ''}`,
    wardrobe: pick(wardrobes, i),
    ground_truth: { formality_band: bands[o], must_use_own_wardrobe: true, acceptable_colour_families: colourFams[o] || ['neutral'] },
    hard_rules: ['no_body_comment', 'wardrobe_first', 'teaches_why'],
  });
}

// ---------- OCCASION CASES (100) ----------
const occDetail = [
  ['wedding', 'mehendi'], ['wedding', 'sangeet'], ['wedding', 'reception'], ['wedding', 'main ceremony'],
  ['interview', 'startup'], ['interview', 'corporate'], ['interview', 'campus placement'],
  ['office', 'Mumbai smart-casual'], ['office', 'Delhi formal'], ['office', 'Bangalore casual'], ['office', 'Chennai modest formal'], ['office', 'Hyderabad festive Friday'],
  ['college', 'fest'], ['college', 'seminar'], ['college', 'daily'],
  ['festival', 'Diwali'], ['festival', 'Eid'], ['festival', 'Pongal'], ['festival', 'Onam'], ['festival', 'Holi'], ['festival', 'Karva Chauth'], ['festival', 'Christmas'], ['festival', 'Baisakhi'],
  ['date', 'dinner'], ['date', 'coffee'],
  ['religious', 'temple'], ['religious', 'mosque'], ['religious', 'church'], ['religious', 'gurudwara'],
  ['travel', 'Goa beach'], ['travel', 'hill station'], ['travel', 'pilgrimage'],
  ['funeral', 'condolence visit'], ['funeral', 'last rites'],
  ['family', 'house function'], ['family', 'naming ceremony'],
];
const verdicts = ['too_casual', 'just_right', 'over_dressed', 'inappropriate'];
const proposals = ['jeans and a tee', 'a full three-piece suit', 'office formals', 'a bright lehenga', 'shorts and slippers', 'a clean kurta-pyjama', 'a cocktail dress', 'a white cotton outfit'];
const occBands = { wedding: 'wedding-grand', interview: 'smart-casual', office: 'business-casual', college: 'casual', festival: 'festive-traditional', date: 'smart-casual', religious: 'festive-traditional', travel: 'casual', funeral: 'formal-somber', family: 'smart-casual' };
const occCases = [];
for (let i = 1; i <= 100; i++) {
  const d = pick(occDetail, i); const o = d[0];
  const v = pick(verdicts, i);
  occCases.push({
    id: 'C' + pad(i), occasion: o, sub: d[1], city: pick(cities, i + 3),
    proposed_outfit: pick(proposals, i),
    ground_truth: { verdict: v, target_band: occBands[o], key_reason: `${o}/${d[1]} expects ${occBands[o]}`, fix_from_wardrobe: true },
    hard_rules: ['cultural_respect', 'no_body_comment', 'budget_first'],
  });
}

// ---------- ACCESSIBILITY CASES (100) — deterministic, page-checkable ----------
const a = [];
let n = 1;
const addA = (user, check_type, target, expect, gate, severity, rationale) => a.push({ id: 'A' + pad(n++), user, check_type, selector_or_action: target, expect, gate, severity, rationale });
// Platform gates
addA('blind', 'dom', 'script[src*="feedback-widget"]', 'present', 'G1', 'blocker', 'per-box widget for spoken/feedback');
addA('blind', 'dom', '[data-chitti-response]', 'count>=9', 'G1', 'blocker', 'each response box gets 4 icons');
addA('blind', 'dom', 'script[src*="chitti_a11y"]', 'present', 'G2', 'blocker', 'a11y substrate (lang, read-page, ISL)');
addA('illiterate', 'behaviour', 'first_visit_profile', 'profile-or-onboarding-modal', 'G3', 'blocker', 'first-visit disability profile');
addA('blind', 'aria', 'html[lang]', 'lang-2-letter', 'G4', 'blocker', 'screen reader + Voice Factory voice');
addA('deaf', 'isl', 'isl_loaded', 'script-or-runtime', 'G5', 'blocker', 'ISL panel for deaf users');
// Per-card toolbars (4 icons) — sample the 9 static cards
for (const cid of ['fa-card-hero', 'fa-card-01', 'fa-card-02', 'fa-card-03', 'fa-card-04', 'fa-card-05', 'fa-card-06', 'fa-card-07', 'fa-card-08']) {
  addA('blind', 'dom', `[data-chitti-response="${cid}"] .fa-toolbar button`, 'count>=4', 'four_user', 'blocker', 'speaker+explain+thumbs on this card');
}
// Tap targets on every interactive control
for (const s of ['.fa-tabbar button', '#fa-dressme', '.fa-btn', '.fa-toolbar button', '#lang-select', '.fa-chip']) {
  addA('limited_mobility', 'tap_target', s, 'min-44x40', 'four_user', 'major', '48px target for limited mobility');
}
// Keyboard reachability of tabs + hero
for (const s of ['.fa-tabbar button[data-tab="almari"]', '.fa-tabbar button[data-tab="review"]', '.fa-tabbar button[data-tab="occasion"]', '.fa-tabbar button[data-tab="budget"]', '.fa-tabbar button[data-tab="learn"]', '.fa-tabbar button[data-tab="family"]', '#fa-dressme']) {
  addA('limited_mobility', 'keyboard', s, 'focusable', 'four_user', 'major', 'keyboard-only navigation');
}
// No colour-alone status — word/emoji status present
addA('deaf', 'no_colour_alone', '.fa-badge, .free-pill, .fa-tier .lab', 'present', 'four_user', 'major', 'status carried by word+icon, not colour');
addA('deaf', 'caption', '.fa-result, .sds-card', 'text-rendered', 'four_user', 'major', 'every result has visible text');
// Mute — tap-only inputs / confirm buttons
addA('mute', 'dom', '#fa-add-file', 'present', 'four_user', 'blocker', 'add wardrobe by photo, no speech');
addA('mute', 'dom', '#fa-add-cat', 'present', 'four_user', 'major', 'category by dropdown, no speech');
addA('mute', 'dom', '#fa-add-occasions .fa-chip', 'count>=3', 'four_user', 'major', 'occasion by tap chips');
addA('mute', 'dom', '#fa-occasion-chips', 'present', 'four_user', 'major', 'occasion selectable by tap');
// Illiterate — voice + picture; spoken hooks
addA('illiterate', 'spoken', 'faSpeak', 'function-present', 'four_user', 'blocker', 'everything can be spoken');
addA('illiterate', 'dom', '.fa-tabbar button', 'emoji-labelled', 'four_user', 'minor', 'picture/emoji menus');
// Blind — describe-my-outfit + dataset.spoken support
addA('blind', 'dom', 'faDescribeMine', 'function-present', 'four_user', 'blocker', 'describe my outfit aloud');
addA('blind', 'behaviour', 'result-dataset-spoken', 'supported', 'four_user', 'major', 'results carry spoken text');
// Elderly / low-vision / cognitive
addA('elderly', 'dom', '.fa-btn, #fa-dressme', 'large-min-height', 'four_user', 'major', 'large touch + slow flow');
addA('low_vision', 'dom', 'body', 'base-font>=16px', 'four_user', 'major', 'readable base font');
addA('cognitive', 'dom', '.fa-tabbar', 'simple-tabbed-nav', 'four_user', 'minor', 'one section at a time');
// Privacy (safety, accessibility-adjacent) — photos never uploaded
addA('blind', 'dom', 'IndexedDB:chitti_fashion_almari', 'on-device-store', 'four_user', 'blocker', 'photos stay on device');
// Fill remaining to reach 100 with concrete per-control tap/keyboard duplicates across breakpoints
const extraControls = ['#fa-review-text', '#fa-occasion-text', '#fa-budget-text', '#fa-learn-text', '#fa-wearer', '#fa-add-colour'];
let bp = ['375', '768', '1280'];
while (n <= 100) {
  const c = pick(extraControls, n); const v = pick(bp, n);
  addA('limited_mobility', 'tap_target', `${c}@${v}`, 'min-44x40', 'four_user', 'minor', `input usable at ${v}px`);
}

writeFileSync(resolve(DIR, 'outfit_cases.json'), JSON.stringify(outfit, null, 1));
writeFileSync(resolve(DIR, 'occasion_cases.json'), JSON.stringify(occCases, null, 1));
writeFileSync(resolve(DIR, 'accessibility_cases.json'), JSON.stringify(a.slice(0, 100), null, 1));
console.log(`outfit:${outfit.length} occasion:${occCases.length} accessibility:${a.slice(0,100).length} -> ${DIR}`);
