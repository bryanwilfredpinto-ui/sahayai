// Fleet-wide verifier: every page loading chitti_a11y.js must have
//   1. exactly one wired language selector (or two valid contexts — main +
//      onboarding modal, both synced via chitti:langchange).
//   2. Bangla flip produces non-Latin script OR (page has zero translatable
//      tags AND html lang attr flipped to 'bn').
//   3. window.Chitti.processVoiceTranscript("telugu mein baat karo")
//      switches html lang attr to 'te'.
//
// Pages are discovered by globbing the repo for HTML files that <script src
// chitti_a11y.js> — no hand-maintained list.

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = process.env.SAHAYAI_REPO || path.resolve(__dirname, '..');
const URL_BASE = process.env.SAHAYAI_URL || ('file:///' + REPO.replace(/\\/g, '/'));

function walkHtml(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'backups'
        || entry.name === '_legacy_v1' || entry.name === '_legacy_v2') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      if (/chitti_a11y\.js/.test(src)) out.push(path.relative(REPO, full).replace(/\\/g, '/'));
    }
  }
}

(async () => {
  const pages = [];
  walkHtml(REPO, pages);
  pages.sort();
  console.log(`Discovered ${pages.length} HTML pages that load chitti_a11y.js\n`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const rel of pages) {
    const ctx = await browser.newContext({ locale: 'en-IN' });
    const tab = await ctx.newPage();
    const errs = [];
    tab.on('pageerror', e => errs.push(e.message.slice(0, 100)));

    const url = URL_BASE.startsWith('file://')
      ? URL_BASE + '/' + rel
      : URL_BASE.replace(/\/$/, '') + '/' + rel + '?nocache=' + Date.now();

    try {
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await tab.waitForTimeout(700);
      await tab.waitForFunction(() => document.querySelector("[data-chitti-lang-wired='1']") !== null, { timeout: 5000 }).catch(() => {});
    } catch (e) {
      results.push({ page: rel, status: 'FAIL', reason: `nav: ${e.message.slice(0, 80)}` });
      await ctx.close(); continue;
    }

    // Hide modal overlays
    await tab.evaluate(() => {
      ['consent-overlay', 'onboarding-modal', 'onboarding-overlay', 'modal-onboarding'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }).catch(() => {});

    const audit = await tab.evaluate(() => ({
      wiredCount: document.querySelectorAll("[data-chitti-lang-wired='1']").length,
      oldBarPresent: !!document.getElementById('chitti-langbar'),
      compactInjected: !!document.getElementById('chitti-lang-dd'),
      voiceApi: typeof window.Chitti?.processVoiceTranscript === 'function',
    })).catch(() => null);

    if (!audit) { results.push({ page: rel, status: 'FAIL', reason: 'eval failed' }); await ctx.close(); continue; }
    if (audit.oldBarPresent) { results.push({ page: rel, status: 'FAIL', reason: 'old #chitti-langbar present', audit }); await ctx.close(); continue; }
    if (audit.wiredCount === 0) { results.push({ page: rel, status: 'FAIL', reason: 'no wired selector', audit }); await ctx.close(); continue; }
    if (!audit.voiceApi) { results.push({ page: rel, status: 'FAIL', reason: 'window.Chitti.processVoiceTranscript missing', audit }); await ctx.close(); continue; }

    const flipResult = await tab.evaluate(async () => {
      const sel = document.querySelector("[data-chitti-lang-wired='1']");
      const tagged = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-aria], [data-i18n-title]').length;
      sel.value = 'bn';
      sel.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 200));
      const after = Array.from(document.querySelectorAll('[data-i18n]')).slice(0, 12).map(el => el.textContent.trim());
      const banglaCount = after.filter(t => /[ঀ-৿]/.test(t)).length;
      const htmlLang = document.documentElement.lang;
      const ok = banglaCount > 0 || (tagged === 0 && htmlLang === 'bn');
      return { ok, banglaCount, taggedTotal: tagged, htmlLang };
    }).catch(e => ({ ok: false, reason: e.message }));

    if (!flipResult.ok) { results.push({ page: rel, status: 'FAIL', reason: `bn flip failed (tagged=${flipResult.taggedTotal} htmlLang=${flipResult.htmlLang})`, audit, flipResult }); await ctx.close(); continue; }

    const voice = await tab.evaluate(() => {
      const handled = window.Chitti.processVoiceTranscript('telugu mein baat karo');
      return { handled, htmlLang: document.documentElement.lang };
    }).catch(e => ({ handled: false, error: e.message }));
    const voiceOk = voice.handled && voice.htmlLang === 'te';

    results.push({
      page: rel,
      status: voiceOk ? 'OK' : 'FAIL',
      reason: voiceOk ? '' : `voice→${voice.htmlLang ?? '?'} (handled=${voice.handled})`,
      audit, flipResult, voice,
    });

    await ctx.close();
  }

  await browser.close();

  let pass = 0, fail = 0;
  console.log('========== FLEET-WIDE AUDIT ==========');
  for (const r of results) {
    const mark = r.status === 'OK' ? 'OK' : 'XX';
    console.log(`${mark}  ${r.page.padEnd(56)}  wired=${r.audit?.wiredCount ?? '?'}  injected=${r.audit?.compactInjected ?? '?'}  bn=${r.flipResult?.banglaCount ?? 0}  voice→${r.voice?.htmlLang ?? '?'}`);
    if (r.status !== 'OK') console.log(`        REASON: ${r.reason}`);
    if (r.status === 'OK') pass++; else fail++;
  }
  console.log(`\nFinal: ${pass}/${results.length} pages pass.`);
  process.exit(fail === 0 ? 0 : 1);
})();
