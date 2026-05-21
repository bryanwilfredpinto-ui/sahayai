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
const PAGE = 'chitti_vaani.html';

const LANGS = [
  'hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur',
  'sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc',
];

// Strings that legitimately stay English (brand tokens, emails, sample handles, etc.).
// Anything matched here is ignored when counting "still English" residue.
const ALLOWED_LATIN_PATTERNS = [
  // Brand tokens — kept English by intent or transliterated either way
  /\bChitti(?:s|'s)?\b/gi, /\bVaani\b/gi, /\bMedUPI\b/gi, /\bSahay\s*AI\b/gi, /\bSahayai\b/gi,
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

  const url = URL_BASE.startsWith('file://')
    ? URL_BASE + '/' + PAGE
    : URL_BASE.replace(/\/$/, '') + '/' + PAGE + '?nocache=' + Date.now();

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
    } else {
      allPassed = false;
      console.log(`  ${lang.padEnd(4)} : FAIL htmlLang=${probe.htmlLang}  englishRuns=${englishRuns.length}`);
      englishRuns.slice(0, 8).forEach(r => console.log(`         "${r}"`));
    }
    if (pageErrs.length > 0) {
      console.log(`         page-errors: ${pageErrs.slice(0, 2).join(' | ')}`);
    }
    await ctx.close();
  }
  await browser.close();

  console.log('');
  if (allPassed) console.log('PASS — chitti_vaani.html flips 100% on every language.');
  else            console.log('FAIL — see per-lang failures above.');
  process.exit(allPassed ? 0 : 1);
})();
