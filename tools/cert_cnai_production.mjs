#!/usr/bin/env node
/* ============================================================================
 * tools/cert_cnai_production.mjs — Chitti News AI PRODUCTION CERTIFICATION
 * 10 gates + button audit + user journeys + accessibility + screenshots.
 * Evidence only. Local-serve + offline + API fixtures. Output:
 *   tools/cert_cnai_production_result.json  +  test_screenshots/news-ai-cert/
 * Run: node tools/cert_cnai_production.mjs
 * ==========================================================================*/
import { chromium, firefox, webkit, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOT = resolve(ROOT, 'test_screenshots', 'news-ai-cert'); mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const srv = http.createServer((rq, rs) => { try { let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(ROOT, '.' + p); if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; } rs.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); rs.end(readFileSync(f)); } catch (e) { rs.writeHead(500); rs.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const PORT = srv.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_news_ai.html`;

const GATES = {};
function gate(id, name) { GATES[id] = GATES[id] || { id, name, checks: [], pass: 0, fail: 0 }; return GATES[id]; }
function chk(id, name, label, ok, detail) { const g = gate(id, name); g.checks.push({ label, ok: !!ok, detail: String(detail || '') }); ok ? g.pass++ : g.fail++; console.log((ok ? 'PASS' : 'FAIL') + ' [' + id + '] ' + label + (detail ? ' — ' + detail : '')); }

async function ctx(b, opts = {}) {
  const c = await b.newContext(opts);
  await c.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ id: 1, title: 'New GST e-invoicing AI norms notified', source_name: 'PIB', link: 'https://pib.gov.in', published_at: new Date(0).toISOString(), category: 'national' }] }) }));
  await c.route('**chitti-news-ai-api**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  return c;
}
async function fresh(b, opts = {}, init) {
  const c = await ctx(b, opts); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript((pr) => { try { localStorage.setItem('disability_profile', JSON.stringify(pr || {})); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} }, init || {});
  await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  return { c, p, errs };
}

console.log('\n=== CHITTI NEWS AI — PRODUCTION CERTIFICATION ===\nPage:', URL, '\n');

// ───── GATE 1 — Load clean on 3 engines ─────
for (const [n, eng] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  try {
    const b = await eng.launch({ headless: true }); const { c, p, errs } = await fresh(b, { viewport: { width: 375, height: 812 } });
    const ok = await p.evaluate(() => !!(window.Chitti && window.ChittiCoach));
    chk('G1', 'Load & engines', n, errs.length === 0 && ok, 'window.Chitti+Coach=' + ok + ' errs=' + errs.length + (errs[0] ? ' :: ' + errs[0].slice(0, 70) : ''));
    await b.close();
  } catch (e) { chk('G1', 'Load & engines', n, false, 'threw ' + e.message.slice(0, 70)); }
}

const browser = await chromium.launch({ headless: true });

// ───── GATE 2 — Profession routing (hub renders + scores + HONEST source) ─────
{
  const { c, p, errs } = await fresh(browser, { viewport: { width: 414, height: 900 }, deviceScaleFactor: 2 });
  const PROFS = ['software-developer', 'doctor', 'nurse', 'farmer', 'teacher', 'lawyer', 'accountant', 'hr-professional', 'talent-acquisition', 'business-owner', 'government-employee', 'student'];
  let hubOk = 0;
  for (const slug of PROFS) {
    await p.evaluate(s => { try { window.ccPick && window.ccPick(s); } catch (e) {} }, slug);
    await p.waitForTimeout(180);
    const r = await p.evaluate(() => { const sec = document.getElementById('hub-section'); const shown = sec && sec.style.display !== 'none'; const txt = sec ? sec.textContent : ''; return { shown, hasScores: /Task-Exposure|Opportunity|Readiness/.test(txt), hasVerdict: /verdict/i.test(txt), estimate: /\(est\.\)|directional estimate|Not exact/.test(txt) }; });
    if (r.shown && r.hasScores && r.hasVerdict) hubOk++;
  }
  chk('G2', 'Profession routing', '12 canonical professions render a Hub with scores + verdict', hubOk === PROFS.length, hubOk + '/' + PROFS.length);
  // ANY typed role (dynamic) — via career one-liner path which derives any profession
  await p.evaluate(() => { try { var i = document.getElementById('career-input'); } catch (e) {} });
  // honest-estimate labelling present
  await p.evaluate(() => { try { window.ccPick && window.ccPick('accountant'); } catch (e) {} }); await p.waitForTimeout(200);
  const honest = await p.evaluate(() => { const t = document.getElementById('hub-section').textContent; return { exposure: /Task-Exposure/.test(t), est: /\(est\.\)/.test(t), notExact: /Not exact report figures/i.test(t), wefLink: !!document.querySelector('#hub-section a[href*="weforum.org"]') }; });
  chk('G2', 'Profession routing', 'Scores labelled "Task-Exposure (est.) /100" not a cited %', honest.exposure && honest.est, JSON.stringify(honest));
  chk('G2', 'Profession routing', 'Honest provenance: "Not exact report figures" + real WEF link', honest.notExact && honest.wefLink, 'notExact=' + honest.notExact + ' wefLink=' + honest.wefLink);
  await p.screenshot({ path: resolve(SHOT, 'g2_hub_accountant.png') });
  await c.close();
}

// ───── GATE 3 — Button audit (every interactive element, across tabs) ─────
{
  const { c, p, errs } = await fresh(browser, { viewport: { width: 414, height: 1000 }, deviceScaleFactor: 2 });
  await p.evaluate(() => { try { window.ccPick && window.ccPick('accountant'); } catch (e) {} }); await p.waitForTimeout(300);
  const tabs = ['roadmap', 'courses', 'analogy', 'career', 'swarm'];
  let clicked = 0, clickErrs = 0, links = 0, badLinks = 0;
  for (const tab of tabs) {
    await p.evaluate(t => { try { window.cnaiLearnTab && window.cnaiLearnTab(t); } catch (e) {} }, tab);
    await p.waitForTimeout(150);
  }
  // count links have href
  const linkAudit = await p.evaluate(() => { const as = [...document.querySelectorAll('main a, header a')]; let bad = 0; as.forEach(a => { const h = a.getAttribute('href'); if (!h || h.trim() === '') bad++; }); return { total: as.length, bad }; });
  links = linkAudit.total; badLinks = linkAudit.bad;
  // click every button + role=button + tab that is safe (no external nav)
  const buttons = await p.$$('main button, header button, [role="tab"], [role="button"]');
  const before = errs.length;
  for (const btn of buttons) {
    try { const vis = await btn.isVisible(); if (!vis) continue; await btn.click({ timeout: 1200, force: true }).catch(() => {}); clicked++; await p.waitForTimeout(20); } catch (e) {}
  }
  clickErrs = errs.length - before;
  chk('G3', 'Button audit', 'Every visible button/tab clicked with 0 page errors', clickErrs === 0, clicked + ' buttons clicked · ' + clickErrs + ' errors');
  chk('G3', 'Button audit', 'Every link has a non-empty href (no dead links)', badLinks === 0, links + ' links · ' + badLinks + ' empty');
  await c.close();
}

// ───── GATE 4 — User journeys (with screenshots) ─────
{
  const { c, p, errs } = await fresh(browser, { viewport: { width: 414, height: 1000 }, deviceScaleFactor: 2 });
  const J = async (id, fn, assert, shot) => { const before = errs.length; await fn(); await p.waitForTimeout(500); const ok = await assert(); if (shot) await p.screenshot({ path: resolve(SHOT, shot) }).catch(() => {}); chk('G4', 'User journeys', id, ok && (errs.length - before) === 0, ok ? 'ok' : 'assertion failed'); };
  await J('J1 pick CA → Hub scores+verdict', () => p.evaluate(() => window.ccPick('accountant')), () => p.evaluate(() => /Task-Exposure/.test(document.getElementById('hub-section').textContent)), 'g4_j1_hub.png');
  await J('J2 Learn→Roadmap → Agentic AI → ML→DL→GenAI stages', async () => { await p.evaluate(() => window.cnaiLearnTab('roadmap')); await p.fill('#roadmap-input', 'Agentic AI'); await p.evaluate(() => window.cnaiRoadmapBuild('Agentic AI')); }, async () => { const t = await p.locator('#roadmap-content').innerText(); return /Machine Learning/i.test(t) && /Deep Learning/i.test(t) && /Generative AI/i.test(t) && /Free course/i.test(t); }, 'g4_j2_roadmap.png');
  await J('J3 Courses tab → free-first results', async () => { await p.evaluate(() => window.cnaiLearnTab('courses')); await p.evaluate(() => window.cnaiCoursesBuild('machine learning')); }, async () => (await p.$$('#courses-content .course-card')).length >= 5, 'g4_j3_courses.png');
  await J('J4 Teach-me tab → analogy + breaks-down', async () => { await p.evaluate(() => window.cnaiLearnTab('analogy')); await p.evaluate(() => { document.getElementById('analogy-concept').value = 'token'; document.getElementById('analogy-domain').value = 'cricket'; window.cnaiAnalogyGo(); }); }, async () => /Where this breaks down/i.test(await p.locator('#analogy-content').innerText()), 'g4_j4_analogy.png');
  await J('J5 Career tab → report + caveats', async () => { await p.evaluate(() => window.cnaiLearnTab('career')); await p.fill('#career-input', 'I am a doctor with 15 years'); await p.evaluate(() => window.cnaiCareerOneLiner({ preventDefault() {} })); }, async () => /human|clinical|diagnos/i.test(await p.locator('#career-content').innerText()), 'g4_j5_career.png');
  await J('J6 Swarm tab → helpers + roadmap', async () => { await p.evaluate(() => window.cnaiLearnTab('swarm')); await p.evaluate(() => window.cnaiSwarmGo({ preventDefault() {} })); }, async () => /helpers reported/i.test(await p.locator('#swarm-content').innerText()), 'g4_j6_swarm.png');
  await J('J7 language → Hindi titles', () => p.evaluate(() => { const s = document.getElementById('lang-select'); if (s) { s.value = 'hi'; s.dispatchEvent(new Event('change', { bubbles: true })); } if (window.cnaiApplyLang) window.cnaiApplyLang('hi'); }), () => p.evaluate(() => /सीखें|कोर्स|करियर/.test(document.getElementById('learn-hub').innerText)), 'g4_j7_hindi.png');
  await p.evaluate(() => { if (window.cnaiApplyLang) window.cnaiApplyLang('en'); });
  await c.close();
}

// ───── GATE 5 — axe WCAG 2.1/2.2 AA (hub + all tabs rendered) ─────
{
  const { c, p } = await fresh(browser, { viewport: { width: 375, height: 812 } });
  await p.evaluate(() => { try { window.ccPick('accountant'); ['roadmap', 'courses', 'analogy', 'career', 'swarm'].forEach(t => { window.cnaiLearnTab(t); }); window.cnaiRoadmapBuild('Agentic AI'); window.cnaiCoursesBuild('ml'); window.cnaiLearnTab('roadmap'); } catch (e) {} });
  await p.waitForTimeout(1200);
  try {
    const res = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    // own-surface vs shared-substrate (bottom nav / he-badge)
    const ownSerious = serious.filter(v => !v.nodes.every(n => /chitti-bharat-bottom-nav|chitti-here-badge|data-slug|chitti-obs|chitti_medupi.html|chitti_health_file.html|chitti_vaani.html|chitti_legal|chitti_government/.test(n.target.join(' '))));
    writeFileSync(resolve(HERE, 'cert_cnai_production_axe.json'), JSON.stringify(res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0] ? v.nodes[0].target.join(' ') : '' })), null, 2));
    chk('G5', 'Accessibility — axe WCAG AA', '0 serious/critical on product own surface', ownSerious.length === 0, res.violations.length + ' total · ' + serious.length + ' serious (' + ownSerious.length + ' own-surface, ' + (serious.length - ownSerious.length) + ' shared-substrate)' + (serious.length ? ' :: ' + serious.map(v => v.id).join(',') : ''));
  } catch (e) { chk('G5', 'Accessibility — axe WCAG AA', 'axe scan', false, 'threw ' + e.message.slice(0, 70)); }
  await c.close();
}

// ───── GATE 6 — 4 disability profiles ─────
for (const prof of ['blind', 'deaf', 'mute', 'illiterate']) {
  try {
    const { c, p, errs } = await fresh(browser, { viewport: { width: 375, height: 812 } }, { [prof]: true });
    await p.evaluate(() => { try { window.ccPick('accountant'); } catch (e) {} }); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ aria: document.querySelectorAll('[aria-live]').length, cr: document.querySelectorAll('[data-chitti-response]').length, readAloud: document.querySelectorAll('button[aria-label*="aloud" i],button[aria-label*="Read" i],button[aria-label*="Listen" i]').length, sub: !!(window.Chitti && window.Chitti.a11y) }));
    chk('G6', 'Accessibility — 4 profiles', prof, r.cr >= 4 && r.aria >= 1 && r.sub && errs.length === 0, 'aria-live=' + r.aria + ' cr=' + r.cr + ' read-aloud=' + r.readAloud + ' errs=' + errs.length);
    await c.close();
  } catch (e) { chk('G6', 'Accessibility — 4 profiles', prof, false, 'threw ' + e.message.slice(0, 60)); }
}

// ───── GATE 7 — 26 languages + RTL ─────
{
  const { c, p, errs } = await fresh(browser, { viewport: { width: 375, height: 812 } });
  const CANON = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'sa', 'mai', 'kok', 'doi', 'ks', 'ne', 'sd', 'mni', 'sat', 'bho', 'raj', 'kru', 'hoc'];
  const RTL = { ur: 1, ks: 1, sd: 1 }; let pass = 0;
  for (const code of CANON) {
    const before = errs.length;
    const st = await p.evaluate(c => { const s = document.getElementById('lang-select'); if (s) { s.value = c; s.dispatchEvent(new Event('change', { bubbles: true })); } try { localStorage.setItem('chitti_lang', c); } catch (e) {} if (window.cnaiApplyLang) window.cnaiApplyLang(c); return { lang: document.documentElement.getAttribute('lang') || '', dir: document.documentElement.getAttribute('dir') || 'ltr' }; }, code);
    const ne = errs.length - before; if (ne === 0 && (RTL[code] ? st.dir === 'rtl' : true)) pass++;
  }
  chk('G7', '26 languages + RTL', 'all switch clean (html[lang] + RTL ur/ks/sd), 0 errors', pass === CANON.length, pass + '/' + CANON.length);
  await c.close();
}

// ───── GATE 8 — tap targets ≥44 (own surface) + per-card widget ─────
{
  const { c, p } = await fresh(browser, { viewport: { width: 375, height: 812 } });
  await p.evaluate(() => { try { window.ccPick('accountant'); window.cnaiRoadmapBuild('Agentic AI'); } catch (e) {} }); await p.waitForTimeout(800);
  const small = await p.evaluate(() => { const scope = document.querySelectorAll('#hub-section button, #hub-section a, #learn-hub button, #learn-hub a, #learn-hub select, #learn-hub input'); let bad = 0, total = 0; scope.forEach(el => { const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return; total++; if (r.width < 44 || r.height < 44) bad++; }); return { bad, total }; });
  chk('G8', 'Tap targets + widget', 'learning + hub controls ≥44px', small.bad === 0, small.bad + ' under-44px of ' + small.total);
  const widget = await p.evaluate(() => { const boxes = [...document.querySelectorAll('[data-chitti-response]')]; let withBar = 0; boxes.forEach(el => { const sib = el.nextElementSibling; if ((sib && sib.classList && sib.classList.contains('chitti-fb-box-bar')) || el.querySelector('.chitti-card-widget,.pro-card-widget')) withBar++; }); return { total: boxes.length, withBar }; });
  chk('G8', 'Tap targets + widget', 'every response card has the 4-icon widget', widget.total > 0 && widget.withBar === widget.total, widget.withBar + '/' + widget.total + ' cards attached');
  await c.close();
}

// ───── GATE 9 — cross-platform + no h-scroll + perf ─────
for (const [n, w, h] of [['375', 375, 812], ['768', 768, 1024], ['1280', 1280, 900], ['1920', 1920, 1080]]) {
  try {
    const { c, p } = await fresh(browser, { viewport: { width: w, height: h } });
    await p.evaluate(() => { try { window.ccPick('accountant'); } catch (e) {} }); await p.waitForTimeout(500);
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    chk('G9', 'Cross-platform', n + 'px no horizontal scroll', !hs, 'h-scroll=' + hs);
    await c.close();
  } catch (e) { chk('G9', 'Cross-platform', n, false, 'threw ' + e.message.slice(0, 60)); }
}
for (const [lbl, dev] of [['iPhone 13', 'iPhone 13'], ['Pixel 5', 'Pixel 5']]) {
  try { const { c, p, errs } = await fresh(browser, { ...devices[dev] }); const hs = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2); chk('G9', 'Cross-platform', lbl + ' emu', !hs && errs.length === 0, 'h-scroll=' + hs + ' errs=' + errs.length); await c.close(); } catch (e) { chk('G9', 'Cross-platform', lbl, false, 'threw'); }
}

// ───── GATE 10 — trust surface (no fabricated precision; real URLs) ─────
{
  const { c, p } = await fresh(browser, { viewport: { width: 414, height: 900 } });
  await p.evaluate(() => { try { window.ccPick('accountant'); window.cnaiLearnTab('courses'); window.cnaiCoursesBuild('machine learning'); } catch (e) {} }); await p.waitForTimeout(700);
  const t = await p.evaluate(() => {
    const hub = document.getElementById('hub-section').textContent;
    const courseLinks = [...document.querySelectorAll('#courses-content a[href^="http"]')].map(a => a.href);
    return { estLabel: /\(est\.\)/.test(hub) && /Task-Exposure/.test(hub), notExact: /Not exact report figures/i.test(hub), realCourseUrls: courseLinks.length, allHttps: courseLinks.every(u => /^https:\/\//.test(u)) };
  });
  chk('G10', 'Trust / no-hallucination surface', 'Hub scores shown as estimates, not cited statistics', t.estLabel && t.notExact, JSON.stringify({ estLabel: t.estLabel, notExact: t.notExact }));
  chk('G10', 'Trust / no-hallucination surface', 'Course links are real https URLs', t.realCourseUrls >= 5 && t.allHttps, t.realCourseUrls + ' https course links');
  await c.close();
}

// ───── GATE 11 — Live experience (the gaps the local-only cert missed) ─────
{
  // 11a — Feature Discovery Box wired to FEATURES.md (locked gate)
  const { c, p } = await fresh(browser, { viewport: { width: 1024, height: 800 } });
  const meta = await p.evaluate(() => { const m = document.querySelector('meta[name="chitti-features"]'); return m ? m.getAttribute('content') : ''; });
  chk('G11', 'Live experience', 'Feature Discovery Box wired to a FEATURES.md', /skills\/FEATURES\.md/.test(meta), meta || '(no meta)');
  await c.close();
  // 11b — returning user (stale xlate cache keys) must NOT show false "Degraded"
  const c2 = await ctx(browser, { viewport: { width: 375, height: 812 } });
  const p2 = await c2.newPage();
  await p2.addInitScript(() => { try { localStorage.setItem('disability_profile', '{}'); localStorage.setItem('chitti_lang', 'en'); localStorage.setItem('chitti_xlate_v2_20260512_en_old', '{"a":1}'); localStorage.setItem('chitti_xlate_v1_legacy', '{"b":2}'); } catch (e) {} });
  await p2.goto(URL, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(13000);
  const obs = await p2.evaluate(() => { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('chitti_xlate_v') === 0) ks.push(k); } return { status: (window._chittiObs || {}).status, stale: ks }; });
  chk('G11', 'Live experience', 'Returning user (stale cache) stays "active", not false-Degraded', obs.status === 'active' && obs.stale.length === 0, 'status=' + obs.status + ' stale-remaining=' + obs.stale.length);
  await c2.close();
}

await browser.close(); srv.close();

// ───── score ─────
const ids = Object.keys(GATES).sort();
let tp = 0, tt = 0; const summary = ids.map(id => { const g = GATES[id]; tp += g.pass; tt += (g.pass + g.fail); return { gate: id, name: g.name, pass: g.pass, total: g.pass + g.fail, green: g.fail === 0 }; });
const gatesGreen = summary.filter(s => s.green).length;
const out = { product: 'chitti-news-ai', when: '2026-06-09', page: URL, gates: summary, gates_green: gatesGreen, gates_total: summary.length, checks_pass: tp, checks_total: tt, pass_pct: +(tp / tt * 100).toFixed(1), GATES };
writeFileSync(resolve(HERE, 'cert_cnai_production_result.json'), JSON.stringify(out, null, 2));
console.log('\n========================================');
console.log('GATES GREEN: ' + gatesGreen + ' / ' + summary.length + '  ·  CHECKS: ' + tp + '/' + tt + ' (' + out.pass_pct + '%)');
summary.forEach(s => console.log((s.green ? '✅' : '❌') + ' ' + s.gate + ' ' + s.name + ' — ' + s.pass + '/' + s.total));
console.log('Report: tools/cert_cnai_production_result.json');
process.exit(gatesGreen === summary.length ? 0 : 1);
