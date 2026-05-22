#!/usr/bin/env node
/**
 * tools/cert_sire_5_shots.mjs
 * ────────────────────────────
 * Sire 2026-05-23: produce these exact 5 screenshots before contacting him —
 *   1. Settings screen — battery visible at top
 *   2. Settings — 4 Wheeler card expanded
 *   3. Settings — News AI card expanded
 *   4. Hindi selected — 100% Hindi in settings
 *   5. Telugu selected — 100% Telugu in settings
 *
 * Plus per-gap behavioural assertions. Exits non-zero on any failure.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = process.env.VAANI_URL || 'http://127.0.0.1:8765/chitti_vaani.html';

const results = [];
function check(label, ok, detail){ results.push({label, ok, detail}); console.log(`${ok?'✅':'❌'} ${label}${detail?' — '+detail:''}`); }

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrs = [];
page.on('pageerror', e => consoleErrs.push(String(e)));

await page.goto(URL.replace('chitti_vaani.html', ''), { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e){} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  try { localStorage.setItem('chitti_vaani_consent_given', '1'); } catch(e){}
  try { localStorage.setItem('chitti_vaani_onb_done', '1'); } catch(e){}
  try { localStorage.setItem('chitti_vaani_lang', 'hi'); } catch(e){}
  const o = document.getElementById('consent-overlay'); if (o) o.style.display = 'none';
  const onb = document.getElementById('vai-onb'); if (onb) onb.classList.add('hidden');
  if (typeof changeLanguage === 'function') changeLanguage('hi');
  if (typeof vaiApplyI18n === 'function') vaiApplyI18n();
});
await page.waitForTimeout(400);

// GAP 1 — Tabs first thing: bottom nav visible immediately
const navOk = await page.evaluate(() => {
  const nav = document.querySelector('.vai-bnav');
  if (!nav) return false;
  const r = nav.getBoundingClientRect();
  return r.bottom <= 812 && r.height >= 60;
});
check('GAP 1 — bottom 5-tab nav visible after consent', navOk);

// Tab count = 5 (NOT 6 — Settings is opened via header gear)
const tabCount = await page.locator('.vai-bnav button').count();
check('Tab count is 5 (Talk/Act/Vault/Family/SOS)', tabCount === 5, `got ${tabCount}`);

// Tab labels are Sire's exact Hindi
const tabLabels = await page.locator('.vai-bnav button span:nth-child(2)').allTextContents();
const expected = ['बोलें','करें','दस्तावेज़','अपने','SOS'];
const labelsOk = expected.every((e, i) => (tabLabels[i] || '').trim() === e);
check(`Hindi labels match बोलें/करें/दस्तावेज़/अपने/SOS`, labelsOk, `got=${tabLabels.join('|')}`);

// GAP 2: open settings via gear → Battery + Share + Privacy + Products + General all present
await page.evaluate(() => vaiSwitchTab('settings'));
await page.waitForTimeout(400);
const settingsOk = await page.evaluate(() => ({
  battery: !!document.getElementById('vai-battery-fill'),
  share: !!document.getElementById('vai-settings-qr'),
  privacy: !!document.querySelector('.vai-dpdp-row'),
  products: document.querySelectorAll('#vai-settings-products .vai-product').length,
  general: !!document.getElementById('vai-font-size'),
  caregiver: !!document.querySelector('button.vai-general-btn'),
  version: !!document.getElementById('vai-version'),
}));
check(`GAP 2 — Battery widget present`, settingsOk.battery);
check(`GAP 2 — Share section (QR present)`, settingsOk.share);
check(`GAP 2 — Privacy DPDP row present`, settingsOk.privacy);
check(`GAP 2 — All Products (15 expandable cards)`, settingsOk.products === 15, `got ${settingsOk.products}`);
check(`GAP 2 — General (font + voice + lang + caregiver + version)`, settingsOk.general && settingsOk.caregiver && settingsOk.version);

// Screenshot 1: Settings — battery visible at top
await page.screenshot({ path: resolve(__dirname, 'sire_1_settings_battery.png'), fullPage: false });

// GAP 3 — 4 Wheeler card with specific commands + link
const fourWh = await page.evaluate(() => {
  const idx = Array.from(document.querySelectorAll('.vai-product')).findIndex(c => c.dataset.slug === 'chitti_4wheeler');
  if (idx < 0) return null;
  vaiToggleProduct(idx);
  const card = document.querySelectorAll('.vai-product')[idx];
  const cmds = Array.from(card.querySelectorAll('.vai-product-cmd')).map(b => b.textContent);
  const linkAnchor = card.querySelector('a.open-link');
  const isBeta = !!card.querySelector('.pbadge.beta');
  return { idx, cmds, link: linkAnchor?.getAttribute('href'), isBeta };
});
check(`GAP 3 — 4 Wheeler has "Meri gaadi ka insurance kab hai"`, fourWh && fourWh.cmds.some(c => /insurance/i.test(c)));
check(`GAP 3 — 4 Wheeler has "Nearest service center"`, fourWh && fourWh.cmds.some(c => /service center/i.test(c)));
check(`GAP 3 — 4 Wheeler Beta badge`, fourWh && fourWh.isBeta);
check(`GAP 3 — 4 Wheeler link → chitti_4wheeler.html`, fourWh && fourWh.link === 'chitti_4wheeler.html');
// Scroll into view for screenshot
await page.evaluate(() => {
  const idx = Array.from(document.querySelectorAll('.vai-product')).findIndex(c => c.dataset.slug === 'chitti_4wheeler');
  document.querySelectorAll('.vai-product')[idx].scrollIntoView({ block:'center' });
});
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(__dirname, 'sire_2_settings_4wheeler_open.png'), fullPage: false });

// GAP 4 — 2 Wheeler
const twoWh = await page.evaluate(() => {
  const idx = Array.from(document.querySelectorAll('.vai-product')).findIndex(c => c.dataset.slug === 'chitti_2wheeler');
  if (idx < 0) return null;
  vaiToggleProduct(idx);
  const card = document.querySelectorAll('.vai-product')[idx];
  const cmds = Array.from(card.querySelectorAll('.vai-product-cmd')).map(b => b.textContent);
  const linkAnchor = card.querySelector('a.open-link');
  return { cmds, link: linkAnchor?.getAttribute('href') };
});
check(`GAP 4 — 2 Wheeler has "Meri bike ka insurance kab hai"`, twoWh && twoWh.cmds.some(c => /bike.*insurance/i.test(c)));
check(`GAP 4 — 2 Wheeler has "Nearest puncture shop"`, twoWh && twoWh.cmds.some(c => /puncture shop/i.test(c)));
check(`GAP 4 — 2 Wheeler link → chitti_2wheeler.html`, twoWh && twoWh.link === 'chitti_2wheeler.html');

// GAP 5 — News AI
const newsAi = await page.evaluate(() => {
  const idx = Array.from(document.querySelectorAll('.vai-product')).findIndex(c => c.dataset.slug === 'chitti_news_ai');
  if (idx < 0) return null;
  vaiToggleProduct(idx);
  const card = document.querySelectorAll('.vai-product')[idx];
  const cmds = Array.from(card.querySelectorAll('.vai-product-cmd')).map(b => b.textContent);
  const isLive = !!card.querySelector('.pbadge.live');
  const link = card.querySelector('a.open-link')?.getAttribute('href');
  card.scrollIntoView({ block:'center' });
  return { cmds, isLive, link };
});
check(`GAP 5 — News AI has "Khabar ko plain Hindi mein samjhao"`, newsAi && newsAi.cmds.some(c => /plain Hindi/i.test(c)));
check(`GAP 5 — News AI has "Yeh news mujhe kaise affect karti hai"`, newsAi && newsAi.cmds.some(c => /kaise affect/i.test(c)));
check(`GAP 5 — News AI Live ✓ badge`, newsAi && newsAi.isLive);
check(`GAP 5 — News AI link → chitti_news.html`, newsAi && newsAi.link === 'chitti_news.html');
await page.waitForTimeout(300);
await page.screenshot({ path: resolve(__dirname, 'sire_3_settings_newsai_open.png'), fullPage: false });

// GAP 6 — Hindi 100% — close all product expansions so we test the
// chrome strings + collapsed cards (what a fresh Settings visit shows).
await page.evaluate(() => {
  document.querySelectorAll('.vai-product.open, .vai-product.fb-open').forEach(c => c.classList.remove('open','fb-open'));
  if (typeof changeLanguage === 'function') changeLanguage('hi');
  try { localStorage.setItem('chitti_vaani_lang', 'hi'); } catch(e){}
  if (typeof updateAllStrings === 'function') updateAllStrings('hi');
  if (typeof vaiApplyI18n === 'function') vaiApplyI18n();
  // Battery re-render picks up Hindi
  if (typeof vaiBatteryRender === 'function') vaiBatteryRender();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
// In Settings the only English we tolerate is "Chitti", "Live", "Beta", "DPDP", "WhatsApp", brand names, ₹.
async function detectEnglishLeaks() {
  return await page.evaluate(() => {
    // Brand-name allow-list. Includes:
    //   • The Chitti family product names (Vaani, MedUPI, UPI Guard, News,
    //     News AI, Scanner, 4 Wheeler, 2 Wheeler, CA, Legal, Government,
    //     Shares, Logo Video, Voice Factory, Grandparent Mode, Document Vault)
    //   • Indian regulatory acronyms users will see in product descriptions
    //   • Emoji glyphs used as icons
    const BRANDS = /Chitti|WhatsApp|DPDP|Act 2023|Live|Beta|Phase ?3|MedUPI|Vaani|FASTag|UPI|RBI|NPCI|GST|TDS|ITR|FSSAI|PUC|PIB|SEBI|API|SMS|SOS|QR|Guard|News AI|NewsAI|News|Scanner|Wheeler|Legal|Government|Shares|Logo|Video|Voice|Factory|Grandparent|Mode|Document|Vault|✓|⭐|→|←|👍|👎|🔊|▶|💬|📋|📱|🛡️|🪔|🔋|📤|🔧|⚙️|👴|🔒|🎤|🎙️|💊|📰|🤖|📷|🚗|🏍️|📊|⚖️|🏛️|📈|👨‍👩‍👧|✅|⚪/g;
    const visible = [];
    document.querySelectorAll('#vai-panel-settings *').forEach(el => {
      if (el.children.length) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      let p = el.parentElement; let hidden = false;
      while (p) { const ps = getComputedStyle(p); if (ps.display === 'none' || ps.visibility === 'hidden') { hidden = true; break; } p = p.parentElement; }
      if (hidden) return;
      const t = (el.textContent || '').trim();
      if (t.length < 2) return;
      const stripped = t.replace(BRANDS, '').trim();
      if (!stripped) return;
      const noNums = stripped.replace(/[\d%₹+\s.,·()'"\-‐—]/g, '').trim();
      if (!noNums) return;
      const englishWords = noNums.match(/[A-Za-z]{3,}/g) || [];
      if (englishWords.length) visible.push({ t: t.slice(0, 60), en: englishWords.join(',') });
    });
    return visible;
  });
}
const hindiLeak = await detectEnglishLeaks();
const hiOk = hindiLeak.length === 0;
check(`GAP 6 — Hindi: 100% (zero English residue in Settings)`, hiOk, hiOk ? '' : `leaks=${hindiLeak.slice(0,5).map(x=>x.en).join(' | ')}`);
await page.screenshot({ path: resolve(__dirname, 'sire_4_settings_hindi.png'), fullPage: false });

// GAP 6 — Telugu 100% — same collapsed-cards baseline as Hindi.
await page.evaluate(() => {
  document.querySelectorAll('.vai-product.open, .vai-product.fb-open').forEach(c => c.classList.remove('open','fb-open'));
  if (typeof changeLanguage === 'function') changeLanguage('te');
  try { localStorage.setItem('chitti_vaani_lang', 'te'); } catch(e){}
  if (typeof updateAllStrings === 'function') updateAllStrings('te');
  if (typeof vaiApplyI18n === 'function') vaiApplyI18n();
  if (typeof vaiBatteryRender === 'function') vaiBatteryRender();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
const teluguLeak = await detectEnglishLeaks();
const teOk = teluguLeak.length === 0;
check(`GAP 6 — Telugu: 100% (zero English residue in Settings)`, teOk, teOk ? '' : `leaks=${teluguLeak.slice(0,5).map(x=>x.en).join(' | ')}`);
await page.screenshot({ path: resolve(__dirname, 'sire_5_settings_telugu.png'), fullPage: false });

// GAP 7 — Design consistency: tricolour stripe, navy header text, saffron badge, green arrow
const designOk = await page.evaluate(() => {
  const stripe = document.querySelector('#vai-panel-settings .vai-settings-stripe');
  const stripeBg = stripe ? getComputedStyle(stripe).backgroundImage : '';
  const h = document.querySelector('.vai-settings-h');
  const headerColor = h ? getComputedStyle(h).color : '';
  const liveBadge = document.querySelector('.vai-product-head .pbadge.live');
  const liveColor = liveBadge ? getComputedStyle(liveBadge).backgroundColor : '';
  const arrow = document.querySelector('.vai-product-head .parrow');
  const arrowColor = arrow ? getComputedStyle(arrow).color : '';
  return { stripeBg, headerColor, liveColor, arrowColor };
});
check(`GAP 7 — tricolour stripe at top of Settings`, /linear-gradient/.test(designOk.stripeBg));
check(`GAP 7 — navy #002366 in Settings header text`, /rgb\(0,\s*35,\s*102\)/.test(designOk.headerColor), designOk.headerColor);
check(`GAP 7 — saffron #FF6913 Live badge`, /rgb\(255,\s*105,\s*19\)/.test(designOk.liveColor), designOk.liveColor);
check(`GAP 7 — green #046A38 expand arrow`, /rgb\(4,\s*106,\s*56\)/.test(designOk.arrowColor), designOk.arrowColor);

await b.close();
const ok = results.filter(r => r.ok).length;
console.log(`\nResult: ${ok}/${results.length} checks pass`);
if (consoleErrs.length) console.log('Console errors:', consoleErrs.length);
process.exit(ok === results.length ? 0 : 1);
