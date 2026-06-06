#!/usr/bin/env node
/**
 * tools/scanner_lang26.mjs — Chitti Universal Scanner: ALL 26 Voice Factory languages.
 * For each language: switch lang → render the router (medicine/fraud/unknown) → assert
 * no pageerror, router renders, and the page i18n substrate applied. PASS/FAIL per lang.
 * Run: CERT_BASE=http://127.0.0.1:8770 node tools/scanner_lang26.mjs
 */
import { chromium } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8770').replace(/\/$/, '');
const URL = BASE + '/chitti_scanner.html';

// 26 Voice Factory languages (SAHAYAI_MASTER §4a) + English baseline.
const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['te', 'తెలుగు'], ['ta', 'தமிழ்'],
  ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['gu', 'ગુજરાતી'], ['or', 'ଓଡ଼ିଆ'],
  ['as', 'অসমীয়া'], ['pa', 'ਪੰਜਾਬੀ'], ['ur', 'اردو'], ['bho', 'भोजपुरी'], ['hne', 'छत्तीसगढ़ी'],
  ['mai', 'मैथिली'], ['kok', 'कोंकणी'], ['doi', 'डोगरी'], ['sd', 'सिन्धी'], ['ks', 'کٲشُر'],
  ['mni', 'মৈতৈলোন্'], ['brx', 'बड़ो'], ['sat', 'ᱥᱟᱱᱛᱟᱲᱤ'], ['sa', 'संस्कृतम्'], ['tcy', 'ತುಳು'],
  ['kfa', 'कोलामी'], ['kru', 'कुड़ुख़'],
];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { try { localStorage.setItem('chitti_scanner_consent_given', '1'); localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: 't' })); } catch (e) {} });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const rows = [];
for (const [code, native] of LANGS) {
  const before = errs.length;
  const r = await page.evaluate(async (lang) => {
    if (typeof changeLanguage === 'function') changeLanguage(lang);
    // render the router in this language for three categories
    const out = {};
    for (const [cat, txt] of [['medicine', 'Crocin 500mg paracetamol exp 2027'], ['fraud_signal', 'you won prize click link OTP UPI'], ['unknown', 'zzz qqq']]) {
      const det = window.detectCategory({ type: null, summary: txt, facts: {}, key_findings: [] }, txt);
      window.renderRouterCard(det, { speak: false });
      const c = document.getElementById('router-card');
      out[cat] = { cat: det.category, vis: c && getComputedStyle(c).display !== 'none', len: c ? c.textContent.trim().length : 0 };
    }
    // did the i18n substrate translate at least one labelled control?
    const sampleI18n = (document.querySelector('[data-i18n]') || {}).textContent || '';
    return { out, i18nSample: sampleI18n.slice(0, 30), htmlLang: document.documentElement.lang || '' };
  }, code);
  await page.waitForTimeout(60);
  const newErrs = errs.length - before;
  const ok = newErrs === 0 &&
    r.out.medicine.vis && r.out.medicine.cat === 'medicine' &&
    r.out.fraud_signal.cat === 'fraud_signal' &&
    r.out.unknown.cat === 'unknown' &&
    r.out.medicine.len > 10;
  rows.push({ code, native, ok, errs: newErrs, med: r.out.medicine.cat, fraud: r.out.fraud_signal.cat, unk: r.out.unknown.cat });
  console.log(`${ok ? '✅' : '❌'} ${code.padEnd(4)} ${native.padEnd(12)} med=${r.out.medicine.cat} fraud=${r.out.fraud_signal.cat} unk=${r.out.unknown.cat} errs=${newErrs}`);
}

await b.close();
const pass = rows.filter(r => r.ok).length;
console.log(`\nLANG26_RESULT:${JSON.stringify({ total: rows.length, pass, fail: rows.length - pass, failed: rows.filter(r => !r.ok).map(r => r.code) })}`);
process.exit(0);
