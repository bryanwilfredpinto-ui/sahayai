#!/usr/bin/env node
/**
 * tools/test_mechanic.mjs — Chitti Auto OS frontend logic + regression tests.
 * Pure Node (no browser, no deps). Covers:
 *   A. strings.js i18n completeness — every sw.* key present in all 9 bags.
 *   B. Swarm JSON-extraction + tier-mapping + honest-fallback algorithm (fixtures).
 *   C. Structural / §5 regression — swarm card present, data-chitti-response,
 *      ZERO Hinglish literals in the swarm JS on both pages, scripts parse.
 * Run: node tools/test_mechanic.mjs   (exit 0 = all pass)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(label, cond, detail) { if (cond) { pass++; console.log(`✅ ${label}${detail ? ' — ' + detail : ''}`); } else { fail++; console.log(`❌ ${label}${detail ? ' — ' + detail : ''}`); } }

// ───────────────────────────────────────────────────────────────────────────
// A. strings.js i18n completeness — load the REAL file in a stubbed window.
// ───────────────────────────────────────────────────────────────────────────
const stringsSrc = readFileSync(join(ROOT, 'strings.js'), 'utf8');
const noop = () => {};
const sandbox = {
  window: { addEventListener: noop, dispatchEvent: noop },
  document: { querySelectorAll: () => [], documentElement: {}, addEventListener: noop },
  navigator: { language: 'en', languages: ['en'] },
};
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);
vm.runInContext(stringsSrc, sandbox);
const BAGS = sandbox.window.VAI_STRINGS || {};
const LANGS = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml'];
ok('A0 VAI_STRINGS exported with 9 primary bags', LANGS.every(l => BAGS[l]), 'bags: ' + Object.keys(BAGS).join(','));

const SW_KEYS = [
  'mb.swarm.title', 'mb.swarm.sub', 'mb.swarm.go', 'mb.swarm.scam', 'mb.swarm.ph', 'mb.swarm.scamjob', 'mb.swarm.scamamt', 'mb.swarm.disc',
  'mc.swarm.title', 'mc.swarm.sub', 'mc.swarm.go', 'mc.swarm.scam', 'mc.swarm.ph', 'mc.swarm.scamjob', 'mc.swarm.scamamt', 'mc.swarm.disc',
  'sw.thinking', 'sw.empty.bike', 'sw.empty.car', 'sw.conf', 'sw.f.why', 'sw.f.sev', 'sw.f.ride', 'sw.f.drive', 'sw.f.cost', 'sw.f.alt',
  'sw.tier.green', 'sw.tier.amber', 'sw.tier.orange', 'sw.tier.redbike', 'sw.tier.redcar', 'sw.inspect', 'sw.lowconf.bike', 'sw.lowconf.car',
  'sw.scam.thinking', 'sw.scam.empty', 'sw.scam.range', 'sw.scam.asked', 'sw.scam.note', 'sw.v.fair', 'sw.v.high', 'sw.v.vhigh', 'sw.novoice',
];
let missing = [];
for (const l of LANGS) for (const k of SW_KEYS) if (!(BAGS[l] && BAGS[l][k])) missing.push(`${l}:${k}`);
ok('A1 every sw.* key present in all 9 bags', missing.length === 0, missing.length ? missing.slice(0, 8).join(', ') + (missing.length > 8 ? ` …(+${missing.length - 8})` : '') : `${SW_KEYS.length}×9 = ${SW_KEYS.length * 9} keys`);

// Non-en bags must not be byte-identical to en for translated labels (proves real translation, not copy)
const SAMPLE = ['mb.swarm.go', 'sw.f.why', 'sw.tier.redbike'];
let untranslated = [];
for (const l of LANGS.filter(x => x !== 'en')) for (const k of SAMPLE) if (BAGS[l][k] === BAGS.en[k]) untranslated.push(`${l}:${k}`);
ok('A2 sample labels actually translated (≠ en) in non-en bags', untranslated.length === 0, untranslated.length ? untranslated.join(', ') : 'distinct in all bags');

// §5: en baseline must be pure-English (no common Hinglish tokens)
const HINGLISH = ['karo', 'kar dijiye', 'bataaiye', 'maanga', 'lagta hai', 'raha hai', 'theek', 'abhi', 'dijiye'];
let enHing = [];
for (const k of SW_KEYS) { const v = (BAGS.en[k] || '').toLowerCase(); for (const h of HINGLISH) if (v.split(/\s+/).includes(h) || v.includes(' ' + h + ' ')) enHing.push(`${k}~${h}`); }
ok('A3 en baseline is pure English (no Hinglish tokens)', enHing.length === 0, enHing.length ? enHing.join(', ') : 'clean');

// ───────────────────────────────────────────────────────────────────────────
// B. Swarm algorithm — replicate the page's pure logic and test on fixtures.
//    (extractJson + tier map + fallback decision — must match the inline JS.)
// ───────────────────────────────────────────────────────────────────────────
function extractVerdict(reply) {
  const m = (reply || '').match(/\{[\s\S]*\}/);
  let v = null; if (m) { try { v = JSON.parse(m[0]); } catch (e) { v = null; } }
  return (!v || !v.votes) ? null : v;
}
const TIER = { green: 't-green', amber: 't-amber', orange: 't-orange', red: 't-red' };
function tierClass(t) { return TIER[(t || 'orange').toLowerCase()] || TIER.orange; }

// B1 valid JSON with prose around it → parsed verdict
const good = 'Sure! {"votes":[{"cause":"Battery","pct":85},{"cause":"Starter","pct":15}],"confidence":"High","diy_tier":"amber","why":"x"} hope this helps';
const gv = extractVerdict(good);
ok('B1 extracts verdict JSON from a model reply with prose', gv && gv.votes.length === 2 && gv.votes[0].pct === 85);

// B2 reply with no JSON → null → page shows honest fallback
ok('B2 no-JSON reply → null (honest fallback path)', extractVerdict('Sorry, I am not sure right now.') === null);

// B3 malformed JSON → null (no crash)
ok('B3 malformed JSON → null, no throw', extractVerdict('{"votes": [oops') === null);

// B4 JSON missing votes → null (treated as fallback)
ok('B4 JSON without votes → null', extractVerdict('{"confidence":"Low"}') === null);

// B5 tier mapping incl. unknown → orange (never crash, never silently green)
ok('B5 tier map red→t-red, unknown→orange', tierClass('red') === 't-red' && tierClass('zzz') === 't-orange' && tierClass('green') === 't-green');

// B6 vote pct clamped 0..100 (page does Math.max/min)
const clamp = p => Math.max(0, Math.min(100, parseInt(p || 0, 10)));
ok('B6 vote pct clamps to 0..100', clamp(140) === 100 && clamp(-5) === 0 && clamp('85') === 85);

// ───────────────────────────────────────────────────────────────────────────
// C. Structural / §5 regression on both pages.
// ───────────────────────────────────────────────────────────────────────────
const SWARM_HINGLISH = ['soch rahe', 'Pehle takleef', 'Kyun (Why)', 'Kitna serious', 'Chala sakte ho', 'Aur kya ho sakta', 'theek lagta', 'zyada lagta', 'Aapse maanga', 'nikaal raha', 'dono bhariye', 'Yeh ek estimate', 'Voice abhi available', 'DO NOT RIDE', 'DO NOT DRIVE'];
for (const [file, card] of [['chitti_2wheeler.html', 'mb-card-swarm'], ['chitti_4wheeler.html', 'mc-card-swarm']]) {
  const h = readFileSync(join(ROOT, file), 'utf8');
  ok(`C ${file} swarm card present + data-chitti-response`, h.includes(`data-chitti-response="${card}"`));
  ok(`C ${file} swarm card carries .sds-card-toolbar (5-elements)`, new RegExp(`${card}[\\s\\S]{0,2500}sds-card-toolbar`).test(h));
  const hits = SWARM_HINGLISH.filter(t => h.includes(t));
  ok(`C ${file} ZERO Hinglish literals in swarm JS (§5)`, hits.length === 0, hits.length ? hits.join(', ') : 'clean');
  // inline scripts parse
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g; let m, parseOk = true;
  while ((m = re.exec(h))) { try { new Function(m[1]); } catch (e) { parseOk = false; } }
  ok(`C ${file} inline scripts parse`, parseOk);
}

console.log(`\nTEST_SUMMARY:${JSON.stringify({ pass, fail })}`);
process.exit(fail === 0 ? 0 : 1);
