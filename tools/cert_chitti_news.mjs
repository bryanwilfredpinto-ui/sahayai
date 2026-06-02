/**
 * tools/cert_chitti_news.mjs
 *
 * Self-cert for chitti_news.html — renders the page in headless Chrome
 * at 375 px and verifies the LOCKED specs from CTO.md / SKILLS.md / SOP.md.
 *
 * Cert exists because Sire 2026-06-02 was tired of catching non-compliance
 * (3 language dropdowns, speaker stopping at summary, headline navigating
 * to TOI). Python string-checks on the file are NOT a cert. This script
 * actually opens the page, mocks the API, taps the buttons, and observes
 * what the browser does.
 *
 * Rule for the human running this: do NOT report "ready to test" to Sire
 * unless `node tools/cert_chitti_news.mjs` outputs all-GREEN.
 *
 * Eight checks (in order):
 *   §1 PALETTE        no off-Saffron/Navy/Green primary colors
 *   §2 STRIP_PRESENT  every visible .art-card has a .art-strip with 5 buttons
 *   §2 STRIP_ORDER    in spec order — 🔊 🤖 👍 👎 ✏️
 *   §2 NO_DUPLICATE   no visible .chitti-fb-box-bar adjacent to .art-card
 *   §5 ONE_LANG_SEL   exactly one <select> with id containing "lang" is visible
 *   TAP_EXPANDS       tapping a collapsed card adds .expanded
 *   TAP_SPEAKS        same tap triggers SpeechSynthesisUtterance within 1 s
 *   NO_NAVIGATE       tapping the headline does NOT change window.location
 *   SPEAKER_BODY      🔊 on a summary-only article fetches /article/<id>/body
 *
 * Output:
 *   tools/cert_chitti_news_result.json
 *   tools/cert_screenshots/chitti_news_375.png
 *   exit code 0 if all GREEN; 1 otherwise.
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const PAGE_URL  = pathToFileURL(resolve(REPO_ROOT, 'chitti_news.html')).href;
const SHOT_DIR  = resolve(__dirname, 'cert_screenshots');
try { mkdirSync(SHOT_DIR, { recursive: true }); } catch (e) {}
const SHOT_PATH = resolve(SHOT_DIR, 'chitti_news_375.png');
const OUT_PATH  = resolve(__dirname, 'cert_chitti_news_result.json');

// Mock data — one article has a rich content body, one has only a short
// summary so we can verify both the fast-path and the lazy-fetch path.
const MOCK_ARTICLES = [
  {
    id: 1001,
    title: 'PM announces new scheme for Indian farmers',
    summary: 'A short RSS summary blurb.',
    content:
      'In a major announcement today, the Prime Minister unveiled a new ' +
      'scheme aimed at supporting Indian farmers across the country. The ' +
      'scheme includes direct income support, soil-health cards, and a ' +
      'crop-insurance backstop. State governments will administer the ' +
      'rollout starting next quarter. Farmers groups welcomed the move ' +
      'but cautioned that implementation gaps from previous schemes must ' +
      'be addressed. Experts said the budget allocation is adequate but ' +
      'monitoring will be key. The opposition demanded a parliamentary ' +
      'review of disbursement criteria. Beneficiary registration begins ' +
      'on the first of next month through the official portal and ' +
      'common service centres in every district.',
    link: 'https://www.example-news.in/pm-announces-new-scheme-for-farmers',
    source_name: 'Example Wire',
    source_slug: 'example-wire',
    image_url: null,
    state: 'india',
    language: 'en',
    category: 'national',
    is_breaking: 0,
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    fetched_at:   new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    factcheck: { verdict: 'verified', symbol: '✅', word: 'VERIFIED' },
  },
  {
    id: 1002,
    title: 'Maharashtra finalises EV policy for state',
    summary:
      'Maharashtra government finalised the long-awaited electric vehicle ' +
      'policy for the state. Brief RSS summary only.',
    content: '',  // ← FORCES the lazy-fetch path through /body endpoint
    link: 'https://www.example-news.in/maharashtra-ev-policy',
    source_name: 'Example Wire',
    source_slug: 'example-wire',
    image_url: null,
    state: 'mh',
    language: 'en',
    category: 'state',
    is_breaking: 0,
    published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    fetched_at:   new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    factcheck: { verdict: 'partial', symbol: '🟡', word: 'PARTIAL' },
  },
];

// Server-side body the /body endpoint should return for article 1002.
const MOCK_EXTRACTED_BODY =
  'The Maharashtra state government has finalised its electric vehicle ' +
  'policy after months of public consultation. The policy targets a 30 ' +
  'percent EV penetration in new vehicle sales by 2030 and provides ' +
  'subsidies for two-wheelers, three-wheelers, and four-wheelers in ' +
  'phased tranches. Public charging infrastructure will be built along ' +
  'all major highways within the state with a target of one charger ' +
  'every 25 kilometres. Tax exemptions for first-time EV buyers were ' +
  'also announced. Industry associations welcomed the policy and said ' +
  'it would help Maharashtra retain its leadership position in the ' +
  'EV manufacturing sector. Several Indian and global OEMs operate ' +
  'plants in the state. Implementation begins in the next financial year.';

// ────────────────────────────────────────────────────────────────────
// CSS color allowlist — locked palette + neutrals from the rebuilt page
// (#FFFFFF / #F9FAFB / #E5E7EB / #6B7280 / #1A1A1A) + the few rgba()
// derivatives the article-card uses for hover hints.
// Anything OTHER than these in a button's background or border color is
// a §1 palette violation worth flagging.
const ALLOWED_HEX = new Set([
  '#FF9933', '#000080', '#138808',                  // §1 brand
  '#FFFFFF', '#F9FAFB', '#E5E7EB',                  // surface
  '#6B7280', '#1A1A1A',                             // text
  '#FFF8F0',                                        // hover hint
  '#B45309', '#B91C1C', '#FBF8F1',                  // warn / red / placeholder bg
]);

function normHex(s) {
  const m = (s || '').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  const h = (n) => Number(n).toString(16).toUpperCase().padStart(2, '0');
  return '#' + h(m[1]) + h(m[2]) + h(m[3]);
}

// ────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Track URL changes during the test — used by NO_NAVIGATE check.
  const navHits = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) navHits.push(f.url());
  });

  // Track speech utterances via window.speechSynthesis.speak stub.
  // Stubbed BEFORE the page scripts run so they see our wrapper.
  await page.addInitScript(() => {
    window.__speakLog = [];
    if (window.speechSynthesis) {
      const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (utterance) => {
        try {
          window.__speakLog.push({
            text: (utterance && utterance.text) || '',
            lang: (utterance && utterance.lang) || '',
            at: Date.now(),
          });
        } catch (e) {}
        // Don't actually call orig — headless Chrome's TTS will fail anyway
        // and we don't want audio in CI.
      };
    }
  });

  // Track which API endpoints got called.
  const apiHits = [];

  // Mock the API. Match the host the page targets (chitti-news-api-production
  // .up.railway.app); intercept feed + body endpoints.
  await page.route('**://chitti-news-api-production.up.railway.app/**', async (route) => {
    const url = route.request().url();
    apiHits.push(url);
    if (url.includes('/api/news/feed')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: MOCK_ARTICLES,
          count: MOCK_ARTICLES.length,
          state: 'india', language: 'en', category: 'national',
          speak_en: '2 stories.',
          coverage: { per_category: { national: 1, state: 1 }, total_in_language: 2 },
        }),
      });
      return;
    }
    if (url.includes('/api/news/article/1002/body')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          article_id: 1002,
          body: MOCK_EXTRACTED_BODY,
          word_count: MOCK_EXTRACTED_BODY.split(/\s+/).length,
          cached: false,
          source: 'extracted',
        }),
      });
      return;
    }
    if (url.includes('/api/news/article/1001/body')) {
      // article 1001 has rich content already; this should NOT be called.
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ body: MOCK_ARTICLES[0].content, source: 'rss_content' }) });
      return;
    }
    // Anything else — empty 200.
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // The page also loads chitti_a11y.js — block it so we don't depend on
  // network for the cert. Substrate features tested via the in-card strip.
  await page.route('**/chitti_a11y.js', (r) => r.fulfill({
    status: 200, contentType: 'application/javascript', body: '/* stubbed by cert */',
  }));

  const initialUrl = PAGE_URL;
  await page.goto(initialUrl);
  await page.waitForSelector('#feed-root', { timeout: 10000 });
  await page.waitForFunction(
    () => document.querySelectorAll('#feed-root .art-card').length >= 2,
    { timeout: 8000 },
  ).catch(() => {});

  const checks = [];
  const add = (label, ok, detail) =>
    checks.push({ label, ok: !!ok, detail: detail || '' });

  // ── §1 PALETTE ───────────────────────────────────────────────────
  const paletteViolations = await page.$$eval(
    '.art-strip button, .filter-row select, .filter-row button, header *, .legal-bar',
    (els, allowed) => {
      const out = [];
      for (const el of els) {
        if (!el.offsetWidth && !el.offsetHeight) continue;
        const s = getComputedStyle(el);
        for (const prop of ['backgroundColor', 'borderColor', 'color']) {
          const v = s[prop];
          if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          const m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (!m) continue;
          const hx = (n) => Number(n).toString(16).toUpperCase().padStart(2, '0');
          const hex = '#' + hx(m[1]) + hx(m[2]) + hx(m[3]);
          if (!allowed.includes(hex)) {
            out.push({ tag: el.tagName, cls: el.className.toString().slice(0, 40),
                       prop, hex });
          }
        }
      }
      return out;
    },
    [...ALLOWED_HEX],
  );
  add('§1 PALETTE — no off-locked colors in buttons / filters / header',
      paletteViolations.length === 0,
      paletteViolations.length
        ? `${paletteViolations.length} violations: ${JSON.stringify(paletteViolations.slice(0, 3))}`
        : 'clean');

  // ── §2 STRIP_PRESENT ─────────────────────────────────────────────
  const stripStats = await page.$$eval('.art-card', (cards) =>
    cards.map((c) => {
      const strip = c.querySelector('.art-strip');
      const btns  = strip ? [...strip.querySelectorAll('button')] : [];
      return { id: c.id, hasStrip: !!strip, btnCount: btns.length,
               btnText: btns.map((b) => b.textContent.trim().slice(0, 12)) };
    }),
  );
  const allHaveStrip = stripStats.every((s) => s.hasStrip && s.btnCount === 5);
  add('§2 STRIP_PRESENT — every .art-card has a 5-button .art-strip',
      allHaveStrip,
      allHaveStrip ? `${stripStats.length} cards, all 5/5` : JSON.stringify(stripStats));

  // ── §2 STRIP_ORDER — 🔊 🤖 👍 👎 ✏️ ───────────────────────────
  const SPEC = ['🔊', '🤖', '👍', '👎', '✏️'];
  const orderOk = stripStats.every((s) =>
    s.btnText.every((t, i) => t.startsWith(SPEC[i])),
  );
  add('§2 STRIP_ORDER — 🔊 🤖 👍 👎 ✏️ in spec sequence',
      orderOk,
      orderOk ? 'all cards in spec order' :
        'order broken: ' + JSON.stringify(stripStats.map((s) => s.btnText)));

  // ── §2 NO_DUPLICATE — substrate bar must not be visible alongside in-card strip ──
  const dupCount = await page.$$eval('.art-card + .chitti-fb-box-bar',
    (els) => els.filter((e) => e.offsetWidth > 0 || e.offsetHeight > 0).length);
  add('§2 NO_DUPLICATE — no visible substrate bar adjacent to .art-card',
      dupCount === 0,
      dupCount === 0 ? 'none found' : `${dupCount} visible duplicates`);

  // ── §5 ONE_LANG_SEL — exactly one visible <select> for language ──
  const langSelects = await page.$$eval(
    'select',
    (els) => els
      .filter((e) => e.offsetWidth > 0 && e.offsetHeight > 0)
      .filter((e) => /lang/i.test(e.id) || /lang/i.test(e.getAttribute('aria-label') || ''))
      .map((e) => e.id),
  );
  add('§5 ONE_LANG_SEL — exactly one visible language <select>',
      langSelects.length === 1,
      `visible: ${JSON.stringify(langSelects)}`);

  // ── TAP_EXPANDS + TAP_SPEAKS — tap the FIRST card, observe ──────
  const cardSel = '.art-card[id="art-1001"]';
  await page.evaluate(() => { window.__speakLog = []; });
  const speakBefore = await page.evaluate(() => window.__speakLog.length);
  await page.locator(cardSel).click({ position: { x: 200, y: 60 } });
  await page.waitForTimeout(1000);
  const expanded = await page.locator(cardSel).evaluate((el) =>
    el.classList.contains('expanded'));
  add('TAP_EXPANDS — tap on card adds .expanded',
      expanded === true,
      `class after tap: ${expanded ? 'expanded' : 'NOT expanded'}`);

  const speakAfter = await page.evaluate(() => window.__speakLog);
  const speakHit = speakAfter.length > speakBefore;
  add('TAP_SPEAKS — same tap triggered SpeechSynthesisUtterance',
      speakHit,
      speakHit
        ? `text "${speakAfter[speakAfter.length - 1].text.slice(0, 60)}…"`
        : 'NO utterance logged within 1 s');

  // ── NO_NAVIGATE — page is still chitti_news.html ─────────────────
  // Compare basenames so Windows file:// case-normalisation differences
  // don't falsely flag a successful in-page interaction as a navigation.
  // The real failure mode we're guarding against is: page jumped to
  // timesofindia.com / livemint.com / thehindu.com etc.
  const currentUrl = page.url();
  const stillHere = /chitti_news\.html(?:$|\?|#)/i.test(currentUrl);
  add('NO_NAVIGATE — still on chitti_news.html after tapping the headline',
      stillHere,
      stillHere ? `URL: ${currentUrl}`
                : `LEFT chitti_news.html → ${currentUrl}`);

  // ── BODY_VISIBLE — after tapping a card, the .art-fullbody must
  // become populated with substantive text within 5 seconds. Sire
  // 2026-06-02: "If I tap a card and don't see the news, the product
  // is useless." This gate blocks any regression where tap-to-expand
  // doesn't bring the body into the DOM.
  await page.waitForFunction(
    () => {
      const fb = document.querySelector('.art-card.expanded .art-fullbody');
      if (!fb) return false;
      const txt = (fb.textContent || '').trim();
      if (txt === '' || /^Loading full news/i.test(txt) || /^Tap to fetch/i.test(txt)) return false;
      return txt.length >= 80;
    },
    { timeout: 5000 },
  ).catch(() => {});
  const fullbody = await page.evaluate(() => {
    const fb = document.querySelector('.art-card.expanded .art-fullbody');
    return fb ? (fb.textContent || '').trim().slice(0, 120) : '(no .art-fullbody found)';
  });
  add('BODY_VISIBLE — full news body appears in the expanded card',
      fullbody.length >= 80 && !/^Loading/i.test(fullbody) && !/^Tap to fetch/i.test(fullbody),
      `first 120 chars: "${fullbody}"`);

  // ── NO_RAW_TEMPLATE — no NaN<digit> or raw "data-chitti-response"
  // text leaking into the rendered DOM. This catches the class of bug
  // where a `// comment` inside a + string-concat chain makes the next
  // `+` a unary operator that converts a string to NaN, then string-
  // concatenation continues — producing visible text like NaN24633"
  // data-chitti-response data-chitti-section="...". Sire 2026-06-02
  // caught this in production; the cert now blocks any regression.
  const leaks = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        // Skip text nodes whose closest non-text ancestor is a <script>
        // or <style> — that's source code, not rendered content.
        let p = n.parentElement;
        while (p) {
          if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const hits = []; let n;
    while ((n = walker.nextNode())) {
      const t = (n.textContent || '').trim(); if (!t) continue;
      if (/NaN\d/.test(t) || /data-chitti-response/i.test(t)) {
        hits.push(t.slice(0, 120));
      }
    }
    return hits;
  });
  add('NO_RAW_TEMPLATE — no NaN<digit> / raw data-chitti-* text in DOM',
      leaks.length === 0,
      leaks.length === 0 ? 'no template leaks'
                         : `${leaks.length} leaks; first: "${leaks[0]}"`);

  // ── NO_OUTBOUND — no visible <a target="_blank"> in the feed ─────
  // Sire 2026-06-02: any outbound link is a navigation trap for blind
  // users. The speaker must deliver the entire news; users should
  // never need to tap a link to TOI/Mint/Hindu.
  // Expand both cards so this catches links hidden inside .art-body.
  await page.evaluate(() => {
    document.querySelectorAll('.art-card').forEach((c) => c.classList.add('expanded'));
  });
  await page.waitForTimeout(300);
  const outbound = await page.$$eval('#feed-root a[target="_blank"]',
    (els) => els
      .filter((e) => e.offsetWidth > 0 && e.offsetHeight > 0)
      .map((e) => e.href).slice(0, 5));
  add('NO_OUTBOUND — no visible <a target="_blank"> in the feed',
      outbound.length === 0,
      outbound.length === 0 ? 'no outbound links visible'
                            : `${outbound.length} visible outbound links: ${JSON.stringify(outbound)}`);

  // ── SPEAKER_BODY — for article 1002 (summary-only), 🔊 fetches /body ──
  const card1002 = '.art-card[id="art-1002"]';
  // Reset trackers
  const apiHitsBefore = apiHits.length;
  await page.evaluate(() => { window.__speakLog = []; });
  // Collapse the first card so the second is in view
  await page.evaluate(() => {
    const c = document.getElementById('art-1001');
    if (c) c.classList.remove('expanded');
  });
  await page.locator(card1002).scrollIntoViewIfNeeded();
  // Click the 🔊 button directly so we test the speaker code path
  await page.locator(card1002 + ' .art-strip button').first().click();
  // The lazy fetch is async; allow time for the network roundtrip
  await page.waitForTimeout(2500);
  const bodyHit = apiHits.slice(apiHitsBefore)
    .some((u) => u.includes('/api/news/article/1002/body'));
  const speak2 = await page.evaluate(() => window.__speakLog);
  const speakIncludesExtracted = speak2.some((s) =>
    /Maharashtra state government has finalised/.test(s.text));
  add('SPEAKER_BODY — empty a.content triggers GET /article/<id>/body',
      bodyHit,
      bodyHit ? 'endpoint was called' : 'endpoint was NOT called');
  add('SPEAKER_BODY — extracted body actually spoken',
      speakIncludesExtracted,
      speakIncludesExtracted
        ? 'extracted text appears in utterance'
        : 'extracted text NOT in any utterance');

  // ── Screenshot ───────────────────────────────────────────────────
  await page.screenshot({ path: SHOT_PATH, fullPage: true });

  await browser.close();

  // ── Report ──────────────────────────────────────────────────────
  const greens = checks.filter((c) => c.ok).length;
  const reds   = checks.filter((c) => !c.ok).length;
  const overall = reds === 0 ? 'GREEN' : 'RED';

  console.log(`\n${'═'.repeat(72)}`);
  console.log(`CERT chitti_news.html  →  ${overall}  (${greens}/${checks.length})`);
  console.log('═'.repeat(72));
  for (const c of checks) {
    console.log(`  ${c.ok ? '✅' : '❌'}  ${c.label}`);
    if (!c.ok || c.detail) console.log(`        ${c.detail}`);
  }
  console.log(`\nScreenshot:  ${SHOT_PATH}`);
  console.log(`API hits during run (${apiHits.length}):`);
  apiHits.forEach((u) => console.log(`  ${u}`));

  writeFileSync(OUT_PATH, JSON.stringify({
    overall, greens, total: checks.length, checks,
    apiHits, screenshot: SHOT_PATH,
    ranAt: new Date().toISOString(),
  }, null, 2));

  process.exit(reds === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('CERT FAILED to run:', e);
  process.exit(2);
});
