#!/usr/bin/env node
/**
 * tools/cert_mechanic.mjs — Chitti Auto OS (Bike + Car Doctor) certification.
 * Self-serving (boots its own static server over the repo root), runs Playwright
 * across 375 / 768 / 1280, asserts the 5 frontend gates + the CEOS Swarm Diagnosis
 * card's 5 mandatory box-elements + tap targets + a RUNTIME i18n proof (switch to a
 * non-Latin language → the swarm labels must actually change, no Hinglish left).
 * Writes real screenshots to tools/cert_screenshots/.
 * Run: node tools/cert_mechanic.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOT_DIR = resolve(__dirname, 'cert_screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    const fp = join(ROOT, url === '/' ? '/index.html' : url);
    if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(readFileSync(fp));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const R = [];
function check(label, ok, detail) { R.push({ label, ok: !!ok, detail: detail || '' }); console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); }
async function safe(label, fn) { try { return await fn(); } catch (e) { check(label, false, 'threw: ' + e.message); return null; } }

const PAGES = [
  { page: 'chitti_2wheeler.html', prefix: 'mb', card: 'mb-card-swarm', label: 'bike' },
  { page: 'chitti_4wheeler.html', prefix: 'mc', card: 'mc-card-swarm', label: 'car' },
];
const viewports = [{ name: '375', w: 375, h: 812, dsf: 2 }, { name: '768', w: 768, h: 1024, dsf: 2 }, { name: '1280', w: 1280, h: 900, dsf: 1 }];

// Hinglish tokens that MUST NOT appear in rendered swarm UI text (CTO.md §5).
const HINGLISH = ['soch rahe', 'Pehle takleef', 'Kyun (Why)', 'Chala sakte ho', 'theek lagta', 'zyada lagta', 'Aapse maanga', 'Yeh ek estimate', 'Voice abhi', 'nikaal raha', 'dono bhariye'];

const b = await chromium.launch({ headless: true });

for (const P of PAGES) {
  const URL = `${BASE}/${P.page}`;
  const html = readFileSync(join(ROOT, P.page), 'utf8');

  // ---- 1. Responsive screenshots (full page + swarm card crop) ----
  for (const v of viewports) {
    await safe(`${P.label}_screenshot_${v.name}`, async () => {
      const c = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
      const p = await c.newPage();
      await p.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => p.goto(URL, { waitUntil: 'domcontentloaded' }));
      await p.waitForTimeout(1200);
      await p.screenshot({ path: resolve(SHOT_DIR, `${P.page.replace('.html', '')}_${v.name}.png`), fullPage: true });
      if (v.name === '375') {
        const el = p.locator(`[data-chitti-response="${P.card}"]`);
        if (await el.count()) await el.first().screenshot({ path: resolve(SHOT_DIR, `${P.page.replace('.html', '')}_swarm_card.png`) }).catch(() => {});
      }
      check(`${P.label}_screenshot_${v.name}`, true, `${v.w}px`);
      await c.close();
    });
  }

  // ---- main context for gate checks (375px) ----
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);

  // ---- 2. Five frontend gates ----
  await safe(`${P.label}_G1`, async () => {
    const tag = /feedback-widget\.js/.test(html);
    const boxes = await page.locator('[data-chitti-response]').count();
    check(`${P.label} G1 feedback-widget + data-chitti-response`, tag && boxes >= 5, `script:${tag} boxes:${boxes}`);
  });
  check(`${P.label} G2 chitti_a11y.js`, /chitti_a11y\.js/.test(html));
  await safe(`${P.label}_G4`, async () => {
    const lang = await page.evaluate(() => document.documentElement.lang || '');
    check(`${P.label} G4 lang auto-detect (<html lang>)`, /^[a-z]{2}$/.test(lang), `lang="${lang}"`);
  });
  await safe(`${P.label}_G5`, async () => {
    const tag = /chitti_isl\.js/.test(html);
    const rt = await page.evaluate(() => !!(window.Chitti && window.Chitti.isl));
    check(`${P.label} G5 ISL (script or runtime)`, tag || rt, `script:${tag} runtime:${rt}`);
  });

  // ---- 2b. RENDER SANITY: no raw i18n keys visible + real content (catches the
  //         mid-deploy / stale-cache broken render Sire reported 2026-06-04) ----
  await safe(`${P.label}_render_sanity`, async () => {
    const r = await page.evaluate(() => {
      const txt = document.body.innerText || '';
      const rawKeys = /\b(mb|mc)\.(title|tag|swarm)\b/.test(txt); // unresolved data-vai-i18n
      const brand = (document.querySelector('.sds-brand-name') || {}).textContent || '';
      const home = document.querySelector('#mb-tab-home, #mc-tab-home');
      const homeVisible = home && getComputedStyle(home).display !== 'none' && home.innerText.trim().length > 20;
      const langSelects = document.querySelectorAll('#lang-select').length; // exactly 1, no collision
      return { rawKeys, brand, homeVisible, langSelects, brandHasKey: /\.(title|tag)$/.test(brand.trim()) };
    });
    const ok = !r.rawKeys && !r.brandHasKey && r.homeVisible && r.langSelects === 1;
    check(`${P.label} render sanity (no raw keys, content rendered, 1 lang select)`, ok, JSON.stringify(r));
  });

  // ---- 3. Swarm card exists + 5 mandatory elements ----
  await safe(`${P.label}_swarm_card`, async () => {
    const r = await page.evaluate((card) => {
      const c = document.querySelector(`[data-chitti-response="${card}"]`);
      if (!c) return { present: false };
      const toolbar = c.querySelector('.sds-card-toolbar');
      const tbBtns = toolbar ? toolbar.querySelectorAll('button').length : 0;
      const hasSpeak = !!(toolbar && /🔊/.test(toolbar.textContent));
      const hasThumbs = !!(toolbar && c.querySelector('.fb-pos') && c.querySelector('.fb-neg'));
      const hasFbPanel = !!c.querySelector('.sds-fb-panel textarea'); // ✏️ type + 🎙️ mic path
      const hasInput = !!c.querySelector('#sw-symptom');
      const langSel = !!document.querySelector('#lang-select'); // 🌐
      return { present: true, tbBtns, hasSpeak, hasThumbs, hasFbPanel, hasInput, langSel };
    }, P.card);
    const ok = r.present && r.hasSpeak && r.hasThumbs && r.hasFbPanel && r.hasInput && r.langSel && r.tbBtns >= 3;
    check(`${P.label} Swarm card + 5 elements (🔊/🤖/👍👎/✏️🎙️/🌐)`, ok, JSON.stringify(r));
  });

  // ---- 4. RUNTIME i18n proof: switch to Tamil → labels change, no Hinglish ----
  await safe(`${P.label}_i18n_runtime`, async () => {
    const before = await page.evaluate((card) => {
      const c = document.querySelector(`[data-chitti-response="${card}"]`);
      return c ? c.querySelector('.sds-card-title').textContent.trim() : '';
    }, P.card);
    const changed = await page.evaluate((card) => {
      try { if (typeof changeLang === 'function') changeLang('ta'); else if (window.updateAllStrings) window.updateAllStrings('ta'); } catch (e) {}
      const c = document.querySelector(`[data-chitti-response="${card}"]`);
      const title = c ? c.querySelector('.sds-card-title').textContent.trim() : '';
      const ph = (c && c.querySelector('#sw-symptom')) ? c.querySelector('#sw-symptom').getAttribute('placeholder') : '';
      const disc = (c && c.querySelector('.sw-disclaimer')) ? c.querySelector('.sw-disclaimer').textContent.trim() : '';
      return { title, ph, disc };
    }, P.card);
    // Tamil block U+0B80–U+0BFF must appear in the swarm title after switching
    const tamil = /[஀-௿]/.test(changed.title);
    const noHing = HINGLISH.every(h => !changed.ph.includes(h) && !changed.disc.includes(h) && !changed.title.includes(h));
    check(`${P.label} i18n runtime (en→ta translates, no Hinglish)`, tamil && noHing, `title:"${changed.title}" tamilGlyphs:${tamil} noHinglish:${noHing}`);
    // reset
    await page.evaluate(() => { try { if (typeof changeLang === 'function') changeLang('en'); } catch (e) {} });
  });

  // ---- 5. Tap targets >= 44x40 on the swarm card ----
  await safe(`${P.label}_tap`, async () => {
    const sels = ['#sw-symptom', '.sw-mic', '.sw-go', `[data-chitti-response="${P.card}"] .sds-card-toolbar button`];
    const small = [];
    for (const s of sels) { const els = page.locator(s); const n = await els.count(); for (let i = 0; i < n; i++) { const box = await els.nth(i).boundingBox(); if (box && (box.width < 44 || box.height < 40)) small.push(`${s}#${i}=${Math.round(box.width)}x${Math.round(box.height)}`); } }
    check(`${P.label} tap targets >= 44x40`, small.length === 0, small.length ? small.slice(0, 6).join(', ') : 'all OK');
  });

  // ---- 6. Identity badge ----
  check(`${P.label} World Class identity badge`, /World Class Chitti (Bike|Car) Doctor|Chitti Mechanic/.test(html));

  await ctx.close();
}

await b.close();
server.close();
const pass = R.filter(r => r.ok).length;
const summary = { total_checks: R.length, total_pass: pass, total_fail: R.length - pass, failed: R.filter(r => !r.ok).map(r => r.label) };
console.log('\nCERT_SUMMARY:' + JSON.stringify(summary));
process.exit(summary.total_fail === 0 ? 0 : 1);
