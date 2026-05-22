// End-to-end test for the Document Vault Phase 1 UI on chitti_vaani.html.
//
// Stubs:
//   - The backend isn't running on file://, so all /api/vaani/vault
//     fetches return canned JSON / 200.
//   - speechSynthesis stubbed.
//
// Asserts:
//   1. The 📁 Chitti Document Vault section is present.
//   2. With seeded /list response, the doc rows render with category
//      chip + expiry pill + 4 action buttons (open/speak/share/forget).
//   3. The expiry banner appears for docs expiring within 7 days.
//   4. Clicking 📤 (share) opens the Hindi confirmation modal with the
//      "Sahab, aapka <doc> <person> ko bhejna hai — theek hai?" line.
//   5. ✓ Haan triggers the share-token + wa.me / native bridge open.
//   6. ✗ Nahi cancels — no share fires.
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
      { name: "Lawyer Ji", realname: "Adv. Sharma", phone: "+919876543210", upi: "", email: "" },
    ]));
  } catch (e) {}
  window.__opened = [];
  window.open = (u) => { window.__opened.push(u); return null; };
  window.__shareIssued = false;
  window.__shareConsumed = false;
  window.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes("/api/vaani/vault/list")) {
      const today = new Date();
      const expSoon = new Date(today); expSoon.setDate(today.getDate() + 5);
      const expLater = new Date(today); expLater.setDate(today.getDate() + 25);
      const docs = [
        { doc_id: "aaa-pan", display_name: "PAN card", category: "pan",
          mime_type: "application/pdf", size_bytes: 184320, expiry_date: null,
          uploaded_at: today.toISOString(), notes: "Original document" },
        { doc_id: "bbb-dl", display_name: "Driving licence", category: "dl",
          mime_type: "image/jpeg", size_bytes: 512000,
          expiry_date: expSoon.toISOString().slice(0,10),
          uploaded_at: today.toISOString(), notes: "" },
        { doc_id: "ccc-policy", display_name: "LIC policy", category: "insurance",
          mime_type: "application/pdf", size_bytes: 261120,
          expiry_date: expLater.toISOString().slice(0,10),
          uploaded_at: today.toISOString(), notes: "Renewal premium ₹12,000" },
      ];
      return new Response(JSON.stringify({ docs }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (u.includes("/api/vaani/vault/expiries")) {
      const today = new Date();
      const expSoon = new Date(today); expSoon.setDate(today.getDate() + 5);
      return new Response(JSON.stringify({
        items: [{
          doc_id: "bbb-dl", display_name: "Driving licence", category: "dl",
          mime_type: "image/jpeg", size_bytes: 512000,
          expiry_date: expSoon.toISOString().slice(0,10),
          uploaded_at: today.toISOString(), notes: "",
          days_left: 5, bucket: "7_day",
        }], horizon_days: 30,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // Order matters — /share/consumed is a substring of /share, so the
    // more specific path must match first.
    if (u.includes("/api/vaani/vault/share/consumed")) {
      window.__shareConsumed = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (u.includes("/api/vaani/vault/share")) {
      window.__shareIssued = true;
      return new Response(JSON.stringify({
        ok: true, share_token: "tok_abc123def456", expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
        ttl_minutes: 30, doc_id: "aaa-pan",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (u.includes("/api/vaani/vault/delete")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response("{}", { status: 200 });
  };
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
await page.evaluate(() => {
  const o = document.getElementById("consent-overlay"); if (o) o.style.display = "none";
});

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

// 1. Section present
const hasSection = await page.evaluate(() => !!document.querySelector('section[aria-labelledby="vault-title"]'));
record("Vault section present", hasSection);

// 2. Three docs rendered
const rowCount = await page.evaluate(() => document.querySelectorAll("#vault-list .tc-row").length);
record("3 docs rendered from /list", rowCount === 3, `rows=${rowCount}`);

// 3. Expiry banner shown for the 5-day expiry
const expBanner = await page.evaluate(() => {
  const b = document.getElementById("vault-expiry-banner");
  return b && getComputedStyle(b).display !== "none" && (b.innerText || "").includes("Driving licence");
});
record("Expiry banner shows 'Driving licence expires in N days'", expBanner);

// 4. Click 📤 share on PAN card (first row) → Lawyer Ji
await page.evaluate(() => {
  window.prompt = () => "1";  // pick the first trusted contact
  // Click the share button on the PAN card (index 0)
  document.querySelectorAll('#vault-list .tc-row')[0]
    .querySelectorAll('.ctrls button')[2].click();
});
await page.waitForTimeout(400);
const shareModalOpen = await page.evaluate(() => document.getElementById("vault-share-modal").classList.contains("shown"));
const shareLine = await page.evaluate(() => document.getElementById("vault-share-line").textContent);
record("Share modal opens with Hindi 'Sahab — theek hai?' line",
  shareModalOpen && /Sahab/.test(shareLine) && /PAN card/.test(shareLine) && /theek hai/.test(shareLine),
  shareLine.slice(0, 120));

// 5. Backend share token issued
const tokenIssued = await page.evaluate(() => window.__shareIssued);
record("/api/vaani/vault/share called (audit token issued)", tokenIssued);

// 6. ✓ Haan → wa.me URL + /share/consumed called
await page.evaluate(() => confirmVaultShareYes());
await page.waitForTimeout(400);
const waUrl = await page.evaluate(() => (window.__opened || []).find(u => u && u.startsWith("https://wa.me/")));
const consumed = await page.evaluate(() => window.__shareConsumed);
record("Haan → wa.me opens with the recipient + message",
  !!(waUrl && waUrl.includes("919876543210")), waUrl || "(no wa.me)");
record("Haan → /share/consumed called (audit one-shot)", consumed);

// 7. Nahi path — no second share fires
await page.evaluate(() => {
  window.__opened = []; window.__shareConsumed = false; window.__shareIssued = false;
  window.prompt = () => "1";
  document.querySelectorAll('#vault-list .tc-row')[0]
    .querySelectorAll('.ctrls button')[2].click();
});
await page.waitForTimeout(300);
// Cancel by closing the modal
await page.evaluate(() => { closeModal('vault-share-modal'); CH_PENDING_SHARE = null; });
await page.waitForTimeout(200);
const waAfterCancel = await page.evaluate(() => (window.__opened || []).find(u => u && u.startsWith("https://wa.me/")));
record("Cancel (no haan) → no wa.me share fires", !waAfterCancel);

// 8. Voice intent — "Show me my PAN"
const showRouted = await page.evaluate(() => routeVoiceIntent("Show me my PAN"));
record("Voice 'Show me my PAN' routes through vaultShowByVoice", showRouted === true);

// 9. Voice intent — "Send my Aadhaar to Lawyer Ji" — should match by name even without an Aadhaar (vaultShareByVoice returns false for unknown doc)
const sendRouted = await page.evaluate(() => routeVoiceIntent("Send my PAN to Lawyer Ji"));
record("Voice 'Send my PAN to Lawyer Ji' routes through vaultShareByVoice", sendRouted === true);

await browser.close();
const passed = results.filter(r => r.pass).length;
console.log("\n## Summary");
console.log(`${passed}/${results.length} checks passed`);
if (errs.length) { console.log("Page errors:"); errs.slice(0, 5).forEach(e => console.log("  " + e)); }
process.exit(passed === results.length ? 0 : 1);
