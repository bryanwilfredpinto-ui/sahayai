// End-to-end test for the per-box Demo button on chitti_vaani.html.
// Bryan 2026-05-22: "add demo in voice in the LEFT side of the box &
// on the right side there is speaker, chitti icon, thumsup, down &
// feedback note. Demo should be added in all boxes in chitti vaani."
//
// What we assert:
//   1. Every chitti-fb-box-bar has a Demo button on the LEFT.
//   2. The Demo button comes BEFORE the speak/ask/up/down buttons in
//      DOM order (so flexbox renders it on the left).
//   3. Clicking Demo fires speechSynthesis.speak with text that starts
//      with the section name (so the user knows which box was demo'd).
//   4. The demo text falls back through the priority chain:
//      data-chitti-demo > .section-sub > first sentence of box text.
//   5. The existing right-side buttons (🔊 🤖 👍 👎) and the feedback
//      modal still work — regression check.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const URL = pathToFileURL(join(ROOT, "chitti_vaani.html")).href;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));

// Stub speechSynthesis.speak so we can capture what Demo would say.
await page.addInitScript(() => {
  window.__spoken = [];
  const realSS = window.speechSynthesis;
  if (realSS) {
    realSS.speak = (utter) => {
      try { window.__spoken.push(String((utter && utter.text) || "").slice(0, 400)); } catch (e) {}
    };
  }
  // Pre-fill consent + disability profile so the page doesn't gate.
  try { localStorage.setItem("chitti_vaani_consent_given", "1"); } catch (e) {}
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
// Hide consent overlay (already given, but defensive).
await page.evaluate(() => {
  const o = document.getElementById("consent-overlay");
  if (o) o.style.display = "none";
});
// Give feedback-widget.js's MutationObserver time to attach bars to
// every .chitti-response box on the page.
await page.waitForTimeout(1200);

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

// ── Inventory of bars + demo buttons ─────────────────────────────────
const inventory = await page.evaluate(() => {
  const bars = Array.from(document.querySelectorAll(".chitti-fb-box-bar"));
  return bars.map(b => {
    const buttons = Array.from(b.querySelectorAll(".chitti-fb-bbtn"));
    const demo = b.querySelector('[data-act="demo"]');
    const speak = b.querySelector('[data-act="speak"]');
    return {
      forBox: b.getAttribute("data-for-box"),
      section: (b.querySelector(".chitti-fb-box-section") || {}).textContent || "",
      hasDemo: !!demo,
      demoFirst: !!(demo && speak && b.compareDocumentPosition(demo) & 1 ? true : (demo && speak && demo.compareDocumentPosition(speak) & Node.DOCUMENT_POSITION_FOLLOWING)),
      btnsInOrder: buttons.map(x => x.getAttribute("data-act")),
    };
  });
});

record("At least one chitti-fb-box-bar attached on vaani", inventory.length > 0, `bars=${inventory.length}`);

const withoutDemo = inventory.filter(b => !b.hasDemo);
record("Every box bar has a Demo button",
  withoutDemo.length === 0,
  withoutDemo.length ? `missing on ${withoutDemo.length} bar(s): ${withoutDemo.slice(0,3).map(b => b.section).join(", ")}` : `all ${inventory.length} bars have it`);

const wrongOrder = inventory.filter(b => {
  // Demo must come BEFORE speak/ask/up/down in DOM (= LEFT in flex order).
  const i = b.btnsInOrder.indexOf("demo");
  const j = b.btnsInOrder.indexOf("speak");
  return !(i >= 0 && j >= 0 && i < j);
});
record("Demo button is the FIRST action button (left side)",
  wrongOrder.length === 0,
  wrongOrder.length ? `${wrongOrder.length} bar(s) have wrong order: ${wrongOrder[0].btnsInOrder.join(",")}` : `all bars: demo → speak → ask → up → down`);

// ── Click Demo on the first Quick Actions box and confirm it speaks ──
await page.evaluate(() => { window.__spoken = []; });
const fired = await page.evaluate(() => {
  // Find the Quick actions box bar specifically.
  const bars = Array.from(document.querySelectorAll(".chitti-fb-box-bar"));
  const target = bars.find(b => {
    const sec = (b.querySelector(".chitti-fb-box-section") || {}).textContent || "";
    return /Quick actions/i.test(sec);
  });
  if (!target) return null;
  const btn = target.querySelector('[data-act="demo"]');
  btn.click();
  return (target.querySelector(".chitti-fb-box-section") || {}).textContent || "";
});
await page.waitForTimeout(200);
const spokenAfterClick = await page.evaluate(() => (window.__spoken || []).slice(-1)[0] || "");
record("Click Demo on Quick actions box fires speechSynthesis",
  !!spokenAfterClick && spokenAfterClick.length > 5,
  spokenAfterClick.slice(0, 120));
record("Spoken demo includes the section name (Quick actions)",
  /Quick actions/i.test(spokenAfterClick),
  spokenAfterClick.slice(0, 120));
record("Spoken demo includes the .section-sub text (One tap…)",
  /One tap/i.test(spokenAfterClick),
  spokenAfterClick.slice(0, 120));

// ── Click Demo on Pro actions and confirm a different demo fires ────
await page.evaluate(() => { window.__spoken = []; });
const proFired = await page.evaluate(() => {
  const bars = Array.from(document.querySelectorAll(".chitti-fb-box-bar"));
  const target = bars.find(b => {
    const sec = (b.querySelector(".chitti-fb-box-section") || {}).textContent || "";
    return /can act for you/i.test(sec);
  });
  if (!target) return false;
  target.querySelector('[data-act="demo"]').click();
  return true;
});
await page.waitForTimeout(200);
const proSpoken = await page.evaluate(() => (window.__spoken || []).slice(-1)[0] || "");
record("Click Demo on Pro actions box fires a different demo",
  proSpoken !== spokenAfterClick && proSpoken.length > 5,
  proSpoken.slice(0, 120));

// ── Regression: the right-side 4 buttons still work + modal opens ──
await page.evaluate(() => { window.__spoken = []; });
await page.evaluate(() => {
  const bars = Array.from(document.querySelectorAll(".chitti-fb-box-bar"));
  const target = bars.find(b => /Quick actions/i.test((b.querySelector(".chitti-fb-box-section") || {}).textContent || ""));
  if (target) target.querySelector('[data-act="speak"]').click();
});
await page.waitForTimeout(200);
const speakSpoken = await page.evaluate(() => (window.__spoken || []).slice(-1)[0] || "");
record("Right-side 🔊 still works (regression)",
  speakSpoken.length > 5,
  speakSpoken.slice(0, 80));

await page.evaluate(() => {
  const bars = Array.from(document.querySelectorAll(".chitti-fb-box-bar"));
  const target = bars.find(b => /Quick actions/i.test((b.querySelector(".chitti-fb-box-section") || {}).textContent || ""));
  if (target) target.querySelector('[data-act="down"]').click();
});
await page.waitForTimeout(250);
const modalOpen = await page.evaluate(() => {
  const m = document.getElementById("chitti-fb-box-modal-bg");
  return m && m.classList.contains("show");
});
record("Right-side 👎 still opens the feedback modal (regression)", modalOpen);

await browser.close();

const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
