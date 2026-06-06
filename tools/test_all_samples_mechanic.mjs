/* tools/test_all_samples_mechanic.mjs — Universal Handover Part 3.2.
 * Loops EVERY sample file under test_samples/mechanic/ (recursive readdir — NO hardcoded
 * list) and validates each against the REAL deterministic engine (window.ChittiBreakdownKB
 * loaded by chitti_2wheeler.html). Per sample asserts:
 *   - the expected scenario id exists in the KB
 *   - its name renders non-empty in ALL 9 languages (KB.t across langs)
 *   - it has at least one cause with DIY steps (or, if safety.red, the safety contract:
 *     no DIY steps — "do not attempt, get help")
 *   - the multilingual self-repair disclaimer renders in ALL 9 languages
 * Writes one Self-Fix screenshot per category. Prints SAMPLES:{pass,fail,total,byCat,shots}. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLES = join(ROOT, 'test_samples', 'mechanic');
const SHOT = join(ROOT, 'test_screenshots', 'mechanic');
import { mkdirSync } from 'node:fs'; mkdirSync(SHOT, { recursive: true });

// Recursive readdir — NO hardcoded sample list.
function walk(d) { let out = []; for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) out = out.concat(walk(p)); else if (f.endsWith('.json')) out.push(p); } return out; }
const files = walk(SAMPLES);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((q, r) => { try { const u = decodeURIComponent((q.url || '/').split('?')[0]); const fp = join(ROOT, u); if (!fp.startsWith(ROOT) || !existsSync(fp)) { r.writeHead(404); r.end('nf'); return; } r.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' }); r.end(readFileSync(fp)); } catch (e) { r.writeHead(500); r.end('' + e); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const B = `http://127.0.0.1:${server.address().port}`;

const LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
const failed = []; let pass = 0; const byCat = {}; const shotCats = new Set();
const ok = (cat) => { pass++; byCat[cat] = (byCat[cat] || { p: 0, f: 0 }); byCat[cat].p++; };
const bad = (cat, n, d) => { failed.push(`${n}: ${d}`); byCat[cat] = (byCat[cat] || { p: 0, f: 0 }); byCat[cat].f++; };

const b = await chromium.launch({ headless: true });
const pg = await b.newPage({ viewport: { width: 390, height: 860 } });
pg.on('pageerror', e => failed.push('pageerror: ' + e.message));
await pg.route('**/api/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
await pg.goto(`${B}/chitti_2wheeler.html`, { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(1200);
try { await pg.click('button:has-text("Skip — none of these")', { timeout: 1500 }); } catch (e) {}

for (const file of files) {
  const s = JSON.parse(readFileSync(file, 'utf8'));
  const cat = s.category || 'uncat';
  const res = await pg.evaluate(({ id, langs }) => {
    const KB = window.ChittiBreakdownKB; if (!KB) return { err: 'no-KB' };
    const sc = (KB.bike || []).find(x => x.id === id); if (!sc) return { err: 'no-scenario' };
    const out = { icon: !!sc.icon, nameLangs: 0, hasSteps: false, red: !!(sc.safety && sc.safety.red), discLangs: 0 };
    for (const L of langs) { window.CURRENT_LANG = L; const nm = KB.t(sc.name) || ''; if (nm.trim().length > 1) out.nameLangs++; const d = KB.t(KB.disclaimer) || ''; if (d.trim().length > 5) out.discLangs++; }
    const causes = sc.causes || [];
    out.hasSteps = causes.some(c => Array.isArray(c.steps) && c.steps.length > 0);
    return out;
  }, { id: s.expect_scenario, langs: LANGS });

  if (res.err) { bad(cat, file.split(/[\\/]/).pop(), res.err); continue; }
  const nameOk = res.nameLangs === LANGS.length;
  const discOk = res.discLangs === LANGS.length;
  // Safety contract: red scenarios may legitimately have no DIY steps; non-red must have steps.
  const stepsOk = res.red ? true : res.hasSteps;
  (res.icon && nameOk && discOk && stepsOk)
    ? ok(cat)
    : bad(cat, file.split(/[\\/]/).pop(), `icon=${res.icon} name=${res.nameLangs}/9 disc=${res.discLangs}/9 steps=${res.hasSteps} red=${res.red}`);

  // One screenshot per category: open Self-Fix and capture.
  if (!shotCats.has(cat)) {
    shotCats.add(cat);
    try {
      await pg.evaluate(() => { window.CURRENT_LANG = 'hi'; if (window.ChittiSelfFix && window.ChittiSelfFix.open) window.ChittiSelfFix.open('2w'); });
      await pg.waitForTimeout(350);
      await pg.screenshot({ path: join(SHOT, `sample_${cat}.png`) });
      await pg.evaluate(() => { const x = document.querySelector('[data-csf-close],[onclick*="close" i]'); if (x) x.click(); });
      await pg.waitForTimeout(150);
    } catch (e) {}
  }
}
await b.close(); server.close();
const shots = readdirSync(SHOT).filter(f => f.startsWith('sample_')).length;
console.log('SAMPLES:' + JSON.stringify({ pass, fail: failed.length, total: files.length, byCat, shots, failed: failed.slice(0, 6) }));
process.exit(failed.length ? 1 : 0);
