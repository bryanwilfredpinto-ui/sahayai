#!/usr/bin/env node
/** Verify the new QA-fix features on a LOCAL serve of the branch. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); res.end('x'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(d); }); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/chitti_mechanic_2w.html?dp_skip=1`;
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const ok = (n, c) => console.log((c ? 'PASS' : 'FAIL') + ' :: ' + n);
await page.goto(URL, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
// How-to-use heading
ok('BUG-1 "How to use Chitti" heading present', (await page.locator('#how-to-use .howto-h').innerText()).toLowerCase().includes('how to use'));
// Home grid 5 buckets
ok('Home grid has 5 cards', (await page.locator('.home-grid .home-card').count()) === 5);
await page.locator('.home-grid .home-card', { hasText: 'Fix & Maintain' }).click(); await page.waitForTimeout(150);
ok('Home grid card switches tab', (await page.locator('#tab-doctor').getAttribute('aria-selected')) === 'true');
// Health dashboard
await page.click('#tab-bike'); await page.fill('#bk-odo', '13000'); await page.fill('#bk-class', '').catch(() => {}); await page.selectOption('#bk-class', 'scooter');
await page.evaluate(() => window.mechHealth()); await page.waitForTimeout(200);
ok('Health dashboard renders 5 systems', (await page.locator('#r-health .vh-row').count()) === 5);
ok('Health zones colour+word (not colour-only)', (await page.locator('#r-health .vh-zone').first().innerText()).trim().length > 1);
ok('Health pictograms (SVG) present', (await page.locator('#r-health .vh-ic').count()) === 5);
// Dark mode
await page.click('#dark-toggle'); await page.waitForTimeout(150);
ok('Dark mode toggles', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
await page.click('#dark-toggle'); await page.waitForTimeout(100);
ok('Dark mode toggles back', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');
// Document thumbnail gallery (inject a fake image doc via vault then show)
await page.evaluate(() => { var v = window.ChittiMech2W.vault.load(); v.docs = [{ type: 'Insurance', name: 'x.png', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }]; window.ChittiMech2W.vault.save(v); window.mechShowDocs(); });
await page.waitForTimeout(150);
ok('Document thumbnail gallery shows image', (await page.locator('#r-bike .doc-thumb img').count()) >= 1);
await page.evaluate(() => window.ChittiMech2W.vault.forget());
// BUG-3: ISL panels attach per response WHEN ISL enabled (default-off by design)
const islOff = await page.locator('.chitti-isl-autobox').count();
const islOn = await page.evaluate(async () => {
  if (!(window.Chitti && window.Chitti.a11y && window.Chitti.a11y.setIslMode)) return -1;
  window.Chitti.a11y.setIslMode(true); await new Promise(r => setTimeout(r, 600));
  return document.querySelectorAll('.chitti-isl-autobox').length;
});
ok('BUG-3 ISL OFF by default (locked §7)', islOff === 0);
ok('BUG-3 ISL panels attach per-response when enabled', islOn === -1 ? false : islOn >= 10, 'panels=' + islOn);
console.log('NEWFEATURES_PAGEERRORS::' + (await page.evaluate(() => (window.__mech2wErrors || []).length)));
await b.close(); server.close();
