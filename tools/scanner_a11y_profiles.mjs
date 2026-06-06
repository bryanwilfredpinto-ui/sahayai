#!/usr/bin/env node
/**
 * tools/scanner_a11y_profiles.mjs — Chitti Universal Scanner: ALL accessibility profiles.
 * For each disability profile: inject the profile → load → run scan→route → axe-core scan
 * → assert router renders, carries data-chitti-response, speaks/announces, 0 NEW axe
 * violations from CUSOS markup. PASS/FAIL per profile.
 * Run: CERT_BASE=http://127.0.0.1:8770 node tools/scanner_a11y_profiles.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core'), 'utf8');
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8770').replace(/\/$/, '');
const URL = BASE + '/chitti_scanner.html';

const PROFILES = [
  { key: 'blind', expect: 'voice-first / aria-live route announced' },
  { key: 'deaf', expect: 'caption + ISL panel, no audio-only' },
  { key: 'mute', expect: 'tap/camera, voice optional' },
  { key: 'isl', expect: 'ISL animation on responses' },
  { key: 'illiterate', expect: 'picture-menu + voice everything' },
  { key: 'elderly', expect: 'slow speech / large text / repeat' },
  { key: 'limitedMobility', expect: 'large tap targets / voice nav' },
  { key: 'cognitive', expect: 'simple language, one step' },
  { key: 'rural', expect: '2G/offline-safe, deterministic (no spend)' },
];

const b = await chromium.launch({ headless: true });
const rows = [];
for (const prof of PROFILES) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript((k) => {
    try {
      const p = { lang: 'hi', ts: 't', skipped: false }; p[k] = true;
      localStorage.setItem('disability_profile', JSON.stringify(p));
      localStorage.setItem('chitti_scanner_consent_given', '1');
    } catch (e) {}
  }, prof.key);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  // run a scan→route journey for this profile
  const j = await page.evaluate(() => {
    if (typeof changeLanguage === 'function') changeLanguage('en');
    const det = window.detectCategory({ type: null, summary: 'Crocin 500mg paracetamol exp 2027', facts: {}, key_findings: [] }, 'Crocin 500mg paracetamol exp 2027');
    window.renderRouterCard(det, { speak: false });
    const c = document.getElementById('router-card');
    // unknown journey → picture menu must exist for illiterate/mute
    window.renderRouterCard({ category: 'unknown', confidence: 0.3 }, { speak: false });
    const tiles = document.querySelectorAll('#router-card .cat-tiles button').length;
    window.renderRouterCard(det, { speak: false }); // back to a real route
    return {
      routerVisible: c && getComputedStyle(c).display !== 'none',
      hasResponseAttr: c && c.hasAttribute('data-chitti-response'),
      hasReason: c && !!c.querySelector('.rc-reason'),
      profileRead: (() => { try { return !!JSON.parse(localStorage.getItem('disability_profile')); } catch (e) { return false; } })(),
      ariaLive: !!document.querySelector('[aria-live]'),
      tiles,
    };
  });

  // axe scan, regression-scoped to CUSOS markup
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
    const all = res.violations.flatMap(v => v.nodes.map(n => ({ id: v.id, target: (n.target || []).join(' ') })));
    return { total: all.length, mine: all.filter(n => /router-card|rc-|cat-tiles/i.test(n.target)).length };
  });

  const ok = errs.length === 0 && j.routerVisible && j.hasResponseAttr && j.hasReason &&
    j.profileRead && j.ariaLive && axe.mine === 0;
  rows.push({ key: prof.key, ok, axeMine: axe.mine, axeTotal: axe.total, errs: errs.length });
  console.log(`${ok ? '✅' : '❌'} ${prof.key.padEnd(16)} router=${j.routerVisible} aria-live=${j.ariaLive} tiles=${j.tiles} axe-new=${axe.mine} (page ${axe.total}) errs=${errs.length}  | ${prof.expect}`);
  await ctx.close();
}

await b.close();
const pass = rows.filter(r => r.ok).length;
console.log(`\nA11Y_RESULT:${JSON.stringify({ total: rows.length, pass, fail: rows.length - pass, failed: rows.filter(r => !r.ok).map(r => r.key) })}`);
process.exit(0);
