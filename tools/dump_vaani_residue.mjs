// Capture every visible English text node on chitti_vaani.html after the
// user switches to Telugu. Helps figure out exactly which strings the
// substrate misses so they can be patched in chitti_a11y.js.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(join(ROOT, "chitti_vaani.html")).href;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

// Switch to Telugu
await page.evaluate(() => {
  const s = document.getElementById("lang-select");
  s.value = "te";
  s.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.waitForTimeout(1600);

const englishRuns = await page.evaluate(() => {
  // Walk every visible text node, collect runs that match A-Z [A-Za-z]+ tokens
  // Skip script/style/code/pre/textarea
  const skipTags = new Set(["SCRIPT","STYLE","CODE","PRE","TEXTAREA","NOSCRIPT"]);
  const out = [];
  const seen = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      let p = n.parentElement;
      while (p) {
        if (skipTags.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.tagName === "OPTION") return NodeFilter.FILTER_REJECT;
        if (getComputedStyle(p).display === "none" || getComputedStyle(p).visibility === "hidden") return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = w.nextNode())) {
    const t = (node.nodeValue || "").trim();
    if (!t) continue;
    // Match runs of 3+ English letters (Latin), discarding pure numbers/punct
    const m = t.match(/[A-Za-z][A-Za-z ]{2,}/g);
    if (!m) continue;
    for (const run of m) {
      const r = run.trim();
      if (r.length < 3) continue;
      // Allowed Latin exceptions: brand tokens, units, emails
      if (/^(Chitti|chitti|Vaani|vaani|AI|UPI|RBI|GST|TDS|CO2|NSE|BSE|HTTP|HTTPS|RC|ITR|PWD|SMS|API|EN|HI|app|sahayai|ms|MB|KB|GB|kg|km|cm|mm|m|s|seconds?|days?|years?|months?|FASTag|PUC|NPS|ULIP|FD|SIP|DEMAT|NRE|NRO|RIA|ID|UID|FAQ|TOC|WHO|ISL|RSS|XML|JSON|HTML|CSS|JS|TS|UX|UI|OS|MIT)$/.test(r)) continue;
      if (seen.has(r)) continue;
      seen.add(r);
      out.push(r);
      if (out.length > 200) break;
    }
    if (out.length > 200) break;
  }
  return out;
});

console.log("English residue after Telugu switch:");
for (const e of englishRuns) console.log("  " + e);
console.log("\nTotal unique residue:", englishRuns.length);

await browser.close();
