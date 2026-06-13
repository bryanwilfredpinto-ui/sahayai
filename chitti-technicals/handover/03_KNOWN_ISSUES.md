🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# 03 — KNOWN ISSUES (honest)

> Authored 2026-06-10. This doc is **honest by design** — it lists what is *not* done, not what is. Hiding a gap is a worse sin than having one. Every gap here is tracked to a BO.

---

## A. Engine — NO gaps (correction 2026-06-10)

An earlier draft listed Camarilla/Classic pivots + S/R confluence as missing. **That was wrong.** The reused `chitti_technical_engine.js` (v2.8.0) already exports `camarillaPivots`, `classicPivots`, `pivotsFor`, and `srConfluence` (engine lines 902–956) — plus `generateSignal`, `chittiVerdict`, `atrRiskBlock`, pattern recognition, backtest journal, scorecard + calibration. The full S/R + pivot stack **is wired**. The deterministic core passes **58/58** in `tools/test_technicals.cjs` (engine + Tip Shield).

**Real remaining gaps** are NOT in the engine — they are the unrun browser cert (§C) and the Sire-blocked items (§B).

---

## B. Sire-blocked (BO12 — standing fleet blocker)

These cannot be made green by the CTO; they need Sire:

| Blocker | Effect | Status |
|---|---|---|
| **DeepSeek funding** | No warm vernacular phrasing layer — verdicts render deterministic/templated only | 🔵 BLOCKED (Sire) |
| **Live Angel One SmartAPI keys** | No live NSE/BSE candles — engine runs on fixtures only | 🔵 BLOCKED (Sire) |
| **Vaani allowlist for `technical` intent** | The sole-interface path is not yet routable — user can't reach Technicals via Vaani | 🔵 BLOCKED (Sire) |
| **Real device + human AT** | iPhone/Android hardware + real screen reader / ISL pass not done | 🔵 BLOCKED (Sire) |

Per the CTO contract, the standing fleet blocker (DeepSeek funding + Angel keys) is the same one blocking siblings; it is honestly carried, not worked around with fake demos.

---

## C. Page not yet certified

`chitti_technical_ai.html` is a **skeleton/dev surface**. It has **not** passed:

- the BO11 cross-platform cert (Chromium/Firefox/WebKit × 5 devices),
- axe-core 0 serious/critical,
- the 5 frontend gates,
- the CTO 8-gate,
- the 375px screenshot-per-box on all 5 devices.

**No page ships GREEN** until all of the above pass (CONSTITUTION Art. 12). Today the page is 🔴 **un-certified**.

---

## D. What is NOT an issue (so it isn't mistaken for one)

- The CEOS **doc set** is authored (2026-06-10) — that part is DONE.
- The engine **exists** — BO6 is a wire-up + 3-indicator extension, not a from-scratch build.
- "Paper-only / analysis-not-advice / NOT SEBI" are **locks, not gaps** — they are intentional and permanent.

---

## Issue ledger

| ID | Issue | Severity | BO | Status |
|---|---|---|---|---|
| KI-01 | ~~Engine lacks Camarilla pivots~~ — engine HAS it (`camarillaPivots`) | — | BO6 | ✅ RESOLVED (was false) |
| KI-02 | ~~Engine lacks Classic pivots~~ — engine HAS it (`classicPivots`) | — | BO6 | ✅ RESOLVED (was false) |
| KI-03 | ~~Engine lacks multi-TF S/R confluence~~ — engine HAS it (`srConfluence`) | — | BO6 | ✅ RESOLVED (was false) |
| KI-04 | DeepSeek warm layer unfunded | High | BO12 | BLOCKED (Sire) |
| KI-05 | Live Angel One keys absent | High | BO12 | BLOCKED (Sire) |
| KI-06 | Vaani `technical` allowlist absent | High | BO12 | BLOCKED (Sire) |
| KI-07 | Page not certified (5-device/axe/8-gate) | High | BO11 | OPEN |
| KI-08 | Real device + human AT pass not done | Medium | BO12 | BLOCKED (Sire) |

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
