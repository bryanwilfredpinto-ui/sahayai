🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Mechanic 2 Wheeler

> What "good" means, measured. Every metric is honest, sourced, and inspectable per
> [CONSTITUTION.md](CONSTITUTION.md) Article 12 (Open & Auditable). Savings figures
> are tracked as ranges, never guaranteed (Article 9).

---

## 1. Money saved per user (the ₹10,000 promise, line-itemed)

| Saving source | Target range / user / year | How measured |
|---|---|---|
| Insurance saving | **₹1,000 – ₹5,000** | Cheapest honest insurer vs dealer-renewal baseline, per quote |
| PUC fine avoided | **₹1,000 – ₹2,000** | Reminder acted on before due date vs typical fine |
| Engine damage prevented | **₹5,000 – ₹10,000** | Service/maintenance done on time vs cost of the failure prevented |
| **Annual savings goal** | **≥ ₹10,000** | Sum of all line-itemed honest savings in the Vehicle Twin |

The Savings Tracker shows each rupee with its source and assumption. Chitti shows a
range and **never guarantees** the total.

## 2. Protection & trust metrics

| Metric | Target | Why it matters |
|---|---|---|
| Scam detection rate | **≥ 80%** | Fake insurance, inflated quotes, counterfeit parts, odometer fraud caught |
| DIY success rate | **≥ 70%** | Users who follow a 🟢 Safe-DIY and succeed without damage or injury |
| Critical safety-triage errors | **0** | A wrong 🟢 on a brake/electrical job is a P0 incident |
| Guaranteed-number incidents | **0** | Any output that promises a fixed saving/price is a P0 |

## 3. Engagement & retention

| Metric | Target |
|---|---|
| 30-day retention | **> 60%** |
| Reminders acted on (vs missed) | majority acted on |
| Vehicle Twin populated (≥1 document) | majority of active users |

## 4. Accessibility & reach (the floor, not a feature)

| Metric | Target |
|---|---|
| Accessibility archetypes served | **9 / 9** (Blind, Deaf, Mute, Illiterate, Elderly, Low-Vision, Cognitive, Motor, Rural) |
| Languages supported | **26 / 26** |
| Every output Visual + Audio + Haptic | **100%** |
| Mobile @375px renders correctly | **100%** |
| Works offline (deterministic core) | **100%** of core capabilities |

## 5. Quality gates (release blockers — from [CONSTITUTION.md](CONSTITUTION.md))

A release is **blocked** if any of these fail:

- Scam detection **< 80%**
- DIY success **< 70%**
- Any critical safety-triage error (**> 0**)
- Any guaranteed-number incident (**> 0**)
- Accessibility **< 9/9** profiles
- Languages **< 26/26**
- Any core capability that does not work offline
- Any output that is not Visual + Audio + Haptic
- Mobile @375px breakage

## 6. How metrics are evidenced

- **Savings** — computed by `chitti_mechanic_2w_engine.js` from versioned rule tables
  and the user's own Vehicle Twin inputs; reproducible.
- **Scam detection / DIY success** — measured against a labelled gold set in
  `ceos/evals/`; reported as PASS/FAIL with the sample count.
- **Accessibility / languages** — verified by the shared substrate cert
  (chitti_a11y.js, chitti_lang.js) across all nine profiles and 26 languages.
- **Triage correctness** — every triage decision is a deterministic rule, audited
  against the gold set; zero tolerance for a wrong 🟢.

Honest reporting rule: where a metric cannot be measured automatically, it is marked
**AUTOMATION-LIMITED** with the reason — never silently passed.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
