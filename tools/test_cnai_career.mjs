#!/usr/bin/env node
/* tools/test_cnai_career.mjs — BO4 Career Coach tests (deterministic). */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CC = require(resolve(ROOT, 'cnai_career_coach.js'));

let pass = 0, fail = 0; const fails = [];
function ok(n, c, d) { if (c) { pass++; console.log('PASS ' + n + (d ? ' - ' + d : '')); } else { fail++; fails.push(n); console.log('FAIL ' + n + (d ? ' - ' + d : '')); } }

console.log('\n=== BO4 CAREER COACH TESTS ===\n');

// 1. One-liner parsing: role + years.
const p1 = CC.parseOneLiner('I am a Talent Acquisition specialist with 25 years');
ok('oneliner-role', /talent acquisition/i.test(p1.role), p1.role);
ok('oneliner-years', p1.years === 25, '' + p1.years);
ok('oneliner-seniority', p1.seniority === 'senior');

// 2. Resume parsing (regex, no LLM): role/years/skills/domain.
const resume = 'Title: Senior Software Developer\nExperience 2015 - 2026\nSkills: Python, JavaScript, Docker, SQL\nWorked at a fintech company.';
const p2 = CC.parseResume(resume);
ok('resume-role', /software developer/i.test(p2.role), p2.role);
ok('resume-years', p2.years >= 10, '' + p2.years);
ok('resume-skills', p2.skills.length >= 3, p2.skills.join('/'));
ok('resume-domain', p2.domain === 'Technology', p2.domain);

// 3. Dynamic mapping — works for ANY profession (NOT hardcoded).
for (const role of ['I am a pig farmer', 'I am a puppeteer', 'I am an oncologist with 12 years', 'I am a tailor', 'I am a school teacher with 8 years']) {
  const prof = CC.parseOneLiner(role);
  const rep = CC.buildReport(prof);
  ok('any-profession:' + prof.role, rep.sections.ai_tools.length >= 2 && rep.sections.certifications.length >= 1, rep.sections.ai_tools.length + ' tools / ' + rep.sections.certifications.length + ' certs');
}

// 4. NO profession is hardcoded — the engine exposes only a lexicon + 7 buckets.
ok('only-7-buckets', Object.keys(CC._BUCKETS).length === 7, Object.keys(CC._BUCKETS).join(','));
ok('no-job-table', JSON.stringify(CC._BUCKETS).toLowerCase().indexOf('pig farmer') === -1 && JSON.stringify(CC._LEXICON).indexOf('puppeteer') === -1);

// 5. Free-first — all surfaced certs are free; the report counts them.
const rep = CC.buildReport(CC.parseOneLiner('I am a small business owner with 5 years'));
ok('certs-all-free', rep.sections.certifications.every(c => c.free === true), rep.sections.certifications.length + ' certs');
ok('free-tools-counted', rep.free_tools_count >= 3);
ok('free-certs-counted', rep.free_certs_count === rep.sections.certifications.length);

// 6. Sensitive professions carry a human-in-the-loop caveat.
const doc = CC.buildReport(CC.parseOneLiner('I am a doctor with 15 years'));
ok('doctor-caveat', doc.sections.caveats.some(c => /clinical|diagnos|human/i.test(c)), 'clinical caveat present');
const law = CC.buildReport(CC.parseOneLiner('I am a lawyer with 10 years'));
ok('lawyer-caveat', law.sections.caveats.some(c => /citation|verify|hallucinat/i.test(c)), 'legal caveat present');
const hr = CC.buildReport(CC.parseOneLiner('I am an HR recruiter'));
ok('hr-caveat', hr.sections.caveats.some(c => /bias|human/i.test(c)));

// 7. Pig farmer derives vision + data categories from task-type (not a stored row).
const pig = CC.mapProfession(CC.parseOneLiner('I am a pig farmer'));
ok('pig-derives-vision', pig.categories.some(c => /vision|image/i.test(c)), pig.categories.join(', '));

// 8. Roadmap hand-off + speakable summary for blind/illiterate users.
ok('roadmap-handoff', /AI for/i.test(rep.sections.roadmap_handoff.learn_goal));
const spk = CC.speakable(doc, 'en');
ok('speakable-has-role-tools-cert', /doctor/i.test(spk) && /tools are/i.test(spk) && /certification/i.test(spk), spk.slice(0, 80) + '...');
ok('speakable-hi-differs', CC.speakable(doc, 'hi') !== spk);

console.log('\n----------------------------------------');
console.log('BO4 Career Coach: ' + pass + ' / ' + (pass + fail) + ' PASS' + (fail ? ' · FAILS: ' + fails.join(', ') : ''));
process.exit(fail ? 1 : 0);
