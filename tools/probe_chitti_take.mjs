/**
 * probe_chitti_take.mjs — Chitti's Insight on cards (Sire 2026-06-04
 * priority #2). Exercises the full UI contract:
 *
 *   1. Card with backend-cached chitti_insight renders an .art-insight
 *      block with the "Chitti's Take:" label + the sentence italicised.
 *   2. Card WITHOUT chitti_insight (null on the backend) renders NO
 *      .art-insight block. No placeholder, no spinner. Empty.
 *   3. Tap on the insight expands the existing 3-bullet "Chitti's Take"
 *      panel via openTake — reusing the existing flow per the design.
 *   4. Keyboard activation (Enter / Space) on the insight expands it.
 *   5. Speak preface: tapping the article body fires speakArticle
 *      whose utterance is ordered [trust preface] [Chitti's take:
 *      insight] [headline] [body]. Blind users hear the editorial line.
 *   6. No horizontal overflow on 375 / 768 / 1280.
 *   7. No console errors anywhere.
 *
 * Hermetic — stubs the backend so we control which cards have an
 * insight and which don't. Run with:
 *   node tools/probe_chitti_take.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(__dirname, '..', 'chitti_news.html')).href;
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const ARTICLES = [
  // Card 1 — Verified + has insight. Insight is the canonical good
  // sentence: factually anchored, neutral, plain English, adds context
  // beyond the headline.
  {
    id: 9101,
    title: 'Rupee falls 28 paise against US dollar in early trade',
    summary: 'Brent crude rose to 94 dollars after Iran strikes; RBI silent so far.',
    content: 'Body paragraph one. '.repeat(20),
    chitti_insight: 'Pressure tied to crude crossing 94 dollars after Iran strikes; RBI has not yet signalled intervention.',
    factcheck: {
      verdict: 'verified', symbol: '✅', word: 'VERIFIED', confidence: 92,
      matched_sources: ['ndtv', 'ie', 'thehindu'],
      matched_source_names: ['NDTV', 'Indian Express', 'The Hindu'],
      match_count: 3,
      rationale_en: '3 other trusted sources are running this story; key facts agree.',
    },
  },
  // Card 2 — Partial verdict, insight present (different stake).
  {
    id: 9102,
    title: 'Karnataka CM Swearing-In Ceremony: Major Traffic Curbs',
    summary: 'Curbs cover a 12 km radius from 9 AM to noon near MG Road.',
    content: 'Body. '.repeat(40),
    chitti_insight: 'Curbs cover a 12 km radius around Vidhan Soudha from 9 AM to noon affecting MG Road commuters.',
    factcheck: {
      verdict: 'partial', symbol: '🟡', word: 'PARTIAL', confidence: 70,
      matched_sources: ['toi'], matched_source_names: ['Times of India'],
      match_count: 1,
      rationale_en: '1 other source covers this; broad facts match but details differ.',
    },
  },
  // Card 3 — NO insight (backend column is null OR validator rejected).
  // The .art-insight block MUST NOT appear on this card.
  {
    id: 9103,
    title: 'Local cooperative bank merges with regional rival in MP',
    summary: 'A small district cooperative bank merged today.',
    content: 'Body. '.repeat(30),
    chitti_insight: null,
    factcheck: {
      verdict: 'unverified', symbol: '❔', word: 'UNVERIFIED', confidence: 25,
      matched_sources: [], matched_source_names: [], match_count: 0,
      rationale_en: 'Single-source story — may be hyperlocal or just-breaking.',
    },
  },
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
      localStorage.setItem('chitti_news_category', 'business');
      localStorage.setItem('disability_profile', JSON.stringify({
        skipped: true, ts: new Date().toISOString(), source: 'chitti-take-probe',
      }));
    } catch (e) {}
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
      const items = ARTICLES.map(a => ({
        ...a,
        link: 'https://example.com/' + a.id,
        image_url: '',
        source_name: 'NDTV',
        source_slug: 'ndtv',
        published_at: new Date().toISOString(),
      }));
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          items, count: items.length,
          state: 'india', language: 'en', category: 'business',
          speak_en: items.length + ' business stories.',
          coverage: { per_category: { business: items.length }, total_in_language: items.length,
                      english_fallback_count: 7000,
                      available_categories: ['national','business'] },
        }),
      });
    }
    if (u.includes('/take?')) {
      const matchId = u.match(/article\/(\d+)\/take/);
      const id = matchId ? Number(matchId[1]) : null;
      const article = ARTICLES.find(a => a.id === id);
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          ok: true, source: 'deepseek',
          bullets: [
            (article?.chitti_insight) || 'What happened.',
            'Why it matters: stakes line.',
            'What\'s next: watch this space.',
          ],
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
const add = (label, ok, detail = '') => checks.push({ label, ok: !!ok, detail });

const browser = await chromium.launch({ headless: true });

// ── Mobile (primary viewport) ────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 375, 1600);
  await page.goto(PAGE);
  await page.waitForFunction(
    () => document.querySelectorAll('.art-card').length >= 3,
    { timeout: 10000 },
  );

  // T1 — Two cards have insight rendered, one does NOT.
  const insightStates = await page.$$eval('.art-card', cards => cards.map(c => ({
    id: c.id,
    hasInsight: !!c.querySelector('.art-insight'),
    label: c.querySelector('.art-insight-label')?.textContent?.trim() || null,
    body:  c.querySelector('.art-insight-body')?.textContent?.trim() || null,
  })));
  const withInsight = insightStates.filter(s => s.hasInsight);
  const withoutInsight = insightStates.filter(s => !s.hasInsight);
  add('INSIGHT_RENDERS_WHEN_PRESENT — cards with chitti_insight show the block',
      withInsight.length === 2,
      `cards-with-insight=${withInsight.length} ids=${withInsight.map(s => s.id).join(',')}`);
  add('INSIGHT_HIDES_WHEN_NULL — cards without chitti_insight render NO .art-insight',
      withoutInsight.length === 1 && withoutInsight[0].id === 'art-9103',
      `null-cards=${withoutInsight.map(s => s.id).join(',')}`);
  add('INSIGHT_LABEL_CORRECT — label reads exactly "Chitti\'s Take:" on each insight',
      withInsight.every(s => s.label && /Chitti['']s Take:/i.test(s.label)),
      `labels=[${withInsight.map(s => `"${s.label}"`).join(',')}]`);
  add('INSIGHT_BODY_PRESENT — the editorial sentence renders below the label',
      withInsight.every(s => s.body && s.body.length > 20),
      `body-lens=[${withInsight.map(s => s.body?.length).join(',')}]`);

  // T2 — Tap the insight → openTake fires (uses /take endpoint).
  let takeFetched = false;
  page.on('request', (r) => {
    if (/\/article\/\d+\/take/.test(r.url())) takeFetched = true;
  });
  await page.locator('.art-card[id="art-9101"] .art-insight').click();
  await page.waitForFunction(
    () => !!document.querySelector('#take-9101 ul'),
    { timeout: 5000 },
  ).catch(() => {});
  add('INSIGHT_TAP_OPENS_TAKE — clicking the insight fetches /take + renders bullets',
      takeFetched, `take-endpoint-hit=${takeFetched}`);
  const bulletCount = await page.evaluate(() =>
    document.querySelectorAll('#take-9101 ul li').length,
  );
  add('INSIGHT_TAKE_BULLETS_RENDERED — 3-bullet take panel populated',
      bulletCount === 3, `bullets=${bulletCount}`);

  // T3 — Keyboard activation expands too.
  // First reset by reloading the page so take panel is empty.
  await page.evaluate(() => {
    const host = document.getElementById('take-9102');
    if (host) host.innerHTML = '';
  });
  await page.locator('.art-card[id="art-9102"] .art-insight').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => !!document.querySelector('#take-9102 ul, #take-9102 p'),
    { timeout: 5000 },
  ).catch(() => {});
  const kbdHostHtml = await page.evaluate(() =>
    document.getElementById('take-9102')?.innerHTML || '');
  add('INSIGHT_KBD_OPENS_TAKE — Enter key on focused insight opens the take panel',
      kbdHostHtml.length > 0, `take-host-len=${kbdHostHtml.length}`);

  // T4 — Speak preface: tapping the body fires utterance whose text
  // starts with [trust preface] [Chitti's take:] [headline] [body].
  await page.evaluate(() => { window.__speakLog = []; });
  // Click somewhere on the headline area (not the insight) so the card
  // tap fires speakArticle.
  await page.locator('.art-card[id="art-9101"] .art-title').click();
  await page.waitForTimeout(1200);
  const speakLog = await page.evaluate(() => window.__speakLog);
  const lastUtter = speakLog[speakLog.length - 1]?.text || '';
  add('INSIGHT_SPEAK_PREFACE — utterance order is verdict → take → headline → body',
      /^Verified by 3 other sources\.\s+Chitti's take: Pressure tied to crude crossing 94 dollars/.test(lastUtter),
      `utterance="${lastUtter.slice(0, 130)}…"`);

  // T5 — Card with NO insight must still speak verdict + headline +
  // body (no broken concatenation, no empty preface artefact).
  await page.evaluate(() => { window.__speakLog = []; });
  await page.locator('.art-card[id="art-9103"] .art-title').click();
  await page.waitForTimeout(1500);
  const noInsightUtter = await page.evaluate(() =>
    window.__speakLog[window.__speakLog.length - 1]?.text || '');
  // Card 9103 is unverified, so its trust preface is "Unverified — single source…"
  add('INSIGHT_SPEAK_NULL_GRACEFUL — null insight does NOT inject a "Chitti\'s take: " orphan',
      !/Chitti['']s take:\s*\./.test(noInsightUtter)
        && !/Chitti['']s take:\s*$/.test(noInsightUtter),
      `utterance="${noInsightUtter.slice(0, 130)}…"`);

  // T6 — Horizontal overflow.
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_375 — no horizontal body overflow at 375 px', docW <= 376, `docW=${docW}`);

  // T7 — Console errors.
  add('NO_CONSOLE_ERRORS_375 — no JS errors during mobile run',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 80)}…"` : 'none');

  await page.screenshot({ path: resolve(SHOT_DIR, 'chitti_take_mobile.png'), fullPage: true });
  await ctx.close();
}

// ── Tablet (768) ─────────────────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 768, 1024);
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelectorAll('.art-insight').length >= 2, { timeout: 10000 });
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_768 — no horizontal body overflow at 768 px', docW <= 769, `docW=${docW}`);
  add('NO_CONSOLE_ERRORS_768 — no JS errors at tablet width',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 80)}…"` : 'none');
  await page.screenshot({ path: resolve(SHOT_DIR, 'chitti_take_tablet.png'), fullPage: true });
  await ctx.close();
}

// ── Desktop (1280) ───────────────────────────────────────────────────
{
  const { ctx, page, errs } = await newCtx(browser, 1280, 900);
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelectorAll('.art-insight').length >= 2, { timeout: 10000 });
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  add('NO_OVERFLOW_1280 — no horizontal body overflow at 1280 px', docW <= 1281, `docW=${docW}`);
  add('NO_CONSOLE_ERRORS_1280 — no JS errors at desktop width',
      errs.length === 0, errs.length ? `errs[0]="${errs[0].slice(0, 80)}…"` : 'none');
  await page.screenshot({ path: resolve(SHOT_DIR, 'chitti_take_desktop.png'), fullPage: true });
  await ctx.close();
}

await browser.close();

const greens = checks.filter(c => c.ok).length;
const overall = greens === checks.length ? 'GREEN' : 'RED';
console.log('\n' + '═'.repeat(72));
console.log(`CHITTI'S TAKE PROBE → ${overall}  (${greens}/${checks.length})`);
console.log('═'.repeat(72));
for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '❌'}  ${c.label}`);
  if (c.detail) console.log(`        ${c.detail}`);
}
writeFileSync(
  resolve(__dirname, 'probe_chitti_take_result.json'),
  JSON.stringify({ overall, greens, total: checks.length, checks, ranAt: new Date().toISOString() }, null, 2),
);
process.exit(overall === 'GREEN' ? 0 : 1);
