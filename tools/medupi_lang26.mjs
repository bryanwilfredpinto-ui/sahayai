// tools/medupi_lang26.mjs — Chitti MedUPI across all 26 Voice Factory languages.
// Per language: Chitti.lang.set(code) → measure translation COVERAGE (fraction of
// snapshotted English UI strings that became non-English), assert no pageerror,
// no raw data-i18n keys leaking, no horizontal overflow, and that the lang pack loaded.
// PASS = coverage>=60% AND 0 pageerrors AND 0 raw keys AND no overflow. (en baseline=100%.)
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = BASE + '/chitti_medupi.html';
// canonical 26 from chitti_lang.js LANGS
const LANGS = [['en','English'],['hi','हिन्दी'],['bn','বাংলা'],['te','తెలుగు'],['ta','தமிழ்'],['mr','मराठी'],['gu','ગુજરાતી'],['kn','ಕನ್ನಡ'],['ml','മലയാളം'],['pa','ਪੰਜਾਬੀ'],['or','ଓଡ଼ିଆ'],['as','অসমীয়া'],['ur','اردو'],['sa','संस्कृतम्'],['mai','मैथिली'],['kok','कोंकणी'],['doi','डोगरी'],['ks','کٲشُر'],['ne','नेपाली'],['sd','سنڌي'],['mni','মৈতৈলোন্'],['sat','ᱥᱟᱱᱛᱟᱲᱤ'],['bho','भोजपुरी'],['raj','राजस्थानी'],['kru','कुड़ुख़'],['hoc','हो']];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: 't' })); localStorage.setItem('chitti_medupi_disclaimer_ack','1'); } catch (e) {} });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// snapshot the visible English UI string set once (header/tabs/labels)
const baselineStrings = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button,h1,h2,h3,.tab,label,.tagline,[data-i18n]').forEach(el => {
    const t = (el.innerText || el.textContent || '').replace(/\s+/g,' ').trim();
    if (t && t.length >= 3 && t.length < 60 && /[A-Za-z]/.test(t)) out.push(t);
  });
  return [...new Set(out)].slice(0, 80);
});

function isLatinHeavy(s){ const letters=(s.match(/[A-Za-z]/g)||[]).length; const total=(s.match(/\S/g)||[]).length; return total>0 && letters/total > 0.5; }

const rows = [];
for (const [code, native] of LANGS) {
  const before = errs.length;
  await page.evaluate(c => window.Chitti.lang.set(c), code);
  await page.waitForTimeout(code==='en'?200:1400); // allow lazy pack load + apply
  const r = await page.evaluate((args) => {
    const [base] = args;
    // measure how many baseline english strings are now translated (no longer present verbatim)
    const bodyText = document.body.innerText;
    let stillEnglish = 0, translated = 0;
    for (const s of base) {
      if (bodyText.includes(s)) stillEnglish++; else translated++;
    }
    // raw key leak check
    const rawKeys = (bodyText.match(/\b[a-z]+\.[a-z_]+\.[a-z_]+\b/g) || []).filter(k => /^(med|hdr|tab|switch|header)\./.test(k));
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
    const htmlLang = document.documentElement.lang;
    const dir = document.documentElement.dir;
    return { translated, stillEnglish, total: base.length, rawKeys: [...new Set(rawKeys)].slice(0,5), overflow, htmlLang, dir };
  }, [baselineStrings]);
  const newErrs = errs.length - before;
  const coverage = r.total ? Math.round((r.translated / r.total) * 100) : 0;
  // en baseline: coverage will be ~0 translated (strings stay english) — handle: en passes by definition
  const pass = code==='en'
    ? (newErrs===0 && !r.overflow && r.htmlLang==='en')
    : (newErrs===0 && !r.overflow && r.rawKeys.length===0 && coverage>=60 && r.htmlLang===code);
  rows.push({ code, native, coverage: code==='en'?100:coverage, errs:newErrs, rawKeys:r.rawKeys, overflow:r.overflow, htmlLang:r.htmlLang, dir:r.dir, pass });
  console.log(`${pass?'✅':'❌'} ${code.padEnd(4)} ${native.padEnd(11)} cov=${(code==='en'?100:coverage)+'%'} err=${newErrs} raw=${r.rawKeys.length} ovf=${r.overflow} lang=${r.htmlLang} dir=${r.dir}`);
}
await b.close();
const pass = rows.filter(r=>r.pass).length;
const out = { url:URL, baselineStringCount: baselineStrings.length, total: rows.length, pass, fail: rows.length-pass, rows };
writeFileSync('tools/medupi_lang26_result.json', JSON.stringify(out,null,2));
console.log(`\nLANG26_RESULT:${JSON.stringify({ total: rows.length, pass, fail: rows.length-pass, failed: rows.filter(r=>!r.pass).map(r=>r.code) })}`);
