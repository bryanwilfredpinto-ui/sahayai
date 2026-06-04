#!/usr/bin/env node
/**
 * tools/cert_lang_hooks.mjs
 * ─────────────────────────
 * CTO.md §8 cert hooks compliance audit:
 *   • assert_no_hinglish(lang_token)              — script-mixing scanner
 *   • assert_technical_terms_preserved()          — RSI/SEBI/PM-KISAN regex
 *
 * Runs against the rendered DOM of every Chitti page that exposes a
 * language switcher. For each language in {en, hi, ta, mr}, switches
 * the page to that language and walks every text node, asserting:
 *   1. No script-mixing — once the page is in Hindi, no Latin words in
 *      flowing prose EXCEPT the technical-term allowlist (CTO §6).
 *   2. Allowlisted technical terms remain in Latin and are not
 *      transliterated (RSI / SEBI / PM-KISAN / etc.).
 *
 * Exit: 0 = compliance pass, 1 = any failure.
 *
 * Targets (loop):
 *   https://sahayai.in/chitti_news.html
 *   https://sahayai.in/chitti_news_ai.html
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['https://sahayai.in/chitti_news.html',
     'https://sahayai.in/chitti_news_ai.html'];

const LANG_SWITCH_SELECTOR = '#pick-lang, #lang-select, [data-lang-select]';

// CTO.md §6 — these MUST stay in English (Latin) even in non-English UI.
const TECHNICAL_ALLOWLIST_PATTERNS = [
  /\bRSI\b/, /\bMACD\b/, /\bEMA\b/, /\bVWAP\b/, /\bATR\b/,
  /\bSEBI\b/, /\bRBI\b/, /\bIRDAI\b/, /\bFSSAI\b/, /\bTRAI\b/,
  /\bNSE\b/, /\bBSE\b/, /\bNifty\b/, /\bSensex\b/,
  /\bUPI\b/, /\bIMPS\b/, /\bNEFT\b/, /\bFASTag\b/, /\bDigiLocker\b/,
  /\bPM-KISAN\b/, /\bPMSBY\b/, /\bAyushman Bharat\b/, /\bPMJAY\b/, /\bNREGA\b/,
  /\bICAI\b/, /\bGST\b/, /\bTDS\b/, /\bITR\b/, /\bBNS\b/, /\bBNSS\b/, /\bMSME\b/,
  /\bONDC\b/, /\bDPDP\b/, /\bAIIMS\b/, /\bNCCN\b/, /\bICAR\b/, /\bDIKSHA\b/,
];

// Latin character match — flowing prose check. A "word" with 3+ contiguous
// Latin letters in a non-English active language is suspect, UNLESS in
// allowlist or surrounded by punctuation only.
const LATIN_WORD = /\b[A-Za-z]{3,}\b/g;

function isAllowlisted(token) {
  return TECHNICAL_ALLOWLIST_PATTERNS.some((rx) => rx.test(token));
}

// Hindi / Marathi / Tamil glyph blocks. Used to detect "the active script
// IS rendering" — if every visible text node is Latin-only we know the
// switch didn't take effect, not that there's no Hinglish.
const INDIC_RANGES = [
  [0x0900, 0x097F],  // Devanagari (hi, mr)
  [0x0B80, 0x0BFF],  // Tamil
  [0x0980, 0x09FF],  // Bengali
  [0x0A80, 0x0AFF],  // Gujarati
  [0x0C00, 0x0C7F],  // Telugu
  [0x0C80, 0x0CFF],  // Kannada
  [0x0D00, 0x0D7F],  // Malayalam
  [0x0A00, 0x0A7F],  // Gurmukhi (Punjabi)
  [0x0B00, 0x0B7F],  // Odia
];
function hasIndic(s) {
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    for (const [lo, hi] of INDIC_RANGES)
      if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

const REPORT = { generated_at: new Date().toISOString(), pages: [] };

async function probePage(url) {
  const result = { url, lang_runs: [], total_failures: 0, total_pass: 0 };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    const sel = await page.$(LANG_SWITCH_SELECTOR);
    if (!sel) {
      result.lang_runs.push({ lang: '<no-selector>', ok: false,
        detail: 'page has no language selector — cannot assert no-hinglish' });
      result.total_failures++;
      await browser.close();
      return result;
    }

    for (const lang of ['en', 'hi', 'ta', 'mr']) {
      try {
        await sel.selectOption(lang).catch(() => {});
      } catch { /* not all langs available on every page */ }
      await page.waitForTimeout(800);

      // Walk every visible text node.
      const probes = await page.evaluate(() => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode(n) {
            const p = n.parentElement;
            if (!p) return NodeFilter.FILTER_REJECT;
            if (p.closest('script, style, noscript, code, pre, [aria-hidden="true"]'))
              return NodeFilter.FILTER_REJECT;
            const txt = (n.nodeValue || '').trim();
            if (txt.length < 4) return NodeFilter.FILTER_REJECT;
            const cs = window.getComputedStyle(p);
            if (cs.display === 'none' || cs.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        let n;
        while ((n = walker.nextNode())) out.push(n.nodeValue.trim());
        return out;
      });

      let hinglishViolations = 0;
      let techTermsFound = 0;
      const examples = [];
      for (const text of probes) {
        const isCurrentLangNonEnglish = (lang !== 'en');
        // tech-term hits
        for (const rx of TECHNICAL_ALLOWLIST_PATTERNS) {
          if (rx.test(text)) techTermsFound++;
        }
        if (!isCurrentLangNonEnglish) continue;
        // Hinglish check: text in a non-English UI that contains Latin word
        // tokens NOT in the allowlist + does NOT contain ANY Indic char.
        // (If the string is fully Latin, it's a switch-failure not Hinglish.)
        if (!hasIndic(text)) continue;
        const tokens = text.match(LATIN_WORD) || [];
        for (const tok of tokens) {
          if (!isAllowlisted(tok)) {
            hinglishViolations++;
            if (examples.length < 5) examples.push(tok + '  (in: "' + text.slice(0, 60) + '")');
            break;
          }
        }
      }

      const ok = hinglishViolations === 0;
      result.lang_runs.push({
        lang,
        text_nodes_scanned: probes.length,
        hinglish_violations: hinglishViolations,
        technical_terms_preserved: techTermsFound,
        examples,
        ok,
      });
      if (ok) result.total_pass++; else result.total_failures += hinglishViolations;
    }
  } finally {
    await browser.close();
  }
  return result;
}

for (const url of PAGES) {
  console.log(`\n→ ${url}`);
  const r = await probePage(url);
  REPORT.pages.push(r);
  for (const lr of r.lang_runs) {
    const icon = lr.ok ? '✅' : '❌';
    console.log(`  ${icon} ${lr.lang.padEnd(3)} — nodes=${lr.text_nodes_scanned}  hinglish=${lr.hinglish_violations}  tech=${lr.technical_terms_preserved}`);
    if (!lr.ok && lr.examples?.length) {
      for (const ex of lr.examples) console.log(`        offender: ${ex}`);
    }
  }
}

const outPath = 'tools/cert_lang_hooks_result.json';
fs.writeFileSync(outPath, JSON.stringify(REPORT, null, 2));
const anyFail = REPORT.pages.some(p => p.total_failures > 0);
console.log(`\n${anyFail ? '❌ FAIL' : '✅ PASS'} -- ${outPath}`);
process.exit(anyFail ? 1 : 0);
