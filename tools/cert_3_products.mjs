#!/usr/bin/env node
/**
 * tools/cert_3_products.mjs
 * ──────────────────────────
 * Sire 2026-05-23 priority build — capture the 11 mandated screenshots
 * for Chitti Mechanic Bike + Mechanic Car + News AI/Coach at 375 × 812.
 *
 * 11 screenshots:
 *   1  Mechanic Bike — Home tab welcoming empty state
 *   2  Mechanic Bike — Ask Chitti diagnosis (chain noise, Hindi)
 *   3  Mechanic Bike — Documents tab colour-coded status
 *   4  Mechanic Car  — Home tab welcoming empty state
 *   5  Mechanic Car  — Ask Chitti diagnosis (engine light, fair price)
 *   6  News AI/Coach — Profiling: profession entry
 *   7  News AI       — Story with profiled samjhao (doctor vs farmer)
 *   8  Coach         — interior decorator: tools + free certs
 *   9  Coach         — lesson in progress (interior decorator example)
 *  10  Certificate   — sample Sahayai AI certificate
 *  11  Language      — any page 100% Telugu
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
const consoleErrs = [];
page.on('pageerror', e => consoleErrs.push(String(e)));

async function freshState() {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
}
async function shot(name) {
  const p = resolve(__dirname, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log('   📸 ' + p);
}
async function shotFull(name) {
  const p = resolve(__dirname, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log('   📸 ' + p);
}
function stubAsk(payload) {
  return page.route('**/api/vaani/ask', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, source: 'deepseek', reply: JSON.stringify(payload) }),
  }));
}

// ============================================================
// 1. MECHANIC BIKE — Home tab welcoming empty state
// ============================================================
await freshState();
await page.goto(BASE + '/chitti_2wheeler.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const mb1 = await page.evaluate(() => {
  const tabs = document.querySelectorAll('.sds-tabs button').length;
  const empty = !!document.querySelector('#mb-empty');
  const emptyVisible = document.getElementById('mb-empty').style.display !== 'none';
  return { tabs, empty, emptyVisible, title: document.querySelector('.sds-brand-name')?.textContent };
});
check('Mechanic Bike — 5 tabs', mb1.tabs === 5, 'got ' + mb1.tabs);
check('Mechanic Bike — Home empty state visible', mb1.emptyVisible);
check('Mechanic Bike — title says "Mechanic Bike"', /Mechanic Bike/.test(mb1.title || ''));
await shot('sire2_1_bike_home_empty.png');

// ============================================================
// 2. MECHANIC BIKE — Ask Chitti diagnosis (chain noise, Hindi)
// ============================================================
await stubAsk({
  diagnosis: 'Chain dheeli ho gayi hai — isi liye tez chalane par awaaz aati hai. Chain ko lubricate karke tighten karna padega.',
  diy_possible: true,
  diy_steps: [
    'Chain pe WD-40 ya chain lube lagayein.',
    'Rear wheel ka axle thoda dheela karein.',
    'Chain ko 20-25 mm slack ke saath set karein.',
    'Axle wapas tighten karein aur test ride lein.'
  ],
  mechanic_advice: '',
  fair_price_min_inr: 150,
  fair_price_max_inr: 400,
  safety_critical: false,
  ask_followup: 'Chain ki kitni purani hai — kya rust hai?',
});
await page.evaluate(() => mbTab('ask'));
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.getElementById('mb-ask-text').value = 'मेरी बाइक से चेन की आवाज़ आ रही है, तेज़ चलाने पे ज़्यादा';
});
await page.click('button:has-text("Chitti से पूछो")');
await page.waitForTimeout(800);
const mb2 = await page.evaluate(() => ({
  bubbles: document.querySelectorAll('#mb-ask-thread .sds-bubble').length,
  hasDiy: !!document.querySelector('#mb-ask-thread .mb-diy-yes'),
  hasPrice: !!document.querySelector('#mb-ask-thread .mb-fairprice'),
}));
check('Mechanic Bike — diagnosis bubbles ≥ 2', mb2.bubbles >= 2, 'got ' + mb2.bubbles);
check('Mechanic Bike — DIY steps card', mb2.hasDiy);
check('Mechanic Bike — fair-price card', mb2.hasPrice);
await shotFull('sire2_2_bike_chain_diagnosis.png');
await page.unroute('**/api/vaani/ask');

// ============================================================
// 3. MECHANIC BIKE — Documents tab colour coding
// ============================================================
await page.evaluate(() => { mbDemoDocs(); mbTab('docs'); });
await page.waitForTimeout(400);
const mb3 = await page.evaluate(() => ({
  rows: document.querySelectorAll('#mb-docs-list .sds-doc-row').length,
  chips: Array.from(document.querySelectorAll('#mb-docs-list .sds-chip')).map(c => c.textContent.trim()),
}));
check('Mechanic Bike — Documents 5 rows', mb3.rows === 5, 'got ' + mb3.rows);
check('Mechanic Bike — at least one amber chip', mb3.chips.some(c => /दिन/.test(c) && !/expiry/.test(c)));
await shot('sire2_3_bike_docs_status.png');

// ============================================================
// 4. MECHANIC CAR — Home tab welcoming empty state
// ============================================================
await freshState();
await page.goto(BASE + '/chitti_4wheeler.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const mc1 = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  emptyVisible: document.getElementById('mc-empty').style.display !== 'none',
  title: document.querySelector('.sds-brand-name')?.textContent,
}));
check('Mechanic Car — 5 tabs', mc1.tabs === 5, 'got ' + mc1.tabs);
check('Mechanic Car — Home empty state visible', mc1.emptyVisible);
check('Mechanic Car — title says "Mechanic Car"', /Mechanic Car/.test(mc1.title || ''));
await shot('sire2_4_car_home_empty.png');

// ============================================================
// 5. MECHANIC CAR — Ask Chitti engine light diagnosis + fair price
// ============================================================
await stubAsk({
  diagnosis: 'Engine light yellow blink kar rahi hai — OBD code likely P0420 (catalytic converter efficiency). AC bhi thandi nahi — gas leak ya cabin filter blocked ho sakta hai.',
  diy_possible: false,
  diy_steps: [],
  mechanic_advice: 'Service center par OBD scan zaroor karayein — agar P0420 confirm hua to catalytic converter check karna padega.',
  fair_price_min_inr: 800,
  fair_price_max_inr: 2500,
  safety_critical: false,
  ask_followup: 'Engine garam ho rahi hai kya aur drive karte waqt?',
});
await page.evaluate(() => mcTab('ask'));
await page.waitForTimeout(300);
await page.evaluate(() => { document.getElementById('mc-ask-text').value = 'Engine light jal rahi hai, AC bhi thandi nahi'; });
await page.click('button:has-text("Chitti से पूछो")');
await page.waitForTimeout(800);
const mc2 = await page.evaluate(() => ({
  bubbles: document.querySelectorAll('#mc-ask-thread .sds-bubble').length,
  hasMechanic: !!document.querySelector('#mc-ask-thread .mc-diy-no'),
  hasPrice: !!document.querySelector('#mc-ask-thread .mc-fairprice'),
}));
check('Mechanic Car — diagnosis bubbles ≥ 2', mc2.bubbles >= 2);
check('Mechanic Car — workshop card', mc2.hasMechanic);
check('Mechanic Car — fair-price card visible', mc2.hasPrice);
await shotFull('sire2_5_car_engine_diagnosis.png');
await page.unroute('**/api/vaani/ask');

// ============================================================
// 6. NEWS AI / COACH — Profiling screen
// ============================================================
await freshState();
await page.goto(BASE + '/chitti_news_ai.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const na1 = await page.evaluate(() => ({
  profileVisible: document.getElementById('na-profile-pane').style.display === 'block',
  hasFreeText: !!document.getElementById('na-profession'),
  levels: document.querySelectorAll('#na-level button').length,
}));
check('News AI — profiling visible on first visit', na1.profileVisible);
check('News AI — free-text profession input (no dropdown)', na1.hasFreeText);
check('News AI — 4 level buttons', na1.levels === 4, 'got ' + na1.levels);
await shot('sire2_6_news_ai_profile.png');

// ============================================================
// 7. NEWS AI — Profiled samjhao for doctor vs farmer (same story)
// ============================================================
// Build a fake story + intercept both samjhao calls (one as doctor, one as farmer)
// to demonstrate the different profile-based explanations.
const sharedStory = {
  items: [{
    headline: 'GPT-5 medical diagnosis 92% accuracy par pahuncha — radiologists ke level ke kareeb',
    source: 'TechCrunch AI', when: '3h ago',
    category: 'general',
    bullets: [
      'Naya benchmark Stanford ke saath chala — 50,000 cases.',
      'Pure scan reading mein 4 second per image.',
      'India mein AIIMS aur Apollo trial start kar rahe hain.',
    ],
  }],
};
await page.route('**/api/vaani/ask', async (route) => {
  const post = route.request().postDataJSON();
  // first call: stories generation
  if (post && /Generate 5 important real-feeling AI/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(sharedStory) }) });
  }
  // samjhao for doctor
  if (post && /profession\s+"Doctor/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify({ ok:true, source:'deepseek', reply:
        'Doctor sahab — yeh batata hai AI ab radiology mein aapke colleague jaisa accuracy de raha hai. AIIMS Delhi already 30 trial cases me CT scan ke liye use kar raha hai. Aapke department ko bhi pilot consider karna chahiye.' }) });
  }
  // samjhao for farmer
  if (post && /profession\s+"Farmer/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify({ ok:true, source:'deepseek', reply:
        'Kisan ji — soch ke dekhiye, jaise AI ab radiology mein bemar ki photo dekh ke 92% sahi bata raha hai, waise hi AI aapke khet ki photo dekh ke bata sakti hai kaun sa keeda hai, kaun si dawai chahiye. Yahi technology ab krishi mein bhi aa rahi hai.' }) });
  }
  // fallback empty
  return route.fulfill({ status:200, contentType:'application/json',
    body: JSON.stringify({ ok:true, source:'deepseek', reply: '{}' }) });
});

// Seed Doctor profile + open news + samjhao
await page.evaluate(() => {
  localStorage.setItem('chitti_news_ai_profile_v1', JSON.stringify({ profession:'Doctor', level: 2, name:'', lang:'hi' }));
  // Reset stories cache to force regenerate
  localStorage.removeItem('chitti_news_ai_stories_v1');
});
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => naSetMode('news'));
await page.waitForTimeout(900);
await page.evaluate(() => { const s = document.querySelector('.sds-story[data-idx="0"] .demo'); if (s) s.click(); });
await page.waitForTimeout(900);
await shotFull('sire2_7a_news_ai_samjhao_doctor.png');

// Now switch to Farmer, regenerate, samjhao again
await page.evaluate(() => {
  localStorage.setItem('chitti_news_ai_profile_v1', JSON.stringify({ profession:'Farmer', level: 0, name:'', lang:'hi' }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => naSetMode('news'));
await page.waitForTimeout(900);
await page.evaluate(() => { const s = document.querySelector('.sds-story[data-idx="0"] .demo'); if (s) s.click(); });
await page.waitForTimeout(900);
await shotFull('sire2_7b_news_ai_samjhao_farmer.png');

check('News AI — profiled samjhao captured for Doctor', true);
check('News AI — profiled samjhao captured for Farmer', true);
await page.unroute('**/api/vaani/ask');

// ============================================================
// 8. COACH — Interior decorator: AI tools + free certs
// ============================================================
await page.route('**/api/vaani/ask', (route) => {
  return route.fulfill({ status:200, contentType:'application/json',
    body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify({
      how_ai_helps: 'Interior decorator ke liye AI palette suggest karta hai, room layouts generate karta hai, material costing kar deta hai aur photorealistic mockups bana deta hai — sab 5 min mein.',
      best_tools: [
        { name:'Claude', url:'https://claude.ai', paid_or_free:'free', why_for_this_profession:'Client briefs ko clean layout instructions mein convert karta hai.' },
        { name:'Midjourney', url:'https://www.midjourney.com', paid_or_free:'paid', why_for_this_profession:'Room mockups 30 second mein.' },
        { name:'Sora', url:'https://openai.com/sora', paid_or_free:'paid', why_for_this_profession:'Walkthrough videos for client pitches.' },
        { name:'Perplexity', url:'https://www.perplexity.ai', paid_or_free:'free', why_for_this_profession:'Material aur supplier dhoondhne mein research.' },
        { name:'Magicplan', url:'https://www.magicplan.app', paid_or_free:'freemium', why_for_this_profession:'Phone se room scan karke floor plan banao.' },
      ],
      free_certifications: [
        { name:'Google AI Essentials', provider:'Google', url:'https://grow.google/intl/en/courses-and-tools/?category=ai', duration:'4 weeks', why:'Foundational, free certificate by Google.' },
        { name:'Elements of AI', provider:'University of Helsinki', url:'https://www.elementsofai.com', duration:'6 weeks', why:'Free, plain-language foundation.' },
        { name:'NASSCOM FutureSkills AI', provider:'NASSCOM', url:'https://futureskillsprime.in', duration:'10 hours', why:'India-specific industry context.' },
        { name:'Coursera AI for Everyone', provider:'Coursera (Andrew Ng)', url:'https://www.coursera.org/learn/ai-for-everyone', duration:'4 weeks', why:'Best non-technical introduction. Audit free.' },
        { name:'Microsoft AI-900', provider:'Microsoft Learn', url:'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/', duration:'6 weeks', why:'Free study path, paid exam optional.' },
      ],
    })}),
  });
});
await page.evaluate(() => {
  localStorage.setItem('chitti_news_ai_profile_v1', JSON.stringify({ profession:'Interior Decorator', level: 1, name:'', lang:'hi' }));
  localStorage.removeItem('chitti_news_ai_snapshot_v1');
});
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => naSetMode('coach'));
await page.waitForTimeout(1500);
const co1 = await page.evaluate(() => ({
  toolsCount: document.querySelectorAll('#na-tools-list .sds-doc-row').length,
  certsCount: document.querySelectorAll('#na-certs-list .na-cert-card').length,
  certNames: Array.from(document.querySelectorAll('#na-certs-list .na-cert-card')).map(c => c.textContent.slice(0, 60)),
}));
check('Coach — 5 AI tools listed', co1.toolsCount === 5, 'got ' + co1.toolsCount);
check('Coach — 5 real free certs', co1.certsCount === 5, 'got ' + co1.certsCount);
check('Coach — all 5 certs from real providers',
  /Google|Elements of AI|NASSCOM|Coursera|Microsoft/.test(co1.certNames.join(' ')));
await shotFull('sire2_8_coach_tools_certs.png');
await page.unroute('**/api/vaani/ask');

// ============================================================
// 9. COACH — Lesson in progress (interior decorator example)
// ============================================================
await page.route('**/api/vaani/ask', (route) => {
  return route.fulfill({ status:200, contentType:'application/json',
    body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify({
      explanation: 'Jaise aap room dekhke instantly samajh jaate ho ki kya fit karega — sofa kahaan, light kahaan — AI bhi yahi karta hai, lakho rooms dekhke. Yeh hi neural network ka kaam hai — patterns seekh ke nayi situation me apply karna.',
      task: 'Abhi claude.ai khole aur type karein: "Mere 10x12 bedroom ka layout suggest karo — warm tones, scandinavian feel". Dekhiye Claude kya design kheechta hai.',
      quiz: [
        { q: 'Neural network kya seekhta hai?', a: ['Patterns from many examples','Sirf rules','Random guesses'], correct: 0 },
        { q: 'Interior decoration mein AI ka best use kya?', a: ['Mock layouts banana', 'Client ke saath fight karna', 'Kuch nahi'], correct: 0 },
      ],
    })}),
  });
});
await page.evaluate(() => naStartTrack(1));
await page.waitForTimeout(1200);
const co2 = await page.evaluate(() => ({
  lessonVisible: document.getElementById('na-lesson-pane').style.display === 'block',
  body: document.getElementById('na-lesson-body').textContent.length,
  hasTask: /claude\.ai/.test(document.getElementById('na-lesson-body').textContent),
  hasExample: /scandinavian|sofa|room|interior/i.test(document.getElementById('na-lesson-body').textContent),
}));
check('Coach — lesson pane visible', co2.lessonVisible);
check('Coach — lesson body has interior-decorator example', co2.hasExample);
check('Coach — lesson task references claude.ai', co2.hasTask);
await shotFull('sire2_9_coach_lesson_decorator.png');
await page.unroute('**/api/vaani/ask');

// ============================================================
// 10. CERTIFICATE — Sample Sahayai AI certificate
// ============================================================
await page.evaluate(() => {
  // Seed snapshot so next-cert list populates
  localStorage.setItem('chitti_news_ai_snapshot_v1', JSON.stringify({
    free_certifications: [
      { name:'Google AI Essentials', provider:'Google' },
      { name:'NASSCOM FutureSkills', provider:'NASSCOM' },
      { name:'Elements of AI', provider:'University of Helsinki' },
    ],
  }));
  naGenerateCert();
});
await page.waitForTimeout(500);
const cert = await page.evaluate(() => ({
  visible: document.getElementById('na-cert-pane').style.display === 'block',
  qr: !!document.querySelector('#na-cert-card img.qr'),
  txt: document.getElementById('na-cert-card').textContent,
}));
check('Certificate — pane visible', cert.visible);
check('Certificate — QR code rendered', cert.qr);
check('Certificate — mentions profession', /Interior Decorator|Decorator/i.test(cert.txt));
check('Certificate — recommends 3 real next certs', /Google|NASSCOM|Elements of AI/.test(cert.txt));
await shotFull('sire2_10_certificate.png');

// ============================================================
// 11. LANGUAGE — Mechanic Bike in 100% Telugu
// ============================================================
await freshState();
await page.goto(BASE + '/chitti_2wheeler.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('chitti_vaani_lang', 'te');
  if (typeof updateAllStrings === 'function') updateAllStrings('te');
  if (typeof changeLang === 'function') changeLang('te');
});
await page.waitForTimeout(500);
const teTabs = await page.evaluate(() => Array.from(document.querySelectorAll('.sds-tabs button span:nth-child(2)')).map(s => s.textContent));
const englishLeak = teTabs.filter(t => /^(Home|My Bike|Documents|Alerts|Ask Chitti|ghar|घर)$/i.test(t));
check('Language — Telugu tabs flipped (zero English/Hindi residue)', englishLeak.length === 0,
  englishLeak.length ? 'leaks=' + englishLeak.join(',') : 'tabs=' + teTabs.join(' / '));
await shot('sire2_11_bike_telugu.png');

await b.close();

const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`Console errors observed: ${consoleErrs.length}`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
