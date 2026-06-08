#!/usr/bin/env node
/* tools/test_cnai_courses.mjs — BO2 Course Discovery tests (deterministic). */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CD = require(resolve(ROOT, 'cnai_course_discovery.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }

console.log('\n=== BO2 COURSE DISCOVERY TESTS ===\n');

// 1. Free-first: for common AI topics the TOP result is free, not paid.
for (const topic of ['agentic ai', 'machine learning', 'prompt engineering', 'web development', 'data analysis', 'ai']) {
  const r = CD.find(topic);
  ok('free-first:' + topic, r.results.length > 0 && r.results[0].is_free, r.results.length ? r.results[0].provider + ' (' + r.results[0].tier_label + ')' : 'no results');
  ok('has-results:' + topic, r.results.length >= 1, r.results.length + ' results');
}

// 2. Government/free-with-cert tier ranks above corporate-free and paid.
const ml = CD.find('machine learning');
const tiers = ml.results.map(r => r.tier);
const firstPaidIdx = tiers.indexOf('paid');
const firstGovtIdx = tiers.indexOf('govt_free_cert');
ok('govt-before-paid', firstGovtIdx === -1 || firstPaidIdx === -1 || firstGovtIdx < firstPaidIdx, 'govt@' + firstGovtIdx + ' paid@' + firstPaidIdx);
ok('paid-is-last-tier', firstPaidIdx === -1 || firstPaidIdx === tiers.length - tiers.slice(firstPaidIdx).filter(t => t === 'paid').length, 'paid sinks to the end');

// 3. Every paid result carries a why_no_free explanation (transparency).
const paidRes = ml.results.filter(r => !r.is_free);
ok('paid-has-why', paidRes.every(r => r.why_no_free && r.why_no_free.length > 10), paidRes.length + ' paid results');

// 4. Every result carries a discrete cost + cert flag (no hidden pricing).
ok('every-result-has-cost', ml.results.every(r => typeof r.cost === 'string' && r.cost.length > 0));
ok('every-result-has-cert-bool', ml.results.every(r => typeof r.cert === 'boolean'));
ok('every-result-has-url', ml.results.every(r => /^https?:\/\//.test(r.url)));

// 5. Tier ladder is the free-first order with paid LAST.
const ladder = CD.tierLadder();
ok('ladder-paid-last', ladder[ladder.length - 1] === 'paid');
ok('ladder-govt-first', ladder[0] === 'govt_free_cert');

// 6. Registration plan is consent-gated, never auto-enrols, refuses exam-taking.
const plan = CD.registrationPlan(ml.results[0], { name: 'Bryan' });
ok('plan-has-consent-gate', plan.steps.some(s => s.gate === 'chittiConfirmAndDo'));
ok('plan-prefill-requires-consent', plan.steps.some(s => s.id === 'prefill' && s.requires === 'consent'));
ok('plan-no-auto-enrol', plan.steps.every(s => !(s.id === 'prefill' && s.auto === true)));
ok('plan-refuses-exam', plan.refusals.some(r => /exam/i.test(r) && /invalid|cannot|not/i.test(r)));
ok('plan-states-ethics', /will NOT|not create an account|invalid/i.test(plan.ethics));

// 7. ANY topic still returns at least the YouTube free tier (never empty).
for (const odd of ['pig farming', 'pottery', 'tailoring']) {
  const r = CD.find(odd);
  ok('any-topic-nonempty:' + odd, r.results.length >= 1 && r.results.some(x => x.is_free), r.results.length + ' results');
}

// 8. Speakable says free/paid explicitly for blind/illiterate users.
const spk = CD.speakable(ml, 'en');
ok('speakable-says-free', /free/i.test(spk), spk.slice(0, 60) + '...');
ok('speakable-hi-differs', CD.speakable(ml, 'hi') !== spk);

console.log('\n----------------------------------------');
console.log('BO2 Course Discovery: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
