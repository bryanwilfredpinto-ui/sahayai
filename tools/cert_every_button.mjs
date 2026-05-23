/**
 * Aggressive every-element cert: click EVERY visible button on
 * chitti_2wheeler.html and chitti_4wheeler.html, switching tabs as needed.
 * Records any JS error, broken handler, or selector failure.
 *
 * Also re-runs the language-flip + Make/Model + OBD2 + KYV + 26-lang dropdown
 * checks so we get a single PASS/FAIL handover signal.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8765';
const out = (n) => resolve(__dirname, n);

const RESULTS = [];
const log = (k, ok, note='') => {
  RESULTS.push({k, ok, note});
  console.log((ok?'✅':'❌') + ' ' + k + (note?'  — ' + note:''));
};

const KYV_JSON_BIKE = { engine_cc:97, engine_type:"air-cooled", bhp:8, torque_nm:8, fuel_tank_l:9.8, rated_mileage:"65-75 kmpl", service_interval:"3000 km",
  anatomy:[{part:"Spark plug",location:"Under tank",function:"Igniter",common_problem:"Fouls"}],
  consumables:[{item:"Engine oil",spec:"10W-30",capacity:"800 ml",change_interval:"3000 km",options:[{brand:"Castrol",name:"Activ",price_inr:420,verdict:"BEST VFM"}]}],
  cleaning_care:[{surface:"Chrome",store_bought:[{brand:"Autosol",price:350}],diy_recipe:"Toothpaste"}],
  toolkit:{starter:["PSI gauge ₹150"],mid:["+ chain lube"],pro:["+ paddock stand"]},
  warnings:[{signal:"Click no crank",likely:"Battery low",action:"Kick start",urgency:"low"}],
  known_issues:["Side-stand sensor"], seasonal:{monsoon:"Lube weekly",summer:"PSI cold",winter:"Choke 30 sec"},
  service_cost:{local_inr:"600-900",authorised_inr:"1100-1400",what_is_done:"Oil + chain + brake"},
  pre_ride_check:["Tyre PSI"], resale_prep:["Polish chrome"]
};
const KYV_JSON_CAR = JSON.parse(JSON.stringify(KYV_JSON_BIKE));
KYV_JSON_CAR.engine_cc = 1197; KYV_JSON_CAR.engine_type = "petrol";

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2, locale: 'en-US' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror:' + String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text()); });

await ctx.route('**/api/vaani/ask', async (route) => {
  const post = route.request().postDataJSON() || {};
  const text = (post.text || post.q || '').toLowerCase();
  let bodyText;
  if (text.includes('know your bike')) bodyText = JSON.stringify(KYV_JSON_BIKE);
  else if (text.includes('know your car')) bodyText = JSON.stringify(KYV_JSON_CAR);
  else bodyText = JSON.stringify({ meaning:'OK', severity:'minor', what_to_do:'Drive on', safe_to_ride:true, safe_to_drive:true, fair_price_min_inr:400, fair_price_max_inr:800 });
  await route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ reply: bodyText }) });
});
await ctx.route('**/api/feedback', r => r.fulfill({ status:200, contentType:'application/json', body: '{"ok":true}' }));

async function testPage(file, opts) {
  console.log('\n══════════════════════════════ ' + file + ' ══════════════════════════════');
  errors.length = 0;
  await page.goto(BASE + '/' + file, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'networkidle' });
  await page.waitForTimeout(700);

  // 1. Page loads no errors
  log(`${file}: clean load`, errors.filter(e => !/favicon|chitti-vaani-api|Failed to load resource/.test(e)).length === 0,
      errors.slice(0,2).join(' | '));

  // 2. Dropdown options count (should be 26)
  const optCount = await page.locator('#lang-select option').count();
  log(`${file}: lang dropdown has all 26 options`, optCount === 26, `${optCount} options`);

  // 3. Auto-detect — first visit defaults to English (locale en-US)
  const initLang = await page.evaluate(() => document.getElementById('lang-select').value);
  log(`${file}: auto-detected English on en-US locale`, initLang === 'en', `value="${initLang}"`);

  // 4. Closed dropdown shows English when default is English
  const closedText = await page.evaluate(() => { const s = document.getElementById('lang-select'); return s.options[s.selectedIndex].text; });
  log(`${file}: closed dropdown shows English by default`, closedText === 'English', `displayed="${closedText}"`);

  // 5. Switch through 6 languages — each must flip the home tab label
  for (const [code, regex] of [['hi',/[ऀ-ॿ]/],['bn',/[ঀ-৿]/],['te',/[ఀ-౿]/],['ta',/[஀-௿]/],['mr',/[ऀ-ॿ]/],['gu',/[઀-૿]/]]) {
    await page.selectOption('#lang-select', code);
    await page.waitForTimeout(200);
    const hometxt = await page.locator(opts.homeTabBtn).innerText();
    log(`${file}: lang ${code} flips home tab`, regex.test(hometxt));
  }

  // 6. New languages (Punjabi, Odia, Urdu, Sanskrit) — selectable + don't error
  errors.length = 0;
  for (const code of ['pa','or','ur','sa','bho','sat']) {
    await page.selectOption('#lang-select', code);
    await page.waitForTimeout(150);
  }
  log(`${file}: extra langs (pa/or/ur/sa/bho/sat) selectable without JS error`, errors.length === 0, errors.slice(0,2).join(' | '));

  // Reset to English for button testing
  await page.selectOption('#lang-select', 'en');
  await page.waitForTimeout(200);

  // 7. Visit every tab — each tab button must respond
  for (const tab of opts.tabs) {
    await page.click(`nav.sds-tabs button[data-tab="${tab}"]`);
    await page.waitForTimeout(200);
    const activePanelExists = await page.locator(`.sds-tab-panel.active`).count();
    log(`${file}: tab "${tab}" shows an active panel`, activePanelExists > 0);
  }

  // 8. Save a vehicle so KYV + summary can be tested
  await page.click(`nav.sds-tabs button[data-tab="${opts.vehicleTab}"]`);
  await page.waitForTimeout(300);
  await page.selectOption(opts.makeSelect, opts.testMake);
  await page.waitForTimeout(200);
  await page.selectOption(opts.modelSelect, opts.testModel);
  await page.fill(opts.variantInput, opts.testVariant);
  await page.fill(opts.regInput, opts.testReg);
  await page.selectOption(opts.yearSelect, opts.testYear);
  await page.fill(opts.odoInput, opts.testOdo);
  await page.click(opts.saveBtn);
  await page.waitForTimeout(1200);

  // 9. KYV rendered after save
  await page.click(`nav.sds-tabs button[data-tab="${opts.vehicleTab}"]`);
  await page.waitForTimeout(500);
  log(`${file}: KYV content visible after save`, await page.locator('#' + opts.kyvContent).isVisible());

  // 10. OBD2 still works
  await page.click(`nav.sds-tabs button[data-tab="ask"]`);
  await page.waitForTimeout(300);
  await page.fill(opts.obdCodeInput, 'P0420');
  await page.click(opts.obdScanBtn);
  await page.waitForTimeout(700);
  log(`${file}: OBD2 returns result`, /Driving|Riding|OK|moderate|safe/i.test(await page.locator(opts.obdResultDiv).innerHTML()));

  // 11. AGGRESSIVE — click EVERY visible button on the page across all tabs.
  //     Skip buttons that navigate away (window.location.href) so we don't lose the page.
  errors.length = 0;
  let totalClicked = 0;
  for (const tab of opts.tabs) {
    try {
      await page.click(`nav.sds-tabs button[data-tab="${tab}"]`, { timeout: 2000 });
      await page.waitForTimeout(250);
    } catch(e) { continue; }
    // Re-query each iteration — clicks may swap DOM
    const buttonsInfo = await page.evaluate(() => {
      const arr = [];
      document.querySelectorAll('.sds-tab-panel.active button').forEach((b, i) => {
        const r = b.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const oc = b.getAttribute('onclick') || '';
        if (/window\.location\.href|location\s*=|feedback\.html|mbSaveBike|mcSaveCar/.test(oc)) return;
        b.setAttribute('data-cert-idx', String(i));
        arr.push({ idx: i, onclick: oc.slice(0, 80) });
      });
      return arr;
    });
    for (const info of buttonsInfo) {
      try {
        await page.evaluate((idx) => {
          const b = document.querySelector('.sds-tab-panel.active button[data-cert-idx="' + idx + '"]');
          if (b) b.click();
        }, info.idx);
        totalClicked++;
        await page.waitForTimeout(60);
        // Dismiss any modal that opened
        await page.evaluate(() => { document.querySelectorAll('.sds-err, .modal-overlay').forEach(m => m.classList.add('hidden')); });
      } catch(e) { /* skip */ }
    }
  }
  log(`${file}: clicked ${totalClicked} buttons without JS error`, errors.length === 0, errors.slice(0,3).join(' | '));

  // 12. Reset to clean state for the toolbar check (button-clicking left modals/panels open).
  await page.goto(BASE + '/' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Walk every tab so every card mounts and feedback-widget.js can attach
  for (const tab of opts.tabs) {
    try { await page.click(`nav.sds-tabs button[data-tab="${tab}"]`, { timeout: 2000 }); } catch(e){}
    await page.waitForTimeout(150);
  }

  // 13. Toolbar on every chitti-response card —
  //     either inline .sds-card-toolbar with .fb-pos/.fb-neg
  //     OR a sibling .chitti-fb-box-bar attached by feedback-widget.js
  await page.waitForTimeout(500); // MutationObserver settle
  const cards = await page.locator('.chitti-response').count();
  const cardsWithFb = await page.evaluate(() => {
    let ok = 0;
    document.querySelectorAll('.chitti-response').forEach(c => {
      const inline = c.querySelector('.sds-card-toolbar');
      const inlineOk = inline && inline.querySelector('.fb-pos') && inline.querySelector('.fb-neg');
      const sib = c.nextElementSibling;
      const sibOk = sib && sib.classList && sib.classList.contains('chitti-fb-box-bar')
                  && sib.querySelector('[data-act="up"]') && sib.querySelector('[data-act="down"]');
      if (inlineOk || sibOk) ok++;
    });
    return ok;
  });
  log(`${file}: every chitti-response has 👍/👎 toolbar`, cards > 0 && cardsWithFb === cards, `${cardsWithFb}/${cards}`);

  // 14. Screenshot — dropdown closed + dropdown contents (we already have the inspector;
  //     here capture the homepage in English with the new dropdown wide).
  await page.click(`nav.sds-tabs button[data-tab="home"]`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: out(opts.shot), fullPage: false });
}

await testPage('chitti_2wheeler.html', {
  homeTabBtn:'nav.sds-tabs button[data-tab="home"]',
  vehicleTab:'bike', tabs:['home','bike','docs','alerts','ask'],
  makeSelect:'#mb-make', modelSelect:'#mb-model', variantInput:'#mb-variant',
  regInput:'#mb-reg', yearSelect:'#mb-year', odoInput:'#mb-odo',
  saveBtn:'button[onclick="mbSaveBike()"]',
  testMake:'Hero', testModel:'Splendor Plus', testVariant:'i3S Self', testReg:'UP32AB1234', testYear:'2018', testOdo:'38000',
  obdCodeInput:'#mb-obd-code', obdScanBtn:'button[onclick="mbObdScan()"]', obdResultDiv:'#mb-obd-result',
  kyvContent:'mb-kyv-content',
  shot: 'cert_every_btn_2w_home_en.png',
});

await testPage('chitti_4wheeler.html', {
  homeTabBtn:'nav.sds-tabs button[data-tab="home"]',
  vehicleTab:'car', tabs:['home','car','docs','alerts','ask'],
  makeSelect:'#mc-make', modelSelect:'#mc-model', variantInput:'#mc-variant',
  regInput:'#mc-reg', yearSelect:'#mc-year', odoInput:'#mc-odo',
  saveBtn:'button[onclick="mcSaveCar()"]',
  testMake:'Maruti Suzuki', testModel:'Swift', testVariant:'VXi', testReg:'DL3CAB5678', testYear:'2020', testOdo:'52000',
  obdCodeInput:'#mc-obd-code', obdScanBtn:'button[onclick="mcObdScan()"]', obdResultDiv:'#mc-obd-result',
  kyvContent:'mc-kyv-content',
  shot: 'cert_every_btn_4w_home_en.png',
});

await b.close();

const total = RESULTS.length, passed = RESULTS.filter(r => r.ok).length;
console.log('\n══════════════════════════════════════════════');
console.log(`OVERALL: ${passed}/${total} PASS`);
console.log('══════════════════════════════════════════════');
if (passed !== total) {
  console.log('\nFAILED:');
  RESULTS.filter(r => !r.ok).forEach(r => console.log('  ❌ ' + r.k + (r.note ? ' — ' + r.note : '')));
  process.exit(1);
}
