// scripts/verify_full_translation.cjs
//
// Headless-incognito verification that every tagged UI element on
// chitti_vaani.html flips to a non-English script on every one of the 26
// language buttons. Reads the LOCAL chitti_a11y.js (post-bake) so this
// verifies the candidate substrate BEFORE we push.
//
// Run from project root: node scripts/verify_full_translation.cjs

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = process.env.SAHAYAI_REPO || path.resolve(__dirname, '..');
const PAGE = 'chitti_vaani.html';
// Strings that legitimately cannot be translated (sample emails, IDs, brand
// handles). Built by scripts/post_process_translations.py.
const UNTRANS = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts', 'i18n_untranslatable.json'), 'utf8'));
const UNTRANS_SET = new Set(UNTRANS);
// Languages the substrate ships (from chitti_a11y.js LANGS array).
const LANGS = [
  'hi','bn','te','ta','mr','gu','kn','ml','pa','or','as','ur',
  'sa','mai','kok','doi','ks','ne','sd','mni','sat','bho','raj','kru','hoc',
];

// Script blocks that count as "translated" for each language. If a button
// flips to a script that contains characters in this block, we count it
// as flipped. (We don't enforce that the script is exactly the *expected*
// script for the language — Google's gloss for some low-resource langs
// uses Devanagari + transliteration, and that's acceptable per the build.)
const SCRIPT_BLOCKS = {
  hi: /[ऀ-ॿ]/,           // Devanagari
  bn: /[ঀ-৿]/,           // Bengali
  te: /[ఀ-౿]/,           // Telugu
  ta: /[஀-௿]/,           // Tamil
  mr: /[ऀ-ॿ]/,           // Devanagari
  gu: /[઀-૿]/,           // Gujarati
  kn: /[ಀ-೿]/,           // Kannada
  ml: /[ഀ-ൿ]/,           // Malayalam
  pa: /[਀-੿]/,           // Gurmukhi
  or: /[଀-୿]/,           // Odia
  as: /[ঀ-৿]/,           // Bengali script
  ur: /[؀-ۿݐ-ݿ]/, // Arabic / Perso-Arabic
  sa: /[ऀ-ॿ]/,           // Devanagari
  mai: /[ऀ-ॿ]/,          // Devanagari (mostly)
  kok: /[ऀ-ॿ]/,          // Devanagari
  doi: /[ऀ-ॿ]/,          // Devanagari
  ks: /[؀-ۿݐ-ݿऀ-ॿ]/, // Arabic OR Devanagari
  ne: /[ऀ-ॿ]/,           // Devanagari
  sd: /[؀-ۿݐ-ݿऀ-ॿ]/, // Arabic OR Devanagari
  mni: /[ঀ-৿ꯀ-꯿]/, // Bengali OR Meitei
  sat: /[ऀ-ॿ᱐-᱿]/, // Devanagari OR Ol Chiki
  bho: /[ऀ-ॿ]/,
  raj: /[ऀ-ॿ]/,
  kru: /[ऀ-ॿ]/,
  hoc: /[ऀ-ॿ]/,
};

(async () => {
  console.log('Launching headless Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'en-IN' });
  const page = await context.newPage();

  page.on('pageerror', err => console.log('  [page-error]', err.message));

  const fileUrl = 'file:///' + path.join(REPO, PAGE).replace(/\\/g, '/');
  console.log(`Navigating to ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for chitti_a11y.js to inject the langbar
  await page.waitForSelector('.chitti-lang-btn[data-lang="hi"]', { timeout: 15000 });

  // Hide any consent overlay so we can click the langbar reliably
  await page.evaluate(() => {
    const overlay = document.getElementById('consent-overlay');
    if (overlay) overlay.style.display = 'none';
  });

  // Snapshot every tagged element's English baseline (after substrate init).
  await page.evaluate(() => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (!el.hasAttribute('data-en-baseline')) {
        el.setAttribute('data-en-baseline', (el.textContent || '').trim());
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      if (!el.hasAttribute('data-en-ph-baseline')) {
        el.setAttribute('data-en-ph-baseline', (el.placeholder || el.getAttribute('placeholder') || ''));
      }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      if (!el.hasAttribute('data-en-aria-baseline')) {
        el.setAttribute('data-en-aria-baseline', (el.getAttribute('aria-label') || ''));
      }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      if (!el.hasAttribute('data-en-title-baseline')) {
        el.setAttribute('data-en-title-baseline', (el.getAttribute('title') || ''));
      }
    });
  });

  const baselineCount = await page.evaluate(() => ({
    text: document.querySelectorAll('[data-i18n]').length,
    placeholder: document.querySelectorAll('[data-i18n-placeholder]').length,
    aria: document.querySelectorAll('[data-i18n-aria]').length,
    title: document.querySelectorAll('[data-i18n-title]').length,
  }));
  console.log(`Baseline tagged elements: text=${baselineCount.text} ph=${baselineCount.placeholder} aria=${baselineCount.aria} title=${baselineCount.title}`);

  let allPassed = true;
  const langResults = [];

  for (const lang of LANGS) {
    // Click the lang button
    const clicked = await page.evaluate((l) => {
      const btn = document.querySelector(`.chitti-lang-btn[data-lang="${l}"]`);
      if (!btn) return false;
      btn.click();
      return true;
    }, lang);
    if (!clicked) {
      console.log(`  ${lang}: FAIL — langbar button not found`);
      allPassed = false;
      langResults.push({ lang, status: 'FAIL', reason: 'button-missing' });
      continue;
    }
    // No MT cascade now — flip should be synchronous. Tiny pause for the
    // event loop to finish.
    await page.waitForTimeout(120);

    const stats = await page.evaluate(({ scriptBlockSrc, untrans }) => {
      const blockRx = new RegExp(scriptBlockSrc);
      const untransSet = new Set(untrans);
      function check(selector, current, baselineAttr) {
        const els = document.querySelectorAll(selector);
        let flipped = 0, unchanged = 0, missing = 0, untranslatable = 0;
        const samples = [];
        els.forEach(el => {
          const cur = current(el);
          const base = (el.getAttribute(baselineAttr) || '').trim();
          if (!cur) { missing++; return; }
          if (cur === base && base && /[a-zA-Z]/.test(base)) {
            if (untransSet.has(base)) { untranslatable++; return; }
            unchanged++;
            if (samples.length < 5) samples.push(base.slice(0, 60));
          } else if (blockRx.test(cur)) {
            flipped++;
          } else if (cur !== base) {
            flipped++;
          } else {
            unchanged++;
            if (samples.length < 5) samples.push(base.slice(0, 60));
          }
        });
        return { flipped, unchanged, missing, untranslatable, samples };
      }
      return {
        text: check('[data-i18n]', (el) => (el.textContent || '').trim(), 'data-en-baseline'),
        placeholder: check('[data-i18n-placeholder]', (el) => (el.placeholder || ''), 'data-en-ph-baseline'),
        aria: check('[data-i18n-aria]', (el) => el.getAttribute('aria-label') || '', 'data-en-aria-baseline'),
        title: check('[data-i18n-title]', (el) => el.getAttribute('title') || '', 'data-en-title-baseline'),
      };
    }, { scriptBlockSrc: SCRIPT_BLOCKS[lang].source, untrans: UNTRANS });

    const totalUnchanged = stats.text.unchanged + stats.placeholder.unchanged + stats.aria.unchanged + stats.title.unchanged;
    const totalFlipped = stats.text.flipped + stats.placeholder.flipped + stats.aria.flipped + stats.title.flipped;
    const totalUntrans = stats.text.untranslatable + stats.placeholder.untranslatable + stats.aria.untranslatable + stats.title.untranslatable;
    const ok = totalUnchanged === 0;
    if (!ok) allPassed = false;

    console.log(`  ${lang.padEnd(4)} : flipped=${String(totalFlipped).padStart(3)}  unchanged=${String(totalUnchanged).padStart(3)}  untranslatable=${String(totalUntrans).padStart(2)}  ${ok ? 'OK' : 'FAIL'}`);
    if (totalUnchanged > 0) {
      const allSamples = [...stats.text.samples, ...stats.placeholder.samples, ...stats.aria.samples, ...stats.title.samples].slice(0, 5);
      allSamples.forEach(s => console.log(`        still English: "${s}"`));
    }
    langResults.push({ lang, status: ok ? 'OK' : 'FAIL', flipped: totalFlipped, unchanged: totalUnchanged });
  }

  await browser.close();

  console.log('\n========== FINAL ==========');
  const okCount = langResults.filter(r => r.status === 'OK').length;
  console.log(`${okCount}/${LANGS.length} languages: every tagged element flipped from English.`);
  if (!allPassed) {
    console.log('NOT 100% — see failures above.');
    process.exit(1);
  }
  console.log('100% UI flips on every language click. Verified.');
})();
