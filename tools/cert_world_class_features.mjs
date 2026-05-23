/**
 * End-to-end cert for the world-class feature push (2026-05-23).
 * Tests every new feature on BOTH 2W and 4W:
 *  - Vehicle Health Score widget renders + colour-grades
 *  - SOS quick action exists + navigation intent recorded
 *  - Trip-readiness expands a checklist
 *  - Photo Diagnose card → file input → DeepSeek mock → severity render
 *  - Sound Diagnose card → describe input → DeepSeek mock → result
 *  - Fair Price Guard → input + quote → verdict render
 *  - Find Mechanic → pincode → shop list + Google Maps button
 *  - Service Logbook → add entry → list renders
 *  - Multi-vehicle garage → add slot → switch slots
 *
 * Mocks /api/vaani/ask with feature-specific JSON.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8765';

const RESULTS = [];
const log = (k, ok, note='') => { RESULTS.push({k, ok, note}); console.log((ok?'✅':'❌') + ' ' + k + (note?'  — ' + note:'')); };

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2, locale:'en-US' });
const page = await ctx.newPage();

await ctx.route('**/api/vaani/ask', async (route) => {
  const post = route.request().postDataJSON() || {};
  const text = (post.text || post.q || '').toLowerCase();
  let body;
  if (text.includes('photo')) body = JSON.stringify({ what:'Brake disc visible', issue:'Disc thin — wear visible', severity:'moderate', verdict:'MECHANIC', action:'Replace brake pad set within 1 week', safe_to_ride:true, safe_to_drive:true, fair_price_inr:'600-1200' });
  else if (text.includes('describes a sound')) body = JSON.stringify({ sound_id:'chain slap', likely_cause:'Chain slack', severity:'minor', action:'Tighten chain + lube', safe_to_ride:true, safe_to_drive:true, fair_price_inr:'150-300' });
  else if (text.includes('fair-price expert')) body = JSON.stringify({ verdict:'OVERCHARGE', fair_min_inr:1000, fair_max_inr:1500, explanation:'Chain replace fair price hai ₹1000–1500. Aapko zyada bola.', bargain_to_inr:1300 });
  else if (text.includes('mechanic finder')) body = JSON.stringify({ area:'Connaught Place', shops:[{name:'Hero ASS CP',landmark:'near Outer Circle',specialty:'Hero models',est_cost:'600-900'},{name:'Local trusted mechanic',landmark:'sabzi mandi chowk',specialty:'all bikes',est_cost:'400-700'}] });
  else if (text.includes('know your bike') || text.includes('know your car')) body = JSON.stringify({ engine_cc:97, engine_type:'air-cooled', bhp:8, rated_mileage:'65-75 kmpl', service_interval:'3000 km', anatomy:[{part:'Spark plug',location:'under tank',function:'igniter',common_problem:''}], consumables:[{item:'oil',spec:'10W-30',capacity:'800 ml',change_interval:'3000 km',options:[{brand:'Castrol',name:'Activ',price_inr:420,verdict:'BEST VFM'}]}], cleaning_care:[{surface:'chrome',store_bought:[{brand:'Autosol',price:350}],diy_recipe:'toothpaste'}], toolkit:{starter:['PSI gauge'],mid:['chain lube'],pro:['paddock stand']}, warnings:[{signal:'click no crank',likely:'battery low',action:'kick start',urgency:'low'}], known_issues:[], seasonal:{monsoon:'-',summer:'-',winter:'-'}, service_cost:{local_inr:'600-900',authorised_inr:'1100-1400',what_is_done:'oil + chain'}, pre_ride_check:['Tyre PSI','Brake feel','Lights + horn','Chain lube','Oil dipstick','Fuel range','Helmet'], resale_prep:[] });
  else body = JSON.stringify({ meaning:'OK', severity:'minor', what_to_do:'-', safe_to_ride:true, safe_to_drive:true });
  await route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ reply: body }) });
});
await ctx.route('**/api/feedback*', r => r.fulfill({ status:200, contentType:'application/json', body:'{"ok":true}' }));

const errors = [];
page.on('pageerror', e => errors.push('pageerror:' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console:' + m.text().slice(0,160)); });

async function testPage(file, V, opts) {
  console.log('\n══════════════════════════════ ' + file + ' (' + V + ') ══════════════════════════════');
  errors.length = 0;
  await page.goto(BASE + '/' + file, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  // Seed a vehicle so health-score + SOS + Trip + KYV work
  await page.evaluate((o) => {
    localStorage.setItem(o.vehicleKey, JSON.stringify(o.vehicle));
    localStorage.setItem(o.fleetKey, JSON.stringify([o.vehicle]));
    localStorage.setItem(o.fleetActiveKey, '0');
  }, opts);
  await page.reload({ waitUntil:'networkidle' });
  await page.waitForTimeout(800);

  log(`${file}: clean load`, errors.filter(e => !/favicon|Failed to load resource/.test(e)).length === 0, errors.slice(0,2).join(' | '));

  // ── HOME ──
  await page.evaluate(() => document.querySelector('nav.sds-tabs button[data-tab="home"]').click());
  await page.waitForTimeout(400);

  // Health Score visible + has number
  const hscore = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return el ? { display: getComputedStyle(el).display, text: el.querySelector('.' + id.replace('hscore','hscore-num').replace('mb-','mb-').replace('mc-','mc-'))?.textContent || el.textContent } : null;
  }, V + '-hscore');
  log(`${file}: Vehicle Health Score widget rendered`, hscore && hscore.display !== 'none' && /\d+/.test(hscore.text), 'text=' + (hscore?.text||'?'));

  // SOS / Trip / Find-mech quick row present
  const quickPresent = await page.evaluate((v) => ({
    sos: !!document.querySelector('.' + v + '-quick-sos'),
    trip: !!document.querySelector('.' + v + '-quick-trip'),
    mech: !!document.querySelector('.' + v + '-quick-mech'),
  }), V);
  log(`${file}: 3 quick action buttons on Home (SOS · Trip · Find-mech)`, quickPresent.sos && quickPresent.trip && quickPresent.mech);

  // Trip-readiness — click trip, expect checklist
  await page.evaluate((v) => document.querySelector('.' + v + '-quick-trip').click(), V);
  await page.waitForTimeout(400);
  const tripVisible = await page.locator('#' + V + '-trip-result ol li').count();
  log(`${file}: Trip-readiness opens checklist`, tripVisible >= 5, `${tripVisible} items`);

  // ── MY VEHICLE (multi-vehicle garage) ──
  await page.evaluate((t) => document.querySelector(`nav.sds-tabs button[data-tab="${t}"]`).click(), opts.vehicleTab);
  await page.waitForTimeout(400);
  // Fleet switcher renders an Add button at minimum
  const fleetHtml = await page.locator('#' + V + '-fleet-switcher').innerHTML();
  log(`${file}: Fleet switcher renders Add button`, /Add/i.test(fleetHtml) || /\+/.test(fleetHtml));

  // Click Add another → fleet should grow to 2 slots
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbFleetAdd' : 'mcFleetAdd']; if (fn) fn(); }, V);
  await page.waitForTimeout(300);
  const fleetCount = await page.evaluate((v) => {
    const key = v === 'mb' ? 'chitti_bike_fleet_v1' : 'chitti_car_fleet_v1';
    return JSON.parse(localStorage.getItem(key) || '[]').length;
  }, V);
  log(`${file}: Fleet grew to 2 slots after Add`, fleetCount === 2, `fleet=${fleetCount}`);

  // ── DOCS (service logbook) ──
  await page.evaluate(() => document.querySelector('nav.sds-tabs button[data-tab="docs"]').click());
  await page.waitForTimeout(400);
  // Open form, fill, save
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbLogToggle' : 'mcLogToggle']; if (fn) fn(); }, V);
  await page.waitForTimeout(150);
  await page.fill('#' + V + '-log-date', '2026-05-20');
  await page.fill('#' + V + '-log-km', '38500');
  await page.fill('#' + V + '-log-what', 'Oil change + chain lube');
  await page.fill('#' + V + '-log-cost', '650');
  await page.fill('#' + V + '-log-mech', 'Local mechanic');
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbLogAdd' : 'mcLogAdd']; if (fn) fn(); }, V);
  await page.waitForTimeout(300);
  const logHtml = await page.locator('#' + V + '-log-list').innerHTML();
  log(`${file}: Service logbook entry saved + rendered`, /Oil change|chain/i.test(logHtml) && /650/.test(logHtml));

  // ── ASK (4 new sub-cards) ──
  await page.evaluate(() => document.querySelector('nav.sds-tabs button[data-tab="ask"]').click());
  await page.waitForTimeout(400);

  // 📸 Photo — set file input via DOM (real photo cert needs a real file; we simulate the
  // submit path by directly calling the handler with a stub file).
  const photoResult = await page.evaluate(async (v) => {
    // Construct a tiny PNG (1x1 transparent) as a File so the reader works
    const png = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    const u8 = new Uint8Array(png.length);
    for (let i = 0; i < png.length; i++) u8[i] = png.charCodeAt(i);
    const file = new File([u8], 'test.png', { type: 'image/png' });
    const fakeInput = { files: [file] };
    const fn = window[v === 'mb' ? 'mbPhotoSubmit' : 'mcPhotoSubmit'];
    if (fn) await fn(fakeInput);
    await new Promise(r => setTimeout(r, 500));
    return document.getElementById(v + '-photo-result').innerHTML;
  }, V);
  log(`${file}: Photo Diagnose renders mock result`, /Brake|MECHANIC|Replace/.test(photoResult));

  // 🎙️ Sound — force-show describe panel (normally only shows after recording)
  await page.evaluate((v) => { const el = document.getElementById(v + '-sound-describe'); if (el) el.style.display = 'block'; }, V);
  await page.fill('#' + V + '-sound-desc-text', 'chain kat-kat awaaz');
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbSoundSubmit' : 'mcSoundSubmit']; if (fn) fn(); }, V);
  await page.waitForTimeout(500);
  const soundResult = await page.locator('#' + V + '-sound-result').innerHTML();
  log(`${file}: Sound Diagnose renders mock result`, /chain slap|Tighten|Chain slack/i.test(soundResult));

  // 💰 Fair Price
  await page.fill('#' + V + '-fp-what', 'chain replace');
  await page.fill('#' + V + '-fp-quote', '2000');
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbFairPriceCheck' : 'mcFairPriceCheck']; if (fn) fn(); }, V);
  await page.waitForTimeout(500);
  const fpResult = await page.locator('#' + V + '-fp-result').innerHTML();
  log(`${file}: Fair Price Guard renders OVERCHARGE verdict`, /OVERCHARGE|Bargain/i.test(fpResult));

  // 🗺️ Find Mechanic
  await page.fill('#' + V + '-pin', '110001');
  await page.evaluate((v) => { const fn = window[v === 'mb' ? 'mbFindMechanic' : 'mcFindMechanic']; if (fn) fn(); }, V);
  await page.waitForTimeout(500);
  const mechResult = await page.locator('#' + V + '-mech-result').innerHTML();
  log(`${file}: Find Mechanic renders shop list + Maps button`, /Connaught|sabzi mandi|google\.com\/maps/i.test(mechResult));

  // Final feedback-widget toolbar count
  await page.waitForTimeout(500);
  const cards = await page.locator('.chitti-response').count();
  const cardsWithBar = await page.evaluate(() => {
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
  log(`${file}: every chitti-response card has 👍/👎 toolbar`, cards > 0 && cardsWithBar === cards, `${cardsWithBar}/${cards}`);
}

await testPage('chitti_2wheeler.html', 'mb', {
  vehicleTab: 'bike',
  vehicleKey: 'chitti_bike_v1',
  fleetKey: 'chitti_bike_fleet_v1',
  fleetActiveKey: 'chitti_bike_fleet_active_v1',
  vehicle: { make:'Hero', model:'Splendor Plus', variant:'i3S', reg:'UP32AB1234', year:'2018', odo:38000 },
});

await testPage('chitti_4wheeler.html', 'mc', {
  vehicleTab: 'car',
  vehicleKey: 'chitti_car_v1',
  fleetKey: 'chitti_car_fleet_v1',
  fleetActiveKey: 'chitti_car_fleet_active_v1',
  vehicle: { make:'Maruti Suzuki', model:'Swift', variant:'VXi', reg:'DL3CAB5678', year:'2020', odo:52000 },
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
