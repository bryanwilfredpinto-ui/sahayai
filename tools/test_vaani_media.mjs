// End-to-end test for the new media / Android cards on chitti_vaani.html.
// Bryan: "in chitti vaani, theres no youtube or play songs or video
// option, android feature is not there." Verifies each new pro-action
// card opens its modal, takes a typed query, and routes to the correct
// URL or native bridge.
//
// Stubs:
//   - window.open / window.location.href set capture the target URL.
//   - The Android native bridge isn't present here (this is a web file://
//     test), so we assert that the WEB FALLBACK URLs are correct, AND
//     that Camera + Flashlight fall back to a spoken "Android only"
//     message via logAction.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const URL = pathToFileURL(join(ROOT, "chitti_vaani.html")).href + "?notabs=1";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  try { localStorage.setItem("chitti_vaani_consent_given", "1"); } catch (e) {}
  const o = document.getElementById("consent-overlay");
  if (o) o.style.display = "none";
  // Capture window.open calls.
  window.__opened = [];
  window.open = (url) => { window.__opened.push(url); return null; };
  // Capture nativeAction logActions (for web-fallback assertions).
  window.__logs = [];
  const realLog = window.logAction;
  window.logAction = (a, b) => { window.__logs.push({ a, b }); if (realLog) try { realLog(a, b); } catch (e) {} };
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

async function flowOpensModal(openFn, modalId, label) {
  await page.evaluate((fn) => window[fn](), openFn);
  await page.waitForTimeout(200);
  const open = await page.evaluate((id) => document.getElementById(id).classList.contains("shown"), modalId);
  record(`${label}: modal opens`, open, modalId);
}
async function flowFillsAndConfirms(modalId, qSelector, query, confirmFn, urlPredicate, label) {
  await page.fill(qSelector, query);
  await page.evaluate(() => { window.__opened = []; });
  await page.evaluate((fn) => window[fn](), confirmFn);
  await page.waitForTimeout(200);
  const url = await page.evaluate(() => window.__opened[0] || null);
  record(`${label}: confirm → URL captured`, !!(url && urlPredicate(url)), url || "(none)");
  // And modal closes.
  const closed = await page.evaluate((id) => !document.getElementById(id).classList.contains("shown"), modalId);
  record(`${label}: modal closes after confirm`, closed);
}

// ── YouTube ─────────────────────────────────────────────────────────
await flowOpensModal("openYouTubeModal", "yt-modal", "YouTube");
await flowFillsAndConfirms(
  "yt-modal", "#yt-q", "AR Rahman Vande Mataram",
  "confirmYouTube",
  (u) => u.startsWith("https://www.youtube.com/results?search_query=") &&
         u.includes("AR%20Rahman%20Vande%20Mataram"),
  "YouTube",
);

// ── Music ───────────────────────────────────────────────────────────
await flowOpensModal("openMusicModal", "music-modal", "Music");
await flowFillsAndConfirms(
  "music-modal", "#music-q", "Kishore Kumar",
  "confirmMusic",
  (u) => u.startsWith("https://music.youtube.com/search?q=") && u.includes("Kishore%20Kumar"),
  "Music",
);

// ── Video ───────────────────────────────────────────────────────────
await flowOpensModal("openVideoModal", "video-modal", "Video");
await flowFillsAndConfirms(
  "video-modal", "#video-q", "Bhagavad Gita Chapter 2",
  "confirmVideo",
  (u) => u.startsWith("https://www.youtube.com/results?search_query=") && u.includes("full%20video"),
  "Video",
);

// ── Maps ────────────────────────────────────────────────────────────
await flowOpensModal("openMapsModal", "maps-modal", "Maps");
await flowFillsAndConfirms(
  "maps-modal", "#maps-q", "AIIMS Delhi",
  "confirmMaps",
  (u) => u.startsWith("https://www.google.com/maps/dir/?api=1") && u.includes("AIIMS%20Delhi") && u.includes("travelmode=driving"),
  "Maps",
);

// ── Search ──────────────────────────────────────────────────────────
await flowOpensModal("openSearchModal", "search-modal", "Search");
await flowFillsAndConfirms(
  "search-modal", "#search-q", "monsoon Delhi 2026",
  "confirmSearch",
  (u) => u.startsWith("https://www.google.com/search?q=") && u.includes("monsoon%20Delhi%202026"),
  "Search",
);

// ── Alarm — web fallback ────────────────────────────────────────────
// Web has no SET_ALARM API → confirm alert() fires; logAction("Alarm steps shown").
await page.evaluate(() => openAlarmModal());
await page.waitForTimeout(200);
await page.fill("#alarm-time", "07:00");
await page.fill("#alarm-label", "Yoga");
// Stub alert so we don't block.
await page.evaluate(() => { window.__lastAlert = null; window.alert = (m) => { window.__lastAlert = m; }; });
await page.evaluate(() => confirmAlarm());
await page.waitForTimeout(200);
const alarmLog = await page.evaluate(() => (window.__logs || []).find(l => /Alarm steps shown/.test(l.a)));
const alarmAlert = await page.evaluate(() => window.__lastAlert);
record("Alarm: web fallback logs + alerts step-by-step",
  !!(alarmLog && alarmAlert && alarmAlert.includes("07:00") && alarmAlert.includes("Yoga")),
  (alarmAlert || "").slice(0, 80),
);

// ── Camera (native bridge missing → honest deferral message) ────────
await page.evaluate(() => { window.__lastSpoken = null; const real = window.speechSynthesis; window.speechSynthesis.speak = (u) => { window.__lastSpoken = u && u.text; }; });
await page.evaluate(() => nativeAction("openCamera"));
await page.waitForTimeout(150);
const camLog = await page.evaluate(() => (window.__logs || []).find(l => /web fallback/i.test(l.a) && /openCamera/.test(l.b)));
record("Camera: nativeAction defers honestly when no Android bridge",
  !!camLog,
  camLog ? (camLog.a + ": " + camLog.b) : "(no log)",
);

// ── Flashlight (native bridge missing → honest deferral message) ────
await page.evaluate(() => nativeAction("toggleFlashlight"));
await page.waitForTimeout(150);
const torchLog = await page.evaluate(() => (window.__logs || []).find(l => /web fallback/i.test(l.a) && /toggleFlashlight/.test(l.b)));
record("Flashlight: nativeAction defers honestly when no Android bridge",
  !!torchLog,
  torchLog ? (torchLog.a + ": " + torchLog.b) : "(no log)",
);

await browser.close();

const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
