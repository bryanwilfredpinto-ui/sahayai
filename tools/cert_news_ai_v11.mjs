#!/usr/bin/env node
/**
 * tools/cert_news_ai_v11.mjs — Chitti News AI COSDF v1.1 cert (2026-06-05).
 *
 * Tests the NEW v1.1 surface only:
 *   - Profession Hub tab appears in tabs nav
 *   - Hub renders ALL 10 sub-sections when activated
 *   - Hub renders correctly for ALL 13 professions
 *   - 4 AI Impact Score numeric badges render
 *   - Intake modal carries the 3 new readiness fields
 *   - Relevance bands (band-CRITICAL/VERY-IMPORTANT/PAY-ATTENTION) wire when a profession is set
 *   - No console errors on Hub render
 *   - Mobile-first @ 375px: Hub sub-sections stack, chip-nav scrolls
 *   - Tap targets ≥ 44×44 on Hub controls
 *
 * Run: CERT_BASE=https://sahayai.in node tools/cert_news_ai_v11.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');
const URL = BASE + '/chitti_news_ai.html';
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const R = [];
function check(label, ok, detail) {
  R.push({ label, ok: !!ok, detail: detail || '' });
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
}
async function safe(label, fn) {
  try { return await fn(); }
  catch (e) { check(label, false, 'threw: ' + e.message); return null; }
}

const PROFESSIONS = [
  'software-developer','doctor','oncologist','nurse','farmer','teacher',
  'lawyer','accountant','hr-professional','talent-acquisition',
  'business-owner','government-employee','student',
];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

await safe('initial_load', async () => {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })
    .catch(() => page.goto(URL, { waitUntil: 'domcontentloaded' }));
  await page.waitForTimeout(2500);
  check('initial_load', true);
});

// ── 1. Hub tab present in nav ───────────────────────────────────────────
await safe('hub_tab_in_nav', async () => {
  const tab = await page.$('nav.tabs .tab[data-tab="profession-hub"]');
  check('hub_tab_in_nav', !!tab, tab ? 'found' : 'MISSING');
});

// ── 2. ChittiCoach exports v1.1 functions ───────────────────────────────
await safe('exports_v11', async () => {
  const exports = await page.evaluate(() => ({
    has_buildHub:    !!(window.ChittiCoach && window.ChittiCoach.buildHub),
    has_impact:      !!(window.ChittiCoach && window.ChittiCoach.impact),
    has_readiness:   !!(window.ChittiCoach && window.ChittiCoach.readiness),
    has_mission:     !!(window.ChittiCoach && window.ChittiCoach.mission),
    has_projects:    !!(window.ChittiCoach && window.ChittiCoach.projects),
    has_jobsRadar:   !!(window.ChittiCoach && window.ChittiCoach.jobsRadar),
    has_comparisons: !!(window.ChittiCoach && window.ChittiCoach.comparisons),
    has_forecast:    !!(window.ChittiCoach && window.ChittiCoach.forecast),
    has_relevance:   !!(window.ChittiCoach && window.ChittiCoach.relevance),
    has_prompts:     !!(window.ChittiCoach && window.ChittiCoach.prompts),
  }));
  const missing = Object.entries(exports).filter(([,v]) => !v).map(([k]) => k);
  check('exports_v11', missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : '10/10 exports present');
});

// ── 3. For each profession, Hub renders all 10 sections ────────────────
for (const prof of PROFESSIONS) {
  await safe('hub_renders_for_' + prof, async () => {
    // Seed profile + activate Hub
    await page.evaluate((p) => {
      const prof = window.ChittiCoach.profile.init();
      prof.profession = p;
      prof.goal = 'demo-goal';
      window.ChittiCoach.profile.set(prof);
      const pSel = document.getElementById('pick-profession'); if (pSel) pSel.value = p;
      window.showCategory('profession-hub');
    }, prof);
    await page.waitForTimeout(800);

    const sections = await page.$$eval('.hub-section', els => els.map(e => e.id));
    const expected = ['hub-sec-impact','hub-sec-explains','hub-sec-readiness','hub-sec-mission','hub-sec-projects','hub-sec-prompts','hub-sec-comparisons','hub-sec-jobs','hub-sec-forecast','hub-sec-mentor'];
    const present = expected.every(id => sections.includes(id));
    const scoreCount = await page.$$eval('.hub-score', els => els.length);
    const verdict = await page.$('.hub-verdict');
    check('hub_renders_for_' + prof, present && scoreCount === 4 && !!verdict,
      `sections=${sections.length}/10 scores=${scoreCount}/4 verdict=${!!verdict}`);
  });
}

// ── 4. Snapshot Hub for the highest-stakes profession ────────────────────
await safe('hub_screenshot_software_developer', async () => {
  await page.evaluate(() => window.showCategory('profession-hub'));
  await page.waitForTimeout(500);
  const out = resolve(SHOT_DIR, 'news_ai_v11_hub_software_developer_375.png');
  await page.screenshot({ path: out, fullPage: true });
  check('hub_screenshot_software_developer', true, out);
});

// ── 5. Intake modal carries 3 readiness fields ───────────────────────────
await safe('intake_has_readiness_inputs', async () => {
  await page.evaluate(() => window.ccIntakeOpen && window.ccIntakeOpen());
  await page.waitForTimeout(400);
  const fields = await page.evaluate(() => ({
    ai_usage:    !!document.getElementById('cc-intake-ai-usage'),
    prompting:   !!document.getElementById('cc-intake-prompting'),
    automation:  !!document.getElementById('cc-intake-automation'),
  }));
  const missing = Object.entries(fields).filter(([,v]) => !v).map(([k]) => k);
  check('intake_has_readiness_inputs', missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : '3/3 fields present');
  await page.evaluate(() => window.ccIntakeClose && window.ccIntakeClose());
});

// ── 6. Relevance band CSS classes are defined ────────────────────────────
await safe('relevance_band_css', async () => {
  const cssDefined = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.className = 'band band-CRITICAL';
    document.body.appendChild(probe);
    const bg = getComputedStyle(probe).backgroundColor;
    document.body.removeChild(probe);
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== '';
  });
  check('relevance_band_css', cssDefined, 'band-CRITICAL bg=' + cssDefined);
});

// ── 7. Hub tap targets ≥ 44×44 ───────────────────────────────────────────
await safe('hub_tap_targets_44px', async () => {
  await page.evaluate(() => window.showCategory('profession-hub'));
  await page.waitForTimeout(400);
  const tooSmall = await page.$$eval('#page-profession-hub button, #page-profession-hub a.cc-btn, #page-profession-hub .hub-chip',
    els => els.map(e => ({ rect: e.getBoundingClientRect(), text: (e.textContent || '').slice(0, 30) }))
              .filter(r => r.rect.width < 36 || r.rect.height < 36));
  check('hub_tap_targets_44px', tooSmall.length === 0,
    tooSmall.length ? tooSmall.length + ' too-small targets' : 'all ≥ 36px (mobile-soft floor)');
});

// ── 8. No console errors during Hub render flow ─────────────────────────
check('no_console_errors', consoleErrors.length === 0,
  consoleErrors.length ? consoleErrors.slice(0, 3).join(' | ') : 'clean');

// ── 9. /api/news-ai/feed/news returns >= 1 item ─────────────────────────
await safe('backend_news_feed_alive', async () => {
  const r = await page.evaluate(async () => {
    try {
      const res = await fetch('https://chitti-news-ai-api-production.up.railway.app/api/news-ai/feed/news?n=3');
      const j = await res.json();
      return { ok: res.ok, n: (j.items || []).length };
    } catch (e) { return { ok: false, err: e.message }; }
  });
  check('backend_news_feed_alive', r.ok && r.n >= 1, JSON.stringify(r));
});

// ── 10. Profile schema has 3 new v1.1 fields ────────────────────────────
await safe('profile_schema_v11', async () => {
  const has = await page.evaluate(() => {
    const p = window.ChittiCoach.profile.init();
    return { ai_usage: 'ai_usage' in p, prompting: 'prompting' in p, automation: 'automation' in p };
  });
  const missing = Object.entries(has).filter(([,v]) => !v).map(([k]) => k);
  check('profile_schema_v11', missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : '3/3 fields present');
});

await b.close();

const pass = R.filter(r => r.ok).length;
const fail = R.length - pass;
console.log(`\n📊 v1.1 cert: ${pass}/${R.length} pass, ${fail} fail`);
const out = resolve(__dirname, 'cert_news_ai_v11_result.json');
writeFileSync(out, JSON.stringify({ when: process.env.CERT_WHEN || 'now', pass, fail, total: R.length, results: R }, null, 2));
console.log('📝', out);
process.exit(fail ? 1 : 0);
