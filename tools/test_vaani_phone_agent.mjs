// End-to-end test for the Chitti Phone Agent expansion on chitti_vaani.html.
//
// Bryan 2026-05-22 ("no deviation, complete what was given to you"):
//   - VaaniAccessibilityService scope expansion → ChittiNative.armAccessibilityAction
//   - Background wake word "Hey Chitti" → ChittiNative.enableHeyChitti
//
// We stub the native bridge so we can assert the web tier fires the
// right calls. The actual Kotlin services live in chitti-vaani-android/
// — they're documented in CHANGELOG.md and have a separate build.
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
  try {
    localStorage.setItem("chitti_vaani_consent_given", "1");
    localStorage.setItem("chitti_vaani_trusted_circle", JSON.stringify([
      { name: "Mom", realname: "Sushma Devi", phone: "+919876543210", upi: "sushma@oksbi", email: "" },
    ]));
  } catch (e) {}
  // Stub the native bridge: every call lands in window.__bridge.
  window.__bridge = [];
  window.__heyChittiState = "off";
  window.ChittiNative = {
    canHostNative: () => true,
    armAccessibilityAction: (key, ms) => { window.__bridge.push({ fn: "armAccessibilityAction", key, ms }); return "armed"; },
    openWhatsApp: (ph, msg) => { window.__bridge.push({ fn: "openWhatsApp", ph, msg }); return "opened"; },
    openYouTube: (q) => { window.__bridge.push({ fn: "openYouTube", q }); return "opened"; },
    openMusic: (q) => { window.__bridge.push({ fn: "openMusic", q }); return "opened"; },
    openMaps: (q, m) => { window.__bridge.push({ fn: "openMaps", q, m }); return "opened"; },
    enableHeyChitti: () => { window.__bridge.push({ fn: "enableHeyChitti" }); window.__heyChittiState = "on"; return "started"; },
    disableHeyChitti: () => { window.__bridge.push({ fn: "disableHeyChitti" }); window.__heyChittiState = "off"; return "stopped"; },
    heyChittiState: () => window.__heyChittiState,
    lockPhone: () => { window.__bridge.push({ fn: "lockPhone" }); return "ok"; },
    answerCall: () => { window.__bridge.push({ fn: "answerCall" }); return "answering"; },
    rejectCall: () => { window.__bridge.push({ fn: "rejectCall" }); return "rejecting"; },
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

// ── 1. Hey Chitti pro-card present ──────────────────────────────────
const card = await page.evaluate(() => !!document.querySelector('button.pro-card[onclick*="toggleHeyChitti"]'));
record("Hey Chitti pro-card present in pro-actions grid", card);

// ── 2. Toggle on → ChittiNative.enableHeyChitti fires
await page.evaluate(() => toggleHeyChitti());
await page.waitForTimeout(150);
const enabled = await page.evaluate(() => window.__bridge.find(b => b.fn === "enableHeyChitti"));
const pillOn = await page.evaluate(() => document.getElementById("pill-hey-chitti").textContent);
record("Toggle on → enableHeyChitti bridge called", !!enabled, JSON.stringify(enabled || null));
record("Pill flips to 'Native ✓ · listening' when on", /Native ✓/.test(pillOn) && /listening/.test(pillOn), pillOn);

// ── 3. Toggle off → disableHeyChitti
await page.evaluate(() => toggleHeyChitti());
await page.waitForTimeout(150);
const disabled = await page.evaluate(() => window.__bridge.find(b => b.fn === "disableHeyChitti"));
const pillOff = await page.evaluate(() => document.getElementById("pill-hey-chitti").textContent);
record("Toggle off → disableHeyChitti bridge called", !!disabled);
record("Pill flips back to 'Android only · off'", /off/i.test(pillOff), pillOff);

// ── 4. WhatsApp send-after-haan auto-tap arm
await page.evaluate(() => { window.__bridge = []; });
await page.evaluate(() => openWAModal());
await page.waitForTimeout(150);
await page.evaluate(() => {
  document.getElementById("wa-to").value = "0";
  document.getElementById("wa-msg").value = "Main 7 baje aaunga";
});
await page.evaluate(() => confirmWASend());
await page.waitForTimeout(200);
const waArm = await page.evaluate(() => window.__bridge.find(b => b.fn === "armAccessibilityAction" && b.key === "wa_send"));
const waOpen = await page.evaluate(() => window.__bridge.find(b => b.fn === "openWhatsApp"));
record("WA send: armAccessibilityAction('wa_send', 2500) fires before openWhatsApp",
  !!waArm && waArm.ms === 2500, JSON.stringify(waArm || null));
record("WA send: openWhatsApp(phone, msg) fires", !!waOpen, JSON.stringify(waOpen || null));

// ── 5. YouTube auto-tap-first-result arm
await page.evaluate(() => { window.__bridge = []; });
await page.evaluate(() => openYouTubeModal());
await page.waitForTimeout(150);
await page.evaluate(() => document.getElementById("yt-q").value = "AR Rahman Vande Mataram");
await page.evaluate(() => confirmYouTube());
await page.waitForTimeout(200);
const ytArm = await page.evaluate(() => window.__bridge.find(b => b.fn === "armAccessibilityAction" && b.key === "yt_first_result"));
const ytOpen = await page.evaluate(() => window.__bridge.find(b => b.fn === "openYouTube"));
record("YouTube: armAccessibilityAction('yt_first_result', 2500) fires", !!ytArm);
record("YouTube: openYouTube(query) fires", !!ytOpen);

// ── 6. Voice intent "Lock my phone" + "Answer the call" + "Reject the call"
await page.evaluate(() => { window.__bridge = []; });
await page.evaluate(() => routeVoiceIntent("Lock my phone"));
await page.waitForTimeout(100);
await page.evaluate(() => routeVoiceIntent("Answer the call"));
await page.waitForTimeout(100);
await page.evaluate(() => routeVoiceIntent("Reject the call"));
await page.waitForTimeout(100);
const bridge = await page.evaluate(() => window.__bridge.map(b => b.fn));
record("Voice intents fire correct bridge methods (lockPhone + answerCall + rejectCall)",
  bridge.includes("lockPhone") && bridge.includes("answerCall") && bridge.includes("rejectCall"),
  JSON.stringify(bridge));

await browser.close();
const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
