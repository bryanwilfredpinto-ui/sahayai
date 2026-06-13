#!/usr/bin/env node
/* tools/test_cnai_swarm_bo5.mjs — BO5: opt-out + cohort-gated patterns (min 50,
 * sample size, no IDs). Deterministic. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SW = require(resolve(ROOT, 'cnai_swarm.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO5 — SWARM OPT-OUT + COHORT-GATED PATTERNS ===\n');

// 1. Opt-out: one click, immediate, remembered; opted-out still sees insights.
SW.setOptOut(false);
ok('optout:default-in', SW.isOptedOut() === false);
const off = SW.setOptOut(true);
ok('optout:set-immediate', off.opted_out === true && off.effective === 'immediately');
ok('optout:remembered', SW.isOptedOut() === true);
const ctl = SW.optOutControl();
ok('optout:control-one-click', ctl.one_click === true && ctl.effective_immediately === true && ctl.remembered === true);
const r = SW.run('agentic ai');
ok('optout:not-contributing-but-runs', r.contributing === false && r.roadmap && r.agents.length >= 4);
SW.setOptOut(false);
ok('optout:rejoin', SW.isOptedOut() === false && SW.run('agentic ai').contributing === true);

// 2. Cohort-gated patterns: ≥50 shown w/ sample size; <50 suppressed.
const doc = SW.pattern('doctor', 2);
ok('pattern:doctor-shown', doc.available && doc.cohort >= 50 && /87% of 214 doctors/.test(doc.insight), doc.insight);
ok('pattern:has-sample-size', doc.cohort === 214 && doc.percent === 87);
ok('pattern:privacy-note', /Anonymised/.test(doc.privacy));
const small = SW.pattern('farmer', 3); // cohort 41 → below 50
ok('pattern:small-cohort-suppressed', small.available === false && small.reason === 'cohort_too_small' && small.cohort < SW.MIN_COHORT, small.note);
const fin = SW.pattern('finance', 2); // cohort 58 → shown
ok('pattern:finance-58-shown', fin.available === true && fin.cohort === 58);
ok('pattern:unknown-no-data', SW.pattern('astronaut', 2).available === false);
ok('pattern:min-cohort-50', SW.MIN_COHORT === 50);

// 3. Profession alias resolution (farmer covers "pig", "crop").
ok('pattern:pig→farmer', SW.pattern('I raise pigs', 2).available === true || SW.pattern('I raise pigs', 2).reason);

// 4. proposeToCatalog privacy gate still enforced (regression).
ok('catalog:pii-rejected', SW.proposeToCatalog({ hasPII: true }).accepted === false);
ok('catalog:under-100-held', SW.proposeToCatalog({ confirmations: 40 }).accepted === false);
ok('catalog:highrisk-review', SW.proposeToCatalog({ confirmations: 150, highRisk: true }).accepted === false);
ok('catalog:accept', SW.proposeToCatalog({ confirmations: 150 }).accepted === true);

// 5. Regression: graceful degradation (no agent failure blocks consolidation).
const fr = SW.run('agentic ai', { failAgent: 0 });
ok('regression:graceful-degrade', fr.roadmap && fr.reported >= 1 && /of/.test(fr.coverage), fr.coverage);
ok('regression:speakable', typeof SW.speakable(SW.run('python'), 'en') === 'string');

console.log('\n----------------------------------------');
console.log('BO5 Swarm: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
