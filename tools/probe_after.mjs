/**
 * probe_after.mjs — capture the AFTER state for the ship-now-5
 * session. Mirrors probe_baseline.mjs structure so the comparison
 * is anchored to identical metrics.
 *
 * Each measurement explicitly compares against baseline.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });
const API = 'https://chitti-news-api-production.up.railway.app';
const PAGE = 'https://sahayai.in/chitti_news.html';

const before = JSON.parse(readFileSync(resolve(__dirname, 'baseline_before.json'), 'utf-8')).beforeShipNow5;
const after = {};

// 1. Verdict distribution + image presence per language. RECENT articles
//    only — we filter by recency in the API by ordering desc and limit.
async function verdictAndImage(lang) {
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
  return { total: items.length, verdicts: counts, withImagePct: items.length ? Math.round(100 * withImage / items.length) : 0 };
}
after.verdict_and_image_per_lang = {};
for (const lang of ['en', 'hi', 'ta', 'bn', 'mr', 'pa', 'ur', 'te', 'ml', 'gu']) {
  try { after.verdict_and_image_per_lang[lang] = await verdictAndImage(lang); }
  catch (e) { after.verdict_and_image_per_lang[lang] = { error: String(e).slice(0, 80) }; }
}

// 1b. Image presence on TODAY'S articles only — last-24h only.
//     This isolates how the new extractor performs on NEW ingests vs
//     the pre-existing 31k corpus whose images won't backfill.
async function todayImageRate(lang) {
  const r = await fetch(`${API}/api/news/feed?state=india&language=${lang}&category=national&limit=100`);
  const d = await r.json();
  const items = d.items || [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = items.filter(a => {
    const t = a.fetched_at ? Date.parse(a.fetched_at) : 0;
    return t >= cutoff;
  });
  const withImg = recent.filter(a => a.image_url).length;
  return { total: recent.length, withImage: withImg, pct: recent.length ? Math.round(100 * withImg / recent.length) : null };
}
after.today_image_rate = {};
for (const lang of ['en', 'hi', 'ta', 'bn', 'mr', 'pa', 'ur', 'te']) {
  try { after.today_image_rate[lang] = await todayImageRate(lang); } catch (e) {}
}

// 2. Category leakage (same keywords as baseline)
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
after.politics_disaster_leakage = await categoryLeakage('politics',
  ['fire ', 'blaze', 'hotel', 'killed', 'blast', 'tragedy', 'building collapse']);
after.politics_exam_leakage = await categoryLeakage('politics',
  ['answer key', 'merit list', 'result', 'cet ', 'rrb ', 'afcat', 'uppsc', 'jee ', 'neet ', 'exam']);
after.business_world_leakage = await categoryLeakage('business',
  ['kuwait', 'iran', 'mosque', 'japan', 'fire ', 'hotel', 'tragedy']);

// 3. Sample/seed at rank #1
async function sampleAtRankOne() {
  const cats = ['national', 'politics', 'business', 'sports', 'entertainment', 'tech'];
  const out = {};
  for (const c of cats) {
    const r = await fetch(`${API}/api/news/feed?state=india&language=en&category=${c}&limit=1`);
    const d = await r.json();
    const a = (d.items || [])[0] || {};
    out[c] = {
      title: a.title || '',
      is_sample: /^(Sample\s*[·\-]|Welcome to|Welcome \(|How Chitti News works)/i.test(a.title || ''),
    };
  }
  return out;
}
after.sample_at_rank_one = await sampleAtRankOne();

// 4. matched_articles contract — pick a partial article and check it's populated
async function matchedArticlesContract() {
  const feedR = await fetch(`${API}/api/news/feed?state=india&language=en&category=national&limit=30`);
  const feedD = await feedR.json();
  const items = feedD.items || [];
  // Try to find a verified or partial article (n>=1)
  const corroborated = items.find(a => (a.factcheck?.match_count || 0) >= 1) || items[0];
  if (!corroborated) return { error: 'no items' };
  const fcR = await fetch(`${API}/api/news/article/${corroborated.id}/factcheck`, { method: 'POST', headers: { 'X-User-Token': 'after-probe-2026-06-04' } });
  const fcD = await fcR.json();
  return {
    sample_article_id: corroborated.id,
    sample_title: corroborated.title.slice(0, 90),
    verdict: fcD.verdict,
    matched_count: (fcD.matched_articles || []).length,
    matched_sample: (fcD.matched_articles || []).slice(0, 2).map(m => ({
      source_name: m.source_name, title: (m.title || '').slice(0, 80), has_link: !!m.link,
    })),
  };
}
after.matched_articles_contract = await matchedArticlesContract();

// 5. gzip indicator
async function feedResponseSize() {
  const noGz = await fetch(`${API}/api/news/feed?state=india&language=en&category=national&limit=30`, {
    headers: { 'Accept-Encoding': 'identity' },
  });
  const gz = await fetch(`${API}/api/news/feed?state=india&language=en&category=national&limit=30`, {
    headers: { 'Accept-Encoding': 'gzip' },
  });
  const bodyNoGz = await noGz.text();
  const bodyGz = await gz.text();   // node fetch auto-decodes
  return {
    server_supports_gzip: gz.headers.get('content-encoding') === 'gzip',
    uncompressed_bytes: bodyNoGz.length,
    decoded_bytes_after_gz: bodyGz.length,
    gz_wire_indicator: gz.headers.get('content-length') || 'not-set',
  };
}
after.feed_size = await feedResponseSize();

// 6. Sire 2026-06-04 — verify kn / or are gone from the picker.
//    Use a lightweight DOM check on the live page.
async function kannadaOdiaPickerCheck() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: new Date().toISOString(), source: 'after-probe' }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#pick-lang', { timeout: 10000 });
  const opts = await page.$$eval('#pick-lang option', els => els.map(e => e.value));
  await browser.close();
  return { picker_options: opts, kn_present: opts.includes('kn'), or_present: opts.includes('or') };
}
after.kn_or_picker_check = await kannadaOdiaPickerCheck();

writeFileSync(resolve(__dirname, 'after_ship_now_5.json'),
  JSON.stringify({ before, after }, null, 2));
console.log('Wrote after_ship_now_5.json');
console.log('\n=== AFTER ===');
console.log(JSON.stringify(after, null, 2));

// 7. Screenshots per viewport
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
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'national');
    localStorage.setItem('disability_profile', JSON.stringify({
      skipped: true, ts: new Date().toISOString(), source: 'after',
    }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.rail-section, .art-card').length >= 1, { timeout: 45000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `after_${s.name}_en_home.png`), fullPage: true });
  await ctx.close();
}
// Politics tab on mobile (was 30% leakage in baseline)
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 2000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'en');
    localStorage.setItem('chitti_news_category', 'politics');
    localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: new Date().toISOString(), source: 'after' }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.art-card').length >= 3, { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `after_mobile_politics.png`), fullPage: true });
  await ctx.close();
}
// Tamil home — was 100% placeholder baseline
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 2000 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('chitti_news_state', 'india');
    localStorage.setItem('chitti_news_lang',  'ta');
    localStorage.setItem('chitti_news_category', 'national');
    localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: new Date().toISOString(), source: 'after' }));
  });
  await page.goto(PAGE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelectorAll('.art-card, .rail-card').length >= 1, { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: resolve(SHOT_DIR, `after_mobile_ta_home.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
console.log('\nAfter screenshots: 5 files in tools/cert_screenshots/after_*.png');
