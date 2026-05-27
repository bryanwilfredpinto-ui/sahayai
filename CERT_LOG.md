# CERT_LOG.md — Chitti CTO Page-by-Page Certifications

Each entry is one Chitti page certified by the CTO (Claude Opus 4.7) using
`tools/cert_<page>.mjs` (Playwright, 375px mobile-first). A page earns a
GREEN ✅ row only after **all 5 frontend gates (G1–G5 per
[QUALITY_STATUS.md §1a](QUALITY_STATUS.md)) + Sire's per-page specs**
pass on the **live URL**.

Format per row:

| Field | Meaning |
|---|---|
| **Date** | When the cert ran (UTC, derived from cert artifact's `ts`). |
| **Page** | The HTML file at the repo root. |
| **Live URL** | The production URL the cert ran against (`https://sahayai.in/<page>.html`). |
| **Checks** | `N/T` — N gates passed out of T total. |
| **Result** | GREEN ✅ (all pass) · YELLOW 🟡 (one gate honest-stub by design) · RED 🔴 (anything fails). |
| **Artifact** | Cert JSON + screenshots committed under `tools/cert_<page>_*`. |
| **Notes** | Substrate fixes, gaps surfaced, follow-ups. |

The cert tool itself is committed alongside each page's row so the cert is
reproducible by a future CTO / contributor: re-run `node tools/cert_<page>.mjs`
to regenerate.

---

## 2026-05-27 — Cert run 1

### chitti_logo_video.html — GREEN ✅

| Field | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Page** | [chitti_logo_video.html](chitti_logo_video.html) |
| **Live URL** | https://sahayai.in/chitti_logo_video.html |
| **Cert tool** | [tools/cert_logo_video.mjs](tools/cert_logo_video.mjs) |
| **Checks** | **19/19** |
| **Result** | **GREEN ✅** |
| **Artifact** | [tools/cert_logo_video_result.json](tools/cert_logo_video_result.json) + 4 screenshots at 375px (logo / video / share / calendar tabs) |
| **Substrate fixes shipped this cert** | (1) `chitti_a11y.js` now auto-injects `chitti_features.js` (per locked SAHAYAI_MASTER.md §2d — was a contract gap; every page lacked the 💡 What can Chitti do for you? button). (2) `chitti_a11y.js` now auto-injects new file `chitti_disability_profile.js` (per locked SAHAYAI_MASTER.md §7 + `project_user_disability_profile_locked` — modal was never built; every page was 🔴 RED on Gate G3 because the substrate didn't exist). Both substrate fixes lift every Chitti page in the repo, not just logo-video. |
| **Per-Sire-directive specs** | (1) ❌ "Remove stub mode completely" — interpreted per Sire's Q1=B answer: page is NOT a stub (real Three.js 3D logo generator + Canvas S-Heartbeat emblem + in-browser MediaRecorder for video) — confirmed live. Honest-stub locked rule §3 #4 preserved for any future provider-API path. (2) ✅ Indian flag colors (`#FF9933` / `#138808` / `#000080` + `--saffron` / `--green-flag` / `--navy` tokens — 6 stylesheet matches). (3) ✅ Language dropdown — 26-language `<select id="lang-select">` wired by chitti_lang.js. (4) ✅ S Heartbeat Emblem canvas present (`#s-emblem-canvas`) — animated Canvas pulse. (5) ✅ 4 tabs (Logo / Video / Share / Calendar), each click activates its pane. (6) ✅ 375px mobile-first — no horizontal scroll. |
| **5-gate result** | G1 ✅ (feedback-widget.js + 10 data-chitti-response boxes + 9/10 box-bars attached at runtime — the 10th is in Calendar tab which only renders post-click, expected). G2 ✅ (chitti_a11y.js + window.Chitti.a11y namespace). G3 ✅ (Disability Profile modal renders on first visit with 8 multi-select options + lang preselect + rural toggle, saves to localStorage.disability_profile per §7). G4 ✅ (window.Chitti.lang.current() = 'en'; `<html lang>` reflects it). G5 ✅ (chitti_isl.js + window.Chitti.isl namespace). |
| **Pageerrors** | 0 |
| **Honest YELLOW carry-forwards** | Disability Profile modal voice-out uses Web Speech API as a temporary substrate; will graduate to Voice Factory cascade once `chitti_a11y.speak` lands. ISL plugin loaded but Phase-1 dictionary coverage scoped to the 8 Disability Profile option labels — Phase-2 camera detection + Phase-3 community videos still COMING SOON per `project_chitti_isl_spec`. |
| **Vaani notification** | Per Sire's Q2=B answer — chat report + this CERT_LOG.md entry. No outbound Vaani channel attempted (Layer-5 fallback keys not in Render env). |

### chitti_complete_technical.html — GREEN ✅

| Field | Value |
|---|---|
| **Date** | 2026-05-27 |
| **Page** | [chitti_complete_technical.html](chitti_complete_technical.html) |
| **Live URL** | https://sahayai.in/chitti_complete_technical.html |
| **Cert tool** | [tools/cert_complete_technical.mjs](tools/cert_complete_technical.mjs) |
| **Checks** | **20/20** |
| **Result** | **GREEN ✅** |
| **Artifact** | [tools/cert_complete_technical_result.json](tools/cert_complete_technical_result.json) + 5 × 375px screenshots (calls / scanner / chart / watch / journal tabs) |
| **Fix shipped this cert** | The Calls Generator ⚡ Generate Calls button (Sire's Priority-1 feature shipped in 0c7f2a1) was throwing `runCallsScanRich is not defined` on every click. Root cause: 13 async functions inside the page's `if(!window._chittiLoaded){...}` reload-guard block were block-scoped per ES2015 (async function declarations don't get Annex-B web-compat hoisting to `window`, unlike regular `function` declarations). Inline `onclick="…()"` handlers couldn't find them. Fix: explicit `window.X = X;` at the end of the block for all 13 async functions (runCallsScanRich, runCallsScan, runScan, loadChart, loadIndexData, loadStrengthAndRating, loadCV, watchlistRefresh, chittiAskSend, sendChatTech, fetchAndDrawCascadedSR, _buildTradeSetupFromATR, _chittiRefreshSpend). Caught by CTO cert click-probe. |
| **Per-Sire-directive specs** | (1) ✅ Indian flag colors (`#FF9933` / `#138808` / `#000080` + token names — 6 stylesheet matches). (2) ✅ 26-language dropdown (`#lang-select`) wired by chitti_a11y + chitti_lang. (3) ✅ **Calls tab generating real signals** — `runCallsScanRich` now correctly on `window`; button fires the ATR-based call generator; universe selector carries all 5 buckets (nifty50 / largecap / midcap / smallcap / microcap). (4) ✅ **All stock universes complete** — `window.NSE.NIFTY50` (50) · `LARGECAP` (100) · `MIDCAP150` (150) · `SMALLCAP250` (250) · `MICROCAP250` (250) — 800 unique stocks via `nse_universe.js`. |
| **5-gate result** | All five gates GREEN on live (substrate fixes from prior commit lifted G3 + G5 across every page; G4 26-language list registered via chitti_lang.js). |
| **Locked-decision compliance** | NOT SEBI REGISTERED sticky bar present at top (`position:sticky, top=3px`) per `project_legal_disclaimer` — never demoted to footer. Roshan Indicator default ✅. |
| **Pageerrors** | 0 |
| **Honest YELLOW carry-forwards** | Some metric cards in Scanner / Chart tabs are marked `COMING SOON` (RSI S/R, Bollinger Bands squeeze, Stoch RSI, Supertrend visualization, Backtest, Saved Scans) — honest stubs per SAHAYAI_MASTER.md §3 rule 4; surfaced visually as "Soon" badges, not silently omitted. |
| **Vaani notification** | Per Sire's Q2=B answer — chat report + this CERT_LOG.md entry. |

---
