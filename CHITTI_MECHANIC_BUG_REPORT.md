🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# BUG REPORT — Chitti Mechanic
**Deliverable 4 of 5 · Pre-handover sign-off (Part A8)**

**Date:** 2026-06-05 · **From:** [tools/qa_handover.mjs](tools/qa_handover.mjs) run (41/43 PASS) + standing suites.
**Totals:** Critical **0** · High **0** · Medium **2** (1 FIXED, 1 OPEN-with-workaround) · Low **0**.

> Evidence note: this AI cannot attach video; bugs carry **reproduction steps + measured numbers + the
> committed screenshots** that the harness wrote to [tools/cert_screenshots/](tools/cert_screenshots/).

---

## BUG-1 — Slow first-visit load on 2G/3G · **Medium** · OPEN (workaround in place)
- **Where:** both pages, first visit only.
- **Repro:** Chromium → CDP `Network.emulateNetworkConditions` 400 kbps / 400 ms latency → load
  `chitti_2wheeler.html` → measure DOMContentLoaded.
- **Expected:** < 3 s. **Actual:** **~36,976 ms (~37 s).**
- **Cause:** large substrate JS bundle downloaded serially on a slow link.
- **Impact:** a first-time rural 2G/3G user waits ~37 s. **Not a crash, no data loss.** On Wi-Fi/4G the same
  load is **1234 ms** (measured); repeat visits are instant (service-worker cache).
- **Mitigation already shipped:** removed the 6,600-line `chitti_lang.js` (~250 KB), service-worker precache.
- **Fix (tech-debt #1):** split/defer non-critical substrate, lazy-load the wizard/scanner modules.
- **Screenshot:** N/A (timing finding) — number reproducible via the harness.

## BUG-2 — Two `<img>` without `alt` attribute · **Medium (a11y)** · **FIXED**
- **Where:** `mb-photo-preview` (line ~467) + `mc-photo-preview` (line ~485) — the hidden photo-preview imgs.
- **Repro:** a11y attribute audit: `Array.from(document.querySelectorAll('img')).every(i => i.hasAttribute('alt'))` → false.
- **Impact:** screen readers announce nothing for the user's captured photo.
- **Fix (this pass):** added `alt="Your captured photo for diagnosis"` to both. Re-audit: **all `<img>` have alt** ✅.

---

## Things QA explicitly TRIED to break — and could not (no bug)
| Attack | Result |
|---|---|
| No internet (all network aborted) | ✅ offline Self-Fix works (deterministic KB) |
| localStorage throws on access | ✅ graceful, no crash (guarded) |
| Rapid language switch ×10 in <5 s | ✅ no crash, ends clean (no raw keys) |
| 10 MB image + corrupted image upload | ✅ handled, no crash |
| JS disabled | ✅ static content shows (interactivity needs JS — by design) |
| Cross-engine (Firefox + WebKit/Safari) render + diagnose + Tamil | ✅ 4/4 |

## Screenshots (committed)
- [handover_bike.png](tools/cert_screenshots/handover_bike.png) · [handover_car.png](tools/cert_screenshots/handover_car.png) — post-journey state, mobile 390px.
- [handover_safari_bike.png](tools/cert_screenshots/handover_safari_bike.png) — WebKit/Safari engine render.
- Prior language proof: [LIVE_selffix_ta.png](tools/cert_screenshots/LIVE_selffix_ta.png) (Tamil),
  [LIVE_healthscore_hi.png](tools/cert_screenshots/LIVE_healthscore_hi.png) (Hindi).

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
