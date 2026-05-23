/**
 * Find every visible text node on chitti_2wheeler.html + chitti_4wheeler.html
 * that is NOT data-vai-i18n tagged. Sire 2026-05-23: "Select Telugu → 100%
 * Telugu everywhere. ZERO English remaining."
 *
 * Walks every text node in every tab (not just initial Home).
 */
import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8765';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport:{ width:375, height:812 } });
const page = await ctx.newPage();

// Seed a vehicle so dynamic content (KYV, alerts) also mounts
const seedFor = {
  'chitti_2wheeler.html': () => {
    const v = { make:'Hero', model:'Splendor Plus', variant:'i3S', reg:'UP32AB1234', year:'2018', odo:38000 };
    localStorage.setItem('chitti_bike_v1', JSON.stringify(v));
    localStorage.setItem('chitti_bike_fleet_v1', JSON.stringify([v]));
  },
  'chitti_4wheeler.html': () => {
    const v = { make:'Maruti Suzuki', model:'Swift', variant:'VXi', reg:'DL3CAB5678', year:'2020', odo:52000 };
    localStorage.setItem('chitti_car_v1', JSON.stringify(v));
    localStorage.setItem('chitti_car_fleet_v1', JSON.stringify([v]));
  },
};

const TABS = {
  'chitti_2wheeler.html': ['home','bike','docs','alerts','ask'],
  'chitti_4wheeler.html': ['home','car','docs','alerts','ask'],
};

for (const file of ['chitti_2wheeler.html','chitti_4wheeler.html']) {
  console.log('\n══════ ' + file + ' ══════');
  await page.goto(BASE + '/' + file, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(seedFor[file]);
  await page.reload({ waitUntil:'networkidle' });
  await page.waitForTimeout(800);

  // Walk every tab so dynamic content mounts
  const allUntagged = {};
  for (const tab of TABS[file]) {
    await page.evaluate((t) => document.querySelector(`nav.sds-tabs button[data-tab="${t}"]`)?.click(), tab);
    await page.waitForTimeout(400);
    const untagged = await page.evaluate(() => {
      const out = [];
      function visit(el) {
        if (!el || el.nodeType === 8) return;
        if (el.nodeType === 3) {
          const t = (el.textContent || '').trim();
          if (!t || t.length < 2) return;
          // Pure emoji / numbers / punctuation
          if (/^[\d.,:\s\-+%₹★☆\/\(\)\[\]\—–·~×]+$/.test(t)) return;
          if (/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+$/u.test(t)) return;
          // Brand names / spec codes
          if (/^(Chitti|Vaani|MedUPI|UPI|FASTag|PUC|RC|DL|RG4HC|NGK|CR8EH|CC|BHP|Nm|km|KM|kmpl|L|inr|OBD2|ELM327)+$/.test(t)) return;
          // Look up the ancestor chain — if any ancestor has data-vai-i18n, skip
          let p = el.parentElement;
          while (p && p !== document.body) {
            if (p.hasAttribute && (p.hasAttribute('data-vai-i18n') || p.hasAttribute('data-vai-i18n-attr'))) return;
            p = p.parentElement;
          }
          out.push({ text: t.slice(0, 90), tag: el.parentElement?.tagName || '', parentId: el.parentElement?.id || '' });
          return;
        }
        if (el.nodeType !== 1) return;
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') return;
        // Walk into element
        for (const child of el.childNodes) visit(child);
      }
      // Only visible active tab + always-visible header
      visit(document.querySelector('header.sds-header'));
      visit(document.querySelector('nav.sds-tabs'));
      const active = document.querySelector('.sds-tab-panel.active');
      if (active) visit(active);
      // Also check placeholders + aria-labels in the active panel
      const placeholderUntagged = [];
      (active ? Array.from(active.querySelectorAll('input,textarea,select')) : []).forEach(el => {
        const ph = el.getAttribute('placeholder');
        if (ph && ph.trim().length > 1 && !el.hasAttribute('data-vai-i18n-attr')) {
          placeholderUntagged.push({ text: '[placeholder] ' + ph.slice(0,80), tag: el.tagName, parentId: el.id });
        }
      });
      return [...out, ...placeholderUntagged];
    });
    for (const u of untagged) {
      const k = u.text;
      if (!allUntagged[k]) allUntagged[k] = { ...u, tabs: [] };
      allUntagged[k].tabs.push(tab);
    }
  }

  // Dedup + sort
  const list = Object.values(allUntagged).map(u => ({ ...u, tabs: [...new Set(u.tabs)].join(',') }));
  console.log('Total untagged visible strings:', list.length);
  list.slice(0, 60).forEach(u => console.log('  [' + u.tabs + '] <' + u.tag + (u.parentId?'#'+u.parentId:'') + '> "' + u.text + '"'));
  if (list.length > 60) console.log('  …(' + (list.length - 60) + ' more)');
}

await b.close();
