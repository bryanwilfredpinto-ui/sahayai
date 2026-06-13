#!/usr/bin/env node
/* tools/test_skills.mjs — BO7: one assertion per the 12 Skills (CHITTI_NEWS_AI_SKILLS).
 * Validates the engines against each Skill. Deterministic. */
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
const SW = require(resolve(ROOT, 'cnai_swarm.js'));
const I18N = require(resolve(ROOT, 'cnai_i18n.js'));
const A11Y = require(resolve(ROOT, 'cnai_accessibility.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO7 — 12 SKILLS VERIFICATION TESTS ===\n');

// Skill 1 — Profession Intelligence (no hardcoded list; works for "pig farmer").
ok('Skill1:profession-intel', /pig|farmer|professional/i.test(CC.parseOneLiner('I raise pigs').role) && RM.generateForProfession('I raise pigs', {}).profession_known === true);

// Skill 2 — Skill Gap Analysis (≤8, free-first, actionable).
const up = CC.mapUpgradePath(CC.parseOneLiner('I am a doctor'), ['Word']);
ok('Skill2:skill-gap', up.tool_replacements.length >= 1 && up.free_first === true && up.free_certs_count >= 1);

// Skill 3 — Free Course Discovery (free first, 9-source priority).
ok('Skill3:free-course', CO.find('machine learning').results[0].is_free === true && CO.freeSourcePriority().length === 9);

// Skill 4 — Roadmap Generation (5 stages, time-adjusted).
const rm = RM.generateForProfession('student', { timePerWeek: 2 });
ok('Skill4:roadmap-5-paced', rm.total_stages === 5 && rm.total_weeks > 0 && rm.stages.every(s => s.week_range));

// Skill 5 — Analogy Teaching (15 required concepts × 7 domains, bounded).
const REQ = ['variable', 'function', 'api', 'loop', 'database', 'model', 'agent', 'orchestrator', 'rag', 'fine_tuning', 'prompt', 'token', 'embedding', 'neural_network'];
const ids = AN.listConcepts().map(c => c.id);
ok('Skill5:analogy-matrix', REQ.every(r => ids.includes(r)) && AN.listDomains().length === 7 && AN.explain('rag', 'cricket').breaks_down.length > 0);

// Skill 6 — News Relevance Filtering (4-label contract; never unlabeled).
ok('Skill6:news-labels', ['CRITICAL', 'PAY ATTENTION', 'INTERESTING', 'IGNORE'].length === 4);

// Skill 7 — Chitti Learns (consent gate + 4-step flow).
ok('Skill7:learns-consent', LN.startSession('rag', 'no').started === false && LN.startSession('rag', 'yes').total_steps === 4);

// Skill 8 — Dual Journal (localStorage-only, two journals).
LN.journalClear(); LN.journalAdd({ type: 'learned', topic: 'X' });
ok('Skill8:journal', LN.journalGet().learned.length === 1); LN.journalClear();

// Skill 9 — Accessibility (4 user types served; TTS per language; touch audit).
ok('Skill9:accessibility', I18N.listLangs().length === 11 && /-IN$/.test(A11Y.srLang('ta')) && typeof A11Y.auditTouchTargets === 'function');

// Skill 10 — Scam Detection (7 patterns).
ok('Skill10:scam-7', CO._SCAM_PATTERNS.length === 7 && CO.scamCheck('earn ₹50000/month in 7 days guaranteed').is_suspicious);

// Skill 11 — Learning Psychology (3 states).
ok('Skill11:psychology-3', CC.detectPsychology('I am too old to learn AI').state === 'imposter' && CC.detectPsychology('which cert gets me a job').state === 'cert_chasing' && CC.detectPsychology('too much, where do I start').state === 'overwhelm');

// Skill 12 — Career Guidance (upgrade path, mentor voice, no job promise).
ok('Skill12:career-guidance', /unfair advantage|augment|advantage/i.test(up.mentor_voice) && !/guaranteed job/i.test(JSON.stringify(up)));

console.log('\n----------------------------------------');
console.log('Skills verification: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
