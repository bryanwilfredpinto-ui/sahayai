/**
 * tools/cert_news_swarm.mjs — Sire 2026-05-23 final-instruction cert.
 * 15 mandated screenshots in real-browser Chromium at 375 × 812.
 *
 *  1. News — Chai Stall card visible on home (Hindi)
 *  2. News — consent overlay
 *  3. News — "Chitti aaj kya seekha" log view with 3 sample words
 *  4. News — Hindi feed
 *  5. News — Telugu feed
 *  6. News AI — 5 categories (AI Aaj / Prashikshan / Vishay / Naye Auzaar / Bharat AI)
 *  7. News AI — Samjhao expanded with profiled explanation
 *  8. News AI — Certification category with real courses
 *  9. Bike — 5 tabs + empty state (Hindi)
 * 10. Bike — diagnosis Hindi
 * 11. Bike — helmet reminder
 * 12. Car — 5 tabs
 * 13. Fashion — English (zero raw keys)
 * 14. Fashion — Hindi (zero raw keys)
 * 15. Fashion — Telugu (zero raw keys)
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
      const m = t && t.match(/\b(fa|mb|mc|na|set|tab|hdr|err|fb|ui|chai)\.[a-z][a-z0-9.]+/);
      if (m) out.push({ key:m[0], text:t.slice(0,50) });
    });
    return out;
  });
}

// ── 1. News — Chai Stall card on home ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_news.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(1200);
const home = await page.evaluate(() => ({
  hasChai: !!document.querySelector('.chai-stall-card'),
  chaiVisible: !!document.querySelector('.chai-stall-card .chai-stall-btn'),
  chaiTitle: document.querySelector('.chai-title')?.textContent || '',
}));
check('News — Chai Stall card visible on home', home.hasChai && home.chaiVisible);
check('News — Chai Stall title in Hindi', /charcha|शुरू|seekhega|chai/i.test(home.chaiTitle));
await shot('arch2_1_news_chai_card.png');

// ── 2. News — consent overlay ──
await page.evaluate(() => chaiOpenConsent());
await page.waitForTimeout(400);
const consent = await page.evaluate(() => ({
  overlayShown: document.getElementById('chai-overlay').classList.contains('shown'),
  hasRules: document.querySelectorAll('.chai-rules li').length,
  hasYesBtn: !!document.querySelector('.chai-btn.primary'),
}));
check('News — consent overlay opens', consent.overlayShown);
check('News — 6 privacy rules listed', consent.hasRules === 6, 'got ' + consent.hasRules);
check('News — "Haan, shuru karo" button visible', consent.hasYesBtn);
await shotFull('arch2_2_news_chai_consent.png');

// ── 3. News — learned-today log ──
await page.evaluate(() => {
  // Seed a few sample shared words so the log shows content
  const seed = [
    { word: 'arre', transcript: 'arre bhaiyya kaise ho', ts:new Date().toISOString(), language:'hi', shared:true },
    { word: 'kahaan', transcript: 'kahaan ja rahe ho', ts:new Date().toISOString(), language:'hi', shared:false },
    { word: 'panchayat', transcript: 'panchayat ka chunav', ts:new Date().toISOString(), language:'hi', shared:true },
  ];
  localStorage.setItem('chitti_news_swarm_local_v1', JSON.stringify(seed));
  chaiShowLearned();
});
await page.waitForTimeout(500);
const log = await page.evaluate(() => ({
  step: document.querySelector('.chai-step[data-step="log"]')?.style.display,
  words: document.querySelectorAll('#chai-log-list .chai-word').length,
}));
check('News — learned-today log view opens', log.step !== 'none');
check('News — 3 sample words rendered', log.words === 3);
await shotFull('arch2_3_news_chai_learned.png');
// Close
await page.evaluate(() => chaiClose());
await page.waitForTimeout(200);

// ── 4. News — Hindi feed (zero raw keys) ──
const feedLeaks = await leakSweep();
check('News — Hindi feed zero raw keys', feedLeaks.length === 0, feedLeaks.slice(0,3).map(l=>l.key).join(','));
await shot('arch2_4_news_hi_feed.png');

// ── 5. News — Telugu ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'te'));
await page.goto(BASE + '/chitti_news.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(1200);
await shot('arch2_5_news_te_feed.png');

// ── 6. News AI — 5 categories (DeepSeek stubbed) ──
const FAKE_STORIES = () => ({
  items: [
    { headline: 'Anthropic ne Constitutional AI ka naya paper release kiya', source: 'Anthropic', when: '2h ago',
      category: 'general', bullets: ['Self-critique evaluation ka new framework.','India ke researchers ke liye free access.','Open-source weights bhi planned.'],
      source_url: 'https://www.anthropic.com/news' },
    { headline: 'Google AI Essentials Indian colleges mein free', source: 'Google · Coursera', when: '6h ago',
      category: 'general', bullets: ['Coursera audit free hai.','4 hafte ka course, certificate optional.','10 lakh Indian students enrolled.'],
      source_url: 'https://grow.google/intl/en/courses-and-tools/?category=ai' },
    { headline: 'sarvam.ai Series A — Lightspeed ne $40M lagaye', source: 'YourStory', when: '1d ago',
      category: 'general', bullets: ['Indic LLM ke liye foundation.','Hyderabad headquarters.','12 Indian languages target.'], source_url: '' },
  ],
});
await page.route('**/api/vaani/ask', (route) => {
  const post = route.request().postDataJSON();
  if (post && /Generate 5/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(FAKE_STORIES()) }) });
  }
  if (post && /one short sentence/i.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply:'Doctor sahab — yeh research aapke radiology workflow ko bohot help karega.' }) });
  }
  if (post && /Explain this story to them/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply: 'Interior decorator ke liye — yeh AI aapke client ke ghar ka 3D mockup ek minute mein bana sakta hai. Color palette + furniture suggestion bhi.' }) });
  }
  if (post && /AI snapshot/.test(post.text || '')) {
    return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify({
      how_ai_helps: 'AI aapke daily kaam ke liye prompt-based shortcuts deta hai.',
      best_tools: [
        { name:'Claude', url:'https://claude.ai', paid_or_free:'free', why_for_role:'Brief ko spec mein convert.' },
        { name:'ChatGPT', url:'https://chat.openai.com', paid_or_free:'freemium', why_for_role:'Daily Q&A.' },
        { name:'Perplexity', url:'https://perplexity.ai', paid_or_free:'free', why_for_role:'Research with citations.' },
        { name:'Gemini', url:'https://gemini.google.com', paid_or_free:'free', why_for_role:'Google integration.' },
        { name:'Midjourney', url:'https://midjourney.com', paid_or_free:'paid', why_for_role:'Visuals.' },
      ],
      free_certifications: [
        { name:'Google AI Essentials', provider:'Google', url:'https://grow.google/intl/en/courses-and-tools/?category=ai', duration:'4 weeks', why:'Free foundational AI cert.' },
        { name:'Elements of AI', provider:'University of Helsinki', url:'https://www.elementsofai.com', duration:'6 weeks', why:'Plain-language AI.' },
        { name:'NASSCOM FutureSkills AI', provider:'NASSCOM', url:'https://futureskillsprime.in', duration:'10 hours', why:'India-specific.' },
        { name:'Coursera AI for Everyone', provider:'Coursera (Andrew Ng)', url:'https://coursera.org/learn/ai-for-everyone', duration:'4 weeks', why:'Best non-technical intro.' },
        { name:'Microsoft AI-900', provider:'Microsoft Learn', url:'https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/', duration:'6 weeks', why:'Free study path.' },
      ],
    }) }) });
  }
  return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply:'{}' }) });
});
await freshState();
await page.evaluate(() => {
  localStorage.setItem('chitti_vaani_lang', 'hi');
  localStorage.setItem('chitti_news_ai_profile_v1', JSON.stringify({ profession:'Interior Decorator', level:1, name:'', lang:'hi' }));
});
await page.goto(BASE + '/chitti_news_ai.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.evaluate(() => naSetMode('news'));
await page.waitForTimeout(900);
const ai5 = await page.evaluate(() => ({
  cats: Array.from(document.querySelectorAll('.na-catbar .na-cat span:nth-child(2)')).map(s => s.textContent.trim()),
  stories: document.querySelectorAll('.sds-story').length,
}));
const expectedCats = ['AI आज','प्रशिक्षण','विषय','नए औज़ार','भारत AI'];
const catsOk = expectedCats.every(e => ai5.cats.includes(e));
check('News AI — Sire 5 categories: ' + expectedCats.join(' / '), catsOk, 'got: ' + ai5.cats.join(' / '));
check('News AI — stories list rendered', ai5.stories >= 1);
await shotFull('arch2_6_news_ai_5cats.png');

// ── 7. News AI — Samjhao for Interior Decorator profile ──
await page.evaluate(() => naSamjhao(0));
await page.waitForTimeout(800);
const samj = await page.evaluate(() => {
  const t = document.querySelector('.sds-story[data-idx="0"] .samjhao')?.textContent || '';
  return { hasInterior: /Interior|decorator|mockup/i.test(t), text: t.slice(0, 120) };
});
check('News AI — Samjhao shows profiled explanation', samj.hasInterior, samj.text);
await shotFull('arch2_7_news_ai_samjhao.png');

// ── 8. News AI — Certification category with real courses ──
await page.evaluate(() => naSetCat('certs', document.querySelector('[data-cat="certs"]')));
await page.waitForTimeout(900);
const certs = await page.evaluate(() => ({
  active: document.querySelector('.na-cat.active span:nth-child(2)')?.textContent.trim(),
  stories: document.querySelectorAll('.sds-story').length,
}));
check('News AI — Certification category active = प्रशिक्षण', certs.active === 'प्रशिक्षण', certs.active);
check('News AI — Certification stories rendered', certs.stories >= 1);
await shotFull('arch2_8_news_ai_certification.png');
await page.unroute('**/api/vaani/ask');

// ── 9-11. Mechanic Bike ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_2wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(500);
const bike = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  leaks: document.body.innerHTML.match(/Feedback for:/gi)?.length || 0,
}));
check('Bike — 5 tabs', bike.tabs === 5);
check('Bike — zero "Feedback for:" leaks', bike.leaks === 0);
await shot('arch2_9_bike_home.png');
// Diagnosis stub
const BIKE_DIAG = { diagnosis: 'Chain dheeli ho gayi hai. Tez chalane par awaaz isi liye aati hai.',
  diy_possible: true, diy_steps: ['Chain pe WD-40 lagayein.','Rear axle dheela karein.','20mm slack pe set karein.'],
  mechanic_advice: '', fair_price_min_inr: 150, fair_price_max_inr: 400, safety_critical: false, ask_followup: '' };
await page.route('**/api/vaani/ask', (route) => route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ ok:true, source:'deepseek', reply: JSON.stringify(BIKE_DIAG) }) }));
await page.evaluate(() => mbTab('ask'));
await page.evaluate(() => { document.getElementById('mb-ask-text').value = 'मेरी बाइक से चेन की आवाज़ आ रही है'; mbAsk(); });
await page.waitForTimeout(900);
await shotFull('arch2_10_bike_diagnosis.png');
await page.evaluate(() => mbHelmetGate(() => {}));
await page.waitForTimeout(400);
await shotFull('arch2_11_bike_helmet.png');
await page.evaluate(() => mbHelmetYes());
await page.unroute('**/api/vaani/ask');

// ── 12. Mechanic Car ──
await freshState();
await page.evaluate(() => localStorage.setItem('chitti_vaani_lang', 'hi'));
await page.goto(BASE + '/chitti_4wheeler.html?cb=' + Date.now(), { waitUntil:'networkidle' });
await page.waitForTimeout(500);
const car = await page.evaluate(() => ({
  tabs: document.querySelectorAll('.sds-tabs button').length,
  leaks: document.body.innerHTML.match(/Feedback for:/gi)?.length || 0,
}));
check('Car — 5 tabs', car.tabs === 5);
check('Car — zero leaks', car.leaks === 0);
await shot('arch2_12_car_home.png');

// ── 13-15. Fashion EN / HI / TE ──
for (const lang of ['en','hi','te']) {
  await freshState();
  await page.evaluate((l) => localStorage.setItem('chitti_vaani_lang', l), lang);
  await page.goto(BASE + '/chitti_fashion.html?cb=' + Date.now(), { waitUntil:'networkidle' });
  await page.waitForTimeout(700);
  const leaks = await leakSweep();
  check(`Fashion ${lang.toUpperCase()} — zero raw keys`, leaks.length === 0, leaks.slice(0,3).map(l=>l.key).join(','));
  await shot(`arch2_${lang==='en'?'13':lang==='hi'?'14':'15'}_fashion_${lang}.png`);
}

await b.close();
const ok = results.filter(r => r.ok).length;
console.log(`\n══════════════════════════════════════════════`);
console.log(`Result: ${ok}/${results.length} pass`);
console.log(`══════════════════════════════════════════════`);
process.exit(ok === results.length ? 0 : 1);
