/**
 * probe_live_languages.mjs — Visual QA pass against the deployed
 * https://sahayai.in/chitti_news.html. For each supported language:
 *   1. Boot the page with that language pre-seeded in localStorage
 *   2. Wait for the home rails OR honest empty state to render
 *   3. Sample the first 3 visible card titles + status text
 *   4. Assert that the rendered titles are NOT English when the lang
 *      is one of the Indic languages (heuristic: contains Indic glyphs)
 *   5. Screenshot the home view at 375×800 (mobile) for visual review
 *   6. Print a one-line GREEN/RED verdict per language
 *
 * Output:
 *   tools/cert_screenshots/live_<lang>_home.png   (12 files)
 *   stdout: per-lang result + overall pass/fail line
 *
 * Exit code: 0 if every language passed, 1 otherwise.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR  = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const PAGE = 'https://sahayai.in/chitti_news.html';

const LANGS = ['en','hi','mr','ta','te','bn','kn','ml','gu','pa','or','ur'];
const LANG_LABELS = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu',
  bn: 'Bengali', kn: 'Kannada', ml: 'Malayalam', gu: 'Gujarati',
  pa: 'Punjabi', or: 'Odia', ur: 'Urdu',
};
const INDIC_REGEX = {
  hi: /[ऀ-ॿ]/,  mr: /[ऀ-ॿ]/,
  bn: /[ঀ-৿]/,  as: /[ঀ-৿]/,
  pa: /[਀-੿]/,  gu: /[઀-૿]/,
  or: /[଀-୿]/,  ta: /[஀-௿]/,
  te: /[ఀ-౿]/,  kn: /[ಀ-೿]/,
  ml: /[ഀ-ൿ]/,  ur: /[؀-ۿ]/,
};

const browser = await chromium.launch({ headless: true });
const results = [];

for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  const consoleErrs = [];
  page.on('pageerror', (e) => consoleErrs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

  // Pre-seed localStorage BEFORE the first paint so the page boots
  // straight into the target language. Also skip the disability
  // profile modal — proves the click path is unblocked.
  await page.addInitScript((l) => {
    try {
      localStorage.setItem('chitti_news_state', 'india');
      localStorage.setItem('chitti_news_lang',  l);
      localStorage.setItem('chitti_news_category', 'national');
      localStorage.setItem('chitti_disability_profile_v1',
        JSON.stringify({ skipped: true }));
    } catch (e) {}
  }, lang);

  let loadErr = null;
  try {
    await page.goto(PAGE + '?cb=' + Date.now(), {
      waitUntil: 'domcontentloaded', timeout: 45000,
    });
  } catch (e) { loadErr = String(e.message || e); }

  if (loadErr) {
    results.push({ lang, label: LANG_LABELS[lang], pass: false, reason: 'LOAD: ' + loadErr });
    await ctx.close();
    continue;
  }

  // Wait for either the home rails or the empty-state status card.
  // Backend takes ~4 s per single-cat fetch and ~10 s for 6-in-parallel
  // under cold-cache; allow generous headroom so we don't fail on cold
  // boot. The "Loading…" placeholder is in #feed-root *until* rails or
  // status-card replace it; that exact swap is what we wait for.
  await page.waitForFunction(
    () => document.querySelectorAll('.rail-section').length >= 1
       || (document.querySelector('.status-card')
           && !/Loading/.test(document.querySelector('.status-card').textContent)),
    { timeout: 45000 },
  ).catch(() => {});

  const sample = await page.evaluate(() => {
    const titles = [
      ...Array.from(document.querySelectorAll('.hero-title')).map(e => e.textContent.trim()),
      ...Array.from(document.querySelectorAll('.rail-headline')).map(e => e.textContent.trim()),
      ...Array.from(document.querySelectorAll('.art-title')).map(e => e.textContent.trim()),
    ].filter(Boolean).slice(0, 5);
    const status = (document.querySelector('.status-card')?.textContent || '').trim().slice(0, 200);
    const rails = document.querySelectorAll('.rail-section').length;
    const hero = document.querySelectorAll('.hero-card').length;
    const railCards = document.querySelectorAll('.rail-card').length;
    const artCards = document.querySelectorAll('.art-card').length;
    const buildTag = document.querySelector('meta[name="chitti-build"]')?.content || '';
    return { titles, status, rails, hero, railCards, artCards, buildTag };
  });

  const indic = INDIC_REGEX[lang];
  const hasContent = sample.titles.length > 0;
  const titlesText = sample.titles.join(' | ');
  const allIndic = indic
    ? sample.titles.every((t) => indic.test(t)) // every title has at least one Indic glyph
    : true;
  const allEnglish = !indic ? /[A-Za-z]/.test(titlesText) : false;
  const hasHonestEmpty = !hasContent && /doesn['']t have/i.test(sample.status)
    && /sources yet/i.test(sample.status);

  let pass, reason;
  if (hasContent) {
    pass = indic ? allIndic : true;
    reason = pass
      ? `content rendered (${sample.titles.length} titles)`
      : `titles NOT in ${lang}: "${titlesText.slice(0, 80)}"`;
  } else if (hasHonestEmpty) {
    pass = true;
    reason = 'honest empty state — no sources yet copy shown';
  } else {
    pass = false;
    reason = 'neither content nor honest empty state — status: "'
           + sample.status.slice(0, 80) + '"';
  }

  results.push({
    lang, label: LANG_LABELS[lang], pass, reason,
    sample, consoleErrs: consoleErrs.slice(0, 3),
  });

  const shotPath = resolve(SHOT_DIR, `live_${lang}_home.png`);
  await page.screenshot({ path: shotPath, fullPage: true });
  await ctx.close();
}

await browser.close();

console.log('\n' + '═'.repeat(72));
console.log('LIVE multi-language probe → ' + PAGE);
console.log('═'.repeat(72));
let greens = 0;
for (const r of results) {
  const icon = r.pass ? '✅' : '❌';
  if (r.pass) greens++;
  console.log(`  ${icon}  ${r.lang.padEnd(3)} ${r.label.padEnd(11)} ${r.reason}`);
  if (r.sample) {
    console.log(`        hero=${r.sample.hero} rails=${r.sample.rails} ` +
                `railCards=${r.sample.railCards} artCards=${r.sample.artCards} ` +
                `build=${r.sample.buildTag}`);
    if (r.sample.titles.length) {
      console.log(`        sample: "${r.sample.titles[0].slice(0, 70)}"`);
    }
  }
  if (r.consoleErrs && r.consoleErrs.length) {
    console.log(`        JS errors: ${r.consoleErrs[0].slice(0, 80)}`);
  }
}
console.log('═'.repeat(72));
console.log(`  RESULT: ${greens === results.length ? 'GREEN' : 'RED'}  (${greens}/${results.length})`);
console.log('═'.repeat(72));

process.exit(greens === results.length ? 0 : 1);
