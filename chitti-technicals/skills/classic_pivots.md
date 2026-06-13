🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Classic Pivots — floor-trader support / resistance

> One of the 7 CEOS verdict indicators. Flagged in [../BUILD_ORDER.md](../BUILD_ORDER.md) as a **BO6 addition** — and it has **landed in the engine** (`classicPivots`). Honest status: present and exported. "Pivot" stays English in all 26 languages (Art. 9). Cross-links: [camarilla_pivots.md](camarilla_pivots.md) · [sr_confluence.md](sr_confluence.md).

---

## What it is (plain English / vernacular target)

The classic (floor-trader) pivot is the **single most-watched reference price of the day**: the average of yesterday's high, low and close. Around it sit three resistances (R1–R3) above and three supports (S1–S3) below.
- Price **above the pivot** → bias leans up for the session.
- Price **below the pivot** → bias leans down.
- **S1/R1** are the first realistic floor/ceiling; S2/R2/S3/R3 are stretch levels.

Vernacular framing: *"Aaj ka main level (pivot) ₹X — uske upar bullish, neeche bearish."*

## How the engine computes it (real)

`TechEngine.classicPivots(prevHigh, prevLow, prevClose)`:

```
PP = (high + low + close) / 3
R1 = 2×PP − low      S1 = 2×PP − high
R2 = PP + (high−low) S2 = PP − (high−low)
R3 = high + 2×(PP−low)   S3 = low − 2×(high−PP)
```

`pivotsFor(candles)` reads the **previous completed period** and returns `{ classic, camarilla }`. The pivot + S1/R1 anchor the verdict's spoken "floor / ceiling" and feed the structure stop in [risk_engine.md](risk_engine.md).

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Day pivot is ₹X. First support ₹S1, first resistance ₹R1." |
| 🔡 Text | a stacked table `R3 R2 R1 · PP · S1 S2 S3` with prices |
| 🔺 Icon+shape | resistances ▲, supports ▼, pivot ■ — shapes, not colour |
| 🤟 ISL/visual | "Pivot" fingerspelled + concept "today's balance line"; horizontal lines, distinct styles per level |
| 👁️ Blind | "show data as table" lists all 7 levels; the two nearest to price are announced |

## Honesty rail

A pivot level is **where many eyes are**, not a guarantee of a bounce. Chitti uses it to place stops/targets sensibly, never as a standalone reason to trade. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
