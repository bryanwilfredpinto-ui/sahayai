// tools/medupi_axe_detail.mjs — dump exact nodes for the 2 serious axe violations.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core'), 'utf8');
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { try { localStorage.setItem('disability_profile', JSON.stringify({ lang: 'en', ts: 't', skipped: true })); localStorage.setItem('chitti_medupi_disclaimer_ack', '1'); } catch (e) {} });
const page = await ctx.newPage();
await page.goto(BASE + '/chitti_medupi.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await page.addScriptTag({ content: axeSource });
const out = await page.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
  return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({
    id: v.id, impact: v.impact, help: v.help,
    nodes: v.nodes.map(n => ({ target: n.target, html: n.html.slice(0, 220), summary: (n.failureSummary || '').slice(0, 300) })),
  }));
});
console.log(JSON.stringify(out, null, 2));
await b.close();
