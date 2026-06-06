CEOS Level 6 — Swarm: Risk Agent
Authored 2026-06-06

# AGENT — Risk (HIGH / MEDIUM / LOW molecule banding)

**Votes on:** what stop-and-think gate must wrap this molecule *before* any
alternative or savings number is shown? HIGH-risk molecules — insulin, cardiac,
psychiatric, antibiotics, thyroid, anticoagulants — are **never auto-substituted
without a doctor**. The agent runs even inside a strict same-composition set.

**Backing service:** `services/medupi_risk.py` → `classify(molecule)`.

---

## Inputs
| Input | Source |
|---|---|
| `molecule` (normalized: lower-case, whitespace-collapsed, `+`-joined) | `_normalize()` |
| `RISK_MAP` (hand-curated ~90-molecule map, top-200 covers ~90% of Indian retail) | `medupi_risk.RISK_MAP` |

## Outputs
`{class, symbol, label_en, label_hi, warning_en, warning_hi}` — the exact dict
`classify()` returns, consumed verbatim by the frontend banner.

## The three bands
| Class | Symbol | Examples (from RISK_MAP) | UI treatment |
|---|---|---|---|
| **H — HIGH** | ⛔ | metformin, insulin (glargine/human-mixed), telmisartan, amlodipine, atorvastatin, warfarin, clopidogrel, amoxicillin(+clavulanic acid), azithromycin, levothyroxine, fluoxetine, alprazolam, olanzapine, salbutamol, tamoxifen, imatinib | Red banner · ⛔ · "Always ask your doctor before switching" · STOP-AND-THINK gate before alts render |
| **M — MEDIUM** | ⚠️ | diclofenac, ibuprofen, tramadol, omeprazole, pantoprazole, domperidone, ondansetron, montelukast | Amber banner · ⚠️ · "Confirm with your doctor or pharmacist" |
| **L — LOW** | ✅ | paracetamol, cetirizine, fexofenadine, vitamin b-complex / c / d3, calcium carbonate, iron+folic acid, ORS | Green banner · ✅ · "Same composition, save money" |

## Decision rules
1. **Risk class is computed BEFORE alternatives are rendered.** The banner gates
   the UI — frontend reads `risk.class` and colours red / amber / green.
2. **Unknown molecule → default LOW, but LOGGED.** `RISK_MAP.get(key, "L")` returns
   LOW for an unmapped salt, *and* the unknown case is logged so the map can be
   expanded — never silently treated as proven-safe.
3. **Precautionary override (SOP.md).** When risk-classification confidence is low
   or ambiguous, the operating rule is to surface as HIGH, never silently downgrade.
4. **HIGH-risk leads the tone.** On a HIGH result the ⛔ warning renders *above* the
   savings line. Money never leads on insulin / cardiac / psychiatric / antibiotic.
5. Warning text is bilingual by construction (`WARNING_TEXT_EN` / `WARNING_TEXT_HI`)
   so Deaf users read it and blind users hear it (`speak_*` carries the phrase).

## Hard rules — non-negotiable
- **HIGH-risk categories are never auto-substituted in copy.** Chitti shows the
  same-composition alternative "for information only" and tells the user to consult
  their doctor. It never says "switch to this."
- The risk band can **never** be relaxed by the swarm — it is a §2 medical guardrail.
- New molecules added to `RISK_MAP` are a Sire-approved change
  (see [../sop/sop_swarm_skill_update.md](../sop/sop_swarm_skill_update.md)).

## Verification
`tools/test_medupi_samples_result.json` — HIGH-risk molecules (Amlodipine,
Amoxicillin+Clavulanic Acid) correctly carry `risk_class: "H"` on the sample rows.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
