🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Cost & Quote-Verification Domain

The wallet-defender. Owns repair cost estimation (parts + labour + total), the
fair-market band by city/segment, and **mechanic quote verification** — the anti-
overcharge engine behind Scam Shield. COSDF L3 sets cost accuracy at **±10%**. This
is where Chitti earns trust: telling a driver the ₹18,000 quote should be ₹6,000.
Aligns with COSDF F5; feeds [scam-shield.md](scam-shield.md).

## Domain principles
- **Always two numbers: parts-only and parts+labour.** A driver who knows the part
  price can't be padded on "parts." Labour varies by city and workshop tier.
- **Band, not a point.** Quote a range (low–high) tied to make/model/city/segment,
  never a fake-precise single figure ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- **Genuine vs OEM-equivalent vs aftermarket** — name the tier, because the same part
  spans 3× in price. Don't quote authorised-service-centre prices as "the" price.
- **Flag the classic upsells** — "your engine mount / all 4 tyres / full suspension /
  catalytic converter needs replacing" are the most-padded jobs in Indian workshops.

## Cost bands (illustrative, Indian metro, hatch/compact-SUV — verify live, not gospel)
| Job | Parts-only ₹ | Parts+labour ₹ | Common overcharge trick |
|---|---|---|---|
| Battery (Swift/Creta) | 4,000–6,500 | 4,500–7,500 | "needs alternator too" |
| Brake pads (per axle) | 1,200–3,000 | 1,500–4,000 | "discs also gone" when fine |
| Clutch kit (manual) | 5,000–14,000 | 6,000–18,000 | bundling flywheel needlessly |
| AC regas + service | 1,500–3,500 | 2,500–5,000 | "compressor failed" on a leak |
| Timing belt/kit | 4,000–9,000 | 7,000–16,000 | adding water pump w/o need |
| Catalytic converter | 8,000–30,000 | 9,000–35,000 | replacing for a P0420 = O2 fix |

> These are **example bands to anchor reasoning**, NOT measured/published prices.
> The eval harness (COSDF MECH-4, Sire-gated) sets the ±10% accuracy claim — until
> then Chitti speaks ranges and says "confirm locally," never a certified figure.

## Symptom → cost reasoning
- *Diagnosis is X* → pull the parts-only band → add city labour band → total range.
- *Mechanic quote provided* → compare to band: within → "fair" · 1.3–1.8× → "high, ask
  why / get a 2nd quote" · >1.8× or padded items → "likely overcharge" + which line item.
- *Multiple jobs bundled* → split each, flag any not supported by the diagnosis.

## Outputs this skill must emit
- **Cost band** — parts-only + parts+labour ₹ range, with part tier named.
- **Verdict on a quote** — 🟢 fair / 🟡 high (ask / 2nd opinion) / 🔴 likely overcharge,
  with the specific padded line item called out.
- **Confidence band** — `High/Medium/Low` on the estimate (Low when model/city unknown).
- **DIY savings** — when DIY tier allows, the ₹ saved by doing it safely at home.

## Swarm agents fed
This skill **is** the [Cost Agent](../swarm/cost-agent.md); it consumes the fault verdict
from Engine/Electrical/Fuel and the DIY tier from [DIY](../swarm/diy-agent.md) (to compute
savings). [Trust](../swarm/trust-agent.md) caps any "you're being cheated" claim — Chitti
flags *possible* overcharge with evidence, never accuses without the band. Output drives
[scam-shield.md](scam-shield.md) and the [Mechanic honesty score](../WORLD_CLASS_FEATURES.md).

## Roadmap (honest stubs — COSDF §3)
- Live city-wise parts-price feed + crowd-sourced real-quote median = roadmap. Today's
  bands are deterministic knowledge tables (LIVE) labelled as ranges, never as measured
  averages. ±10% accuracy is a **target** pending MECH-4, not a claim.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
