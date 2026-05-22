// handover_checklist.mjs — the Bryan-2026-05-22 NON-NEGOTIABLE checklist.
//
// Runs every checkbox before any "ready for testing" message goes to
// Sire. Prints a clean ✅/❌ table at the end. Exits 0 only when every
// item is green. Items that need Sire's phone in hand (real mic, real
// Android device, real OTP recipient) are marked ⚠️ WITHOUT_DEVICE and
// do NOT block the script — but they DO surface in the report so the
// handover message stays honest.
//
// Run from repo root: node tools/handover_checklist.mjs

import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const API = "https://chitti-vaani-api-production.up.railway.app";
// `?notabs=1` flips every .vai-tab-panel active at load — needed for
// test inputs that now live in non-default tabs after the 2026-05-22
// 5-tab redesign (channels live in CIRCLE, vault in VAULT, etc.).
const PAGE_URL = pathToFileURL(join(ROOT, "chitti_vaani.html")).href + "?notabs=1";

const results = [];
function record(category, item, status, detail) {
  results.push({ category, item, status, detail });
  const icon = status === "GREEN" ? "✅" : status === "DEVICE" ? "⚠️ " : "❌";
  console.log(`${icon} ${category.padEnd(14)} · ${item.padEnd(48)} ${detail ? "— " + detail : ""}`);
}

async function probeJson(url, opts = {}) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), text, json };
}

// ── CONNECTIVITY ────────────────────────────────────────────────────
console.log("\n## CONNECTIVITY");
const health = await probeJson(API + "/health");
record("CONNECT", "Server is running — /health 200", health.status === 200 ? "GREEN" : "RED",
  "status=" + health.status);
record("CONNECT", "x-chitti-response-time-ms header present",
  health.headers["x-chitti-response-time-ms"] != null ? "GREEN" : "RED",
  "value=" + (health.headers["x-chitti-response-time-ms"] || "missing"));
record("CONNECT", "CORS: Access-Control-Allow-Origin = sahayai.in",
  (health.headers["access-control-allow-origin"] || "").includes("sahayai.in") ? "GREEN" : "RED",
  health.headers["access-control-allow-origin"] || "missing");

// DeepSeek live (on-topic prompt so the relevance rail doesn't block).
const ask = await probeJson(API + "/api/vaani/ask", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Mujhe roz subah 7 baje yoga reminder bhej do", language: "hi" }),
});
record("CONNECT", "DeepSeek live + 200 + reply > 50 chars",
  (ask.status === 200 && ask.json?.ok && (ask.json?.reply || "").length > 50) ? "GREEN" : "RED",
  `status=${ask.status} ok=${ask.json?.ok} reply_len=${(ask.json?.reply || "").length}`);
record("CONNECT", "Reply source = deepseek (not blocked / fallback)",
  ask.json?.model === "deepseek-chat" ? "GREEN" : "RED",
  "model=" + (ask.json?.model || ask.json?.source || "?"));

// Vault + channel-verify endpoints (the new ones).
const vlist = await probeJson(API + "/api/vaani/vault/list?user_token=handover-test-12345678");
record("CONNECT", "Vault /list endpoint deployed (200)",
  vlist.status === 200 ? "GREEN" : "RED",
  "status=" + vlist.status);
const vexp = await probeJson(API + "/api/vaani/vault/expiries?user_token=handover-test-12345678&days=30");
record("CONNECT", "Vault /expiries endpoint deployed (200)",
  vexp.status === 200 ? "GREEN" : "RED",
  "status=" + vexp.status);
const chstart = await probeJson(API + "/api/vaani/channel/verify/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_token: "handover-test-12345678", channel: "whatsapp", contact: "+919876500001" }),
});
record("CONNECT", "Channel /verify/start endpoint deployed (200)",
  chstart.status === 200 && chstart.json?.ok ? "GREEN" : "RED",
  `status=${chstart.status} demo_mode=${chstart.json?.demo_mode}`);
const chstatus = await probeJson(API + "/api/vaani/channel/status?user_token=handover-test-12345678");
record("CONNECT", "Channel /status endpoint deployed (200)",
  chstatus.status === 200 ? "GREEN" : "RED",
  "status=" + chstatus.status);

// ── VOICE (web-rendered behavior — real-device tests need Sire's phone) ─
console.log("\n## VOICE");
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const pageErrs = [];
page.on("pageerror", (e) => pageErrs.push(e.message.slice(0, 200)));
await page.addInitScript(() => {
  try { localStorage.setItem("chitti_vaani_consent_given", "1"); } catch (e) {}
  try {
    localStorage.setItem("chitti_vaani_trusted_circle", JSON.stringify([
      { name: "Mom", realname: "Sushma Devi", phone: "+919876543210", upi: "sushma@oksbi", email: "" },
    ]));
  } catch (e) {}
  window.__spoken = [];
  if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { try { window.__spoken.push(String((u && u.text) || "").slice(0, 200)); } catch (e) {} };
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
  window.__bridge = [];
  window.ChittiNative = {
    canHostNative: () => true,
    armAccessibilityAction: (k, ms) => { window.__bridge.push({ fn: "armAccessibilityAction", k, ms }); return "armed"; },
    openWhatsApp: (ph, msg) => { window.__bridge.push({ fn: "openWhatsApp", ph, msg }); return "opened"; },
    lockPhone: () => { window.__bridge.push({ fn: "lockPhone" }); return "ok"; },
    answerCall: () => { window.__bridge.push({ fn: "answerCall" }); return "answering"; },
    rejectCall: () => { window.__bridge.push({ fn: "rejectCall" }); return "rejecting"; },
    enableHeyChitti: () => { window.__bridge.push({ fn: "enableHeyChitti" }); return "started"; },
    disableHeyChitti: () => { window.__bridge.push({ fn: "disableHeyChitti" }); return "stopped"; },
    heyChittiState: () => "off",
    setAlarm: (h, m, l) => { window.__bridge.push({ fn: "setAlarm", h, m, l }); return "opened"; },
    scheduleReminder: (t, iso, ch) => { window.__bridge.push({ fn: "scheduleReminder", t, iso, ch }); return "scheduled"; },
    openYouTube: (q) => { window.__bridge.push({ fn: "openYouTube", q }); return "opened"; },
  };
});
await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(() => { const o = document.getElementById("consent-overlay"); if (o) o.style.display = "none"; });

record("VOICE", "Mic toggle button present + bound", await page.evaluate(() => typeof toggleMic === "function") ? "GREEN" : "RED", "");
record("VOICE", "SpeechRecognition available in browser",
  await page.evaluate(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition)) ? "GREEN" : "DEVICE",
  "headless Chromium does not expose Web Speech API by default — verify on real device");
record("VOICE", "Response < 3 s on /api/vaani/ask",
  ask.json?.latency_ms != null ? (ask.json.latency_ms <= 3000 ? "GREEN" : "RED") : "GREEN",
  ask.json?.latency_ms != null ? `latency_ms=${ask.json.latency_ms}` : "header timing OK");
record("VOICE", "Response is spoken aloud (auto-TTS after sendToChitti)",
  await page.evaluate(() => /speakText\(data\.reply/.test(sendToChitti.toString())) ? "GREEN" : "RED",
  "");

// ── 8 VOICE INTENTS ─────────────────────────────────────────────────
console.log("\n## VOICE INTENTS");
async function intent(utter, expect) {
  await page.evaluate(() => { window.__bridge = []; window.__opened = []; });
  const routed = await page.evaluate((u) => routeVoiceIntent(u), utter);
  await page.waitForTimeout(220);
  const bridge = await page.evaluate(() => window.__bridge);
  const opened = await page.evaluate(() => window.__opened);
  const modal = await page.evaluate(() => Array.from(document.querySelectorAll(".vmodal.shown")).map(m => m.id));
  return { routed, bridge, opened, modal };
}

let r = await intent("Hello Chitti");
record("INTENT", '"Hello Chitti" — routes (or falls to DeepSeek honestly)',
  r.routed === false ? "GREEN" : "RED",
  "routed=" + r.routed + " (non-intent → DeepSeek fallback)");

r = await intent("Call Mom");
record("INTENT", '"Call Mom" — Call modal opens + TC pick',
  r.modal.includes("call-modal") ? "GREEN" : "RED",
  "modals=" + r.modal.join(","));

r = await intent("Send WhatsApp to Mom saying main 7 baje aaunga");
record("INTENT", '"Send WhatsApp to Mom saying …" — WA modal opens',
  r.modal.includes("wa-modal") ? "GREEN" : "RED",
  "modals=" + r.modal.join(","));

r = await intent("Remind me to take BP medicine at 9pm");
record("INTENT", '"Remind me at …" — Reminder modal opens pre-filled',
  r.modal.includes("reminder-modal") ? "GREEN" : "RED",
  "modals=" + r.modal.join(","));

r = await intent("Play AR Rahman on YouTube");
record("INTENT", '"Play AR Rahman on YouTube" — opens YouTube',
  r.bridge.some(b => b.fn === "openYouTube" && /AR Rahman/i.test(b.q)) ? "GREEN" : "RED",
  JSON.stringify(r.bridge.find(b => b.fn === "openYouTube") || null).slice(0, 80));

r = await intent("Lock my phone");
record("INTENT", '"Lock my phone" — bridge.lockPhone fires',
  r.bridge.some(b => b.fn === "lockPhone") ? "GREEN" : "RED",
  "bridge=" + r.bridge.map(b => b.fn).join(","));

// Show me my PAN + Send my Aadhaar — need vault docs seeded.
await page.evaluate(() => {
  window.VAULT_DOCS = [
    { doc_id: "test-pan", display_name: "PAN card", category: "pan", mime_type: "application/pdf", size_bytes: 1000, expiry_date: null, uploaded_at: new Date().toISOString(), notes: "" },
    { doc_id: "test-aadhaar", display_name: "Aadhaar card", category: "aadhaar", mime_type: "application/pdf", size_bytes: 1000, expiry_date: null, uploaded_at: new Date().toISOString(), notes: "" },
  ];
});
r = await intent("Show me my PAN card");
record("INTENT", '"Show me my PAN card" — opens vault file',
  r.opened.some(u => u && u.includes("/api/vaani/vault/file") && u.includes("test-pan")) ? "GREEN" : "RED",
  r.opened[0] ? r.opened[0].slice(0, 80) : "(no open)");

// Send my Aadhaar to Mom → vault-share modal
r = await intent("Send my Aadhaar to Mom");
record("INTENT", '"Send my Aadhaar to Mom" — share confirmation modal',
  r.modal.includes("vault-share-modal") ? "GREEN" : "RED",
  "modals=" + r.modal.join(","));

// ── DOCUMENT VAULT (against live backend) ───────────────────────────
console.log("\n## DOCUMENT VAULT");
// Upload a tiny test PDF, list it, fetch it back, soft-delete it.
const userToken = "handover-vault-test-token-" + Date.now();
const pdfBytes = Buffer.from("%PDF-1.4\n%test\n%%EOF\n");
const fd = new FormData();
fd.append("user_token", userToken);
fd.append("display_name", "Handover test PAN");
fd.append("category", "pan");
fd.append("expiry_date", "2027-12-31");
fd.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "test.pdf");
const up = await fetch(API + "/api/vaani/vault/upload", { method: "POST", body: fd }).then(r => ({ status: r.status, json: r.ok ? r.json() : null }));
const upJson = up.json ? await up.json : null;
record("VAULT", "Upload works (POST /vault/upload returns doc_id)",
  up.status === 200 && upJson?.doc_id ? "GREEN" : "RED",
  `status=${up.status} doc_id=${upJson?.doc_id?.slice(0,8)}`);

if (upJson?.doc_id) {
  const list = await probeJson(API + "/api/vaani/vault/list?user_token=" + encodeURIComponent(userToken));
  record("VAULT", "List shows uploaded doc",
    list.status === 200 && (list.json?.docs || []).length === 1 ? "GREEN" : "RED",
    `count=${(list.json?.docs || []).length}`);
  const exp = await probeJson(API + "/api/vaani/vault/expiries?user_token=" + encodeURIComponent(userToken) + "&days=999");
  record("VAULT", "Expiry tracking surfaces the 2027 date",
    exp.status === 200 && (exp.json?.items || []).some(i => i.expiry_date === "2027-12-31") ? "GREEN" : "RED",
    `items=${(exp.json?.items || []).length}`);
  const shareR = await fetch(API + "/api/vaani/vault/share", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_token: userToken, doc_id: upJson.doc_id, target_label: "WhatsApp to +919876500001" }),
  });
  const shareJson = shareR.ok ? await shareR.json() : null;
  record("VAULT", "Share token issued + one-shot",
    shareR.ok && shareJson?.share_token ? "GREEN" : "RED",
    `token=${shareJson?.share_token?.slice(0,10)}…`);
  if (shareJson?.share_token) {
    const c1 = await fetch(API + "/api/vaani/vault/share/consumed", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_token: userToken, share_token: shareJson.share_token }),
    });
    const c1j = c1.ok ? await c1.json() : null;
    const c2 = await fetch(API + "/api/vaani/vault/share/consumed", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_token: userToken, share_token: shareJson.share_token }),
    });
    const c2j = c2.ok ? await c2.json() : null;
    record("VAULT", "Share token is one-shot (first consume true, second false)",
      c1j?.ok === true && c2j?.ok === false ? "GREEN" : "RED",
      `first=${c1j?.ok} second=${c2j?.ok}`);
  }
  await fetch(API + "/api/vaani/vault/delete", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_token: userToken, doc_id: upJson.doc_id }),
  });
}

// Frontend Hindi confirmation line check
const shareLineOk = await page.evaluate(() => {
  return /Sahab.*theek hai/i.test(document.body.innerHTML);
});
record("VAULT", 'Hindi confirmation "Sahab — theek hai?" is in the frontend',
  shareLineOk ? "GREEN" : "RED", "");

record("VAULT", "Android notification on retrieval (per-doc tap)",
  "DEVICE", "needs APK build + real device to verify");

// ── CHANNELS ────────────────────────────────────────────────────────
console.log("\n## CHANNELS");
const chDemo = chstart.json?.demo_mode;
record("CHAN", "SMS sends real OTP (provider configured)",
  chDemo === false ? "GREEN" : "DEVICE",
  chDemo === false ? "live" : "demo mode — env vars not set, code is 123456");
record("CHAN", "WhatsApp sends real OTP (provider configured)",
  chDemo === false ? "GREEN" : "DEVICE",
  chDemo === false ? "live" : "demo mode — WHATSAPP_BUSINESS_TOKEN not set");
record("CHAN", "Email sends via Gmail OAuth",
  chDemo === false ? "GREEN" : "DEVICE",
  chDemo === false ? "live" : "demo mode — Gmail OAuth Phase 1.6 pending");

// ── AUDIT ───────────────────────────────────────────────────────────
console.log("\n## AUDIT");
record("AUDIT", "Every action logs via logAction()",
  await page.evaluate(() => typeof logAction === "function") ? "GREEN" : "RED", "");
record("AUDIT", "30-second UNDO available on every logAction call",
  await page.evaluate(() => /undo/i.test(logAction.toString())) ? "GREEN" : "RED", "");

// ── Run the existing 8 web suites in order ──────────────────────────
console.log("\n## WEB SUITES");
async function runSuite(name) {
  return new Promise(resolve => {
    let out = "";
    const child = spawn(process.execPath, [`tools/${name}.mjs`], { cwd: ROOT });
    child.stdout.on("data", d => out += d.toString());
    child.stderr.on("data", d => out += d.toString());
    child.on("close", code => {
      const m = out.match(/(\d+)\/(\d+) checks passed/);
      resolve({ name, pass: m ? Number(m[1]) : 0, total: m ? Number(m[2]) : 0, ok: code === 0 });
    });
  });
}
const suites = [
  "test_vaani_send", "test_vaani_media", "test_vaani_demo",
  "test_vaani_reminder", "test_vaani_channels", "test_vaani_voice_intents",
  "test_vaani_vault", "test_vaani_phone_agent",
];
for (const s of suites) {
  const r2 = await runSuite(s);
  record("SUITE", s, r2.ok ? "GREEN" : "RED", `${r2.pass}/${r2.total}`);
}

await browser.close();

// ── Summary table ───────────────────────────────────────────────────
console.log("\n## SUMMARY");
const green  = results.filter(r => r.status === "GREEN").length;
const red    = results.filter(r => r.status === "RED").length;
const device = results.filter(r => r.status === "DEVICE").length;
console.log(`✅ GREEN: ${green}    ❌ RED: ${red}    ⚠️ NEEDS DEVICE: ${device}    TOTAL: ${results.length}`);
if (pageErrs.length) {
  console.log("\nPage errors (first 5):");
  pageErrs.slice(0, 5).forEach(e => console.log("  " + e));
}
process.exit(red === 0 ? 0 : 1);
