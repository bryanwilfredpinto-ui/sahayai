#!/usr/bin/env node
/** Measure page-string translation coverage on a LOCAL serve of the branch (BUG-2 proof). */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; readFile(join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); res.end('x'); return; } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(d); }); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/chitti_mechanic_2w.html?dp_skip=1`;
const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
await page.goto(URL, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
for (const code of ['hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu']) {
  await page.selectOption('#lang-select', code); await page.waitForTimeout(1600);
  const r = await page.evaluate(() => { let total = 0, changed = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null); let n; while ((n = w.nextNode())) { if (n._chittiOrig !== undefined) { total++; if (n._chittiOrig !== n.nodeValue) changed++; } } return { total, changed }; });
  console.log(code + ': ' + r.changed + '/' + r.total + ' nodes translated (' + Math.round(r.changed / r.total * 100) + '%)');
}
await b.close(); server.close();
