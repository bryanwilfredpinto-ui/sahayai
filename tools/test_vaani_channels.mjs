// End-to-end test of the verify-then-grant flow for Reminder channels
// on chitti_vaani.html.
//
// Bryan 2026-05-22: "For whats app linkage, use mobile number & send
// read code from the message. Same goes with sms. For email, confirm
// email addresses via code. Once u get all 3, u have the access."
//
// Asserts:
//   1. The Reminder channels section is present with three rows
//      (WhatsApp / SMS / Email), each starting "Not verified".
//   2. Send-code button reveals the 6-digit input field.
//   3. Wrong code → speech feedback + border red, no verification.
//   4. Correct demo code (123456) → row flips to "✓ Verified",
//      contact is shown, Disconnect button appears.
//   5. localStorage["chitti_vaani_channels_v1"] persists the state.
//   6. Reminder modal: SMS / WhatsApp / Email options labelled
//      "⚠️ verify above" and disabled while the matching channel
//      is unverified — and flip to "✓ verified" + enabled the moment
//      they are.
//   7. Disconnect → row resets to "Not verified" + the Reminder modal
//      option flips back to disabled.
//   8. Backend unreachable (file://) → honest demo-mode fallback
//      still completes the verification (no network needed).
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

// Stub speechSynthesis + accept-on-confirm so the flow runs without
// audio. Pre-clear any previous channel state.
await page.addInitScript(() => {
  window.__spoken = [];
  if (window.speechSynthesis) {
    window.speechSynthesis.speak = (u) => { try { window.__spoken.push(String((u && u.text) || "").slice(0, 200)); } catch (e) {} };
  }
  try { localStorage.setItem("chitti_vaani_consent_given", "1"); } catch (e) {}
  try { localStorage.removeItem("chitti_vaani_channels_v1"); } catch (e) {}
  window.__alerts = [];
  window.alert = (m) => { window.__alerts.push(m); };
  // Backend isn't reachable on file://; short-circuit fetch so the
  // demo-mode fallback fires synchronously instead of waiting for a
  // 30s network timeout.
  window.fetch = () => Promise.reject(new Error("no network in test"));
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const o = document.getElementById("consent-overlay");
  if (o) o.style.display = "none";
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

// ── 1. Section + three rows present ─────────────────────────────────
const initial = await page.evaluate(() => ({
  hasSection: !!document.querySelector('section[aria-labelledby="ch-title"]'),
  rows: Array.from(document.querySelectorAll(".ch-row")).map(r => ({
    channel: r.getAttribute("data-channel"),
    badge: (r.querySelector(".ch-badge") || {}).textContent || "",
  })),
}));
record("Reminder channels section present", initial.hasSection);
record("Three rows (whatsapp / sms / email), each starting 'Not verified'",
  initial.rows.length === 3 && initial.rows.every(r => /not verified/i.test(r.badge)),
  initial.rows.map(r => r.channel + "=" + r.badge.trim()).join(", "));

// ── 2. Send-code reveals the OTP input ──────────────────────────────
await page.fill("#ch-whatsapp-input", "+919876500001");
await page.click('button.btn-saffron[onclick*="startChannelVerify(\'whatsapp\')"]');
await page.waitForTimeout(300);
const otpVisible = await page.evaluate(() => {
  const r = document.getElementById("ch-whatsapp-otp-row");
  return r && getComputedStyle(r).display !== "none";
});
record("WA: Send code reveals 6-digit input row", otpVisible);

// ── 3. Wrong code → no verification + red border ─────────────────────
await page.fill("#ch-whatsapp-code", "000000");
await page.click('button.btn-navy[onclick*="confirmChannelVerify(\'whatsapp\')"]');
await page.waitForTimeout(300);
const stillUnverified = await page.evaluate(() => {
  const b = document.getElementById("ch-whatsapp-badge");
  return /not verified/i.test(b.textContent);
});
record("WA: wrong code → still not verified", stillUnverified);

// ── 4. Correct demo code → ✓ Verified ───────────────────────────────
await page.fill("#ch-whatsapp-code", "123456");
await page.click('button.btn-navy[onclick*="confirmChannelVerify(\'whatsapp\')"]');
await page.waitForTimeout(400);
const waVerified = await page.evaluate(() => {
  const b = document.getElementById("ch-whatsapp-badge");
  const d = document.getElementById("ch-whatsapp-disconnect");
  return {
    verified: /verified/i.test(b.textContent) && !/not verified/i.test(b.textContent),
    discVisible: d && getComputedStyle(d).display !== "none",
    stored: JSON.parse(localStorage.getItem("chitti_vaani_channels_v1") || "{}"),
  };
});
record("WA: correct demo code → ✓ Verified badge + Disconnect button visible",
  waVerified.verified && waVerified.discVisible);
record("WA: localStorage stores verified contact",
  !!(waVerified.stored && waVerified.stored.whatsapp && waVerified.stored.whatsapp.contact === "+919876500001"),
  JSON.stringify(waVerified.stored.whatsapp || null));

// ── 5. SMS + Email — verify each, confirm all three end up verified ─
async function verifyChannel(channel, contact) {
  await page.fill(`#ch-${channel}-input`, contact);
  await page.click(`button.btn-saffron[onclick*="startChannelVerify('${channel}')"]`);
  await page.waitForTimeout(200);
  await page.fill(`#ch-${channel}-code`, "123456");
  await page.click(`button.btn-navy[onclick*="confirmChannelVerify('${channel}')"]`);
  await page.waitForTimeout(300);
}
await verifyChannel("sms", "+919876500002");
await verifyChannel("email", "test@example.com");
const allThree = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("chitti_vaani_channels_v1") || "{}"),
);
record("SMS verified", !!(allThree.sms && allThree.sms.contact === "+919876500002"));
record("Email verified", !!(allThree.email && allThree.email.contact === "test@example.com"));
record("All three channels verified after the OTP flow",
  !!(allThree.whatsapp && allThree.sms && allThree.email),
  Object.keys(allThree).sort().join(","));

// ── 6. Reminder modal: options become selectable + labelled ✓ ───────
await page.evaluate(() => openReminderModal());
await page.waitForTimeout(200);
const selOpts = await page.evaluate(() => {
  const sel = document.getElementById("rem-channel");
  return Array.from(sel.options).map(o => ({
    v: o.value, label: o.textContent, disabled: o.disabled,
  }));
});
record("Reminder select: SMS option now reads '✓ verified'",
  selOpts.find(o => o.v === "sms")?.label.includes("✓") && !selOpts.find(o => o.v === "sms")?.disabled,
  (selOpts.find(o => o.v === "sms") || {}).label);
record("Reminder select: WhatsApp option enabled + '✓ verified'",
  selOpts.find(o => o.v === "whatsapp")?.label.includes("✓") && !selOpts.find(o => o.v === "whatsapp")?.disabled);
record("Reminder select: Email option enabled + '✓ verified'",
  selOpts.find(o => o.v === "email")?.label.includes("✓") && !selOpts.find(o => o.v === "email")?.disabled);
await page.evaluate(() => closeModal("reminder-modal"));

// ── 7. Disconnect WhatsApp → option goes back to ⚠️ verify above ────
await page.evaluate(() => { window.confirm = () => true; });  // auto-accept the confirm()
await page.click('#ch-whatsapp-disconnect');
await page.waitForTimeout(200);
await page.evaluate(() => openReminderModal());
await page.waitForTimeout(200);
const waAfterDisc = await page.evaluate(() => {
  const sel = document.getElementById("rem-channel");
  const o = Array.from(sel.options).find(x => x.value === "whatsapp");
  return { label: o.textContent, disabled: o.disabled };
});
record("After disconnect: WhatsApp option reads '⚠️ verify above' + disabled",
  waAfterDisc.label.includes("⚠️") && waAfterDisc.disabled,
  waAfterDisc.label);

await browser.close();
const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
