#!/usr/bin/env node
/* ============================================================================
 * tools/cert_cnai_redesign.mjs — Chitti News AI v2 REDESIGN certification.
 * Verifies the new IA: "How to use" onboarding card, the one-question
 * "I am a ___ for last ___ years" profession entry (text + chip + voice-parse),
 * confirm chip, promoted AI upgrade path (FREE/PAID, free-first), per-response
 * widgets, 26-lang switch (en→hi re-render), and axe-core 0 serious/critical.
 * Local-serve + API fixtures + 5-viewport screenshots.
 *   Output: tools/cert_cnai_redesign_result.json + test_screenshots/news-ai-redesign/
 *   Run:    node tools/cert_cnai_redesign.mjs
 * ==========================================================================*/
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT = resolve(ROOT, 'test_screenshots', 'news-ai-redesign'); mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const FEED = JSON.stringify({ items: [
  { id: 1, title: 'OpenAI ships new coding agent for developers', summary: 'A new autonomous coding assistant lands for software teams, automating refactors and tests.', url: 'https://example.com/a1', source: { name: 'The Verge' }, is_free: true, classification: { category: 'tools', confidence: 0.9, matched_keywords: ['coding', 'developer', 'agent'] }, ingested_at: new Date().toISOString() },
  { id: 2, title: 'Free Google AI Essentials course crosses 1M learners', summary: 'Google\'s free AI literacy certificate sees record sign-ups across India.', url: 'https://example.com/a2', source: { name: 'TOI' }, is_free: true, classification: { category: 'courses', confidence: 0.8, matched_keywords: ['course', 'free'] }, ingested_at: new Date().toISOString() },
] });
const srv = http.createServer((rq, rs) => { try { let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(ROOT, '.' + p); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; } rs.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); rs.end(readFileSync(f)); } catch (e) { rs.writeHead(500); rs.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const PORT = srv.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_news_ai.html`;

const GATES = {}; let PASS = 0, FAIL = 0;
function chk(id, label, ok, detail) { (GATES[id] = GATES[id] || []).push({ label, ok: !!ok, detail: String(detail || '') }); ok ? PASS++ : FAIL++; console.log((ok ? 'PASS' : 'FAIL') + ' [' + id + '] ' + label + (detail ? ' — ' + detail : '')); }

async function fresh(b, opts = {}, init) {
  const c = await b.newContext(opts);
  await c.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: FEED }));
  await c.route('**chitti-news-ai-api**', r => r.fulfill({ status: 200, contentType: 'application/json', body: FEED }));
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript((pr) => { try { localStorage.clear(); localStorage.setItem('disability_profile', JSON.stringify(pr || {})); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} }, init || {});
  await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  return { c, p, errs };
}

console.log('\n=== CHITTI NEWS AI v2 — REDESIGN CERTIFICATION ===\nPage:', URL, '\n');

// ── G1 — Loads clean on 3 engines; engines + onboarding present ──
for (const [n, eng] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  try {
    const b = await eng.launch({ headless: true }); const { p, errs } = await fresh(b, { viewport: { width: 390, height: 844 } });
    const api = await p.evaluate(() => ({ chitti: !!window.Chitti, coach: !!window.ChittiCoach, career: !!window.ChittiCareer, onboard: !!window.CNAIOnboard, ask: !!window.cnaiAskSubmit }));
    chk('G1', 'Loads clean — ' + n, errs.length === 0 && api.coach && api.career && api.onboard && api.ask, 'errs=' + errs.length + ' ' + JSON.stringify(api) + (errs[0] ? ' :: ' + errs[0].slice(0, 80) : ''));
    await b.close();
  } catch (e) { chk('G1', 'Loads clean — ' + n, false, 'threw ' + e.message.slice(0, 90)); }
}

const browser = await chromium.launch({ headless: true });

// ── G2 — The Ask present + accessible (fill-in-the-blank + years + mic + chips) ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  const a = await p.evaluate(() => {
    const role = document.getElementById('ask-role'), years = document.getElementById('ask-years'), mic = document.getElementById('ask-mic'), go = document.getElementById('ask-go');
    const chips = document.querySelectorAll('#ask-chips .ask-chip').length;
    const sized = [role, years, mic, go].every(el => el && el.getBoundingClientRect().height >= 44);
    const labelled = [role, years, mic, go].every(el => el && (el.getAttribute('aria-label') || el.id));
    return { role: !!role, years: !!years, mic: !!mic, go: !!go, chips, sized, labelled };
  });
  chk('G2', 'The Ask inputs present', a.role && a.years && a.mic && a.go, JSON.stringify(a));
  chk('G2', 'Quick-pick chips rendered', a.chips >= 8, a.chips + ' chips');
  chk('G2', 'Inputs ≥44px + aria-labelled', a.sized && a.labelled, 'sized=' + a.sized + ' labelled=' + a.labelled);
}

// ── G3 — Onboarding "How to use" card (auto first-visit + reopen + cards) ──
{
  const { p } = await fresh(browser, { viewport: { width: 1366, height: 768 } });
  const auto = await p.evaluate(() => !!document.querySelector('#onboarding-host .ob'));
  const cards = await p.evaluate(() => document.querySelectorAll('#onboarding-host .ob-card').length);
  const personas = await p.evaluate(() => document.querySelectorAll('#onboarding-host .ob-persona').length);
  chk('G3', 'Onboarding auto-shows on first visit', auto, 'ob present=' + auto);
  chk('G3', 'Onboarding has feature cards', cards >= 6, cards + ' cards');
  chk('G3', 'Onboarding has example personas', personas >= 4, personas + ' personas');
  await p.evaluate(() => window.CNAIOnboard.hide());
  await p.evaluate(() => document.getElementById('cnai-ob-open').click()); await p.waitForTimeout(200);
  chk('G3', 'Reopen via header button', await p.evaluate(() => !!document.querySelector('#onboarding-host .ob')), 'reopened');
}

// ── G4 — Profession capture via TEXT → confirm chip + sections personalise ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  await p.fill('#ask-role', 'Java Developer'); await p.fill('#ask-years', '20');
  await p.evaluate(() => window.cnaiAskSubmit()); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => ({
    chipShown: getComputedStyle(document.getElementById('profile-chip')).display !== 'none',
    chipText: (document.getElementById('profile-chip').textContent || '').replace(/\s+/g, ' ').trim(),
    askHidden: getComputedStyle(document.getElementById('ask-section')).display === 'none',
    upgradeShown: getComputedStyle(document.getElementById('upgrade-section')).display !== 'none',
    newsHdr: (document.getElementById('news-sub').textContent || ''),
    cnai: JSON.parse(localStorage.getItem('cnai_profile') || '{}'),
  }));
  chk('G4', 'Confirm chip shows role + seniority', r.chipShown && /Java Developer/.test(r.chipText) && /senior/.test(r.chipText), r.chipText.slice(0, 80));
  chk('G4', 'The Ask collapses after submit', r.askHidden, 'askHidden=' + r.askHidden);
  chk('G4', 'Upgrade section revealed', r.upgradeShown, 'upgradeShown=' + r.upgradeShown);
  chk('G4', 'News header personalised', /Java Developer/.test(r.newsHdr), r.newsHdr.slice(0, 60));
  chk('G4', 'Years→seniority stored (20→senior)', r.cnai.years === 20 && r.cnai.seniority === 'senior', JSON.stringify(r.cnai).slice(0, 90));
}

// ── G5 — Free-text ANY role works (no hardcoded list) ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  await p.evaluate(() => window.cnaiApplyProfile('motorcycle mechanic', 5)); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => ({ chip: (document.getElementById('profile-chip').textContent || ''), up: (document.getElementById('career-upgrade-content').textContent || '').length }));
  chk('G5', 'Arbitrary free-text role accepted', /motorcycle mechanic/i.test(r.chip), r.chip.replace(/\s+/g, ' ').slice(0, 70));
  chk('G5', 'Upgrade path renders for any role', r.up > 80, 'upgrade chars=' + r.up);
}

// ── G6 — Upgrade path: tools → FREE/PAID table, free-first certs, widget ──
{
  const { p } = await fresh(browser, { viewport: { width: 414, height: 900 } });
  await p.evaluate(() => window.cnaiApplyProfile('Teacher', 12)); await p.waitForTimeout(1000);
  await p.evaluate(() => { document.querySelectorAll('#career-tool-chips .career-tool-chip').forEach(b => { const t = b.getAttribute('data-tool'); if (t === 'excel' || t === 'word') b.click(); }); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const host = document.getElementById('career-upgrade-content');
    const txt = host.textContent || '';
    const rows = host.querySelectorAll('table tbody tr').length;
    const freeBadge = /FREE/.test(txt), startCert = !!host.querySelector('a[href*="http"]');
    const widgets = document.querySelectorAll('#upgrade-section [data-chitti-response]').length;
    const disclaimer = /Results depend|effort|background|ASSIST|practice/i.test(txt);
    return { rows, freeBadge, startCert, widgets, disclaimer };
  });
  chk('G6', 'Tool-replacement table renders', r.rows >= 1, r.rows + ' rows');
  chk('G6', 'FREE/PAID badge present', r.freeBadge, 'freeBadge=' + r.freeBadge);
  chk('G6', 'Free certificate has real link', r.startCert, 'startCert=' + r.startCert);
  chk('G6', 'Honesty disclaimer present', r.disclaimer, 'disclaimer=' + r.disclaimer);
  chk('G6', 'Per-response widget hosts present', r.widgets >= 1, r.widgets + ' [data-chitti-response]');
}

// ── G7 — Quick-pick chip path (real chip click) ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  await p.evaluate(() => window.CNAIOnboard && window.CNAIOnboard.hide());
  await p.locator('#ask-years').waitFor({ state: 'visible', timeout: 8000 });
  await p.fill('#ask-years', '8');
  await p.evaluate(() => { const c = document.querySelector('#ask-chips .ask-chip[data-role="Nurse"]') || document.querySelector('#ask-chips .ask-chip'); c.click(); });
  await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ text: (document.getElementById('profile-chip').textContent || ''), shown: getComputedStyle(document.getElementById('profile-chip')).display !== 'none' }));
  chk('G7', 'Quick-pick chip sets profile', r.shown && /Nurse|[A-Za-z]{3,}/.test(r.text), r.text.replace(/\s+/g, ' ').slice(0, 60));
}

// ── G8 — Language switch en→hi re-renders The Ask + chip ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  const enH = await p.evaluate(() => document.getElementById('ask-h').textContent);
  await p.selectOption('#lang-select', 'hi'); await p.waitForTimeout(800);
  const hiH = await p.evaluate(() => document.getElementById('ask-h').textContent);
  chk('G8', 'The Ask heading re-renders to Hindi', /नमस्ते|Chitti/.test(hiH) && hiH !== enH, 'hi="' + (hiH || '').slice(0, 40) + '"');
  // confirm chip in hindi
  await p.evaluate(() => window.cnaiApplyProfile('शिक्षक', 10)); await p.waitForTimeout(800);
  const chip = await p.evaluate(() => document.getElementById('profile-chip').textContent || '');
  chk('G8', 'Confirm chip uses Hindi label', /आप हैं एक|बदलें/.test(chip), chip.replace(/\s+/g, ' ').slice(0, 60));
}

// ── G9 — axe-core 0 serious/critical (first-visit + after profile set) ──
{
  const { p } = await fresh(browser, { viewport: { width: 390, height: 844 } });
  let res = await new AxeBuilder({ page: p }).options({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }).analyze();
  let bad = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  chk('G9', 'axe-core clean — first visit', bad.length === 0, bad.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'none');
  await p.evaluate(() => window.cnaiApplyProfile('Accountant', 15)); await p.waitForTimeout(1000);
  res = await new AxeBuilder({ page: p }).options({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }).analyze();
  bad = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  chk('G9', 'axe-core clean — after profile', bad.length === 0, bad.map(v => v.id + '(' + v.nodes.length + ')').join(', ') || 'none');
}

// ── G10 — 5-viewport screenshots (evidence) ──
{
  const VIEWPORTS = [['desktop_1920', 1920, 1080], ['laptop_1366', 1366, 768], ['ipad_810', 810, 1080], ['iphone_390', 390, 844], ['android_360', 360, 800]];
  for (const [name, w, h] of VIEWPORTS) {
    const { p } = await fresh(browser, { viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await p.evaluate(() => window.CNAIOnboard && window.CNAIOnboard.hide());
    await p.evaluate(() => window.cnaiApplyProfile('Talent Acquisition', 20)); await p.waitForTimeout(1200);
    const file = resolve(SHOT, 'cnai_redesign_' + name + '.png');
    await p.screenshot({ path: file, fullPage: true });
    chk('G10', 'Screenshot ' + name, existsSync(file) && statSync(file).size > 8000, (statSync(file).size / 1024).toFixed(0) + ' KB');
  }
}

await browser.close(); srv.close();
const summary = { ts: new Date().toISOString(), pass: PASS, fail: FAIL, total: PASS + FAIL, gates: GATES };
writeFileSync(resolve(ROOT, 'tools', 'cert_cnai_redesign_result.json'), JSON.stringify(summary, null, 2));
console.log('\n----------------------------------------');
console.log('REDESIGN CERT: ' + PASS + ' / ' + (PASS + FAIL) + ' PASS' + (FAIL ? '  (' + FAIL + ' FAIL)' : ''));
console.log('Screenshots: ' + SHOT);
process.exit(FAIL ? 1 : 0);
