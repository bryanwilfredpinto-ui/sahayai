#!/usr/bin/env node
/** Smoke-test the 9 competition-build features on a local serve of the branch. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end('x'); return; } r.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${srv.address().port}/chitti_mechanic_2w.html?dp_skip=1`;
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
const ok = (n, c) => console.log((c ? 'PASS' : 'FAIL') + ' :: ' + n);
const tab = async k => { await page.locator('#tab-' + k).click(); await page.locator('#panel-' + k).waitFor({ state: 'visible' }); await page.waitForTimeout(80); };
const tx = async s => ((await page.locator(s).first().innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
// #1 crisis + free-text
await tab('doctor'); await page.fill('#dr-text', 'i met with an accident, injured'); await page.evaluate(() => window.mechCoachText()); await page.waitForTimeout(150);
ok('#1 free-text crisis → Emergency card', /emergency|108|112/i.test(await tx('#r-coach')));
await page.fill('#dr-text', 'my brakes are not stopping'); await page.evaluate(() => window.mechCoachText()); await page.waitForTimeout(150);
ok('#1 free-text brake → mechanic', /mechanic/i.test(await tx('#r-coach')));
// #2 chain wear in health
await tab('bike'); await page.fill('#bk-odo', '20000'); await page.fill('#bk-chainkm', '15500'); await page.evaluate(() => window.mechSaveBike()); await page.evaluate(() => window.mechHealth()); await page.waitForTimeout(150);
ok('#2 chain wear shows in health dashboard', /wear|set 15500/i.test(await tx('#r-health')));
// #3 unused reminder
await page.fill('#bk-lastride', '2026-02-01'); await page.evaluate(() => window.mechSaveBike());
await tab('remind'); await page.evaluate(() => window.mechReminders()); await page.waitForTimeout(150);
ok('#3 unused-bike reminder fires', /not ridden/i.test(await tx('#r-remind')));
// #4 home stats
ok('#4 home savings + health number', /Saved this year/i.test(await tx('#home-stats')) && /Ownership health/i.test(await tx('#home-stats')));
// #5 compliance deep-link
await tab('puc'); await page.evaluate(() => window.mechCompliance('mparivahan')); await page.waitForTimeout(120);
ok('#5 compliance opens official portal link', /parivahan\.gov\.in/.test(await page.locator('#r-compliance a').first().getAttribute('href').catch(() => '')));
// #6 EV intel + charging
await tab('battery'); await page.fill('#ev-range', '120'); await page.evaluate(() => window.mechEv()); await page.waitForTimeout(120);
ok('#6 EV health + real range', /health ≈ \d+%/i.test(await tx('#r-ev')));
await page.evaluate(() => window.mechNearest('charging')); await page.waitForTimeout(120);
ok('#6 charging station maps link', /google\.com\/maps/.test(await page.locator('#r-ev a').first().getAttribute('href').catch(() => '')));
// #7 parts + red flags + boodmo
await tab('service'); await page.fill('#pt-q', 'brake'); await page.evaluate(() => window.mechParts()); await page.waitForTimeout(150);
ok('#7 parts price + red flags', /₹/.test(await tx('#r-parts')) && /red flag/i.test(await tx('#r-parts')));
ok('#7 boodmo compare link', /boodmo\.com/.test(await page.locator('#r-parts a').first().getAttribute('href').catch(() => '')));
// #8 service cost estimator
await page.evaluate(() => window.mechServiceCosts()); await page.waitForTimeout(120);
ok('#8 service cost estimator lists bands', /₹/.test(await tx('#r-svccost')) && /km/.test(await tx('#r-svccost')));
// #9 twin timeline
await tab('savings'); await page.evaluate(() => window.mechTwin()); await page.waitForTimeout(150);
ok('#9 vehicle twin visual timeline', (await page.locator('#r-savings .vt-line .vt-item').count()) >= 2);
console.log('VERIFY9_PAGEERRORS::' + errs.length);
await b.close(); srv.close();
