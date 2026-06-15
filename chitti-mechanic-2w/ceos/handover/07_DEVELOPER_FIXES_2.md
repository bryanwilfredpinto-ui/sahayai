# 07 — Developer Fixes (QA round 2 — CEOS verification) — Chitti Mechanic 2 Wheeler

**Date:** 2026-06-15 · **Developer Agent:** Claude Opus 4.8 · **Branch:** `feat/mech2w-qa-fixes-2` (NOT merged).
Scope: only this product's files. #1/#5 = code fixes; #2/#3/#4 = CEOS-text re-scoped to match shipped reality (the exact doc-vs-reality mismatch QA flagged). #6/#7/#8 left to Sire per the QA next-actions.

| QA bug | Fix | Verified (local serve of branch) |
|---|---|---|
| **#1 Tyre <3 options** | Broadened usage tags + added 6th tyre (Maxxis M6302) + `tyreRecommend` now tops up to **exactly 3 priced options** for every usage | engine 94/94; counts = allround/mileage/durability/ev/performance → **3,3,3,3,3** |
| **#5 Tyre flow no budget/vehicle** | Added **budget** selector (Any/Value/Mid/Premium) → `tyreRecommend(usage, budget)`; result is scoped to the saved **vehicle** + shows 3 with budget flags | UI `#ty-budget` present; budget filter returns 3 |
| **#4 Nearest centre no distance** | `nearestQuery(kind,{lat,lng})` → consent-gated geolocation centres the Maps link so **Maps shows centres WITH distances**; honest label. **On-page numeric distance to a named centre = COMING SOON** (needs a paid Places API — Sire). Re-scoped PRD §5. | engine: coords → `/@lat,lng` link; fallback "near me" |
| **#2 OCR not implemented** | RE-SCOPED docs: `sop/document_intake.md` + `PRD`/`SKILLS`/`FEATURES` now state 🟢 **photo upload-to-store is LIVE**, 🔵 **OCR field-extraction COMING SOON** (vision model — Sire). UI unchanged (upload works; manual entry). | docs aligned |
| **#3 Reminder escalation push→SMS→voice** | RE-SCOPED `sop/reminder_escalation.md`: 🟢 **on-page voice + `.ics` calendar LIVE**, 🔵 **push/SMS/WhatsApp COMING SOON** (messaging gateway — Sire). Ladder is date-driven today. | docs aligned |

Regression (branch): engine **94/94** · cert **38/38** (axe 0 serious, 0 console errors) · audit **115/115**.

Not fixed by Developer (Sire decisions, per QA): #2 build real OCR (needs vision key) · #3 wire messaging gateway · #4 paid Places API for on-page distance · #6 fund DeepSeek for 100% translation · #7 crisis free-text keyword scope · #8 real-device sign-off.
Live-URL confirmation requires merging the PR to `main` (release decision; not done per the no-direct-push rule).
