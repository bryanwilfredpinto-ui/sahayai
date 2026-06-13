#!/usr/bin/env node
/* tools/cert_cnai_career_upgrade.mjs — TASK 2 proof: current-tools chip picker
 * → AI upgrade path. Real browser (chromium) + axe-core after interaction.
 * Taps Excel+PowerPoint, types a profession, runs cnaiCareerUpgrade, asserts
 * STOP/START + FREE/PAID badges + cert + 🔊 Listen + per-response widget +
 * full-UI language switch. Output: tools/cert_cnai_career_upgrade_result.json. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT = resolve(ROOT, 'test_screenshots', 'news-ai-career');
mkdirSync(SHOT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  } catch (e) { res.writeHead(500); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/chitti_news_ai.html`;

const R = []; const rec = (n, ok, d) => { R.push({ label: n, ok: !!ok, detail: String(d || '') }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + (d ? ' - ' + d : '')); };
console.log('\n=== TASK 2 — CAREER CHIP PICKER → UPGRADE PATH (browser proof) ===');
console.log('Page: ' + URL + '\n');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 375, height: 800 } });
await ctx.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
const p = await ctx.newPage();
const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(URL, { waitUntil: 'networkidle' });
// Dismiss the first-visit Disability Profile modal (it overlays the page).
await p.evaluate(() => { const m = document.getElementById('chitti-disability-profile-modal'); if (m) m.remove(); document.querySelectorAll('[aria-modal="true"]').forEach(e => e.remove()); });
await p.waitForTimeout(150);
// Activate the Career tab so its panel (and the chips) become visible.
await p.locator('button[role="tab"][data-tab="career"]').click();
await p.waitForTimeout(300);

// 0) 13 chips (12 tools + None), ≥48px tap targets.
const chipCount = await p.locator('#career-tool-chips .career-tool-chip').count();
rec('chips_13_rendered', chipCount === 13, chipCount + ' chips (12 tools + None)');
const chipBox = await p.locator('#career-tool-chips .career-tool-chip').first().boundingBox();
rec('chips_48px', chipBox && chipBox.height >= 48, chipBox ? Math.round(chipBox.height) + 'px' : 'no box');

// 1) tap Excel + PowerPoint, set profession, run upgrade.
await p.locator('.career-tool-chip[data-tool="excel"]').click();
await p.locator('.career-tool-chip[data-tool="powerpoint"]').click();
const pressed = await p.locator('.career-tool-chip[aria-pressed="true"]').count();
rec('chips_toggle_aria', pressed === 2, pressed + ' pressed (aria-pressed)');
rec('chips_check_icon', /✓/.test(await p.locator('.career-tool-chip[data-tool="excel"]').innerText()), 'selected chip shows ✓ (not colour-alone)');
await p.fill('#career-input', 'I am a teacher with 8 years');
await p.locator('#career-upgrade-go').click();
await p.waitForTimeout(500);

const panel = await p.locator('#career-upgrade-content').innerText();
rec('upgrade_table', await p.locator('#career-upgrade-content table th', { hasText: 'What you use' }).count() === 1 && await p.locator('#career-upgrade-content table th', { hasText: 'AI upgrade' }).count() === 1, 'tool-replacement table');
rec('upgrade_excel_mapped', /Excel/.test(panel) && /Gemini in Sheets/i.test(panel), 'Excel → Gemini in Sheets');
rec('upgrade_ppt_mapped', /PowerPoint/.test(panel) && /Gamma/i.test(panel), 'PowerPoint → Gamma.app');
rec('upgrade_FREE_badge', /FREE/i.test(panel), 'free badge present');
const hasPaid = await p.locator('#career-upgrade-content [data-i18n="paid_badge"]').count();
rec('upgrade_PAID_badge', hasPaid >= 1, hasPaid + ' PAID-tagged cert(s)');
rec('upgrade_cert_links', await p.locator('#career-upgrade-content a[rel="noopener"][target="_blank"]').count() >= 3, 'Start-this-cert real links');
rec('upgrade_medals', /🥇/.test(panel) && /🥈/.test(panel), 'free certs in priority order');
rec('upgrade_mentor_voice', /unfair advantage|augment|advantage/i.test(panel));
rec('upgrade_disclaimer', /ASSIST.*don.t replace|Results depend on your practice/i.test(panel), 'honest disclaimer');
rec('upgrade_listen_btn', await p.locator('#career-upgrade-content button[aria-label="Listen to my upgrade path"]').count() === 1, '🔊 Listen present');
rec('upgrade_download_btn', await p.locator('#career-upgrade-content button[aria-label*="Download"]').count() === 1, '📥 Download present');
rec('upgrade_per_response_widget', await p.locator('#career-upgrade-content[data-chitti-response]').count() >= 1, 'data-chitti-response region');

// 1b) "None of the above" deselects all other chips.
await p.locator('.career-tool-chip[data-tool="none"]').click();
rec('none_deselects', await p.locator('.career-tool-chip[aria-pressed="true"]').count() === 1, 'only None pressed after tapping None');

// 2) empty-selection guard (deselect None too).
await p.locator('.career-tool-chip[data-tool="none"]').click();
await p.locator('#career-upgrade-go').click(); await p.waitForTimeout(200);
rec('upgrade_empty_guard', /tap the tools/i.test(await p.locator('#career-upgrade-content').innerText()));

// 3) full-UI language switch re-renders the panel (applyLanguage); tech terms stay English.
await p.locator('.career-tool-chip[data-tool="excel"]').click();
await p.locator('#career-upgrade-go').click(); await p.waitForTimeout(300);
await p.evaluate(() => { try { window.CNAIi18n.applyLanguage('ta'); } catch (e) {} });
await p.waitForTimeout(300);
const taPanel = await p.locator('#career-upgrade-content').innerText();
rec('lang_switch_translates', taPanel.length > 0, 'panel still rendered after Tamil switch');
rec('tech_terms_english', /Excel/.test(taPanel) && /AI/.test(taPanel), 'Excel/AI stay English in Tamil UI');
await p.evaluate(() => { try { window.CNAIi18n.applyLanguage('en'); } catch (e) {} });

// 4) axe-core after interaction — 0 serious/critical on the page.
const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
const serious = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
rec('axe_0_serious_after_interaction', serious.length === 0, axe.violations.length + ' total · ' + serious.length + ' serious/critical');
rec('no_console_errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await p.locator('#career-section').screenshot({ path: resolve(SHOT, 'career_upgrade_375.png') }).catch(() => {});
const pass = R.filter(x => x.ok).length, total = R.length;
console.log('\n📊 ' + pass + '/' + total + ' pass (' + Math.round(pass / total * 100) + '%) · ' + (total - pass) + ' fail');
console.log('📸 ' + resolve(SHOT, 'career_upgrade_375.png'));
writeFileSync(resolve(ROOT, 'tools', 'cert_cnai_career_upgrade_result.json'), JSON.stringify({ when: 'run', url: URL, pass, total, results: R }, null, 2));
await b.close(); server.close();
process.exit(pass === total ? 0 : 1);
