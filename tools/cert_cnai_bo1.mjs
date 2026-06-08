#!/usr/bin/env node
/* tools/cert_cnai_bo1.mjs — BO1 Roadmap UI smoke cert (local serve, offline). */
import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  } catch (e) { res.writeHead(500); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_news_ai.html`;

const R = [];
const rec = (n, ok, d) => { R.push({ n, ok: !!ok, d: d || '' }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + (d ? ' - ' + d : '')); };

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
// roadmap is offline; stub the news API so the page has no console noise
await ctx.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
// Skip the first-visit disability modal so it doesn't intercept clicks.
await p.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ blind: true })); localStorage.setItem('chitti_lang', 'en'); } catch (e) {} });
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);

rec('page_loads_no_errors', errs.length === 0, errs[0] || 'clean');
rec('engine_present', await p.evaluate(() => !!(window.ChittiRoadmap && window.ChittiRoadmap.generate)));
rec('chips_render', (await p.$$('#roadmap-chips .rm-chip')).length >= 5, (await p.$$('#roadmap-chips .rm-chip')).length + ' chips');

// Build a known roadmap via the engine wiring (avoids overlay-intercept on click).
await p.evaluate(() => window.cnaiRoadmapBuild('Agentic AI'));
await p.waitForTimeout(600);
const stageBoxes = await p.$$('#roadmap-content .rm-stage');
rec('roadmap_renders_stages', stageBoxes.length >= 4, stageBoxes.length + ' stage boxes');
rec('stages_have_chitti_response', (await p.$$('#roadmap-content [data-chitti-response]')).length >= 4);
rec('youtube_links_present', (await p.$$('#roadmap-content a[href*="youtube.com"]')).length >= 6, (await p.$$('#roadmap-content a[href*="youtube.com"]')).length + ' yt links');
rec('milestone_present', (await p.locator('#roadmap-content').innerText()).includes('Milestone'));
rec('read-aloud_button', !!(await p.$('#roadmap-content button[aria-label="Read my whole roadmap aloud"]')));
const speakAttr = await p.evaluate(() => { const h = document.getElementById('roadmap-content'); return (h && h.getAttribute('data-roadmap-speak')) || ''; });
rec('speakable_payload', speakAttr.includes('Stage 1 of') && speakAttr.includes('Search YouTube'));

// Generic goal (ANY profession)
await p.evaluate(() => window.cnaiRoadmapBuild('I raise pigs'));
await p.waitForTimeout(500);
rec('generic_goal_renders', (await p.$$('#roadmap-content .rm-stage')).length >= 3, 'pig-farming roadmap built');

// 375px no horizontal scroll
rec('no_hscroll_375', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)));

// ---- BO2: Free-first Course Finder ----
rec('bo2_engine_present', await p.evaluate(() => !!(window.ChittiCourses && window.ChittiCourses.find)));
await p.evaluate(() => window.cnaiCoursesBuild('machine learning'));
await p.waitForTimeout(500);
const courseCards = await p.$$('#courses-content .course-card');
rec('bo2_courses_render', courseCards.length >= 5, courseCards.length + ' course cards');
rec('bo2_cards_chitti_response', (await p.$$('#courses-content [data-chitti-response]')).length >= 5);
rec('bo2_free_badge', (await p.locator('#courses-content').innerText()).includes('FREE'));
const firstCard = (await p.locator('#courses-content .course-card').first().innerText());
rec('bo2_free_first', /FREE/.test(firstCard) && !/PAID/.test(firstCard.split('\n')[1] || firstCard), 'top card is free');
rec('bo2_open_links', (await p.$$('#courses-content a[href^="http"]')).length >= 5);
rec('bo2_speakable', (await p.evaluate(() => { const h = document.getElementById('courses-content'); return (h && h.getAttribute('data-courses-speak')) || ''; })).toLowerCase().includes('free'));

await b.close(); server.close();
const pass = R.filter(r => r.ok).length;
console.log('\nBO1 UI cert: ' + pass + ' / ' + R.length + ' PASS');
process.exit(pass === R.length ? 0 : 1);
