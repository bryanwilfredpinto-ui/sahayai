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
const rmTxt = await p.locator('#roadmap-content').innerText();
rec('milestone_present', rmTxt.includes('Milestone'));
// v2: real courses per stage + the AI knowledge-tree note + goes through ML/DL
rec('bo1_real_courses', (await p.$$('#roadmap-content a[aria-label^="Open free course"]')).length >= 6, (await p.$$('#roadmap-content a[aria-label^="Open free course"]')).length + ' real course links');
rec('bo1_tree_note', /inside|⊂|sits inside/i.test(rmTxt), 'AI taxonomy note shown');
rec('bo1_through_ML_DL', /Machine Learning/i.test(rmTxt) && /Deep Learning/i.test(rmTxt) && /Generative AI/i.test(rmTxt), 'Agentic path goes through ML→DL→GenAI');
rec('bo1_fastai_or_hf', /fast\.?ai/i.test(rmTxt) && /Hugging Face/i.test(rmTxt), 'real courses (fast.ai + HF) named');
rec('read-aloud_button', !!(await p.$('#roadmap-content button[aria-label="Read my whole roadmap aloud"]')));
const speakAttr = await p.evaluate(() => { const h = document.getElementById('roadmap-content'); return (h && h.getAttribute('data-roadmap-speak')) || ''; });
rec('speakable_payload', speakAttr.includes('Stage 1 of') && /Free course/i.test(speakAttr));

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

// ---- BO3: Analogy teaching ----
rec('bo3_engines_present', await p.evaluate(() => !!(window.ChittiAnalogy && window.ChittiLearns)));
rec('bo3_selects_filled', (await p.$$('#analogy-concept option')).length >= 14 && (await p.$$('#analogy-domain option')).length === 7,
  (await p.$$('#analogy-concept option')).length + ' concepts × ' + (await p.$$('#analogy-domain option')).length + ' domains');
await p.evaluate(() => { document.getElementById('analogy-concept').value = 'token'; document.getElementById('analogy-domain').value = 'cricket'; window.cnaiAnalogyGo(); });
await p.waitForTimeout(400);
const analogyTxt = await p.locator('#analogy-content').innerText();
rec('bo3_card_renders', (await p.$$('#analogy-content .analogy-card')).length === 1);
rec('bo3_card_chitti_response', (await p.$$('#analogy-content [data-chitti-response]')).length >= 1);
rec('bo3_breaks_down_shown', /Where this breaks down/i.test(analogyTxt), 'leaky-analogy guard visible');
rec('bo3_practice_not_graded', /not a graded exam/i.test(analogyTxt));
// "Say it another way" switches domain (same concept)
await p.evaluate(() => window.cnaiAnalogyAnother());
await p.waitForTimeout(300);
const after = await p.locator('#analogy-content').innerText();
rec('bo3_switch_domain', after !== analogyTxt && /token/i.test(after.toLowerCase()), 'domain switched, same concept');
rec('bo3_speakable', (await p.evaluate(() => { const h = document.getElementById('analogy-content'); return (h && h.getAttribute('data-analogy-speak')) || ''; })).length > 20);

// ---- BO4: Career Coach ----
rec('bo4_engine_present', await p.evaluate(() => !!(window.ChittiCareer && window.ChittiCareer.buildReport)));
await p.fill('#career-input', 'I am a doctor with 15 years');
await p.evaluate(() => window.cnaiCareerOneLiner({ preventDefault() {} }));
await p.waitForTimeout(400);
const careerTxt = await p.locator('#career-content').innerText();
rec('bo4_report_renders', (await p.$$('#career-content .career-card')).length === 1);
rec('bo4_report_chitti_response', (await p.$$('#career-content [data-chitti-response]')).length >= 1);
rec('bo4_shows_free_tools', /free/i.test(careerTxt) && /AI tools for your field/i.test(careerTxt));
rec('bo4_shows_free_certs', /Free certifications/i.test(careerTxt));
rec('bo4_clinical_caveat', /human|diagnos|clinical/i.test(careerTxt), 'doctor caveat shown');
rec('bo4_roadmap_handoff', /30-day roadmap/i.test(careerTxt));
rec('bo4_privacy_stored_local', await p.evaluate(() => { try { return !!JSON.parse(localStorage.getItem('cnai_profile')).role; } catch (e) { return false; } }), 'profile in localStorage only');
// Chitti forget wipes it
await p.evaluate(() => window.cnaiCareerForget());
await p.waitForTimeout(200);
rec('bo4_chitti_forget', await p.evaluate(() => !localStorage.getItem('cnai_profile')), 'forget clears localStorage');

// ---- BO5: Swarm ----
rec('bo5_engine_present', await p.evaluate(() => !!(window.ChittiSwarm && window.ChittiSwarm.run)));
await p.fill('#swarm-input', 'Agentic AI');
await p.evaluate(() => window.cnaiSwarmGo({ preventDefault() {} }));
await p.waitForTimeout(500);
const swarmTxt = await p.locator('#swarm-content').innerText();
rec('bo5_card_renders', (await p.$$('#swarm-content .swarm-card')).length === 1);
rec('bo5_card_chitti_response', (await p.$$('#swarm-content [data-chitti-response]')).length >= 1);
rec('bo5_shows_helpers', /helpers reported/i.test(swarmTxt) && /agent-1/i.test(swarmTxt.toLowerCase()));
rec('bo5_shows_insights', /Connections they found/i.test(swarmTxt));
rec('bo5_shows_roadmap', /Combined roadmap/i.test(swarmTxt));
rec('bo5_speakable', (await p.evaluate(() => { const h = document.getElementById('swarm-content'); return (h && h.getAttribute('data-swarm-speak')) || ''; })).toLowerCase().includes('helpers learned'));

// Final: no console errors across all 5 BOs, no h-scroll
rec('all_bo_no_console_errors', errs.length === 0, errs[0] || 'clean across BO1-5');
rec('all_bo_no_hscroll', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)));

await b.close(); server.close();
const pass = R.filter(r => r.ok).length;
console.log('\nBO1 UI cert: ' + pass + ' / ' + R.length + ' PASS');
process.exit(pass === R.length ? 0 : 1);
