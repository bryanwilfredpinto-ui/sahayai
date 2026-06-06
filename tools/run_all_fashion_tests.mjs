/* run_all_fashion_tests.mjs — runs EVERY automated Chitti Fashion test in sequence and
   prints one PASS/FAIL summary table. The single "run all" entry point.
   Run: node tools/run_all_fashion_tests.mjs */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUITES = [
  ['Engine unit (66)', 'fashion_engine_test.mjs', /TEST_SUMMARY:({.*})/, d => d.fail === 0, d => d.pass + '/' + d.total],
  ['Gold accuracy (1000)', 'fashion_gold_eval.mjs', /GOLD_EVAL:({.*})/, d => d.gate === true, d => d.occ_exact + '% exact'],
  ['Sample files (25, looped)', 'test_all_fashion_samples.mjs', /SAMPLE_TEST:({.*})/, d => d.fail === 0, d => d.pass + '/' + d.total],
  ['All 26 languages', 'fashion_lang_all26.mjs', /LANG26_REPORT:({.*})/, d => d.fail === 0, d => d.pass + '/' + d.total],
  ['All 4 a11y profiles', 'fashion_a11y_profiles.mjs', /A11Y_PROFILES:({.*})/, d => d.fail === 0, d => d.pass + '/' + d.total],
  ['Accessibility (107 DOM)', 'fashion_eval_harness.mjs', /EVAL_SUMMARY:({.*})/, d => d.accessibility_pct === 100, d => d.accessibility_pass],
  ['Page QA (50)', 'fashion_qa.mjs', /QA_REPORT:({.*})/, d => d.fail === 0, d => d.pass + '/' + d.total],
  ['WCAG axe-core', 'fashion_axe_scan.mjs', /AXE_LINE:({.*})/, d => d.violations === 0, d => d.violations + ' violations'],
  ['Four-user journeys (5)', 'cert_fashion_journeys.mjs', /JOURNEY_SUMMARY:({.*})/, d => d.steps_pass === d.steps_total, d => d.steps_pass + '/' + d.steps_total],
  ['Visual cert (14)', 'cert_fashion.mjs', /CERT_SUMMARY:({.*})/, d => d.total_fail === 0, d => d.total_pass + '/' + d.total_checks],
];
const rows = [];
for (const [name, file, rx, ok, fmt] of SUITES) {
  let pass = false, detail = 'ERROR';
  try {
    const out = execSync('node ' + resolve(ROOT, 'tools', file), { encoding: 'utf8', timeout: 240000, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = out.match(rx); if (m) { const d = JSON.parse(m[1]); pass = !!ok(d); detail = fmt(d); }
  } catch (e) { detail = 'run error'; }
  rows.push({ name, pass, detail });
  console.log((pass ? '✅' : '❌') + ' ' + name.padEnd(28) + ' ' + detail);
}
const pass = rows.filter(r => r.pass).length;
console.log('\nRUN_ALL:' + JSON.stringify({ suites: rows.length, pass, fail: rows.length - pass, verdict: pass === rows.length ? 'PASS' : 'FAIL', rows }));
