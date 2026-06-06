/* Chitti CA OS — deterministic engine gold test (BO6/BO9 gate)
 * Run: node tools/ca_os_engine_test.mjs
 * Gold money-math hand-computed from FY2025-26 rule tables. HIGH-risk: any mismatch is P0.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CA = require('../chitti_ca_os_engine.js');

let pass = 0, fail = 0;
const fails = [];
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}
function ok(name, cond) { if (cond) pass++; else { fail++; fails.push(`${name}: expected truthy`); } }

// ── Income tax (new regime FY25-26) ──
// ₹12L salaried, new regime: taxable 11,25,000 → tax 52,500 → 87A rebate (≤12L) → 0
const t12 = CA.incomeTaxOne({ gross: 1200000, salaried: true }, 'new');
eq('new ₹12L taxable', t12.taxableIncome, 1125000);
eq('new ₹12L slab tax', t12.slabTax, 52500);
eq('new ₹12L total (87A→0)', t12.totalTax, 0);

// ₹20L salaried new regime: taxable 19,25,000 → slab 1,85,000 → +4% cess = 1,92,400
const t20 = CA.incomeTaxOne({ gross: 2000000, salaried: true }, 'new');
eq('new ₹20L taxable', t20.taxableIncome, 1925000);
eq('new ₹20L slab tax', t20.slabTax, 185000);
eq('new ₹20L total (incl cess)', t20.totalTax, 192400);

// Old regime ₹12L, std 50k, 80C 1.5L, 80D 25k → taxable 9,75,000 → slab 1,07,500 → cess → 1,11,800
const tOld = CA.incomeTaxOne({ gross: 1200000, salaried: true, deductions: { '80C': 150000, '80D': 25000 } }, 'old');
eq('old ₹12L taxable', tOld.taxableIncome, 975000);
eq('old ₹12L slab tax', tOld.slabTax, 107500);
eq('old ₹12L total (incl cess)', tOld.totalTax, 111800);

// Regime recommendation for ₹12L salaried (new=0 < old) → recommend new
const cmp = CA.incomeTax({ gross: 1200000, salaried: true, deductions: { '80C': 150000, '80D': 25000 } });
eq('regime recommend new', cmp.recommendedRegime, 'new');
ok('result carries confidence', !!cmp.confidence);
ok('result carries risks[]', Array.isArray(cmp.risks) && cmp.risks.length > 0);
ok('result carries sources[]', Array.isArray(cmp.sources) && cmp.sources.length > 0);

// Old regime 87A: taxable ≤5L → 0
const tRebate = CA.incomeTaxOne({ gross: 550000, salaried: true }, 'old'); // taxable 5,00,000 → tax 12,500 → rebate → 0
eq('old 87A boundary ₹5L → 0', tRebate.totalTax, 0);

// ── Capital gains ──
const cg = CA.capitalGains({ assetType: 'equity', holdingMonths: 18, gain: 300000 });
// LTCG equity: exempt 1.25L, 12.5% on 1.75L = 21,875
eq('LTCG equity exemption', cg.exemptionUsed, 125000);
eq('LTCG equity tax', cg.tax, 21875);
const cgS = CA.capitalGains({ assetType: 'equity', holdingMonths: 6, gain: 100000 });
eq('STCG equity 20%', cgS.tax, 20000);

// ── GST ──
const g = CA.gstTax(100000, 18);
eq('GST 18% of 1L', g.tax, 18000);
eq('GST cgst half', g.cgst, 9000);
const gh = CA.gstHealth({ itcClaimed: 60000, itc2B: 50000, gstr1Filed: true, gstr3bFiled: true });
eq('GST ITC mismatch', gh.itcMismatch, 10000);
ok('GST health flags mismatch', gh.score < 100);

// ── GSTIN checksum (fraud) ──
const base14 = '27AAPFU0939F1Z';
const chk = CA.gstinChecksum(base14);
ok('checksum returns a char', !!chk && chk.length === 1);
const validGstin = base14 + chk;
ok('valid GSTIN passes', CA.validateGSTIN(validGstin).valid === true);
// tamper the check digit to a different valid-charset char
const wrong = chk === 'A' ? 'B' : 'A';
ok('tampered GSTIN fails', CA.validateGSTIN(base14 + wrong).valid === false);
ok('short GSTIN fails', CA.validateGSTIN('27AAPFU0939F1Z').valid === false);

const fr = CA.fraudShield({ invoices: [{ no: 'INV1', vendor: 'X', amount: 5000 }, { no: 'INV1', vendor: 'X', amount: 5000 }] });
ok('fraud detects duplicate', fr.flags.some(f => f.check === 'duplicate'));

// ── Government Benefits (the moat) ──
const gb = CA.govtBenefits({ state: 'Maharashtra', industry: 'manufacturing', turnover: 20000000, employees: 25, type: 'msme', entityAgeYears: 4 });
ok('govt benefits ≥1 scheme', gb.count >= 1);
ok('govt benefits has Udyam', gb.schemes.some(s => s.id === 'udyam'));
ok('govt benefits has CGTMSE', gb.schemes.some(s => s.id === 'cgtmse'));
ok('govt benefits no-guarantee risk stated', gb.risks.join(' ').toLowerCase().includes('guarantee'));
const startup = CA.govtBenefits({ state: 'Karnataka', industry: 'services', turnover: 5000000, employees: 10, type: 'startup', entityAgeYears: 2 });
ok('startup gets Startup India', startup.schemes.some(s => s.id === 'startupindia'));
const so = CA.schemeOpportunity({ state: 'Maharashtra', industry: 'manufacturing', turnover: 20000000, type: 'msme', entityAgeYears: 4 });
ok('scheme opportunity has a band', so.potentialMax > 0);

// ── Business Doctor ──
const bd = CA.businessDoctor({ revenue: 1000000, netProfit: 150000, currentAssets: 400000, currentLiabilities: 200000, inventory: 100000, debt: 100000, equity: 300000 });
ok('business health 0-100', bd.businessHealthScore >= 0 && bd.businessHealthScore <= 100);
eq('net margin %', bd.netMargin, 15);
eq('current ratio', bd.currentRatio, 2);

// ── Compliance + penalty ──
const cal = CA.complianceCalendar({ roles: ['gst', 'employer'] });
ok('calendar has items', cal.items.length > 0);
const pen = CA.penaltyEstimate({ kind: 'gstr', daysLate: 10 });
eq('gstr late fee 10 days', pen.estimate, 500);

// ── CFO dashboard ──
const cfo = CA.cfoDashboard({ revenue: 1000000, netProfit: 150000 });
ok('cfo health present', cfo.businessHealth >= 0);

console.log(`\nChitti CA OS engine test — ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILURES:\n' + fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
console.log('✅ ALL GOLD ASSERTIONS PASS (deterministic money math + moat + fraud + a11y-contract fields)');
console.log(`QA_RESULT:{"pass":${pass},"fail":${fail}}`);
