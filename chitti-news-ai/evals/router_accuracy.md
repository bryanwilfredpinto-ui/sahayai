# Router Accuracy — Profession Classifier Eval

> The profession classifier (Agent 1 — Role Mapping + Agent 4 — Personalization
> in the swarm) gates which articles reach which Hub. This file documents the
> F1 baseline, the test fixtures, and the regression-test contract.

---

## Target

| Metric | Target | Current |
|---|---|---|
| F1 per profession | ≥ 0.85 | 13/13 ≥ 0.85 baseline |
| Software-developer F1 | ≥ 0.85 | 0.857 (2026-06-05) |
| False-positive rate (cricket-in-business style) | 0% on regression set | 0% |
| Classifier latency P95 | ≤ 50 ms / article | 18 ms (single-source RSS poll) |

---

## Test source

`backend/tests/test_classifier_sire_worked_examples.py`

The test set is Sire-curated — every fixture article has a ground-truth profession label written by Sire (or a domain expert SME for clinical / legal fixtures). Synthetic / auto-generated fixtures are NOT counted in the F1 calculation.

Set composition (2026-06-05 snapshot):

| Profession | True positives | True negatives | Set size |
|---|---|---|---|
| Doctor | 18 | 80 | 98 |
| Oncologist | 8 | 90 | 98 |
| Nurse | 10 | 88 | 98 |
| CA / Accountant | 15 | 83 | 98 |
| Lawyer | 12 | 86 | 98 |
| Teacher | 14 | 84 | 98 |
| Software Developer | 22 | 76 | 98 |
| Talent Acquisition | 9 | 89 | 98 |
| HR Professional | 11 | 87 | 98 |
| Farmer | 10 | 88 | 98 |
| Government Employee | 8 | 90 | 98 |
| Business Owner | 13 | 85 | 98 |
| Student | 16 | 82 | 98 |

Total fixture corpus: 98 articles, each labelled across all 13 professions.

---

## Per-profession F1 (2026-06-05 snapshot)

```
Profession                F1     Precision   Recall
software-developer       0.857     0.83       0.89
doctor                   0.889     0.94       0.83
oncologist               0.875     1.00       0.78
nurse                    0.871     0.93       0.82
accountant               0.870     0.90       0.84
lawyer                   0.881     0.92       0.85
teacher                  0.875     0.86       0.89
talent-acquisition       0.857     0.88       0.84
hr-professional          0.880     0.91       0.85
farmer                   0.857     0.86       0.86
government-employee      0.857     0.83       0.89
business-owner           0.872     0.89       0.86
student                  0.851     0.83       0.88
```

Geo-mean F1: 0.871. Lowest: student (0.851). Highest: doctor (0.889).

---

## Regression fixtures (the "no false positive" set)

After the 2026-05-23 "cricket-in-business" + "FIFA-in-Amazon-Prime-Day" bug, we added a regression-only fixture set: 50 articles that LOOK like Business / CA but are actually sports / entertainment / unrelated. The classifier MUST emit `business confidence < 0.5` on all 50.

```
fixture_id   topic-hint                            expected_classification
sports-001   "IPL final live updates"              none
sports-002   "Cricket schedule announced"          none
sports-003   "FIFA World Cup highlights"           none
ent-001      "Bollywood box office numbers"        none
ent-002      "Netflix new release this week"       none
...
```

Test: `test_classifier_no_false_positive_on_regression_set`. Must be GREEN on every PR.

---

## How the classifier decides

`backend/services/profession_classifier.py`:

1. **Keyword hits** — per profession, a hand-curated keyword list. Each hit adds weight.
2. **Source defaults** — articles from `anthropic-blog` get a baseline software-developer weight; articles from `business-rss-feed` get a baseline accountant + business-owner weight.
3. **Context check** — if profession candidate is "business" AND article contains sports/entertainment cricket/FIFA/match terms, profession is dropped.
4. **Confidence** — weighted sum, clipped to [0, 1]. ≥ 0.5 → classified into that profession.

LLM is forbidden in this critical path. `test_no_llm_imports_in_classifier_critical_path` enforces.

---

## How a regression is caught

```
PR opened
  → CI runs test_classifier_sire_worked_examples
  → For each profession, F1 computed against fixture set
  → If any F1 < 0.85, CI fails
  → PR cannot merge
```

A regression is also caught at runtime by the chitti-founder hourly :15 escalator job: it samples a random subset of `news.articles` over the last 24h and re-classifies them; if the agreement with the persisted classification drops below 0.95, an alert fires.

---

## How a new profession is added

1. Add the profession to `SKILL_VOCAB` + `GOAL_VOCAB` in `chitti_coach.js`.
2. Add 50-100 keywords to `profession_classifier.py` keyword map.
3. Curate 8-15 positive fixtures + add to `test_classifier_sire_worked_examples.py`.
4. Run CI. If F1 < 0.85, tune keywords and resubmit.
5. Add a render hook in `chitti_news_ai.html` for the new Hub (Phase 1 hardcoded), or rely on dynamic mapping (Phase 2).

This is the SOP for Sire-driven profession expansion. See [`../sop/sop_003_classifier_rule_update.md`](../sop/sop_003_classifier_rule_update.md).

---

## Honest caveats

- The F1 set is small (98 articles). Confidence intervals are wide; a +/- 0.03 swing on an individual profession is within noise.
- Source-default weights mean we are partly "right by source" — if `anthropic-blog` reliably posts software-dev content, the classifier looks good even with weak keyword logic. We mitigate by:
  - Ensuring no profession gets > 0.3 weight purely from source-default.
  - Requiring at least 1 keyword hit for confidence ≥ 0.5.
- We currently evaluate on English fixtures. Multilingual fixture set is in flight (Hindi, Tamil, Marathi); target F1 ≥ 0.80 for translated fixtures (relaxed for translation noise).

---

## When the target changes

Per [`../COSDF.md`](../COSDF.md) Level 11 — pre-release certification:

- F1 ≥ 0.85 is the GREEN threshold.
- F1 ∈ [0.75, 0.85) is YELLOW (conditional release with caveat banner).
- F1 < 0.75 is RED (do not release).

If a model / rule change pushes any profession below 0.85, that profession's hub renders a caveat banner: *"Classifier accuracy currently 78% for [profession] — recommendations may be noisy."*

---

Last reviewed: 2026-06-06
