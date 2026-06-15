#!/usr/bin/env node
/** QA — dismiss first-visit modal like a real user, then real-tap every button on LIVE. */
import { chromium } from 'playwright';
const URL = 'https://sahayai.in/chitti_mechanic_2w.html';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);

// ── Dismiss any first-visit overlay (disability profile / feature discovery) like a real user ──
let dismissed = 'none';
async function dismissOverlays() {
  for (let i = 0; i < 4; i++) {
    const did = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 50 && r.height > 50 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0; };
      // find a high-z fixed overlay
      const ov = [...document.querySelectorAll('div,section,dialog')].filter(e => { const s = getComputedStyle(e); return (s.position === 'fixed' || s.position === 'absolute') && +s.zIndex >= 1000 && vis(e); });
      let acted = false;
      for (const o of ov) {
        const btn = [...o.querySelectorAll('button,a')].find(x => vis(x) && /save|done|skip|continue|close|got it|start|ok|✕|×|later|no thanks/i.test((x.innerText || '') + (x.getAttribute('aria-label') || '')));
        if (btn) { btn.click(); acted = true; break; }
      }
      return acted;
    });
    if (did) { dismissed = 'clicked'; await page.waitForTimeout(500); } else break;
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}
await dismissOverlays();
// report whether a blocking overlay remains over page center
const blocked = await page.evaluate(() => { const el = document.elementFromPoint(window.innerWidth / 2, 300); if (!el) return 'none'; const o = el.closest('[class*="modal"],[class*="overlay"],[class*="dialog"],[id*="modal"]'); return o ? (o.className || o.id) : 'clear'; });
console.log('OVERLAY_AFTER_DISMISS::' + dismissed + ' / center=' + blocked);

async function tab(k) { await page.locator('#tab-' + k).click({ timeout: 8000 }); await page.locator('#panel-' + k).waitFor({ state: 'visible', timeout: 8000 }); await page.waitForTimeout(100); }
async function setv(id, v) { const el = page.locator('#' + id); await el.waitFor({ state: 'visible', timeout: 8000 }); await el.fill(v); }
async function hostLen(id) { return ((await page.locator('#' + id).innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim().length; }
let pass = 0, fail = 0;
async function tapBtn(t, label, hostId, sel, prep) {
  try {
    await tab(t); if (prep) await prep();
    const before = await hostLen(hostId);
    const btn = sel ? page.locator(sel) : page.locator('#panel-' + t + ' button', { hasText: label }).first();
    await btn.scrollIntoViewIfNeeded(); await btn.click({ timeout: 6000 }); await page.waitForTimeout(300);
    const after = await hostLen(hostId);
    const ok = after > 3 && (after !== before || after > 10); ok ? pass++ : fail++;
    console.log((ok ? 'PASS' : 'FAIL') + ' :: ' + label);
  } catch (e) { fail++; console.log('FAIL :: ' + label + ' — ' + e.message.split('\n')[0]); }
}
await tapBtn('bike', 'How it works', 'r-tour', 'section.hero button:has-text("How it works")');
await tapBtn('bike', 'Save my bike', 'r-bike', null, async () => { await setv('bk-make', 'Honda Activa'); await setv('bk-odo', '12500'); await setv('bk-ins', '2026-07-10'); await setv('bk-puc', '2026-06-25'); });
await tapBtn('bike', 'My scores', 'r-bike');
await tapBtn('bike', 'Save document', 'r-bike');
await tapBtn('bike', 'My documents', 'r-bike');
await tapBtn('remind', 'Check my reminders', 'r-remind');
await tapBtn('doctor', 'Diagnose', 'r-coach');
await tapBtn('doctor', 'Explain code', 'r-obd', null, async () => { await setv('dr-code', 'P0300'); });
await tapBtn('doctor', 'Find mechanic', 'r-coach');
await tapBtn('buy', 'Get Buy Score', 'r-buy', null, async () => { await setv('by-mkt', '42000'); await setv('by-ask', '45000'); });
await tapBtn('sell', 'Suggest price', 'r-sell', null, async () => { await setv('sl-mkt', '68000'); });
await tapBtn('sell', 'List on OLX', 'r-sell');
await tapBtn('insure', 'Compare insurers', 'r-insure', null, async () => { await setv('in-idv', '60000'); });
await tapBtn('insure', 'Buy / renew now', 'r-insure');
await tapBtn('puc', 'Check PUC', 'r-puc');
await tapBtn('puc', 'Nearest PUC centre', 'r-puc');
await tapBtn('service', 'Service & oil plan', 'r-service');
await tapBtn('service', 'Schedule service', 'r-service');
await tapBtn('service', 'Nearest service centre', 'r-service');
await tapBtn('tyre', 'Are mine worn', 'r-tyre');
await tapBtn('tyre', 'Recommend tyres', 'r-tyre');
await tapBtn('tyre', 'Find tyre deals', 'r-tyre');
await tapBtn('tyre', 'Log replacement', 'r-tyre');
await tapBtn('battery', 'Check battery', 'r-battery');
await tapBtn('fuel', 'Calculate ROI', 'r-fuel', null, async () => { await setv('fu-km', '1000'); });
await tapBtn('scam', 'Check the quote', 'r-scam', null, async () => { await setv('sc-item', 'brake shoes'); await setv('sc-quote', '3000'); });
await tapBtn('learn', 'Show the steps', 'r-learn');
await tapBtn('learn', 'Watch DIY video', 'r-learn');
await tapBtn('learn', 'All guides', 'r-learn');
await tapBtn('savings', 'Log a saving', 'r-savings', null, async () => { await setv('sv-amt', '1700'); });
await tapBtn('savings', 'Show total', 'r-savings');
await tapBtn('savings', 'Vehicle Twin', 'r-savings');
await tapBtn('sos', 'Show emergency', 'r-sos');
try { await tab('bike'); await page.locator('header button', { hasText: 'Read page' }).click({ timeout: 5000 }); pass++; console.log('PASS :: Read page (header)'); } catch (e) { fail++; console.log('FAIL :: Read page (header)'); }
try { await page.selectOption('#lang-select', 'hi'); await page.waitForTimeout(1200); const ok = (await page.evaluate(() => document.documentElement.lang)) === 'hi'; await page.selectOption('#lang-select', 'en'); ok ? pass++ : fail++; console.log((ok ? 'PASS' : 'FAIL') + ' :: Language dropdown'); } catch (e) { fail++; console.log('FAIL :: Language dropdown'); }
console.log('BUTTONS_PASS::' + pass + ' BUTTONS_FAIL::' + fail + ' PAGEERRORS::' + errs.length);
await b.close();
