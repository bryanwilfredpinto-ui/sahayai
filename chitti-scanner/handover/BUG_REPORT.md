🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# BUG_REPORT — Chitti Universal Scanner (CUSOS) · Part A8

**Date:** 2026-06-05 · **Found during:** CUSOS QA pass (live-backend probing + Playwright cert).
Priority: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low.

## 🟠 HIGH — FOUND & FIXED this pass

### BUG-1 — Router dead-ends when the backend blocks/fails
- **Severity:** HIGH (broke the core "deterministic core works with backend down" promise).
- **Repro:** Type a normal label ("Crocin 500mg") → Analyse. The live backend rail returns
  `ok:false` (`source:"blocked"`). `applyResult()` returned **early**, so the new Universal
  Router never rendered → the user got "⚠️ Could not analyse" and **no routing**.
- **Evidence:** live curl shows `source:"blocked"` for normal labels; pre-fix `applyResult`
  early-returned on `!d.ok`.
- **Fix:** `applyResult` now runs the deterministic router on the typed text even when the
  backend fails/blocks, renders the route card, and speaks an honest "the server isn't
  available, but from your text I can route this to…".
- **Verified:** Playwright probe against the **live** backend — backend call fails, router
  still routes `medicine → MedUPI`. ✅
- **Status:** ✅ FIXED + verified.

## 🟡 MEDIUM

### BUG-2 — Double 🧭 icon on the router card header (cosmetic)
- **Severity:** Low/Medium (visual only).
- **Repro:** Router card showed "🧭🧭 Chitti is sending this to…" (icon span + headline both
  carried the compass).
- **Fix:** removed the duplicate `.rc-ico` span; headline keeps the single 🧭.
- **Status:** ✅ FIXED + re-cert 16/16.

### BUG-3 — Pre-existing axe violations (NOT introduced by CUSOS)
- **Severity:** Medium (accessibility), pre-existing.
- **Detail:** 6 `color-contrast` (substrate-injected elements) + 2 `nested-interactive`
  (original capture buttons). See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) K3/K4.
- **CUSOS contribution:** **0 new** (axe gate scoped to router = 0).
- **Status:** ⏸ documented as fleet/pre-existing; not fixed in this scope (would touch shared
  substrate + every page → separate cert).

## 🔴 P1 (backend — not a frontend bug, documented for completeness)

### BUG-4 — Relevance-rail blocks normal labels (K1) · BUG-5 — DeepSeek fallback (K2)
- See [KNOWN_ISSUES.md](KNOWN_ISSUES.md). Owner: backend / infra. Mitigated client-side by
  BUG-1's fix (router resilience).

## Tally

| Priority | Found | Fixed | Open |
|---|---|---|---|
| 🔴 Critical | 0 | 0 | 0 |
| 🟠 High | 1 (BUG-1) | 1 | 0 |
| 🟡 Medium | 2 (BUG-2 cosmetic, BUG-3 pre-existing a11y) | 1 | 1 (pre-existing, documented) |
| 🔵 Backend P1 | 2 (BUG-4/5) | 0 | 2 (infra/backend owner) |

**New bugs introduced by CUSOS into the frontend: 0 open** (BUG-1 found+fixed, BUG-2
found+fixed). Pre-existing/backend items are documented, not hidden.

## Evidence / screenshots

- `tools/cert_screenshots/chitti_scanner_cusos_375.png` (664 KB)
- `tools/cert_screenshots/chitti_scanner_cusos_768.png` (732 KB)
- `tools/cert_screenshots/chitti_scanner_cusos_1280.png` (284 KB)
- Reproduce: `CERT_BASE=http://127.0.0.1:8770 node tools/cert_scanner_cusos.mjs` ·
  `node tools/scanner_router_eval.mjs`.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
