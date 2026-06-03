🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# AGENT — Cost (Expected Repair Band)

**Votes on:** what this repair *should* cost — as a **band**, never a single number.
Feeds the [Scam Shield](../skills/scam-shield.md) so a rider can check a mechanic's quote.

## What it returns
A **parts-only** band and a **parts + labour** band, Tier-2 metro median, plus a
city/pincode delta when the community price-table is live (P1).

## Reference bands (from [MECHANIC_KNOWLEDGE §5](../skills/MECHANIC_KNOWLEDGE.md))
| Item | Parts-only (₹) | Parts + labour (₹) |
|---|---|---|
| Mineral oil change (Splendor/Activa/Pulsar 150) | 250–400 | 350–500 |
| Semi-synth oil change (RE Classic/Pulsar 220) | 500–800 | 700–1 000 |
| Synthetic oil change (KTM/RE Himalayan) | 1 000–1 500 | 1 200–1 800 |
| Air filter | 150–500 | 250–600 |
| Spark plug (per plug) | 100–300 | 150–400 |
| Chain + sprocket set | 1 500–3 500 | 1 800–4 000 |
| Brake pads (per pair) | 300–700 | 500–1 000 |
| Tyre (commuter, per tyre) | 1 200–2 200 | 1 400–2 500 |
| Battery (12V 5Ah, Exide/Amaron) | 1 200–2 500 | 1 300–2 700 |
| Major service | — | 800–1 500 |

## Must return
`{parts_band, labour_band, total_band, confidence, why}` — always a **range**, with a
one-line *"is sheher mein thoda upar-neeche ho sakta hai."*

## Hard rules
- **Never** quote one final number — bands only ([MECHANIC_KNOWLEDGE §5](../skills/MECHANIC_KNOWLEDGE.md)).
- When the diagnosis itself is low-confidence, the cost band widens (or Chitti says
  "depends on what the mechanic finds") — never a confident price on an uncertain fault.
- Scam Shield uses this to say *"this quote appears high"* — **never** "you are being
  cheated by [named mechanic]" ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
