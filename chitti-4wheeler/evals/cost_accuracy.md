🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# EVAL — Cost Accuracy (gate: ≥ 85% within band)

**Question:** does Chitti's predicted cost band actually contain the real repair cost?
If a driver trusts Chitti's band to check a service-centre quote, the band must be right.

## Method
A labelled set of real repair invoices (community-sourced + verification-loop) across
common cars and items. For each, Chitti predicts a **parts-only** and a **parts+labour**
band; the case passes if the **real cost falls inside the predicted parts+labour band**.

**Cost accuracy = (cases where real ∈ predicted band) / total ≥ 85%.**

## Gold cases (real Indian ₹ — Tier-2 metro median)
| Item / car | Real invoice (₹) | Predicted band (₹) | In band? |
|---|---|---|---|
| Mineral oil change — Swift | 2 100 | 1 500–2 500 | ✅ |
| Synthetic oil change — Creta 1.5 | 4 800 | 3 500–5 500 | ✅ |
| AC cabin filter — Baleno | 550 | 350–700 | ✅ |
| Spark plug set (4) — Venue | 1 700 | 800–2 000 | ✅ |
| Brake pads (front pair) — Nexon | 2 400 | 1 200–2 800 | ✅ |
| Battery 45 Ah — Creta | 6 800 | 4 500–7 500 | ✅ |
| Alternator (recon) — Swift | 7 200 | 5 000–15 000 | ✅ |
| AC compressor — Creta | 21 000 | 18 000–24 000 | ✅ |
| Clutch overhaul — Baleno | 13 500 | 8 000–18 000 | ✅ |
| DPF clean — Nexon diesel | 14 000 | 3 000–12 000 | ❌ (heavy clog premium → widen band) |

## What a miss teaches
The DPF miss above is exactly the signal we want — a badly-clogged diesel DPF in a
short-trip city car runs higher than the typical clean band. Misses feed band
refinement and the city/pincode delta (P1 community price-table), and flag where
authorised-dealer pricing diverges from independent.

## Hard rules
- Always a **band**, never a single number ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- When the diagnosis is uncertain, the band widens or Chitti says "depends on what the
  mechanic finds" — a confidently-wrong tight band is worse than an honest wide one.
- Bands power [Scam Shield](../skills/scam-shield.md) — "this quote appears high",
  never an accusation against a named centre.

## Cadence
Run every release; grows from every real invoice a driver shares via the verification
loop. Block GREEN if < 85%.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
