#!/usr/bin/env node
/* tools/test_cnai_analogy.mjs — BO3 Analogy Engine + Coaching tests. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const A = require(resolve(ROOT, 'cnai_analogy_engine.js'));
const L = require(resolve(ROOT, 'cnai_learns.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }

console.log('\n=== BO3 ANALOGY ENGINE + COACHING TESTS ===\n');

const concepts = A.listConcepts();
const domains = A.listDomains().map(d => d.id);
ok('has-14-concepts', concepts.length >= 14, concepts.length + ' concepts');
ok('has-7-domains', domains.length === 7, domains.join(','));

// 1. EVERY concept x EVERY domain returns an explanation AND a breaks-down caveat.
let cells = 0, withBreaks = 0;
for (const c of concepts) {
  for (const d of domains) {
    const ex = A.explain(c.id, d);
    cells++;
    ok('cell:' + c.id + ':' + d, ex.found && ex.explanation.length > 10, ex.found ? '' : 'missing');
    if (ex.breaks_down && ex.breaks_down.length > 5) withBreaks++;
  }
}
ok('every-cell-has-breaks-down', withBreaks === cells, withBreaks + '/' + cells + ' cells carry a "breaks down" caveat (anti-leaky-analogy)');

// 2. The SAME concept reads DIFFERENTLY across domains (real analogy, not generic text).
const tokenCricket = A.explain('token', 'cricket').explanation;
const tokenCooking = A.explain('token', 'cooking').explanation;
const tokenGeneral = A.explain('token', 'general').explanation;
ok('domains-differ', tokenCricket !== tokenCooking && tokenCricket !== tokenGeneral);

// 3. The famous leaky analogy is BOUNDED: "token = word" is explicitly corrected.
const tokenBreaks = A.explain('token', 'general').breaks_down.toLowerCase();
ok('token-not-a-word-bounded', /not.*whole word|pieces of words|several tokens|sub-?word/.test(tokenBreaks), tokenBreaks.slice(0, 60));

// 4. Domain detection from natural phrases.
ok('detect:cricket', A.detectDomain('explain like a cricketer') === 'cricket');
ok('detect:share', A.detectDomain('use share market analogy') === 'share_market');
ok('detect:farming', A.detectDomain('I am a farmer') === 'farming');
ok('detect:default-general', A.detectDomain('just explain it') === 'general');

// 5. switchDomain re-renders the SAME concept through a NEW column instantly.
const sw = A.switchDomain('agent', 'farming');
ok('switch-domain', sw.found && sw.domain === 'farming' && /farmhand/i.test(sw.explanation));

// 6. agent + Golden Rule: the agent analogy mentions confirming before acting.
const agentGen = A.explain('agent', 'general');
ok('agent-mentions-confirm', /ask|confirm/i.test(agentGen.explanation + ' ' + agentGen.breaks_down), 'Golden Rule surfaced');

// 7. Speakable says concept, domain, analogy AND the "but remember" caveat.
const spk = A.speakable(A.explain('rag', 'cooking'), 'en');
ok('speakable-has-caveat', /But remember/.test(spk) && /recipe/i.test(spk), spk.slice(0, 70) + '...');
ok('speakable-hi-differs', A.speakable(A.explain('rag', 'cooking'), 'hi') !== spk);

// 8. Coaching: plan is ordered foundations-first; teach card carries analogy +
//    breaks-down + a PRACTICE (never-graded) question.
const plan = L.plan(null, 'cricket');
ok('plan-ordered', plan.cards.every((c, i) => c.order === i + 1) && plan.total >= 14);
const card = L.teach('rag', 'cricket');
ok('teach-has-analogy', card.found && card.analogy.length > 10);
ok('teach-has-breaks', card.breaks_down.length > 5);
ok('teach-practice-not-graded', /not a graded exam/i.test(card.practice_note));
const pr = L.practice('rag');
ok('practice-graded-false', pr.graded === false && /never sit a graded/i.test(pr.note));

// 9. Honest status: reads (not "watched 2 days"), refuses exam-taking.
const hs = L.honestStatus('Google Generative AI');
ok('honest-no-time-fabrication', hs.did_not.some(x => /did not.*watch.*2 days|do not experience time/i.test(x)));
ok('honest-refuses-exam', hs.did_not.some(x => /graded|proctored|exam/i.test(x) && /invalid|not sit/i.test(x)));
ok('honest-reads-material', hs.did.some(x => /read|indexed/i.test(x)));

console.log('\n----------------------------------------');
console.log('BO3 Analogy + Coaching: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
