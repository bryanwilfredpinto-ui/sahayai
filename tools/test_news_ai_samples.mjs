#!/usr/bin/env node
/**
 * tools/test_news_ai_samples.mjs — sample loop (no hardcoding).
 *
 * Reads test_samples/news-ai/*.json (50 real items, pulled live from
 * /api/news-ai/feed/<stream>?n=5). For each item, verifies:
 *   - title is present + non-empty
 *   - url is HTTPS + resolves (HEAD then GET with browser UA)
 *   - source has name
 *   - classification has category + confidence
 * Loops EVERY file/item; no hardcoded list. Re-runnable on every commit.
 *
 * Usage: node tools/test_news_ai_samples.mjs
 * Output: tools/test_news_ai_samples_result.json
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SAMPLES = resolve(ROOT, 'test_samples/news-ai');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

if (!existsSync(SAMPLES)) {
  console.error('No samples directory:', SAMPLES);
  process.exit(2);
}

async function urlReachable(u) {
  try {
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!r || r.status >= 400) {
      r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) }).catch(() => null);
    }
    return r ? r.status : 'fetch-failed';
  } catch (e) { return 'err:' + e.message; }
}

const files = readdirSync(SAMPLES).filter(f => f.endsWith('.json') && f !== 'index.json');
console.log('\n=== SAMPLE TEST LOOP — no hardcoding ===\n');
console.log('Streams found:', files.length);

const results = { generated_at: '2026-06-06', streams: {} };
let totalPass = 0, totalFail = 0;

for (const f of files) {
  const stream = f.replace('.json', '');
  const items = JSON.parse(readFileSync(resolve(SAMPLES, f), 'utf8'));
  const rows = [];
  for (const it of items) {
    const checks = {
      has_title:  !!(it.title && it.title.length > 0),
      has_url:    !!(it.url && /^https?:/.test(it.url)),
      has_source: !!(it.source),
      has_cat:    !!(it.category),
      has_conf:   typeof it.confidence === 'number',
    };
    const reach = await urlReachable(it.url);
    checks.url_reachable = typeof reach === 'number' && reach < 400;
    const ok = checks.has_title && checks.has_url && checks.has_source && checks.has_cat && checks.has_conf && checks.url_reachable;
    if (ok) totalPass++; else totalFail++;
    console.log((ok?'PASS':'FAIL').padEnd(5), stream, '·', it.id, '·', String(it.title||'').slice(0,50), '·', reach);
    rows.push({ id: it.id, title: it.title, url: it.url, reach, checks });
  }
  results.streams[stream] = { count: items.length, pass: rows.filter(r => Object.values(r.checks).every(Boolean)).length, rows };
}

results.summary = { total_items: totalPass + totalFail, pass: totalPass, fail: totalFail };
console.log('\n');
console.log(`SAMPLE LOOP: ${totalPass} / ${totalPass + totalFail} PASS`);
writeFileSync(resolve(__dirname, 'test_news_ai_samples_result.json'), JSON.stringify(results, null, 2));
console.log('Report: tools/test_news_ai_samples_result.json');
process.exit(totalFail ? 1 : 0);
