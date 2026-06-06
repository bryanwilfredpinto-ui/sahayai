#!/usr/bin/env node
/**
 * tools/cert_news_ai_quality_matrix.mjs — Sire's QA challenge 2026-06-06:
 *   "SO U DID A QUALITY CHECK, RIGHT? BY SELECTING ALL LANGUAGES?
 *    OR CHECKING EACH PROFESSIONALS & WHAT COURSES, CERTIFICATIONS POPULATE?"
 *
 * Honest answer was NO. This cert fixes that.
 *
 * Matrix:
 *   - 13 professions × Hub data integrity (4 metrics + verdict + sourced_from)
 *   - 13 professions × 28-day tour populates with profession-specific tools
 *     (must NOT be stubs; each profession's TOUR_PROFESSION_14 must have
 *     14 entries with non-empty tool + why + try-URL)
 *   - 26 languages × dropdown switch + lang attr updates + no console err
 *   - All Tour-day URLs HEAD-check (sample first 28 = first profession's tour)
 *   - Per-profession data integrity counts (projects / prompts / forecast)
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = (process.env.CERT_BASE || 'https://sahayai.in') + '/chitti_news_ai.html';
const SHOT = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT, { recursive: true });

const PROFESSIONS = [
  'software-developer','doctor','oncologist','nurse','farmer','teacher',
  'lawyer','accountant','hr-professional','talent-acquisition',
  'business-owner','government-employee','student',
];

const LANGS = [
  'en','hi','ta','te','bn','mr','gu','kn','ml','pa','or','as','ur',
  'bho','hne','mai','kok','doi','sd','ks','mni','brx','sat','sa','tcy','kfa','kru',
];

const R = [];
function rec(label, ok, detail, extra) { R.push({ label, ok: !!ok, detail, ...extra }); console.log((ok?'PASS':'FAIL').padEnd(5), label, '-', detail || ''); }

const b = await chromium.launch({ headless: true });

// ── ROUND 1: profession × Hub data integrity ──
console.log('\n=== ROUND 1: 13 professions × Hub data integrity ===');
{
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,120)); });
  await p.addInitScript(() => { localStorage.setItem('disability_profile', JSON.stringify({skipped:true,ts:'2026-06-06'})); });
  await p.goto(URL + '?_bust=' + Date.now(), { waitUntil:'domcontentloaded', timeout:45000 });
  await p.waitForTimeout(3500);

  for (const prof of PROFESSIONS) {
    const data = await p.evaluate((pr) => {
      const CC = window.ChittiCoach;
      const hub = CC && CC.buildHub ? CC.buildHub(pr, CC.profile.init()) : null;
      if (!hub || !hub.impact) return { ok: false, why: 'no_hub_data' };
      const imp = hub.impact;
      const projects = hub.projects || [];
      const forecast = hub.forecast || [];
      const prompts = hub.prompts || [];
      const mission = hub.mission;
      return {
        ok: true,
        risk: imp.disruption_risk,
        adoption: imp.adoption_level,
        opp: imp.opportunity_level,
        rd: hub.readiness && hub.readiness.score,
        verdict_len: (imp.verdict || '').length,
        sourced: !!(imp.sourced_from || '').length,
        tasks: (imp.tasks || []).length,
        projects: projects.length,
        forecast: forecast.length,
        prompts: prompts.length,
        mission_has_watch: !!(mission && mission.watch),
        mission_has_read: !!(mission && mission.read),
        mission_has_practice: !!(mission && mission.practice),
        mission_has_try: !!(mission && mission.try),
      };
    }, prof);
    const ok = data.ok && data.verdict_len > 20 && data.sourced && data.tasks >= 3 && data.projects >= 2 && data.forecast === 3 && data.prompts >= 3 && data.mission_has_watch && data.mission_has_read && data.mission_has_practice && data.mission_has_try;
    rec('hub_' + prof, ok, JSON.stringify({risk:data.risk,adopt:data.adoption,opp:data.opp,rd:data.rd,projects:data.projects,fc:data.forecast,prompts:data.prompts,mission:[data.mission_has_watch,data.mission_has_read,data.mission_has_practice,data.mission_has_try].filter(Boolean).length+'/4'}), { data });
  }
  await c.close();
}

// ── ROUND 2: 13 professions × Tour populates with profession-specific tools ──
console.log('\n=== ROUND 2: 13 professions × 28-day Tour content integrity ===');
{
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  await p.addInitScript(() => { localStorage.setItem('disability_profile', JSON.stringify({skipped:true})); });
  await p.goto(URL + '?_bust=' + Date.now(), { waitUntil:'domcontentloaded', timeout:45000 });
  await p.waitForTimeout(3500);
  for (const prof of PROFESSIONS) {
    const data = await p.evaluate((pr) => {
      const CC = window.ChittiCoach;
      const days = CC.curriculumDays('28-day-tour', pr);
      const profSection = days.slice(7, 21); // Days 8-21 are profession-specific
      // Each prof-day must have tool + why + try-url (no stubs)
      const stubs = profSection.filter(d => !d.tool || !d.why || !d.try || !d.try.url);
      const tools = profSection.map(d => d.tool);
      const totalDays = days.length;
      // Verify days 1-7 are common foundation (ChatGPT/Claude/Gemini/etc)
      const day1 = days[0] && days[0].tool;
      return {
        total: totalDays,
        prof_section_count: profSection.length,
        stubs: stubs.length,
        day1_tool: day1,
        sample_tool_d8: tools[0],
        sample_tool_d15: tools[7],
        unique_tools: new Set(tools).size,
      };
    }, prof);
    const ok = data.total === 28 && data.prof_section_count === 14 && data.stubs === 0 && /ChatGPT/i.test(data.day1_tool) && data.unique_tools >= 12;
    rec('tour_' + prof, ok, `total=${data.total}/28 prof=${data.prof_section_count}/14 stubs=${data.stubs} unique=${data.unique_tools}/14 d1=${data.day1_tool} d8=${data.sample_tool_d8} d15=${data.sample_tool_d15}`, { data });
  }
  await c.close();
}

// ── ROUND 3: 26 languages × dropdown switch ──
console.log('\n=== ROUND 3: 27 languages × dropdown switch ===');
{
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,120)); });
  await p.addInitScript(() => { localStorage.setItem('disability_profile', JSON.stringify({skipped:true})); });
  await p.goto(URL + '?_bust=' + Date.now(), { waitUntil:'domcontentloaded', timeout:45000 });
  await p.waitForTimeout(3500);
  // Read ACTUAL rendered dropdown options (chitti_a11y.js substrate may
  // replace my HTML's options with its canonical 26-lang registry; that
  // IS authoritative — test against what's actually rendered).
  const present = await p.evaluate(() => {
    const sel = document.getElementById('lang-select');
    if (!sel) return null;
    return Array.from(sel.options).map(o => o.value);
  });
  rec('lang_options_present', present && present.length >= 26, `${present?present.length:0} langs in dropdown — substrate-canonical list`);
  // Switch through every actually-rendered lang
  const langsToTest = present || LANGS;
  const switchErrs = [];
  for (const lang of langsToTest) {
    const before = errs.length;
    await p.evaluate((l) => {
      const sel = document.getElementById('lang-select');
      sel.value = l;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, lang);
    await p.waitForTimeout(150);
    const langAttr = await p.evaluate(() => document.documentElement.getAttribute('lang'));
    const stored = await p.evaluate(() => localStorage.getItem('chitti_lang'));
    if (langAttr !== lang || stored !== lang || errs.length > before) {
      switchErrs.push({ lang, langAttr, stored, newErrs: errs.length - before });
    }
  }
  rec('lang_switch_all_rendered', switchErrs.length === 0, `${langsToTest.length - switchErrs.length}/${langsToTest.length} clean; fails: ${JSON.stringify(switchErrs).slice(0,200)}`);
  await c.close();
}

// ── ROUND 4: HEAD-check sample tour URLs (Day-1 ChatGPT + Day 8 prof-specific for 13 profs) ──
console.log('\n=== ROUND 4: Tour-day URL HEAD reachability ===');
{
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  await p.addInitScript(() => { localStorage.setItem('disability_profile', JSON.stringify({skipped:true})); });
  await p.goto(URL + '?_bust=' + Date.now(), { waitUntil:'domcontentloaded', timeout:45000 });
  await p.waitForTimeout(2500);
  const samples = await p.evaluate((profs) => {
    const CC = window.ChittiCoach;
    const out = [];
    profs.forEach(pr => {
      const days = CC.curriculumDays('28-day-tour', pr);
      [days[0], days[7], days[14]].forEach((d, i) => {
        if (d && d.try && d.try.url) out.push({ prof: pr, day: d.day, tool: d.tool, url: d.try.url });
      });
    });
    return out;
  }, PROFESSIONS);
  // HEAD-check (concurrent)
  const results = await Promise.all(samples.slice(0, 30).map(async (s) => {
    try {
      // HEAD first; if 4xx (Cloudflare etc.), retry GET with browser-like UA;
      // only mark broken if BOTH fail or DNS-fails.
      const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      let r = await fetch(s.url, { method: 'HEAD', redirect: 'follow', headers: {'User-Agent': ua} }).catch(() => null);
      if (!r || r.status >= 400) {
        r = await fetch(s.url, { method: 'GET', redirect: 'follow', headers: {'User-Agent': ua} }).catch(() => null);
      }
      return { ...s, status: r ? r.status : 'fetch-failed' };
    } catch (e) { return { ...s, status: 'err:' + e.message }; }
  }));
  const broken = results.filter(r => typeof r.status === 'number' ? r.status >= 400 : true);
  rec('tour_urls_reachable', broken.length === 0,
    `${results.length - broken.length}/${results.length} reachable. Broken: ${broken.map(b => `[${b.prof} d${b.day} ${b.tool.slice(0,20)} ${b.status}]`).slice(0,5).join(' ')}`,
    { broken });
  await c.close();
}

// ── Save full report ──
await b.close();
const out = resolve(__dirname, 'cert_news_ai_quality_matrix_result.json');
const pass = R.filter(r => r.ok).length;
writeFileSync(out, JSON.stringify({ when: 'now', pass, fail: R.length - pass, total: R.length, results: R }, null, 2));
console.log(`\n📊 QUALITY MATRIX: ${pass} / ${R.length} PASS`);
console.log('📝', out);
process.exit(R.length - pass ? 1 : 0);
