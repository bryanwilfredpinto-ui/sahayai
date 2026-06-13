🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# S/R Confluence Zones — multi-timeframe support / resistance

> One of the 7 CEOS verdict indicators. Flagged in [../BUILD_ORDER.md](../BUILD_ORDER.md) as a **BO6 addition** — and it has **landed in the engine** (`srConfluence`). Honest status: present and exported. Cross-links: [classic_pivots.md](classic_pivots.md) · [camarilla_pivots.md](camarilla_pivots.md) · [confluence_engine.md](confluence_engine.md).

---

## What it is (plain English / vernacular target)

A single support line is weak; a price where **several timeframes** agree there's support is a **zone that matters**. S/R confluence finds the prices where the daily, 4-hour and 1-hour charts all see a floor or ceiling, and weights the higher timeframe more.

Vernacular framing: *"₹X par teen alag-alag charts ek saath 'floor' bol rahe hain — yeh zone strong hai."*

## How the engine computes it (real)

`TechEngine.srConfluence(candlesByTf)`:
- Collects swing levels from `daily` (weight 3), `4h` (weight 2), `1h` (weight 1).
- Clusters nearby levels into **zones**; a zone's strength = sum of the timeframe weights that contributed.
- Returns the ranked zones (strongest first) — the ones where multiple timeframes overlap.

These zones tell the verdict where the **real** floor/ceiling is, and give [risk_engine.md](risk_engine.md) a structure-based stop that respects the higher timeframe (matching the `LADDERS` "higher TF governs" rule in [confluence_engine.md](confluence_engine.md)).

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Strong support zone at ₹X — three timeframes agree. Nearest resistance zone ₹Y." |
| 🔡 Text | a ranked list: `zone ₹X · strength 6/6 · daily+4h+1h` |
| 🔺 Icon+shape | zones drawn as bands; strength shown as band **thickness** + a 1–6 number, not colour |
| 🤟 ISL/visual | concept panel "where many charts agree there's a floor"; banded levels with thickness = strength |
| 👁️ Blind | "show data as table" lists each zone, its price, and its strength score; nearest zone announced |

## Honesty rail

A confluence zone is a **higher-probability** reference, not a wall — strong news blows through any level. Chitti frames it as *"this is a level worth watching, be careful,"* never *"it will bounce here."* *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
