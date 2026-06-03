import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const ctx = await b.newContext({viewport:{width:1280,height:900}});  // desktop to rule out mobile-only branch
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGE_ERR:', e.message));
p.on('console', m => console.log('CONSOLE:', m.text().slice(0,400)));
await p.goto('https://sahayai.in/chitti_news.html', {waitUntil:'networkidle', timeout: 60000});
console.log('--- before manual loadFeed ---');
const before = await p.evaluate(() => ({
  feed_html: document.getElementById('feed-root')?.innerHTML?.slice(0,200),
  has_loadFeed: typeof window.loadFeed,
  has_loadHome: typeof window.loadHome,
  has_api: typeof window.api,
  filter: (typeof getFilter === 'function') ? getFilter() : 'no getFilter',
}));
console.log(JSON.stringify(before, null, 2));
console.log('--- calling loadFeed(true) manually ---');
await p.evaluate(() => window.loadFeed && window.loadFeed(true));
await p.waitForTimeout(8000);
const after = await p.evaluate(() => ({
  feed_html_first300: document.getElementById('feed-root')?.innerHTML?.slice(0,300),
  art_cards_after: document.querySelectorAll('.art-card,article,.rail-card,[data-art-id]').length,
}));
console.log(JSON.stringify(after, null, 2));
await b.close();
