// Capture the exact trimmed text-node values that contain residual English
// after switching vaani to Telugu. Helps map W keys to what the DOM actually
// holds (which may be emoji-split fragments, not the full label).
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

await page.evaluate(() => {
  const s = document.getElementById("lang-select");
  s.value = "te";
  s.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.waitForTimeout(1600);

const data = await page.evaluate(() => {
  const skipTags = new Set(["SCRIPT","STYLE","CODE","PRE","TEXTAREA","NOSCRIPT","OPTION"]);
  const seen = new Map();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      let p = n.parentElement;
      while (p) {
        if (skipTags.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        const cs = getComputedStyle(p);
        if (cs.display === "none" || cs.visibility === "hidden") return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = w.nextNode())) {
    const raw = (node.nodeValue || "");
    const trim = raw.replace(/\s+/g, " ").trim();
    if (!trim) continue;
    if (!/[A-Za-z]/.test(trim)) continue;
    // Skip pure brand tokens
    if (/^(Chitti|chitti|Vaani|vaani|AI|UPI|RBI|GST|TDS|CO2|NPCI|TRAI|DPDP|MedUPI|WhatsApp|Gmail|OAuth|UNDO|Sahayai|Android|Phase|2|26|RC|PIN|SMS|HTTP|HTTPS|sahayai\.in|in)$/.test(trim)) continue;
    // Skip mixed Devanagari+Latin if the Latin is just a brand
    const latin = trim.match(/[A-Za-z][A-Za-z ]{2,}/g);
    if (!latin) continue;
    for (const r of latin) {
      const rr = r.trim();
      if (rr.length < 3) continue;
      if (/^(Chitti|chitti|Vaani|vaani|AI|UPI|RBI|GST|TDS|CO2|NPCI|TRAI|DPDP|MedUPI|WhatsApp|Gmail|OAuth|UNDO|Sahayai|Android|Phase|sahayai|in)$/.test(rr)) continue;
      const key = trim;
      if (!seen.has(key)) seen.set(key, { fragment: rr, ancestorClass: (node.parentElement && node.parentElement.className) || "" });
    }
  }
  return [...seen.entries()];
});

console.log("Trimmed text nodes containing residual English:");
for (const [trim, info] of data.slice(0, 80)) {
  console.log(`  fragment="${info.fragment}" | parentClass="${info.ancestorClass.slice(0, 60)}" | textNode=${JSON.stringify(trim).slice(0, 120)}`);
}
console.log("\nTotal unique:", data.length);

await browser.close();
