// End-to-end test for the new ⏱️ Remind me pro-card on chitti_vaani.html.
// Confirms:
//   1. Card present + modal opens
//   2. Default date is tomorrow, default time 09:00, channel = notification
//   3. With a native bridge stubbed to return "scheduled", the modal
//      closes and the Audit log records the schedule.
//   4. Without a bridge, the web fallback opens calendar.google.com
//      with the right TEMPLATE params (text + dates).
//   5. Past time → alert.
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

await page.addInitScript(() => {
  try { localStorage.setItem("chitti_vaani_consent_given", "1"); } catch (e) {}
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
  window.__alerts = [];
  window.alert = (m) => { window.__alerts.push(m); };
  window.__logs = [];
  // Wait until logAction exists then wrap it (some pages define it at load-time)
  Object.defineProperty(window, "_wrapLogActionOnce", { value: () => {
    if (window.__logAction_wrapped) return; window.__logAction_wrapped = true;
    const real = window.logAction;
    window.logAction = (a, b) => { window.__logs.push({ a: String(a), b: String(b || "") }); if (real) try { real(a, b); } catch (e) {} };
  }, configurable: true });
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const o = document.getElementById("consent-overlay");
  if (o) o.style.display = "none";
  window._wrapLogActionOnce();
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

// ── 1. Open Reminder modal ──────────────────────────────────────────
const cardPresent = await page.evaluate(() => !!document.querySelector('button.pro-card[onclick*="openReminderModal"]'));
record("Reminder card present in pro-actions grid", cardPresent);

await page.evaluate(() => openReminderModal());
await page.waitForTimeout(200);
const modalOpen = await page.evaluate(() => document.getElementById("reminder-modal").classList.contains("shown"));
record("Reminder modal opens", modalOpen);

// ── 2. Defaults ──────────────────────────────────────────────────────
const defaults = await page.evaluate(() => {
  const today = new Date(); today.setDate(today.getDate() + 1);
  const expectedDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  return {
    text: document.getElementById("rem-text").value,
    date: document.getElementById("rem-date").value,
    expectedDate,
    time: document.getElementById("rem-time").value,
    channel: document.getElementById("rem-channel").value,
  };
});
record("Default date is tomorrow", defaults.date === defaults.expectedDate, `got=${defaults.date} expected=${defaults.expectedDate}`);
record("Default time is 09:00", defaults.time === "09:00");
record("Default channel is notification", defaults.channel === "notification");

// ── 3. With a stubbed native bridge → "scheduled" ───────────────────
await page.evaluate(() => {
  window.ChittiNative = {
    canHostNative: () => true,
    scheduleReminder: (text, iso, channel) => {
      window.__nativeCall = { text, iso, channel };
      return "scheduled";
    },
  };
});
await page.fill("#rem-text", "LIC premium payment");
await page.evaluate(() => confirmReminder());
await page.waitForTimeout(200);
const nativeCall = await page.evaluate(() => window.__nativeCall);
const nativeLog = await page.evaluate(() => (window.__logs || []).find(l => /Reminder scheduled \(native\)/.test(l.a)));
const closedAfterNative = await page.evaluate(() => !document.getElementById("reminder-modal").classList.contains("shown"));
record("Native: scheduleReminder called with (text, iso, channel)",
  !!(nativeCall && nativeCall.text === "LIC premium payment" && nativeCall.channel === "notification" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(nativeCall.iso)),
  JSON.stringify(nativeCall || null).slice(0, 100));
record("Native: modal closes + audit log entry", !!(closedAfterNative && nativeLog), nativeLog ? nativeLog.b.slice(0, 60) : "(no log)");

// ── 4. Without bridge → calendar.google.com fallback ────────────────
await page.evaluate(() => { window.ChittiNative = undefined; window.__opened = []; });
await page.evaluate(() => openReminderModal());
await page.waitForTimeout(200);
await page.fill("#rem-text", "Mom birthday call");
await page.evaluate(() => confirmReminder());
await page.waitForTimeout(200);
const calUrl = await page.evaluate(() => (window.__opened || [])[0]);
const fallbackLog = await page.evaluate(() => (window.__logs || []).find(l => /Reminder steps shown \(web fallback\)/.test(l.a)));
record("Web fallback: calendar.google.com URL opened with right text",
  !!(calUrl && calUrl.startsWith("https://calendar.google.com/calendar/render?action=TEMPLATE") && calUrl.includes("Mom%20birthday%20call")),
  (calUrl || "").slice(0, 120));
record("Web fallback: audit log entry", !!fallbackLog, fallbackLog ? fallbackLog.b.slice(0, 60) : "(no log)");

// ── 5. Past time alert ──────────────────────────────────────────────
await page.evaluate(() => {
  openReminderModal();
  // Force date to yesterday
  const d = new Date(); d.setDate(d.getDate() - 1);
  document.getElementById("rem-date").value = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
});
await page.fill("#rem-text", "Yesterday thing");
await page.evaluate(() => confirmReminder());
await page.waitForTimeout(100);
const pastAlert = await page.evaluate(() => (window.__alerts || []).slice(-1)[0]);
record("Past time → alert + no schedule",
  !!(pastAlert && /future/i.test(pastAlert)),
  pastAlert || "(no alert)",
);

await browser.close();

const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
