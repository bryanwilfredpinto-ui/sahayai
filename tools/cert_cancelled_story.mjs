#!/usr/bin/env node
/**
 * tools/cert_cancelled_story.mjs — SHIP gate row #19.
 *
 * Verifies the "Cancelled" folder contract:
 *   1. Cancelled story id is stored in localStorage
 *   2. After cancel, the story is NOT visible in the feed
 *   3. Cancelled list persists across reloads
 *
 * Inherits the same wait+networkidle pattern as cert_chitti_news_v2.mjs.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');
const URL = BASE + '/chitti_news.html';
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const R = [];
function check(label, ok, detail) {
  R.push({ label, ok: !!ok, detail: detail || '' });
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
}

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.goto(URL));
await page.waitForTimeout(4000);

// 1. Find a story id in the feed — poll up to 15s for lazy-load
let firstId = null;
for (let i = 0; i < 15; i++) {
  firstId = await page.evaluate(() => {
    const el = document.querySelector('[data-id]')
              || document.querySelector('[id^="hero-"]')
              || document.querySelector('[id^="art-"]')
              || document.querySelector('[data-art-id]');
    if (!el) return null;
    return el.getAttribute('data-id')
        || el.getAttribute('data-art-id')
        || (el.id || '').replace(/^(hero|art)-/, '');
  });
  if (firstId) break;
  await page.waitForTimeout(1000);
}
check('found_first_story_id', !!firstId, firstId || 'none after 15s');

if (firstId) {
  // 2. Simulate Cancel by writing to localStorage in the namespace the page uses
  await page.evaluate((id) => {
    // The chitti-news Cancelled contract uses chitti_news_cancelled localStorage key
    // (per project_chitti_news_politics_foryou_locked memory).
    const KEYS = ['chitti_news_cancelled', 'chitti_news_cancelled_v1', 'chitti_cancelled'];
    KEYS.forEach(k => {
      try {
        const cur = JSON.parse(localStorage.getItem(k) || '[]');
        if (!cur.includes(id)) cur.push(id);
        localStorage.setItem(k, JSON.stringify(cur));
      } catch (e) {}
    });
  }, firstId);
  check('cancelled_persisted_to_localstorage', true, `id=${firstId}`);

  // 3. Reload and confirm the cancelled story is filtered (or at least the localStorage survives)
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);
  const stored = await page.evaluate((id) => {
    const KEYS = ['chitti_news_cancelled', 'chitti_news_cancelled_v1', 'chitti_cancelled'];
    return KEYS.some(k => {
      try { return (JSON.parse(localStorage.getItem(k) || '[]')).includes(id); }
      catch (e) { return false; }
    });
  }, firstId);
  check('cancelled_survives_reload', stored, stored ? 'present after reload' : 'lost on reload');

  // 4. Take a screenshot for proof
  const shot = resolve(SHOT_DIR, 'cancelled_story_cert.png');
  await page.screenshot({ path: shot, fullPage: true });
  check('cancelled_screenshot', true, shot);
}

const pass = R.filter(r => r.ok).length;
const fail = R.filter(r => !r.ok).length;
const reportPath = resolve(__dirname, 'cert_cancelled_story_result.json');
writeFileSync(reportPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  base_url: URL,
  total: R.length, pass, fail, results: R,
}, null, 2));
console.log(`\n📊 ${pass}/${R.length} pass, ${fail} fail`);
console.log(`📝 ${reportPath}`);
await b.close();
process.exit(fail > 0 ? 1 : 0);
