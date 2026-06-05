#!/usr/bin/env node
/**
 * tools/scan_hinglish.mjs — measures CTO.md §5 (No-Hinglish) compliance.
 * For each page, for each non-English language, switches the UI and scans every
 * VISIBLE text node for Latin-script words (≥3 letters) that are NOT on the
 * allowed whitelist (brands + §6 technical terms). Each such token = a string
 * that is either code-switched or untranslated → a §5 violation.
 * Also verifies the language dropdown is present and lists ≥10 languages.
 * Run: node tools/scan_hinglish.mjs
 */
import { chromium } from 'playwright';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => { try { const u = decodeURIComponent((req.url || '/').split('?')[0]); const fp = join(ROOT, u === '/' ? '/index.html' : u); if (!fp.startsWith(ROOT) || !existsSync(fp)) { res.writeHead(404); res.end('nf'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp)); } catch (e) { res.writeHead(500); res.end(String(e)); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// Allowed Latin tokens (lowercased): brands + §6 technical terms + units + product names.
const WHITE = new Set(['chitti', 'chitthi', 'sahayai', 'vaani', 'obd', 'dtc', 'rsi', 'macd', 'sebi', 'rbi', 'upi', 'npci', 'fssai', 'abs', 'ev', 'puc', 'rc', 'sos', 'km', 'kmpl', 'kms', 'ac', 'dpf', 'egr', 'srs', 'esp', 'tpms', 'eps', 'id', 'co', 'pdf', 'gst', 'pan', 'emi', 'rsa', 'isl', 'app', 'ok', 'english', 'bluetooth', 'elm327', 'wi', 'fi', 'usb', 'sa', 'maf', 'map', 'evap', 'ecm', 'ecu', 'soc', 'mil', 'cvt', 'at', 'mt',
  'honda', 'hero', 'bajaj', 'tvs', 'yamaha', 'suzuki', 'ktm', 'royal', 'enfield', 'splendor', 'activa', 'jupiter', 'pulsar', 'ola', 'ather', 'maruti', 'swift', 'creta', 'nexon', 'venue', 'baleno', 'tata', 'hyundai', 'plus', 'meteor', 'classic', 'bullet', 'apache', 'jawa', 'i3s', 'disc']);
const LATIN = /[A-Za-z][A-Za-z'’]{2,}/g;
const NONLATIN = /[ऀ-ॿঀ-৿஀-௿ఀ-౿઀-૿ಀ-೿ഀ-ൿ]/; // Deva/Beng/Tamil/Telu/Guj/Kann/Mala

const PAGES = [
  { id: 'bike', file: 'chitti_2wheeler.html' },
  { id: 'car', file: 'chitti_4wheeler.html' },
];
const LANGS = [['hi', 'Hindi'], ['bn', 'Bengali'], ['ta', 'Tamil'], ['te', 'Telugu'], ['mr', 'Marathi'], ['gu', 'Gujarati'], ['kn', 'Kannada'], ['ml', 'Malayalam']];

const b = await chromium.launch({ headless: true });
const REPORT = {};

for (const P of PAGES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  // Pre-seed BEFORE page scripts run so the first-visit disability-onboarding modal
  // (which carries its OWN language picker) never shows — we measure the steady-state
  // page a returning user sees, not the one-time onboarding overlay.
  await ctx.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ done: true })); } catch (e) {} });
  const pg = await ctx.newPage();
  await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })).catch(() => {});
  await pg.goto(`${BASE}/${P.file}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ done: true })); } catch (e) {} const x = document.querySelector('[onclick*="skip" i],.dp-skip'); if (x) x.click(); });

  // dropdown availability
  const dd = await pg.evaluate(() => { const s = document.querySelector('#lang-select'); return { present: !!s, options: s ? s.options.length : 0, tag: s ? s.tagName : null }; });

  REPORT[P.id] = { dropdown: dd, langs: {} };
  for (const [code, name] of LANGS) {
    await pg.evaluate((c) => { try { window.changeLang ? window.changeLang(c) : window.updateAllStrings(c); } catch (e) {} }, code);
    // open every tab so we scan all panels' content
    for (const t of ['home', 'bike', 'car', 'docs', 'alerts', 'ask']) {
      await pg.evaluate((t) => { try { (window.mbTab || window.mcTab) && (window.mbTab || window.mcTab)(t); } catch (e) {} }, t);
    }
    await pg.evaluate((c) => { try { window.changeLang ? window.changeLang(c) : window.updateAllStrings(c); } catch (e) {} }, code);
    await pg.waitForTimeout(800);  // let strings.js settle (steady-state, not mid-transition)
    const res = await pg.evaluate(() => {
      const bad = {};
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; const texts = [];
      while ((n = walker.nextNode())) {
        const el = n.parentElement;
        if (!el) continue;
        const tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'OPTION') continue;
        if (el.closest('#lang-select')) continue;
        // TRUE visibility: getClientRects() is empty for any element inside a
        // display:none subtree (e.g. closed feedback modals) — the element's OWN
        // computed display is non-none, so the old check wrongly counted hidden
        // modal text users never see. Measure what is actually rendered.
        if (!el.getClientRects || el.getClientRects().length === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const t = (n.textContent || '').trim();
        if (t) texts.push(t);
      }
      return texts;
    });
    // tally Latin tokens not whitelisted
    const tally = {};
    let total = 0;
    for (const t of res) {
      const m = t.match(LATIN);
      if (!m) continue;
      for (const w of m) { const lw = w.toLowerCase(); if (WHITE.has(lw)) continue; tally[w] = (tally[w] || 0) + 1; total++; }
    }
    const top = Object.entries(tally).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([w, c]) => `${w}×${c}`);
    REPORT[P.id].langs[code] = { name, violations: total, distinct: Object.keys(tally).length, top };
  }
  await ctx.close();
}
await b.close();
server.close();

console.log('\n========== §5 NO-HINGLISH SCAN ==========');
for (const pid of Object.keys(REPORT)) {
  const r = REPORT[pid];
  console.log(`\n### ${pid}  — dropdown: present=${r.dropdown.present} options=${r.dropdown.options}`);
  let pageTotal = 0;
  for (const code of Object.keys(r.langs)) {
    const L = r.langs[code];
    pageTotal += L.violations;
    console.log(`  ${code} ${L.name.padEnd(10)} violations=${String(L.violations).padStart(4)} distinct=${String(L.distinct).padStart(3)}  e.g. ${L.top.slice(0, 8).join(' ')}`);
  }
  console.log(`  >>> ${pid} TOTAL Latin/code-switch tokens across 8 langs: ${pageTotal}`);
}
const grand = Object.values(REPORT).reduce((s, r) => s + Object.values(r.langs).reduce((a, l) => a + l.violations, 0), 0);
console.log(`\nSCAN_RESULT:${JSON.stringify({ grandTotalViolations: grand })}`);
process.exit(0);
