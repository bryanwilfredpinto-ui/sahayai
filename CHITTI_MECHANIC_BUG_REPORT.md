🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# BUG REPORT — Chitti Mechanic
**Deliverable 4 of 5 · Pre-handover sign-off (Part A8) · v2 (2026-06-05)**

**Date:** 2026-06-05 · **From:** [tools/qa_handover.mjs](tools/qa_handover.mjs) re-run (**44/45 PASS**, 22 journeys
incl. RC J11, 3 engines) + standing suites (cert 24/24 · §5 8–16 · RC 20/20 · RC-langs 54/54).
**Totals:** Critical **0** · High **0** · Medium **1 OPEN-with-workaround** (BUG-1) + **3 FIXED** (BUG-2 img-alt,
BUG-3 car-title i18n, BUG-4 a test-harness bug) · Low **0**.

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

## BUG-3 — Car Doctor form title showed "My Bike" · **Medium (i18n)** · **FIXED** *(v2)*
- **Where:** [chitti_4wheeler.html](chitti_4wheeler.html) add-vehicle card title — used the bike-namespaced key
  `mb.form.title` ("My bike" / "मेरी बाइक"), so a Hindi car user saw **"मेरी बाइक"** on the **car** page.
- **Root cause:** `mc.form.title` was never created in `strings.js`.
- **Repro:** car page → switch to Hindi → add-vehicle card title reads "मेरी बाइक".
- **Fix (v2):** injected `mc.form.title` into `strings.js` for **all 9 languages** (from the vetted `mc.tab.car`
  values), retargeted the car page. **Verified on pixels:** hi "मेरी गाड़ी" · en "My Car" · ta "என் கார்"
  ([CARFIX_form_title.png](tools/cert_screenshots/CARFIX_form_title.png)). A full car-page sweep found **no other
  bike/car string bleed**. RC-langs matrix re-confirms: **54/54**.

## BUG-4 — *Test-harness only* — J11 read a leftover demo `make` · **Low (test, not product)** · **FIXED** *(v2)*
- **Where:** the new J11 RC journey in [qa_handover.mjs](tools/qa_handover.mjs).
- **What happened:** J11 asserted `make===''` to prove "RC doesn't fabricate a make", but an **earlier** journey
  (J2) had already saved a demo bike, leaving `mb-make` = "Hero". So the assertion read the **demo leftover**,
  not anything the RC scan did → false negative (the standalone RC tests passed 20/20 + 54/54).
- **Why it matters:** important to log honestly — it was a **test bug, the product is correct** (RC leaves the
  make untouched and never fabricates one).
- **Fix:** J11 now clears `make` immediately before the capture, then asserts it **stays** empty → proves
  non-fabrication regardless of prior journeys. Re-run: **22/22 journeys, 44/45 total**.

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
| **Force RC to fabricate a make** (capture with no vision endpoint) | ✅ never fabricates — shows honest "coming soon" |
| **RC reg parser fed junk** ("hello world") | ✅ returns null, no false state/RTO |

## Screenshots (committed)
- [handover_bike.png](tools/cert_screenshots/handover_bike.png) · [handover_car.png](tools/cert_screenshots/handover_car.png) — post-journey state, mobile 390px.
- [handover_safari_bike.png](tools/cert_screenshots/handover_safari_bike.png) — WebKit/Safari engine render.
- **RC scan (v2):** [RC_bike.png](tools/cert_screenshots/RC_bike.png) · [RC_car.png](tools/cert_screenshots/RC_car.png) — saffron MedUPI card, live "Registered in: <State> · RTO <nn>" chip.
- **Car-title fix (v2):** [CARFIX_form_title.png](tools/cert_screenshots/CARFIX_form_title.png) — "मेरी गाड़ी" not "मेरी बाइक".
- Prior language proof: [LIVE_selffix_ta.png](tools/cert_screenshots/LIVE_selffix_ta.png) (Tamil),
  [LIVE_healthscore_hi.png](tools/cert_screenshots/LIVE_healthscore_hi.png) (Hindi).

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
