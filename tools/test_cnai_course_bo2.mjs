#!/usr/bin/env node
/* tools/test_cnai_course_bo2.mjs — BO2 Scam Detection (Skill10/SOP10) +
 * Certification Gate (SOP11) + free-first. Deterministic. Run: node tools/test_cnai_course_bo2.mjs */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CO = require(resolve(ROOT, 'cnai_course_discovery.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO2 — SCAM SHIELD + CERT GATE + FREE-FIRST ===\n');

// 1. Free-first: paid never outranks a relevant free result.
for (const topic of ['ai', 'machine learning', 'agentic ai', 'prompt engineering', 'data analysis', 'web development']) {
  const r = CO.find(topic);
  ok('free-first:' + topic, r.results[0].is_free === true, r.results[0].provider);
}

// 2. The 7 scam patterns each detected by a canonical example.
const SCAMS = {
  unrealistic_income: 'Earn ₹50,000/month from AI in 7 days — guaranteed!',
  fake_govt_cert: 'Government Certified AI Expert — pay Rs.15,000 for the sarkari certificate',
  unrealistic_timeline: 'Learn AI in 2 hours and get certified as an expert',
  pressure_tactics: 'Only 5 seats left — offer ends at midnight tonight! Enroll now',
  job_guarantee_fee: '100% placement guaranteed AI course — pay Rs.5000 to register',
  no_transparency: 'Secret AI method, no curriculum or syllabus shown, just trust me',
  social_media_only: 'AI course available only on WhatsApp — DM me for the link',
};
for (const [id, text] of Object.entries(SCAMS)) {
  const r = CO.scamCheck(text, 'ai');
  ok('scam:' + id, r.is_suspicious && r.patterns_detected.some(p => p.id === id), r.patterns_detected.map(p => p.id).join(','));
}
// 3. Scam warning format: mandatory contents.
const bigScam = CO.scamCheck('Govt certified AI expert in 3 hours, Rs.8000, only 5 seats left, WhatsApp only, 100% job guarantee', 'ai');
ok('scam:multi-pattern', bigScam.patterns_detected.length >= 4, bigScam.patterns_detected.length + ' patterns');
ok('scam:says-warning-signs-not-accuse', /warning sign/i.test(bigScam.warning) && !/is a scam\b/i.test(bigScam.warning));
ok('scam:has-1930+cybercrime', /1930/.test(bigScam.warning) && /cybercrime\.gov\.in/.test(bigScam.warning));
ok('scam:offers-free-alt', !!bigScam.free_alternative && bigScam.free_alternative.url);
ok('scam:1930-plain-text-not-tel', bigScam.report_to.helpline === '1930'); // never a tel: link

// 4. Clean text → not suspicious.
ok('scam:clean-ok', CO.scamCheck('NPTEL free machine learning course from IIT', 'ml').is_suspicious === false);
ok('scam:empty-safe', CO.scamCheck('').is_suspicious === false);

// 5. Certification Gate — 4 checks.
const freeCourse = CO._CATALOG.find(c => c.tier === 'corp_free_cert');
const g1 = CO.certificationGate(freeCourse, { topic: 'ai' });
ok('certgate:free-passes-4', g1.passes && g1.checks.length === 4 && g1.checks.every(c => c.pass), g1.checks.map(c => c.id).join(','));
const paidCourse = CO._CATALOG.find(c => c.tier === 'paid');
const g2 = CO.certificationGate(paidCourse, { topic: 'ai' });
ok('certgate:paid-has-free-alt', g2.checks.find(c => c.id === 'free_alternative').pass, 'free alt surfaced for paid');
ok('certgate:cost-disclosed', g2.checks.find(c => c.id === 'cost_disclosed').pass, paidCourse.cost);
// Missing-everything course is BLOCKED.
const bad = CO.certificationGate({ provider: '', cost: '', tags: ['ai'] });
ok('certgate:blocks-incomplete', bad.blocked === true && /SOP 11/.test(bad.block_reason));
ok('certgate:null-safe', CO.certificationGate(null).blocked === true);

// 6. Free-source priority list has all 9.
const fp = CO.freeSourcePriority();
ok('freesrc:9-sources', fp.length === 9 && fp[0].rank === 1 && /NIELIT/i.test(fp[0].source));

// 7. Speakable still works (regression of original API).
ok('regression:find+speakable', typeof CO.speakable(CO.find('ai'), 'en') === 'string');

console.log('\n----------------------------------------');
console.log('BO2 Course/Scam/CertGate: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
