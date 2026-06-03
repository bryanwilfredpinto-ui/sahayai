/**
 * probe_baseline.mjs — capture the BEFORE state for the ship-now-5
 * session (Sire 2026-06-04). Numbers + screenshots that will be
 * compared against AFTER once the changes land.
 *
 * Captures:
 *   • verdict distribution per language (en/hi/ta) over the live feed
 *   • image-presence rate per language
 *   • category leakage counts (politics, business)
 *   • sample/seed leakage at rank #1
 *   • screenshots per viewport (375/768/1280) on the EN home + politics view
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });
const API = 'https://chitti-news-api-production.up.railway.app';
const PAGE = 'https://sahayai.in/chitti_news.html';

const stats = { generatedAt: new Date().toISOString(), beforeShipNow5: {} };

// ── 1. Verdict distribution ──────────────────────────────────────────
async function verdictDistribution(lang) {
  const r = await fetch(`${API}/api/news/feed?state=india&language=${lang}&category=national&limit=100`);
  const d = await r.json();
  const items = d.items || [];
  const counts = { verified: 0, partial: 0, disputed: 0, unverified: 0, unchecked: 0 };
  let withImage = 0;
  for (const a of items) {
    const v = a.factcheck?.verdict || 'unchecked';
    counts[v] = (counts[v] || 0) + 1;
    if (a.image_url) withImage++;
  }
  return {
    total: items.length,
    verdicts: counts,
    withImagePct: items.length ? Math.round(100 * withImage / items.length) : 0,
  };
}
const VERDICT_LANGS = ['en', 'hi', 'ta', 'bn', 'mr', 'pa', 'ur', 'te', 'ml', 'gu', 'kn', 'or'];
stats.beforeShipNow5.verdict_and_image_per_lang = {};
for (const lang of VERDICT_LANGS) {
  stats.beforeShipNow5.verdict_and_image_per_lang[lang] = await verdictDistribution(lang);
}

// ── 2. Category leakage (politics + business) on EN ──────────────────
async function categoryLeakage(cat, keywords) {
  const r = await fetch(`${API}/api/news/feed?state=india&language=en&category=${cat}&limit=30`);
  const d = await r.json();
  const items = d.items || [];
  const matches = items.filter(a => {
    const t = `${a.title || ''} ${a.summary || ''}`.toLowerCase();
    return keywords.some(k => t.includes(k));
  });
  return {
    total: items.length,
    leakage: matches.length,
    leakage_pct: items.length ? Math.round(100 * matches.length / items.length) : 0,
    sample: matches.slice(0, 3).map(a => (a.title || '').slice(0, 80)),
  };
}
stats.beforeShipNow5.politics_disaster_leakage = await categoryLeakage('politics',
  ['fire ', 'blaze', 'hotel', 'killed', 'blast', 'tragedy', 'building collapse']);
stats.beforeShipNow5.politics_exam_leakage = await categoryLeakage('politics',
  ['answer key', 'merit list', 'result', 'cet ', 'rrb ', 'afcat', 'uppsc', 'jee ', 'neet ', 'exam']);
stats.beforeShipNow5.business_world_leakage = await categoryLeakage('business',
  ['kuwait', 'iran', 'mosque', 'japan', 'fire ', 'hotel', 'tragedy']);

// ── 3. Sample/seed leakage at rank #1 ────────────────────────────────
async function sampleAtRankOne() {
  const cats = ['national', 'politics', 'business', 'sports', 'entertainment', 'tech'];
  const out = {};
  for (const c of cats) {
    const r = await fetch(`${API}/api/news/feed?state=india&language=en&category=${c}&limit=1`);
    const d = await r.json();
    const a = (d.items || [])[0] || {};
    out[c] = {
      title: a.title || '',
      is_sample: /^(Sample\s*[·\-]|Welcome to|Welcome \()/i.test(a.title || ''),
    };
  }
  return out;
}
stats.beforeShipNow5.sample_at_rank_one = await sampleAtRankOne();

// ── 4. Matched articles surfaced? (sniff one factcheck) ──────────────
async function matchedArticlesContract() {
  const feedR = await fetch(`${API}/api/news/feed?state=india&language=en&category=national&limit=5`);
  const feedD = await feedR.json();
  const a = (feedD.items || [])[0];
  if (!a) return { error: 'no items' };
  const fcR = await fetch(`${API}/api/news/article/${a.id}/factcheck`, { method: 'POST', headers: { 'X-User-Token': 'baseline-probe-2026-06-04' } });
  const fcD = await fcR.json();
  return {
    sample_article_id: a.id,
    backend_returns_matched_articles: Array.isArray(fcD.matched_articles),
    matched_count: (fcD.matched_articles || []).length,
    matched_sample: (fcD.matched_articles || []).slice(0, 2),
  };
}
stats.beforeShipNow5.matched_articles_contract = await matchedArticlesContract();

// ── 5. /feed response size (gzip indicator) ─────────────────────────
async function feedResponseSize() {
  const r1 = await fetch(`${API}/api/news/feed?state=india&language=en&category=national&limit=30`);
  const len = r1.headers.get('content-length') || 'no-content-length';
  const enc = r1.headers.get('content-encoding') || 'none';
  const body = await r1.text();
  return { content_length: len, content_encoding: enc, body_chars: body.length };
}
stats.beforeShipNow5.feed_size = await feedResponseSize();

writeFileSync(
  resolve(__dirname, 'baseline_before.json'),
  JSON.stringify(stats, null, 2),
);
console.log('Wrote baseline_before.json');
console.log(JSON.stringify(stats.beforeShipNow5, null, 2));

// ── 6. Screenshots per viewport ──────────────────────────────────────
const SIZES = [
  { name: 'mobile',  w:  375, h: 1400 },
  { name: 'tablet',  w:  768, h: 1200 },
  { name: 'desktop', w: 1280, h: 1200 },
];
const browser = await chromium.launch({ headless: true });
for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem('chitti_news_state', 'india');
      localStorage.setItem('chitti_news_lang',  'en');
      localStorage.setItem('chitti_news_category', 'national');
      localStorage.setItem('disability_profile', JSON.stringify({
        skipped: true, ts: new Date().toISOString(), source: 'baseline',
      }));
    } catch (e) {}
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.rail-section, .art-card').length >= 1, { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `before_${s.name}_en_home.png`), fullPage: true });
  await ctx.close();
}
// Politics tab on mobile (to show disaster leakage)
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 2000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'politics');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'baseline',
    }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.art-card').length >= 3, { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `before_mobile_politics.png`), fullPage: true });
  await ctx.close();
}
// Tamil home on mobile (to show 100% placeholder)
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 2000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'ta');
    localStorage.setItem('chitti_news_category', 'national');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'baseline',
    }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.art-card, .rail-card').length >= 1, { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `before_mobile_ta_home.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
console.log('\nBefore screenshots: 5 files in tools/cert_screenshots/before_*.png');
