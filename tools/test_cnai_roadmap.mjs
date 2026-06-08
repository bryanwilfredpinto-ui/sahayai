#!/usr/bin/env node
/* tools/test_cnai_roadmap.mjs — BO1 Roadmap Engine v2 (knowledge-graph) tests.
 * Verifies the REAL AI taxonomy (AI⊃ML⊃DL⊃{GenAI,Agentic}) + a real course per
 * stage. Deterministic, no network. Run: node tools/test_cnai_roadmap.mjs */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RM = require(resolve(ROOT, 'cnai_roadmap_engine.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }
const names = rm => rm.stages.map(s => s.name.toLowerCase()).join(' | ');
const idx = (rm, kw) => rm.stages.findIndex(s => s.name.toLowerCase().includes(kw));

console.log('\n=== BO1 ROADMAP ENGINE v2 — KNOWLEDGE-GRAPH TESTS ===\n');

// 1. Every known goal validates + has a real course on EVERY stage.
for (const goal of RM.listKnownGoals()) {
  const rm = RM.generate(goal); const v = RM.validate(rm);
  ok('known:' + goal + ':valid', v.ok, v.ok ? rm.total_stages + ' stages / ' + rm.total_est_hours + 'h' : v.errors.join('; '));
  ok('known:' + goal + ':course-per-stage', rm.stages.every(s => s.course && /^https?:\/\//.test(s.course.url) && s.course.name), 'real course URL on every stage');
  ok('known:' + goal + ':youtube-per-topic', rm.stages.every(s => s.topics.every(t => !!t.youtube_search_term)));
}

// 2. THE BIG ONE — Agentic AI expands through the REAL tree (ML + DL present,
//    in the correct order: ML before DL before GenAI before Agentic).
const ag = RM.generate('Agentic AI');
ok('agentic:goes-through-ML', idx(ag, 'machine learning') !== -1, 'Core ML stage present');
ok('agentic:goes-through-DL', idx(ag, 'deep learning') !== -1, 'Deep Learning stage present');
ok('agentic:goes-through-GenAI', idx(ag, 'generative ai') !== -1, 'GenAI stage present');
ok('agentic:ML-before-DL', idx(ag, 'machine learning') < idx(ag, 'deep learning'), 'ML before DL');
ok('agentic:DL-before-GenAI', idx(ag, 'deep learning') < idx(ag, 'generative ai'), 'DL before GenAI');
ok('agentic:GenAI-before-Agentic', idx(ag, 'generative ai') < idx(ag, 'agentic ai'), 'GenAI before Agentic');
ok('agentic:python-before-ML', idx(ag, 'python') < idx(ag, 'machine learning'), 'Python before ML');
ok('agentic:math-before-ML', idx(ag, 'math') < idx(ag, 'machine learning'), 'Math before ML');
ok('agentic:>=8-stages', ag.total_stages >= 8, ag.total_stages + ' stages (full stack)');
ok('agentic:tree-note', /inside|⊂/.test(ag.tree_note || ''), ag.tree_note.slice(0, 50));

// 3. The famous real courses are actually referenced.
const allCourses = ag.stages.map(s => s.course.provider + ' ' + s.course.name).join(' | ').toLowerCase();
ok('agentic:fastai-DL', /fast\.?ai/.test(allCourses), 'fast.ai Practical Deep Learning on the DL stage');
ok('agentic:hf-agents', /hugging face.*agents/.test(allCourses), 'HF AI Agents Course on the Agentic stage');
ok('agentic:ng-ml', /andrew ng|machine learning specialization/.test(allCourses), 'Andrew Ng ML Specialization on the ML stage');

// 4. Taxonomy nesting — broader goals are SHORTER paths (subset of the tree).
const mlN = RM.generate('machine learning').total_stages;
const dlN = RM.generate('deep learning').total_stages;
const genN = RM.generate('generative ai').total_stages;
const agN = ag.total_stages;
ok('taxonomy:ml<dl<genai<agentic', mlN < dlN && dlN < genN && genN <= agN, mlN + ' < ' + dlN + ' < ' + genN + ' <= ' + agN);

// 5. Data Analytics vs Data Science are distinct, correct tracks.
const da = RM.generate('data analysis'); const ds = RM.generate('data science');
ok('data-analytics:has-SQL', idx(da, 'sql') !== -1, 'analytics includes SQL');
ok('data-analytics:no-deep-learning', idx(da, 'deep learning') === -1, 'analytics does NOT force deep learning');
ok('data-science:has-deep-learning', idx(ds, 'deep learning') !== -1, 'data science DOES include deep learning');

// 6. Foundations-first enforced; broken forward-prereq rejected.
const broken = JSON.parse(JSON.stringify(RM.generate('machine learning')));
broken.stages[0].prerequisites = ['stage-3'];
ok('foundations-first-enforced', RM.validate(broken).ok === false);
ok('stage1-no-prereq', (ag.stages[0].prerequisites || []).length === 0);

// 7. ANY free-text goal still works (generic) with a course-ish per stage.
for (const goal of ['I raise pigs', 'pottery business', 'tailoring']) {
  const rm = RM.generate(goal);
  ok('generic:' + goal, RM.validate(rm).ok && rm.generic === true && rm.stages.every(s => s.course && s.course.url), rm.total_stages + ' stages');
}

// 8. listTree exposes the knowledge graph (16 modules incl. the AI ladder).
const tree = RM.listTree();
ok('tree-has-ml-dl-genai-agentic', ['core_ml', 'deep_learning', 'genai_llms', 'agentic_ai'].every(id => tree.some(m => m.id === id)), tree.length + ' modules');

// 9. Speakable mentions a course + the tree note (audio-first, en + hi).
const spk = RM.speakable(ag, 'en');
ok('speakable:mentions-course', /Free course/.test(spk) && /fast\.?ai|hugging face/i.test(spk));
ok('speakable:hi-differs', RM.speakable(ag, 'hi') !== spk && /चरण/.test(RM.speakable(ag, 'hi')));

console.log('\n----------------------------------------');
console.log('BO1 Roadmap Engine v2: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
