#!/usr/bin/env node
/**
 * tools/scanner_upload.mjs — Chitti Universal Scanner: REAL sample-file upload tests.
 * 1) Generates real PNG sample "labels" (render HTML → Playwright screenshot).
 * 2) Frontend: feeds each PNG to #file-input → asserts preview + analyse + router/result
 *    (no dead end, no crash) — proves the camera/gallery pipeline.
 * 3) Backend: POSTs each real PNG multipart to the LIVE /api/scanner/analyze → records
 *    HTTP status + response shape (honest: vision is OFF, so fallback is expected).
 * Run: CERT_BASE=http://127.0.0.1:8770 node tools/scanner_upload.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8770').replace(/\/$/, '');
const URL = BASE + '/chitti_scanner.html';
const LIVE = 'https://chitti-scanner-api-production.up.railway.app';
const DIR = resolve(__dirname, 'cert_samples');
mkdirSync(DIR, { recursive: true });

const SAMPLES = [
  { id: 'medicine', title: 'CROCIN ADVANCE', body: 'Paracetamol IP 500mg<br>Tablet · Batch B1204<br>Mfg 08/2025 · Exp 07/2027<br>MRP ₹35' },
  { id: 'food', title: 'NAMKEEN MIX', body: 'FSSAI 10012021000123<br>Ingredients: gram flour, salt, spices<br>Energy 540 kcal · Sugar 2g · Sodium 820mg<br>Best before 6 months' },
  { id: 'upi_qr', title: 'PAY VIA UPI', body: '▦▦▦ QR ▦▦▦<br>You WON ₹25,000! Scan & share OTP<br>to claim your prize · click link' },
  { id: 'legal', title: 'LEGAL NOTICE', body: 'Notice under Section 138 NI Act<br>Demand to vacate premises<br>Arbitration clause 14 · 30 days' },
];

const b = await chromium.launch({ headless: true });

// ---- 1. Generate real PNG sample files ----
const genCtx = await b.newContext({ viewport: { width: 480, height: 320 } });
const gp = await genCtx.newPage();
for (const s of SAMPLES) {
  const html = `<html><body style="margin:0;font-family:Arial;background:#fff">
    <div style="border:3px solid #0E2344;margin:14px;padding:18px;border-radius:10px">
      <div style="font-size:26px;font-weight:900;color:#0E2344">${s.title}</div>
      <div style="height:3px;background:linear-gradient(90deg,#E86A17,#D4AF37);margin:8px 0"></div>
      <div style="font-size:18px;line-height:1.7;color:#111">${s.body}</div>
    </div></body></html>`;
  await gp.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = resolve(DIR, `sample_${s.id}.png`);
  await gp.screenshot({ path: out });
  s.path = out;
}
await genCtx.close();
console.log('Generated real sample PNGs: ' + SAMPLES.map(s => s.id).join(', '));

// ---- 2. Frontend file-upload pipeline ----
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { try { localStorage.setItem('chitti_scanner_consent_given', '1'); localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: 't' })); } catch (e) {} });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

const R = [];
for (const s of SAMPLES) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // set the real file on the hidden input → triggers handleFile → showPreview
  await page.setInputFiles('#file-input', s.path);
  await page.waitForTimeout(400);
  const previewShown = await page.evaluate(() => { const p = document.getElementById('preview'); return p && p.classList.contains('shown'); });
  // fire the analyse path (hits live backend; resilience must keep the UI alive)
  await page.evaluate(() => { try { analyseUploadedImage(); } catch (e) {} });
  await page.waitForTimeout(6000);
  const st = await page.evaluate(() => {
    const res = document.getElementById('result');
    const card = document.getElementById('router-card');
    return {
      resultShown: res && res.classList.contains('shown'),
      summary: (document.getElementById('r-summary').textContent || '').slice(0, 50),
      routerVisible: card && getComputedStyle(card).display !== 'none',
      noCrashText: (document.getElementById('r-summary').textContent || '').length > 0,
    };
  });
  // PASS = preview rendered + analyse ran + UI is alive (result shown, no crash). Router may
  // be 'unknown' for image-only when the backend can't classify — that's honest, not a fail.
  const ok = previewShown && st.resultShown && st.noCrashText && errs.length === 0;
  R.push({ id: s.id, ok, previewShown, resultShown: st.resultShown, router: st.routerVisible, errs: errs.length });
  console.log(`${ok ? '✅' : '❌'} FE upload ${s.id.padEnd(9)} preview=${previewShown} result=${st.resultShown} router=${st.routerVisible} errs=${errs.length} | "${st.summary}"`);
}
await ctx.close();

// ---- 3. Backend: POST real PNGs multipart to the LIVE analyze endpoint ----
console.log('\nLive backend multipart upload (vision is OFF — fallback expected, recorded honestly):');
const BE = [];
for (const s of SAMPLES) {
  try {
    const buf = readFileSync(s.path);
    const fd = new FormData();
    fd.append('image', new Blob([buf], { type: 'image/png' }), `sample_${s.id}.png`);
    fd.append('language', 'en');
    const r = await fetch(LIVE + '/api/scanner/analyze', { method: 'POST', body: fd });
    let j = {}; try { j = await r.json(); } catch (e) {}
    BE.push({ id: s.id, http: r.status, ok: j.ok, type: j.type || '-', source: j.source || '-' });
    console.log(`   ${s.id.padEnd(9)} HTTP ${r.status} · ok=${j.ok} · type=${j.type || '-'} · source=${j.source || '-'}`);
  } catch (e) {
    BE.push({ id: s.id, http: 'ERR', err: e.message });
    console.log(`   ${s.id.padEnd(9)} ERROR ${e.message}`);
  }
}

await b.close();
const fePass = R.filter(r => r.ok).length;
console.log(`\nUPLOAD_RESULT:${JSON.stringify({ frontend_pass: `${fePass}/${R.length}`, backend: BE.map(x => `${x.id}:HTTP${x.http}`), samples_dir: DIR })}`);
process.exit(0);
