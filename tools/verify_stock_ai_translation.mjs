// Verify Chitti Stock AI translation guardrail:
//   - Indicator names (RSI/MACD/Roshan/Bollinger/EMA/VWAP) stay English in Telugu + Bengali
//   - Stock tickers (e.g. RELIANCE) stay English
//   - Hero card label "Chitti Stock AI" stays English
//   - SEBI disclaimer translates (it's a UI string)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('tools/verify_stock_ai_out', { recursive: true });

const BASE = 'https://sahayai.in/chitti_complete_technical.html';
const LANGS = [ { code: 'te', name: 'Telugu' }, { code: 'bn', name: 'Bengali' } ];
// Things that MUST stay English (latin chars >= 3 in expected pos)
const KEEP_EN = [ 'RSI', 'MACD', 'Roshan Indicator', 'EMA 20/50/200', 'Bollinger Bands', 'VWAP', 'Supertrend', 'Ichimoku', 'ADX', 'Chitti Stock AI' ];

const browser = await chromium.launch({ headless: true });
for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 414, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    // Switch lang
    const haveSel = await page.$('select#lang-select, select#lang, select[aria-label="Language"]');
    if (!haveSel) { console.log(lang.code, 'NO LANG SELECTOR'); await ctx.close(); continue; }
    await page.selectOption('select#lang-select, select#lang, select[aria-label="Language"]', lang.code);
    await page.waitForTimeout(15000);
    await page.screenshot({ path: `tools/verify_stock_ai_out/${lang.code}.png`, fullPage: false });
    const html = await page.content();
    const found = {};
    for (const k of KEEP_EN) {
      found[k] = html.includes(k);
    }
    // Find any indicator chip in hero
    const heroIndicators = await page.$$eval('.section-card[data-chitti-response="roshan-hero"] [translate="no"]', els => els.map(e => e.textContent.trim()));
    console.log(`\n== ${lang.name} (${lang.code}) ==`);
    console.log('hero translate=no chips:', heroIndicators.slice(0, 12));
    console.log('keep-en presence:', found);
  } catch (e) {
    console.log(lang.code, 'ERROR', e.message.slice(0, 200));
  }
  await ctx.close();
}
await browser.close();
