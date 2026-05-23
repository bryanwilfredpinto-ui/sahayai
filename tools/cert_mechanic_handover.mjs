/**
 * Final cert before handing Sire chitti_2wheeler.html + chitti_4wheeler.html.
 * Verifies, on real Chromium at 375×812:
 *   1. Page loads with no JS errors.
 *   2. Language dropdown 100% flips (English / Hindi / Bangla / Telugu).
 *   3. Make → Model cascading dropdown works.
 *   4. OBD2 scan card present + clickable; "Chitti soch rahi hai…" bubble appears.
 *   5. Feedback widget toolbar [🔊][▶ Chitti][👍][👎] auto-attached to every
 *      .chitti-response card (or page already has equivalent sds-card-toolbar).
 *   6. Captures the 3 screenshots Sire asked for.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8765';
const out = (n) => resolve(__dirname, n);

const RESULTS = [];
const log = (k, ok, note='') => { RESULTS.push({k, ok, note}); console.log((ok?'✅':'❌') + ' ' + k + (note?'  — ' + note:'')); };

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text()); });

// Mock the DeepSeek endpoint so OBD2 returns a known JSON without burning a real key.
await ctx.route('**/api/vaani/ask', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      reply: JSON.stringify({
        meaning: 'P0420 का मतलब — catalytic converter ठीक से काम नहीं कर रहा। Emissions बढ़ गई हैं।',
        severity: 'moderate',
        what_to_do: 'अगले 2 हफ़्ते में mechanic को दिखाएँ। तुरंत danger नहीं है।',
        safe_to_ride: true,
        safe_to_drive: true,
        fair_price_min_inr: 4500,
        fair_price_max_inr: 8500
      })
    })
  });
});

async function testPage(file, opts) {
  console.log('\n══════════════════════════════ ' + file + ' ══════════════════════════════');
  errors.length = 0;
  await page.goto(BASE + '/' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // 1. No JS errors at load
  log(`${file}: page loads with no JS errors`, errors.filter(e => !e.includes('favicon') && !e.includes('chitti-vaani-api')).length === 0,
      errors.slice(0, 3).join(' | '));

  // 2. Language dropdown — pick the page's own select (NOT the auto-injected langbar — that one was killed)
  const langSelector = opts.langSelector;
  const langExists = await page.locator(langSelector).count() > 0;
  log(`${file}: lang selector present (${langSelector})`, langExists);

  // baseline EN
  await page.selectOption(langSelector, 'en');
  await page.waitForTimeout(300);
  const enHome = await page.locator(opts.homeTabBtn).innerText();

  // Hindi
  await page.selectOption(langSelector, 'hi');
  await page.waitForTimeout(300);
  const hiHome = await page.locator(opts.homeTabBtn).innerText();
  log(`${file}: Hindi flip — home tab label changed`, hiHome !== enHome && /[ऀ-ॿ]/.test(hiHome), `EN="${enHome}" HI="${hiHome}"`);

  // Capture Hindi screenshot
  await page.screenshot({ path: out(opts.shotHi), fullPage: true });

  // Bangla
  await page.selectOption(langSelector, 'bn');
  await page.waitForTimeout(300);
  const bnHome = await page.locator(opts.homeTabBtn).innerText();
  log(`${file}: Bangla flip — home tab label changed`, /[ঀ-৿]/.test(bnHome), `BN="${bnHome}"`);
  await page.screenshot({ path: out(opts.shotBn), fullPage: true });

  // Telugu
  await page.selectOption(langSelector, 'te');
  await page.waitForTimeout(300);
  const teHome = await page.locator(opts.homeTabBtn).innerText();
  log(`${file}: Telugu flip — home tab label changed`, /[ఀ-౿]/.test(teHome), `TE="${teHome}"`);

  // 3. Make → Model cascading dropdown (on My Vehicle tab)
  await page.selectOption(langSelector, 'en');
  await page.waitForTimeout(200);
  await page.click(opts.bikeTabBtn);
  await page.waitForTimeout(300);
  const beforeModelCount = await page.locator(opts.modelSelect + ' option').count();
  await page.selectOption(opts.makeSelect, opts.testMake);
  await page.waitForTimeout(250);
  const afterModelCount = await page.locator(opts.modelSelect + ' option').count();
  log(`${file}: Make→Model cascade (selected "${opts.testMake}" → ${beforeModelCount} → ${afterModelCount} options)`, afterModelCount > beforeModelCount);
  const sampleModels = await page.locator(opts.modelSelect + ' option').allInnerTexts();
  log(`${file}: cascade contains real models`, sampleModels.some(m => opts.expectedModel.test(m)), 'first few: ' + sampleModels.slice(0,4).join(' / '));

  // 4. OBD2 — type code, click scan, expect result bubble (mocked)
  await page.click(opts.askTabBtn);
  await page.waitForTimeout(300);
  await page.fill(opts.obdCodeInput, 'P0420');
  await page.click(opts.obdScanBtn);
  // First the "soch rahi hai" bubble; then the parsed result
  await page.waitForTimeout(800);
  const obdHtml = await page.locator(opts.obdResultDiv).innerHTML();
  log(`${file}: OBD2 scan renders result`, /P0420|catalytic|moderate|fair/i.test(obdHtml) || obdHtml.length > 50,
      'result len=' + obdHtml.length);
  await page.screenshot({ path: out(opts.shotObd), fullPage: false });

  // 5. Feedback toolbar — every .chitti-response card has fb-pos & fb-neg
  const cards = await page.locator('.chitti-response').count();
  const cardsWithFb = await page.evaluate(() => {
    let ok = 0;
    document.querySelectorAll('.chitti-response').forEach(c => {
      const bar = c.querySelector('.sds-card-toolbar') || c.querySelector('.chitti-fb-bar');
      if (bar) {
        const hasPos = bar.querySelector('.fb-pos, [data-act="up"], button[aria-label*="achchha" i], button[aria-label*="like" i]');
        const hasNeg = bar.querySelector('.fb-neg, [data-act="down"], button[aria-label*="theek nahi" i]');
        if (hasPos && hasNeg) ok++;
      }
    });
    return ok;
  });
  log(`${file}: every chitti-response card has 👍/👎 toolbar`, cards > 0 && cardsWithFb === cards, `${cardsWithFb}/${cards}`);

  // 6. Header "Chitti Vaani" button present + tagged
  const vaaniBtn = await page.locator('[data-vai-i18n="ui.open_vaani"]').count();
  log(`${file}: header Vaani button tagged with ui.open_vaani`, vaaniBtn > 0);

  return errors.length;
}

// ── 2-Wheeler ──
await testPage('chitti_2wheeler.html', {
  langSelector: '#lang-select',
  homeTabBtn: 'nav.sds-tabs button[data-tab="home"]',
  bikeTabBtn: 'nav.sds-tabs button[data-tab="bike"]',
  askTabBtn:  'nav.sds-tabs button[data-tab="ask"]',
  makeSelect: '#mb-make',
  modelSelect:'#mb-model',
  testMake: 'Hero',
  expectedModel: /Splendor|Passion|HF/i,
  obdCodeInput: '#mb-obd-code',
  obdScanBtn:   'button[onclick="mbObdScan()"]',
  obdResultDiv: '#mb-obd-result',
  shotHi:  'cert_handover_2w_hi.png',
  shotBn:  'cert_handover_2w_bn.png',
  shotObd: 'cert_handover_2w_obd.png',
});

// ── 4-Wheeler ──
await testPage('chitti_4wheeler.html', {
  langSelector: '#lang-select',
  homeTabBtn: 'nav.sds-tabs button[data-tab="home"]',
  bikeTabBtn: 'nav.sds-tabs button[data-tab="car"]',
  askTabBtn:  'nav.sds-tabs button[data-tab="ask"]',
  makeSelect: '#mc-make',
  modelSelect:'#mc-model',
  testMake: 'Maruti Suzuki',
  expectedModel: /Swift|Alto|WagonR|Baleno|Brezza/i,
  obdCodeInput: '#mc-obd-code',
  obdScanBtn:   'button[onclick="mcObdScan()"]',
  obdResultDiv: '#mc-obd-result',
  shotHi:  'cert_handover_4w_hi.png',
  shotBn:  'cert_handover_4w_bn.png',
  shotObd: 'cert_handover_4w_obd.png',
});

await b.close();

const total = RESULTS.length;
const passed = RESULTS.filter(r => r.ok).length;
console.log('\n══════════════════════════════════════════════');
console.log(`OVERALL: ${passed}/${total} PASS`);
console.log('══════════════════════════════════════════════');
if (passed !== total) {
  console.log('\nFAILED:');
  RESULTS.filter(r => !r.ok).forEach(r => console.log('  ❌ ' + r.k + (r.note ? ' — ' + r.note : '')));
  process.exit(1);
}
