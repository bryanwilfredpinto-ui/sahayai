🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-005 — Used-Car Inspection (10-point quick check)

**COSDF L7 SOP-005.** Trigger: *"yeh second-hand gaadi le lun?"* — a buyer standing in
front of a used car with 15 minutes, not a workshop. This is the **field 10-point** quick
screen; the full backend version is the **100-point** inspector in
[./used-car-inspection.md](./used-car-inspection.md) (`POST /api/4w/inspect`). Run this
10-point first; escalate to the 100-point + an OBD2 scan if it passes.

> India's used-car market is ≈ 1.4× new-car volume. A buyer with no mechanic friend is at
> the seller's mercy. COSDF L7 SOP-005 is the buyer's 10-point commando screen — and it
> rewards honest sellers who carry a
> [Vehicle Health Passport](../memory/vehicle_health_passport.md) Trust Score.

## The 10 points (in order — safety-critical first, spoken + picture one at a time)
| # | Point | What you're checking | Red flag → |
|---|---|---|---|
| 1 | **Walk-around + panel gaps** | even gaps bonnet/doors/boot; consistent shut lines | mismatched gaps = accident repair |
| 2 | **Paint consistency** | overspray on rubber/glass, colour/texture mismatch, masking lines | repainted panel = hidden damage |
| 3 | **Tyres + DOT date** | tread depth (wear bars), even wear, **all 4 + spare**, DOT week/year (< 5–6 yr) | cord/cuts/old date / uneven = alignment or suspension |
| 4 | **Underbody / sill rust + flood** | rust under sills, mud/silt in odd places, water-line, musty smell, damp carpet | structural rust / flood car = walk away |
| 5 | **Cold-start engine bay** | insist on a **stone-cold** start (warm start hides smoke + rough idle); idle steady? | won't let you cold-start = suspicious |
| 6 | **Oil cap + coolant** | "mayonnaise" cream under oil cap (coolant in oil); coolant clean, no oil film | mayonnaise = head-gasket → walk away |
| 7 | **Startup warning lights** | on key-on all lamps light, then **clear** — airbag/SRS, ABS, check-engine, oil | a lamp that won't clear (esp. airbag) = fault hidden |
| 8 | **Test-drive sounds + brakes** | knock/grind/whine; brakes bite firm, no pull, no judder; steering no play/clunk | grinding brakes / pull / play = 🔴 safety |
| 9 | **Service history + documents** | RC name = seller, insurance/PUC valid, no pending challans, hypothecation cleared, VIN = RC | mismatched VIN / loan not cleared = legal trap |
| 10 | **OBD2 scan** | plug a scanner — stored/pending DTCs, **readiness monitors set** | codes cleared just before sale (monitors "not ready") = hiding a fault |

## Scoring → verdict
Each point gets ✅ / ⚠️ / 🔴 (spoken + symbol, **never colour-only**). Then a buy/skip read
with cost-to-fix, e.g. *"Engine + brakes theek, par clutch jald (~₹13 000) aur 2 tyre
(~₹14 000) — asking ₹6.5 lakh, ₹6.1 tak baat karo."*

- **Any 🔴 safety item (brakes/steering/airbag/structural/flood)** = **walk away or
  fix-before-drive** — never "looks fine, buy it" over a safety red line.
- **A verified Vehicle Health Passport Trust Score beats a visual screen** — surface it
  first if the seller has one ([../memory/vehicle_health_passport.md](../memory/vehicle_health_passport.md)).
- Pass the 10-point → escalate to the [100-point](./used-car-inspection.md) + OBD2 +
  optional mechanic pre-purchase inspection before paying.

## Hard rules (LOCKED)
- Safety points (1, 3, 4, 6, 7, 8) weighted highest
  ([../guardrails/safety-rules.md](../guardrails/safety-rules.md)).
- **Bands, not a single "right" price**; confidence band on the overall read.
- **Never accuse the seller of fraud** — *"yeh weld accident ka ho sakta hai, confirm
  karo,"* not "ye chor hai."
- Insist on a **cold start** — a warm-started engine hides smoke and rough idle.
- Never invent a fault to scare the buyer into "Chitti found a problem"
  ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md),
  [../evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## Accessibility
Picture checklist + spoken walk-through, one point at a time on 2G; tap ✅/⚠️/🔴 per
point (mute); each verdict spoken (blind) + symbol+word+ISL (deaf); the cold-start and
oil-cap checks include a reference photo so an illiterate buyer matches by picture.
`fw_used_inspection` widget carries 🔊/🤖/👍/👎.

## Cross-links
[./used-car-inspection.md](./used-car-inspection.md) (full 100-point) ·
[../skills/tyres.md](../skills/tyres.md) · [../skills/brakes.md](../skills/brakes.md) ·
[./smoke_color.md](./smoke_color.md) (cold-start smoke) · [./brake_noise.md](./brake_noise.md) ·
[../memory/vehicle_health_passport.md](../memory/vehicle_health_passport.md) ·
[../swarm/trust-agent.md](../swarm/trust-agent.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
