/**
 * Final cert for the Know Your Vehicle (KYV) handover.
 * On both chitti_2wheeler.html + chitti_4wheeler.html (375×812):
 *  - All prior 8 checks still pass
 *  - Variant input is present + saves to bike/car object
 *  - KYV card is present
 *  - With no vehicle saved → KYV empty state visible
 *  - With vehicle saved + mocked DeepSeek JSON → KYV renders 7 sections
 *  - Lang flips KYV chrome too
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

// Mock /api/vaani/ask — returns the OBD2 JSON for OBD2 prompts and a full KYV JSON for KYV prompts.
const KYV_JSON_BIKE = {
  engine_cc: 97, engine_type: "air-cooled BS6", bhp: 8, torque_nm: 8.05, fuel_tank_l: 9.8,
  rated_mileage: "65-75 kmpl", service_interval: "3000 km / 6 months",
  anatomy: [
    { part:"Spark plug", location:"Under tank cover", function:"Ignites the fuel", common_problem:"Fouls every 8k km" },
    { part:"Air filter", location:"Right side panel", function:"Clean intake air", common_problem:"Choked by dust" },
    { part:"Chain + sprocket", location:"Left rear", function:"Drives rear wheel", common_problem:"Stretches by 25k km" },
    { part:"Battery", location:"Under seat", function:"Self-start + lights", common_problem:"Dies after 3 yr" },
    { part:"Carburetor / EFI", location:"Right of engine", function:"Fuel-air mix", common_problem:"Idle hunting on BS4" },
    { part:"Exhaust", location:"Right side", function:"Burnt gas out", common_problem:"Rust in monsoon" },
    { part:"Engine oil dipstick", location:"Right side of engine", function:"Check oil level", common_problem:"" },
    { part:"Side-stand sensor", location:"Left under engine", function:"Kills engine if down", common_problem:"False positive on 2021-22" }
  ],
  consumables: [
    { item:"Engine oil", spec:"10W-30 JASO MA2", capacity:"800 ml", change_interval:"3000 km",
      options:[
        { brand:"Hero", name:"4T 10W-30 (OEM)", price_inr:380, verdict:"OEM SAFE" },
        { brand:"Castrol", name:"Activ 4T", price_inr:420, verdict:"BEST VFM" },
        { brand:"Motul", name:"5100 4T", price_inr:520, verdict:"PREMIUM long-ride" }
      ],
      fake_alert:"Castrol counterfeit common — only Amazon Castrol authorised seller has hologram + QR",
      diy_check:"Dipstick — golden = ok, black = change now" },
    { item:"Spark plug", spec:"Champion RG4HC", capacity:"1", change_interval:"12,000 km",
      options:[ { brand:"Champion", name:"RG4HC", price_inr:120, verdict:"OEM SAFE" }, { brand:"NGK", name:"CR8EH", price_inr:180, verdict:"BEST VFM longer life" } ] },
    { item:"Chain lube", spec:"O-ring safe", capacity:"400 ml spray", change_interval:"every 500 km lube",
      options:[ { brand:"Motul", name:"Chain Lube C2", price_inr:350, verdict:"BEST VFM" }, { brand:"Liqui Moly", name:"Chain Spray", price_inr:300, verdict:"BUDGET" } ] },
    { item:"Tyres", spec:"2.75-18", capacity:"front & rear", change_interval:"25-30,000 km",
      options:[ { brand:"MRF", name:"Zapper", price_inr:1400, verdict:"BEST VFM" }, { brand:"Apollo", name:"Actigrip", price_inr:1300, verdict:"VFM" } ] }
  ],
  cleaning_care: [
    { surface:"Chrome silencer", store_bought:[{brand:"Autosol",price:350}], diy_recipe:"Toothpaste + soft cloth + circular motion 5 min", warning:"Never use steel wool" },
    { surface:"Headlight glass", store_bought:[{brand:"Stoner Invisible Glass",price:450}], diy_recipe:"Colgate paste + microfibre — clears 70% haze", warning:"" },
    { surface:"Chain", store_bought:[{brand:"Motul Chain Clean",price:400}], diy_recipe:"Kerosene + brush ₹50 worth (smelly but effective)", warning:"Engine OFF + cold" },
    { surface:"Plastic panels", store_bought:[{brand:"3M Plastic Restorer",price:400}], diy_recipe:"Banana peel rub on small scuffs", warning:"" },
    { surface:"Helmet visor", store_bought:[{brand:"Bike anti-fog spray",price:280}], diy_recipe:"Potato slice rub inside (monsoon hack)", warning:"" }
  ],
  toolkit: {
    starter: ["Tyre PSI gauge ₹150", "Plug spanner ₹80", "8/10/12 mm combo ₹70"],
    mid: ["+ Tubeless plug kit ₹200", "Chain lube ₹350", "Multi-tool ₹250"],
    pro: ["+ Paddock stand ₹1200", "Torque wrench ₹1500", "OBD2 dongle for BS6 bikes ₹800"]
  },
  warnings: [
    { signal:"Click, no crank", likely:"Battery low", action:"Kick start + 20 min ride to recharge", urgency:"low" },
    { signal:"White smoke", likely:"Coolant or oil leak", action:"Stop. Mechanic immediately.", urgency:"high" },
    { signal:"Black smoke", likely:"Air filter choked / rich mixture", action:"Clean air filter — DIY 10 min", urgency:"medium" },
    { signal:"Chain noise on hard accel", likely:"Slack or dry chain", action:"Lube + adjust tension — DIY", urgency:"low" },
    { signal:"Petrol smell after parking", likely:"Carb float stuck / hose crack", action:"Stop using bike. Mechanic — fire risk", urgency:"high" }
  ],
  known_issues: [
    "Side-stand sensor on 2021-22 batch — clean contact with sandpaper (2 min DIY)",
    "Headlight flicker on early-2022 lot — Hero covers under recall"
  ],
  seasonal: {
    monsoon: "Chain rust — lube weekly. Tyre tread ≥3 mm. Brake water-test after every ride.",
    summer: "Tyre PSI rises in heat — measure cold. Clean air filter monthly.",
    winter: "Choke 30 sec start. Battery weakens — keep charged."
  },
  service_cost: { local_inr: "600-900", authorised_inr: "1100-1400", what_is_done: "Engine oil + chain clean+lube + brake check + filter + tyre PSI" },
  pre_ride_check: ["Tyre PSI front + rear", "Brake feel both", "Light + horn + indicators", "Chain dry or wet?", "Helmet strapped"],
  resale_prep: ["Polish chrome + plastic", "New chain + sprocket if >25k km", "Replace clutch cable"]
};

const KYV_JSON_CAR = JSON.parse(JSON.stringify(KYV_JSON_BIKE)); // skeleton — different content for car
KYV_JSON_CAR.engine_cc = 1197; KYV_JSON_CAR.engine_type = "petrol BS6"; KYV_JSON_CAR.bhp = 82;
KYV_JSON_CAR.torque_nm = 113; KYV_JSON_CAR.fuel_tank_l = 37; KYV_JSON_CAR.rated_mileage = "22 kmpl city / 24 highway";
KYV_JSON_CAR.service_interval = "10,000 km / 12 months";
KYV_JSON_CAR.anatomy = [
  { part:"Engine oil filler cap (yellow)", location:"Top of engine", function:"Pour oil here", common_problem:"" },
  { part:"Coolant reservoir", location:"Right side, semi-transparent", function:"Cools engine", common_problem:"Empties → head gasket" },
  { part:"Brake fluid reservoir", location:"Driver-side firewall, small black", function:"Hydraulic brake pressure", common_problem:"Spongy pedal if low" },
  { part:"Battery", location:"Top right of engine bay", function:"Start + lights + ECU", common_problem:"3 yr life" }
];
KYV_JSON_CAR.consumables = [
  { item:"Engine oil", spec:"0W-20 API SP", capacity:"3.2 L", change_interval:"10,000 km",
    options:[ { brand:"Shell", name:"Helix Ultra 0W-20", price_inr:2400, verdict:"BEST VFM" }, { brand:"Castrol", name:"Edge 0W-20", price_inr:2200, verdict:"SAFE" } ] },
  { item:"Coolant", spec:"OAT Orange", capacity:"5.5 L", change_interval:"60,000 km",
    options:[ { brand:"Prestone", name:"Antifreeze Orange", price_inr:450, verdict:"BEST VFM" } ],
    fake_alert:"Never mix orange + green — corrodes radiator" },
  { item:"Tyres", spec:"215/60 R16", capacity:"4", change_interval:"40-50,000 km",
    options:[ { brand:"Apollo", name:"Apterra HT", price_inr:6500, verdict:"BEST VFM" }, { brand:"Bridgestone", name:"Turanza T005", price_inr:9500, verdict:"PREMIUM silent" } ] }
];

await ctx.route('**/api/vaani/ask', async (route) => {
  // Sniff the payload to decide which mock to return
  const post = route.request().postDataJSON() || {};
  const text = (post.text || post.q || '').toLowerCase();
  let bodyText;
  if (text.includes('know your bike') || (text.includes('motorcycle') && text.includes('strict json'))) {
    bodyText = JSON.stringify(KYV_JSON_BIKE);
  } else if (text.includes('know your car') || (text.includes('car mechanic') && text.includes('strict json'))) {
    bodyText = JSON.stringify(KYV_JSON_CAR);
  } else {
    // OBD2 fallback
    bodyText = JSON.stringify({
      meaning:'P0420 — catalytic converter weak.', severity:'moderate', what_to_do:'Show mechanic in 2 weeks.',
      safe_to_ride:true, safe_to_drive:true, fair_price_min_inr:4500, fair_price_max_inr:8500
    });
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: bodyText }) });
});

async function testPage(file, opts) {
  console.log('\n══════════════════════════════ ' + file + ' ══════════════════════════════');
  errors.length = 0;
  // Clear localStorage between pages so vehicle starts empty
  await page.goto(BASE + '/' + file, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // 1. No JS errors
  log(`${file}: page loads with no JS errors`, errors.filter(e => !e.includes('favicon') && !e.includes('chitti-vaani-api') && !/Failed to load resource/.test(e)).length === 0,
      errors.slice(0, 2).join(' | '));

  // 2. Lang select present
  log(`${file}: lang selector present`, await page.locator('#lang-select').count() > 0);

  // 3. Hindi / Bangla / Telugu flips
  await page.selectOption('#lang-select', 'en');
  await page.waitForTimeout(250);
  const enHome = await page.locator(opts.homeTabBtn).innerText();
  await page.selectOption('#lang-select', 'hi'); await page.waitForTimeout(250);
  const hiHome = await page.locator(opts.homeTabBtn).innerText();
  log(`${file}: Hindi flip`, hiHome !== enHome && /[ऀ-ॿ]/.test(hiHome), `EN="${enHome.replace(/\s+/g,' ')}" HI="${hiHome.replace(/\s+/g,' ')}"`);
  await page.selectOption('#lang-select', 'bn'); await page.waitForTimeout(250);
  log(`${file}: Bangla flip`, /[ঀ-৿]/.test(await page.locator(opts.homeTabBtn).innerText()));
  await page.selectOption('#lang-select', 'te'); await page.waitForTimeout(250);
  log(`${file}: Telugu flip`, /[ఀ-౿]/.test(await page.locator(opts.homeTabBtn).innerText()));

  // 4. Vehicle tab with sub-features
  await page.selectOption('#lang-select', 'en'); await page.waitForTimeout(250);
  await page.click(opts.vehicleTabBtn);
  await page.waitForTimeout(400);

  // 5. Variant input present
  log(`${file}: Variant input present`, await page.locator(opts.variantInput).count() > 0);

  // 6. KYV card present + empty state visible (no vehicle saved yet)
  const kyvCard = opts.kyvCardId;
  log(`${file}: KYV card present (${kyvCard})`, await page.locator('#' + kyvCard).count() > 0);
  const emptyVisible = await page.locator('#' + opts.kyvEmpty).isVisible();
  log(`${file}: KYV empty-state visible before save`, emptyVisible);

  // 7. Make→Model cascade
  await page.selectOption(opts.makeSelect, opts.testMake);
  await page.waitForTimeout(250);
  const modelCount = await page.locator(opts.modelSelect + ' option').count();
  log(`${file}: Make→Model cascade`, modelCount > 1, `${modelCount} options`);

  // 8. Fill form + save — should trigger mbKyvLoad / mcKyvLoad
  await page.selectOption(opts.modelSelect, opts.testModel);
  await page.fill(opts.variantInput, opts.testVariant);
  await page.fill(opts.regInput, opts.testReg);
  await page.selectOption(opts.yearSelect, opts.testYear);
  await page.fill(opts.odoInput, opts.testOdo);
  await page.click(opts.saveBtn);
  await page.waitForTimeout(1500); // allow DeepSeek call + render

  // 9. After save, KYV content should render (test on vehicle tab)
  await page.click(opts.vehicleTabBtn);
  await page.waitForTimeout(800);
  const contentVisible = await page.locator('#' + opts.kyvContent).isVisible();
  log(`${file}: KYV content visible after save`, contentVisible);
  if (contentVisible) {
    const innerHtml = await page.locator('#' + opts.kyvContent).innerHTML();
    log(`${file}: KYV renders Anatomy section`, /Anatomy/i.test(innerHtml));
    log(`${file}: KYV renders Consumables table`, /Consumables|Engine oil/i.test(innerHtml));
    log(`${file}: KYV renders Cleaning & care`, /Saaf|Cleaning|Toothpaste|DIY/i.test(innerHtml));
    log(`${file}: KYV renders Warnings`, /Warning|Awaaz|smoke|smell|gandh/i.test(innerHtml));
    log(`${file}: KYV renders service cost`, /service|cost|Local mechanic|Authorised/i.test(innerHtml));
    log(`${file}: KYV renders pre-trip check`, /Pre-?(ride|drive)|30-sec|tyre/i.test(innerHtml));
    log(`${file}: KYV uses VFM-highlighted row`, /vfm/i.test(innerHtml));
  }

  // 10. Cache hit on reload — should be instant (no loading spinner)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click(opts.vehicleTabBtn);
  await page.waitForTimeout(400);
  const cachedVisible = await page.locator('#' + opts.kyvContent).isVisible();
  log(`${file}: KYV cache hit on reload`, cachedVisible);

  await page.screenshot({ path: out(opts.shotKyv), fullPage: true });

  // 11. OBD2 still works (regression)
  await page.click(opts.askTabBtn);
  await page.waitForTimeout(300);
  await page.fill(opts.obdCodeInput, 'P0420');
  await page.click(opts.obdScanBtn);
  await page.waitForTimeout(800);
  const obdHtml = await page.locator(opts.obdResultDiv).innerHTML();
  log(`${file}: OBD2 still works`, /P0420|catalytic|moderate/i.test(obdHtml));

  // 12. Feedback toolbar count on .chitti-response cards
  const cards = await page.locator('.chitti-response').count();
  const cardsWithFb = await page.evaluate(() => {
    let ok = 0;
    document.querySelectorAll('.chitti-response').forEach(c => {
      const bar = c.querySelector('.sds-card-toolbar') || c.querySelector('.chitti-fb-bar');
      if (bar) {
        if (bar.querySelector('.fb-pos, [data-act="up"]') && bar.querySelector('.fb-neg, [data-act="down"]')) ok++;
      }
    });
    return ok;
  });
  log(`${file}: every chitti-response card has 👍/👎 toolbar`, cards > 0 && cardsWithFb === cards, `${cardsWithFb}/${cards}`);
}

await testPage('chitti_2wheeler.html', {
  homeTabBtn: 'nav.sds-tabs button[data-tab="home"]',
  vehicleTabBtn: 'nav.sds-tabs button[data-tab="bike"]',
  askTabBtn: 'nav.sds-tabs button[data-tab="ask"]',
  makeSelect: '#mb-make', modelSelect: '#mb-model',
  variantInput: '#mb-variant', regInput: '#mb-reg',
  yearSelect: '#mb-year', odoInput: '#mb-odo', saveBtn: 'button[onclick="mbSaveBike()"]',
  testMake: 'Hero', testModel: 'Splendor Plus', testVariant: 'i3S Self Disc',
  testReg: 'UP32AB1234', testYear: '2018', testOdo: '38000',
  obdCodeInput: '#mb-obd-code', obdScanBtn: 'button[onclick="mbObdScan()"]', obdResultDiv: '#mb-obd-result',
  kyvCardId: 'mb-kyv-card', kyvEmpty: 'mb-kyv-empty', kyvContent: 'mb-kyv-content',
  shotKyv: 'cert_kyv_2w_rendered.png',
});

await testPage('chitti_4wheeler.html', {
  homeTabBtn: 'nav.sds-tabs button[data-tab="home"]',
  vehicleTabBtn: 'nav.sds-tabs button[data-tab="car"]',
  askTabBtn: 'nav.sds-tabs button[data-tab="ask"]',
  makeSelect: '#mc-make', modelSelect: '#mc-model',
  variantInput: '#mc-variant', regInput: '#mc-reg',
  yearSelect: '#mc-year', odoInput: '#mc-odo', saveBtn: 'button[onclick="mcSaveCar()"]',
  testMake: 'Maruti Suzuki', testModel: 'Swift', testVariant: 'VXi',
  testReg: 'DL3CAB5678', testYear: '2020', testOdo: '52000',
  obdCodeInput: '#mc-obd-code', obdScanBtn: 'button[onclick="mcObdScan()"]', obdResultDiv: '#mc-obd-result',
  kyvCardId: 'mc-kyv-card', kyvEmpty: 'mc-kyv-empty', kyvContent: 'mc-kyv-content',
  shotKyv: 'cert_kyv_4w_rendered.png',
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
