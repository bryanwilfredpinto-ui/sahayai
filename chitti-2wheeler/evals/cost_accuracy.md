🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# EVAL — Cost Accuracy (gate: ≥ 85% within band)

**Question:** does Chitti's predicted cost band actually contain the real repair cost?
If a rider trusts Chitti's band to check a mechanic's quote, the band must be right.

## Method
A labelled set of real repair invoices (community-sourced + verification-loop) across
common bikes and items. For each, Chitti predicts a **parts-only** and a **parts+labour**
band; the case passes if the **real cost falls inside the predicted parts+labour band**.

**Cost accuracy = (cases where real ∈ predicted band) / total ≥ 85%.**

## Gold cases (real Indian ₹ — Tier-2 metro median)
| Item / bike | Real invoice (₹) | Predicted band (₹) | In band? |
|---|---|---|---|
| Mineral oil change — Splendor | 420 | 350–500 | ✅ |
| Semi-synth oil change — RE Classic 350 | 880 | 700–1 000 | ✅ |
| Air filter — Activa | 350 | 250–600 | ✅ |
| Spark plug (1) — Pulsar 150 | 220 | 150–400 | ✅ |
| Chain + sprocket set — Pulsar NS200 | 3 100 | 1 800–4 000 | ✅ |
| Brake pads (pair) — RE Himalayan | 850 | 500–1 000 | ✅ |
| Tyre (rear, commuter) — Splendor | 1 650 | 1 400–2 500 | ✅ |
| Battery 12V 5Ah — Activa | 1 900 | 1 300–2 700 | ✅ |
| Major service — KTM Duke 390 | 2 100 | 1 200–1 800 | ❌ (synth premium → widen band) |

## What a miss teaches
The KTM major-service miss above is exactly the signal we want — premium/liquid-cooled
service runs higher than the commuter band. Misses feed band refinement and the
city/pincode delta (P1 community price-table).

## Hard rules
- Always a **band**, never a single number ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- When the diagnosis is uncertain, the band widens or Chitti says "depends on what the
  mechanic finds" — a confidently-wrong tight band is worse than an honest wide one.
- Bands power [Scam Shield](../skills/scam-shield.md) — "this quote appears high",
  never an accusation against a named mechanic.

## Cadence
Run every release; grows from every real invoice a rider shares via the verification
loop. Block GREEN if < 85%.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
