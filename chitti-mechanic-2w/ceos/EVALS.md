🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# EVALS — Chitti Mechanic 2 Wheeler quality gates

> No release without passing **all** gates. Safety-critical advice (brakes, steering,
> electrical) shown as "DIY" when it should be "mechanic" is a P0 incident, as is any
> invented number/diagnosis. Reproduce: `node tools/cert_mechanic_2w.mjs`.
>
> **Honesty note:** the NUMBERS below are **targets, to be measured** by the node
> harness once seeded with gold cases. They are never claimed as achieved before
> measurement.

## Quality gates (merge-blockers)

| Metric | Target | How it is measured |
|---|---|---|
| Reminder accuracy | **100%** | Engine `reminders.compute(twin, today)` vs hand-computed due dates across all 8 reminder types; off-by-one-day = fail |
| Insurance comparison | **±5%** | Engine `insure.compare` premium vs insurer-published premium for a fixed profile set |
| Tyre recommendation | **≥90%** vs expert | Engine `tyre.recommend(usage, model)` vs expert-curated gold pick per usage class |
| Scam detection | **≥80%** | Engine `scam.check` on a labelled quote set (fair vs inflated); >30%-above rule fires |
| DIY success | **≥70%** | Field/labelled outcomes for 🟢 triage jobs; safety-critical excluded from 🟢 by construction |
| OCR | **≥95%** | Extracted dates/numbers vs ground truth on document images (vision-key dependent) |
| OBD lookup | **100%** | Every code in the table returns the exact gold plain-language cause |
| Hallucination | **< 1%** | If data can't be verified → "I'm not sure"; never invent. Asserted by guardrail tests |

## How the gates are enforced

Every km/₹/date the UI shows is computed by `chitti_mechanic_2w_engine.js`
(`window.ChittiMech2W`). The cert harness asserts known-good outputs against
hand-computed gold values from the versioned rule tables. Example gold cases:

- Insurance expiring in exactly 30 days → reminder surfaces at the 30/15/7/1d marks, no
  other day.
- Service due at min(km-interval, months-interval) for a stored odometer + last-service
  date.
- OBD code lookup: a known code → its exact gold cause string; an unknown code → "I'm
  not sure", never a guess.
- Scam: a quote 31% above the model/job expected range → ALERT; 29% above → no alert.
- Tyre: city-usage on a given model → expert gold pick.
- Buy Score: identical inputs → identical score; output contains no
  "guaranteed"/"certified clean".

## Always / Never (guardrail evals)

**Always:** show confidence · show risks · show sources · route safety-critical jobs to
a mechanic · say "I'm not sure" when data can't be verified.
**Never:** guarantee a vehicle is accident-/flood-free · guarantee insurance/scam
outcomes · mark a safety-critical job (brakes/steering/electrical) as 🟢 DIY · invent a
km/₹/date/diagnosis · book/buy/sell on the user's behalf.

The guardrail evals are asserted in the cert harness (every result object carries
`confidence`, `risks[]`, `sources[]`).

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
