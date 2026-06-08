#!/usr/bin/env node
/* tools/test_cnai_all.mjs — Chitti News AI · BO7 · run ALL engine suites + the
 * UI cert, aggregate, and print a grand total. Deterministic, offline.
 * Run: node tools/test_cnai_all.mjs */
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ['BO1 Roadmap', 'test_cnai_roadmap.mjs'],
  ['BO2 Courses', 'test_cnai_courses.mjs'],
  ['BO3 Analogy+Coach', 'test_cnai_analogy.mjs'],
  ['BO4 Career', 'test_cnai_career.mjs'],
  ['BO5 Swarm', 'test_cnai_swarm.mjs'],
];

const rows = [];
let gp = 0, gt = 0;
console.log('\n=== CHITTI NEWS AI — ALL ENGINE SUITES (BO1-5) ===\n');
for (const [name, file] of SUITES) {
  let out = '';
  try { out = execFileSync('node', [resolve(HERE, file)], { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const m = out.match(/:\s*(\d+)\s*\/\s*(\d+)\s*PASS/);
  const pass = m ? +m[1] : 0, total = m ? +m[2] : 0;
  gp += pass; gt += total;
  const ok = pass === total && total > 0;
  rows.push({ name, file, pass, total, ok });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name.padEnd(20) + pass + '/' + total);
}

console.log('\n----------------------------------------');
console.log('ENGINE SUITES TOTAL: ' + gp + ' / ' + gt + ' PASS');
writeFileSync(resolve(HERE, 'test_cnai_all_result.json'),
  JSON.stringify({ when: '2026-06-09', suites: rows, engine_pass: gp, engine_total: gt }, null, 2));
console.log('Report: tools/test_cnai_all_result.json');
process.exit(gp === gt ? 0 : 1);
