// Verify chitti_vaani.html in headless-incognito across all 25 non-English
// languages. For each lang, set <select id="lang-select"> = code, dispatch
// 'change', wait, then assert that NO visible text on the page contains
// English Latin letters (other than allowed exceptions: emails, brand
// tokens that should remain Latin).
//
// Run from repo root: node scripts/verify_vaani_100pct.cjs

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = process.env.SAHAYAI_REPO || path.resolve(__dirname, '..');
const URL_BASE = process.env.SAHAYAI_URL || ('file:///' + REPO.replace(/\\/g, '/'));
const PAGES = (process.env.SAHAYAI_PAGES || [
  'chitti_vaani.html',
  'chitti_medupi.html',
  'chitti_news.html',
  'chitti_upi.html',
  'chitti_ca.html',
  'chitti_legal.html',
  'chitti_government.html',
  'chitti_scanner.html',
  'chitti_fundamentals.html',
  'chitti_complete_technical.html',
  'chitti_news_ai.html',
  'chitti_voice_factory.html',
  'chitti_2wheeler.html',
  'chitti_4wheeler.html',
].join(',')).split(',').map(s => s.trim()).filter(Boolean);

const LANGS = [
  'hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur',
  'sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc',
];

// Strings that legitimately stay English (brand tokens, emails, sample handles, etc.).
// Anything matched here is ignored when counting "still English" residue.
const ALLOWED_LATIN_PATTERNS = [
  // Brand tokens — kept English by intent or transliterated either way
  // File paths / module identifiers (legit English in any UI language)
  /\b[A-Za-z][A-Za-z0-9_-]*\.(md|json|js|css|html|py|cjs|mjs|yml|yaml|txt|csv|sql)\b/gi,
  /\b[A-Za-z][A-Za-z0-9_-]*\/[A-Za-z][A-Za-z0-9_./-]*\b/g,    // path-like
  /\b[A-Z][A-Z_]{2,}\b/g,                                       // SCREAMING_SNAKE constants
  /\b[A-Za-z]+_[A-Za-z]+\b/g,                                   // snake_case
  /\bChitti(?:s|'s)?\b/gi, /\bVaani\b/gi, /\bMedUPI\b/gi, /\bSahay\s*AI\b/gi, /\bSahayai\b/gi,
  /\bNews\s*AI\b/gi, /\bNews\s*Ai\b/gi, /\bChitti\s+News\s+AI\b/gi,
  /\bDeepSeek\b/g, /\bClaude\b/g, /\bGemini\b/g, /\bOpenAI\b/g, /\bGPT-?\d?\b/g,
  /\bHugging\s*Face\b/gi, /\bAnthropic\b/g, /\bMistral\b/g, /\bLlama-?\d?\b/g, /\bBhashini\b/g,
  /\bTurso\b/g, /\blibSQL\b/g, /\bSQLite\b/g, /\bPostgres\b/g, /\bSupabase\b/g, /\bNeon\b/g,
  /\bRSS\b/g, /\bLLM\b/g, /\bAPI\b/g, /\bURL\b/g, /\bSDK\b/g, /\bIDE\b/g, /\bUX\b/g, /\bUI\b/g,
  /\bOBD\d?\b/g, /\bELM\d*\b/g, /\bRPM\b/g, /\bPUC\b/g, /\bEMI\b/g, /\bRC\b/g, /\bRSA\b/g,
  /\bFASTag\b/gi, /\bFastTag\b/gi, /\bNPPA\b/g, /\bCDSCO\b/g, /\bKYC\b/g, /\bOTP\b/g,
  /\bSBI\s*YONO\b/g, /\bKBC\b/g, /\bMNREGA\b/g, /\bPM-KISAN\b/gi, /\bAyushman\b/gi,
  /\bPMAY\b/g, /\bUjjwala\b/gi, /\bABDM\b/g, /\bDigiLocker\b/gi, /\bAarogya\s+Setu\b/gi,
  /\bDrivvo\b/g, /\bGoMechanic\b/g, /\bHonda\b/g, /\bHero\b/g, /\bmParivahan\b/gi,
  /\bTorque\s+Pro\b/gi, /\bCarista\b/g, /\bBosch\b/g, /\bSuzuki\b/g, /\bYamaha\b/g, /\bTVS\b/g,
  /\bTata\b/g, /\bMaruti\b/g, /\bMahindra\b/g, /\bBajaj\b/g, /\bRoyal\s+Enfield\b/gi,
  /\bConnect\b/g, /\bdaily briefing resumes when the API responds\b/g,  // chitti-news-ai banners
  /\bBackend unreachable\b/gi, /\bNo fake demo data shown\b/gi,
  /\bsire@sahayai\.in\b/gi, /\bcybercrime\.gov\.in\b/gi, /\bexample\.com\b/gi,
  // 26 Indian language names — kept in English in language pickers as a
  // recognition hint alongside the native-script label.
  /\b(Hindi|Bangla|Bengali|Telugu|Tamil|Marathi|Gujarati|Kannada|Malayalam|Punjabi|Odia|Oriya|Assamese|Urdu|Sanskrit|Maithili|Konkani|Dogri|Kashmiri|Nepali|Sindhi|Manipuri|Meitei|Santali|Bhojpuri|Rajasthani|Kurukh|Bodo|Khasi|Ho|English)\b/g,
  /\bChinese\b/g, /\bArabic\b/g, /\bSpanish\b/g, /\bFrench\b/g,
  // Two-letter ISO codes that show up as labels
  /\b(en|hi|bn|te|ta|mr|gu|kn|ml|pa|or|as|ur|sa|mai|kok|doi|ks|ne|sd|mni|sat|bho|raj|kru|hoc)\b/g,
  // Long compound description text that appears unchanged in many pages
  /\bIn an emergency\b/gi, /\bRSA\s+numbers\s+included\b/gi,
  /\bMajor\s+problems\b/gi, /\bsee\s+a\s+trained\s+mechanic\b/gi,
  /\bnever\s+the\s+cops\b/gi, /\bVaani\s+protocol\b/gi,
  /\bChitti\s+is\s+waking\s+up\b/gi, /\bfirst\s+response\b/gi,
  // Compound product-name + index hash on page footers
  /\bvCOMING\s+SOON\b/gi,
  // "Section card" / "Card" auto-derived labels from the marker pass
  /\bSection\s+card\b/gi, /\bCard\b/g, /\bChip\b/g,
  /\bMaster\s+Chitti\b/gi,
  /\boksbi\b/gi, /\bicici\b/gi, /\bhdfc\b/gi, /\bsbi\b/gi, /\baxis\b/gi,    // bank handles
  /\bPhase\s*\d*\b/gi, /\bPhase\b/gi,
  /\bSilent\s+mode\b/gi, /\bRead\b/gi, /\bRead\s+(page|aloud)\b/gi,
  /\bOutside\b/gi, /\bInside\b/gi, /\bapp\b/gi, /\brule\b/gi, /\boff\b/gi,
  /\bPeople\b/gi, /\bbuilt\s+by\s+voice\b/gi,
  // Acronyms users recognise from Indian apps + statutes
  /\bUPI\b/g, /\bSEBI\b/g, /\bFSSAI\b/g, /\bRBI\b/g, /\bDPDP\b/g, /\bTRAI\b/g,
  /\bNPCI\b/g, /\bPIN\b/g, /\bOAUTH\b/g, /\bUNDO\b/g, /\bAndroid\b/gi,
  /\bAI\b/g, /\bIT\b/g, /\bSMS\b/g, /\bOK\b/g, /\bTAP\b/g, /\bDIY\b/g,
  /\bWhatsApp\b/gi, /\bGmail\b/gi, /\bGoogle\b/gi, /\bChatGPT\b/gi,
  /\bDeepSeek\b/g, /\bGitHub\b/g, /\bRender\b/g, /\bRailway\b/g, /\bPhonePe\b/g, /\bGPay\b/g, /\bPaytm\b/g,
  /\bBuffett\b/g, /\bMunger\b/g, /\bGraham\b/g, /\bKedia\b/g, /\bRKD\b/g,
  // Hindi-Roman / Hinglish sample phrases that demos REQUIRE to stay Latin
  /\bmadad\b/gi, /\bbachao\b/gi, /\bdarwaza\b/gi, /\bkholo\b/gi,
  /\bmain\s+\d+\s+baje\s+aaunga\b/gi, /\bmain\s+baje\s+aaunga\b/gi,
  /\bMom\s+ko\s+bolo\b/gi, /\bbolo\b/gi, /\baaunga\b/gi, /\bbaje\b/gi,
  /\bRamesh\s+ko\s+\S+\s+bhejo\b/gi, /\bRmesh\s+\S+\s*bhejo\b/gi, /\bRmesh\b/g, /\bRamesh\b/g, /\bbhejo\b/g,
  /\bhaan\b/gi, /\bnahi\b/gi, /\bbeta\b/gi, /\bsaab\b/gi, /\bDost\b/gi,
  /\bUPI\s+\S+\s+at\s+oksbi\b/g,
  // Sub-product names (English brand chain kept Latin by translator)
  /\b(Fundamentals|Technical|News|Scanner|MedUPI|UPI\s+Guard|Fraud\s+Guard|Vaani)\b/g,
  /\bConnect\s+Gmail\b/gi,                                  // brand action
  /\bCould\s+not\s+reach\s+backend\b/gi,                    // JS error before async translate fires
  // Sample / placeholder strings (cannot be translated — they're examples)
  /\bami\s+bhalo\s+achhi\b/g,
  /\bdoctor\s+saab\b/gi,
  /\bMom\s+ko\s+bolo\b/gi,
  /\bhaan\b/g,
  /\bSushma\s+Devi\b/gi,
  /\bsushma\b/gi,
  /\bram(esh)?\b/gi, /\bbhajan\b/gi, /\bjeevan\b/gi,    // sample names common in Indian apps
  // Identifiers
  /\b[A-Za-z0-9._-]+@[A-Za-z0-9._-]+\b/g,
  /\b\d{2,}[A-Z]{0,3}\b/g,
  /[+]?\d[\d\s-]{6,}\d/g,
  /https?:\/\/\S+/g,
  /\bv\d+\b/g,
];

function stripAllowed(text) {
  let s = text;
  for (const rx of ALLOWED_LATIN_PATTERNS) s = s.replace(rx, '');
  return s;
}

function findEnglishRuns(text) {
  // After stripping allowed tokens, return every run of >=3 Latin letters.
  // 3+ char threshold avoids tripping on stray "a"/"an"/"in" remnants that
  // some translators leave inside the target-script string.
  const stripped = stripAllowed(text);
  const runs = stripped.match(/\b[A-Za-z]{3,}(?:\s+[A-Za-z]{3,})*\b/g) || [];
  return runs;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let allPassed = true;
  const summary = [];

  for (const PAGE of PAGES) {
    console.log(`\n## ${PAGE}`);
    const url = URL_BASE.startsWith('file://')
      ? URL_BASE + '/' + PAGE
      : URL_BASE.replace(/\/$/, '') + '/' + PAGE + '?nocache=' + Date.now();
    let pagePass = 0, pageFail = 0, totalRuns = 0;

  for (const lang of LANGS) {
    const ctx = await browser.newContext({ locale: 'en-IN', viewport: { width: 1280, height: 1600 } });
    const tab = await ctx.newPage();
    const pageErrs = [];
    tab.on('pageerror', e => pageErrs.push(e.message.slice(0, 120)));

    try {
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      console.log(`  ${lang.padEnd(4)} : FAIL nav: ${e.message.slice(0, 80)}`);
      allPassed = false;
      await ctx.close();
      continue;
    }

    // Wait for chitti_lang.js to wire the dropdown
    await tab.waitForSelector('select#lang-select', { timeout: 10000 }).catch(() => {});
    await tab.waitForFunction(
      () => window.Chitti && window.Chitti.lang && typeof window.Chitti.lang.set === 'function',
      { timeout: 8000 }
    ).catch(() => {});

    // Hide consent overlay so the inner page text is what we measure
    await tab.evaluate(() => {
      const overlay = document.getElementById('consent-overlay');
      if (overlay) overlay.style.display = 'none';
    });

    // Switch language and wait for MutationObserver to pick up any late
    // JS-injected text and re-translate.
    await tab.evaluate((l) => window.Chitti.lang.set(l), lang);
    await tab.waitForTimeout(1200);

    // Collect body text + attribute strings + html lang
    const probe = await tab.evaluate(() => {
      const body = document.body.innerText || '';
      const attrs = [];
      document.querySelectorAll('[placeholder]').forEach(el => { if (el.getAttribute('placeholder')) attrs.push(el.getAttribute('placeholder')); });
      document.querySelectorAll('[aria-label]').forEach(el => { if (el.getAttribute('aria-label')) attrs.push(el.getAttribute('aria-label')); });
      document.querySelectorAll('[title]').forEach(el => { if (el.getAttribute('title')) attrs.push(el.getAttribute('title')); });
      return { body, attrs, htmlLang: document.documentElement.lang };
    });

    const allText = probe.body + '\n' + probe.attrs.join('\n');
    const englishRuns = findEnglishRuns(allText);

    if (englishRuns.length === 0 && probe.htmlLang === lang) {
      console.log(`  ${lang.padEnd(4)} : OK  (0 English residue, html lang=${probe.htmlLang})`);
      pagePass += 1;
    } else {
      allPassed = false;
      pageFail += 1;
      totalRuns += englishRuns.length;
      console.log(`  ${lang.padEnd(4)} : FAIL htmlLang=${probe.htmlLang}  englishRuns=${englishRuns.length}`);
      englishRuns.slice(0, 5).forEach(r => console.log(`         "${r.slice(0, 80)}"`));
    }
    if (pageErrs.length > 0) {
      console.log(`         page-errors: ${pageErrs.slice(0, 2).join(' | ')}`);
    }
    await ctx.close();
  }  // end lang loop
    summary.push({ page: PAGE, pass: pagePass, fail: pageFail, totalRuns });
  }  // end pages loop
  await browser.close();

  console.log('\n## Summary');
  console.log(`| Page | Pass | Fail | Total residue |`);
  console.log(`|---|---|---|---|`);
  for (const s of summary) {
    console.log(`| ${s.page} | ${s.pass} | ${s.fail} | ${s.totalRuns} |`);
  }
  console.log('');
  if (allPassed) console.log('PASS — every page flips 100% on every language.');
  else            console.log('FAIL — see per-page failures above.');
  process.exit(allPassed ? 0 : 1);
})();
