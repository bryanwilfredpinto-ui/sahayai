// Quick probe — load vaani, check what's wired up.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(join(ROOT, "chitti_vaani.html")).href;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("console", msg => console.log("console:", msg.type(), msg.text().slice(0, 200)));
page.on("pageerror", e => console.log("pageerror:", e.message));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const state = await page.evaluate(() => {
  return {
    chittiLangPresent: !!(window.Chitti && window.Chitti.lang),
    chittiLangExtend: typeof window.Chitti?.lang?.extend,
    chittiA11yLoaded: !!window.__chittiA11yLoaded,
    a11yW: window.Chitti?.a11y?.W ? Object.keys(window.Chitti.a11y.W).slice(0, 5) : null,
    // Probe: did "💬 Feedback for:" get into T?
    lookupTest: window.Chitti?.lang?.lookupText ? window.Chitti.lang.lookupText('💬 Feedback for:', 'te') : null,
    lookupTestNoEmoji: window.Chitti?.lang?.lookupText ? window.Chitti.lang.lookupText('Feedback for:', 'te') : null,
    lookupTalkChitti: window.Chitti?.lang?.lookupText ? window.Chitti.lang.lookupText('🎙️ Talk to Chitti', 'te') : null,
  };
});
console.log("state:", JSON.stringify(state, null, 2));

// Switch to Telugu, check widget bar text
await page.evaluate(() => window.Chitti.lang.set('te'));
await page.waitForTimeout(1500);

const bars = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.chitti-fb-box-bar').forEach((bar, i) => {
    if (i > 4) return;
    const label = bar.querySelector('.chitti-fb-bbtn-label');
    if (!label) return;
    out.push(label.innerText.replace(/\s+/g, ' '));
  });
  return out;
});
console.log("widget bar samples after Telugu switch:");
for (const b of bars) console.log("  " + b);

await browser.close();
