/* tools/test_lang_translate_deep.mjs — exhaustive CTO test
 * Loads every Chitti page in headless Chrome, switches lang, waits 15s,
 * saves a screenshot, dumps EVERY visible card label found, reports which
 * are still Latin-only (= not translated). Cache-busted with ?t=<ms>.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'https://sahayai.in';
const TEST_LANG = process.argv[2] || 'bn';

const PAGES = [
  { name: 'vaani',        url: '/chitti_vaani.html'        },
  { name: 'medupi',       url: '/chitti_medupi.html'       },
  { name: 'ca',           url: '/chitti_ca.html'           },
  { name: 'legal',        url: '/chitti_legal.html'        },
  { name: 'government',   url: '/chitti_government.html'   },
  { name: 'news',         url: '/chitti_news.html'         },
  { name: 'news_ai',      url: '/chitti_news_ai.html'      },
  { name: 'upi',          url: '/chitti_upi.html'          },
  { name: 'scanner',      url: '/chitti_scanner.html'      },
  { name: '2wheeler',     url: '/chitti_2wheeler.html'     },
  { name: '4wheeler',     url: '/chitti_4wheeler.html'     },
  { name: 'logo_video',   url: '/chitti_logo_video.html'   },
  { name: 'voice_factory',url: '/chitti_voice_factory.html'},
];

const OUTDIR = 'tools/test_translate_out';
mkdirSync(OUTDIR, { recursive: true });

function isMostlyLatin(s) {
  if (!s) return false;
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (trimmed.length < 3) return false;
  // Brand-like words that legitimately stay Latin
  if (/^(PDF|QR|UPI|GST|RBI|SEBI|API|HTML|CSS|JS|JSON|LIVE|HD|AI|YouTube|WhatsApp|Chitti|Vaani|MedUPI|SMS)$/i.test(trimmed)) return false;
  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  const total = trimmed.replace(/[\s\d\W]/g, '').length;
  return latin >= 3 && latin >= total * 0.7;
}

async function testPage(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('JS: ' + e.message));
  let runtimeFired = false;
  await page.exposeFunction('__runtimeFired', () => { runtimeFired = true; });

  try {
    await page.goto(BASE + p.url + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Hook so we know whether our substrates loaded
    await page.evaluate(() => {
      const log = () => { try { window.__runtimeFired(); } catch(e){} };
      document.addEventListener('chitti:langchange', log);
      window.addEventListener('chitti:langchange', log);
    });
    await page.waitForTimeout(4000); // substrates boot

    const before = await page.evaluate(() => ({
      hasLangSelect: !!document.querySelector('select#lang-select, select#lang, select[aria-label="Language"]'),
      hasLangRuntime: !!window.Chitti?.langRuntime,
      hasCardWidget: !!window.Chitti?.cardWidget,
      currentLang: document.documentElement.lang || 'en',
      cardCount: document.querySelectorAll('.pro-card, .scan-action, .feature-card, .action-card, [data-chitti-card]').length
    }));

    if (!before.hasLangSelect) {
      await ctx.close();
      return { name: p.name, ...before, verdict: '⚪ no lang-select' };
    }

    await page.selectOption('select#lang-select, select#lang, select[aria-label="Language"]', TEST_LANG);
    await page.waitForTimeout(15000); // 300ms debounce + LLM batches

    const after = await page.evaluate((sel) => {
      const all = Array.from(document.querySelectorAll('.pro-card, .scan-action, .feature-card, .action-card, [data-chitti-card]'));
      const labels = [];
      all.slice(0, 8).forEach(card => {
        const lbl = card.querySelector('.lbl, .label, .name, .title, h3, h4');
        if (lbl) labels.push(lbl.textContent.trim());
      });
      return {
        currentLang: document.documentElement.lang || 'en',
        runtimeCalls: window.Chitti?.langRuntime?.sessionCalls?.() ?? null,
        labels
      };
    });

    let stillEnglish = 0;
    after.labels.forEach(s => { if (isMostlyLatin(s)) stillEnglish++; });
    const verdict = after.labels.length === 0
      ? '⚪ no cards detected'
      : stillEnglish === 0
        ? `✅ all ${after.labels.length} translated`
        : `🔴 ${stillEnglish}/${after.labels.length} still ENGLISH`;

    // Save screenshot
    await page.screenshot({ path: `${OUTDIR}/${p.name}_${TEST_LANG}.png`, fullPage: false });

    await ctx.close();
    return {
      name: p.name,
      ...before,
      ...after,
      runtimeFired,
      stillEnglish,
      verdict,
      errors: errors.slice(0, 3)
    };
  } catch (e) {
    await ctx.close();
    return { name: p.name, verdict: 'ERR ' + e.message.slice(0,80), errors };
  }
}

(async () => {
  console.log(`\n=== CTO deep translation test · lang: ${TEST_LANG} · cache-busted ===\n`);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const p of PAGES) {
    const r = await testPage(browser, p);
    results.push(r);
    console.log(`──── ${r.name.padEnd(15)} ${r.verdict}`);
    if (r.hasLangRuntime !== undefined)
      console.log(`     substrates: langRuntime=${r.hasLangRuntime} cardWidget=${r.hasCardWidget} runtimeCalls=${r.runtimeCalls} runtimeFired=${r.runtimeFired}`);
    if (r.labels?.length) console.log(`     labels: ${JSON.stringify(r.labels)}`);
    if (r.errors?.length) console.log(`     errors: ${r.errors.join(' | ')}`);
  }
  await browser.close();
  writeFileSync(`${OUTDIR}/result_${TEST_LANG}.json`, JSON.stringify(results, null, 2));
  console.log(`\nScreenshots: ${OUTDIR}/<name>_${TEST_LANG}.png`);
  console.log(`Result JSON: ${OUTDIR}/result_${TEST_LANG}.json\n`);
})();
