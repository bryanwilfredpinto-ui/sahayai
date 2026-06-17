// Developer self-verify — LOCAL branch file, validates QA bugs #4,#5,#6,#7
// (frontend) and renders a mocked deterministic backend result (bug #2 UI path).
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';

const FILE = process.env.QA_URL || pathToFileURL('c:/Users/DELL/sahayai/sahayai/chitti_scanner.html').href;
const out = [];
const log = (s) => { out.push(s); console.log(s); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const fbPosts = [];

await page.addInitScript(() => {
  window.speechSynthesis = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
});

// Mock the (fixed) backend deterministic response so we can see the UI render it.
await page.route('**/api/scanner/analyze/text', async (r) => {
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    ok: true, source: 'deterministic', type: 'medicine', language: 'en',
    summary: 'I read a medicine label. strength: 500mg, composition: Paracetamol, mrp: ₹35.',
    facts: { strength: '500mg', composition: 'Paracetamol', mrp: '₹35', expiry: 'Jul 2027' },
    key_findings: ['This looks like a medicine label. Chitti restates the strip.'],
    warnings: ['Check the expiry date is in the future before using.'],
    savings: ['A same-composition Jan Aushadhi generic may be much cheaper — check MedUPI.'],
    legal_disclaimer: 'Yeh sirf label ki information hai. Doctor se confirm karo pehle.',
    cross_links: [], speak_en: 'I read a medicine label.', speak_hi: 'मैंने दवा का लेबल पढ़ा।',
  }) });
});
await page.route('**/api/feedback/collect', async (r) => {
  try { fbPosts.push(JSON.parse(r.request().postData() || '{}')); } catch(e){}
  await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});

await page.goto(FILE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// ───── BUG #4: consent must be dealt with FIRST (on top), profile revealed after ─────
// Deterministic proof = the consent overlay's stacking context is ABOVE the
// shared Disability Profile substrate modal, so consent (not DP) is on top.
const zorder = await page.evaluate(() => {
  const cs = document.getElementById('consent-overlay');
  const dp = document.getElementById('chitti-disability-profile-modal');
  const z = el => el ? parseInt(getComputedStyle(el).zIndex || '0', 10) : null;
  return { consentZ: z(cs), dpZ: z(dp), dpExists: !!dp,
           dpShown: !!(dp && dp.classList.contains('show')) };
});
log('BUG#4 z-order → consent z=' + zorder.consentZ + ' vs disability-profile z=' + zorder.dpZ +
    ' (substrate present: ' + zorder.dpExists + ')  => consent ON TOP: ' + (zorder.consentZ > zorder.dpZ));
// AGREE is at the bottom of a tall panel — scroll it in, then confirm what's on top there.
await page.$eval('button.agree', b => b.scrollIntoView({block:'center'}));
await page.waitForTimeout(300);
const topAtAgree = await page.evaluate(() => {
  const btn = document.querySelector('button.agree'); const r = btn.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
  let n = el, inConsent = false;
  while (n) { if (n.id === 'consent-overlay') { inConsent = true; break; } n = n.parentElement; }
  return inConsent ? 'consent' : (el ? (el.id||el.className||el.tagName)+'' : 'null');
});
log('BUG#4 element on top at AGREE: "' + topAtAgree + '"  => reachable (not DP-intercepted): ' + (topAtAgree === 'consent'));
await page.click('button.agree', { timeout: 5000 }).then(() => log('BUG#4 AGREE click SUCCEEDED'))
  .catch(e => log('BUG#4 AGREE click FAILED: ' + e.message.slice(0,60)));
await page.waitForTimeout(1200);
const dpAfter = await page.isVisible('#chitti-disability-profile-modal.show').catch(() => false);
const consentAfter = await page.isHidden('#consent-overlay').catch(() => false);
log('BUG#4 after I AGREE → consent hidden: ' + consentAfter + ' | disability-profile now reachable: ' + dpAfter);
await page.click('#chitti-disability-profile-modal .chitti-dp-skip').catch(() => {});
await page.waitForTimeout(400);

// ───── BUG #6: visible illustrated how-to steps ─────
const howToVisible = await page.isVisible('#how-to-use').catch(() => false);
const steps = await page.$$eval('#how-to-use .howto-step', els => els.map(e => e.textContent.replace(/\s+/g,' ').trim().slice(0,46)));
log('BUG#6 visible How-to section: ' + howToVisible + ' | steps(' + steps.length + '): ' + JSON.stringify(steps));

// ───── BUG #2 UI path: deterministic result renders ─────
await page.fill('#typed-text', 'Crocin Advance 500mg Paracetamol IP Exp Jul 2027 MRP 35');
await page.click('button:has-text("Analyse text")');
await page.waitForTimeout(1500);
const summary = (await page.textContent('#r-summary').catch(() => '') || '').trim();
const facts = await page.$$eval('#r-facts .fct', els => els.map(e => e.textContent.trim()));
log('BUG#2 result summary: ' + summary.slice(0, 80));
log('BUG#2 facts rendered: ' + JSON.stringify(facts));

// ───── BUG #7: per-box feedback logs ─────
// click a 👍 on a response box
const upBtn = await page.$('[data-chitti-response] .chitti-fb-btn.up, .chitti-fb-btn.up');
if (upBtn) { await upBtn.click().catch(() => {}); await page.waitForTimeout(500); }
const queued = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('chitti_fb_queue') || '[]').length; } catch(e){ return -1; } });
log('BUG#7 feedback posts captured: ' + fbPosts.length + ' | localStorage queue len: ' + queued +
    (fbPosts[0] ? ' | first type: ' + (fbPosts[0].type || fbPosts[0].vote || '?') : ''));

// ───── BUG #5: tap targets at 375px ─────
await page.setViewportSize({ width: 375, height: 740 });
await page.waitForTimeout(500);
const smallTaps = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('button, a.switch-btn-bharat, .header-controls button, select, label.cap-card').forEach(el => {
    if (!(el.offsetParent || el.getClientRects().length)) return;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.height < 44) bad.push(((el.textContent||el.tagName)+'').replace(/\s+/g,' ').trim().slice(0,22) + '=' + Math.round(r.height));
  });
  return bad.slice(0, 15);
});
log('BUG#5 tap targets <44px: ' + (smallTaps.length ? smallTaps.join(' | ') : 'NONE'));
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
log('375px horizontal scroll: ' + hScroll);

await page.screenshot({ path: 'tools/cert_screenshots/qa_scanner_local_375.png', fullPage: false });
await browser.close();
log('=== DONE ===');
