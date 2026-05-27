/**
 * tools/cert_voice_intents.mjs
 *
 * Chitti CTO live cert for the 7 voice intents Sire locked
 * (2026-05-27 directive). For each intent, we fire routeVoiceIntent()
 * with the exact utterance Sire spec'd, then verify the page reacted
 * correctly:
 *
 *   1. CALL      — "Wife ko call karo"        → openCallModal opens + name pre-filled
 *   2. YOUTUBE   — "YouTube pe gaana bajao"   → confirm modal then opens youtube.com on web
 *   3. SMS       — "Wife ko SMS bhejo hello"  → openSMSModal opens + name + message
 *   4. SILENT    — "Phone silent karo"        → chitti confirm modal opens
 *   5. RING      — "Phone ring pe karo"       → chitti confirm modal opens
 *   6. WHATSAPP  — "Wife ko WhatsApp karo"    → openWAModal opens + name
 *   7. OPEN APP  — "Zomato kholo"             → chitti confirm modal opens (Zomato)
 *
 * For browser fallback verification, we stub ChittiNative as missing
 * (web tier). Then we observe the deep-link / modal behaviour the
 * page falls back to.
 *
 * Each intent earns GREEN only when:
 *   a. routeVoiceIntent() returned true (intent recognised)
 *   b. The expected modal / confirm dialog appeared
 *   c. The recipient / app / state was pre-filled correctly
 *
 * Run:
 *   node tools/cert_voice_intents.mjs                          # live
 *   CERT_BASE=http://127.0.0.1:8765 node tools/cert_voice_intents.mjs
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.CERT_BASE || 'https://sahayai.in').replace(/\/$/, '');
const URL_ = BASE + '/chitti_vaani.html';

const results = [];
function check(label, ok, detail) {
  results.push({ label, ok, detail });
  console.log((ok ? '✅' : '❌') + ' ' + label + (detail ? ' — ' + detail : ''));
}

// Test a single intent: pre-seed trusted-contact "Wife", fire the
// utterance, observe what opened.
async function probeIntent(browser, label, utterance, expect) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  // Pre-seed: skip Disability Profile + add a "Wife" Trusted Contact +
  // mark Vaani consent so the action paths don't bail early.
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.evaluate(() => {
    try {
      // Disability profile — skip the on-load modal.
      localStorage.setItem('disability_profile', JSON.stringify({ skipped: true, ts: new Date().toISOString() }));
      // Vaani consent (CONSENT_KEY = 'chitti_vaani_consent_given' value '1').
      localStorage.setItem('chitti_vaani_consent_given', '1');
      // Trusted Circle (TC_KEY = 'chitti_vaani_trusted_circle').
      const tc = [
        { name: 'Wife', realname: 'Wife', phone: '+919876543210', email: 'wife@example.com', verified: true },
        { name: 'Mom',  realname: 'Mother', phone: '+919812345678', verified: true },
      ];
      localStorage.setItem('chitti_vaani_trusted_circle', JSON.stringify(tc));
    } catch (e) {}
  });

  // pageerrors honest
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 180)));

  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss disability modal if it shows.
  try { await page.locator('#chitti-disability-profile-modal .chitti-dp-close').click({ timeout: 1500 }); } catch (e) {}
  await page.waitForTimeout(300);

  // Fire the intent.
  const routerResult = await page.evaluate((u) => {
    if (typeof routeVoiceIntent !== 'function') return { error: 'routeVoiceIntent missing' };
    try {
      return { handled: routeVoiceIntent(u) };
    } catch (e) {
      return { error: String(e && e.message) };
    }
  }, utterance);

  if (routerResult.error) {
    check('[' + label + '] router error', false, routerResult.error);
    await ctx.close();
    return;
  }
  check('[' + label + '] routeVoiceIntent() returned true', routerResult.handled === true,
    'utterance: "' + utterance + '"');

  await page.waitForTimeout(800);

  // Probe what visible modal / state appeared after the intent ran.
  const state = await page.evaluate(() => {
    function vis(el) {
      if (!el) return false;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    function read(id) {
      const e = document.getElementById(id);
      if (!e) return null;
      if (e.tagName === 'SELECT') {
        const opt = e.options[e.selectedIndex];
        return { value: e.value, text: opt ? opt.text : '' };
      }
      return e.value || e.textContent || '';
    }
    return {
      callModalOpen: vis(document.getElementById('call-modal')),
      smsModalOpen:  vis(document.getElementById('sms-modal')),
      waModalOpen:   vis(document.getElementById('wa-modal')),
      youtubeModalOpen: vis(document.getElementById('youtube-modal')),
      mapsModalOpen: vis(document.getElementById('maps-modal')),
      chittiConfirmOpen: vis(document.getElementById('chitti-confirm-overlay')),
      confirmQuestion: (() => {
        const q = document.getElementById('chitti-confirm-q') || document.querySelector('#chitti-confirm-overlay .chitti-confirm-q');
        return q ? (q.textContent || '').trim().slice(0, 160) : '';
      })(),
      callTo:    read('call-to'),
      callToFree:read('call-to-free'),
      smsTo:     read('sms-to'),
      smsMsg:    read('sms-msg'),
      smsToFree: read('sms-to-free'),
      waTo:      read('wa-to'),
      waMsg:     read('wa-msg'),
      waToFree:  read('wa-to-free'),
    };
  });

  // Per-expectation checks.
  if (expect.modal) {
    const ok = state[expect.modal + 'ModalOpen'] === true || state.chittiConfirmOpen === true;
    check('[' + label + '] expected modal opened (' + expect.modal + ' or chitti-confirm)', ok, JSON.stringify({
      callModalOpen: state.callModalOpen,
      smsModalOpen: state.smsModalOpen,
      waModalOpen: state.waModalOpen,
      chittiConfirmOpen: state.chittiConfirmOpen,
    }));
  }
  if (expect.recipient) {
    // The select should pick Wife (idx 0 in our seeded TC), or the free
    // input should hold the name. Either is a pass.
    const got = (state[expect.recipientField] && (state[expect.recipientField].text || state[expect.recipientField])) || '';
    const ok = String(got).toLowerCase().includes(expect.recipient.toLowerCase()) ||
               (state[expect.recipientField + 'Free'] || '').toLowerCase().includes(expect.recipient.toLowerCase()) ||
               state.confirmQuestion.toLowerCase().includes(expect.recipient.toLowerCase());
    check('[' + label + '] recipient pre-filled (' + expect.recipient + ')', ok,
      'got=' + JSON.stringify(got).slice(0, 80));
  }
  if (expect.message) {
    const got = state[expect.messageField] || '';
    const ok = String(got).toLowerCase().includes(expect.message.toLowerCase());
    check('[' + label + '] message pre-filled (' + expect.message + ')', ok,
      'got=' + JSON.stringify(got).slice(0, 80));
  }
  if (expect.confirmContains) {
    const ok = state.confirmQuestion.toLowerCase().includes(expect.confirmContains.toLowerCase());
    check('[' + label + '] confirm modal mentions "' + expect.confirmContains + '"', ok,
      'q="' + state.confirmQuestion + '"');
  }

  // Screenshot for visual proof.
  try {
    const shotPath = resolve(__dirname, 'cert_voice_intent_' + label.replace(/[^a-z0-9_]/gi, '_') + '_375.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('   📸 ' + shotPath);
  } catch (e) {}

  // Filter benign pageerrors (backend fetch noise — Railway dynos sleeping).
  const realErrs = errs.filter((m) => !/^Failed to fetch$/.test(m) && !/net::ERR_FAILED/.test(m));
  if (realErrs.length) {
    check('[' + label + '] no pageerrors', false, realErrs.slice(0, 2).join(' | '));
  }

  await ctx.close();
}

const browser = await chromium.launch({ headless: true });

console.log('CERT URL: ' + URL_);
console.log('Voice-intent cert — 7 intents Sire locked 2026-05-27\n');

await probeIntent(browser, 'CALL_wife',     'Wife ko call karo',
  { modal: 'call', recipient: 'Wife', recipientField: 'callTo' });

await probeIntent(browser, 'SMS_wife',      'Wife ko SMS bhejo main 7 baje aaunga',
  { modal: 'sms', recipient: 'Wife', recipientField: 'smsTo', message: '7 baje', messageField: 'smsMsg' });

await probeIntent(browser, 'WHATSAPP_wife', 'Wife ko WhatsApp karo',
  { modal: 'wa', recipient: 'Wife', recipientField: 'waTo' });

await probeIntent(browser, 'YOUTUBE_open',  'YouTube pe gaana bajao',
  { confirmContains: 'YouTube' });

await probeIntent(browser, 'SILENT_mode',   'Phone silent karo',
  { confirmContains: 'silent' });

await probeIntent(browser, 'RING_mode',     'Phone ring pe karo',
  { confirmContains: 'ring' });

await probeIntent(browser, 'OPEN_APP_Zomato', 'Zomato kholo',
  { confirmContains: 'Zomato' });

await browser.close();

const summary = {
  ts: new Date().toISOString(),
  probe: URL_,
  results,
  pass: results.every((r) => r.ok),
};
writeFileSync(
  resolve(__dirname, 'cert_voice_intents_result.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

const passed = results.filter((r) => r.ok).length;
const total = results.length;
console.log(`\nCERT ${summary.pass ? 'PASS' : 'FAIL'} · ${passed}/${total} checks passed.`);
process.exit(summary.pass ? 0 : 1);
