🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Camarilla Pivots — intraday gravity grid

> One of the 7 CEOS verdict indicators. Flagged in [../BUILD_ORDER.md](../BUILD_ORDER.md) as a **BO6 addition** — and it has **landed in the engine** (`camarillaPivots`). Honest status: present and exported. "Camarilla" stays English in all 26 languages (Art. 9). Cross-links: [classic_pivots.md](classic_pivots.md) · [sr_confluence.md](sr_confluence.md).

---

## What it is (plain English / vernacular target)

Camarilla pivots take **yesterday's high, low and close** and project a grid of "magnet" price levels for today. Two are special:
- **H3 / L3** — the levels where intraday moves often **reverse** (mean-reversion edges).
- **H4 / L4** — break-out levels: a clean move beyond H4 (up) or L4 (down) hints at a trending day.
The H5/L5 are the extreme stretch levels.

Vernacular framing: *"Aaj ka 'ceiling' H3 ke aas-paas hai, 'floor' L3 ke aas-paas."*

## How the engine computes it (real)

`TechEngine.camarillaPivots(prevHigh, prevLow, prevClose)` — gravity grid `close ± (high−low) × {0.25, 0.50, 0.75, 1.00, 1.25}`:

```
range r = prevHigh − prevLow
h3 = close + r×0.75   h4 = close + r×1.00   h5 = close + r×1.25
l3 = close − r×0.75   l4 = close − r×1.00   l5 = close − r×1.25
(h1/h2/l1/l2 = the 0.25 / 0.50 inner levels)
```

`pivotsFor(candles)` reads the **previous completed period** and returns `{ classic, camarilla }`. These levels feed the support/resistance read and the verdict's "floor X, ceiling Y" narration (the Webull "Cheat Sheet" steal).

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Today's reversal floor is around L3 at ₹X; the ceiling is around H3 at ₹Y." |
| 🔡 Text | a table: `H4 H3 (pivot) L3 L4` with prices — read top-to-bottom |
| 🔺 Icon+shape | ceiling levels marked ▲, floor levels ▼, pivot ■ — shapes, not colour |
| 🤟 ISL/visual | "Camarilla" fingerspelled + concept "magnet levels from yesterday"; horizontal lines with labels, distinct line styles per tier |
| 👁️ Blind | "show data as table" lists every level + price; nearest level to current price announced |

## Honesty rail

Pivots are **reference levels, not predictions** — price ignores them as often as it respects them. Chitti uses them to frame *where* a stop or target sits, never as a buy trigger. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
