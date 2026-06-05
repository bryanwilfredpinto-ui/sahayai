#!/usr/bin/env node
/**
 * tools/scanner_router_eval.mjs — Chitti Universal Scanner (CUSOS) router eval.
 *
 * Loads the REAL deterministic router from chitti_scanner.html (the largest inline
 * <script>) in a sandbox and runs it over a hand-labelled dataset. No browser, no LLM,
 * no network — proves the deterministic core that ships even with DeepSeek/backend down.
 *
 * Metrics: router accuracy · wrong-routing · safety (fraud-first) · honest-unknown.
 * Run: node tools/scanner_router_eval.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(__dirname, '..', 'chitti_scanner.html'), 'utf8');

// pull the largest inline script (the app logic)
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, big = '';
while ((m = re.exec(html))) { if (m[1].length > big.length) big = m[1]; }

// sandbox: stub the browser the script touches at top level
const store = {};
const sandbox = {
  console,
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { language: 'en-IN' },
  speechSynthesis: { cancel() {}, speak() {} },
  SpeechSynthesisUtterance: function () {},
  document: { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} },
  URL,
};
sandbox.window = { location: { href: 'https://sahayai.in/chitti_scanner.html', search: '' }, addEventListener: () => {} };
vm.createContext(sandbox);
vm.runInContext(big, sandbox, { filename: 'scanner-inline.js' });
const detect = sandbox.detectCategory;
// ROUTING_MAP is a top-level `const` so it isn't a vm context property; count via regex.
const MAP_COUNT = (big.match(/^\s{2}\w[\w]*:\s*\{\s*em:/gm) || []).length;

// ── Hand-labelled dataset (expected internal category) ──────────────────────
// `safety` flag = a fraud/scam case that MUST route to fraud_signal regardless.
const DATA = [
  // medicine
  ['Crocin Advance 500mg Paracetamol IP, Exp Jul 2027, MRP Rs35', 'medicine'],
  ['Azithromycin 250 tablet, batch B12, mfg 2025', 'medicine'],
  ['Cough syrup 100ml composition dextromethorphan, dosage 10ml', 'medicine'],
  ['Doctor prescription: amoxicillin capsule twice a day', 'medicine'],
  // food
  ['Maggi noodles FSSAI 10012, ingredients wheat, energy 250 kcal, sodium 800mg', 'food'],
  ['Biscuit pack, sugar 12g per 100g, best before 6 months, preservative INS', 'food'],
  ['Nutrition label protein 8g fat 4g, fssai approved', 'food'],
  // vehicle 4w
  ['Engine warning light on car dashboard, OBD code P0301, coolant high', 'vehicle_4w'],
  ['My sedan brake making noise, clutch slipping, rpm fluctuating', 'vehicle_4w'],
  ['SUV tyre pressure low, windscreen wiper not working', 'vehicle_4w'],
  // vehicle 2w
  ['Bike chain sprocket loose, scooter not starting, Activa', 'vehicle_2w'],
  ['Motorcycle two wheeler engine, Pulsar mileage dropped', 'vehicle_2w'],
  // fashion
  ['100% cotton shirt size M, wash care instructions, fabric polyester blend', 'fashion'],
  ['Saree silk, footwear leather, jewellery gold', 'fashion'],
  ['Kurta size L dress, garment care', 'fashion'],
  // government_doc
  ['Aadhaar card number, PAN, ration card, scheme eligibility yojana', 'government_doc'],
  ['PMJAY scheme form, voter id, digilocker document', 'government_doc'],
  // legal_doc
  ['Eviction notice under section 138, demand notice to vacate, agreement', 'legal_doc'],
  ['Rent agreement arbitration clause, court summons, tenant contract', 'legal_doc'],
  // career
  ['Resume CV, work experience, CTC, designation, skills section', 'career_doc'],
  ['Appointment letter offer letter, curriculum vitae', 'career_doc'],
  // crop
  ['Leaf has fungus blight, pesticide for crop in mandi, plant disease', 'crop'],
  ['Soil fertilizer, seed packet, farm pest', 'crop'],
  // appliance
  ['Ceiling fan not working, air conditioner compressor, warranty card model no', 'appliance'],
  ['Refrigerator wattage, washing machine induction', 'appliance'],
  // news
  ['Breaking news headline, correspondent reports, published by newspaper', 'news'],
  // fraud (SAFETY — must win)
  ['You won 25000 prize, click link, share OTP for KYC update on UPI', 'fraud_signal', 'safety'],
  ['Your account is blocked, verify account, scan QR code to get refund', 'fraud_signal', 'safety'],
  ['Lucky draw reward, click here, UPI pin needed', 'fraud_signal', 'safety'],
  // fraud hidden inside an invoice-like text (precedence test)
  ['Invoice total Rs500 — also: you won a prize, share OTP on UPI', 'fraud_signal', 'safety'],
  // unknown (must be honest, not guessed)
  ['random gibberish zzz qqq wxyz', 'unknown'],
  ['', 'unknown'],
  ['asdf 1234 ?? ##', 'unknown'],
];

let pass = 0, wrong = 0, unknownsCorrect = 0, unknownsTotal = 0, safetyTotal = 0, safetyPass = 0;
const fails = [];
for (const row of DATA) {
  const [text, expected, tag] = row;
  const det = detect({ type: null, summary: text, facts: {}, key_findings: [] }, text);
  const got = det.category;
  const ok = got === expected;
  if (ok) pass++;
  else {
    // a WRONG route = routed to a *different live specialist* (not unknown)
    const liveWrong = got !== 'unknown' && expected !== 'unknown';
    if (liveWrong) wrong++;
    fails.push(`exp=${expected} got=${got} (${Math.round(det.confidence * 100)}%) | ${text.slice(0, 48)}`);
  }
  if (expected === 'unknown') { unknownsTotal++; if (got === 'unknown') unknownsCorrect++; }
  if (tag === 'safety') { safetyTotal++; if (got === 'fraud_signal') safetyPass++; }
}

const n = DATA.length;
const acc = (pass / n * 100);
const wrongRate = (wrong / n * 100);
console.log('\n=== CUSOS Router Eval (deterministic, no LLM) ===');
if (fails.length) { console.log('\nMisses:'); fails.forEach(f => console.log('  ' + f)); }
console.log('\nRouter accuracy   : ' + pass + '/' + n + ' = ' + acc.toFixed(1) + '%   (target ≥ 95%)');
console.log('Wrong-routing     : ' + wrong + '/' + n + ' = ' + wrongRate.toFixed(2) + '%  (target < 1%)');
console.log('Safety fraud-first: ' + safetyPass + '/' + safetyTotal + '            (target = 100%)');
console.log('Honest-unknown    : ' + unknownsCorrect + '/' + unknownsTotal + '            (target = 100%)');
const verdict = acc >= 95 && wrongRate < 1 && safetyPass === safetyTotal && unknownsCorrect === unknownsTotal;
console.log('\nEVAL_RESULT:' + JSON.stringify({
  cases: n, accuracy_pct: +acc.toFixed(1), wrong_pct: +wrongRate.toFixed(2),
  safety: `${safetyPass}/${safetyTotal}`, honest_unknown: `${unknownsCorrect}/${unknownsTotal}`,
  routing_map_categories: MAP_COUNT, verdict: verdict ? 'PASS' : 'FAIL',
}));
process.exit(0);
