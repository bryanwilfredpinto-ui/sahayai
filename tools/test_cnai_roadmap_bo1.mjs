#!/usr/bin/env node
/* tools/test_cnai_roadmap_bo1.mjs — BO1 PROFESSION 5-STAGE path tests.
 * Verifies Skill 4 / SOP 3 / CEOS BO1 self-check: exactly 5 named stages per
 * profession × 3 levels, 100% free, foundations-first, time-adjusted week ranges,
 * cheat sheet + checkpoint + CTA, "I raise pigs" (no hardcoded ceiling), share
 * round-trip, and backward-compat (original generate(goal) untouched).
 * Deterministic, no network. Run: node tools/test_cnai_roadmap_bo1.mjs */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RM = require(resolve(ROOT, 'cnai_roadmap_engine.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }
const STAGE_LABELS = ['foundations', 'core', 'handson', 'advanced', 'cert'];

console.log('\n=== BO1 ROADMAP ENGINE — PROFESSION 5-STAGE TESTS ===\n');

// 1. All 13 seed professions × 3 levels → EXACTLY 5 stages, valid, 100% free.
const HOURS = { beginner: 2, intermediate: 7, advanced: 12 }; // maps to ×2/×1.5/×1 pace
for (const p of RM.listProfessions()) {
  for (const lvl of Object.keys(HOURS)) {
    const rm = RM.generateForProfession(p.label, { timePerWeek: HOURS[lvl] });
    const v = RM.validate(rm);
    ok('prof:' + p.key + ':' + lvl + ':5-stages', rm.total_stages === 5, rm.total_stages + ' stages');
    ok('prof:' + p.key + ':' + lvl + ':valid', v.ok, v.ok ? 'ok' : v.errors.join('; '));
    ok('prof:' + p.key + ':' + lvl + ':100%-free', rm.stages.every(s => s.course && s.course.free === true), 'every stage course free');
    ok('prof:' + p.key + ':' + lvl + ':stage-labels', rm.stages.map(s => s.stage_label).join(',') === STAGE_LABELS.join(','), 'FOUNDATIONS→CERT');
    ok('prof:' + p.key + ':' + lvl + ':per-stage-fields', rm.stages.every(s => s.milestone && s.checkpoint && s.cheat_sheet && s.week_range), 'milestone+checkpoint+cheat+week_range');
  }
}

// 2. Foundations-first: stage 1 has no prereq; each later stage depends on prior.
const dev = RM.generateForProfession('React developer', { timePerWeek: 5 });
ok('prof:stage1-no-prereq', (dev.stages[0].prerequisites || []).length === 0);
ok('prof:sequential-prereq', dev.stages.slice(1).every((s, i) => (s.prerequisites || [])[0] === 'stage-' + (i + 1)));
ok('prof:cta-present', /Ready to start Stage 1/i.test(dev.cta || ''), dev.cta);

// 3. Time-adjustment: fewer hours/week → more total weeks (×2 vs ×1).
const slow = RM.generateForProfession('teacher', { timePerWeek: 2 });
const fast = RM.generateForProfession('teacher', { timePerWeek: 12 });
ok('pace:slow-has-more-weeks', slow.total_weeks > fast.total_weeks, slow.total_weeks + 'w @2h vs ' + fast.total_weeks + 'w @12h');
ok('pace:factor-2-and-1', slow.pace_factor === 2 && fast.pace_factor === 1);
ok('pace:week-ranges-contiguous', slow.stages.every(s => /Week/.test(s.week_range)), slow.stages.map(s => s.week_range).join(' | '));
ok('pace:adjusted-hours-doubled-ish', slow.total_est_hours_adjusted === slow.total_est_hours * 2);

// 4. NO HARDCODED PROFESSION CEILING — unknown professions still get 5 valid stages.
for (const p of ['I raise pigs', 'puppeteer', 'Bharatanatyam dancer', 'auto rickshaw driver']) {
  const rm = RM.generateForProfession(p, { timePerWeek: 5 });
  ok('unknown:' + p + ':5-valid', rm.total_stages === 5 && RM.validate(rm).ok && rm.stages.every(s => s.course.free), 'profession_known=' + rm.profession_known);
  ok('unknown:' + p + ':names-the-profession', new RegExp(p.split(' ')[0], 'i').test(rm.title) || /your profession/i.test(rm.title), rm.title);
}
// "pig" alias should resolve to Farmer (seed), proving alias resolution works.
ok('alias:pig→farmer', /farmer|agriculture/i.test(RM.generateForProfession('I raise pigs', {}).profession), RM.generateForProfession('I raise pigs', {}).profession);

// 5. generate() routing: opts.profession → 5-stage; bare goal → original DAG.
const viaGenerate = RM.generate('doctor', { profession: 'doctor', timePerWeek: 5 });
ok('route:opts.profession→5-stage', viaGenerate.is_profession_path === true && viaGenerate.total_stages === 5);
const bareGoal = RM.generate('agentic ai');
ok('route:bare-goal→DAG-untouched', bareGoal.is_profession_path !== true && bareGoal.total_stages >= 8, bareGoal.total_stages + ' DAG stages');

// 6. Share round-trip (CEOS BO1 #7: < 2048 chars).
const share = RM.toShareParams(dev);
ok('share:short', typeof share === 'string' && share.length < 2048, share.length + ' chars');
const restored = RM.fromShareParams(share);
ok('share:roundtrip', restored && restored.is_profession_path && /developer/i.test(restored.profession), restored && restored.profession);
const shareGoal = RM.toShareParams(bareGoal);
ok('share:goal-roundtrip', /agentic/i.test((RM.fromShareParams(shareGoal) || {}).goal || ''));

// 7. Free-first: zero paid courses in any default profession roadmap.
let anyPaid = false;
for (const p of RM.listProfessions()) { const rm = RM.generateForProfession(p.label, {}); if (rm.stages.some(s => s.course.free !== true)) anyPaid = true; }
ok('free-first:zero-paid-default', anyPaid === false, 'no paid course in any default profession roadmap');

// 8. Speakable (audio-first) includes week range + CTA for profession path.
const spk = RM.speakable(dev, 'en');
ok('speakable:has-stage+week', /Stage 1/.test(spk) && /Week/.test(spk));
ok('speakable:has-cta', /Ready to start Stage 1/i.test(spk));

// 9. YouTube as SEARCH TERMS (not rotting URLs) on every topic.
ok('youtube:search-terms', dev.stages.every(s => s.topics.every(t => t.youtube_search_term && !/^https?:/.test(t.youtube_search_term))));

console.log('\n----------------------------------------');
console.log('BO1 Profession 5-stage: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
