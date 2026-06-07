#!/usr/bin/env node
/* tools/test_ca_os_samples.mjs — runs EVERY sample fixture under test_samples/ca_os/**
 * by GLOB (no hardcoded list), through the deterministic engine, and asserts the
 * expected outputs. Writes tools/ca_os_samples_result.json for the handover fill.
 * Run: node tools/test_ca_os_samples.mjs
 */
import { createRequire } from 'module';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const CA = require('../chitti_ca_os_engine.js');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = resolve(ROOT, 'test_samples/ca_os');

// discover ALL .json sample files recursively — NO hardcoded list
function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (e.endsWith('.json')) out.push(p);
  }
  return out;
}

function checkExpect(result, expect) {
  for (const k of Object.keys(expect)) {
    if (k === '_schemeIncludes') {
      const ids = (result.schemes || []).map((s) => s.id);
      for (const want of expect[k]) if (!ids.includes(want)) return `missing scheme ${want} (got ${ids.join(',')})`;
    } else if (k === '_hasWarning') {
      const warn = (result.flags || []).some((f) => f.status === 'warning');
      if (warn !== expect[k]) return `_hasWarning ${warn} != ${expect[k]}`;
    } else if (k === '_summaryIncludes') {
      if (!String(result.summary || '').includes(expect[k])) return `summary missing "${expect[k]}"`;
    } else {
      if (result[k] !== expect[k]) return `${k}=${JSON.stringify(result[k])} != ${JSON.stringify(expect[k])}`;
    }
  }
  return null;
}

const files = walk(BASE).sort();
const byCat = {};
const rows = [];
let pass = 0, fail = 0;
for (const f of files) {
  const s = JSON.parse(readFileSync(f, 'utf8'));
  const cat = s.category;
  byCat[cat] = byCat[cat] || { count: 0, pass: 0 };
  byCat[cat].count++;
  let result, err = null;
  try { result = CA[s.fn].apply(null, s.args); err = checkExpect(result, s.expect); }
  catch (e) { err = 'threw: ' + e.message; }
  // provenance check (anti-hallucination): money results must carry sources[]
  if (!err && result && /tax|gst|business|cfo|penalty|scheme|benefit/i.test(s.fn) && !Array.isArray(result.sources) && !Array.isArray(result.risks)) {
    // primitive/internal helpers carry no provenance (the user-facing wrappers do):
    //   gstTax, validateGSTIN, incomeTaxOne (incomeTax() is the user-facing wrapper)
    if (!/gstTax|validateGSTIN|incomeTaxOne/.test(s.fn)) err = 'missing sources[]/risks[] provenance';
  }
  if (err) { fail++; rows.push({ id: s.id, cat, ok: false, err }); console.log(`❌ ${cat}/${s.id} — ${err}`); }
  else { pass++; byCat[cat].pass++; rows.push({ id: s.id, cat, ok: true }); console.log(`✅ ${cat}/${s.id} — ${s.desc}`); }
}

mkdirSync(resolve(ROOT, 'tools'), { recursive: true });
const out = { total: files.length, pass, fail, byCat, rows, generatedNote: 'real fixtures discovered by glob (no hardcoded list)' };
writeFileSync(resolve(ROOT, 'tools/ca_os_samples_result.json'), JSON.stringify(out, null, 2));
console.log(`\nSamples: ${pass}/${files.length} pass across ${Object.keys(byCat).length} categories`);
Object.keys(byCat).forEach((c) => console.log(`  ${c}: ${byCat[c].pass}/${byCat[c].count}`));
if (fail) process.exit(1);
console.log(`QA_RESULT:{"samples_pass":${pass},"samples_fail":${fail}}`);
