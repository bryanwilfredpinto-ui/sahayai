🎖️ World Class Chitti Fashion — Eval: Fashion Accuracy

# EVAL — Fashion Accuracy (gate: ≥ 90%)

**Question:** does Chitti give the *right* outfit advice for the stated context?

## Method
A labelled set of ~120 scenarios across personas P1–P9, each with a
context (occasion, city, weather, budget, profile, wardrobe snapshot) and a
**ground-truth band** (acceptable formality + acceptable colour family + must-be
own-wardrobe-first). An LLM-as-judge ([lib/evaluators.py](../../lib/evaluators.py))
plus a sampled human pass score each response.

## Scoring axes (per scenario)
| Axis | Pass condition |
|---|---|
| Occasion fit | formality band matches ground truth |
| Colour sense | colour story within an acceptable family |
| Wardrobe-first | an own-wardrobe option offered before any buy |
| Teaches why | Why/Benefits/Tradeoffs/Alternatives present |
| No body comment | zero body-attribute language (hard) |

A scenario passes only if **all** axes pass. **Accuracy = passed / total ≥ 90%.**

## Gold scenario examples
1. Bangalore startup interview, owns shirt+chinos+blazer → expect smart-casual (no full suit), own-wardrobe.
2. Blind user, office, owns blue kurta/black leggings/brown sandals → expect spoken description + "suitable for office."
3. Diwali, owns kurta+gold studs → expect festive jewel framing, ₹0.
4. Senior, daily wear → expect comfort + non-slip footwear, dignity tone.
5. Student fest, ₹0 → expect "recreate this trend from your almari."

## Cadence
Run on every release; block GREEN if < 90%. Regression set grows from every
confirmed 👎. Results logged to [../observability/quality_dashboard.md](../observability/quality_dashboard.md).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
