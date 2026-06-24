// STEP 3 cert — Universal Onboarding (chitti_vaani.html) + privacy.html.
// Gates: fresh user sees 5-step flow · DPDP toggles ALL OFF · returning user skips ·
// voice-navigable (🔊) · 0 uncaught JS errors · 375px no horizontal overflow.
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAANI = pathToFileURL(path.join(ROOT, 'chitti_vaani.html')).href;
const PRIV  = pathToFileURL(path.join(ROOT, 'privacy.html')).href;

const results = [];
const ok = (n,c,d='') => { results.push({n,c,d}); console.log(`${c?'✅':'❌'} ${n}${d?'  — '+d:''}`); };

const browser = await chromium.launch();

// ── Scenario A: FRESH user — full 5-step flow ──────────────────────────────
{
  const ctx = await browser.newContext({ viewport:{width:375,height:760} });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch(e){} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await pg.goto(VAANI, { waitUntil:'domcontentloaded', timeout:25000 });
  await pg.waitForSelector('#chitti-onb5.show', { timeout:8000 }).catch(()=>{});

  const shown = await pg.evaluate(() => document.getElementById('chitti-onb5')?.classList.contains('show'));
  ok('fresh user: onboarding overlay shown', !!shown);

  // Step 1 — 26 language chips, English default present.
  const langN = await pg.$$eval('#chitti-onb5 .o5-grid.lang .o5-chip', els => els.length);
  ok('Step 1: 26 language chips', langN === 26, `${langN}`);
  const hearBtn = await pg.$('#o5-hear');
  ok('voice-navigable: 🔊 hear button present', !!hearBtn);
  const spkPer = await pg.$$eval('#chitti-onb5 .o5-grid.lang .o5-spk', e=>e.length);
  ok('Step 1: 🔊 speaker per language chip', spkPer === 26, `${spkPer}`);

  // NOTE: after a non-English language is picked, chitti_lang.js translates the
  // onboarding text (intended). So we navigate by STRUCTURE, not by English text.
  const clickLastNav = () => pg.$$eval('#chitti-onb5 #o5-nav .o5-btn', els => { const b=els[els.length-1]; if(b)b.click(); });

  // pick Hindi → Step 2 (structural wait on the occupation grid)
  await pg.$$eval('#chitti-onb5 .o5-grid.lang .o5-chip', els => {
    const hi = els.find(e => /हिन्दी/.test(e.textContent)); if (hi) hi.click();
  });
  await pg.waitForSelector('#chitti-onb5 .o5-grid.occ', { timeout:5000 }).catch(()=>{});
  const occN = await pg.$$eval('#chitti-onb5 .o5-grid.occ .o5-chip', e=>e.length).catch(()=>0);
  ok('Step 2: 8 occupation chips (icons)', occN === 8, `${occN}`);

  // pick occupation → Step 3
  await pg.$$eval('#chitti-onb5 .o5-grid.occ .o5-chip', els => els[0] && els[0].click());
  await pg.waitForSelector('#o5-pin', { timeout:5000 }).catch(()=>{});
  const hasPin = await pg.$('#o5-pin'); const hasGps = await pg.$('#o5-gps');
  ok('Step 3: pincode input + GPS button', !!hasPin && !!hasGps);
  await pg.fill('#o5-pin', '110001').catch(()=>{});
  await clickLastNav(); // Next → Step 4
  await pg.waitForSelector('#chitti-onb5 .o5-toggle input[type=checkbox]', { timeout:5000 }).catch(()=>{});

  // Step 4 — DPDP toggles ALL OFF (non-negotiable).
  const toggles = await pg.$$eval('#chitti-onb5 .o5-toggle input[type=checkbox]', els =>
    els.map(e => ({ dom: e.getAttribute('data-dom'), checked: e.checked })));
  ok('Step 4: 5 DPDP consent toggles', toggles.length === 5, JSON.stringify(toggles.map(t=>t.dom)));
  ok('Step 4: ALL toggles OFF by default (non-negotiable)', toggles.length===5 && toggles.every(t => t.checked === false));

  // next → Step 5
  await clickLastNav();
  await pg.waitForSelector('#o5-fh', { timeout:5000 }).catch(()=>{});
  const hasFh = await pg.$('#o5-fh');
  ok('Step 5: quick profile (optional)', !!hasFh);

  // no horizontal overflow at 375px (mid-flow)
  const of = await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  ok('no horizontal overflow at 375px', of);

  // finish (Finish is the last nav button)
  await clickLastNav();
  await pg.waitForFunction(() => !document.getElementById('chitti-onb5')?.classList.contains('show'), { timeout:4000 }).catch(()=>{});
  const done = await pg.evaluate(() => localStorage.getItem('chitti_onboarding_complete'));
  const hidden = await pg.evaluate(() => !document.getElementById('chitti-onb5')?.classList.contains('show'));
  ok('Finish: overlay hidden + onboarding_complete=1', hidden && done === '1', `flag=${done}`);
  const uuid = await pg.evaluate(() => localStorage.getItem('chitti_device_uuid'));
  ok('device UUID stored', !!uuid);
  const facts = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('chitti_user_facts')||'{}'); } catch(e){ return {}; } });
  ok('user_facts persisted locally (lang+occupation+pincode)', facts.lang==='hi' && !!facts.occupation && facts.pincode==='110001', JSON.stringify(facts).slice(0,80));

  ok('0 uncaught JS errors (fresh flow)', errs.length === 0, errs[0]||'none');
  await ctx.close();
}

// ── Scenario B: RETURNING user — onboarding must NOT show ───────────────────
{
  const ctx = await browser.newContext({ viewport:{width:375,height:760} });
  await ctx.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('chitti_onboarding_complete','1'); } catch(e){} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await pg.goto(VAANI, { waitUntil:'domcontentloaded', timeout:25000 });
  await pg.waitForTimeout(1500);
  const shown = await pg.evaluate(() => document.getElementById('chitti-onb5')?.classList.contains('show'));
  ok('returning user: onboarding NOT shown', shown === false);
  ok('0 uncaught JS errors (returning)', errs.length === 0, errs[0]||'none');
  await ctx.close();
}

// ── Scenario C: legacy-onboarded user (lang+consent set, no onb5 flag) → migrate, no show ──
{
  const ctx = await browser.newContext({ viewport:{width:375,height:760} });
  await ctx.addInitScript(() => { try { localStorage.clear();
    localStorage.setItem('chitti_vaani_lang','hi'); localStorage.setItem('chitti_vaani_consent_given','1'); } catch(e){} });
  const pg = await ctx.newPage();
  await pg.goto(VAANI, { waitUntil:'domcontentloaded', timeout:25000 });
  await pg.waitForTimeout(1500);
  const shown = await pg.evaluate(() => document.getElementById('chitti-onb5')?.classList.contains('show'));
  const migrated = await pg.evaluate(() => localStorage.getItem('chitti_onboarding_complete'));
  ok('legacy user: not re-onboarded + migrated', shown === false && migrated === '1', `flag=${migrated}`);
  await ctx.close();
}

// ── Scenario D: privacy.html ────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport:{width:375,height:760} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await pg.goto(PRIV, { waitUntil:'domcontentloaded', timeout:20000 });
  await pg.waitForTimeout(800);
  const r = await pg.evaluate(() => ({
    grievance: /sire@sahayai\.in/.test(document.body.innerText),
    forget: /Chitti forget/i.test(document.body.innerText),
    dpdp: /DPDP/.test(document.body.innerText),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  ok('privacy: grievance email present', r.grievance);
  ok('privacy: "Chitti forget" section present', r.forget);
  ok('privacy: DPDP Act referenced', r.dpdp);
  ok('privacy: no horizontal overflow at 375px', !r.overflow);
  ok('privacy: 0 uncaught JS errors', errs.length === 0, errs[0]||'none');
  await ctx.close();
}

await browser.close();
const pass = results.filter(r=>r.c).length;
console.log(`\n${pass}/${results.length} GREEN`);
process.exit(pass === results.length ? 0 : 1);
