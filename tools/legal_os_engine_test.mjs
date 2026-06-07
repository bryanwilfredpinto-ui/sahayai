/* Chitti Legal OS — deterministic engine gold test (Legal-engine gate)
 * Run: node tools/legal_os_engine_test.mjs
 * Gold legal-math hand-computed from the versioned rule tables. HIGH-risk: in a legal
 * product a DEADLINE is the money-math — any mismatch is a P0 incident.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const L = require('../chitti_legal_os_engine.js');

let pass = 0, fail = 0;
const fails = [];
function eq(name, got, want) { if (got === want) pass++; else { fail++; fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); } }
function ok(name, cond) { if (cond) pass++; else { fail++; fails.push(`${name}: expected truthy`); } }

// ── Limitation periods (the "money math" of law) ──
eq('humanPeriod 3y', L.humanPeriod('years', 3), '3 years');
eq('humanPeriod 12y', L.humanPeriod('years', 12), '12 years');
eq('humanPeriod 90d', L.humanPeriod('days', 90), '3 months');
const lim = L.limitationCheck({ matter: 'money_recovery' });
eq('money recovery period', lim.periodHuman, '3 years');
ok('limitation carries basis', /Limitation Act 1963/.test(lim.basis));
const limOpen = L.limitationCheck({ matter: 'money_recovery', causeDateISO: '2024-01-01', asOfISO: '2024-06-01' });
eq('open deadline (calendar 3y)', limOpen.deadline, '2027-01-01');
eq('open status', limOpen.status, 'open');
const limBarred = L.limitationCheck({ matter: 'money_recovery', causeDateISO: '2020-01-01', asOfISO: '2025-01-01' });
eq('time-barred status', limBarred.status, 'likely-time-barred');
const limConsumer = L.limitationCheck({ matter: 'consumer_complaint' });
eq('consumer limitation 2y', limConsumer.periodHuman, '2 years');
ok('limitation carries confidence', !!lim.confidence);
ok('limitation carries risks[]', Array.isArray(lim.risks) && lim.risks.length > 0);
ok('limitation carries sources[]', Array.isArray(lim.sources) && lim.sources.length > 0);

// ── Cheque-bounce (s.138) timeline ──
const cheq = L.chequeTimeline({ dishonourDateISO: '2026-01-01' });
eq('cheque send-notice-by (+30d)', cheq.sendNoticeBy, '2026-01-31');
eq('cheque drawer-pay-by (+15d)', cheq.drawerPayBy, '2026-02-15');
eq('cheque notice window', cheq.noticeWithinDays, 30);
ok('cheque sources NI Act', cheq.sources.join(' ').includes('Negotiable Instruments Act'));

// ── Notice Decoder (deterministic classification) ──
const nd = L.decodeNotice({ type: 'cheque138' });
ok('notice decoder found cheque138', nd.found === true);
ok('notice deadline mentions 15 days', /15 days/.test(nd.deadline));
eq('classify cheque text', L.classifyNotice('Your cheque has been dishonoured u/s 138'), 'cheque138');
eq('classify income-tax text', L.classifyNotice('Notice u/s 143(2) from the Assessing Officer'), 'incometax');
eq('classify eviction text', L.classifyNotice('You are hereby asked to vacate the premises'), 'eviction');

// ── Rights Coach ──
const rc = L.rightsCoach('arrest');
ok('rights arrest found', rc.found === true);
ok('rights arrest ≥5 rights', rc.rights.length >= 5);
ok('rights arrest cites BNSS', rc.sources.join(' ').includes('BNSS'));
ok('rights has helpline', /15100/.test(rc.helpline));
const rcWomen = L.rightsCoach('women');
ok('rights women found', rcWomen.found === true);

// ── Consumer Router (CPA 2019 Jurisdiction Rules 2021) ──
eq('district ≤₹50L', L.consumerRouter({ claimValue: 4000000 }).forum.includes('District'), true);
eq('state ₹50L–2Cr', L.consumerRouter({ claimValue: 10000000 }).forum.includes('State'), true);
eq('national >₹2Cr', L.consumerRouter({ claimValue: 30000000 }).forum.includes('National'), true);
eq('consumer limitation 2y (730d)', L.consumerRouter({ claimValue: 1000 }).limitationDays, 730);

// ── Contract Risk (deterministic weighted) ──
const cr = L.contractRisk({ flags: { oneSidedTermination: true, heavyPenalty: true, indemnity: true, blankSpaces: true } });
eq('contract score 18+16+14+14=62', cr.riskScore, 62);
eq('contract band high', cr.band, 'high-risk');
ok('contract red flags listed', cr.redFlags.length >= 4);
const crLow = L.contractRisk({ flags: { autoRenew: true } });
eq('contract low band', crLow.band, 'low-risk');

// ── Case Companion ──
const cc = L.caseCompanion({ caseType: 'cheque' });
ok('case cheque stages', cc.found && cc.stages.length > 0);
ok('case never predicts winner', cc.risks.join(' ').toLowerCase().includes('never predicts'));

// ── Document Checklist ──
const dc = L.docChecklist({ task: 'fir' });
ok('checklist fir docs', dc.found && dc.documents.length > 0);
eq('fir cost free', dc.cost, 'Free');

// ── Free Legal Aid (the moat — free help you are OWED) ──
const aidW = L.legalAid({ woman: true });
ok('legal aid woman eligible', aidW.eligible === true);
ok('legal aid woman category', aidW.categories.some(c => c.key === 'woman'));
ok('legal aid helpline 15100', /15100/.test(aidW.helpline));
const aidIncome = L.legalAid({ annualIncome: 200000 });
ok('legal aid low-income eligible', aidIncome.eligible === true);
const aidNone = L.legalAid({});
ok('legal aid still offers advice when not in category', /15100/.test(aidNone.helpline));

// ── Scam Shield (cyber + legal scams) ──
const ss = L.scamShield({ flags: { threatensArrest: true, asksOtpOrPin: true } });
eq('scam score 30+30=60', ss.riskScore, 60);
eq('scam band high', ss.band, 'high-risk');
ok('scam tells to call 1930', ss.whatToDo.join(' ').includes('1930'));
ok('scam digital-arrest flagged', ss.signals.join(' ').toLowerCase().includes('digital arrest'));

// ── Legal Twin (on-device) ──
ok('twin key defined', !!L.twin.KEY);

// ── Every public result carries the a11y/trust contract fields ──
[L.rightsCoach('tenant'), L.scamShield({ flags: {} }), L.consumerRouter({ claimValue: 1 }), L.contractRisk({ flags: {} })].forEach((r, i) => {
  ok('result#' + i + ' confidence', !!r.confidence);
  ok('result#' + i + ' risks[]', Array.isArray(r.risks) && r.risks.length > 0);
  ok('result#' + i + ' sources[]', Array.isArray(r.sources) && r.sources.length > 0);
});

console.log(`\nChitti Legal OS engine test — ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILURES:\n' + fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
console.log('✅ ALL GOLD ASSERTIONS PASS (deterministic legal deadlines + jurisdiction + rights + moat + scam + a11y-contract fields)');
console.log(`QA_RESULT:{"pass":${pass},"fail":${fail}}`);
