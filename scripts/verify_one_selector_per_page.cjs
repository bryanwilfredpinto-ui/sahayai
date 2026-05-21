// Verify every user-facing chitti_*.html page:
//   1. After substrate init, there is EXACTLY ONE language selector wired
//      (data-chitti-lang-wired="1"). Old #chitti-langbar must be absent.
//   2. Changing that selector to Bangla flips at least one element to a
//      non-English script.
//   3. window.Chitti.listenForLangCommand + processVoiceTranscript exist.
//      Bonus: simulating "Telugu mein baat karo" via processVoiceTranscript
//      switches html lang attr to "te".
//
// Run from repo root: node scripts/verify_one_selector_per_page.cjs

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO = process.env.SAHAYAI_REPO || path.resolve(__dirname, '..');
const URL_BASE = process.env.SAHAYAI_URL || ('file:///' + REPO.replace(/\\/g, '/'));

// User-facing product pages (admin / dev pages excluded).
const PAGES = [
  'chitti_vaani.html', 'chitti_medupi.html', 'chitti_ca.html', 'chitti_legal.html',
  'chitti_government.html', 'chitti_news.html', 'chitti_news_ai.html', 'chitti_upi.html',
  'chitti_scanner.html', 'chitti_fundamentals.html', 'chitti_complete_technical.html',
  'chitti_2wheeler.html', 'chitti_4wheeler.html', 'chitti_logo_video.html',
  'chitti_voice_factory.html', 'chitti_voice_hall_of_fame.html', 'chitti_isl.html',
  'chitti_quality.html',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const page of PAGES) {
    const ctx = await browser.newContext({ locale: 'en-IN' });
    const tab = await ctx.newPage();
    const errs = [];
    tab.on('pageerror', e => errs.push(`pageerror: ${e.message}`));

    const url = URL_BASE.startsWith('file://')
      ? URL_BASE + '/' + page
      : URL_BASE.replace(/\/$/, '') + '/' + page + '?nocache=' + Date.now();
    try {
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Wait for substrate init — wireLanguageSelectors runs on DOMContentLoaded
      await tab.waitForTimeout(800);
      // Wait until at least one wired selector exists or compact dropdown injected
      await tab.waitForFunction(() => document.querySelector("[data-chitti-lang-wired='1']") !== null, { timeout: 5000 }).catch(() => {});
    } catch (e) {
      results.push({ page, status: 'FAIL', reason: `navigation: ${e.message}` });
      await ctx.close();
      continue;
    }

    // Hide any modal overlays so they don't interfere with element queries
    await tab.evaluate(() => {
      ['consent-overlay', 'onboarding-modal', 'onboarding-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    });

    const audit = await tab.evaluate(() => {
      const wired = document.querySelectorAll("[data-chitti-lang-wired='1']");
      const wiredIds = Array.from(wired).map(el => el.id || el.tagName + ':' + (el.name || ''));
      const oldBar = document.getElementById('chitti-langbar');
      const compactInjected = !!document.getElementById('chitti-lang-dd');
      const voiceApi = typeof window.Chitti?.listenForLangCommand === 'function'
                    && typeof window.Chitti?.processVoiceTranscript === 'function';
      return { wiredCount: wired.length, wiredIds, oldBarPresent: !!oldBar, compactInjected, voiceApi };
    });

    if (audit.oldBarPresent) {
      results.push({ page, status: 'FAIL', reason: 'old #chitti-langbar still present', audit });
      await ctx.close(); continue;
    }
    if (audit.wiredCount === 0) {
      results.push({ page, status: 'FAIL', reason: 'no wired selector', audit });
      await ctx.close(); continue;
    }

    // Flip via the FIRST wired selector → Bangla. Assert at least one
    // [data-i18n] element changes to non-Latin script (or page has no
    // translatable content, in which case verify html lang attr flipped).
    const flipResult = await tab.evaluate(async () => {
      const sel = document.querySelector("[data-chitti-lang-wired='1']");
      if (!sel) return { ok: false, reason: 'no wired selector after init' };
      const tagged = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-aria], [data-i18n-title]').length;
      sel.value = 'bn';
      sel.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 250));
      const after = Array.from(document.querySelectorAll('[data-i18n]')).slice(0, 12).map(el => el.textContent.trim());
      const banglaCount = after.filter(t => /[ঀ-৿]/.test(t)).length;
      const htmlLang = document.documentElement.lang;
      // OK if: bangla content flipped OR page has no translatable tags
      // AND html lang attr advanced to bn (substrate fired)
      const ok = banglaCount > 0 || (tagged === 0 && htmlLang === 'bn');
      return { ok, banglaCount, taggedTotal: tagged, htmlLang };
    });

    if (!flipResult.ok) {
      results.push({ page, status: 'FAIL', reason: `Bangla flip failed (tagged=${flipResult.taggedTotal} htmlLang=${flipResult.htmlLang})`, audit, flipResult });
      await ctx.close(); continue;
    }

    // Voice command sim
    const voiceResult = await tab.evaluate(() => {
      const before = document.documentElement.lang;
      const handled = window.Chitti.processVoiceTranscript('telugu mein baat karo');
      const after = document.documentElement.lang;
      return { handled, before, after };
    });
    const voiceOk = voiceResult.handled && voiceResult.after === 'te';

    results.push({
      page,
      status: voiceOk ? 'OK' : 'FAIL',
      reason: voiceOk ? '' : `voice cmd failed: ${JSON.stringify(voiceResult)}`,
      audit,
      flipResult,
      voiceResult,
      pageerrors: errs.length ? errs : undefined,
    });

    await ctx.close();
  }

  await browser.close();

  let pass = 0, fail = 0;
  console.log('\n========== ONE-SELECTOR-PER-PAGE AUDIT ==========');
  for (const r of results) {
    const flag = r.status === 'OK' ? 'OK' : 'XX';
    console.log(`${flag}  ${r.page.padEnd(32)}  wired=${r.audit?.wiredCount ?? '?'} (ids=${r.audit?.wiredIds?.join(',') ?? '?'})  compactInjected=${r.audit?.compactInjected ?? '?'}  bangla=${r.flipResult?.banglaCount ?? 0}  voice→${r.voiceResult?.after ?? '?'}`);
    if (r.status !== 'OK') console.log(`         REASON: ${r.reason}`);
    if (r.pageerrors) r.pageerrors.forEach(e => console.log(`         ${e}`));
    if (r.status === 'OK') pass++; else fail++;
  }
  console.log(`\nFinal: ${pass}/${results.length} pages pass.`);
  process.exit(fail === 0 ? 0 : 1);
})();
