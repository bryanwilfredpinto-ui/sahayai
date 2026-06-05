🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# FASHION_TWIN — CFOS v2.0 (skill_12)

> A private, on-device **digital twin** of the user's style — so Chitti's advice gets
> sharper every day, and gets smarter from feedback. Memory: [memory/](memory/).
> Engine: [chitti_fashion_engine.js](../chitti_fashion_engine.js)
> (`analyseColour`, `deriveSeason`, `paletteFor`, learning bias).

## What the Twin tracks (all on-device)

| Field | Source | Use |
|---|---|---|
| **Wardrobe** | IndexedDB `chitti_fashion_almari` (photos local only) | dress-from-own, simulator, ROI |
| **Personal colour palette** | `deriveSeason()` over the wardrobe's real **hex** colours → warm/cool/clear/soft | "your best colours", contrast/undertone scoring |
| **Liked / disliked** | 👍 / 👎 on outfits → liked colour-families + categories | **learning loop** biases future `buildOutfits` ranking |
| **Occasions** | saved upcoming events | proactive planning (🟡) |
| **Colours owned** | per-category palette | gap detection, capsule math |
| **Usage / wear frequency** | "worn" taps | cost-per-wear, rare-worn revival |
| **Body comfort / fit preference** | relaxed / structured (never a body judgment) | `fitNote()` — garment-term silhouette guidance |
| **Climate · culture · profession** | optional profile | occasion + seasonal + cultural tailoring |
| **Measurements / purchases** | optional | size guidance, cost analytics (🟡) |

## The learning loop (live)

A 👍 on an outfit records its colour-families + categories into the Twin; a 👎 decrements
them. `buildOutfits()` adds a small **like-boost** to combinations matching the user's
liked palette/categories — so Chitti drifts toward what *this* user actually wears.
Capped (≤ 0.15) so it never overrides occasion/accessibility/budget.

## Privacy contract (absolute)

- The Twin lives **on the device**. Photos never leave. Only a short *text* snapshot
  (`id:category:colour:occasions`) ever reaches the model.
- `"Chitti forget"` wipes the Twin (IndexedDB + profile) and tombstones any aggregate.
- DPDP Act 2023 compliant. The Twin is never sold, never synced as identity.

## Roadmap

Auto-build a full visual Twin from photos; outfit history + cost-per-wear journal;
cross-wearer Family Twin coordination. 🟡/🔵 — see [ROADMAP.md](ROADMAP.md).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
