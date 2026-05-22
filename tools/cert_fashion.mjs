#!/usr/bin/env node
/**
 * tools/cert_fashion.mjs — Chitti Fashion AI certification.
 * 10 mandated screenshots at 375 × 812 + behavioural assertions.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'http://127.0.0.1:8765';

const results = [];
function check(label, ok, detail){ results.push({label, ok, detail}); console.log(`${ok?'✅':'❌'} ${label}${detail?' — '+detail:''}`); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function freshState(){
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    // wipe IndexedDB Almari
    try { const req = indexedDB.deleteDatabase('chitti_fashion_almari'); await new Promise(r => { req.onsuccess = r; req.onerror = r; req.onblocked = r; }); } catch(e){}
  });
}
async function shot(name){
  const p = resolve(__dirname, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log('   📸 ' + p);
}
async function shotFull(name){
  const p = resolve(__dirname, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log('   📸 ' + p);
}

// ====================================================================
// 1. ALMARI — welcoming empty state after gender pick
// ====================================================================
await freshState();
await page.goto(BASE + '/chitti_fashion.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
// Confirm gender + privacy banner is the first screen
const init = await page.evaluate(() => ({
  privacy: !!document.querySelector('.fa-privacy'),
  genderShown: document.getElementById('fa-onboard').style.display !== 'none',
  bodyPositive: document.querySelector('.fa-gender p')?.textContent || '',
}));
check('Fashion AI — Privacy banner visible on first visit', init.privacy);
check('Fashion AI — Gender picker visible on first visit', init.genderShown);
check('Fashion AI — Body-positivity copy present', /body|शरीर/.test(init.bodyPositive));

// Pick female and capture the empty Almari state
await page.evaluate(() => faSetGender('female', document.querySelector('.fa-gender .opts button[data-g="female"]')));
await page.waitForTimeout(700);
const empty = await page.evaluate(() => ({
  emptyVisible: document.getElementById('fa-almari-empty').style.display !== 'none',
  tabCount: document.querySelectorAll('.sds-tabs button').length,
  emptyTitle: document.querySelector('#fa-almari-empty .title')?.textContent || '',
}));
check('Fashion AI — 5 tabs', empty.tabCount === 5, 'got ' + empty.tabCount);
check('Fashion AI — Almari empty state visible', empty.emptyVisible);
check('Fashion AI — Empty title in Hindi', /अलमारी|बनाइए/.test(empty.emptyTitle));
await shot('sire3_1_fashion_almari_empty.png');

// ====================================================================
// 2. ALMARI — item added with auto-detected colour
// ====================================================================
await page.evaluate(() => faDemoAlmari());
await page.waitForTimeout(800);
const grid = await page.evaluate(() => ({
  tiles: document.querySelectorAll('.fa-grid .fa-tile').length,
  stats: {
    top: document.getElementById('fa-n-top').textContent,
    bottom: document.getElementById('fa-n-bottom').textContent,
    outfit: document.getElementById('fa-n-outfit').textContent,
    foot: document.getElementById('fa-n-foot').textContent,
  },
}));
check('Fashion AI — wardrobe items rendered (demo seed)', grid.tiles >= 5, 'got ' + grid.tiles);
check('Fashion AI — category counters updated', parseInt(grid.stats.top) >= 1);
await page.evaluate(() => window.scrollTo(0, 200));
await page.waitForTimeout(200);
await shotFull('sire3_2_fashion_almari_added.png');

// ====================================================================
// 3. SHOPPING — female outfit rating with earring + footwear pairing
// ====================================================================
const FEMALE_PAYLOAD = {
  stars_fit: 4, stars_colour: 5, stars_match: 4, stars_occasion: 5, stars_value: 3,
  note: 'Yeh navy blue kurta cut perfect hai — clean drape aur season-appropriate cotton fabric. Office aur casual dono ke liye versatile choice.',
  pairing: {
    earrings: 'Gold jhumke ya small silver studs — kurta ka navy tone se gold beautifully complement karega.',
    dupatta: 'Mustard yellow dupatta ya cream zari-bordered — navy ke saath warm contrast.',
    footwear: 'Kolhapuri sandals (brown) ya block heels (nude) — comfortable aur traditional dono.',
    bag: 'Tan leather sling ya jute potli — kurta ka casual + office hybrid look ke liye.',
  },
  fair_price_min_inr: 1400, fair_price_max_inr: 1800,
  cheaper_options: [
    { where: 'Myntra', est_price: 1400 },
    { where: 'Meesho', est_price: 950 },
    { where: 'Local market', est_price: 1100 },
  ],
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(FEMALE_PAYLOAD) }),
}));
await page.evaluate(() => faTab('shopping'));
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.getElementById('fa-shop-desc').value = 'Blue cotton kurta, Pantaloons, M size';
  document.getElementById('fa-shop-price').value = '2000';
  document.getElementById('fa-shop-occ').value = 'office';
});
await page.evaluate(() => faShopRate());
await page.waitForTimeout(700);
const femaleRated = await page.evaluate(() => {
  const t = document.getElementById('fa-shop-result').textContent;
  return {
    has5Rows: document.querySelectorAll('#fa-shop-result .fa-rating-row').length >= 5,
    hasEarring: /Earrings|जhumk|jhumke|गहन/i.test(t) || /Earrings/i.test(t),
    hasFootwear: /Footwear|sandal|Kolhapuri|heel/i.test(t),
    bodyMention: /body|figure|शरीर|आकार|fat|slim|mota|patli/i.test(t),
    hasFairPrice: /सही दाम|₹1400|₹1800/.test(t),
  };
});
check('Shopping female — 5 star rows', femaleRated.has5Rows);
check('Shopping female — earring pairing present', femaleRated.hasEarring);
check('Shopping female — footwear pairing present', femaleRated.hasFootwear);
check('Shopping — NO body commentary in output', !femaleRated.bodyMention);
check('Shopping — fair price card rendered', femaleRated.hasFairPrice);
await shotFull('sire3_3_fashion_shop_female.png');
await page.unroute('**/api/vaani/ask');

// ====================================================================
// 4. SHOPPING — male shirt + trouser with belt+shoe tip
// ====================================================================
const MALE_PAYLOAD = {
  stars_fit: 4, stars_colour: 4, stars_match: 5, stars_occasion: 5, stars_value: 4,
  note: 'Navy formal shirt — collar spread + premium cotton fabric office ke liye ideal. Yeh shade aapke kurta-jeans wardrobe ke saath bhi blend karega.',
  pairing: {
    trouser: 'Grey trousers ya charcoal chinos — navy ke saath classic office look. Beige bhi smart-casual.',
    belt_shoe: 'Brown belt ke saath brown shoes. Black belt ke saath black shoes. Yeh matching galti mat karein.',
    watch: 'Leather strap brown watch — formal navy shirt ke saath perfect. Sport watch avoid karein.',
    formal_casual: 'Collar spread + sleeve length proper hai. Office aur formal dinner dono perfect.',
  },
  fair_price_min_inr: 1500, fair_price_max_inr: 2200,
  cheaper_options: [
    { where: 'Myntra', est_price: 1500 },
    { where: 'Amazon', est_price: 1650 },
  ],
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(MALE_PAYLOAD) }),
}));
// Reset profile to male
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('chitti_fashion_profile_v1') || '{}');
  p.gender = 'male'; localStorage.setItem('chitti_fashion_profile_v1', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => faTab('shopping'));
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.getElementById('fa-shop-desc').value = 'Navy blue formal shirt, Allen Solly, M';
  document.getElementById('fa-shop-price').value = '2200';
  document.getElementById('fa-shop-occ').value = 'office';
});
await page.evaluate(() => faShopRate());
await page.waitForTimeout(800);
const maleRated = await page.evaluate(() => {
  const t = document.getElementById('fa-shop-result').textContent;
  return {
    hasBeltShoe: /Belt|belt|जूते|shoes?/i.test(t),
    hasTrouser: /Trouser|Trousers|trousers/i.test(t),
    hasWatch: /Watch|घड़ी/i.test(t),
    bodyMention: /body|figure|शरीर|fat|skinny|slim|mota|patla/i.test(t),
  };
});
check('Shopping male — belt+shoe pairing present', maleRated.hasBeltShoe);
check('Shopping male — trouser pairing present', maleRated.hasTrouser);
check('Shopping male — watch pairing present', maleRated.hasWatch);
check('Shopping male — NO body commentary in output', !maleRated.bodyMention);
await shotFull('sire3_4_fashion_shop_male.png');
await page.unroute('**/api/vaani/ask');

// ====================================================================
// 5. AAJ KYA PEHNU — 3 outfits from own wardrobe
// ====================================================================
// Ensure female profile + demo wardrobe still present.
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('chitti_fashion_profile_v1') || '{}');
  p.gender = 'female'; localStorage.setItem('chitti_fashion_profile_v1', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => faDemoAlmari());
await page.waitForTimeout(900);

const items = await page.evaluate(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('chitti_fashion_almari', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return await new Promise((res) => { const tx = db.transaction('items','readonly'); const r = tx.objectStore('items').getAll(); r.onsuccess = () => res(r.result || []); });
});
const ids = items.map(i => i.id);
// Stub 3 outfits picking the seeded IDs.
const TODAY_PAYLOAD = {
  outfits: [
    { title:'Office classic', stars:5, pieces:[ids[0],ids[1],ids[3],ids[4]].filter(Boolean),
      why:'Yeh navy top + cream pants combination office ke liye safe + sundar hai. Brown sandal + gold jhumke complete look dete hain.' },
    { title:'Smart casual', stars:4, pieces:[ids[2],ids[3]].filter(Boolean),
      why:'Pink outfit + brown sandals — casual lunch ya weekend brunch ke liye comfortable + put-together.' },
    { title:'Traditional touch', stars:4, pieces:[ids[2],ids[4],ids[3]].filter(Boolean),
      why:'Outfit + gold jewellery + sandals — festive evening ke liye traditional yet modern look.' },
  ],
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(TODAY_PAYLOAD) }),
}));
await page.evaluate(() => faTab('today'));
await page.waitForTimeout(300);
await page.evaluate(() => faToday());
await page.waitForTimeout(900);
const today = await page.evaluate(() => ({
  outfits: document.querySelectorAll('#fa-today-result .fa-outfit').length,
  pieces: document.querySelectorAll('#fa-today-result .fa-outfit .pieces img').length,
}));
check('Aaj Kya Pehnu — 3 outfit cards rendered', today.outfits === 3, 'got ' + today.outfits);
check('Aaj Kya Pehnu — outfit pieces are from wardrobe images', today.pieces >= 3);
await shotFull('sire3_5_fashion_today_3outfits.png');
await page.unroute('**/api/vaani/ask');

// ====================================================================
// 6. TRENDS — India fashion today
// ====================================================================
const TRENDS_PAYLOAD = {
  items: [
    { headline: 'Indo-western fusion: kurta + denim jacket trend wapas aa rahi hai', region_or_source: 'Instagram India',
      bullets: ['College + office dono ke liye versatile.','Sneakers ke saath pair karein.','Solid colour kurta best.'],
      recreate_from_almari: ['Kurta','Denim jacket','Sneakers'], items_to_buy: [{ name:'Denim jacket', est_price_inr: 1200 }] },
    { headline: 'Bollywood wedding: Alia ne pastel saree pe gota patti revival kiya', region_or_source: 'Bollywood',
      bullets: ['Pastel + gold border bridesmaid ke liye perfect.','Statement earrings essential.','Hairstyle simple rakhein.'],
      recreate_from_almari: ['Pastel saree'], items_to_buy: [{ name:'Gota patti dupatta', est_price_inr: 1500 }] },
    { headline: 'Bengali tant saree fall season ka must-have', region_or_source: 'Regional · Bengali',
      bullets: ['Red border white tant + jhumke.','Comfortable hand-loom cotton.','Daily wear bhi ban sakta hai.'],
      recreate_from_almari: ['White saree','Jhumke'], items_to_buy: [{ name:'Tant red-border saree', est_price_inr: 800 }] },
    { headline: 'Punjabi phulkari this Diwali — embroidery comeback', region_or_source: 'Regional · Punjabi',
      bullets: ['Phulkari dupatta + plain suit.','Bright Punjab colours.','Affordable on Meesho.'],
      recreate_from_almari: ['Suit','Dupatta'], items_to_buy: [{ name:'Phulkari dupatta', est_price_inr: 600 }] },
    { headline: 'Budget find: Meesho oversized shirts ₹400 se shuru', region_or_source: 'Budget · Meesho',
      bullets: ['Loose-fit cotton — every body shape works.','Crop top ke neeche layer karein.','Office casual ke liye perfect.'],
      recreate_from_almari: [], items_to_buy: [{ name:'Oversized shirt', est_price_inr: 400 }] },
  ],
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(TRENDS_PAYLOAD) }),
}));
await page.evaluate(() => faTab('trends'));
await page.waitForTimeout(300);
await page.evaluate(() => faLoadTrends(true));
await page.waitForTimeout(700);
const trends = await page.evaluate(() => ({
  cards: document.querySelectorAll('#fa-trends-list .fa-trend').length,
  regional: /Bengali|Punjabi|Rajasthani|South Indian/.test(document.getElementById('fa-trends-list').textContent),
  budget: /Meesho|Myntra|₹400|₹600|₹800/.test(document.getElementById('fa-trends-list').textContent),
}));
check('Trends — 5 cards rendered', trends.cards === 5, 'got ' + trends.cards);
check('Trends — regional fashion celebrated', trends.regional);
check('Trends — budget finds shown', trends.budget);
await shotFull('sire3_6_fashion_trends.png');
await page.unroute('**/api/vaani/ask');

// ====================================================================
// 7. COACH — AI tools + free certs for Fashion Designer
// ====================================================================
const COACH_PAYLOAD = {
  how_ai_helps: 'Designer ke liye AI mood-board banane mein, fabric pattern generate karne mein, aur season-wise trend predict karne mein kaafi shortcut deta hai. Sabyasachi jaise designers already AI use kar rahe hain colour palette decide karne ke liye.',
  best_tools: [
    { name:'Midjourney', url:'https://www.midjourney.com', paid_or_free:'paid', why_for_role:'Concept sketches + mood boards 30 second mein.' },
    { name:'DALL-E (OpenAI)', url:'https://openai.com/dall-e-3', paid_or_free:'freemium', why_for_role:'Garment mockups + flat lays.' },
    { name:'Runway', url:'https://runwayml.com', paid_or_free:'freemium', why_for_role:'Fashion video lookbooks.' },
    { name:'CLO3D', url:'https://www.clo3d.com', paid_or_free:'paid', why_for_role:'Virtual garment design + fit simulation.' },
    { name:'Canva', url:'https://www.canva.com', paid_or_free:'free', why_for_role:'Lookbook + Instagram graphics.' },
    { name:'Findmine', url:'https://findmine.com', paid_or_free:'paid', why_for_role:'AI outfit completion for catalogues.' },
  ],
  free_certifications: [
    { name:'Google UX Design Certificate', provider:'Coursera (audit)', url:'https://www.coursera.org/professional-certificates/google-ux-design', duration:'6 months', why:'UX thinking + visual hierarchy — fashion ke liye useful.' },
    { name:'Canva Design Certification', provider:'Canva Design School', url:'https://www.canva.com/designschool/courses/', duration:'4 hours', why:'Free, certificate diya jaata hai. Lookbook design seekhein.' },
    { name:'Elements of AI', provider:'University of Helsinki', url:'https://www.elementsofai.com', duration:'6 weeks', why:'Foundational AI — free.' },
    { name:'Adobe Creative AI Essentials', provider:'Adobe', url:'https://creativecloud.adobe.com/cc/learn', duration:'10 hours', why:'Photoshop + Illustrator ke AI features.' },
    { name:'NSDC Skill India Fashion', provider:'Skill India', url:'https://www.skillindiadigital.gov.in', duration:'self-paced', why:'India-specific fashion design module — free.' },
  ],
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(COACH_PAYLOAD) }),
}));
await page.evaluate(() => faTab('coach'));
await page.waitForTimeout(300);
await page.evaluate(() => faSetRole('designer', document.querySelector('#fa-role-grid button[data-role="designer"]')));
await page.evaluate(() => faCoachLoad());
await page.waitForTimeout(900);
const coach = await page.evaluate(() => ({
  tools: document.querySelectorAll('#fa-tools-list .sds-doc-row').length,
  certs: document.querySelectorAll('#fa-certs-list .na-cert-card').length,
  realCerts: /Google|Adobe|Canva|NSDC|Elements of AI/.test(document.getElementById('fa-certs-list').textContent),
}));
check('Coach — 6 AI tools listed', coach.tools === 6, 'got ' + coach.tools);
check('Coach — 5 real free certs', coach.certs === 5, 'got ' + coach.certs);
check('Coach — certs from REAL providers', coach.realCerts);
await shotFull('sire3_7_fashion_coach.png');

// ====================================================================
// 8. CERTIFICATE — Sahayai Fashion AI sample
// ====================================================================
await page.evaluate(() => faGenerateCert());
await page.waitForTimeout(500);
const cert = await page.evaluate(() => ({
  visible: document.getElementById('fa-cert-card-wrap').style.display === 'block',
  hasQR: !!document.querySelector('#fa-cert-card img.qr'),
  text: document.getElementById('fa-cert-card').textContent,
}));
check('Certificate — pane visible', cert.visible);
check('Certificate — QR rendered', cert.hasQR);
check('Certificate — mentions Fashion AI + role', /Fashion AI|designer/i.test(cert.text));
check('Certificate — recommends 3 real next certs', /Google|Canva|NSDC|Elements of AI|Adobe/.test(cert.text));
await shotFull('sire3_8_fashion_certificate.png');
await page.unroute('**/api/vaani/ask');

// ====================================================================
// 9. HINDI — Almari 100% Hindi
// ====================================================================
await freshState();
await page.goto(BASE + '/chitti_fashion.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('chitti_vaani_lang', 'hi');
  if (typeof updateAllStrings === 'function') updateAllStrings('hi');
  if (typeof changeLang === 'function') changeLang('hi');
});
await page.waitForTimeout(500);
const hindiTabs = await page.evaluate(() => Array.from(document.querySelectorAll('.sds-tabs button span:nth-child(2)')).map(s => s.textContent));
const hindiEnglish = hindiTabs.filter(t => /^(Wardrobe|Shopping|What to wear today|Trends|Fashion AI Coach|Home)$/i.test(t));
check('Hindi — tabs 100% Hindi (zero English residue)', hindiEnglish.length === 0, 'tabs=' + hindiTabs.join(' / '));
await shot('sire3_9_fashion_hindi.png');

// ====================================================================
// 10. TELUGU — Almari 100% Telugu
// ====================================================================
await freshState();
await page.goto(BASE + '/chitti_fashion.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('chitti_vaani_lang', 'te');
  if (typeof updateAllStrings === 'function') updateAllStrings('te');
  if (typeof changeLang === 'function') changeLang('te');
});
await page.waitForTimeout(500);
const teTabs = await page.evaluate(() => Array.from(document.querySelectorAll('.sds-tabs button span:nth-child(2)')).map(s => s.textContent));
const teEnglish = teTabs.filter(t => /^(Wardrobe|Shopping|Trends|Coach|Home)$/i.test(t));
check('Telugu — tabs 100% Telugu (zero English residue)', teEnglish.length === 0, 'tabs=' + teTabs.join(' / '));
await shot('sire3_10_fashion_telugu.png');

await b.close();
const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
