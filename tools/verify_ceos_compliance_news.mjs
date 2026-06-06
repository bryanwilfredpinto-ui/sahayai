#!/usr/bin/env node
/**
 * tools/verify_ceos_compliance_news.mjs — Universal Handover CEOS gate for
 * Chitti News (CNOS). Walks the L0–L12 CEOS Compliance + the Deliverables
 * Checklist. Re-runnable on every commit. PASS = file exists + minimum line
 * count (and, for multi-file gates, minimum file count).
 *
 * Companion: tools/verify_ceos_compliance_news_ai.mjs (Chitti News AI variant).
 *
 * Usage: node tools/verify_ceos_compliance_news.mjs
 */
import { existsSync, statSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SLUG = 'chitti-news';

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail }); console.log((ok ? 'PASS' : 'FAIL').padEnd(5), label, '-', detail || ''); }
function exists(path, minLines = 0) {
  const full = resolve(ROOT, path);
  if (!existsSync(full)) return { ok: false, detail: 'MISSING' };
  if (statSync(full).isDirectory()) return { ok: true, detail: 'dir' };
  const lines = readFileSync(full, 'utf8').split('\n').length;
  return { ok: lines >= minLines, detail: lines + ' lines' + (minLines && lines < minLines ? ' (need ' + minLines + ')' : '') };
}
function countMd(dir) {
  const full = resolve(ROOT, dir);
  if (!existsSync(full)) return 0;
  try { return readdirSync(full).filter(f => f.endsWith('.md') && f !== 'README.md').length; }
  catch (e) { return 0; }
}

console.log('\n=== CEOS COMPLIANCE — Chitti News (CNOS) ===\n');

// PART 1 — CEOS Compliance L0-L12
const LEVELS = [
  ['L0_CONSTITUTION',         [`${SLUG}/CONSTITUTION.md`, `${SLUG}/ROLE.md`], 40],
  ['L1_VISION',               [`${SLUG}/VISION.md`, `${SLUG}/PRODUCT_VISION.md`], 40],
  ['L2_PERSONAS',             [`${SLUG}/PERSONAS.md`], 40],
  ['L3_SUCCESS_METRICS',      [`${SLUG}/SUCCESS_METRICS.md`], 40],
  ['L4_PRD',                  [`${SLUG}/PRD.md`], 60],
  ['L5_SKILLS',               [`${SLUG}/SKILLS.md`, `${SLUG}/SKILL.md`], 60],
  ['L6_SWARM_README',         [`${SLUG}/swarm/README.md`], 30],
  ['L7_GUARDRAILS_SAFETY',    [`${SLUG}/guardrails/safety.md`], 40],
  ['L7_GUARDRAILS_HALLUCIN.', [`${SLUG}/guardrails/hallucination.md`], 40],
  ['L7_GUARDRAILS_PRIVACY',   [`${SLUG}/guardrails/privacy.md`], 40],
  ['L8_MEMORY_LIFE_TWIN',     [`${SLUG}/memory/life_twin.md`], 40],
  ['L9_OBS_METRICS',          [`${SLUG}/observability/metrics.md`], 40],
  ['L9_OBS_LOGS',             [`${SLUG}/observability/logs.md`], 40],
  ['L10_EVAL_ROUTER',         [`${SLUG}/evals/router_accuracy.md`], 30],
  ['L10_EVAL_A11Y',           [`${SLUG}/evals/accessibility_eval.md`], 30],
  ['L11_A11Y_BLIND',          [`${SLUG}/accessibility/blind_user.md`], 60],
  ['L11_A11Y_DEAF',           [`${SLUG}/accessibility/deaf_user.md`], 60],
  ['L11_A11Y_MUTE',           [`${SLUG}/accessibility/mute_user.md`], 60],
  ['L11_A11Y_ILLITERATE',     [`${SLUG}/accessibility/illiterate_user.md`], 60],
];
for (const [label, paths, minLines] of LEVELS) {
  let best = { ok: false, detail: 'all missing' };
  for (const p of paths) {
    const r = exists(p, minLines);
    if (r.ok) { best = r; best.detail = `${p} (${r.detail})`; break; }
    if (!best.ok && r.detail !== 'MISSING') best = r;
  }
  check(label, best.ok, best.detail);
}

// Multi-file gates
check('L6_SWARM_AGENTS_6+', countMd(`${SLUG}/swarm/`) >= 6, countMd(`${SLUG}/swarm/`) + ' .md agent files (need 6+)');
check('L7_SOP_5+',          countMd(`${SLUG}/sop/`)   >= 5, countMd(`${SLUG}/sop/`) + ' .md SOP files (need 5+)');

console.log('\n=== DELIVERABLES CHECKLIST ===\n');
const DELIVERABLES = [
  ['D14_QUALITY',           `${SLUG}/QUALITY.md`,                40],
  ['D15_ROADMAP',           `${SLUG}/ROADMAP.md`,                40],
  ['D16_README',            `${SLUG}/README.md`,                 10],
  ['D17_LIVE_PAGE',         `chitti_news.html`,                  200],
  ['D18_TEST_TOOL',         `tools/test_news_samples.mjs`,       30],
  ['D19_VERIFY_TOOL',       `tools/verify_ceos_compliance_news.mjs`, 30],
  ['D20_SAMPLES_DIR',       `test_samples/news/`,                0],
  ['D21_SCREENSHOTS_DIR',   `test_screenshots/news/`,            0],
  ['D22_HANDOVER_QA',       `${SLUG}/HANDOVER/01_QA_TEST_REPORT.md`, 60],
  ['D23_HANDOVER_ARCH',     `${SLUG}/HANDOVER/02_ARCHITECTURE_REVIEW.md`, 60],
  ['D24_HANDOVER_ISSUES',   `${SLUG}/HANDOVER/03_KNOWN_ISSUES_LIST.md`, 30],
  ['D25_HANDOVER_BUGS',     `${SLUG}/HANDOVER/04_BUG_REPORT.md`, 30],
  ['D26_HANDOVER_SIGNOFF',  `${SLUG}/HANDOVER/05_SIGN_OFF.md`,   20],
  ['D27_HANDOVER_BUILDORDER', `${SLUG}/HANDOVER/06_BUILDORDER_HANDOVER.md`, 60],
  ['D28_HANDOVER_QUALITY_MATRIX', `${SLUG}/HANDOVER/07_QUALITY_MATRIX_REPORT.md`, 60],
  ['D29_HANDOVER_FINAL',    `${SLUG}/HANDOVER/08_FINAL_HANDOVER.md`, 60],
];
for (const [label, path, minLines] of DELIVERABLES) {
  const r = exists(path, minLines);
  check(label, r.ok, r.detail);
}

// Sample count gate — 5 categories × 5 real items = 25
const samplesDir = resolve(ROOT, 'test_samples/news');
if (existsSync(samplesDir)) {
  let totalItems = 0;
  const streamFiles = readdirSync(samplesDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of streamFiles) {
    try { const d = JSON.parse(readFileSync(resolve(samplesDir, f), 'utf8')); if (Array.isArray(d)) totalItems += d.length; }
    catch (e) {}
  }
  check('D20_REAL_ITEMS_5_PER_CATEGORY', totalItems >= 25, totalItems + ' real items across ' + streamFiles.length + ' categories (need 25: 5×5)');
}

console.log('\n');
const pass = R.filter(r => r.ok).length;
const fail = R.length - pass;
console.log(`CEOS COMPLIANCE: ${pass} / ${R.length} PASS · ${fail} FAIL`);

writeFileSync(resolve(__dirname, 'verify_ceos_compliance_news_result.json'),
  JSON.stringify({ product: SLUG, when: '2026-06-06', pass, fail, total: R.length, rows: R }, null, 2));
console.log('Report: tools/verify_ceos_compliance_news_result.json');
process.exit(fail ? 1 : 0);
