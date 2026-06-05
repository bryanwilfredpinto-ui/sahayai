/* fashion_handover_audit.mjs — REAL evidence for the Chitti Fashion handover pack.
   Runs the actual page across 3 browser engines + edge cases + language flicker +
   performance, and prints a JSON blob. Nothing here is asserted without execution.
   Honest by design: anything that needs a physical device lab is NOT claimed here.
   Run: node tools/fashion_handover_audit.mjs */
import { chromium, firefox, webkit } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL = pathToFileURL(resolve(ROOT, 'chitti_fashion.html')).href;
const LANGS = ['en', 'hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'gu'];
const out = { crossEngine: [], edge: {}, flicker: [], perf: {}, journeys: [], errors: [] };

async function seed(p) {
  await p.evaluate(async () => {
    await new Promise((res) => { const r = indexedDB.open('chitti_fashion_almari', 1);
      r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' }); };
      r.onsuccess = () => { const db = r.result, tx = db.transaction('items', 'readwrite'), st = tx.objectStore('items'), now = new Date().toISOString();
        [['t1','top','navy','blazer','#1A3A6B'],['t2','top','white','shirt','#FFFFFF'],['b1','bottom','beige','chinos','#D9C7A0'],['b2','bottom','blue','jeans','#2A4B7C'],['f1','footwear','brown','loafers','#5A3A20'],['o1','outfit','maroon','silk saree','#800000']].forEach(x => st.put({ id: x[0], category: x[1], colour: x[2], desc: x[3], hex: x[4], cost: 800, wears: 5, occasions: ['office','festive','casual'], wearer: 'me', added_at: now }));
        tx.oncomplete = () => res(); tx.onerror = () => res(); }; r.onerror = () => res(); });
  });
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(1200);
}
const isExternal = (s) => /railway|render|chitti-shares|net::ERR|favicon|ERR_INTERNET|Failed to load resource/i.test(s);

// ── A3/A6: cross-engine × viewport (Chromium=Blink, Firefox=Gecko, WebKit=Safari engine) ──
for (const [name, engine] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const b = await engine.launch();
  for (const vp of [{ w: 375, h: 812 }, { w: 768, h: 1024 }, { w: 1440, h: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h } });
    const errs = []; const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' && !isExternal(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      tabs: document.querySelectorAll('.fa-tabbar button').length,
      cards: document.querySelectorAll('[data-chitti-response]').length,
      fbBars: document.querySelectorAll('.chitti-fb-box-bar').length,
      hero: !!document.getElementById('fa-dressme')
    }));
    out.crossEngine.push({ engine: name, vw: vp.w, overflow: r.overflow, tabs: r.tabs, cards: r.cards, fbBars: r.fbBars, hero: r.hero, jsErrors: errs.length, errs: errs.slice(0, 2) });
    await ctx.close();
  }
  await b.close();
}

// ── A2 edge cases (Chromium) ──
{
  const b = await chromium.launch();
  // JS disabled fallback
  {
    const ctx = await b.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
    const noscript = await p.evaluate(() => ({ hasNoscript: !!document.querySelector('noscript'), bodyText: (document.body.innerText || '').trim().length }));
    out.edge.jsDisabled = { rendersSomething: noscript.bodyText > 0, hasNoscript: noscript.hasNoscript };
    await ctx.close();
  }
  // localStorage disabled (throw on access) — page must not crash
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.addInitScript(() => { try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); } catch (e) {} });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(800);
    const alive = await p.evaluate(() => document.querySelectorAll('.fa-tabbar button').length);
    out.edge.localStorageDisabled = { pageAlive: alive > 0, fatalErrors: errs.filter(e => !/blocked/.test(e)).length };
    await ctx.close();
  }
  // corrupted image into faReadPhoto — must not throw
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(600);
    const handled = await p.evaluate(() => {
      try { const f = new File([new Uint8Array([1, 2, 3, 4, 5])], 'bad.jpg', { type: 'image/jpeg' }); if (typeof faReadPhoto === 'function') { faReadPhoto(f); return true; } return false; } catch (e) { return 'threw:' + e.message; }
    });
    await p.waitForTimeout(400);
    out.edge.corruptImage = { handledGracefully: handled === true, fatalErrors: errs.length };
    await ctx.close();
  }
  // rapid language switching (10 in <1s) — no crash, ends consistent
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(800);
    const res = await p.evaluate(async (langs) => {
      const seq = []; for (let i = 0; i < 10; i++) seq.push(langs[i % langs.length]);
      for (const L of seq) { try { document.getElementById('lang-select').value = L; if (typeof faChangeLang === 'function') faChangeLang(L); } catch (e) { return 'threw:' + e.message; } }
      return true;
    }, LANGS);
    await p.waitForTimeout(1200);
    const raw = await p.evaluate(() => { let n = 0; document.querySelectorAll('[data-vai-i18n]').forEach(e => { if ((e.textContent || '').trim() === e.getAttribute('data-vai-i18n')) n++; }); return n; });
    out.edge.rapidLangSwitch = { survived: res === true, fatalErrors: errs.length, rawKeysAfter: raw };
    await ctx.close();
  }
  await b.close();
}

// ── A5/C3: language flicker test — switch each lang, re-check after settle for raw keys + blanks ──
{
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {}); await seed(p);
  for (const L of LANGS) {
    await p.evaluate((x) => { document.getElementById('lang-select').value = x; if (typeof faChangeLang === 'function') faChangeLang(x); }, L);
    await p.waitForTimeout(150);
    const t1 = await p.evaluate(() => { let raw = 0, blank = 0; document.querySelectorAll('[data-vai-i18n]').forEach(e => { if ((e.textContent || '').trim() === e.getAttribute('data-vai-i18n')) raw++; }); const s = document.getElementById('lang-select'); [...s.options].forEach(o => { if (!(o.textContent || '').trim()) blank++; }); return { raw, blank }; });
    await p.waitForTimeout(1400); // let any guard/observer settle — flicker would change values
    const t2 = await p.evaluate(() => { let raw = 0, blank = 0; document.querySelectorAll('[data-vai-i18n]').forEach(e => { if ((e.textContent || '').trim() === e.getAttribute('data-vai-i18n')) raw++; }); const s = document.getElementById('lang-select'); [...s.options].forEach(o => { if (!(o.textContent || '').trim()) blank++; }); return { raw, blank }; });
    out.flicker.push({ lang: L, rawAt150ms: t1.raw, rawAt1550ms: t2.raw, blankLabels: t2.blank, stable: t1.raw === t2.raw && t2.raw === 0 && t2.blank === 0 });
  }
  await ctx.close(); await b.close();
}

// ── A7: performance — DOMContentLoaded/load timing (normal + 3G throttle via CDP), JS heap ──
{
  const b = await chromium.launch();
  // normal
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load' });
    const t = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0] || {}; return { dcl: Math.round(n.domContentLoadedEventEnd || 0), load: Math.round(n.loadEventEnd || 0), heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null }; });
    out.perf.normal = t;
    await ctx.close();
  }
  // 3G throttle (CDP)
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8, latency: 400 });
    const start = Date.now();
    await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
    out.perf.threeG = { wallMs: Date.now() - start };
    await ctx.close();
  }
  // offline (after first load — is the page usable offline? deterministic engine should work)
  {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {}); await seed(p);
    await ctx.setOffline(true);
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    const works = await p.evaluate(async () => { try { if (typeof faDressMe === 'function') { await faDressMe(); const h = document.getElementById('fa-dressme-result'); return !!h && h.textContent.trim().length > 0; } return false; } catch (e) { return 'threw:' + e.message; } });
    out.perf.offlineDeterministic = { dressMeWorksOffline: works === true, fatalErrors: errs.length };
    await ctx.close();
  }
  await b.close();
}

// ── A1: 20 user journeys (real clicks, deterministic so LLM-independent) ──
{
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 375, height: 812 } }); const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {}); await seed(p);
  const J = async (id, fn) => { const t0 = Date.now(); let pass = false, note = ''; try { pass = await fn(); } catch (e) { note = String(e).slice(0, 80); } out.journeys.push({ id, pass: !!pass, ms: Date.now() - t0, note }); };
  const mut = (sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && ((e.textContent || '').trim().length > 0 || e.children.length > 0); }, sel);
  const tab = (t) => p.evaluate(x => document.querySelector('.fa-tabbar button[data-tab="' + x + '"]').click(), t);
  await J('J01 Dress-Me from wardrobe', async () => { await p.evaluate(() => faDressMe()); await p.waitForTimeout(700); return mut('#fa-dressme-result'); });
  await J('J02 Outfit Review 9-agent', async () => { await tab('review'); await p.evaluate(() => { document.getElementById('fa-review-text').value = 'navy blazer, beige chinos, brown loafers'; faReview(); }); await p.waitForTimeout(700); return p.evaluate(() => document.querySelectorAll('#fa-review-result .fa-swarm .rows .row').length >= 9); });
  await J('J03 Describe-my-outfit (blind)', async () => { await p.evaluate(() => faDescribeMine()); await p.waitForTimeout(600); return p.evaluate(() => !!document.getElementById('fa-review-result').dataset.spoken); });
  await J('J04 Occasion styling', async () => { await tab('occasion'); await p.evaluate(() => { const c = document.querySelector('#fa-occasion-chips .fa-chip'); if (c) c.click(); faOccasion(); }); await p.waitForTimeout(700); return mut('#fa-occasion-result'); });
  await J('J05 Weather readiness', async () => { await p.evaluate(() => faWeather()); await p.waitForTimeout(500); return mut('#fa-occasion-result'); });
  await J('J06 Wedding Planner (family)', async () => { await p.evaluate(() => faWedding()); await p.waitForTimeout(700); return mut('#fa-wed-result'); });
  await J('J07 Budget tiers', async () => { await tab('budget'); await p.evaluate(() => { document.getElementById('fa-budget-text').value = 'formal shirt'; faBudget(); }); await p.waitForTimeout(600); return mut('#fa-budget-result'); });
  await J('J08 Learn / teach why', async () => { await tab('learn'); await p.evaluate(() => { document.getElementById('fa-learn-text').value = 'what matches blue?'; faLearn(); }); await p.waitForTimeout(500); return mut('#fa-learn-result'); });
  await J('J09 Outfit Simulator', async () => { await tab('family'); await p.evaluate(() => faSimulate()); await p.waitForTimeout(700); return mut('#fa-week-result'); });
  await J('J10 Wardrobe ROI', async () => { await p.evaluate(() => faROI()); await p.waitForTimeout(700); return mut('#fa-roi-result'); });
  await J('J11 Senior & Kids mode', async () => { await p.evaluate(() => { const c = document.querySelector('#fa-mode-chips .fa-chip'); if (c) c.click(); }); await p.waitForTimeout(500); return p.evaluate(() => document.querySelectorAll('#fa-mode-result li').length >= 3); });
  await J('J12 Everyday Family coordination', async () => { await p.evaluate(() => { const c = document.querySelector('#fa-fam-occ .fa-chip'); if (c) c.click(); faFamilyCoordinate(); }); await p.waitForTimeout(700); return mut('#fa-fam-result'); });
  await J('J13 My Size cross-brand', async () => { await p.evaluate(() => { document.getElementById('fa-size-chest').value = '95'; faSizeGuide(); }); await p.waitForTimeout(400); return p.evaluate(() => /40/.test(document.getElementById('fa-size-result').textContent)); });
  await J('J14 Clothing Doctor repair plan', async () => { await tab('more'); await p.evaluate(() => { const c = document.querySelector('#fa-doc-damage .fa-chip'); if (c) c.click(); faDiagnose(); }); await p.waitForTimeout(500); return p.evaluate(() => document.querySelectorAll('#fa-doc-result li').length >= 1); });
  await J('J15 Office Week Planner', async () => { await p.evaluate(() => faOfficeWeek()); await p.waitForTimeout(700); return mut('#fa-office-result'); });
  await J('J16 My Impact observability', async () => { await p.evaluate(() => faImpact()); await p.waitForTimeout(400); return mut('#fa-impact-result'); });
  await J('J17 Wardrobe Audit', async () => { await p.evaluate(() => faAudit()); await p.waitForTimeout(500); return mut('#fa-audit-result'); });
  await J('J18 Travel Packing', async () => { await p.evaluate(() => faPacking()); await p.waitForTimeout(500); return mut('#fa-pack-result'); });
  await J('J19 Emergency outfit', async () => { await p.evaluate(() => faEmergency()); await p.waitForTimeout(500); return mut('#fa-emrg-result'); });
  await J('J20 Add item -> wardrobe grows', async () => { await tab('almari'); const before = await p.evaluate(() => +document.getElementById('fa-n-top').textContent); await p.evaluate(() => { faOpenAdd(); document.getElementById('fa-add-cat').value = 'top'; document.getElementById('fa-add-colour').value = 'green'; const ch = document.querySelector('#fa-add-occasions .fa-chip'); if (ch) ch.click(); faSaveItem(); }); await p.waitForTimeout(600); const after = await p.evaluate(() => +document.getElementById('fa-n-top').textContent); return after === before + 1; });
  await ctx.close(); await b.close();
}

import { writeFileSync } from 'node:fs';
writeFileSync(resolve(ROOT, 'tools', '_handover_audit.json'), JSON.stringify(out, null, 1));
console.log('HANDOVER_AUDIT_DONE journeys=' + out.journeys.filter(j => j.pass).length + '/' + out.journeys.length);
