// Tight per-page audit for the three pages Bryan asked about:
// 2wheeler, 4wheeler, news_ai. Confirms QR + lang select + box-bar
// attachment + Demo button per box.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PAGES = [
  "chitti_2wheeler.html",
  "chitti_4wheeler.html",
  "chitti_news_ai.html",
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

// Stub speechSynthesis + speech recognition + fetch so the page doesn't
// hang or 404 when the box widget tries to ping the backend.
await ctx.addInitScript(() => {
  window.__spoken = [];
  if (window.speechSynthesis) {
    window.speechSynthesis.speak = (u) => { try { window.__spoken.push(String((u && u.text) || "").slice(0, 200)); } catch (e) {} };
  }
  function Fake() { this.lang = "en-IN"; }
  Fake.prototype.start = function () { var s = this; setTimeout(() => s.onerror && s.onerror({ error: "no-speech" }), 30); };
  Fake.prototype.stop = function () {};
  window.SpeechRecognition = Fake; window.webkitSpeechRecognition = Fake;
  const realFetch = window.fetch;
  window.fetch = (url, opts) => Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
  // Pre-set consent + onboarding so first-paint isn't blocked.
  try {
    localStorage.setItem("chitti_vaani_consent_given", "1");
    localStorage.setItem("chitti_news_ai_consent", "1");
    localStorage.setItem("chitti_news_onb_done", "1");
  } catch (e) {}
});

const report = [];
for (const name of PAGES) {
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(ROOT, name)).href, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  // Hide any overlays.
  await page.evaluate(() => {
    ["consent-overlay", "onb-modal", "consent-modal"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
  });
  // Let feedback-widget.js's MutationObserver attach bars to dynamic content.
  await page.waitForTimeout(800);

  const audit = await page.evaluate(() => {
    const out = {
      title: document.title,
      qrPresent: !!document.querySelector(".chitti-qr-block, img[src*='qr'], img[alt*='QR']"),
      qrSrc: ((document.querySelector(".chitti-qr-block img") || document.querySelector("img[alt*='QR']") || {}).src || "").slice(0, 60),
      langSelect: !!document.querySelector("select#lang-select, select#hdr-lang, select#pick-lang, select#lang"),
      bars: document.querySelectorAll(".chitti-fb-box-bar").length,
      barsWithDemo: document.querySelectorAll(".chitti-fb-box-bar [data-act='demo']").length,
      barsWith4Icons: 0,
    };
    document.querySelectorAll(".chitti-fb-box-bar").forEach(b => {
      const acts = ["speak", "ask", "up", "down"];
      if (acts.every(a => !!b.querySelector("[data-act='" + a + "']"))) out.barsWith4Icons += 1;
    });
    // Click the first Demo button to confirm it actually speaks.
    const firstDemo = document.querySelector(".chitti-fb-box-bar [data-act='demo']");
    if (firstDemo) {
      try { firstDemo.click(); } catch (e) {}
    }
    return out;
  });
  await page.waitForTimeout(200);
  const spokenAfterClick = await page.evaluate(() => (window.__spoken || []).slice(-1)[0] || "");
  audit.demoFires = !!spokenAfterClick && spokenAfterClick.length > 5;
  audit.demoSample = spokenAfterClick.slice(0, 110);

  report.push({ name, audit });
  await page.close();
}

await browser.close();

console.log("");
console.log("| Page | QR | Lang | Bars | Demo on all | 4-icon on all | Demo fires |");
console.log("|---|---|---|---|---|---|---|");
for (const r of report) {
  const a = r.audit;
  console.log(`| ${r.name} | ${a.qrPresent ? "✅" : "❌"} | ${a.langSelect ? "✅" : "❌"} | ${a.bars} | ${a.barsWithDemo}/${a.bars} ${a.barsWithDemo === a.bars && a.bars > 0 ? "✅" : "❌"} | ${a.barsWith4Icons}/${a.bars} ${a.barsWith4Icons === a.bars && a.bars > 0 ? "✅" : "❌"} | ${a.demoFires ? "✅" : "❌"} |`);
}
console.log("\nSpoken on first Demo click:");
for (const r of report) {
  console.log(`  ${r.name}: ${JSON.stringify(r.audit.demoSample).slice(0, 100)}`);
}
