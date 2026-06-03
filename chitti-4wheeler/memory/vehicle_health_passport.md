🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# MEMORY — Vehicle Health Passport (permanent vehicle memory)

> Every repair, invoice, diagnosis, photo and service ever done — kept as the car's
> permanent, tamper-evident history. At resale, this becomes a **Vehicle Trust Score**
> a buyer can see. India's **used-car market is massive** (≈ 1.4× the new-car market) —
> a second-hand car with a full Chitti passport is worth more, and the honest seller is
> rewarded. (Patent-level idea — flagged for protection.)

## Store
- **IndexedDB** database `chitti_4w_passport`, append-only object store `events`.
- Each event is timestamped + immutable (edits create a new event, never overwrite) —
  so the history is trustworthy at resale.

## Event schema
| Field | Example |
|---|---|
| `type` | service / repair / diagnosis / invoice / photo / accident / dtc |
| `date` | ISO |
| `odo` | 64 350 |
| `item` | "front brake pads + discs", "AC compressor", "DPF clean" |
| `cost` | ₹21 000 (within fair band ✅) |
| `verified` | from [verification loop](../observability/mechanic_verification_loop.md)? |
| `dtc` | P0420 (if a code was involved) |
| `photo` | local-only invoice/part photo (never uploaded) |

## Vehicle Trust Score (shown to a buyer at resale)
A 0–100 score computed from the passport:
| Driver | Effect |
|---|---|
| Regular on-time services | ↑ |
| Repairs within fair price bands | ↑ |
| No skipped safety items (brakes/tyres/airbag recalls) | ↑ |
| Long gaps / overdue safety items | ↓ |
| Accident events | ↓ (disclosed honestly — that's the point) |
| Open recall not actioned | ↓ |

> *"Swift, 2020, 58 000 km — Trust Score 92/100. Full service history, brakes + tyres
> replaced on time, all repairs within fair price, no open recalls. Chitti-verified."*

## Used-car inspector hook
Feeds the [100-point used-car inspection SOP](../sop/used-car-inspection.md) — a verified
passport beats a visual inspection. If the seller's car has a Chitti passport, the buyer
sees the Trust Score first; if not, Chitti walks the buyer through the manual 100-point
inspection.

## Resale advisor hook
Feeds [Resale advisor (C19)](../skills/FEATURES.md) — compares the car's resale curve
vs maintenance-cost trajectory: *"ab bechna sahi rahega — agle saal repair cost resale
se zyada ho jayegi."*

## Privacy & ownership
- Lives **on the device**; the driver chooses to share a passport (e.g. a read-only
  resale card) — it is never auto-uploaded or sold.
- `"Chitti forget"` wipes it. The buyer sees only what the seller chooses to reveal.
- No plate / identity in any anonymised aggregate.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
