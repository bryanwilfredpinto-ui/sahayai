🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# MEMORY — Vehicle Health Passport (permanent vehicle memory)

> Every repair, invoice, diagnosis, photo and service ever done — kept as the bike's
> permanent, tamper-evident history. At resale, this becomes a **Vehicle Trust Score**
> a buyer can see. A second-hand bike with a full Chitti passport is worth more — and
> the honest seller is rewarded. (Patent-level idea — flagged for protection.)

## Store
- **IndexedDB** database `chitti_2w_passport`, append-only object store `events`.
- Each event is timestamped + immutable (edits create a new event, never overwrite) —
  so the history is trustworthy at resale.

## Event schema
| Field | Example |
|---|---|
| `type` | service / repair / diagnosis / invoice / photo / accident |
| `date` | ISO |
| `odo` | 24 350 |
| `item` | "chain + sprocket set", "front brake pads" |
| `cost` | ₹3 100 (within fair band ✅) |
| `verified` | from [verification loop](../observability/mechanic_verification_loop.md)? |
| `photo` | local-only invoice/part photo (never uploaded) |

## Vehicle Trust Score (shown to a buyer at resale)
A 0–100 score computed from the passport:
| Driver | Effect |
|---|---|
| Regular on-time services | ↑ |
| Repairs within fair price bands | ↑ |
| No skipped safety items (brakes/tyres) | ↑ |
| Long gaps / overdue safety items | ↓ |
| Accident events | ↓ (disclosed honestly — that's the point) |

> *"Splendor, 2019, 31 000 km — Trust Score 94/100. Full service history, brakes +
> tyres replaced on time, all repairs within fair price. Chitti-verified."*

## Resale advisor hook
Feeds [Resale advisor (W24)](../skills/FEATURES.md) — compares the bike's resale curve
vs maintenance-cost trajectory: *"ab bechna sahi rahega — agle saal repair cost resale
se zyada ho jayegi."*

## Privacy & ownership
- Lives **on the device**; the rider chooses to share a passport (e.g. a read-only
  resale card) — it is never auto-uploaded or sold.
- `"Chitti forget"` wipes it. The buyer sees only what the seller chooses to reveal.
- No plate / identity in any anonymised aggregate.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
