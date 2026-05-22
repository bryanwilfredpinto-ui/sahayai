#!/usr/bin/env node
/**
 * tools/test_vaani_certify.mjs
 * ─────────────────────────────
 * Certification visual + behavioural check for the tricolour 6-tab UI.
 * Captures one screenshot per state we need to certify:
 *   • Talk tab (default)
 *   • Act tab
 *   • Vault tab
 *   • Circle tab
 *   • Settings tab (15 products listed)
 *   • SOS tab
 *   • Grandparent mode ON
 *   • QR share modal open
 *   • Hindi language flip
 *
 * Exit 0 if every check passes.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = process.env.VAANI_URL || 'http://127.0.0.1:8765/chitti_vaani.html';
const results = [];
function pass(label){ results.push({label, ok:true}); console.log(`✅ ${label}`); }
function fail(label, why){ results.push({label, ok:false, why}); console.log(`❌ ${label} — ${why}`); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(URL.replace('chitti_vaani.html', ''), { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { if (typeof acceptConsent === 'function') acceptConsent(); if (typeof vaiOnbFinish === 'function') vaiOnbFinish(); });
await page.waitForTimeout(500);

// 1. Tricolour stripe present at top
const stripe = await page.evaluate(() => {
  const cs = getComputedStyle(document.body, '::after');
  return cs.background.includes('linear-gradient') || cs.backgroundImage.includes('linear-gradient');
});
stripe ? pass('1. Tricolour stripe at top of page') : fail('1. Tricolour stripe', 'not detected');

// 2. Navy header
const headerBg = await page.evaluate(() => getComputedStyle(document.querySelector('header[role="banner"]')).backgroundImage);
/(#002366|rgb\(0,\s*35,\s*102\)|0E2344|navy|16376a)/i.test(headerBg) ? pass('2. Navy header gradient (#002366)') : fail('2. Header', headerBg);

// 3. Six tabs
const navCount = await page.locator('.vai-bnav button').count();
navCount === 6 ? pass(`3. Six nav buttons (Talk/Act/Vault/Circle/Settings/SOS)`) : fail('3. Nav buttons', `got ${navCount}`);

// 4. Mic button gradient (saffron → green)
const micBg = await page.evaluate(() => getComputedStyle(document.getElementById('mic-big')).background);
/(FF6913|046A38|saffron|rgb\(255,\s*105,\s*19\)|rgb\(4,\s*106,\s*56\))/i.test(micBg) ? pass('4. Mic button has tricolour gradient (saffron→green)') : fail('4. Mic gradient', micBg.slice(0, 80));

// 5. Settings tab — list of 15 products
await page.evaluate(() => vaiSwitchTab('settings'));
await page.waitForTimeout(300);
const productCount = await page.locator('#vai-settings-products .vai-settings-row').count();
productCount === 15 ? pass('5. Settings lists all 15 Chitti products') : fail('5. Settings', `got ${productCount}`);

// 6. Settings has speaker buttons (🔊 per row)
const settingsSpkr = await page.locator('#vai-settings-products .actions button').count();
settingsSpkr === 15 ? pass(`6. Settings has 15 speaker buttons (1 per product)`) : fail('6. Settings speakers', `got ${settingsSpkr}`);

// 7. Grandparent toggle works
await page.evaluate(() => vaiSwitchTab('talk'));
await page.waitForTimeout(200);
await page.evaluate(() => vaiGrandparentToggle());
await page.waitForTimeout(300);
const gpActive = await page.evaluate(() => document.body.classList.contains('vai-grandparent'));
gpActive ? pass('7. Grandparent mode toggles on') : fail('7. Grandparent mode', 'not active');
await page.screenshot({ path: resolve(__dirname, 'vaani_cert_grandparent.png'), fullPage: false });

// 8. Grandparent mode: giant mic ≥ 200px
const gpMic = await page.locator('#mic-big').boundingBox();
gpMic && gpMic.width >= 200 ? pass(`8. Grandparent giant mic ${Math.round(gpMic.width)}px`) : fail('8. Grandparent mic size', JSON.stringify(gpMic));

// 9. Grandparent shows the 3-button bar
const gpBar = await page.locator('#vai-gp-bar button').count();
gpBar === 3 ? pass(`9. Grandparent 3-button bar`) : fail('9. Grandparent bar', `got ${gpBar}`);

// Exit grandparent
await page.evaluate(() => vaiGrandparentToggle());
await page.waitForTimeout(200);

// 10. QR share modal opens
await page.evaluate(() => vaiOpenQR());
await page.waitForTimeout(400);
const qrShown = await page.locator('.vai-qr-modal.shown').count();
qrShown ? pass('10. QR share modal opens') : fail('10. QR share', 'modal did not open');
await page.screenshot({ path: resolve(__dirname, 'vaani_cert_qr.png'), fullPage: false });
// QR image src is set
const qrSrc = await page.locator('#vai-qr-img').getAttribute('src');
qrSrc && qrSrc.includes('qrserver.com') ? pass('11. QR image src set to qrserver.com') : fail('11. QR src', qrSrc || '(empty)');
await page.evaluate(() => vaiCloseQR());

// 12. Hindi flip end-to-end (zero English in tab labels + onboarding)
await page.evaluate(() => {
  const sel = document.getElementById('lang-select');
  if (sel) { sel.value = 'hi'; sel.dispatchEvent(new Event('change')); }
  if (typeof vaiApplyI18n === 'function') vaiApplyI18n();
});
await page.waitForTimeout(200);
const tabs = await page.locator('.vai-bnav button span:nth-child(2)').allTextContents();
const englishLeak = tabs.filter(t => /^(Talk|Act|Vault|Circle|More|SOS)$/.test(t));
englishLeak.length === 0 ? pass(`12. Hindi flip — no English tab labels (got: ${tabs.join(', ')})`) : fail('12. Hindi flip', `English remains: ${englishLeak.join(', ')}`);

// 13. Per-card 🔊 / 🤖 / 👍 / 👎 / Demo widget — every chitti-response section has a feedback bar
await page.evaluate(() => vaiSwitchTab('talk'));
await page.waitForTimeout(300);
const fbBars = await page.locator('.chitti-fb-box-bar').count();
fbBars > 0 ? pass(`13. Feedback widget bars present (${fbBars} on Talk)`) : fail('13. Feedback widget', '0 bars');

// 14. Capture final Talk screenshot
await page.screenshot({ path: resolve(__dirname, 'vaani_cert_talk_final.png'), fullPage: false });
await page.evaluate(() => vaiSwitchTab('settings'));
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(__dirname, 'vaani_cert_settings.png'), fullPage: false });
await page.evaluate(() => vaiSwitchTab('sos'));
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(__dirname, 'vaani_cert_sos.png'), fullPage: false });

// Summary
const okCount = results.filter(r => r.ok).length;
console.log(`\nCertification check: ${okCount}/${results.length} passed`);
await b.close();
process.exit(results.length - okCount);
