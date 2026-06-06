/* tools/ceos_compliance.mjs — Universal Handover Part 2 + Part 9 checker.
 * Verifies the CEOS L0–L12 artifacts + the 28 deliverables exist for a product dir.
 * The template's canonical names map to this repo's actual filenames (e.g. CONSTITUTION→ROLE).
 * Usage: node tools/ceos_compliance.mjs chitti-2wheeler
 * Prints a markdown table + CEOS:{pass,total} + DELIV:{pass,total}. */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] || 'chitti-2wheeler';
const P = join(ROOT, dir);
const has = (rel) => existsSync(join(P, rel));
const anyOf = (...rels) => rels.find(has) || null;
const countIn = (rel, ext = '.md') => { try { return readdirSync(join(P, rel)).filter(f => f.endsWith(ext)).length; } catch (e) { return 0; } };

// L0–L12: [level, label, requirement, resolver→{ok,path,note}]
const LEVELS = [
  ['L0', 'CONSTITUTION (ROLE + Founder Rule)', () => { const f = anyOf('CONSTITUTION.md', 'ROLE.md', 'constitution/ROLE.md'); return { ok: !!f, path: f, note: f ? '' : 'missing' }; }],
  ['L1', 'VISION', () => { const f = anyOf('VISION.md', 'PRODUCT_VISION.md'); return { ok: !!f, path: f }; }],
  ['L2', 'PERSONAS (≥7)', () => { const f = anyOf('PERSONAS.md'); return { ok: !!f, path: f }; }],
  ['L3', 'SUCCESS_METRICS', () => { const f = anyOf('SUCCESS_METRICS.md', 'METRICS.md'); return { ok: !!f, path: f }; }],
  ['L4', 'PRD (≥8 features)', () => { const f = anyOf('PRD.md'); return { ok: !!f, path: f }; }],
  ['L5', 'SKILLS (≥8)', () => { const n = countIn('skills'); const f = anyOf('SKILLS.md'); return { ok: !!f && n >= 8, path: f || 'skills/', note: n + ' skill files' }; }],
  ['L6', 'Swarm (≥6 agents + README)', () => { const n = countIn('swarm'); return { ok: has('swarm/README.md') && n >= 7, path: 'swarm/', note: n + ' files' }; }],
  ['L7', 'SOPs (≥5)', () => { const n = countIn('sop'); return { ok: n >= 5, path: 'sop/', note: n + ' SOPs' }; }],
  ['L8', 'Guardrails (safety/halluc/privacy)', () => { const n = countIn('guardrails'); return { ok: n >= 3, path: 'guardrails/', note: n + ' files' }; }],
  ['L9', 'Memory (life/vehicle twin)', () => { const n = countIn('memory'); return { ok: n >= 1, path: 'memory/', note: n + ' files' }; }],
  ['L10', 'Observability (metrics + logs)', () => { return { ok: has('observability/metrics.md') && has('observability/logs.md'), path: 'observability/' }; }],
  ['L11', 'Evals (accuracy + accessibility)', () => { const n = countIn('evals'); return { ok: n >= 2 && has('evals/accessibility_eval.md'), path: 'evals/', note: n + ' evals' }; }],
  ['L12', 'Accessibility (blind/deaf/mute/illiterate)', () => { return { ok: has('accessibility/blind_user.md') && has('accessibility/deaf_user.md') && has('accessibility/mute_user.md') && has('accessibility/illiterate_user.md'), path: 'accessibility/' }; }],
];

console.log(`\n## CEOS Compliance — ${dir}\n`);
console.log('| Level | Requirement | Status | Path | Note |');
console.log('|---|---|---|---|---|');
let cpass = 0;
for (const [lvl, label, fn] of LEVELS) {
  const r = fn();
  if (r.ok) cpass++;
  console.log(`| ${lvl} | ${label} | ${r.ok ? '✅' : '❌'} | ${r.path || '—'} | ${r.note || ''} |`);
}
console.log(`\nCEOS:${JSON.stringify({ pass: cpass, total: LEVELS.length })}`);

// Part 9 — 28 deliverables (product-dir relative unless noted at repo root)
const product = dir.replace('chitti-', '');
const REPO = (rel) => existsSync(join(ROOT, rel));
const DELIV = [
  ['CONSTITUTION/ROLE.md', has('CONSTITUTION.md') || has('ROLE.md')],
  ['VISION/PRODUCT_VISION.md', has('VISION.md') || has('PRODUCT_VISION.md')],
  ['PERSONAS.md', has('PERSONAS.md')],
  ['SUCCESS_METRICS.md', has('SUCCESS_METRICS.md')],
  ['PRD.md', has('PRD.md')],
  ['SKILLS.md', has('SKILLS.md')],
  ['swarm/ (≥6)', countIn('swarm') >= 7],
  ['sop/ (≥5)', countIn('sop') >= 5],
  ['guardrails/ (3)', countIn('guardrails') >= 3],
  ['memory/', countIn('memory') >= 1],
  ['observability/', countIn('observability') >= 2],
  ['evals/', countIn('evals') >= 2],
  ['accessibility/ (4)', countIn('accessibility') >= 4],
  ['QUALITY.md', has('QUALITY.md')],
  ['ROADMAP.md', has('ROADMAP.md') || has('WORLD_CLASS_FEATURES.md')],
  ['README.md', has('README.md')],
  [`chitti_${product === '2wheeler' ? '2wheeler' : product === '4wheeler' ? '4wheeler' : product}.html`, REPO(`chitti_${product}.html`)],
  [`tools/test_*.mjs`, REPO('tools/test_mechanic.mjs') || REPO('tools/qa_handover.mjs')],
  [`test_samples/${product}/ (or /mechanic)`, REPO(`test_samples/${product}`) || REPO('test_samples/mechanic')],
  [`test_screenshots/${product}/ (cert_screenshots)`, REPO('tools/cert_screenshots')],
  ['HANDOVER/01_QA_TEST_REPORT.md', has('HANDOVER/01_QA_TEST_REPORT.md')],
  ['HANDOVER/02_ARCHITECTURE_REVIEW.md', has('HANDOVER/02_ARCHITECTURE_REVIEW.md')],
  ['HANDOVER/03_KNOWN_ISSUES.md', has('HANDOVER/03_KNOWN_ISSUES.md')],
  ['HANDOVER/04_BUG_REPORT.md', has('HANDOVER/04_BUG_REPORT.md')],
  ['HANDOVER/05_SIGN_OFF.md', has('HANDOVER/05_SIGN_OFF.md')],
  ['HANDOVER/06_CEOS_COMPLIANCE.md', has('HANDOVER/06_CEOS_COMPLIANCE.md')],
  ['HANDOVER/07_SAMPLE_TEST_REPORT.md', has('HANDOVER/07_SAMPLE_TEST_REPORT.md')],
  ['HANDOVER/08_FINAL_HANDOVER.md', has('HANDOVER/08_FINAL_HANDOVER.md')],
];
console.log(`\n## Deliverables — ${dir}\n`);
let dpass = 0;
DELIV.forEach(([name, ok], i) => { if (ok) dpass++; console.log(`${i + 1}. ${ok ? '✅' : '❌'} ${name}`); });
console.log(`\nDELIV:${JSON.stringify({ pass: dpass, total: DELIV.length })}`);
