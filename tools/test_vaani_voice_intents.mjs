// End-to-end test for the voice intent router on chitti_vaani.html.
//
// Bryan 2026-05-22 — "Voice intents to wire:
//   Send WhatsApp to [name/number] saying [message]
//   Call [name]
//   Email [name] about [subject]
//   Play [video/song] on YouTube
//   Lock my phone
//   Answer the call / Reject the call"
//
// We feed each intent to routeVoiceIntent() and assert the right
// modal opens (or the right native bridge method fires).
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

await page.addInitScript(() => {
  if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  window.fetch = () => Promise.reject(new Error("no net"));
  try {
    localStorage.setItem("chitti_vaani_consent_given", "1");
    // Seed Trusted Circle with Mom + Ramesh so name matches resolve.
    localStorage.setItem("chitti_vaani_trusted_circle", JSON.stringify([
      { name: "Mom", realname: "Sushma Devi", phone: "+919876543210", upi: "sushma@oksbi", email: "" },
      { name: "Ramesh", realname: "Ramesh Kumar", phone: "+919812345678", upi: "ramesh@oksbi", email: "ramesh@gmail.com" },
    ]));
  } catch (e) {}
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
  // Stub native bridge calls so we can assert intent.
  window.__nativeCalls = [];
  window.ChittiNative = {
    canHostNative: () => true,
    lockPhone: () => { window.__nativeCalls.push("lockPhone"); return "ok"; },
    answerCall: () => { window.__nativeCalls.push("answerCall"); return "answering"; },
    rejectCall: () => { window.__nativeCalls.push("rejectCall"); return "rejecting"; },
    openCamera: () => { window.__nativeCalls.push("openCamera"); return "opened"; },
    toggleFlashlight: () => { window.__nativeCalls.push("toggleFlashlight"); return "on"; },
  };
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const o = document.getElementById("consent-overlay"); if (o) o.style.display = "none";
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

async function intent(utter, assertion) {
  await page.evaluate((u) => routeVoiceIntent(u), utter);
  await page.waitForTimeout(220);
  await assertion();
  // Reset modal state between intents.
  await page.evaluate(() => {
    ["call-modal", "wa-modal", "upi-modal", "yt-modal", "music-modal", "video-modal",
     "maps-modal", "search-modal", "alarm-modal", "reminder-modal", "vault-share-modal", "email-modal",
    ].forEach(id => { const m = document.getElementById(id); if (m) m.classList.remove("shown"); });
  });
}

// 1. "Call Mom" → call modal opens + Mom selected
await intent("Call Mom", async () => {
  const open = await page.evaluate(() => document.getElementById("call-modal").classList.contains("shown"));
  const selVal = await page.evaluate(() => document.getElementById("call-to").value);
  record("Call <name>: modal opens + name resolved to Trusted Circle", open && selVal !== "", "call-to=" + selVal);
});

// 2. "Call +919876500000" — name not in TC → free-text path
await intent("call +919876500000", async () => {
  const open = await page.evaluate(() => document.getElementById("call-modal").classList.contains("shown"));
  // Free-text input gets focused (we can't easily assert focus value preset since name failed lookup)
  record("Call <unknown number>: modal still opens for typing", open);
});

// 3. "Send WhatsApp to Mom saying main shaam ko aaunga"
await intent("Send WhatsApp to Mom saying main shaam ko aaunga", async () => {
  const open = await page.evaluate(() => document.getElementById("wa-modal").classList.contains("shown"));
  const msg = await page.evaluate(() => document.getElementById("wa-msg").value);
  const to = await page.evaluate(() => document.getElementById("wa-to").value);
  record("WhatsApp <name> saying <msg>: modal opens with msg + Mom selected",
    open && msg.includes("shaam") && to !== "",
    `msg='${msg.slice(0, 40)}' to=${to}`);
});

// 4. "Email Ramesh about offer letter"
await intent("Email Ramesh about offer letter", async () => {
  const open = await page.evaluate(() => document.getElementById("email-modal").classList.contains("shown"));
  record("Email <name> about <subj>: modal opens", open);
});

// 5. "Play AR Rahman on YouTube"
await intent("Play AR Rahman on YouTube", async () => {
  const ytOpenedUrl = await page.evaluate(() => (window.__opened || []).find(u => u && u.includes("youtube.com/results")) || "");
  record("Play <X> on YouTube: youtube.com/results opens",
    ytOpenedUrl.includes("youtube.com/results") && ytOpenedUrl.includes("AR%20Rahman"),
    ytOpenedUrl);
});

// 6. "Play Kishore Kumar song" → music
await page.evaluate(() => { window.__opened = []; });
await intent("Play Kishore Kumar song", async () => {
  const musicUrl = await page.evaluate(() => (window.__opened || []).find(u => u && u.includes("music.youtube.com")) || "");
  record("Play <X> song: music.youtube.com opens",
    musicUrl.includes("music.youtube.com") && musicUrl.includes("Kishore"),
    musicUrl);
});

// 7. "Lock my phone" → nativeAction lockPhone
await intent("Lock my phone", async () => {
  const calls = await page.evaluate(() => window.__nativeCalls);
  record("Lock my phone: nativeAction('lockPhone') fires", calls.includes("lockPhone"), JSON.stringify(calls));
});

// 8. "Answer the call" → bridge answerCall
await page.evaluate(() => { window.__nativeCalls = []; });
await intent("Answer the call", async () => {
  const calls = await page.evaluate(() => window.__nativeCalls);
  record("Answer the call: bridge.answerCall fires", calls.includes("answerCall"));
});

// 9. "Reject the call" → bridge rejectCall
await page.evaluate(() => { window.__nativeCalls = []; });
await intent("Reject the call", async () => {
  const calls = await page.evaluate(() => window.__nativeCalls);
  record("Reject the call: bridge.rejectCall fires", calls.includes("rejectCall"));
});

// 10. "Remind me to take BP medicine at 9pm" → reminder modal
await intent("Remind me to take BP medicine at 9pm", async () => {
  const open = await page.evaluate(() => document.getElementById("reminder-modal").classList.contains("shown"));
  const txt = await page.evaluate(() => document.getElementById("rem-text").value);
  record("Remind me to <X>: reminder modal opens with prefilled text",
    open && txt.includes("BP"), txt);
});

// 11. Non-intent should NOT be routed → returns false
const nonIntent = await page.evaluate(() => routeVoiceIntent("what is the weather in Delhi"));
record("Non-intent passes through (returns false)", nonIntent === false);

await browser.close();
const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
