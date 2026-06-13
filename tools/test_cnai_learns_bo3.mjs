#!/usr/bin/env node
/* tools/test_cnai_learns_bo3.mjs — BO3 analogy matrix + consent gate (SOP6) +
 * dual journal (SOP8) + anti-cheat (Pillar8). Deterministic. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AN = require(resolve(ROOT, 'cnai_analogy_engine.js'));
const LN = require(resolve(ROOT, 'cnai_learns.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO3 — ANALOGY MATRIX + CONSENT + JOURNAL + ANTI-CHEAT ===\n');

// 1. Required Skill-5 concept matrix complete; EVERY cell has a breakdown clause.
const REQUIRED = ['variable', 'function', 'api', 'loop', 'database', 'model', 'agent', 'orchestrator', 'rag', 'fine_tuning', 'prompt', 'token', 'embedding', 'neural_network'];
const ids = AN.listConcepts().map(c => c.id);
for (const r of REQUIRED) ok('concept:' + r + ':present', ids.includes(r));
const domains = AN.listDomains().map(d => d.id);
let allBounded = true, missing = '';
for (const c of AN.listConcepts()) {
  for (const d of domains) {
    const e = AN.explain(c.id, d);
    if (!e.found || !e.breaks_down || e.breaks_down.length < 5) { allBounded = false; missing = c.id + '/' + d; }
  }
}
ok('analogy:every-cell-has-breakdown', allBounded, missing ? 'missing ' + missing : (AN.listConcepts().length + ' concepts × ' + domains.length + ' domains'));
ok('analogy:newly-added-3', ['loop', 'database', 'neural_network'].every(id => AN.explain(id, 'farming').found && AN.explain(id, 'cricket').breaks_down));

// 2. Consent gate (SOP 6): silence/empty ≠ yes; explicit yes starts; stop declines.
ok('consent:empty-not-yes', LN.startSession('rag', '').started === false);
ok('consent:silence-not-yes', LN.startSession('rag', '   ').started === false);
ok('consent:maybe-not-yes', LN.startSession('rag', 'hmm maybe later').started === false);
ok('consent:explicit-yes-starts', LN.startSession('rag', 'yes').started === true);
ok('consent:haan-starts', LN.startSession('rag', 'haan').started === true);
ok('consent:stop-declines', LN.startSession('rag', 'not now').reason === 'declined');
const cp = LN.consentPrompt('RAG');
ok('consent:rules', cp.rules.silence_is_consent === false && cp.rules.timeout_to_yes === false && cp.rules.explicit_yes_required === true);
ok('consent:4-step-flow', LN.startSession('rag', 'yes').total_steps === 4);

// 3. Comprehension check is NOT graded, gives feedback.
const chk = LN.checkComprehension('rag', 'It looks things up before answering so it does not make stuff up');
ok('check:not-graded', chk.graded === false && /practice/i.test(chk.note));
ok('check:gives-feedback', chk.verdict === 'engaged' && chk.feedback.length > 10);
ok('check:empty-kind', LN.checkComprehension('rag', '').verdict === 'empty');

// 4. Anti-cheat (Pillar 8): exam/assignment requests refused; teaches instead.
for (const q of ['answer this for my exam', 'do my assignment for me', 'give me the answers to this quiz', 'sit the exam for me', 'this is graded, solve it']) {
  ok('cheat:refuse:' + q.slice(0, 18), LN.isExamRequest(q) && LN.refuseCheat(q).refused && /teach/i.test(LN.refuseCheat(q).message));
}
ok('cheat:normal-ok', LN.isExamRequest('teach me what RAG is') === false);

// 5. Dual Journal (SOP 8): add learned + confused, get, export, clear.
LN.journalClear();
LN.journalAdd({ type: 'learned', topic: 'RAG', analogy_used: 'journalist', key_insight: 'look it up first' });
LN.journalAdd({ type: 'confused', topic: 'embeddings', confusion_note: 'why numbers?' });
const j = LN.journalGet();
ok('journal:learned-stored', j.learned.length === 1 && j.learned[0].topic === 'RAG');
ok('journal:confused-stored', j.confused.length === 1 && j.confused[0].topic === 'embeddings');
const ex = LN.journalExport();
ok('journal:export-text', /WHAT I LEARNED/.test(ex) && /WHAT CONFUSED ME/.test(ex) && /device only/.test(ex));
ok('journal:export-has-entries', /RAG/.test(ex) && /embeddings/.test(ex));
LN.journalClear();
ok('journal:clear', LN.journalGet().learned.length === 0 && LN.journalGet().confused.length === 0);

// 6. honestStatus (regression of original API) still truthful.
const hs = LN.honestStatus('Google ML course');
ok('regression:honestStatus', /read/i.test(hs.honest_line) && hs.did_not.some(s => /exam/i.test(s)));
ok('regression:teach-switch-domain', LN.teach('rag', 'cricket').breaks_down && LN.teach('rag', 'farming').analogy !== LN.teach('rag', 'cricket').analogy);

console.log('\n----------------------------------------');
console.log('BO3 Learns/Analogy: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
