/* Chitti Car Mechanic — deterministic engine gold test (BO-gate, G8 hallucination).
 * Run: node tools/test_car_mechanic.mjs
 * Every assertion is hand-computed from the versioned rule tables. SAFETY is supreme:
 * any safety-critical mis-classification (DIY a brake/airbag, "can drive" on a red fault) is P0.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const M = require('../chitti_car_mechanic_engine.js');

let pass = 0, fail = 0; const fails = [];
function eq(name, got, want) { if (got === want) pass++; else { fail++; fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); } }
function ok(name, cond) { if (cond) pass++; else { fail++; fails.push(`${name}: expected truthy`); } }
function has(name, arr) { ok(name, Array.isArray(arr) && arr.length > 0); }

const ASOF = '2026-06-13';

// ── 1. helpers / date math (leap-safe) ──
eq('daysBetween fwd', M.daysBetween('2026-06-13', '2026-06-20'), 7);
eq('daysBetween back', M.daysBetween('2026-06-20', '2026-06-13'), -7);
eq('daysBetween leap', M.daysBetween('2024-02-28', '2024-03-01'), 2);

// ── 2. reminders: overdue + km service ──
const rem = M.reminders({
  docs: { insurance: { expiry: '2026-06-20' }, puc: { expiry: '2026-06-01' } },
  odometerKm: 82000, kmPerMonth: 1000,
  service: { engine_oil: { lastKm: 71000, lastDate: '2025-06-13' }, timing_belt: { lastKm: 0 } }
}, ASOF);
ok('reminders returns list', rem.count >= 3);
const puc = rem.reminders.filter(r => r.type === 'puc')[0];
eq('puc overdue status', puc.status, 'overdue');
const ins = rem.reminders.filter(r => r.type === 'insurance')[0];
eq('insurance 7d urgent', ins.daysToExpiry, 7);
const oil = rem.reminders.filter(r => r.type === 'service:engine_oil')[0];
ok('engine oil overdue (11000km since 10000 interval)', !!oil && oil.status === 'overdue');
const tbelt = rem.reminders.filter(r => r.type === 'service:timing_belt')[0];
ok('timing belt overdue (82000 since 0) + critical', !!tbelt && tbelt.critical === true && tbelt.status === 'overdue');

// ── 3. insurance: indicative compare + savings ranking, honest confidence ──
const insC = M.insuranceCompare({ currentInsurer: 'ICICI Lombard', currentPremium: 12000 });
eq('insurance confidence medium (indicative)', insC.confidence, 'medium');
ok('top pick saves money vs current', insC.topPick.indicativeSaving > 0);
has('insurance risks present (never guarantee)', insC.risks);
ok('all 8 insurers compared', insC.options.length === 8);

// ── 4. PUC ──
eq('puc expired', M.pucStatus('2026-06-01', ASOF).status, 'expired');
eq('puc valid', M.pucStatus('2026-12-01', ASOF).status, 'valid');

// ── 5. oil: never-guess EV; petrol grade ──
eq('petrol oil grade', M.oilRecommendation('petrol').grade, '5W-30');
eq('diesel oil grade', M.oilRecommendation('diesel').grade, '5W-40');
eq('EV no engine oil', M.oilRecommendation('ev').grade, 'N/A');
has('oil carries risk (confirm manual)', M.oilRecommendation('petrol').risks);

// ── 6. tyre health: tread + DOT age, replace logic ──
eq('tread 1.5mm → replace', M.tyreHealth({ treadMm: 1.5 }).verdict, 'replace_now');
eq('tread 2.5mm → replace soon', M.tyreHealth({ treadMm: 2.5 }).verdict, 'replace_soon');
eq('tread 5mm new → ok', M.tyreHealth({ treadMm: 5, ageYears: 1 }).verdict, 'ok');
eq('6yr tyre → replace regardless', M.tyreHealth({ treadMm: 6, ageYears: 6 }).verdict, 'replace_now');
eq('no data → unknown (no guess)', M.tyreHealth({}).verdict, 'unknown');
eq('DOT 0120 old → replace', M.tyreHealth({ dot: '0120', asOf: ASOF }).verdict, 'replace_now');

// ── 7. battery age ──
eq('battery 44mo small → replace_soon', M.batteryStatus({ segment: 'small', ageMonths: 44 }).status, 'replace_soon');
eq('battery 12mo → ok', M.batteryStatus({ segment: 'small', ageMonths: 12 }).status, 'ok');

// ── 8. fuel ROI (deterministic arithmetic) ──
const cng = M.fuelROI({ currentMonthlyFuel: 12000, newMonthlyFuel: 4800, conversionCost: 60000, target: 'cng' });
eq('cng monthly saving', cng.monthlySaving, 7200);
eq('cng annual saving', cng.annualSaving, 86400);
eq('cng payback months', cng.paybackMonths, 8); // 60000/7200 = 8.33 → 8
eq('cng recommend (≤18mo)', cng.recommend, true);

// ── 9. OBD doctor: drive verdict + safety ──
eq('P0300 cannot drive', M.obdLookup('P0300').canDrive, false);
eq('B0100 airbag never DIY', M.obdLookup('B0100').diy, false);
eq('B0100 critical', M.obdLookup('B0100').severity, 'critical');
eq('P0562 battery DIY ok', M.obdLookup('P0562').diy, true);
eq('unknown code → not found, no guess', M.obdLookup('P9999').found, false);
eq('unknown code canDrive null (never assume)', M.obdLookup('P9999').canDrive, null);

// ── 10. scam detector ──
const scam = M.scamCheck([{ job: 'brake_pads', quote: 8500 }, { job: 'battery', quote: 8000 }]);
eq('scam verdict overcharged', scam.verdict, 'likely_overcharged');
ok('scam overcharge band positive', scam.overcharge.hi > 0);
const fairq = M.scamCheck([{ job: 'brake_pads', quote: 4000 }]);
eq('fair quote → fair', fairq.verdict, 'fair');

// ── 11. DIY triage: SAFETY SUPREME ──
eq('bulb = green', M.diyTriage('bulb').level, 'green');
eq('brake pads = red (never DIY)', M.diyTriage('brake pads').level, 'red');
eq('airbag = red', M.diyTriage('airbag').level, 'red');
eq('ac gas = red', M.diyTriage('ac gas').level, 'red');
eq('timing belt = red', M.diyTriage('timing belt').level, 'red');
eq('battery replace = yellow', M.diyTriage('battery replace').level, 'yellow');
ok('every triage is symbol+word (never colour-only)', !!M.diyTriage('bulb').symbol && !!M.diyTriage('bulb').label);
// hard safety: anything containing a never-diy system can never be green
['brake', 'fuel rail', 'ev hv', 'steering', 'suspension'].forEach(t => eq('never-diy ' + t, M.diyTriage(t).level, 'red'));

// ── 12. buy assistant: critical fail caps score ──
const goodBuy = M.buyScore({ checks: { accident_free: true, service_history: true, odometer_genuine: true, engine_ok: true, no_pending_loan: true, tyres_ok: true, brakes_ok: true, papers_valid: true }, expectedPrice: 420000, askingPrice: 450000 });
eq('full pass → good_buy', goodBuy.verdict, 'good_buy');
eq('good buy score 100', goodBuy.score, 100);
ok('negotiation suggested below expected', goodBuy.suggestedOffer < 420000);
const accident = M.buyScore({ checks: { accident_free: false, service_history: true, odometer_genuine: true, engine_ok: true, no_pending_loan: true } });
eq('accident → avoid', accident.verdict, 'avoid');
ok('critical fail caps score <50', accident.score < 50);

// ── 13. sell assistant ──
const sell = M.sellAssistant({ marketValue: 520000, fullServiceHistory: false, tyresWorn: true });
ok('listing > likely', sell.listingPrice > sell.likelyPrice);
ok('potential adds tip value', sell.potentialWithTips > sell.likelyPrice);

// ── 14. symptom coach: calibrated honesty + safety ──
eq('grinding brakes cannot drive', M.symptomCoach('grinding brakes').canDrive, false);
eq('overheating cannot drive', M.symptomCoach('overheating').canDrive, false);
eq('ac not cooling can drive', M.symptomCoach('ac not cooling').canDrive, true);
eq('unknown symptom not found (no guess)', M.symptomCoach('flux capacitor leak').found, false);
eq('unknown symptom canDrive null', M.symptomCoach('flux capacitor leak').canDrive, null);
has('symptom carries risks', M.symptomCoach('ac not cooling').risks);

// ── 15. savings tracker ──
const sav = M.savingsTracker([{ amount: 2500 }, { amount: 5000 }, { amount: 3000 }]);
eq('savings total', sav.total, 10500);
eq('goal met', sav.goalMet, true);

// ── 16. ownership scores deterministic ──
const sc = M.ownershipScores({ service: { a: 1, b: 1 }, docs: { insurance: { expiry: 'x' }, puc: { expiry: 'y' } }, accidentFree: true, fullServiceHistory: true, loanClosed: true });
ok('scores 0-100', sc.maintenance >= 0 && sc.maintenance <= 100 && sc.safety <= 100 && sc.resale <= 100);

// ── 17. crisis: family cascade, NEVER auto-dial ──
const cr = M.crisisCheck('I had an accident, smoke from engine');
eq('crisis detected', cr.crisis, true);
eq('NEVER auto-dial (locked §2)', cr.autoDial, false);
has('crisis cascade present', cr.cascade);
eq('no crisis on normal text', M.crisisCheck('when is my service due').crisis, false);

// ── 18. every public engine result carries confidence + sources ──
['insuranceCompare', 'tyreRecommend', 'fuelCompare', 'mechanicCompare'].forEach(fn => {
  const r = M[fn]({});
  ok(fn + ' has confidence', !!r.confidence);
  ok(fn + ' has sources', Array.isArray(r.sources) && r.sources.length > 0);
});

// ── 19. OBD structured decoder (1000+ codes via SAE J2012 structure, honest) ──
const sP = M.obdLookup('P0299'); // not in table → structured
eq('structured P-code found', sP.found, true);
ok('structured flag set', sP.structured === true);
eq('structured P-code system Powertrain', sP.system, 'Powertrain (engine/transmission)');
const sC = M.obdLookup('C0123'); // chassis → safety-critical, no drive
eq('structured C-code cannot drive (safety)', sC.canDrive, false);
const sB = M.obdLookup('B0055'); // body/airbag → no drive
eq('structured B-code cannot drive', sB.canDrive, false);
eq('garbage code → not found (no guess)', M.obdLookup('XYZ').found, false);
eq('P0302 misfire mapped', M.obdLookup('P0302').found, true);

// ── 20. expanded symptoms (30+) — new entries resolve with correct safety ──
eq('check_engine_light can drive (steady)', M.symptomCoach('check engine light').canDrive, true);
eq('flashing engine light → no drive', M.symptomCoach('flashing engine light').canDrive, false);
eq('soft brake pedal → no drive', M.symptomCoach('brake pedal soft').canDrive, false);
eq('fuel smell → no drive (fire risk)', M.symptomCoach('smell fuel').canDrive, false);
eq('tpms light can drive', M.symptomCoach('tpms light').canDrive, true);
eq('poor mileage can drive', M.symptomCoach('poor mileage').canDrive, true);

// ── 21. 50+ point inspection checklist ──
const insp = M.inspectionChecklist();
ok('inspection ≥50 points', insp.totalPoints >= 50);
ok('inspection has critical points', insp.criticalPoints > 0);
ok('inspection grouped (≥10 groups)', insp.groups.length >= 10);

// ── 22. vehicle education (12+ modules) ──
ok('education ≥12 modules', M.educationModules().count >= 12);

// ── 23. nearest centre — deterministic Maps deep-link (no API) ──
const nc = M.nearestCentre('puc', { pincode: '400001' });
ok('nearestCentre returns maps URL', /google\.com\/maps/.test(nc.mapsUrl) && /400001/.test(nc.mapsUrl));

// ── 24. health dashboard (one snapshot, symbol+word per system) ──
const hd = M.healthDashboard({ insuranceExpiry: '2026-06-01', odometerKm: 50000, oilLastKm: 30000, segment: 'small', batteryDate: '2022-01-01' }, ASOF);
ok('dashboard lists ≥5 systems', hd.systems.length >= 5);
ok('dashboard system has symbol+word (not colour-only)', !!hd.systems[0].status.sym && !!hd.systems[0].status.word);
ok('dashboard carries scores', hd.scores && hd.scores.safety >= 0);

// ── 25. EMI calculator (deterministic reducing-balance) ──
const emi = M.emiCalculator({ principal: 500000, annualRatePct: 9.5, months: 60 });
ok('EMI ~₹10,500/month for 5L@9.5%/60m', emi.emi >= 10000 && emi.emi <= 11000);
ok('EMI total > principal (interest)', emi.totalPayable > 500000 && emi.totalInterest > 0);

// ── 26. vehicle history guide (honest, never fabricates) ──
const vh = M.vehicleHistoryGuide('MH02AB1234');
eq('history live-fetch honest false', vh.live, false);
ok('history lists checks + portals', vh.checks.length >= 5 && vh.portals.length >= 2);

// ── 27. DIY video + EV charging locator (deterministic deep-links) ──
ok('DIY video link builds YouTube search', /youtube\.com/.test(M.diyVideoLink('change a bulb').url));
ok('charging locator maps link', /google\.com\/maps/.test(M.nearestCentre('charging', { pincode: '560001' }).mapsUrl));

// ── 28. vehicle twin timeline (build #1) ──
const tl = M.vehicleTwinTimeline({ model: 'Maruti Swift 2022', odometerKm: 42000, oilLastKm: 38000, tbeltLastKm: 0, batteryDate: '2022-01-01', insuranceExpiry: '2026-06-01', pucExpiry: '2026-12-31' }, ASOF);
ok('timeline has events', tl.count >= 4 && tl.hasData);
ok('timeline orders vehicle→service→renewal', tl.events[0].order === 0);
ok('timeline marks overdue insurance', tl.events.some(e => e.status === 'overdue'));
eq('empty twin → no data (honest)', M.vehicleTwinTimeline({}).hasData, false);

// ── 29. parts guide (build #5) — verify, never declare genuine ──
const pg = M.partsGuide('Maruti');
ok('parts guide returns OEM systems', pg.oemSystems.length >= 1);
ok('parts guide has checklist', pg.checklist.length >= 5);
ok('parts guide NEVER declares genuine from photo', /never declares a part "genuine" from a photo/i.test(pg.rule));
ok('parts guide brand match (Maruti)', pg.oemSystems.some(o => /Maruti/i.test(o.brand)));

// ── report ──
console.log(`\nCHITTI CAR MECHANIC — ENGINE GOLD TEST`);
console.log(`PASS ${pass} · FAIL ${fail}`);
if (fail) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
else console.log('✅ ALL GREEN — deterministic, safety-supreme, no fabricated verdicts.');
