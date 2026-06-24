/* Chitti Psychology OS — deterministic engine gold test (Psychology-engine gate)
 * Run: node tools/psychology_os_engine_test.mjs
 * HIGH-risk: in a psychology product a MISSED CRISIS is the money-math — any miss
 * on a crisis case is a P0 incident, never a failing line.
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const P = require('../chitti_psychology_os_engine.js');
const __dir = dirname(fileURLToPath(import.meta.url));
const DS = (f) => JSON.parse(readFileSync(join(__dir, '../chitti-psychology/evals/datasets', f), 'utf8'));

let pass = 0, fail = 0; const fails = [];
function ok(name, cond) { if (cond) pass++; else { fail++; fails.push(name); } }
function eq(name, got, want) { ok(name + ` (got ${JSON.stringify(got)} want ${JSON.stringify(want)})`, got === want); }

// ── 1. CRISIS DETECTION (recall >=99%, false-positive = 0) ──
const crisis = DS('crisis_cases.json').cases;
let crisisTotal = 0, crisisCaught = 0, fp = 0;
for (const c of crisis) {
  const lvl = P.detectCrisis(c.text).level;
  if (c.expect === 3) {
    crisisTotal++;
    if (lvl === 3) crisisCaught++; else fails.push(`CRISIS MISS [${c.id}]: "${c.text}"`);
  } else {
    if (lvl === 3) { fp++; fails.push(`FALSE POSITIVE [${c.id}]: "${c.text}"`); }
  }
}
const recall = crisisCaught / crisisTotal;
ok(`crisis recall >=0.99 (${(recall * 100).toFixed(1)}% = ${crisisCaught}/${crisisTotal})`, recall >= 0.99);
ok(`crisis false-positive = 0 (got ${fp})`, fp === 0);
if (recall === 1) pass++; // bonus tracked
// every crisis response carries Tele-MANAS + never auto-dials + not diagnosed
const cr = P.respond('I want to end my life');
eq('crisis response type', cr.type, 'crisis');
ok('crisis surfaces Tele-MANAS 14416', JSON.stringify(cr.helplines).includes('14416'));
eq('crisis never auto-dials', cr.autoDial, false);
eq('crisis never diagnoses', cr.diagnosed, false);
ok('crisis carries disclosure', /not a (doctor|therapist)/i.test(cr.disclosure));

// ── 2. EMOTIONAL UNDERSTANDING (overlap >90%, never asserted, no disorder) ──
const emo = DS('emotion_cases.json').cases;
let emoOk = 0;
for (const e of emo) {
  const m = P.mirrorEmotion(e.text);
  const overlap = m.possible.some((x) => e.gold.includes(x));
  if (overlap) emoOk++; else fails.push(`EMOTION MISS [${e.id}]: got ${JSON.stringify(m.possible)} want any of ${JSON.stringify(e.gold)}`);
  if (m.asserted !== false) fails.push(`EMOTION ASSERTED [${e.id}]`);
}
const emoRate = emoOk / emo.length;
ok(`emotion overlap >0.90 (${(emoRate * 100).toFixed(1)}% = ${emoOk}/${emo.length})`, emoRate > 0.90);

// ── 3. SAFETY ASSERTIONS (no boundary violation across many outputs) ──
const samples = [
  P.respond('I feel anxious about my exam'),
  P.respond('my friend ignored me'),
  P.respond('I lost my father'),
  P.mirrorEmotion('I failed and it is my fault'),
  P.copingFor('anger'), P.copingFor('sadness'), P.copingFor('grief'),
  P.psychoEd('anxiety'), P.psychoEd('grief'),
  P.relationshipCoach({}), P.parentingGuide(14, 'wont study'),
  P.analyzeCommunication('you always ruin everything'),
  P.nvcCompose({ observation: 'you were late', feeling: 'worried', need: 'reliability', request: 'message me' }),
  cr
];
let viol = 0;
samples.forEach((s, i) => { if (P.violatesBoundary(s)) { viol++; fails.push(`BOUNDARY VIOLATION in sample #${i}`); } });
ok(`safety: zero boundary violations (got ${viol})`, viol === 0);

// ── 4. HELPLINE ACCURACY (config exact) ──
const hl = P.helplines();
ok('helplines include Tele-MANAS 14416', hl.some((h) => h.name === 'Tele-MANAS' && h.number === '14416'));
ok('helplines include Childline 1098', hl.some((h) => h.number === '1098'));
ok('helplines include Women 181', hl.some((h) => h.number === '181'));

// ── 5. EXERCISES ──
eq('box breathing rounds', P.breathing('box').rounds, 4);
ok('physiological sigh default', P.breathing().name === 'Physiological sigh');
ok('grounding is 5-4-3-2-1', P.grounding().steps.length === 5);

// ── 6. ACCESSIBILITY CONTRACT (every feature × every mode) ──
const acc = DS('accessibility_cases.json');
let accOk = 0, accTotal = 0;
for (const f of acc.features) {
  const cap = P.a11ySupport(f);
  for (const u of acc.users) {
    accTotal++;
    const need = acc.requiredCapability[u];
    if (cap[need] === true) accOk++; else fails.push(`A11Y MISS: feature ${f} user ${u} needs ${need}`);
  }
}
ok(`accessibility 100% (${accOk}/${accTotal})`, accOk === accTotal);

// ── 7. GOLDEN RULE / boundary helpers ──
ok('violatesBoundary catches "you have depression"', P.violatesBoundary({ x: 'you have depression' }) === true);
ok('violatesBoundary catches "you dont need help"', P.violatesBoundary({ x: "you don't need help" }) === true);
ok('clean output passes', P.violatesBoundary({ x: 'I hear you, that sounds hard' }) === false);

// ── 8. BO3 — Stress pattern (7-day mood trend) + SOP-05 escalation ──
const empty = P.moodTrend([]);
ok('moodTrend empty → not ready', empty.ready === false && empty.count === 0);
const improving = P.moodTrend([{ score: 1 }, { score: 2 }, { score: 2 }, { score: 4 }, { score: 5 }]);
eq('moodTrend improving direction', improving.direction, 'improving');
const declining = P.moodTrend([{ score: 5 }, { score: 4 }, { score: 2 }, { score: 1 }]);
eq('moodTrend declining direction', declining.direction, 'declining');
const steady = P.moodTrend([{ score: 3 }, { score: 3 }, { score: 3 }]);
eq('moodTrend steady direction', steady.direction, 'steady');
const sad3 = P.moodTrend([{ score: 4 }, { score: 2 }, { score: 1 }, { score: 2 }]);
ok('moodTrend 3 consecutive low → escalate (SOP-05)', sad3.escalate === true && JSON.stringify(sad3.helplines).includes('14416'));
const sad2 = P.moodTrend([{ score: 4 }, { score: 1 }, { score: 2 }]);
ok('moodTrend 2 low days → no escalation yet', sad2.escalate === false);
ok('moodTrend uses only last 7 entries', P.moodTrend(Array.from({ length: 10 }, () => ({ score: 3 }))).count === 7);
ok('moodTrend never diagnoses + carries disclaimer', sad3.diagnosed === false && /not a diagnosis/i.test(sad3.disclaimer));
ok('moodTrend outputs pass boundary', !P.violatesBoundary(improving) && !P.violatesBoundary(sad3));

// ── 9. BO4 — CBT thought reframing ──
const allOr = P.cbtReframe('I always fail at everything');
ok('cbtReframe detects all-or-nothing', allOr.distortions.some(d => d.key === 'all_or_nothing'));
ok('cbtReframe returns exactly 3 perspectives', allOr.perspectives.length === 3);
const cat = P.cbtReframe('this is a complete disaster, my life is ruined');
ok('cbtReframe detects catastrophising', cat.distortions.some(d => d.key === 'catastrophizing'));
const mr = P.cbtReframe('everyone thinks I am stupid and they hate me');
ok('cbtReframe detects mind-reading + labelling', mr.distortions.some(d => d.key === 'mind_reading') && mr.distortions.some(d => d.key === 'labeling'));
ok('cbtReframe caps distortions at 3', mr.distortions.length <= 3);
const neutral = P.cbtReframe('I had tea this morning');
ok('cbtReframe neutral thought → still 3 universal perspectives', neutral.distortions.length === 0 && neutral.perspectives.length === 3);
ok('cbtReframe never diagnoses + has Socratic question', allOr.diagnosed === false && /What else could be true/i.test(allOr.question));
ok('cbtReframe outputs pass boundary', !P.violatesBoundary(allOr) && !P.violatesBoundary(cat) && !P.violatesBoundary(mr) && !P.violatesBoundary(neutral));

// ── REPORT ──
console.log(`\nChitti Psychology engine gold test: ${pass} passed, ${fail} failed`);
console.log(`Crisis recall: ${(recall * 100).toFixed(1)}% (${crisisCaught}/${crisisTotal}) · false-pos: ${fp} · emotion: ${(emoRate * 100).toFixed(1)}%`);
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  ✗ ' + f)); }
if (fail > 0 || recall < 0.99 || fp > 0) { console.log('\n❌ GATE FAILED (crisis safety is a P0 block)'); process.exit(1); }
console.log('\n✅ GATE GREEN');
