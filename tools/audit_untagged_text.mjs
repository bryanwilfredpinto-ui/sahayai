/**
 * Find every visible piece of text on chitti_2wheeler.html / chitti_4wheeler.html
 * that is NOT data-vai-i18n tagged — so we can tag them all and fix the
 * "selecting Bangla doesn't flip everything" bug.
 */
import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8765';

const b = await chromium.launch({ headless: true });
const page = await (await b.newContext({ viewport:{ width:375, height:812 } })).newPage();

for (const url of ['chitti_2wheeler.html','chitti_4wheeler.html']) {
  console.log('\n══════ ' + url + ' ══════');
  await page.goto(BASE + '/' + url, { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  const untagged = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (el.children.length) return; // leaf only
      const t = (el.textContent || '').trim();
      if (!t || t.length < 2) return;
      // Skip pure emoji / numbers / brand
      if (/^[\d.,:\s\-+%₹★☆\/]+$/.test(t)) return;
      if (/^(Chitti|Vaani|MedUPI|UPI|Hero|Maruti|FASTag|PUC|RC|DL|AB|UP|DL3|km|KM|OBD2)+$/.test(t)) return;
      // Has its own translation?
      if (el.hasAttribute('data-vai-i18n')) return;
      // Parent? walk up 2 levels
      let p = el.parentElement; let tagged = false;
      while (p && p !== document.body) {
        if (p.hasAttribute && p.hasAttribute('data-vai-i18n')) { tagged = true; break; }
        p = p.parentElement;
      }
      if (tagged) return;
      out.push({ tag: el.tagName, text: t.slice(0, 90) });
    });
    return out;
  });
  console.log('Total untagged visible strings:', untagged.length);
  untagged.slice(0, 50).forEach(u => console.log(`  <${u.tag}> "${u.text}"`));
}

await b.close();
