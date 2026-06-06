#!/usr/bin/env node
/**
 * tools/scanner_perf.mjs — Chitti Universal Scanner performance + real 3G throttle.
 * Uses Chromium CDP to (a) measure normal load + JS heap, (b) emulate Fast-3G & Slow-3G
 * network and measure load time, (c) time a deterministic router decision.
 * Lighthouse substitute (no external Lighthouse dep). Run:
 *   CERT_BASE=http://127.0.0.1:8770 node tools/scanner_perf.mjs
 */
import { chromium } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8770').replace(/\/$/, '');
const URL = BASE + '/chitti_scanner.html';
const b = await chromium.launch({ headless: true });

async function loadProfile(name, net) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('chitti_scanner_consent_given', '1'); localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: 't' })); } catch (e) {} });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (net) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...net });
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;
  const timing = await page.evaluate(() => {
    const t = performance.timing;
    return { dcl: t.domContentLoadedEventEnd - t.navigationStart, load: t.loadEventEnd - t.navigationStart };
  });
  let heapMB = null;
  try { const m = await cdp.send('Performance.getMetrics'); const h = m.metrics.find(x => x.name === 'JSHeapUsedSize'); if (h) heapMB = +(h.value / 1048576).toFixed(1); } catch (e) {}
  await ctx.close();
  return { name, loadMs, dcl: timing.dcl, load: timing.load, heapMB };
}

const normal = await loadProfile('normal', null);
const fast3g = await loadProfile('Fast-3G', { downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8, latency: 150 });
const slow3g = await loadProfile('Slow-3G', { downloadThroughput: 0.4e6 / 8, uploadThroughput: 0.4e6 / 8, latency: 400 });

// router decision timing (deterministic, no network)
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { try { localStorage.setItem('chitti_scanner_consent_given', '1'); localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: 't' })); } catch (e) {} });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
const routeMs = await page.evaluate(() => {
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) window.detectCategory({ type: null, summary: 'Crocin 500mg paracetamol exp', facts: {}, key_findings: [] }, 'Crocin 500mg');
  return +((performance.now() - t0) / 1000).toFixed(4);
});
await ctx.close();
await b.close();

for (const r of [normal, fast3g, slow3g]) console.log(`${r.name.padEnd(8)} load=${r.loadMs}ms (perf.load=${r.load}ms, dcl=${r.dcl}ms) heap=${r.heapMB}MB`);
console.log(`router decision: ${routeMs}ms (avg over 1000, deterministic no-network)`);
console.log(`\nPERF_RESULT:${JSON.stringify({
  normal_load_ms: normal.loadMs, fast3g_load_ms: fast3g.loadMs, slow3g_load_ms: slow3g.loadMs,
  heap_mb: normal.heapMB, heap_under_100mb: normal.heapMB !== null && normal.heapMB < 100,
  router_decision_ms: routeMs, router_under_1s: routeMs < 1000,
})}`);
process.exit(0);
