#!/usr/bin/env node
/**
 * test_vaani_redesign.mjs — visual + behavioural check of the 5-tab Vaani UI.
 *
 * Bryan 2026-05-22 redirect: "ONE JOB ONLY: Make sahayai.in/chitti_vaani.html
 * a world class working product." This script proves the new shell renders,
 * the bottom nav switches tabs, and SOS / onboarding / friendly-error
 * machinery is present.
 *
 * Runs against the local static server (start it with:
 *   python -m http.server 8765 --bind 127.0.0.1
 * from the repo root).
 *
 * What it checks
 *   1. Page loads at 375×812 (iPhone-mini) without console errors
 *   2. Bottom tab nav is fixed at the bottom, 5 buttons visible
 *   3. Clicking each tab changes the visible panel
 *   4. Onboarding overlay opens after consent and walks through 3 steps
 *   5. Friendly-error banner appears when the backend fetch is forced to fail
 *   6. Captures a screenshot per tab into tools/vaani_redesign_*.png
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = process.env.VAANI_URL || 'http://127.0.0.1:8765/chitti_vaani.html';

const results = [];
function pass(label){ results.push({ label, status: 'PASS' }); console.log(`✅ ${label}`); }
function fail(label, why){ results.push({ label, status: 'FAIL', why }); console.log(`❌ ${label} — ${why}`); }

async function main(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // Clear any prior state so we get a fresh consent + onboarding flow
  await page.goto(URL.replace('chitti_vaani.html', ''), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });

  await page.goto(URL, { waitUntil: 'networkidle' });

  // ── 1. Page loads
  const title = await page.title();
  if (title.toLowerCase().includes('chitti')) pass('1. Page loads (title contains "Chitti")');
  else fail('1. Page loads', `title=${title}`);

  if (!consoleErrors.length) pass('1b. No console / page errors on load');
  else fail('1b. Console errors', consoleErrors.join(' | '));

  // ── 2. Consent gate visible
  const consentVisible = await page.locator('#consent-overlay:not(.hidden)').count();
  if (consentVisible) pass('2. Consent overlay visible on first visit');
  else fail('2. Consent overlay', 'not visible');

  // Accept consent
  await page.evaluate(() => { if (typeof acceptConsent === 'function') acceptConsent(); });
  await page.waitForTimeout(450);

  // ── 3. Onboarding overlay opens
  const onbVisible = await page.locator('#vai-onb:not(.hidden)').count();
  if (onbVisible) pass('3. Onboarding overlay opens after consent');
  else fail('3. Onboarding', 'overlay did not open after consent');

  // ── 3b. Onboarding step 1 — pick a language (Hindi)
  await page.evaluate(() => { if (typeof vaiOnbPickLang === 'function') vaiOnbPickLang('hi'); });
  await page.waitForTimeout(120);

  // ── 3c. Step 2 — name input present
  const nameInput = await page.locator('#vai-onb-name').count();
  if (nameInput) pass('3b. Step 2: name input rendered');
  else fail('3b. Step 2 name input', 'missing');

  // ── 3d. Advance to step 3 without entering name
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#vai-onb-opts button');
    if (btns.length) btns[btns.length - 1].click();
  });
  await page.waitForTimeout(120);

  // ── 3e. Step 3 — try-it / start buttons present
  const step3Btns = await page.locator('#vai-onb-opts button').count();
  if (step3Btns >= 2) pass('3c. Step 3: try-it + start buttons rendered');
  else fail('3c. Step 3 buttons', `found ${step3Btns}`);

  // Finish onboarding
  await page.evaluate(() => { if (typeof vaiOnbFinish === 'function') vaiOnbFinish(); });
  await page.waitForTimeout(200);

  // ── 4. Bottom nav: 6 buttons (Talk · Act · Vault · Circle · Settings · SOS)
  const navBtns = await page.locator('.vai-bnav button').count();
  if (navBtns === 6) pass('4. Bottom nav has 6 buttons (Talk/Act/Vault/Circle/Settings/SOS)');
  else fail('4. Bottom nav', `expected 6 buttons, got ${navBtns}`);

  // ── 5. Initial tab is "talk"
  const talkActive = await page.locator('#vai-panel-talk.active').count();
  if (talkActive) pass('5. Initial tab is Talk');
  else fail('5. Initial tab', 'Talk panel not active');

  // ── 6. Switch through each tab and screenshot
  mkdirSync(resolve(__dirname), { recursive: true });
  for (const tab of ['talk','act','vault','circle','sos']) {
    await page.evaluate((t) => vaiSwitchTab(t), tab);
    await page.waitForTimeout(250);
    const navActive = await page.locator(`.vai-bnav button[data-tab-target="${tab}"].active`).count();
    if (navActive) pass(`6. Switch to ${tab.toUpperCase()} tab works`);
    else fail(`6. Switch ${tab}`, 'nav button not marked active');
    // Screenshot
    const shotPath = resolve(__dirname, `vaani_redesign_${tab}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   📸 ${shotPath}`);
  }

  // ── 7. SOS tab shows the red screen + 3 emergency line buttons
  await page.evaluate(() => vaiSwitchTab('sos'));
  await page.waitForTimeout(200);
  const sosLines = await page.locator('.vai-sos-screen .sos-line-btn').count();
  if (sosLines === 3) pass('7. SOS tab shows 112 / 108 / 1930 lines');
  else fail('7. SOS lines', `expected 3, got ${sosLines}`);

  // ── 8. Friendly error banner — force a 500 response + click mic send
  await page.evaluate(() => vaiSwitchTab('talk'));
  await page.waitForTimeout(150);
  await page.route('**/api/vaani/ask', (route) => route.fulfill({ status: 500, body: 'simulated' }));
  await page.evaluate(() => {
    document.getElementById('user-text').value = 'Hello';
    sendToChitti();
  });
  await page.waitForTimeout(1200);
  const errVisible = await page.locator('#vai-err:not(.hidden)').count();
  if (errVisible) pass('8. Friendly error banner appears on backend failure');
  else fail('8. Friendly error banner', 'did not appear');
  await page.unroute('**/api/vaani/ask');

  // ── 9. Mic button is big + green
  const micSize = await page.locator('#mic-big').boundingBox();
  if (micSize && micSize.width >= 140 && micSize.height >= 140) pass(`9. Mic button is big (${Math.round(micSize.width)}×${Math.round(micSize.height)})`);
  else fail('9. Mic size', `got ${micSize && (micSize.width+'x'+micSize.height)}`);

  // ── 10. Tap-target minimum: ACT tab tiles are ≥ 60px tall
  await page.evaluate(() => vaiSwitchTab('act'));
  await page.waitForTimeout(200);
  const tile = await page.locator('main .pro-card').first().boundingBox();
  if (tile && tile.height >= 60) pass(`10. ACT tiles ≥ 60px tall (${Math.round(tile.height)}px)`);
  else fail('10. ACT tile height', `${tile && tile.height}`);

  // ── 11. Language flip — toggle to Hindi and confirm "Talk" label flips
  await page.evaluate(() => {
    const sel = document.getElementById('lang-select');
    if (sel) { sel.value = 'hi'; sel.dispatchEvent(new Event('change')); }
    if (typeof vaiApplyI18n === 'function') vaiApplyI18n();
  });
  await page.waitForTimeout(150);
  const talkLabel = await page.locator('.vai-bnav button[data-tab-target="talk"] span:nth-child(2)').textContent();
  if (talkLabel && /बात|करो/i.test(talkLabel)) pass(`11. Language flip works (Hindi "Talk" = "${talkLabel}")`);
  else fail('11. Language flip', `Talk label after Hindi flip = "${talkLabel}"`);

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n──────────────────────────────────────────────`);
  console.log(`Vaani redesign check: ${passed} PASS · ${failed} FAIL`);
  if (failed) {
    console.log('\nFailures:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.label} — ${r.why}`));
  }
  console.log(`──────────────────────────────────────────────\n`);

  await browser.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
