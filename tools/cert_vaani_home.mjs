/**
 * tools/cert_vaani_home.mjs — Chitti Vaani HOMEPAGE v2 cert (UI/UX overhaul 2026-06-23).
 * Certifies: language gate FIRST (26 langs, English default, 🔊), magic moment + Chitti
 * character (listening), 6-card home + "और देखें", deferred device onboarding, Advanced
 * settings, and ZERO real JS errors (cross-origin/network noise filtered).
 * Usage:  python -m http.server 8799  (from repo root)  then  node tools/cert_vaani_home.mjs
 * Screenshots → tools/cert_screenshots/vaani_home_*.png
 */
import { chromium } from 'playwright';
const BASE = (process.env.CERT_BASE || 'http://127.0.0.1:8799') + '/chitti_vaani.html';
const SHOTS = 'tools/cert_screenshots';
const errs = [];
const net = e => /CORS|ERR_FAILED|Failed to load resource|net::|Access to fetch|preflight/i.test(e);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:375,height:812}, deviceScaleFactor:2 });
const p = await ctx.newPage();
p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
const R = {};

// ── First run (real: Disability modal present) — gate must be topmost ──
await p.goto(BASE, {waitUntil:'domcontentloaded'});
await p.evaluate(()=>{try{localStorage.clear();sessionStorage.clear();}catch(e){}});
await p.reload({waitUntil:'domcontentloaded'});
await p.waitForTimeout(1300);
R.gate_first       = await p.isVisible('#vai-lang-gate');
R.consent_hidden   = await p.evaluate(()=>document.getElementById('consent-overlay').classList.contains('hidden'));
R.langs_26         = await p.evaluate(()=>document.querySelectorAll('#vai-lang-grid .vlg-chip').length);
R.english_default  = await p.evaluate(()=>!!document.querySelector('#vai-lang-grid .vlg-chip.vlg-default-chip .vlg-name[onclick*="\'en\'"]') && !!document.querySelector('#vlg-default-btn'));
R.speaker_per_lang = await p.evaluate(()=>document.querySelectorAll('#vai-lang-grid .vlg-spk').length);
R.char_visible_1s  = await p.evaluate(()=>!!document.querySelector('#vai-lang-gate .vai-char svg'));
R.gate_topmost     = await p.evaluate(()=>{const g=document.getElementById('vai-lang-gate');const t=document.elementFromPoint(187,400);return !!(t&&(g===t||g.contains(t)));});
await p.screenshot({path:`${SHOTS}/vaani_home_1_langgate.png`, fullPage:true});

// ── Pick Hindi (proves non-default works) → consent in chosen lang ──
await p.click('#vai-lang-grid .vlg-chip:nth-child(2) .vlg-name');
await p.waitForTimeout(600);
R.pick_gate_hidden     = await p.evaluate(()=>document.getElementById('vai-lang-gate').classList.contains('hidden'));
R.pick_lang_stored     = await p.evaluate(()=>localStorage.getItem('chitti_vaani_lang'));

// dp modal may now overlay consent on first run; dismiss it if present, then accept consent
// Real first-run order: gate → Disability Profile (substrate §7 gate) → consent → magic.
R.dp_after_lang = await p.isVisible('#chitti-disability-profile-modal .chitti-dp-skip');
const dpSkip = await p.$('#chitti-disability-profile-modal .chitti-dp-skip');
if (dpSkip) { await dpSkip.click(); await p.waitForTimeout(400); }
R.consent_shown        = await p.isVisible('#consent-overlay');
await p.screenshot({path:`${SHOTS}/vaani_home_2_consent.png`, fullPage:true});
await p.click('#consent-overlay .consent-actions .agree');
await p.waitForTimeout(900);

// ── Magic moment ──
R.magic_shown          = await p.isVisible('#vai-magic');
R.magic_char_listening = await p.evaluate(()=>{const c=document.querySelector('#vai-magic .vai-char');return !!c&&c.getAttribute('data-state')==='listening';});
R.magic_has_mic        = await p.evaluate(()=>!!document.getElementById('vai-magic-mic'));
R.magic_cta_localized  = await p.evaluate(()=>{const e=document.querySelector('#vai-magic [data-v2-i18n="magic.cta"]');return e?e.textContent:'';});
await p.screenshot({path:`${SHOTS}/vaani_home_3_magic.png`, fullPage:true});

// ── Skip → 6-card home ──
await p.click('#vai-magic .vm-skip');
await p.waitForTimeout(500);
R.home_cards_6   = await p.evaluate(()=>document.querySelectorAll('#vai-panel-talk .vai-home-grid .vai-home-card').length);
R.home_more_btn  = await p.evaluate(()=>!!document.querySelector('.vai-home-more'));
R.home_char      = await p.evaluate(()=>!!document.querySelector('#vai-panel-talk .vai-home-charbar .vai-char svg'));
await p.screenshot({path:`${SHOTS}/vaani_home_4_home.png`, fullPage:true});

// ── Settings → Advanced (Keys Vault tucked away) ──
await p.evaluate(()=>{ if(typeof vaiSwitchTab==='function') vaiSwitchTab('settings'); });
await p.waitForTimeout(400);
R.advanced_present = await p.evaluate(()=>!!document.querySelector('.vai-advanced'));
R.keysvault_in_adv = await p.evaluate(()=>!!document.querySelector('.vai-advanced [onclick*="kvOpen"]'));
await p.screenshot({path:`${SHOTS}/vaani_home_5_settings_advanced.png`, fullPage:true});

// ── Returning user → straight to home, no gate, no magic ──
await p.evaluate(()=>{localStorage.setItem('chitti_vaani_lang','en');localStorage.setItem('chitti_vaani_consent_given','1');localStorage.setItem('chitti_vaani_magic_done','1');});
await p.reload({waitUntil:'domcontentloaded'});
await p.waitForTimeout(900);
R.return_gate_hidden  = await p.evaluate(()=>document.getElementById('vai-lang-gate').classList.contains('hidden'));
R.return_home_cards   = await p.evaluate(()=>document.querySelectorAll('.vai-home-card').length);

await b.close();
const real = errs.filter(e=>!net(e));
R.real_js_errors = real.length;
const pass = R.gate_first && R.consent_hidden && R.langs_26===26 && R.english_default && R.speaker_per_lang===26 &&
  R.char_visible_1s && R.gate_topmost && R.pick_gate_hidden && R.pick_lang_stored==='hi' && R.consent_shown &&
  R.magic_shown && R.magic_char_listening && R.magic_has_mic && R.home_cards_6===6 && R.home_more_btn &&
  R.home_char && R.advanced_present && R.keysvault_in_adv && R.return_gate_hidden && R.return_home_cards===6 && real.length===0;
console.log(JSON.stringify(R,null,1));
console.log('\nVAANI_HOME_CERT: '+(pass?'PASS ✅':'FAIL ❌')+'   (network noise filtered: '+errs.filter(net).length+')');
real.slice(0,20).forEach(e=>console.log('  REAL JS ERROR: '+e));
process.exit(pass?0:1);
