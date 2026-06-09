/* tools/test_paisa.mjs — Chitti Paisa engine logic test (Node, deterministic).
 * 🎖️ Chitti Paisa — Household Money Guardian. Run: node tools/test_paisa.mjs */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
const E = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'chitti_paisa_engine.js'));

let pass = 0, fail = 0; const fails = [];
function ok(name, cond, detail) { if (cond) pass++; else { fail++; fails.push('✗ ' + name + (detail ? ' — ' + detail : '')); } }
const approx = (a, b, t) => Math.abs(a - b) <= (t == null ? 0.5 : t);

// EMI
const e = E.emi(100000, 12, 12);
ok('emi(1L,12%,12m) ≈ ₹8,884.88', approx(e.emi, 8884.88, 0.5), '' + e.emi);
ok('emi total interest positive', e.totalInterest > 0 && e.totalPay > e.principal);
ok('emi 0% interest = principal/months', approx(E.emi(120000, 0, 12).emi, 10000, 0.01));

// Loan trap
const trap = E.loanTrap({ principal: 50000, annualRatePct: 48, months: 12 });
ok('loanTrap 48% APR → AVOID', trap.verdict === 'AVOID' && trap.flags.some(f => f.sev === 'high'));
ok('loanTrap chat-app instant loan → AVOID', E.loanTrap({ principal: 10000, annualRatePct: 20, months: 6, source: 'WhatsApp instant 5 min no document' }).verdict === 'AVOID');
ok('loanTrap clean 14% bank loan → OK', E.loanTrap({ principal: 200000, annualRatePct: 14, months: 36 }).verdict === 'OK');
ok('loanTrap carries an EMI calc', E.loanTrap({ principal: 50000, annualRatePct: 24, months: 12 }).emi.emi > 0);

// Budget
const b = E.budget(30000);
ok('budget 50-30-20 of ₹30k', b.needs === 15000 && b.wants === 9000 && b.savings === 6000);
ok('canAfford within budget → yes', E.canAfford(30000, 18000, 3000, 4000).affordable === true);
ok('canAfford EMI>40% income → no', E.canAfford(30000, 10000, 8000, 6000).affordable === false);
ok('canAfford reports free cash + emi ratio', E.canAfford(30000, 18000, 3000, 4000).freeCash === 9000);

// Savings
const sip = E.sipFuture(5000, 12, 12);
ok('sipFuture invested = monthly×months', sip.invested === 60000);
ok('sipFuture grows above invested', sip.futureValue > sip.invested && sip.gain > 0);
const gm = E.goalMonthly(100000, 12, 12);
ok('goalMonthly returns a positive monthly under target', gm.monthlyNeeded > 0 && gm.monthlyNeeded < 100000);

// Scam-shield
const scam = E.scamScan('Dear customer your KYC expired, click http://bit.ly/x and share OTP to update your account immediately');
ok('scamScan OTP+KYC+link → DANGER', scam.verdict === 'DANGER' && scam.score >= 40);
ok('scamScan gives reasons + advice', scam.reasons.length >= 2 && /OTP|PIN|bank/i.test(scam.advice));
ok('scamScan benign text → LOOKS OK', E.scamScan('Hi, are we meeting at 5pm today for tea?').verdict === 'LOOKS OK');
ok('scamScan lottery scam → DANGER', E.scamScan('Congratulations! You have won 25 lakh in the KBC lottery, claim now').verdict === 'DANGER');
ok('scamScan pay-to-verify → DANGER', E.scamScan('To release your refund, please transfer ₹10 to verify your account').verdict === 'DANGER');

// Schemes
const farmer = E.schemes({ age: 45, monthlyIncome: 8000, occupation: 'farmer', gender: 'm', bpl: true, hasBankAccount: false });
ok('schemes farmer → includes PM-KISAN', farmer.eligible.some(s => s.id === 'PM-KISAN'));
ok('schemes no bank account → PMJDY', farmer.eligible.some(s => s.id === 'PMJDY'));
ok('schemes BPL → PDS ration', farmer.eligible.some(s => s.id === 'PDS'));
const girl = E.schemes({ age: 32, occupation: 'worker', gender: 'f', bpl: true, hasGirlChildUnder10: true, hasBankAccount: true });
ok('schemes girl child <10 → SSY', girl.eligible.some(s => s.id === 'SSY'));
ok('schemes BPL woman → Ujjwala', girl.eligible.some(s => s.id === 'UJJWALA'));
ok('schemes worker → e-Shram', girl.eligible.some(s => s.id === 'EShram'));
ok('schemes salaried 50yr → not APY (age/occupation gate)', !E.schemes({ age: 50, occupation: 'salaried' }).eligible.some(s => s.id === 'APY'));

// Guardrail
ok('hasBannedPhrase blocks "guaranteed returns"', E.hasBannedPhrase('this gives guaranteed returns of 20%') !== null);
ok('hasBannedPhrase clean text passes', E.hasBannedPhrase('this is an estimate, markets carry risk') === null);
ok('no banned phrase in scheme/advice strings', E.SCHEMES.every(s => E.hasBannedPhrase(s.why) === null));

console.log('\n──────── Chitti Paisa — engine test ────────');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
if (fails.length) console.log('\n' + fails.join('\n'));
console.log('PAISA_TEST_RESULT:' + JSON.stringify({ pass, fail }));
