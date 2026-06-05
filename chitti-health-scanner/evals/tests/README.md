**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Evaluation Tests — COMING SOON (scaffolds)

> ⚠️ **HONEST STATUS: these tests are scaffolds. None has been run.** Every certification
> score in `../EVALS.md` stays **BLANK (`___%`)** until a real, audited run produces a number.
> We never fake a metric. Nothing here is "live", "verified", or "GREEN".

Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

## Purpose of this directory

This directory will hold the **executable harness** for the 7 critical evaluation tests
defined in `../EVALS.md` §11.3. Today they are **placeholders / scaffolds (COMING SOON)** —
the AI vision models are **not built and not clinically validated yet**, and the backend
analysis endpoints return an honest `501 coming_soon`, so there is nothing to score.

## The 7 tests this harness will run (see ../EVALS.md for method + targets)

1. **Safety Compliance** — every output has confidence + plain-language explanation + suggested action (monitor / consider consult / seek care) + "This is not a medical diagnosis"; no diagnosis, no prescription, no certainty, no panic, no shaming. *Blocking, every build.*
2. **Skin Cancer Detection Accuracy** — sensitivity/specificity vs. histopathology; minimise false negatives. *Per model version.*
3. **Dental Caries Detection** — accuracy vs. dentist + radiograph. *Per model version.*
4. **Wound Healing Trend** — improving/stable/worsening vs. clinician longitudinal labels; worsening must escalate. *Per model version.*
5. **Accessibility** — Blind/Deaf/Mute/Illiterate flow completion; voice IN/OUT + icon+text (never colour-only); mute-safe confirm gate. *Every release.*
6. **Hallucination Detection** — no invented findings; abstain on poor/out-of-scope input. *Blocking, every build.*
7. **Skin Tone Bias** — Fitzpatrick I–III vs. IV–VI gap, published honestly. *Per model version + quarterly fairness audit.*

## Human-in-the-Loop gate (will be enforced by the harness)

If model **confidence < 70%** **OR** the output is an **escalation** (🔴 seek care / suspected
high-risk), the case routes to **clinical review by a qualified professional** before it is
treated as more than a "notice to consult." See `../EVALS.md` §11.4.

## Planned layout (not yet populated)

```
tests/
  test_safety_compliance.*      # Test 1 — template + forbidden-phrase linter, red-team prompts (BLOCKING)
  test_skin_cancer.*            # Test 2 — sensitivity/specificity, false-negative rate
  test_dental_caries.*          # Test 3 — accuracy/sensitivity/specificity
  test_wound_trend.*            # Test 4 — trend agreement + worsening-escalation recall
  test_accessibility.*          # Test 5 — 4-user flow completion, widget + icon-text checks
  test_hallucination.*          # Test 6 — negative controls, abstention rate (BLOCKING)
  test_skin_tone_bias.*         # Test 7 — per-Fitzpatrick-band gap, published
  conftest.*                    # shared fixtures: gold-dataset loader, output linter, HITL gate
```

## Status

**COMING SOON.** 0 / 7 tests implemented and run. All scores in `../EVALS.md` remain `___%`.
This README is an honest placeholder so the harness's intent is unambiguous before it is built.

---

*This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.*
