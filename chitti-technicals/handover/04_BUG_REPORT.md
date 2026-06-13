🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# 04 — BUG REPORT

> 🔵 **PENDING skeleton — authored 2026-06-10, before the build runs.** No bugs are logged yet because **no gate has run yet**. This is not "zero bugs found" — it is "testing has not started." Honesty rule: an empty bug list before testing is PENDING, never a PASS.

---

## Status

- **Gates executed:** 0 (skeleton authored before build).
- **Bugs logged:** 0 — **because testing has not begun**, not because the code is clean.
- This page will be filled as BO gates run and defects surface.

---

## How bugs get logged here

Each bug, once found, is recorded with:

| Field | Meaning |
|---|---|
| `BUG-id` | Sequential id |
| `BO` | Which build order / gate surfaced it |
| `severity` | Sev-1 (blocks a four-user journey or a safety law) · Sev-2 (functional) · Sev-3 (cosmetic/substrate) |
| `area` | engine · accessibility · verdict · tip-shield · journal · i18n · cert · routing |
| `description` | What is wrong |
| `repro` | Exact steps / command |
| `expected vs actual` | The honest gap |
| `safety-law impact` | Does it break Art. 2/3/4/5/6? (escalates to Sev-1) |
| `status` | OPEN · FIXED · WONTFIX(rationale) |

**Severity rule:** anything that breaks four-channel recoverability (Art. 2), the confirm-gate (Art. 3), the mandatory ATR stop (Art. 5), or puts the LLM on a number/stop/verdict path (Art. 6) is **automatically Sev-1** and blocks GREEN.

---

## Bug ledger

| BUG-id | BO | Sev | Area | Description | Status |
|---|---|---|---|---|---|
| — | — | — | — | 🔵 **PENDING — to be filled when BO gates run** | — |

---

## Note

Known *design-level* gaps (missing pivots, Sire-blocked items, un-certified page) are **not bugs** — they are tracked honestly in [03_KNOWN_ISSUES.md](03_KNOWN_ISSUES.md). This file is only for defects found while running gates.

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
