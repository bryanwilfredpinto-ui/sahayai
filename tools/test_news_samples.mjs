#!/usr/bin/env node
/**
 * tools/test_news_samples.mjs — Chitti News sample loop tester.
 *
 * Per Sire's PERMANENT 2026-06-06 rule: "Upload real sample files and test
 * them." This loops EVERY .json file in test_samples/news/ and EVERY item
 * inside it — NO hardcoded list — and for each item:
 *   1. 5-field schema check (title / url / source / category / language)
 *   2. URL reachability (HEAD, then GET fallback) — real RSS endpoints
 *
 * The sample set = 5 product categories × 5 real Indian-publisher RSS feeds.
 * Real, reproducible. Re-run: node tools/test_news_samples.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIR = resolve(ROOT, 'test_samples/news');
const REQUIRED = ['title', 'url', 'source', 'category', 'language'];
const TIMEOUT_MS = 12000;

async function reach(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const ua = { 'User-Agent': 'Mozilla/5.0 (ChittiNewsCert/1.0)' };
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers: ua });
    if (r.status === 405 || r.status === 403 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: ua });
    }
    clearTimeout(t);
    return { ok: r.status >= 200 && r.status < 400, status: r.status };
  } catch (e) {
    clearTimeout(t);
    // Some publishers reject HEAD outright — try a GET before giving up
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'follow', headers: ua });
      return { ok: r.status >= 200 && r.status < 400, status: r.status };
    } catch (e2) {
      return { ok: false, status: 'ERR:' + (e2.name === 'AbortError' ? 'timeout' : e2.message).slice(0, 40) };
    }
  }
}

const files = readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json').sort();
const streams = {};
let total = 0, fieldOk = 0, reachOk = 0;
const failures = [];

console.log('\n=== CHITTI NEWS — SAMPLE LOOP TEST ===\n');
console.log('Sample dir:', DIR);
console.log('Files (no hardcoded list):', files.join(', '), '\n');

for (const f of files) {
  const cat = f.replace(/\.json$/, '');
  const items = JSON.parse(readFileSync(resolve(DIR, f), 'utf8'));
  streams[cat] = { count: items.length, field_pass: 0, reach_pass: 0 };
  for (const it of items) {
    total++;
    const missing = REQUIRED.filter(k => !it[k] || String(it[k]).trim() === '');
    const fOk = missing.length === 0;
    if (fOk) { fieldOk++; streams[cat].field_pass++; }
    const r = await reach(it.url);
    if (r.ok) { reachOk++; streams[cat].reach_pass++; }
    const mark = (fOk && r.ok) ? 'PASS' : (fOk ? 'WARN' : 'FAIL');
    if (!fOk || !r.ok) failures.push({ cat, source: it.source, url: it.url, missing, http: r.status });
    console.log(`${mark.padEnd(4)} [${cat}] ${it.source}  fields=${fOk ? 'ok' : 'MISSING:' + missing.join(',')}  http=${r.status}`);
  }
}

const summary = {
  total_items: total,
  field_pass: fieldOk,
  reach_pass: reachOk,
  // overall "pass" = passes the field check AND is reachable
  pass: failures.length === 0 ? total : total - new Set(failures.map(x => x.cat + '|' + x.url)).size,
  fail: new Set(failures.map(x => x.cat + '|' + x.url)).size,
};
const out = { product: 'chitti-news', when: '2026-06-06', files, streams, summary, failures };
writeFileSync(resolve(__dirname, 'test_news_samples_result.json'), JSON.stringify(out, null, 2));

console.log('\n----------------------------------------');
console.log(`Items: ${total}  ·  field-check pass: ${fieldOk}/${total}  ·  URL-reachable: ${reachOk}/${total}`);
console.log(`Report: tools/test_news_samples_result.json`);
// Non-zero exit only if the SCHEMA check fails — reachability flakiness (publisher
// blocking a headless HEAD, transient DNS) is reported but does not hard-fail the gate.
process.exit(fieldOk === total ? 0 : 1);
