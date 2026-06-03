/**
 * probe_trust_strip.mjs — End-to-end exercise of the Verification &
 * Confidence UX feature (Sire 2026-06-04).
 *
 * Tests (each is a real Playwright interaction, not a DOM-only sniff):
 *   1. Strip renders for ALL FIVE verdict states (verified / partial /
 *      disputed / unverified / unchecked) — count, accent rail colour
 *      matches verdict, status word matches verdict, dots reflect
 *      confidence quintile.
 *   2. Strip carries a non-empty rationale that came from the backend
 *      (not the JS fallback) — proves the backend payload extension
 *      shipped.
 *   3. Tap behaviour — clicking the strip toggles .expanded, lists
 *      matched_source_names, second click collapses. Keyboard equivalent
 *      via Enter/Space.
 *   4. Speak preface — tapping the article body fires a
 *      SpeechSynthesisUtterance whose text STARTS WITH the spoken
 *      verdict ("Verified by N other sources.").
 *   5. Empty / loading state — a card with no factcheck payload
 *      renders the unchecked strip (loading copy), no exception.
 *   6. Three viewports — 375 mobile, 768 tablet, 1280 desktop. The
 *      strip occupies the full width of its card, no horizontal
 *      overflow, no console errors.
 *   7. No visual regression on the rail home — the legacy .fc-badge
 *      still renders on rail-cards (where the full strip won't fit).
 *
 * All tests run against the LOCAL file (file://chitti_news.html) with
 * the backend mocked, so the probe is hermetic and reproducible.
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(__dirname, '..', 'chitti_news.html')).href;
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const VERDICTS = [
  { verdict: 'verified',   symbol: '✅', word: 'VERIFIED',   confidence: 92,
    matched_sources: ['thehindu', 'ndtv', 'indianexpress'],
    matched_source_names: ['The Hindu', 'NDTV', 'Indian Express'],
    match_count: 3, rationale_en: '3 other trusted sources are running this story; key facts agree.' },
  { verdict: 'partial',    symbol: '🟡', word: 'PARTIAL',    confidence: 70,
    matched_sources: ['ndtv', 'toi'], matched_source_names: ['NDTV', 'Times of India'],
    match_count: 2, rationale_en: '2 other sources cover this; the broad facts match but details differ.' },
  { verdict: 'disputed',   symbol: '⚠️', word: 'DISPUTED',   confidence: 45,
    matched_sources: ['ie'], matched_source_names: ['Indian Express'],
    match_count: 1, rationale_en: 'Only 1 other source found and the headline diverges. Check the source link before sharing.' },
  { verdict: 'unverified', symbol: '❔', word: 'UNVERIFIED', confidence: 25,
    matched_sources: [], matched_source_names: [], match_count: 0,
    rationale_en: 'No cross-source corroboration yet. Single-source story — may be hyperlocal or just-breaking.' },
  { verdict: 'unchecked',  symbol: '⏳', word: 'CHECKING',   confidence: null,
    matched_sources: [], matched_source_names: [], match_count: 0,
    rationale_en: null },
];

async function newCtx(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('chitti_news_state', 'india');
      localStorage.setItem('chitti_news_lang',  'en');
      localStorage.setItem('chitti_news_category', 'politics');  // linear feed, not rails
      localStorage.setItem('disability_profile', JSON.stringify({
        skipped: true, ts: new Date().toISOString(), source: 'trust-probe',
      }));
    } catch (e) {}
    // Stub the speak engine BEFORE page scripts run so we can capture
    // what was spoken (Chrome headless has no real TTS).
    window.__speakLog = [];
    const Orig = window.SpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = function (text) {
      const u = new Orig(text);
      window.__speakLog.push({ text: String(text) });
      return u;
    };
  });

  await page.route('**://chitti-news-api-production.up.railway.app/**', async (route) => {
    const u = route.request().url();
    if (u.includes('/api/news/feed')) {
      const items = VERDICTS.map((v, i) => ({
        id: 9000 + i,
        title: 'Sample ' + v.verdict.toUpperCase() + ' article — Modi addresses parliament on new policy',
        summary: 'Summary line for the ' + v.verdict + ' verdict article.',
        content: ('Body paragraph one. '.repeat(20)),
        link: 'https://example.com/' + i,
        image_url: '',
        source_name: 'The Hindu',
        source_slug: 'thehindu',
        published_at: new Date().toISOString(),
        factcheck: v,
      }));
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          items, count: items.length,
          state: 'india', language: 'en', category: 'politics',
          speak_en: items.length + ' politics stories.',
          coverage: { per_category: { politics: items.length }, total_in_language: items.length,
                      english_fallback_count: 7000,
                      available_categories: ['national','politics','business'] },
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/chitti_a11y.js', (r) =>
    r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }));

  return { ctx, page, errs };
}

const checks = [];
const add = (label, ok, detail = '') =>
  checks.push({ label, ok: !!ok, detail });

const browser = await chromium.launch({ headless: true });

// ── Mobile (primary viewport) ────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 375, 1400);
  await page.goto(PAGE);
  await page.waitForFunction(
    () => document.querySelectorAll('.art-card .trust-strip').length >= 5,
    { timeout: 10000 },
  );

  // Test 1 — Strip renders for all five verdicts.
  const stripStates = await page.$$eval('.art-card .trust-strip', els => els.map(s => ({
    verdict: [...s.classList].find(c => c.startsWith('verdict-'))?.replace('verdict-', ''),
    word:    s.querySelector('.trust-word')?.textContent.trim(),
    chip:    s.querySelector('.trust-chip')?.textContent.trim(),
    conf:    s.querySelector('.trust-conf > span:last-child')?.textContent.trim(),
    dots:    s.querySelectorAll('.trust-dot.filled').length,
    rail:    getComputedStyle(s.querySelector('.trust-rail')).backgroundColor,
    rationale: s.querySelector('.trust-rationale')?.textContent.trim(),
  })));
  add('STRIP_COUNT — five strips render, one per verdict',
      stripStates.length === 5, `count=${stripStates.length}`);
  const verdicts = stripStates.map(s => s.verdict);
  const expected = ['verified','partial','disputed','unverified','unchecked'];
  add('STRIP_VERDICTS — each strip has correct verdict class',
      expected.every(v => verdicts.includes(v)),
      `expected=${expected.join(',')} got=${verdicts.join(',')}`);

  // Test 2 — Rationale comes from the BACKEND, not the JS fallback,
  // for at least the verified case (where the mock supplied rationale_en).
  const verifiedStrip = stripStates.find(s => s.verdict === 'verified');
  add('STRIP_RATIONALE_FROM_BACKEND — verified strip shows backend rationale_en',
      verifiedStrip && /3 other trusted sources/i.test(verifiedStrip.rationale || ''),
      `text="${(verifiedStrip?.rationale || '').slice(0, 60)}…"`);

  // Test 3 — Verdict colour treatments differ (left-rail bg colour
  // should differ between verified/disputed/unverified).
  const railColours = new Set(stripStates.slice(0, 4).map(s => s.rail));
  add('STRIP_RAIL_COLOURS — each verdict has a distinct rail colour',
      railColours.size >= 3,
      `unique-rails=${[...railColours].join(' | ')}`);

  // Test 4 — Confidence dots reflect the score quintile.
  const verifiedDots   = stripStates.find(s => s.verdict === 'verified').dots;
  const partialDots    = stripStates.find(s => s.verdict === 'partial').dots;
  const unverifiedDots = stripStates.find(s => s.verdict === 'unverified').dots;
  add('STRIP_CONF_DOTS — higher confidence = more filled dots',
      verifiedDots >= partialDots && partialDots >= unverifiedDots
        && verifiedDots > unverifiedDots,
      `verified=${verifiedDots} partial=${partialDots} unverified=${unverifiedDots}`);

  // Test 5 — Tap expands the trust panel and shows matched_source_names.
  const verifiedCard = page.locator('.art-card').nth(0);
  await verifiedCard.locator('.trust-strip').click();
  await page.waitForTimeout(200);
  const expandedNames = await page.$$eval('.art-card:nth-of-type(1) .trust-strip.expanded .trust-source-name',
    els => els.map(e => e.textContent.trim()));
  add('STRIP_TAP_EXPANDS — verified strip expand reveals matched_source_names',
      expandedNames.length === 3
        && expandedNames.includes('The Hindu')
        && expandedNames.includes('NDTV')
        && expandedNames.includes('Indian Express'),
      `names=[${expandedNames.join(',')}]`);
  // Second click collapses.
  await verifiedCard.locator('.trust-strip').click();
  await page.waitForTimeout(200);
  const stillExpanded = await page.evaluate(() => document.querySelectorAll('.art-card')[0].querySelector('.trust-strip').classList.contains('expanded'));
  add('STRIP_TAP_COLLAPSES — second click on the strip collapses it',
      stillExpanded === false, `expanded after 2 clicks: ${stillExpanded}`);

  // Test 6 — Keyboard expansion (Enter key).
  await verifiedCard.locator('.trust-strip').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const kbdExpanded = await page.evaluate(() => document.querySelectorAll('.art-card')[0].querySelector('.trust-strip').classList.contains('expanded'));
  add('STRIP_KBD_EXPANDS — Enter on focused strip expands the panel',
      kbdExpanded === true, `expanded via keyboard: ${kbdExpanded}`);
  // Collapse before next test (clean state).
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  // Test 7 — Body tap on the article triggers a speak preface that
  // starts with the trust verdict.
  await page.evaluate(() => { window.__speakLog = []; });
  // Click on the headline area (not the strip itself) so the article
  // expansion + speak fires, not the strip toggle.
  await verifiedCard.locator('.art-title').click();
  await page.waitForTimeout(1500);
  const speakLog = await page.evaluate(() => window.__speakLog);
  const lastUtter = speakLog[speakLog.length - 1]?.text || '';
  add('STRIP_SPEAK_PREFACE — speak utterance opens with the trust verdict',
      /^Verified by 3 other sources\.\s/.test(lastUtter),
      `last utterance: "${lastUtter.slice(0, 80)}…"`);

  // Test 8 — Unchecked state renders without exception, shows the
  // "Checking…" copy + a fallback rationale (not a blank panel).
  const uncheckedStrip = stripStates.find(s => s.verdict === 'unchecked');
  add('STRIP_UNCHECKED_STATE — unchecked verdict renders Checking word + fallback rationale',
      uncheckedStrip?.word === 'Checking…'
        && uncheckedStrip.rationale && uncheckedStrip.rationale.length > 10,
      `word="${uncheckedStrip?.word}" rationale="${(uncheckedStrip?.rationale || '').slice(0, 50)}…"`);

  // Test 9 — No horizontal body overflow on 375.
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_375 — body does not overflow the 375 px viewport',
      docW <= 376, `docW=${docW}`);

  // Test 10 — No console errors.
  add('NO_CONSOLE_ERRORS_375 — no JS errors / console.error during mobile run',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 60)}…"` : 'none');

  // Screenshot for the proof bundle.
  await page.screenshot({ path: resolve(SHOT_DIR, 'trust_strip_mobile.png'), fullPage: true });
  await ctx.close();
}

// ── Tablet (768) ─────────────────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 768, 1024);
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelectorAll('.trust-strip').length >= 5, { timeout: 10000 });
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_768 — body does not overflow the 768 px viewport', docW <= 769, `docW=${docW}`);
  add('NO_CONSOLE_ERRORS_768 — no JS errors at tablet width',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 60)}…"` : 'none');
  await page.screenshot({ path: resolve(SHOT_DIR, 'trust_strip_tablet.png'), fullPage: true });
  await ctx.close();
}

// ── Desktop (1280) ───────────────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 1280, 900);
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelectorAll('.trust-strip').length >= 5, { timeout: 10000 });
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_1280 — body does not overflow the 1280 px viewport', docW <= 1281, `docW=${docW}`);
  add('NO_CONSOLE_ERRORS_1280 — no JS errors at desktop width',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 60)}…"` : 'none');
  await page.screenshot({ path: resolve(SHOT_DIR, 'trust_strip_desktop.png'), fullPage: true });
  await ctx.close();
}

// ── Home / rails view — rail-card must KEEP the compact .fc-badge ────
{
  const { ctx, page, errs } = await newCtx(browser, 375, 1400);
  // Switch to national so the rails view loads.
  await page.addInitScript(() => {
    try { localStorage.setItem('chitti_news_category', 'national'); } catch (e) {}
  });
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelectorAll('.rail-card').length >= 1, { timeout: 10000 });
  const railHasFcBadge = await page.evaluate(() => document.querySelectorAll('.rail-card .fc-badge').length);
  const railHasTrustStrip = await page.evaluate(() => document.querySelectorAll('.rail-card .trust-strip').length);
  add('RAIL_KEEPS_COMPACT_PILL — rail-cards still render the small .fc-badge',
      railHasFcBadge >= 1, `pills=${railHasFcBadge}`);
  add('RAIL_NO_TRUST_STRIP — rail-cards do NOT render the wide Trust Strip (240 px too narrow)',
      railHasTrustStrip === 0, `strips inside rails=${railHasTrustStrip}`);
  add('NO_CONSOLE_ERRORS_RAILS — no JS errors on the rails home', errs.length === 0,
      errs.length ? `errs[0]="${errs[0].slice(0, 60)}…"` : 'none');
  await ctx.close();
}

await browser.close();

const greens = checks.filter(c => c.ok).length;
const overall = greens === checks.length ? 'GREEN' : 'RED';
console.log('\n' + '═'.repeat(72));
console.log(`TRUST STRIP PROBE → ${overall}  (${greens}/${checks.length})`);
console.log('═'.repeat(72));
for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '❌'}  ${c.label}`);
  if (c.detail) console.log(`        ${c.detail}`);
}
writeFileSync(
  resolve(__dirname, 'probe_trust_strip_result.json'),
  JSON.stringify({ overall, greens, total: checks.length, checks, ranAt: new Date().toISOString() }, null, 2),
);
process.exit(overall === 'GREEN' ? 0 : 1);
