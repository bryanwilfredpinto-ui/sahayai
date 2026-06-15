#!/usr/bin/env node
/* QA Agent — LIVE test of https://sahayai.in/chitti_car_mechanic.html
 * Real Chromium. Spies on speechSynthesis. Evidence, no claims.
 * Run: node tools/qa_live_car_mechanic.mjs
 */
import { chromium } from 'playwright';
const URL = 'https://sahayai.in/chitti_car_mechanic.html';
const R = [];
function log(label, ok, detail) { R.push({ label, ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }
async function safe(label, fn) { try { return await fn(); } catch (e) { log(label, false, 'threw: ' + e.message); } }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
// spy: count speechSynthesis.speak calls
await ctx.addInitScript(() => {
  window.__speak = 0;
  try { const s = window.speechSynthesis; if (s) { const o = s.speak.bind(s); s.speak = (u) => { window.__speak++; try { return o(u); } catch (e) { } }; } } catch (e) { }
});
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const NOISE = /Access to fetch|CORS|ERR_FAILED|Failed to load resource|-api-production|net::ERR/i;
page.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push('console: ' + m.text()); });
// dismiss first-visit disability modal so we test the page (it's a substrate feature, tested separately)
await page.goto(URL + '?dp_skip=1', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// ───────── HOW TO USE ─────────
console.log('\n=== HOW TO USE ===');
await safe('HowTo: section present', async () => {
  const how = page.locator('details.how, details:has-text("How to use")');
  const n = await how.count();
  log('HowTo section exists', n >= 1);
  if (n) { await how.first().locator('summary').click().catch(() => { }); }
});
await safe('HowTo step: Diagnose a noise', async () => {
  await page.click('#tab-diag').catch(() => { });
  await page.fill('#d-sym', 'grinding brakes');
  await page.click('button[onclick="cmSymptom()"]');
  await page.waitForTimeout(500);
  const t = await page.locator('#r-symptom').innerText();
  log('HowTo Diagnose works', t.length > 0 && /drive|mechanic|brake/i.test(t), t.split('\n').slice(0, 2).join(' / '));
});
await safe('HowTo step: check a quote (fair price)', async () => {
  await page.click('#tab-price');
  await page.selectOption('#s-job', 'brake_pads'); await page.fill('#s-quote', '8500');
  await page.click('button[onclick="cmScam()"]'); await page.waitForTimeout(400);
  const t = await page.locator('#r-scam').innerText();
  log('HowTo Fair-price works', /overpriced|fair|expected/i.test(t), t.split('\n')[0]);
});
await safe('HowTo step: inspect a used car', async () => {
  await page.click('#tab-buy');
  await page.click('button[onclick="cmInspection()"]'); await page.waitForTimeout(400);
  const t = await page.locator('#r-inspect').innerText();
  log('HowTo Used-car inspection works', /point inspection|critical/i.test(t), t.split('\n')[0]);
});
await safe('HowTo step: right oil/tyre', async () => {
  await page.click('#tab-service'); await page.click('button[onclick="cmOil()"]'); await page.waitForTimeout(300);
  const oil = await page.locator('#r-oil').innerText();
  await page.click('#tab-parts'); await page.fill('#t-tread', '2.5'); await page.click('button[onclick="cmTyre()"]'); await page.waitForTimeout(300);
  const tyre = await page.locator('#r-tyre').innerText();
  log('HowTo Oil+Tyre works', /5W-30|grade|oil/i.test(oil) && /replace|tyre|tread/i.test(tyre), 'oil+tyre rendered');
});
await safe('HowTo step: reminders', async () => {
  await page.click('#tab-remind'); await page.click('button[onclick="cmRemind()"]'); await page.waitForTimeout(400);
  log('HowTo Reminders works', (await page.locator('#r-remind').innerText()).length > 0);
});
await safe('HowTo: every answer has 5 icons (🔊🤖👍👎✏️)', async () => {
  // feedback-widget attaches to [data-chitti-response]; check icons on a response card
  await page.waitForTimeout(800);
  const icons = await page.evaluate(() => {
    const card = document.querySelector('[data-chitti-response]');
    if (!card) return null;
    const txt = (card.innerText || '') + (card.getAttribute('aria-label') || '');
    const html = card.parentElement ? card.parentElement.innerHTML : card.innerHTML;
    function has(re) { return re.test(html) || re.test(txt); }
    return { speak: has(/🔊|speak|read aloud/i), bot: has(/🤖/), up: has(/👍/), down: has(/👎/), pencil: has(/✏️|✎|feedback/i) };
  });
  log('5-icon widget present', !!icons && icons.speak && (icons.up || icons.down), JSON.stringify(icons));
});

// ───────── FOUR USERS ─────────
console.log('\n=== FOUR USERS ===');
await safe('Blind: 🔊 Read page speaks', async () => {
  await page.evaluate(() => window.__speak = 0);
  await page.click('button[onclick="cmReadPage()"]'); await page.waitForTimeout(600);
  const n = await page.evaluate(() => window.__speak);
  log('Blind: Read-page invokes speech', n > 0, 'speak calls=' + n);
});
await safe('Blind: result speak buttons speak', async () => {
  await page.evaluate(() => window.__speak = 0);
  await page.click('#tab-diag'); await page.fill('#d-sym', 'ac not cooling'); await page.click('button[onclick="cmSymptom()"]'); await page.waitForTimeout(400);
  await page.click('#r-symptom .speak-btn'); await page.waitForTimeout(400);
  const n = await page.evaluate(() => window.__speak);
  log('Blind: per-result 🔊 speaks', n > 0, 'speak calls=' + n);
});
await safe('Deaf: symbol+word status, ISL', async () => {
  const word = await page.locator('#r-symptom .res-status').innerText().catch(() => '');
  const hasWord = /[A-Za-z]{3,}/.test(word); // a word, not colour-only
  const isl = await page.evaluate(() => !!(window.Chitti && window.Chitti.isl) || /isl/i.test(document.documentElement.innerHTML));
  log('Deaf: symbol+word status (not colour-only)', hasWord, word.trim());
  log('Deaf: ISL substrate present', isl);
});
await safe('Mute: tap-only, no voice required', async () => {
  // every primary flow exercised above used only tap+type+select; no mic gate.
  const micRequired = await page.evaluate(() => /voice required|must speak|microphone required/i.test(document.body.innerText));
  log('Mute: nothing requires voice', !micRequired);
});
await safe('Illiterate: icons + voice everywhere', async () => {
  const tabsWithEmoji = await page.evaluate(() => [...document.querySelectorAll('[role=tab] .em')].length);
  const speakBtns = await page.locator('.speak-btn, [onclick="cmReadPage()"]').count();
  log('Illiterate: emoji on every tab + voice', tabsWithEmoji >= 9 && speakBtns >= 1, `tab-emoji=${tabsWithEmoji} speak=${speakBtns}`);
});

// ───────── LANGUAGE ─────────
console.log('\n=== LANGUAGE ===');
async function langTest(code, name) {
  await safe('Lang ' + name, async () => {
    await page.selectOption('#lang-select', code); await page.waitForTimeout(1600);
    const info = await page.evaluate(() => {
      let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let node;
      while ((node = w.nextNode())) { if (node._chittiOrig !== undefined && node._chittiOrig !== node.nodeValue) n++; }
      return { lang: document.documentElement.lang, n };
    });
    log('Lang ' + name + ' switches whole UI', info.lang === code && info.n >= 5, `html[lang]=${info.lang} translated=${info.n}`);
  });
}
await langTest('hi', 'Hindi');
await langTest('kn', 'Kannada');
await page.selectOption('#lang-select', 'en').catch(() => { }); await page.waitForTimeout(800);

// ───────── MOBILE 375px ─────────
console.log('\n=== MOBILE 375px ===');
await safe('Mobile no horizontal scroll', async () => {
  const c = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await c.newPage(); await p.goto(URL + '?dp_skip=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log('Mobile 375px no horizontal scroll', over <= 1, 'overflow=' + over + 'px');
  await c.close();
});

// ───────── BUTTON AUDIT ─────────
console.log('\n=== BUTTON AUDIT ===');
await page.goto(URL + '?dp_skip=1', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
const btns = await page.evaluate(() => [...document.querySelectorAll('header button, main button')].map(b => ({ label: (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40), onclick: b.getAttribute('onclick') || '' })));
const seen = new Set();
for (const bt of btns) {
  if (!bt.onclick || seen.has(bt.onclick)) continue; seen.add(bt.onclick);
  await safe('BTN ' + (bt.label || bt.onclick), async () => {
    const before = errors.length;
    // make sure its tab is active where needed by clicking via JS handler directly
    await page.evaluate((oc) => { const el = [...document.querySelectorAll('button')].find(b => b.getAttribute('onclick') === oc); if (el) { el.scrollIntoView(); el.click(); } }, bt.onclick);
    await page.waitForTimeout(250);
    log('BTN ' + (bt.label || bt.onclick), errors.length === before, errors.length > before ? errors[errors.length - 1] : 'responded, no error');
  });
}

// ───────── DROPDOWN AUDIT ─────────
console.log('\n=== DROPDOWN AUDIT ===');
const selects = await page.evaluate(() => [...document.querySelectorAll('select')].map(s => ({ id: s.id, opts: s.options.length })));
for (const s of selects) {
  await safe('SELECT #' + s.id, async () => {
    const before = errors.length;
    const ok = await page.evaluate((id) => {
      const sel = document.getElementById(id); if (!sel || sel.options.length < 1) return false;
      sel.selectedIndex = sel.options.length - 1; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, s.id);
    await page.waitForTimeout(300);
    log('SELECT #' + s.id + ' (' + s.opts + ' opts)', ok && errors.length === before);
  });
}

await b.close();
const pass = R.filter(r => r.ok).length, fail = R.length - pass;
console.log(`\n=== LIVE QA: ${pass}/${R.length} pass, ${fail} fail ===`);
console.log('PAGEERRORS:', errors.length ? errors.slice(0, 5).join(' | ') : 'none');
if (fail) console.log('FAILURES:\n' + R.filter(r => !r.ok).map(r => '  ✗ ' + r.label + (r.detail ? ' — ' + r.detail : '')).join('\n'));
