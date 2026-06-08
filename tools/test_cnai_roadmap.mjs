#!/usr/bin/env node
/* tools/test_cnai_roadmap.mjs — Chitti News AI · BO1 Roadmap Engine tests.
 * Deterministic, no network. Run: node tools/test_cnai_roadmap.mjs */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RM = require(resolve(ROOT, 'cnai_roadmap_engine.js'));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('PASS ' + name + (detail ? ' - ' + detail : '')); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + (detail ? ' - ' + detail : '')); }
}

console.log('\n=== BO1 ROADMAP ENGINE TESTS ===\n');

// 1. Known goals each produce a valid, foundations-first roadmap.
for (const goal of RM.listKnownGoals()) {
  const rm = RM.generate(goal);
  const v = RM.validate(rm);
  ok('known:' + goal + ':valid', v.ok, v.ok ? rm.total_stages + ' stages / ' + rm.total_topics + ' topics / ' + rm.total_est_hours + 'h' : v.errors.join('; '));
  ok('known:' + goal + ':stage1-no-prereq', (rm.stages[0].prerequisites || []).length === 0);
  ok('known:' + goal + ':not-generic', rm.generic === false);
  ok('known:' + goal + ':every-topic-has-yt', rm.stages.every(s => s.topics.every(t => !!t.youtube_search_term)));
  ok('known:' + goal + ':every-stage-has-milestone', rm.stages.every(s => !!s.milestone));
}

// 2. Foundations-first is ENFORCED — a forward prerequisite must fail validate().
const good = RM.generate('python');
const broken = JSON.parse(JSON.stringify(good));
broken.stages[0].prerequisites = ['stage-3']; // stage 1 depends on a later stage
ok('foundations-first-enforced', RM.validate(broken).ok === false, 'forward prereq is rejected');

// 3. ANY free-text goal (never hardcoded) yields a real roadmap.
for (const goal of ['I raise pigs', 'pottery business', 'green farming', 'puppetry', 'tailoring shop']) {
  const rm = RM.generate(goal);
  const v = RM.validate(rm);
  ok('generic:' + goal + ':valid', v.ok, v.ok ? rm.total_stages + ' stages' : v.errors.join('; '));
  ok('generic:' + goal + ':is-generic', rm.generic === true);
  ok('generic:' + goal + ':goal-preserved', rm.goal === goal);
  ok('generic:' + goal + ':>=3-stages', rm.total_stages >= 3);
}

// 4. Alias resolution — "AI agents" maps to the curated Agentic AI roadmap.
ok('alias:ai-agents->agentic', RM.generate('AI agents').generic === false && /Agentic/i.test(RM.generate('AI agents').title));
ok('alias:learn-python->python', /Python/i.test(RM.generate('I want to learn Python').title) && RM.generate('I want to learn Python').generic === false);

// 5. Difficulty ramp — first stage beginner, last stage not beginner (real ramp).
const py = RM.generate('python');
ok('ramp:first-beginner', py.stages[0].difficulty_band === 'beginner');
ok('ramp:last-advanced', py.stages[py.stages.length - 1].difficulty_band === 'advanced');

// 6. Speakable output exists for blind/illiterate users (en + hi).
const spkEn = RM.speakable(py, 'en');
const spkHi = RM.speakable(py, 'hi');
ok('speakable:en-mentions-stages', /Stage 1 of/.test(spkEn) && /Search YouTube for/.test(spkEn), spkEn.length + ' chars');
ok('speakable:hi-differs', spkHi !== spkEn && spkHi.length > 20 && /चरण|Charan/.test(spkHi));
ok('speakable:covers-all-stages', py.stages.every(s => spkEn.includes(s.name)));

// 7. est-hours are summed correctly per stage and overall.
ok('hours:stage-sum', py.stages.every(s => s.est_hours === s.topics.reduce((a, t) => a + t.est_hours, 0)));
ok('hours:total-sum', py.total_est_hours === py.stages.reduce((a, s) => a + s.est_hours, 0));

console.log('\n----------------------------------------');
console.log('BO1 Roadmap Engine: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
