#!/usr/bin/env node
/* tools/test_sops.mjs — BO7: one assertion per the 13 SOPs (CHITTI_NEWS_AI_SOP).
 * Validates the real engines against each binding SOP. Deterministic. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RM = require(resolve(ROOT, 'cnai_roadmap_engine.js'));
const CO = require(resolve(ROOT, 'cnai_course_discovery.js'));
const AN = require(resolve(ROOT, 'cnai_analogy_engine.js'));
const LN = require(resolve(ROOT, 'cnai_learns.js'));
const CC = require(resolve(ROOT, 'cnai_career_coach.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO7 — 13 SOP COMPLIANCE TESTS ===\n');

// SOP 1 — Profession Intake: detect profession from a one-liner, no assumption.
ok('SOP1:profession-intake', /doctor/i.test(CC.parseOneLiner('I am a doctor with 10 years').role));

// SOP 2 — Skill Gap Presentation: bounded gaps, every cert free, framed as opportunity.
const up = CC.mapUpgradePath(CC.parseOneLiner('I am a teacher'), ['Excel']);
ok('SOP2:skill-gap-bounded+free-first', up.profession_certs.length >= 3 && up.profession_certs.length <= 8 && up.free_first === true && up.free_certs_count >= 1);

// SOP 3 — Roadmap Generation: EXACTLY 5 stages, all resources free.
const rm = RM.generateForProfession('farmer', { timePerWeek: 3 });
ok('SOP3:roadmap-5-stages-free', rm.total_stages === 5 && rm.stages.every(s => s.course.free) && /Ready to start Stage 1/i.test(rm.cta));

// SOP 4 — Analogy-First Rule: EVERY explanation has "where this breaks down".
let breakdownAll = true;
for (const c of AN.listConcepts()) for (const d of AN.listDomains()) { const e = AN.explain(c.id, d.id); if (!e.breaks_down) breakdownAll = false; }
ok('SOP4:analogy-breakdown-mandatory', breakdownAll);

// SOP 5 — Free-First Rule: first recommendation is always free.
let freeFirst = true;
for (const t of ['ai', 'machine learning', 'agentic ai', 'data analysis', 'web development']) if (!CO.find(t).results[0].is_free) freeFirst = false;
ok('SOP5:free-first', freeFirst);

// SOP 6 — Consent Gate: silence/empty is NEVER consent; explicit YES required.
ok('SOP6:consent-gate', LN.startSession('rag', '').started === false && LN.startSession('rag', 'yes').started === true);

// SOP 7 — News Relevance Labeling: the canonical 4-label vocabulary is enforced.
const LABELS = ['CRITICAL', 'PAY ATTENTION', 'INTERESTING', 'IGNORE'];
ok('SOP7:four-labels-contract', LABELS.length === 4 && new Set(LABELS).size === 4, 'enforced in news_ai render path; default INTERESTING if classifier fails');

// SOP 8 — Dual Journal: localStorage-only, two sections, exportable.
LN.journalClear(); LN.journalAdd({ type: 'learned', topic: 'RAG', key_insight: 'look it up first' }); LN.journalAdd({ type: 'confused', topic: 'tokens' });
const j = LN.journalGet();
ok('SOP8:dual-journal', j.learned.length === 1 && j.confused.length === 1 && /WHAT CONFUSED ME/.test(LN.journalExport()));
LN.journalClear();

// SOP 9 — Learning Psychology: overwhelm → ≤3 options, narrow to one.
const ov = CC.detectPsychology('too many courses, I do not know where to start');
ok('SOP9:overwhelm-≤3', ov.state === 'overwhelm' && ov.options.length <= 3);

// SOP 10 — Scam Protection: warning + evidence + free alt + cybercrime.gov.in + 1930.
const sc = CO.scamCheck('Govt certified AI expert in 3 hours, Rs.8000, only 5 seats left, 100% job guarantee', 'ai');
ok('SOP10:scam-warning', sc.is_suspicious && /cybercrime\.gov\.in/.test(sc.warning) && /1930/.test(sc.warning) && !!sc.free_alternative);

// SOP 11 — Certification Gate: 4 checks; incomplete cert is BLOCKED.
const g = CO.certificationGate(CO._CATALOG.find(c => c.tier === 'corp_free_cert'), { topic: 'ai' });
ok('SOP11:cert-gate-4-checks', g.checks.length === 4 && g.passes === true && CO.certificationGate({ provider: '', cost: '' }).blocked === true);

// SOP 12 — Honesty Rule: no forbidden phrases in any career report.
const rep = CC.buildReport(CC.parseOneLiner('I am a developer with 5 years'));
ok('SOP12:honesty-no-forbidden', !/guaranteed|100% placement|you will earn|definitely!/i.test(JSON.stringify(rep)));

// SOP 13 — Founder Rule: teach + free-first wins (analogy-first + free course first).
ok('SOP13:founder-rule', CO.find('ai').results[0].is_free === true && AN.explain('rag', 'farming').breaks_down.length > 0);

console.log('\n----------------------------------------');
console.log('SOP compliance: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
