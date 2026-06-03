import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const ctx = await b.newContext({viewport:{width:375,height:812}});
const p = await ctx.newPage();
p.on('console', m => console.log('CONSOLE:', m.text().slice(0, 200)));
p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await p.goto('https://sahayai.in/chitti_news.html', {waitUntil:'domcontentloaded'});
await p.waitForTimeout(8000);
const info = await p.evaluate(() => ({
  cards_class_art_card: document.querySelectorAll('.art-card').length,
  data_chitti_response: document.querySelectorAll('[data-chitti-response]').length,
  data_chitti_response_attr: document.querySelectorAll('div[data-chitti-response]').length,
  art_sub_host: document.querySelectorAll('.art-sub-host').length,
  feed_container_html_first200: (document.getElementById('feed')||document.querySelector('main'))?.innerHTML?.slice(0,400) || 'no feed/main found',
  body_text_start: document.body.textContent.slice(0, 200),
}));
console.log(JSON.stringify(info, null, 2));
await b.close();
