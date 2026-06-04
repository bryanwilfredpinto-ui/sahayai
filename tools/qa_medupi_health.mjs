/**
 * tools/qa_medupi_health.mjs
 *
 * World-Class Product-Engineer QA pass for Chitti MedUPI + Chitti Health File.
 * Goes BEYOND the DOM-presence cert (cert_all_pages.mjs) — it actually:
 *   1. Loads each page and tallies console errors / pageerrors / failed requests.
 *   2. Checks responsive layout at desktop / tablet / mobile (no horizontal overflow).
 *   3. Clicks every visible button and records any error it throws.
 *   4. Inventories forms / inputs / selects and checks they are usable.
 *   5. LANGUAGE COMPLIANCE (strict): switches through Vaani's 9 primary languages
 *      and measures what fraction of visible UI strings actually translate vs. stay
 *      English — listing the untranslated strings so they can be fixed.
 *
 * Usage:
 *   CERT_BASE=http://127.0.0.1:8765 node tools/qa_medupi_health.mjs
 * Output:
 *   tools/qa_medupi_health_result.json  (full machine-readable report)
 *   console summary + per-page untranslated-string lists
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const WAIT = Number(process.env.QA_WAIT_MS || 2200);
const SHOT_DIR = resolve(__dirname, 'qa_screenshots');
try { mkdirSync(SHOT_DIR, { recursive: true }); } catch (e) {}

const PAGES = ['chitti_medupi', 'chitti_health_file'];
// Vaani's 9 primary authored languages (CTO.md §5). en is the baseline.
const PRIMARY = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

// Strings that are ALLOWED to remain Latin/English in any language
// (CTO.md §6 technical-term allowlist + numbers/symbols/brand).
const ALLOW_RE = /^(chitti|vaani|sahayai|upi|imps|neft|fastag|digilocker|sebi|rbi|irdai|fssai|nppa|abdm|abha|pmjay|pm-?kisan|ayushman|hba1c|bp|spo2|ecg|mri|ct|xray|x-ray|jan aushadhi|whatsapp|pdf|sms|ai|llm|dpdp|html|json|api|tds|gst|itr|nse|bse|nifty|sensex|rsi|macd|ema|vwap|atr)$/i;
// Drug salt names commonly preserved.
const SALT_RE = /paracetamol|atorvastatin|metformin|amoxicillin|azithromycin|omeprazole|crocin|dolo|ibuprofen|cetirizine|pantoprazole/i;

function isProbablyEnglishWord(s) {
  const t = s.trim();
  if (t.length < 2) return false;
  // must contain at least 2 latin letters and be majority latin/space
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  if (letters < 2) return false;
  // ignore pure numbers / currency / punctuation
  if (/^[\d\s₹$%.,:/()+\-–—•|*#@]+$/.test(t)) return false;
  if (ALLOW_RE.test(t)) return false;
  if (SALT_RE.test(t)) return false;
  return true;
}

// Page-context collector for visible translatable strings.
const COLLECT_FN = `() => {
  const out = [];
  const skip = {SCRIPT:1,STYLE:1,CODE:1,PRE:1,TEXTAREA:1,NOSCRIPT:1,INPUT:1,OPTION:1,SELECT:1};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const p = n.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      if(skip[p.tagName]) return NodeFilter.FILTER_REJECT;
      if(p.closest('select#lang-select')) return NodeFilter.FILTER_REJECT;
      if(p.closest('[translate="no"]')||p.closest('[data-chitti-no-translate]')) return NodeFilter.FILTER_REJECT;
      // visibility
      const r = p.getBoundingClientRect();
      const st = getComputedStyle(p);
      if(st.display==='none'||st.visibility==='hidden'||st.opacity==='0') return NodeFilter.FILTER_REJECT;
      if(r.width===0&&r.height===0) return NodeFilter.FILTER_REJECT;
      const t=(n.nodeValue||'').replace(/\\s+/g,' ').trim();
      if(!t) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while((node=w.nextNode())){ out.push((node.nodeValue||'').replace(/\\s+/g,' ').trim()); }
  return out;
}`;

async function run() {
  const browser = await chromium.launch();
  const report = { base: BASE, generated: 'run-time', pages: {} };

  for (const slug of PAGES) {
    const pageReport = {
      consoleErrors: [], pageErrors: [], failedRequests: [],
      responsive: [], buttons: { total: 0, clicked: 0, errored: [] },
      forms: {}, language: {},
    };
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') pageReport.consoleErrors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => pageReport.pageErrors.push(String(e).slice(0, 300)));
    page.on('requestfailed', (r) => {
      const u = r.url();
      // ignore analytics/font noise
      if (/google|gstatic|fonts|analytics|favicon/i.test(u)) return;
      pageReport.failedRequests.push(u.slice(0, 160) + ' :: ' + (r.failure()?.errorText || ''));
    });

    const url = `${BASE}/${slug}.html?dp_skip=1`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(WAIT);

    // ---- Responsive ----
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
        langSelVisible: !!(document.querySelector('#lang-select') &&
          document.querySelector('#lang-select').offsetParent !== null),
      }));
      const overflow = m.sw - m.cw;
      pageReport.responsive.push({
        viewport: vp.name, scrollWidth: m.sw, clientWidth: m.cw,
        horizontalOverflowPx: overflow, overflow: overflow > 2,
        langSelectorVisible: m.langSelVisible,
      });
      await page.screenshot({ path: resolve(SHOT_DIR, `${slug}_${vp.name}.png`) }).catch(() => {});
    }
    // back to desktop for interaction
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);

    // ---- Forms inventory ----
    pageReport.forms = await page.evaluate(() => ({
      forms: document.querySelectorAll('form').length,
      textInputs: document.querySelectorAll('input[type="text"],input[type="number"],input[type="search"],input:not([type])').length,
      allInputs: document.querySelectorAll('input').length,
      textareas: document.querySelectorAll('textarea').length,
      selects: document.querySelectorAll('select').length,
      disabledInputs: document.querySelectorAll('input:disabled,textarea:disabled,select:disabled').length,
    }));

    // ---- Buttons: click each visible one, capture errors ----
    const btnHandles = await page.$$('button, [role="button"], a.btn, .btn');
    pageReport.buttons.total = btnHandles.length;
    const beforeErr = pageReport.consoleErrors.length + pageReport.pageErrors.length;
    for (let i = 0; i < btnHandles.length; i++) {
      const b = btnHandles[i];
      try {
        const vis = await b.isVisible().catch(() => false);
        if (!vis) continue;
        const label = (await b.innerText().catch(() => '') || await b.getAttribute('aria-label').catch(() => '') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const errBefore = pageReport.consoleErrors.length + pageReport.pageErrors.length;
        await b.click({ timeout: 1500, trial: false }).catch(() => {});
        await page.waitForTimeout(120);
        // close any modal that opened
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(40);
        const errAfter = pageReport.consoleErrors.length + pageReport.pageErrors.length;
        pageReport.buttons.clicked++;
        if (errAfter > errBefore) {
          pageReport.buttons.errored.push({ index: i, label, newErrors: errAfter - errBefore });
        }
      } catch (e) { /* ignore */ }
    }

    // ---- LANGUAGE COMPLIANCE ----
    // Reload fresh so the button-click phase (which may have left modals
    // open) doesn't pollute the visible-text baseline.
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(WAIT);
    // baseline (force en)
    await page.evaluate(() => { try { window.Chitti && window.Chitti.lang && window.Chitti.lang.set('en'); } catch (e) {} });
    await page.waitForTimeout(500);
    const baseline = await page.evaluate(`(${COLLECT_FN})()`);
    const baseSet = baseline.filter((s, idx, a) => a.indexOf(s) === idx);

    for (const lang of PRIMARY) {
      const switched = await page.evaluate((lg) => {
        try {
          if (window.Chitti && window.Chitti.lang && window.Chitti.lang.set) { window.Chitti.lang.set(lg); return 'api'; }
          const sel = document.querySelector('#lang-select');
          if (sel) { sel.value = lg; sel.dispatchEvent(new Event('change', { bubbles: true })); return 'select'; }
          return 'none';
        } catch (e) { return 'err:' + e.message; }
      }, lang);
      await page.waitForTimeout(900);
      const after = await page.evaluate(`(${COLLECT_FN})()`);
      const afterSet = new Set(after);

      // For each baseline english-word string, is it still present verbatim (untranslated)?
      let translatable = 0, untranslated = 0;
      const misses = [];
      for (const s of baseSet) {
        // only audit strings that are real english words (skip numbers/brands/allowlist)
        const isEng = s.split(/[•|/]/).some(() => false) || true; // placeholder
        if (!/[A-Za-z]/.test(s)) continue;
        if (s.replace(/[^A-Za-z]/g, '').length < 2) continue;
        // skip allowlisted technical/brand tokens
        const core = s.trim();
        if (/^(chitti|vaani|sahayai|upi|sebi|rbi|fssai|nppa|abdm|abha|pmjay|jan aushadhi|whatsapp|pdf|sms|hba1c|bp|spo2|ecg|mri)$/i.test(core)) continue;
        translatable++;
        if (afterSet.has(s)) { untranslated++; if (misses.length < 60) misses.push(s); }
      }
      const coverage = translatable ? Math.round(((translatable - untranslated) / translatable) * 100) : 100;
      pageReport.language[lang] = {
        switchMethod: switched, translatableStrings: translatable,
        untranslatedCount: untranslated, coveragePct: coverage,
        untranslatedSamples: misses,
      };
    }
    // restore en
    await page.evaluate(() => { try { window.Chitti.lang.set('en'); } catch (e) {} });

    report.pages[slug] = pageReport;
    await ctx.close();
  }

  await browser.close();
  writeFileSync(resolve(__dirname, 'qa_medupi_health_result.json'), JSON.stringify(report, null, 2));

  // ---- console summary ----
  for (const slug of PAGES) {
    const r = report.pages[slug];
    console.log('\n========== ' + slug + ' ==========');
    console.log('Console errors :', r.consoleErrors.length, '| Page errors:', r.pageErrors.length, '| Failed requests:', r.failedRequests.length);
    if (r.consoleErrors.length) r.consoleErrors.slice(0, 8).forEach((e) => console.log('   CE:', e));
    if (r.pageErrors.length) r.pageErrors.slice(0, 8).forEach((e) => console.log('   PE:', e));
    if (r.failedRequests.length) r.failedRequests.slice(0, 8).forEach((e) => console.log('   RF:', e));
    console.log('Responsive:');
    r.responsive.forEach((v) => console.log(`   ${v.viewport.padEnd(8)} overflow=${v.horizontalOverflowPx}px ${v.overflow ? '❌HORIZ-SCROLL' : 'ok'} langSel=${v.langSelectorVisible}`));
    console.log('Forms:', JSON.stringify(r.forms));
    console.log('Buttons:', r.buttons.clicked + '/' + r.buttons.total, 'clicked; errored:', r.buttons.errored.length);
    r.buttons.errored.slice(0, 8).forEach((b) => console.log('   BTN ERR:', b.label, '(+' + b.newErrors + ')'));
    console.log('Language coverage (% of UI strings translated):');
    for (const lang of PRIMARY) {
      const l = r.language[lang];
      console.log(`   ${lang}: ${l.coveragePct}%  (${l.untranslatedCount}/${l.translatableStrings} untranslated, via ${l.switchMethod})`);
    }
    // worst-offender sample (hi)
    const hi = r.language.hi;
    if (hi && hi.untranslatedSamples.length) {
      console.log('   Untranslated (hi) sample:');
      hi.untranslatedSamples.slice(0, 25).forEach((s) => console.log('       •', s));
    }
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
