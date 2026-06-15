# 04 — Live QA Report — Chitti Mechanic 2 Wheeler

**Date:** 2026-06-15 · **QA Agent:** Claude Opus 4.8 (20-yr QA) · **Target:** https://sahayai.in/chitti_mechanic_2w.html (production, live).
**Harnesses (real Playwright vs live):** [`tools/qa_live_mechanic_2w.mjs`](../../../tools/qa_live_mechanic_2w.mjs) + [`tools/qa_live_buttons_2w.mjs`](../../../tools/qa_live_buttons_2w.mjs). Evidence, no claims.

## QA REPORT — Chitti Mechanic 2 Wheeler — 2026-06-15

### How To Use Test
There is **no section literally titled "How to use Chitti"** (finding BUG-1). The equivalent is the hero button **"▶️ How it works (30-sec tour)"**, whose 5 steps I followed:
- Step 1: Add your bike (My Bike) — **PASS** — saved "Honda Activa", result "Saved on this device ✅".
- Step 2: Chitti watches it → Reminders — **PASS** — "1 urgent, 4 total"; Service due, PUC 10 days, Insurance 25 days, each with 📅 Add-to-calendar.
- Step 3: Doctor → pick symptom → safe-to-ride verdict — **PASS** — "🟡 Caution… confirm with a mechanic".
- Step 4: Buy/Sell fair price + risk flags — **PASS** — "Buy Score 76/100 — Buy with caution".
- Step 5: Voice on every card (tap 🔊) — **PASS** — 🔊 "Read this aloud" on every result; `speechSynthesis` present.

### Four User Test
- Blind: **PASS** — `speechSynthesis` available; "🔊 Read page" header button present (1); 🔊 on every result; auto-read-for-blind path wired. (Real VoiceOver/TalkBack device pass = Sire.)
- Deaf: **PASS (with BUG-3)** — every result shows WORD + symbol (✅/⚠️/🔴/ℹ️, never colour-only); 5-element caption/feedback bar on **17/17** boxes. ISL: substrate loaded (`window.Chitti.isl` = true) but only **2 ISL DOM nodes** on live — per-response ISL panel not visibly attached (BUG-3).
- Mute: **PASS** — 216 tap targets; every action is a button/tap; no action requires voice.
- Illiterate: **PASS** — 15 emoji-labelled tabs; 🔊 + icons on every box; auto-read. (Voice quality = Bhashini-mock until community voices.)

### Language Test
- Hindi: **FAIL (BUG-2)** — switch works (`html[lang]=hi`, persists) but only **30 of 456 text nodes** translated (~7%). The page's own copy stays English; only shared substrate strings translate.
- Kannada: **FAIL (BUG-2)** — same, **30/456** (~7%). RTL handling correct for Urdu (verified separately).

### Mobile Test: **PASS** — 375px: `scrollWidth 375 == clientWidth 375`, **no horizontal scroll**.

### Button Audit (live real-tap, 390px)
PASS (28): How it works · Save my bike · My scores · Save document · My documents · Check my reminders · Diagnose · Explain code · Find mechanic · Get Buy Score · Suggest price · Compare insurers · Buy/renew now · Check PUC · Nearest PUC centre · Find tyre deals · Log replacement · Check battery · Calculate ROI · Show the steps · Watch DIY video · All guides · Log a saving · Show total · Vehicle Twin · Show emergency · Read page · Language dropdown.
FLAKY/TIMEOUT (7, BUG-4 — live tap latency, handlers verified working in run-1 + 115/115 audit on identical build): List on OLX · Service & oil plan · Schedule service · Nearest service centre · Are mine worn · Recommend tyres · Check the quote.
Buttons total: 170 on page, **0 without an accessible name**. Dropdowns: all 7 present + populated (lang 26, class 4, doctype 4, symptom 9, tyre-use 5, sell-cond 3, learn 8).

### OVERALL: **FAIL** — one blocker (BUG-2, language coverage) on a vernacular-first product; everything else PASS.

## Bugs found (for Developer Agent)
- **BUG-2 (P0, blocker):** Whole-UI translation fails — only ~30/456 strings translate in Hindi & Kannada (~7%). The product's #1 promise is "in your language." **Fix:** add `chitti_mechanic_2w.html` page strings to the per-language packs (`lang/*.js`) — or run them through DeepSeek/community translation — so the entire UI (tab labels, card titles, sub-text, button labels, result templates) switches. Proper nouns (Activa, Pulsar, CEAT, Servo) stay English by design.
- **BUG-3 (P2):** ISL panel substrate loads but is not visibly attached per response (only 2 ISL DOM nodes live). **Fix:** verify `chitti_a11y.js` ISL Phase-1 panel renders next to every `[data-chitti-response]` on this page (memory says it should auto-attach).
- **BUG-4 (P2):** Live tap latency — 7/35 real taps hit 6–8s click-timeouts (interspersed with passes). Likely the `chitti_lang.js` MutationObserver re-scanning the DOM keeps elements "unstable." **Fix:** debounce/disconnect the observer during idle, or reduce re-scan scope, so taps feel instant on slow connections.
- **BUG-5 (P3):** One intermittent uncaught page error during the tap run (run-1 had 0). **Fix:** capture + identify the source (likely a substrate timing race).
- **BUG-1 (P3):** No section literally titled "How to use Chitti." **Fix:** rename "How it works" or add a clearly-labelled "How to use Chitti" heading so users/QA find it by name.

Reproduce: `node tools/qa_live_mechanic_2w.mjs && node tools/qa_live_buttons_2w.mjs`.
