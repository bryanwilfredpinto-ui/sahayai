/* tools/test_lang_translate.mjs — CTO test rig
 * Loads each Chitti page in a headless browser, switches to Telugu/Bengali/Tamil,
 * waits for runtime translation, reports whether card labels are still English.
 * Run: node tools/test_lang_translate.mjs
 */
import { chromium } from 'playwright';

const BASE = 'https://sahayai.in';
const PAGES = [
  { name: 'medupi',       url: '/chitti_medupi.html',       cardSel: '.scan-action', labelSel: '.lbl' },
  { name: 'vaani',        url: '/chitti_vaani.html',        cardSel: '.pro-card',    labelSel: '.lbl' },
  { name: 'ca',           url: '/chitti_ca.html',           cardSel: null,           labelSel: null },
  { name: 'legal',        url: '/chitti_legal.html',        cardSel: null,           labelSel: null },
  { name: 'government',   url: '/chitti_government.html',   cardSel: null,           labelSel: null },
  { name: 'news',         url: '/chitti_news.html',         cardSel: null,           labelSel: null },
  { name: 'news_ai',      url: '/chitti_news_ai.html',      cardSel: null,           labelSel: null },
  { name: 'upi',          url: '/chitti_upi.html',          cardSel: '.action-card', labelSel: '.lbl' },
  { name: 'scanner',      url: '/chitti_scanner.html',      cardSel: '.scan-action', labelSel: '.lbl' },
  { name: '2wheeler',     url: '/chitti_2wheeler.html',     cardSel: '.action-card', labelSel: '.lbl' },
  { name: '4wheeler',     url: '/chitti_4wheeler.html',     cardSel: '.action-card', labelSel: '.lbl' },
  { name: 'logo_video',   url: '/chitti_logo_video.html',   cardSel: null,           labelSel: null },
  { name: 'voice_factory',url: '/chitti_voice_factory.html',cardSel: null,           labelSel: null },
];

const TEST_LANG = process.argv[2] || 'te';   // default Telugu

function isLatin(s) {
  if (!s) return false;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  return latin >= 2;
}

async function testPage(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  try {
    await page.goto(BASE + p.url + '?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // allow chitti_a11y → lang → runtime + card-widget to boot
    // Find any compatible lang selector
    const sel = await page.$('select#lang-select, select#lang, select[aria-label="Language"]');
    if (!sel) {
      await ctx.close();
      return { name: p.name, status: 'NO_LANG_SELECT', sample: [], cards: 0 };
    }
    // Capture card labels BEFORE switch (English baseline)
    let sample_en = [];
    if (p.cardSel && p.labelSel) {
      sample_en = await page.$$eval(`${p.cardSel} ${p.labelSel}`,
        els => els.slice(0, 6).map(e => e.textContent.trim()));
    }
    // Switch language
    await page.selectOption('select#lang-select, select#lang, select[aria-label="Language"]', TEST_LANG);
    // Wait for runtime translation: 300ms debounce + 8 strings * 250ms batch + buffer
    await page.waitForTimeout(8000);
    // Read card labels AFTER switch
    let sample_xl = [];
    if (p.cardSel && p.labelSel) {
      sample_xl = await page.$$eval(`${p.cardSel} ${p.labelSel}`,
        els => els.slice(0, 6).map(e => e.textContent.trim()));
    }
    // Compute verdict: how many of the EN samples are still Latin (= not translated)
    let stillLatin = 0;
    sample_xl.forEach(s => { if (isLatin(s)) stillLatin++; });
    let verdict;
    if (sample_xl.length === 0) verdict = 'NO_CARDS_DETECTED';
    else if (stillLatin === 0) verdict = 'ALL_TRANSLATED ✅';
    else if (stillLatin === sample_xl.length) verdict = 'NONE_TRANSLATED 🔴';
    else verdict = `PARTIAL ${sample_xl.length - stillLatin}/${sample_xl.length} 🟡`;
    await ctx.close();
    return {
      name: p.name,
      status: verdict,
      lang: TEST_LANG,
      sample_en,
      sample_xl,
      errors: errors.slice(0, 3)
    };
  } catch (e) {
    await ctx.close();
    return { name: p.name, status: 'ERROR: ' + e.message, sample: [], errors };
  }
}

(async () => {
  console.log(`\n=== CTO translation test rig · target lang: ${TEST_LANG} ===\n`);
  const browser = await chromium.launch({ headless: true });
  for (const p of PAGES) {
    const r = await testPage(browser, p);
    console.log(`──── ${r.name.padEnd(15)} ${r.status}`);
    if (r.sample_en?.length) console.log('     EN:', JSON.stringify(r.sample_en));
    if (r.sample_xl?.length) console.log('     ' + TEST_LANG + ':', JSON.stringify(r.sample_xl));
    if (r.errors?.length) console.log('     ERR:', r.errors.join(' | '));
  }
  await browser.close();
  console.log('\nDone.\n');
})();
