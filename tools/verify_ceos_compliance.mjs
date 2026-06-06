/* verify_ceos_compliance.mjs — checks Chitti Fashion against the Universal Handover
   CEOS levels L0–L13: required files exist + carry required section keywords. No hardcoded
   pass; it reads the real files. Run: node tools/verify_ceos_compliance.mjs */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'chitti-fashion');
const has = (p) => existsSync(resolve(ROOT, p));
const read = (p) => { try { return readFileSync(resolve(ROOT, p), 'utf8'); } catch { return ''; } };
const countDir = (p, ext = '.md') => { try { return readdirSync(resolve(ROOT, p)).filter(f => f.endsWith(ext)).length; } catch { return 0; } };
const kw = (p, words) => { const t = read(p).toLowerCase(); return words.every(w => t.includes(w.toLowerCase())); };

const checks = [
  ['L0 CONSTITUTION', () => has('CONSTITUTION.md') && kw('CONSTITUTION.md', ['founder rule']), 'Role + Founder Rule + Never/Always'],
  ['L1 VISION', () => has('VISION.md') && read('VISION.md').length > 200, 'Mission + Vision'],
  ['L2 PERSONAS (>=7)', () => { const t = read('PERSONAS.md').toLowerCase(); return ['blind', 'deaf', 'mute', 'illiterate'].every(u => t.includes(u)) && (t.match(/persona|p\d/gi) || []).length >= 7; }, '4 users + domain personas'],
  ['L3 SUCCESS_METRICS', () => has('SUCCESS_METRICS.md') && kw('SUCCESS_METRICS.md', ['accuracy']), 'Business/AI/Accessibility targets'],
  ['L4 PRD (>=8 features)', () => { const t = read('PRD.md'); return has('PRD.md') && (t.match(/\bF\d/g) || []).length >= 8; }, 'Features F0-F12'],
  ['L5 SKILLS (>=8)', () => { const t = read('SKILLS.md'); return has('SKILLS.md') && (t.match(/\| 0?\d{1,2} \|/g) || t.match(/skill/gi) || []).length >= 8; }, '8+ skills'],
  ['L6 swarm (>=6 + README)', () => countDir('swarm') >= 7 && has('swarm/README.md'), '6+ agents + README'],
  ['L7 sop (>=5)', () => countDir('sop') >= 5, '5+ SOPs'],
  ['L8 guardrails (safety/halluc/privacy)', () => ['safety', 'hallucination', 'privacy'].every(f => has('guardrails/' + f + '.md')), 'safety.md hallucination.md privacy.md'],
  ['L9 memory', () => countDir('memory') >= 1 && has('FASHION_TWIN.md'), 'memory/ + life-twin (FASHION_TWIN.md)'],
  ['L10 observability (metrics+logs)', () => has('observability/metrics.md') && has('observability/logs.md'), 'metrics.md + logs.md'],
  ['L11 evals (accessibility + accuracy)', () => has('evals/accessibility_eval.md') && (has('evals/fashion_accuracy.md') || has('evals/router_accuracy.md')), 'accessibility_eval + accuracy eval'],
  ['L12 accessibility (4 users)', () => ['blind', 'deaf', 'mute', 'illiterate'].every(u => has('accessibility/' + u + '_user.md')), 'blind/deaf/mute/illiterate'],
  ['L13 product-specific', () => has('ADAPTIVE_CLOTHING.md') && has('CULTURAL_INTELLIGENCE.md') && has('SUSTAINABILITY.md'), 'CFOS extras'],
];

let pass = 0; const rows = [];
for (const [name, fn, need] of checks) { let ok = false; try { ok = !!fn(); } catch { ok = false; } if (ok) pass++; rows.push({ level: name, status: ok ? 'PASS' : 'FAIL', need }); }
const verdict = pass === checks.length ? 'PASS' : 'FAIL';
rows.forEach(r => console.log((r.status === 'PASS' ? '✅' : '❌') + ' ' + r.level + (r.status === 'FAIL' ? '  (needs: ' + r.need + ')' : '')));
console.log('\nCEOS_COMPLIANCE:' + JSON.stringify({ levels: checks.length, pass, fail: checks.length - pass, verdict, rows }));
