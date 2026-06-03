🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# AGENT — Cost (Expected Repair Band)

**Votes on:** what this repair *should* cost — as a **band**, never a single number.
Feeds the [Scam Shield](../skills/scam-shield.md) so a driver can check a quote.

## What it returns
A **parts-only** band and a **parts + labour** band, Tier-2 metro median, plus a
city/pincode delta when the community price-table is live (P1). Car bands run higher
than 2-wheeler bands — authorised-dealer median sits near the top, independent good
mechanic near the bottom.

## Reference bands (from [MECHANIC_KNOWLEDGE §6](../skills/MECHANIC_KNOWLEDGE.md))
| Item | Parts-only (₹) | Parts + labour (₹) |
|---|---|---|
| Mineral oil change (1.2 L hatch — Swift/Baleno) | 1 300–2 000 | 1 500–2 500 |
| Synthetic oil change (1.5 L SUV — Creta/Nexon) | 3 000–4 800 | 3 500–5 500 |
| Engine air filter | 300–700 | 400–800 |
| AC cabin filter | 300–600 | 350–700 |
| Spark plug set (4, iridium) | 600–1 600 | 800–2 000 |
| Brake pads (front pair) | 900–2 400 | 1 200–2 800 |
| Brake discs (pair) | 3 000–6 000 | 4 000–8 000 |
| Battery (35–45 Ah, Exide/Amaron) | 4 200–7 000 | 4 500–7 500 |
| Alternator (recon/new) | 4 000–12 000 | 5 000–15 000 |
| AC compressor | 12 000–22 000 | 18 000–24 000 |
| Clutch overhaul (hatch) | 6 000–14 000 | 8 000–18 000 |
| Timing belt + tensioner | 4 000–11 000 | 6 000–15 000 |
| Coolant flush | 600–1 800 | 1 500–3 000 |
| AC gas top-up (R-134a / R-1234yf) | 800–2 500 | 1 500–3 500 |
| Tyre (per tyre, 14"–15") | 4 000–7 500 | 4 500–8 500 |
| DPF clean / regen (diesel) | — | 3 000–12 000 |

## Must return
`{parts_band, labour_band, total_band, confidence, why}` — always a **range**, with a
one-line *"is sheher mein, aur authorised vs local mein, thoda upar-neeche ho sakta hai."*

## Hard rules
- **Never** quote one final number — bands only ([MECHANIC_KNOWLEDGE §6](../skills/MECHANIC_KNOWLEDGE.md)).
- When the diagnosis itself is low-confidence, the cost band widens (or Chitti says
  "depends on what the mechanic finds") — never a confident price on an uncertain fault.
- Scam Shield uses this to say *"this quote appears high"* — **never** "you are being
  cheated by [named mechanic]" ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
