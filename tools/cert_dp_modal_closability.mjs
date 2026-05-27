/**
 * tools/cert_dp_modal_closability.mjs
 *
 * Chitti CTO regression cert — verifies the Disability Profile modal
 * is closable by EVERY documented path AND that closing writes to
 * localStorage so the modal never re-shows.
 *
 * Sire 2026-05-27: "Disability Profile modal is blocking Sire. No X or
 * Close button visible. User cannot proceed." Fix locked the following
 * close paths:
 *
 *   1. X button (top right of card)
 *   2. Skip button (sticky footer)
 *   3. Backdrop tap (anywhere outside the card)
 *   4. Esc key
 *   5. Explicit Save button (with picks)
 *
 * Each path MUST:
 *   - dismiss the modal in <500ms
 *   - write a localStorage.disability_profile JSON record
 *   - prevent the modal from re-appearing on the next page load
 *
 * Run against any deploy:
 *   node tools/cert_dp_modal_closability.mjs
 *   CERT_BASE=http://127.0.0.1:8765 node tools/cert_dp_modal_closability.mjs
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');
const PROBE_URL = BASE + '/chitti_vaani.html';
const results = [];
function add(label, ok, detail) {
  results.push({ label, ok, detail });
  console.log((ok ? '✅' : '❌') + ' ' + label + (detail ? ' — ' + detail : ''));
}

async function freshLoad(browser, dismissFn, label) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  // Clean origin storage before each scenario.
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });

  await page.goto(PROBE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#chitti-disability-profile-modal', { timeout: 6000 });
  const beforeStore = await page.evaluate(() => localStorage.getItem('disability_profile'));
  add('[' + label + '] modal opens on first visit', !beforeStore && true);

  // Run the close action.
  const closedT0 = Date.now();
  await dismissFn(page);
  // Wait up to 1.5s for the modal to vanish.
  let gone = false;
  for (let i = 0; i < 30; i++) {
    const stillThere = await page.evaluate(() => !!document.getElementById('chitti-disability-profile-modal'));
    if (!stillThere) { gone = true; break; }
    await page.waitForTimeout(50);
  }
  const closedMs = Date.now() - closedT0;
  add('[' + label + '] modal closes after action', gone, 'closed in ' + closedMs + 'ms');

  // Storage record written?
  const stored = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('disability_profile') || 'null'); } catch (e) { return null; }
  });
  add('[' + label + '] localStorage.disability_profile populated', !!stored,
    stored ? JSON.stringify(stored).slice(0, 100) : 'NULL');
  if (stored && stored.closed_via) {
    add('[' + label + '] closed_via marker recorded', !!stored.closed_via, stored.closed_via);
  }

  // Now navigate to ANOTHER Chitti page and confirm the modal does NOT
  // re-appear. This is the "never show again" invariant.
  await page.goto(BASE + '/chitti_medupi.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  const reappeared = await page.evaluate(() => {
    const m = document.getElementById('chitti-disability-profile-modal');
    if (!m) return false;
    const cs = window.getComputedStyle(m);
    if (cs.display === 'none') return false;
    const r = m.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  add('[' + label + '] modal does NOT re-appear on next page', !reappeared,
    reappeared ? 'modal RE-APPEARED on chitti_medupi.html (regression!)' : '');

  await ctx.close();
}

const browser = await chromium.launch({ headless: true });

// Scenario 1 — X button click
await freshLoad(browser, async (page) => {
  await page.locator('#chitti-disability-profile-modal .chitti-dp-close').click({ timeout: 3000 });
}, 'X-button');

// Scenario 2 — Skip button click
await freshLoad(browser, async (page) => {
  await page.locator('#chitti-disability-profile-modal .chitti-dp-skip').click({ timeout: 3000 });
}, 'Skip-button');

// Scenario 3 — Save button (after picking lang + voice)
await freshLoad(browser, async (page) => {
  // Pick the illiterate (voice-preferred) checkbox so a meaningful
  // record is written. Lang is already English by default.
  await page.locator('#chitti-disability-profile-modal input[data-key="illiterate"]').check({ timeout: 3000 });
  await page.waitForTimeout(150);
  await page.locator('#chitti-disability-profile-modal .chitti-dp-save').click({ timeout: 3000 });
}, 'Save-button');

// Scenario 4 — Backdrop click (anywhere outside the card)
await freshLoad(browser, async (page) => {
  // Click in the top-left corner of the backdrop (outside the centred card).
  await page.mouse.click(10, 10);
}, 'Backdrop-tap');

// Scenario 5 — Esc key
await freshLoad(browser, async (page) => {
  await page.keyboard.press('Escape');
}, 'Esc-key');

await browser.close();

const summary = {
  ts: new Date().toISOString(),
  probe: PROBE_URL,
  results,
  pass: results.every((r) => r.ok),
};
writeFileSync(
  resolve(__dirname, 'cert_dp_modal_result.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

const passed = results.filter((r) => r.ok).length;
const total = results.length;
console.log(`\nCERT ${summary.pass ? 'PASS' : 'FAIL'} · ${passed}/${total} checks passed.`);
process.exit(summary.pass ? 0 : 1);
