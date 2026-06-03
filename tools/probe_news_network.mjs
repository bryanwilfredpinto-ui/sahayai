import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const ctx = await b.newContext({viewport:{width:375,height:812}});
const p = await ctx.newPage();
const reqs = [];
p.on('request', r => { if (r.url().includes('/api/') || r.url().includes('chitti-news-api')) reqs.push({url:r.url(),method:r.method()}); });
p.on('response', r => { if (r.url().includes('/api/') || r.url().includes('chitti-news-api')) reqs.push({status:r.status(),url:r.url()}); });
p.on('pageerror', e => console.log('PAGE_ERR:', e.message));
p.on('console', m => { if (m.type() === 'error' || m.text().toLowerCase().includes('error') || m.text().toLowerCase().includes('cors')) console.log('CONSOLE:', m.text().slice(0,200)); });
await p.goto('https://sahayai.in/chitti_news.html', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(10000);
const feedState = await p.evaluate(() => ({
  root_html: document.getElementById('feed-root')?.innerHTML?.slice(0, 300) || 'no #feed-root',
  any_articles: document.querySelectorAll('.art-card, article').length,
}));
console.log('NETWORK CALLS:', JSON.stringify(reqs, null, 2));
console.log('FEED STATE:', JSON.stringify(feedState, null, 2));
await b.close();
