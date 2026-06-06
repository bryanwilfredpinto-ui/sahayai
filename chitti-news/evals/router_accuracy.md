# CNOS — Router Accuracy Eval

> *"Three routing decisions. All three auditable. None above 0.05 drift."*

In CNOS the **"router"** is the chain that decides *where a story goes and whether
to trust it*:

1. **Category classifier** — national / state / politics / business / sports /
   entertainment / tech (the wrong call here is the highest-risk failure mode for
   neutrality and bias).
2. **State / language routing** — which (state × language) feed a story surfaces in.
3. **Verification verdict** — verified / partial / disputed / unverified.

If any of the three is wrong, the user reads the right story in the wrong place,
or trusts a story they should question. This eval guards all three.

---

## Targets (F1)

| Routing decision | Metric | Target | Highest-risk sub-band |
|---|---|---|---|
| Category classifier | macro-F1 | ≥ 0.95 | politics ≥ 0.92 |
| Source / state-lang attribution | accuracy | ≥ 0.99 | (structural — `source_slug` mandatory) |
| Verification verdict | macro-F1 | ≥ 0.95 | `verified` band ≥ 0.85 (false-verified is the worst failure) |

> Note: the seed datasets ship with conservative thresholds in their headers
> (category F1 ≥ 0.85; verdict F1 ≥ 0.75) because 30/20 seed rows are too few to
> claim 0.95. **0.95 / 0.99 / 0.95 are the production bars** once the datasets
> hit 200 rows. Until then, status is honestly seed-only.

---

## Datasets

| Dataset | Rows | File | Build plan |
|---|---:|---|---|
| Category benchmark | 30 seed → 200 target | [`benchmark_category_200.json`](../backend/data/benchmark_category_200.json) | +170 production-sampled over 30 days |
| Fact-check benchmark | 20 seed → 200 target | [`benchmark_factcheck_200.json`](../backend/data/benchmark_factcheck_200.json) | 80 seed (20/band) + 120 stratified production rows |

The category seed deliberately captures historically-confusing edge cases — e.g.
**"Amazon Prime Day FIFA jersey deals" → Business not Sports** (commit 7466a91)
and **"Telugu film 3-film OTT deal" → Entertainment not Business**. The factcheck
seed is stratified across all 6 categories so the eval never skews to political
fact-checks alone.

---

## Eval method

1. Load the labelled rows (title + ground-truth label/verdict + rationale).
2. Run each title through the live path:
   - category → `services/category_classifier.py::classify` / `classify_article`
   - verdict → factcheck sub-agent (`≥2`-source corroboration rule)
3. Compute **per-class precision / recall / F1**, then **macro-F1**.
4. Emit a confusion matrix; flag every row where prediction ≠ ground truth with
   its rationale, so misses are debuggable not just countable.
5. Compare macro-F1 to the committed **baseline** for that classifier version.

Anchor regression test: [`backend/tests/test_category_classifier.py`](../backend/tests/test_category_classifier.py)
runs the "Sire 2026-06-03 corpus" (the live Business-feed headlines from when the
"cricket-in-Business" trust failure was caught). If those pass and the bug
recurs, the keyword bank failed — expand the bank, not the threshold.

---

## Merge gate (hard)

A change **DOES NOT MERGE** if:

| Condition | Action |
|---|---|
| Category macro-F1 drops > 0.05 from baseline | block merge |
| Verification macro-F1 drops > 0.05 from baseline | block merge |
| Source-attribution accuracy < 0.99 | block merge |
| Any politics row flips to a wrong-category label | block merge (neutrality risk) |
| `verified` band F1 < 0.85 | block merge (false-verified is the worst harm) |

---

## Cadence

| Eval | Cadence | Owner |
|---|---|---|
| Category F1 | After every classifier change | CTO |
| Verification F1 | After every factcheck change | CTO |
| Anchor corpus (`test_category_classifier.py`) | Per commit (pytest) | CTO |

---

## Current status — honest

| Decision | Status |
|---|---|
| Category classifier | ⚠️ 30 seed rows only; full eval script (`category_classifier_eval.py`) TO BUILD; anchor pytest LIVE |
| State / lang routing | ✅ structural (`source_slug` mandatory; state/lang are ingest fields) |
| Verification verdict | ⚠️ 20 seed rows only; full eval script (`factcheck_eval.py`) TO BUILD |

We cannot claim ≥ 0.95 until both datasets reach 200 hand-labelled rows. We will
not move the threshold to make the number green.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
