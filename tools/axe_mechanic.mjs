import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const s=createServer((q,r)=>{try{const u=decodeURIComponent((q.url||'/').split('?')[0]);const fp=join(ROOT,u);if(!fp.startsWith(ROOT)||!existsSync(fp)){r.writeHead(404);r.end('nf');return;}r.writeHead(200,{'Content-Type':M[extname(fp)]||'application/octet-stream'});r.end(readFileSync(fp));}catch(e){r.writeHead(500);r.end(''+e);}});
await new Promise(r=>s.listen(0,'127.0.0.1',r)); const B=`http://127.0.0.1:${s.address().port}`;
const b=await chromium.launch({headless:true}); const out={};
for(const [file,id] of [['chitti_2wheeler.html','bike'],['chitti_4wheeler.html','car']]){
  const ctx=await b.newContext({viewport:{width:390,height:900}});
  const p=await ctx.newPage();
  await p.route('**/api/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
  await p.goto(`${B}/${file}`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200);
  try{await p.click('button:has-text("Skip — none of these")',{timeout:1500});}catch(e){}
  await p.waitForTimeout(400);
  const res=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const v=res.violations.map(x=>({id:x.id,impact:x.impact,n:x.nodes.length}));
  out[id]={violations:res.violations.length, critical:res.violations.filter(x=>x.impact==='critical').length, serious:res.violations.filter(x=>x.impact==='serious').length, detail:v};
  await ctx.close();
}
await b.close(); s.close();
console.log('AXE:'+JSON.stringify(out));
