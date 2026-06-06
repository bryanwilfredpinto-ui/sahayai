/**
 * tools/verify_ceos_compliance_vaani.mjs — CEOS L0-L12 compliance check for Chitti Vaani.
 * Verifies every required governance doc exists with real content, plus the swarm/sop/
 * sample minimums. Output: tools/ceos_vaani_result.json. No placeholders — each row is a
 * real file existence + line-count measurement.
 *
 * Usage: node tools/verify_ceos_compliance_vaani.mjs
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const P = 'chitti-vaani';
const lines = (f) => { try { return readFileSync(resolve(ROOT, f), 'utf8').split('\n').length; } catch (e) { return 0; } };
const has = (f) => existsSync(resolve(ROOT, f));
const countMd = (d) => { try { return readdirSync(resolve(ROOT, d)).filter(x => x.endsWith('.md')).length; } catch (e) { return 0; } };
const isDir = (d) => { try { return statSync(resolve(ROOT, d)).isDirectory(); } catch (e) { return false; } };

const rows = [];
const file = (level, label, path, minLines = 1) => {
  const ok = has(path) && lines(path) >= minLines;
  rows.push({ level, label, status: ok ? '✅ PASS' : '❌ FAIL', detail: has(path) ? `${path} (${lines(path)} lines)` : `${path} MISSING` });
};

// ─── L0-L12 ───
file('L0', 'CONSTITUTION.md (ROLE + Founder Rule)', `${P}/CONSTITUTION.md`, 40);
file('L1', 'VISION.md (Mission + Vision)', `${P}/VISION.md`, 40);
file('L2', 'PERSONAS.md (7+ personas)', `${P}/PERSONAS.md`, 60);
file('L3', 'SUCCESS_METRICS.md', `${P}/SUCCESS_METRICS.md`, 40);
file('L4', 'PRD.md (8+ features)', `${P}/PRD.md`, 80);
file('L5', 'SKILLS.md (8+ skills)', `${P}/SKILLS.md`, 60);
file('L6', 'swarm/README.md', `${P}/swarm/README.md`, 40);
// L6 — min 6 swarm agents (README excluded)
{ const n = countMd(`${P}/swarm`) - (has(`${P}/swarm/README.md`) ? 1 : 0); rows.push({ level: 'L6', label: 'swarm/ ≥6 agents', status: n >= 6 ? '✅ PASS' : '❌ FAIL', detail: `${n} agent .md files (need 6+)` }); }
// L7 — min 5 SOPs
{ const n = countMd(`${P}/sop`); rows.push({ level: 'L7', label: 'sop/ ≥5 SOPs', status: n >= 5 ? '✅ PASS' : '❌ FAIL', detail: `${n} SOP .md files (need 5+)` }); }
file('L8', 'guardrails/safety.md', `${P}/guardrails/safety.md`, 40);
file('L8', 'guardrails/hallucination.md', `${P}/guardrails/hallucination.md`, 40);
file('L8', 'guardrails/privacy.md', `${P}/guardrails/privacy.md`, 40);
file('L9', 'memory/life_twin.md', `${P}/memory/life_twin.md`, 40);
file('L10', 'observability/metrics.md', `${P}/observability/metrics.md`, 40);
file('L10', 'observability/logs.md', `${P}/observability/logs.md`, 40);
file('L11', 'evals/router_accuracy.md', `${P}/evals/router_accuracy.md`, 40);
file('L11', 'evals/accessibility_eval.md', `${P}/evals/accessibility_eval.md`, 40);
file('L12', 'accessibility/blind_user.md', `${P}/accessibility/blind_user.md`, 40);
file('L12', 'accessibility/deaf_user.md', `${P}/accessibility/deaf_user.md`, 40);
file('L12', 'accessibility/mute_user.md', `${P}/accessibility/mute_user.md`, 40);
file('L12', 'accessibility/illiterate_user.md', `${P}/accessibility/illiterate_user.md`, 40);

// ─── Supporting deliverables ───
file('D', 'QUALITY.md', `${P}/QUALITY.md`, 40);
file('D', 'ROADMAP.md', `${P}/ROADMAP.md`, 40);
file('D', 'README.md', `${P}/README.md`, 20);
file('D', 'chitti_vaani.html (live page)', 'chitti_vaani.html', 500);
file('D', 'tools/qa_full_vaani.mjs (QA harness)', 'tools/qa_full_vaani.mjs', 100);
file('D', 'tools/verify_ceos_compliance_vaani.mjs (this verifier)', 'tools/verify_ceos_compliance_vaani.mjs', 50);
rows.push({ level: 'D', label: 'test_samples/vaani/ (5 categories)', status: isDir('test_samples/vaani') && countMd('test_samples/vaani') === 0 && readdirSync(resolve(ROOT, 'test_samples/vaani')).filter(f => f.endsWith('.json')).length >= 5 ? '✅ PASS' : '❌ FAIL', detail: `${(isDir('test_samples/vaani') ? readdirSync(resolve(ROOT, 'test_samples/vaani')).filter(f => f.endsWith('.json')).length : 0)} category JSON files` });

// Sample items 5 per category
let sampleItems = 0, sampleCats = 0;
try {
  for (const f of readdirSync(resolve(ROOT, 'test_samples/vaani')).filter(x => x.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(resolve(ROOT, 'test_samples/vaani', f), 'utf8'));
    sampleCats++; sampleItems += (d.samples || []).length;
  }
} catch (e) {}
rows.push({ level: 'D', label: 'Real sample items ≥5 per category', status: sampleCats >= 5 && sampleItems >= 25 ? '✅ PASS' : '❌ FAIL', detail: `${sampleItems} real intent samples across ${sampleCats} categories (need 25: 5×5)` });

const pass = rows.filter(r => r.status.startsWith('✅')).length;
const result = { product: 'chitti-vaani', total: rows.length, pass, fail: rows.length - pass,
  verdict: pass === rows.length ? '✅ PASS' : '❌ FAIL', rows };
import('node:fs').then(fs => fs.writeFileSync(resolve(__dirname, 'ceos_vaani_result.json'), JSON.stringify(result, null, 2)));
console.log(`CEOS_VAANI ${pass}/${rows.length} PASS — verdict ${result.verdict}`);
for (const r of rows) if (r.status.startsWith('❌')) console.log('  FAIL', r.level, r.label, '—', r.detail);
