#!/usr/bin/env node
/* tools/test_cnai_career_bo4.mjs — BO4 v2: TOOL_REPLACEMENT_MAP, mapUpgradePath,
 * detectPsychology (Skill11/SOP9), honesty (SOP12). Deterministic. */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CC = require(resolve(ROOT, 'cnai_career_coach.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } };

console.log('\n=== BO4 — UPGRADE PATH + TOOL MAP + PSYCHOLOGY ===\n');

// 1. mapUpgradePath: STOP X -> START Y(free) for Excel/Word/PPT/Email.
const prof = CC.parseOneLiner('I am a Talent Acquisition professional with 15 years');
const up = CC.mapUpgradePath(prof, ['Excel', 'Word', 'PPT', 'Email', 'WhatsApp', 'Google Search']);
ok('upgrade:has-replacements', up.tool_replacements.length === 6);
ok('upgrade:excel→free', up.tool_replacements[0].to[0].free === true && /STOP.*Excel.*START/.test(up.tool_replacements[0].message), up.tool_replacements[0].to[0].name);
ok('upgrade:ppt→gamma/canva', /gamma|canva/i.test(up.tool_replacements[2].to.map(t => t.name).join(' ')));
ok('upgrade:email→gmail/outlook', /gemini|copilot/i.test(up.tool_replacements[3].to.map(t => t.name).join(' ')));
ok('upgrade:mentor-voice', /15 years/.test(up.mentor_voice) && /unfair advantage/i.test(up.mentor_voice));
ok('upgrade:30-day-plan', up.first_30_days_plan.length === 4 && up.first_30_days_plan[0].week === 1);
ok('upgrade:certs-free-first', up.profession_certs.length >= 5 && up.profession_certs.every(c => c.free));
ok('upgrade:honesty-no-guarantee', !/guarantee|will get you a job|100% placement/i.test(JSON.stringify(up)));

// 2. Unknown legacy tool → still a free-first suggestion (no hardcoded ceiling).
const up2 = CC.mapUpgradePath(prof, ['MyNicheSoftware']);
ok('upgrade:unknown-tool-safe', up2.tool_replacements[0].to[0].free === true);

// 3. Profession certs adapt to domain (free-first), seeds not ceiling.
ok('certs:healthcare', CC.certsForDomain('Healthcare').some(c => /health/i.test(c.name)) && CC.certsForDomain('Healthcare').every(c => c.free));
ok('certs:agri', CC.certsForDomain('Agriculture').some(c => /agri/i.test(c.name)));
ok('certs:general-fallback', CC.certsForDomain('Puppetry').length >= 5);

// 4. detectPsychology — overwhelm / imposter / cert-chasing (Skill 11 / SOP 9).
const ov = CC.detectPsychology('There is too much to learn, I don\'t know where to start');
ok('psy:overwhelm', ov.state === 'overwhelm' && ov.options.length <= 3 && /one/i.test(ov.response));
const im = CC.detectPsychology('I am too old to learn AI, everyone knows more than me');
ok('psy:imposter', im.state === 'imposter' && /unfair advantage/i.test(im.response) && !/you are great/i.test(im.response));
const cc = CC.detectPsychology('which certificate will get me a job?');
ok('psy:cert-chasing', cc.state === 'cert_chasing' && /portfolio/i.test(cc.response));
ok('psy:none', CC.detectPsychology('how does RAG work?').detected === false);

// 5. SOP 12 honesty — buildReport never uses forbidden phrases.
const rep = CC.buildReport(prof);
ok('honesty:report-clean', !/guaranteed|100% placement|you will earn/i.test(JSON.stringify(rep)));

// 6. Regression: original API unchanged.
ok('regression:parse+map', CC.mapProfession(prof).tools.length > 0 && rep.free_first === true);
ok('regression:no-hardcoded-profession', CC.mapUpgradePath(CC.parseOneLiner('I raise pigs'), ['Excel']).profession_certs.length >= 5);

console.log('\n----------------------------------------');
console.log('BO4 Career v2: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
