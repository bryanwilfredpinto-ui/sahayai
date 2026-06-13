#!/usr/bin/env node
/**
 * tools/test_mechanic_2w.mjs — Chitti Mechanic 2 Wheeler deterministic engine gold tests.
 * Pure node, no browser. Proves the rules (the product) are correct + honest.
 * Run: node tools/test_mechanic_2w.mjs
 */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(resolve(ROOT, 'chitti_mechanic_2w_engine.js'));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, extra) { if (cond) { pass++; } else { fail++; fails.push(name + (extra ? ' — ' + extra : '')); } }
function has(o, k) { return o && Object.prototype.hasOwnProperty.call(o, k); }
function triplet(name, r) { ok(name + ' has confidence', has(r, 'confidence')); ok(name + ' has risks[]', Array.isArray(r.risks)); ok(name + ' has sources[]', Array.isArray(r.sources) && r.sources.length > 0); }

// ── 1. Every result object carries {confidence, risks[], sources[]} (CONSTITUTION Art.12) ──
triplet('reminders', E.reminders({ pucExpiry: '2026-06-20' }, '2026-06-13'));
triplet('inspect', E.inspect({ asking: 45000, expectedMarket: 42000 }));
triplet('insuranceCompare', E.insuranceCompare({ current: { name: 'ACKO', premium: 2800 } }));
triplet('pucStatus', E.pucStatus({ pucExpiry: '2026-07-15' }, '2026-06-13'));
triplet('serviceSchedule', E.serviceSchedule({ vclass: 'scooter', odoKm: 12500, lastServiceKm: 9000 }));
triplet('tyreStatus', E.tyreStatus({ tyreKm: 21000 }));
triplet('tyreRecommend', E.tyreRecommend('ev'));
triplet('batteryStatus', E.batteryStatus({ vclass: 'scooter', batteryMonths: 26 }));
triplet('fuelEvRoi', E.fuelEvRoi({ monthlyKm: 1000 }));
triplet('obdLookup', E.obdLookup('P0300'));
triplet('scamCheck', E.scamCheck({ item: 'battery', quote: 3500 }));
triplet('coach', E.coach('brake_soft'));
triplet('sellAssistant', E.sellAssistant({ expectedMarket: 68000 }));
triplet('savings', E.savings([{ category: 'x', amount: 1000 }]));
triplet('triage', E.triage('mechanic'));

// ── 2. Reminders: date OR km, urgency, ordering ──
const rem = E.reminders({ insuranceExpiry: '2026-06-18', pucExpiry: '2026-06-14', odoKm: 12600, lastServiceKm: 9000, tyreKm: 21000, batteryMonths: 26, chainKmSinceLube: 600 }, '2026-06-13');
ok('reminders surfaces insurance (≤30d)', rem.items.some(i => i.kind === 'Insurance'));
ok('reminders PUC urgent (≤7d)', rem.items.some(i => i.kind === 'PUC' && i.urgent));
ok('reminders service due (km>3000 since)', rem.items.some(i => i.kind === 'Service'));
ok('reminders tyre worn (≥20000km)', rem.items.some(i => i.kind === 'Tyre'));
ok('reminders sorted urgent-first', rem.items[0].urgent === true);

// ── 3. Inspect: honest scoring + hard risk flags cap the score, never "guaranteed" ──
const clean = E.inspect({ asking: 45000, expectedMarket: 42000, owners: 1, serviceHistory: true, rcClear: true, insuranceValid: true });
ok('inspect clean bike scores high', clean.score >= 80, 'score=' + clean.score);
ok('inspect suggests an offer below market', clean.suggestedOffer < 42000);
const flood = E.inspect({ asking: 45000, expectedMarket: 42000, floodSigns: true, accidentSigns: true, odoSuspect: true });
ok('inspect flood+accident+odo tanks score', flood.score < 50, 'score=' + flood.score);
ok('inspect never claims a guarantee', JSON.stringify(clean.risks).toLowerCase().includes('not a guarantee') || JSON.stringify(clean.risks).toLowerCase().includes('not a workshop'));
ok('inspect flags odometer honesty (suspicion≠proof)', flood.risk.join(' ').toLowerCase().includes('not proof') || flood.risk.join(' ').toLowerCase().includes('cross-check'));

// ── 4. Insurance: ranked by CSR, best = max saving, never a fabricated exact quote ──
const ins = E.insuranceCompare({ current: { name: 'ACKO', premium: 2800 } });
ok('insurance ranks ≥8 insurers', ins.options.length >= 8);
ok('insurance best is a real saving', ins.best && ins.best.estSaving > 0);
ok('insurance flags estimate-not-quote', ins.confidence.toLowerCase().includes('estimate'));

// ── 5. Service + oil: deterministic grade by class; EV has no oil ──
ok('commuter oil = 20W-40', E.oilRecommend('commuter').oil.grade.includes('20W-40'));
ok('scooter oil = 10W-30 scooter', E.oilRecommend('scooter').oil.grade.toLowerCase().includes('scooter'));
ok('EV has no engine oil', E.serviceSchedule({ vclass: 'ev', odoKm: 5000, lastServiceKm: 0 }).oil === null);

// ── 6. Tyre + battery thresholds ──
ok('tyre worn at 20000km', E.tyreStatus({ tyreKm: 20000 }).replace === true);
ok('tyre worn at 3 years', E.tyreStatus({ tyreKm: 0, tyreYears: 3 }).replace === true);
ok('tyre reco fits usage', E.tyreRecommend('ev').options.length >= 1);
ok('battery bad past life', E.batteryStatus({ vclass: 'scooter', batteryMonths: 30 }).status === 'bad');

// ── 7. Fuel/EV ROI math ──
const roi = E.fuelEvRoi({ monthlyKm: 1000, mileageKmpl: 45, petrolPrice: 105, evCostPerMonth: 1200, evNetPrice: 95000 });
ok('ROI petrolMonthly computed', roi.petrolMonthly > 0);
ok('ROI payback computed when saving>0', roi.monthlySaving > 0 ? roi.paybackMonths > 0 : true);

// ── 8. OBD: known code explained, unknown REFUSED (never invented — hallucination guardrail) ──
ok('OBD known code explained', E.obdLookup('P0300').found === true);
const unk = E.obdLookup('Z9999');
ok('OBD unknown code refused', unk.found === false);
ok('OBD unknown says "not in library" not a fake meaning', unk.summary.toLowerCase().includes('not in') || unk.summary.toLowerCase().includes('describe'));

// ── 9. Scam: >30% above fair range = alert ──
const scam = E.scamCheck({ item: 'brake shoes', quote: 3000, expectedLo: 800, expectedHi: 1500 });
ok('scam alert when >30% over', scam.scamAlert === true, 'overPct=' + scam.overPct);
const fairq = E.scamCheck({ item: 'brake shoes', quote: 1200, expectedLo: 800, expectedHi: 1500 });
ok('scam OK when within range', fairq.scamAlert === false);

// ── 10. Triage + Coach: safety-critical forces mechanic-only ──
ok('triage mechanic = 🔴', E.triage('mechanic').sym === '🔴');
ok('coach brakes = mechanic-only', E.coach('brake_soft').tier === 'mechanic');
ok('coach is honest (starting point)', E.coach('low_mileage').risks.join(' ').toLowerCase().includes('starting point'));
ok('coach unknown symptom lists options, no guess', E.coach('zzz').found === false && E.coach('zzz').options.length > 0);

// ── 11. Savings tracker: sum + % of ₹10k goal, framed as tracker not guarantee ──
const sav = E.savings([{ category: 'Scam avoided', amount: 1700 }, { category: 'Insurance', amount: 700 }]);
ok('savings sums correctly', sav.total === 2400);
ok('savings goal = 10000', sav.goal === 10000);
ok('savings says tracker-not-guarantee', sav.risks.join(' ').toLowerCase().includes('not a guarantee'));

// ── 12. Emergency: surfaces numbers, NEVER auto-dials (Golden Rule) ──
const sos = E.emergency();
ok('emergency lists 108/112', sos.numbers.join(' ').includes('108') && sos.numbers.join(' ').includes('112'));
ok('emergency never auto-dials', sos.note.toLowerCase().includes('never auto-dial') || sos.summary.toLowerCase().includes('never auto-dial'));

// ── 13. Vault forget contract exists ──
ok('vault has forget()', typeof E.vault.forget === 'function');

console.log(`\nChitti Mechanic 2W engine gold tests: ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILURES:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('GOLD_RESULT:{"pass":' + pass + ',"fail":0}');
