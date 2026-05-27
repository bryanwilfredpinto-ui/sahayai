/**
 * Probe what Sire actually sees on the S Heartbeat Emblem.
 * Goes to live, dismisses disability modal, scrolls to emblem,
 * clicks Generate, waits for animation, screenshots.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message || e)));

// Pre-skip disability profile so it doesn't block.
await page.goto('https://sahayai.in/', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.evaluate(() => {
  try { localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: new Date().toISOString() })); } catch (e) {}
});

await page.goto('https://sahayai.in/chitti_logo_video.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

// Scroll the S Heartbeat Emblem section into view.
await page.locator('#emb-stage').scrollIntoViewIfNeeded({ timeout: 5000 });
await page.waitForTimeout(500);

// Screenshot BEFORE clicking Generate.
const before = resolve(__dirname, 'debug_emblem_before_375.png');
await page.locator('#emb-stage').screenshot({ path: before });
console.log('📸 before generate: ' + before);

// Click Generate.
await page.locator('#emb-go').click({ timeout: 3000 });
console.log('clicked Generate');

// Wait for the animation to start (placeholder hides).
await page.waitForTimeout(1500);

// Screenshot at t=1.5s.
const t15 = resolve(__dirname, 'debug_emblem_t15s_375.png');
await page.locator('#emb-stage').screenshot({ path: t15 });
console.log('📸 t=1.5s: ' + t15);

// Wait again and take another screenshot — if animation is running,
// these two frames will differ (different beat / ECG dot position).
await page.waitForTimeout(2000);
const t35 = resolve(__dirname, 'debug_emblem_t35s_375.png');
await page.locator('#emb-stage').screenshot({ path: t35 });
console.log('📸 t=3.5s: ' + t35);

// Pixel-diff the two animation frames to confirm animation is actually
// progressing. If they hash identical → frozen.
const hashes = await page.evaluate(async () => {
  const canvas = document.getElementById('s-emblem-canvas');
  if (!canvas) return { error: 'no canvas' };
  const c2 = canvas.getContext('2d');
  // Sample a 100x100 region around the ECG line area (lower half of canvas)
  const sample = c2.getImageData(canvas.width / 2 - 50, canvas.height / 2 + 100, 100, 50);
  // Hash via simple sum
  let s = 0;
  for (let i = 0; i < sample.data.length; i++) s = (s * 31 + sample.data[i]) | 0;
  return { hash: s };
});
console.log('frame hash sample: ' + JSON.stringify(hashes));

await page.waitForTimeout(1500);
const hashes2 = await page.evaluate(async () => {
  const canvas = document.getElementById('s-emblem-canvas');
  if (!canvas) return { error: 'no canvas' };
  const c2 = canvas.getContext('2d');
  const sample = c2.getImageData(canvas.width / 2 - 50, canvas.height / 2 + 100, 100, 50);
  let s = 0;
  for (let i = 0; i < sample.data.length; i++) s = (s * 31 + sample.data[i]) | 0;
  return { hash: s };
});
console.log('frame hash 2nd: ' + JSON.stringify(hashes2));
console.log('ANIMATION RUNNING: ' + (hashes.hash !== hashes2.hash));

console.log('pageerrors: ' + errs.length);
errs.slice(0, 5).forEach((e) => console.log('  ' + e));

await b.close();
