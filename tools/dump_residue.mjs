// Dump unique English residue per page after switching to Telugu.
// Helps see exactly what strings the bake missed.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const page_name = process.argv[2] || "chitti_medupi.html";
const limit = parseInt(process.argv[3] || "60", 10);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const tab = await ctx.newPage();
await tab.goto(pathToFileURL(join(ROOT, page_name)).href, { waitUntil: "domcontentloaded" });
await tab.waitForTimeout(2000);
await tab.evaluate(() => window.Chitti.lang.set("te"));
await tab.waitForTimeout(2500);

const out = await tab.evaluate(() => {
  const seen = new Map();
  const skip = new Set(["SCRIPT","STYLE","CODE","PRE","TEXTAREA","NOSCRIPT","OPTION"]);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      let p = node.parentElement;
      while (p) {
        if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        const cs = getComputedStyle(p);
        if (cs.display === "none" || cs.visibility === "hidden") return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      const t = (node.nodeValue || "").trim();
      if (!t || !/[A-Za-z]{3,}/.test(t)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = w.nextNode())) {
    const t = node.nodeValue.replace(/\s+/g, " ").trim();
    const m = t.match(/[A-Za-z]+(?:[\s.,;:'\-]+[A-Za-z]+)*/g);
    if (!m) continue;
    for (const r of m) {
      const rr = r.trim();
      if (rr.length < 3) continue;
      if (/^(Chitti|chitti|MedUPI|Vaani|Sahayai|sahayai|Phase|AI|UPI|RBI|GST|TDS|in|RC|FSSAI|FastTag|FASTag|NPPA|Android|WhatsApp|Gmail|OAuth|SMS|PIN|NPCI|TRAI|DPDP|UNDO|sire|Quality|Last|Audit|Indian|HIGH|MEDIUM|LOW|RISK|html|body|http|https|app|com|net|org|kg|km|cm|mm|FMCG|FSSAI|BIS|DAP)$/i.test(rr)) continue;
      if (!seen.has(rr)) {
        seen.set(rr, { parent: (node.parentElement && node.parentElement.className && node.parentElement.className.slice(0, 40)) || "", node: t.slice(0, 100) });
      }
    }
  }
  // Also check aria-label / placeholder / title attribute residue
  const attrs = [];
  document.querySelectorAll("[aria-label],[placeholder],[title]").forEach(el => {
    ["aria-label","placeholder","title"].forEach(a => {
      const v = el.getAttribute(a);
      if (!v) return;
      const m = v.match(/[A-Za-z]{3,}/g);
      if (!m) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none") return;
      attrs.push({ attr: a, val: v.slice(0, 80), class: (el.className && String(el.className).slice(0, 30)) || el.tagName });
    });
  });
  return { texts: [...seen.entries()].slice(0, 30), attrs: attrs.slice(0, 30) };
});

console.log(`### text nodes (${out.texts.length} unique)`);
for (const [s, info] of out.texts) {
  console.log(`  ${JSON.stringify(s).slice(0, 50)}  parent=${info.parent}  context=${JSON.stringify(info.node).slice(0, 100)}`);
}
console.log(`### attributes (${out.attrs.length} sampled)`);
for (const a of out.attrs.slice(0, 25)) {
  console.log(`  ${a.attr}="${a.val}"  on ${a.class}`);
}
await browser.close();
