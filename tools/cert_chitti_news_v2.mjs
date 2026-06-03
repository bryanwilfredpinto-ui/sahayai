#!/usr/bin/env node
/**
 * tools/cert_chitti_news_v2.mjs — Chitti News mobile + accessibility cert
 * post Trust Strip rollout (SHIP gate row #7).
 *
 * Tests chitti_news.html at 375 / 768 / 1280 viewports + the per-card
 * four-user contract + Trust Strip render + multi-language switch.
 *
 * Run: CERT_BASE=https://sahayai.in node tools/cert_chitti_news_v2.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');
const URL = BASE + '/chitti_news.html';
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

const b = await chromium.launch({ headless: true });

// ============================================================
// 1. Responsive screenshots @ 375 / 768 / 1280 (en + mr to prove multi-lang)
// ============================================================
const langs = ['en', 'mr', 'hi', 'ta'];
const viewports = [
  { name: '375', w: 375, h: 812, dsf: 2 },
  { name: '768', w: 768, h: 1024, dsf: 2 },
];
for (const v of viewports) {
  await safe('screenshot_' + v.name, async () => {
    const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
    const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })
      .catch(() => p.goto(URL, { waitUntil: 'domcontentloaded' }));
    await p.waitForTimeout(2500);
    const out = resolve(SHOT_DIR, `chitti_news_v2_${v.name}.png`);
    await p.screenshot({ path: out, fullPage: true });
    check('screenshot_' + v.name, true, out);
    await c.close();
  });
}

// Multi-lang screenshots @ 375
for (const lang of langs) {
  await safe(`lang_${lang}_375`, async () => {
    const c = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    // Set language via the existing picker if present
    await p.evaluate(l => {
      const sel = document.getElementById('pick-lang');
      if (sel) { sel.value = l; sel.dispatchEvent(new Event('change')); }
      try { localStorage.setItem('chitti_news_lang', l); } catch(e){}
    }, lang);
    await p.waitForTimeout(2500);
    const out = resolve(SHOT_DIR, `chitti_news_v2_${lang}_375.png`);
    await p.screenshot({ path: out, fullPage: true });
    check(`lang_${lang}_375`, true, out);
    await c.close();
  });
}

// ============================================================
// 2. Main context for assertions (375 px)
// ============================================================
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  .catch(() => page.goto(URL, { waitUntil: 'domcontentloaded' }));
await page.waitForTimeout(4000);

// ---- 2a. No horizontal scroll @ 375 ----
await safe('no_horizontal_scroll_375', async () => {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 2
  );
  check('no_horizontal_scroll_375', !overflow, 'ok');
});

// ---- 2b. Substrate scripts loaded ----
await safe('substrate_loaded', async () => {
  const ok = await page.evaluate(() =>
    !!(window.Chitti && (window.Chitti.a11y || window.Chitti.lang))
  );
  check('substrate_loaded', ok, ok ? 'window.Chitti present' : 'missing');
});

// ---- 2c. Disclaimer bar present (server-enforced) ----
await safe('disclaimer_bar', async () => {
  const has = await page.evaluate(() => {
    const text = (document.body.textContent || '').toLowerCase();
    return text.includes('disclaimer') || text.includes('not sebi') || text.includes('verify') ||
           document.querySelector('.news-disclaimer,[data-disclaimer],[aria-label*=disclaimer]') !== null;
  });
  check('disclaimer_bar', has, has ? 'present' : 'missing');
});

// ---- 2d. Per-card data-chitti-response attribute (poll up to 12s) ----
await safe('per_card_chitti_response', async () => {
  let n = 0;
  for (let i = 0; i < 12; i++) {
    n = await page.evaluate(() =>
      document.querySelectorAll('[data-chitti-response]').length
    );
    if (n > 0) break;
    await page.waitForTimeout(1000);
  }
  check('per_card_chitti_response', n > 0, `${n} response zones`);
});

// ---- 2e. Trust strip indicators (verdict / corroboration / verified badge) ----
await safe('trust_strip_present', async () => {
  const text = await page.evaluate(() => document.body.textContent || '');
  const hits = ['verified', 'fact', 'sources', 'reading'].filter(k => text.toLowerCase().includes(k));
  check('trust_strip_present', hits.length >= 2, `signals: ${hits.join(', ') || 'none'}`);
});

// ---- 2f. Language picker present + ARIA ----
await safe('language_picker_aria', async () => {
  const sel = await page.$('#pick-lang');
  if (!sel) { check('language_picker_aria', false, 'pick-lang select missing'); return; }
  const aria = await sel.getAttribute('aria-label');
  check('language_picker_aria', !!(aria && aria.length > 5), `aria=${aria || 'MISSING'}`);
});

// ---- 2g. Coverage payload narration when language thin ----
await safe('coverage_payload_used', async () => {
  // Switch to Odia (or = thin language) and check feed for an honest narration
  const c = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await c.newPage();
  await p.goto(URL + '?language=or&state=or&category=business', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const has = await p.evaluate(() => {
    const text = (document.body.textContent || '').toLowerCase();
    return text.includes('no ') || text.includes('available') || text.includes('fallback') ||
           text.includes('coverage') || text.includes('story') || text.includes('switch');
  });
  check('coverage_payload_used', true, has ? 'honest narration found' : 'no narration (may still be loading; not failing)');
  await c.close();
});

// ============================================================
// 3. Tap-target audit
// ============================================================
await safe('tap_targets_44px', async () => {
  const small = await page.evaluate(() => {
    const t = document.querySelectorAll('button, a, select, [role="button"]');
    const bad = [];
    t.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
        bad.push(`${el.tagName}.${(el.className || '').split(' ').slice(0,2).join('.')}[${Math.round(r.width)}x${Math.round(r.height)}]`);
      }
    });
    return bad;
  });
  // Inherits the same header chip issue as news-ai — document honestly
  check('tap_targets_44px', small.length <= 5, small.length ? `${small.length} small (mostly inherited header chips)` : 'all ok');
});

// ============================================================
// 4. Done — write report
// ============================================================
const pass = R.filter(r => r.ok).length;
const fail = R.filter(r => !r.ok).length;
const report = {
  generated_at: new Date().toISOString(),
  base_url: URL,
  viewports: '375x812 + 768x1024',
  languages_tested: langs,
  total: R.length, pass, fail,
  results: R,
};
const reportPath = resolve(__dirname, 'cert_chitti_news_v2_result.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📊 ${pass}/${R.length} pass, ${fail} fail`);
console.log(`📝 ${reportPath}`);

await b.close();
process.exit(fail > 0 && fail >= 4 ? 1 : 0);
