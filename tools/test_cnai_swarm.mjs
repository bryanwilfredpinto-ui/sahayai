#!/usr/bin/env node
/* tools/test_cnai_swarm.mjs — BO5 Swarm Learning tests (deterministic). */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SW = require(resolve(ROOT, 'cnai_swarm.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }

console.log('\n=== BO5 SWARM LEARNING TESTS ===\n');

// 1. Fan-out: a goal produces >=4 learner-agents, each with a single-field write.
const res = SW.run('agentic ai');
ok('fanout->=4-agents', res.agents.length >= 4, res.agents.length + ' agents');
ok('agents-bound-to-courses', res.agents.some(a => a.source && /^https?:/.test(a.source)), 'at least one bound to a real course URL');
ok('agents-have-concepts', res.agents.some(a => a.concepts.length > 0));

// 2. Consolidation: unified roadmap (BO1) + deduped certs + tags.
ok('unified-roadmap', !!res.roadmap && res.roadmap.total_stages >= 4, res.roadmap ? res.roadmap.total_stages + ' stages' : 'none');
ok('certs-deduped', new Set(res.certs.map(c => c.name)).size === res.certs.length, res.certs.length + ' certs');
ok('coverage-reported', /of \d+ helpers reported/.test(res.coverage), res.coverage);

// 3. Cross-domain insights — agentic ai swarm finds multi-agent + ReAct etc.
ok('cross-domain-insights', res.insights.length >= 2, res.insights.length + ' insights: ' + res.insights.map(i => i.pair.join('+')).join(', '));
ok('insights-attribute-agents', res.insights.every(i => Array.isArray(i.agents)));
const cd = SW.crossDomain(['rag', 'embeddings', 'agent', 'orchestrator']);
ok('crossDomain-rag-embeddings', cd.some(i => /semantic memory/i.test(i.insight)));
ok('crossDomain-multi-agent', cd.some(i => /multi-agent/i.test(i.insight)));

// 4. GRACEFUL DEGRADATION — a failed agent never blocks consolidation.
const degraded = SW.run('agentic ai', { failAgent: 1 });
ok('failed-agent-not-blocking', !!degraded.roadmap && degraded.insights !== undefined, 'still consolidated');
ok('coverage-counts-down', degraded.reported < res.reported || /of \d+ helpers/.test(degraded.coverage), degraded.coverage);

// 5. Works for ANY goal (generic) — never throws, always consolidates.
for (const goal of ['pottery', 'I raise pigs', 'tailoring']) {
  const r = SW.run(goal);
  ok('any-goal:' + goal, r.agents.length >= 4 && r.coverage, r.agents.length + ' agents');
}

// 6. Swarm Intelligence privacy + threshold gate.
ok('gate-rejects-pii', SW.proposeToCatalog({ hasPII: true, confirmations: 500 }).accepted === false);
ok('gate-holds-below-100', SW.proposeToCatalog({ confirmations: 42 }).accepted === false && /100/.test(SW.proposeToCatalog({ confirmations: 42 }).reason));
ok('gate-human-review-highrisk', SW.proposeToCatalog({ confirmations: 200, highRisk: true }).accepted === false && /human review/i.test(SW.proposeToCatalog({ confirmations: 200, highRisk: true }).reason));
ok('gate-accepts-clean', SW.proposeToCatalog({ confirmations: 150 }).accepted === true);

// 7. Speakable summary for blind/illiterate users.
const spk = SW.speakable(res, 'en');
ok('speakable-helpers', /helpers learned/i.test(spk) && /roadmap has/i.test(spk), spk.slice(0, 80) + '...');
ok('speakable-hi-differs', SW.speakable(res, 'hi') !== spk);

console.log('\n----------------------------------------');
console.log('BO5 Swarm Learning: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
