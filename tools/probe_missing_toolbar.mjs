import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:375,height:812}})).newPage();
for (const f of ['chitti_2wheeler.html','chitti_4wheeler.html']) {
  console.log('\n══ ' + f);
  await p.goto('http://127.0.0.1:8765/' + f, { waitUntil:'networkidle' });
  await p.waitForTimeout(500);
  const missing = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.chitti-response').forEach((c, i) => {
      const bar = c.querySelector('.sds-card-toolbar') || c.querySelector('.chitti-fb-bar');
      const hasPos = bar && bar.querySelector('.fb-pos, [data-act="up"]');
      const hasNeg = bar && bar.querySelector('.fb-neg, [data-act="down"]');
      if (!hasPos || !hasNeg) {
        out.push({ i, section: c.getAttribute('data-chitti-section') || '(none)',
                   bar: !!bar, hasPos: !!hasPos, hasNeg: !!hasNeg,
                   title: (c.querySelector('h2,h3')?.innerText || '').slice(0, 80) });
      }
    });
    return out;
  });
  console.log(JSON.stringify(missing, null, 2));
}
await b.close();
