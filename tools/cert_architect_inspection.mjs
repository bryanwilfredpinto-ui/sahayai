/**
 * tools/cert_architect_inspection.mjs
 * Sire 2026-05-23 architect-inspection follow-up — 13 mandated screenshots.
 *
 *  1-3   Fashion AI in English / Hindi / Telugu (zero raw keys)
 *  4-5   Chitti News: full summary in-app + source link demoted (Hindi)
 *  6-7   Chitti News AI: 5 categories visible + ▶ Chitti personalised
 *  8-10  Mechanic Bike: 5 tabs, icon-only toolbar, diagnosis works (Hindi)
 *  11-12 Mechanic Car: same shell
 *  13    Feedback page from 👎
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.CERT_BASE || 'http://127.0.0.1:8765';

const results = [];
function check(l, ok, d){ results.push({l,ok,d}); console.log(`${ok?'✅':'❌'} ${l}${d?' — '+d:''}`); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 }, deviceScaleFactor:2 });
const page = await ctx.newPage();

async function freshState(){
  await page.goto(BASE + '/', { waitUntil:'domcontentloaded' });
  await page.evaluate(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
    try { const r = indexedDB.deleteDatabase('chitti_fashion_almari'); await new Promise(res => { r.onsuccess = res; r.onerror = res; r.onblocked = res; }); } catch(e){}
  });
}
async function shot(n){ const p = resolve(__dirname, n); await page.screenshot({ path: p, fullPage: false }); console.log('   📸 ' + p); }
async function shotFull(n){ const p = resolve(__dirname, n); await page.screenshot({ path: p, fullPage: true }); console.log('   📸 ' + p); }
async function leakSweep(){
  return await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      const m = t && t.match(/\b(fa|mb|mc|na|set|tab|hdr|err|fb|ui)\.[a-z][a-z0-9.]+/);
      if (m) out.push({ key:m[0], text:t.slice(0,50) });
    });
    return out;
  });
}

// ── 1-3. Fashion AI in EN / HI / TE ──
for (const lang of ['en','hi','te']) {
  await freshState();
  await page.evaluate((l) => localStorage.setItem('chitti_vaani_lang', l), lang);
  await page.goto(BASE + '/chitti_fashion.html?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(700);
  const leaks = await leakSweep();
  check(`Fashion ${lang.toUpperCase()} — zero raw keys`, leaks.length === 0, leaks.slice(0,3).map(l=>l.key).join(','));
  await shot(`arch_${(lang==='en'?'1':lang==='hi'?'2':'3')}_fashion_${lang}.png`);
}

// ── 4-5. Chitti News — full summary in-app + source link demoted (Hindi) ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_news.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(1200); // let RSS feed mount
const newsDom = await page.evaluate(() => ({
  hasArticles: document.querySelectorAll('.art-card').length,
  // The card summary should no longer be truncated to 260 chars
  truncationGoneFromTemplate: !document.body.innerHTML.includes('slice(0,260)'),
  // Source link demoted to its own row
  hasSourceLink: document.querySelectorAll('.art-source-link').length,
  // Primary action is now 🔊 Read aloud
  primaryReadAloud: !!document.querySelector('.art-actions button.primary[onclick*="readArticleAloud"]'),
}));
check('News — primary action is 🔊 Read aloud', newsDom.primaryReadAloud);
check('News — summary template no longer truncates to 260 chars', newsDom.truncationGoneFromTemplate);
await shotFull('arch_4_news_in_app_summary.png');
// Click first 🔊 to demonstrate
const firstReadBtn = await page.locator('.art-actions button.primary').first();
if (await firstReadBtn.count()) {
  await firstReadBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shotFull('arch_5_news_source_link_secondary.png');
} else {
  await shot('arch_5_news_source_link_secondary.png');
}

// ── 6-7. News AI 5 categories + ▶ Chitti personalised ──
await freshState();
await page.evaluate(() => {
  localStorage.setItem('chitti_vaani_lang', 'hi');
  localStorage.setItem('chitti_news_ai_profile_v1', JSON.stringify({ profession:'Doctor', level:2, name:'', lang:'hi' }));
});
// Stub a story per category
const FAKE_STORIES = (cat) => ({
  items: [
    { headline: cat + ' — Anthropic ne nayi safety research release ki', source: 'Anthropic', when: '2h ago',
      category: 'general',
      bullets: ['RLHF se Constitutional AI tak — nayi paper.','Open-source eval framework.','India ke researchers ke liye free access.'],
      source_url: 'https://www.anthropic.com/news' },
    { headline: cat + ' — Google AI ka nya certification course free', source: 'Google', when: '6h ago',
      category: 'general', bullets: ['Coursera audit free.','5 hafte mein complete.','India se 10 lakh students enrolled.'],
      source_url: 'https://grow.google/intl/en/courses-and-tools/?category=ai' },
    { headline: cat + ' — Indian AI startup sarvam.ai $40M raise', source: 'YourStory', when: '1d ago',
      category: 'general', bullets: ['Indic LLM ke liye.','Lightspeed lead investor.','Hyderabad office.'],
      source_url: '' },
  ],
});
await page.route('**/api/vaani/ask', (route) => {
  const post = route.request().postDataJSON();
  if (post && /Generate 5/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(FAKE_STORIES('AI Khabar')) }) });
  }
  if (post && /one short sentence/i.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json',
      body: JSON.stringify({ ok:true, source:'deepseek', reply: 'Doctor sahab — yeh research aapke radiology workflow ke liye direct asar daalegi.' }) });
  }
  return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply:'{}' }) });
});
await page.goto(BASE + '/chitti_news_ai.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.evaluate(() => naSetMode('news'));
await page.waitForTimeout(900);
const cats = await page.evaluate(() => ({
  bar: document.querySelectorAll('.na-catbar .na-cat').length,
  labels: Array.from(document.querySelectorAll('.na-catbar .na-cat')).map(c => c.textContent.trim()),
  stories: document.querySelectorAll('.sds-story').length,
  hasChittiBtn: !!document.querySelector('.sds-story .demo'),
}));
check('News AI — 5 category pills visible', cats.bar === 5, cats.labels.join(' / '));
check('News AI — stories list loaded', cats.stories >= 1, 'count=' + cats.stories);
check('News AI — ▶ Chitti button on each story', cats.hasChittiBtn);
await shotFull('arch_6_news_ai_5_categories.png');
// Click ▶ Chitti on first card
await page.evaluate(() => naChittiPersonal(0));
await page.waitForTimeout(700);
await shotFull('arch_7_news_ai_chitti_personalised.png');
await page.unroute('**/api/vaani/ask');

// ── 8-10. Mechanic Bike: 5 tabs + icon-only toolbar + diagnosis ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_2wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(500);
const bike = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  // No visible "Feedback for: …" text anywhere — Sire's label leak fix.
  labelLeakHits: document.body.innerHTML.match(/Feedback for:/gi)?.length || 0,
  // Empty state visible
  emptyVisible: document.getElementById('mb-empty').style.display !== 'none',
}));
check('Bike — 5 tabs', bike.tabs === 5);
check('Bike — zero "Feedback for:" label leaks', bike.labelLeakHits === 0, 'hits=' + bike.labelLeakHits);
check('Bike — welcoming empty state', bike.emptyVisible);
await shot('arch_8_bike_home_empty.png');
// Diagnosis flow
const BIKE_DIAG = {
  diagnosis: 'Chain dheeli ho gayi hai. Tez chalane par awaaz isi liye aati hai. Chain ko lubricate karke tighten karna padega.',
  diy_possible: true,
  diy_steps: ['Chain pe WD-40 lagayein.','Rear axle thoda dheela karein.','Chain ko 20mm slack pe set karein.'],
  mechanic_advice: '', fair_price_min_inr: 150, fair_price_max_inr: 400, safety_critical: false, ask_followup: '',
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({ status:200, contentType:'application/json',
  body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(BIKE_DIAG) }) }));
await page.evaluate(() => mbTab('ask'));
await page.evaluate(() => { document.getElementById('mb-ask-text').value = 'मेरी बाइक से चेन की आवाज़ आ रही है'; mbAsk(); });
await page.waitForTimeout(900);
await shotFull('arch_9_bike_diagnosis_hindi.png');
// Trigger helmet gate
await page.evaluate(() => mbHelmetGate(() => {}));
await page.waitForTimeout(400);
const helmet = await page.evaluate(() => !document.getElementById('mb-helmet-modal').classList.contains('hidden'));
check('Bike — helmet reminder before Maps', helmet);
await shotFull('arch_10_bike_helmet_reminder.png');
await page.evaluate(() => mbHelmetYes());
await page.unroute('**/api/vaani/ask');

// ── 11-12. Mechanic Car: 5 tabs + same toolbar ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_4wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(500);
const car = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  labelLeakHits: document.body.innerHTML.match(/Feedback for:/gi)?.length || 0,
}));
check('Car — 5 tabs', car.tabs === 5);
check('Car — zero "Feedback for:" label leaks', car.labelLeakHits === 0);
await shot('arch_11_car_home_empty.png');
// Car diagnosis
const CAR_DIAG = {
  diagnosis: 'Engine light yellow — likely catalytic converter (P0420 OBD code). AC bhi thandi nahi — gas leak.',
  diy_possible: false, diy_steps: [],
  mechanic_advice: 'Service center par OBD scan karayein. P0420 confirm hua to converter check karna padega.',
  fair_price_min_inr: 800, fair_price_max_inr: 2500, safety_critical: false, ask_followup: '',
};
await page.route('**/api/vaani/ask', (route) => route.fulfill({ status:200, contentType:'application/json',
  body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(CAR_DIAG) }) }));
await page.evaluate(() => mcTab('ask'));
await page.evaluate(() => { document.getElementById('mc-ask-text').value = 'Engine light jal rahi hai, AC bhi thandi nahi'; mcAsk(); });
await page.waitForTimeout(900);
await shotFull('arch_12_car_diagnosis_hindi.png');
await page.unroute('**/api/vaani/ask');

// ── 13. Feedback page (from 👎 on any card) ──
await freshState();
await page.goto(BASE + '/feedback.html?product=chitti_mechanic_bike&card=mb_home&section=' + encodeURIComponent('🏍️ मेरी बाइक') + '&cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(500);
const fb = await page.evaluate(() => ({
  hasMic: !!document.getElementById('fb-mic'),
  hasText: !!document.getElementById('fb-text'),
  hasSubmit: document.body.textContent.includes('भेजो') || document.body.textContent.includes('Send'),
  contextShown: document.getElementById('fb-context').textContent.includes('Chitti Mechanic Bike'),
}));
check('Feedback page — mic + textarea + submit visible', fb.hasMic && fb.hasText && fb.hasSubmit);
check('Feedback page — context shows product + section', fb.contextShown);
await shot('arch_13_feedback_page.png');

await b.close();
const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
