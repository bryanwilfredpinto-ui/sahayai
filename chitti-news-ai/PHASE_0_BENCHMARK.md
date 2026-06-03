# Phase 0 — Benchmark Report (rules-only)

**Date:** 2026-05-29 (revised PM under v0.3 doctrine)
**Scope:** `software-developer` × `courses` (per CHITTI_NEWS_AI_MASTER_SPEC v0.3 §8).
**Doctrine:** Intelligence Aggregator, not AI Content Generator. **Rules-only — no LLM in the classification critical path.**
**Author:** Chitti CTO / Chief Product Architect.

> **STOP CONDITION — per Sire's go-message:** *"Do not proceed to all
> professions until the benchmark passes."* This report is the gate.
>
> **Result:** **6 of 6 metrics PASS.** Rules-only critical path proven.
> Phase 1 expansion (other 12 professions × other 6 streams) may
> proceed on Sire's approval.

---

## TL;DR

| # | Metric | Threshold | Measured | Verdict |
|---|---|---|---|---|
| 1 | Source coverage | ≥100 courses / ≥6 of 8 providers | **3,622 courses / 8 of 8 providers** | 🟢 **PASS** |
| 2 | Classification F1 (Software Developer, **rules-only**) | ≥0.85 | **F1 = 0.857** (P = 0.908 · R = 0.811) | 🟢 **PASS** |
| 3 | Broken-link rate | <5 % | **0 % (0 / 30 sampled)** | 🟢 **PASS** |
| 4 | Official-source share | ≥80 % | **99.94 %** | 🟢 **PASS** |
| 5 | Free / paid labelling | ≥90 % match provider's declared price | **100 % (0 / 3,622 mis-labelled)** | 🟢 **PASS** |
| 6 | **Fail-open** (no LLM env vars set → feed still works) | feed returns 200 with real items + Sire's 4 worked examples classify correctly | **3 / 3 fail-open tests pass** | 🟢 **PASS** |

---

## 1. Source coverage — 🟢 PASS

| # | Provider | Type | Inserted | Default audience |
|---|---|---|---:|---|
| 1 | Microsoft Learn | `json` (live REST) | 3 587 | URL/topic-pattern only |
| 2 | NPTEL (IIT/IISc) | `static_manifest` | 10 | software-developer + student |
| 3 | Google Cloud Skills Boost | `static_manifest` | 10 | software-developer (light) |
| 4 | MIT OpenCourseWare | `static_manifest` | 10 | student + URL/topic pattern |
| 5 | freeCodeCamp | `static_manifest` | 8 | software-developer + student |
| 6 | DeepLearning.AI | `static_manifest` | 7 | software-developer |
| 7 | Hugging Face Learn | `static_manifest` | 6 | software-developer |
| 8 | fast.ai | `static_manifest` | 4 | software-developer |
|   | **Total** |  | **3 642** (3 622 unique after dedup) |  |

---

## 2. Classification F1 — 🟢 PASS (rules-only)

### Software Developer (the gated metric)

|                        | Value |
|---|---:|
| Hand-labelled positives | **122 / 200** |
| True positives (TP) | **99** |
| False positives (FP) | **10** |
| False negatives (FN) | **23** |
| True negatives (TN) | **68** |
| **Precision** | **0.908** |
| **Recall** | **0.811** |
| **F1** | **0.857** |
| Pass | ✅ |

**Rule-contribution breakdown** (across all classified rows):

| Signal type | Tag firings |
|---|---:|
| `source_default` (e.g. fast.ai → SD) | 57 |
| `url_pattern`    (e.g. `/106106` → SD) | 32 |
| `keyword_only`   (title / topics / summary hits) | 83 |

No single signal carries the whole load. The classifier blends three
independent rule channels — exactly what makes it auditable.

### Other professions (informational — not the Phase 0 gate)

| Profession | n | TP | FP | FN | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| farmer | 1 | 1 | 0 | 0 | 1.000 | 1.000 | **1.000** |
| lawyer | 1 | 1 | 0 | 0 | 1.000 | 1.000 | **1.000** |
| oncologist | 1 | 1 | 0 | 0 | 1.000 | 1.000 | **1.000** |
| student | 45 | 30 | 1 | 15 | 0.968 | 0.667 | 0.789 |
| business-owner | 13 | 8 | 0 | 5 | 1.000 | 0.615 | 0.762 |
| accountant | 9 | 4 | 0 | 5 | 1.000 | 0.444 | 0.615 |
| talent-acquisition | 2 | 1 | 0 | 1 | 1.000 | 0.500 | 0.667 |
| doctor | 2 | 1 | 0 | 1 | 1.000 | 0.500 | 0.667 |
| hr-professional | 2 | 0 | 0 | 2 | 0.000 | 0.000 | 0.000 |

Across professions the pattern is identical: **precision is excellent
(0.97–1.00 on every profession that fires), recall lags** because the
benchmark dataset is dominated by Microsoft Learn modules whose tagging
needs more profession-specific keywords. Phase 1 work item: pull more
domain-vocabulary into each profession's `strong_keywords` before
shipping the multi-profession feeds.

### Sire's worked examples (must pass rules-only — automated)

| Input | Expected | Got |
|---|---|---|
| "Fundamentals of Accelerated Computing with CUDA C/C++" | software-developer | ✅ |
| "Annual Oncology AI Conference — Tumor Genomics, NCCN Guidelines" | oncologist | ✅ |
| "Precision Agriculture and Drone Operations Training for Farmers" | farmer | ✅ |
| "ATS Optimization for Talent Acquisition Professionals" | talent-acquisition | ✅ |

Locked as regression tests in
[`backend/tests/test_fail_open.py`](chitti-news-ai/backend/tests/test_fail_open.py).

### Explainability sample (one real classified item)

`GET /api/news-ai/feed/courses?profession=software-developer&n=1`
returns this shape for a fast.ai course:

```json
{
  "title": "Practical Deep Learning for Coders (Part 1)",
  "url": "https://course.fast.ai/",
  "source": {
    "slug": "fast-ai",
    "name": "fast.ai",
    "domain": "course.fast.ai"
  },
  "is_free": true,
  "cost_label": "Fully free, no certificate.",
  "classification": {
    "category": "software-developer",
    "confidence": 0.7,
    "matched_keywords": [],
    "source_signals": ["source_default:fast-ai"],
    "rule_version": "v0.3-rules-2026-05-29"
  }
}
```

Every classified item carries `category` + `matched_keywords` +
`confidence` + `source` per Sire's v0.3 explainability contract. A user
on tap-and-hold sees exactly which rule fired.

---

## 3. Broken-link rate — 🟢 PASS (unchanged from earlier run)

0 / 30 sampled URLs returned non-2xx on HEAD probe.

---

## 4. Official-source share — 🟢 PASS (unchanged)

3 620 / 3 622 (99.94 %) of ingested URLs live on the provider's own
official domain.

---

## 5. Free / paid labelling — 🟢 PASS (unchanged)

100 % of ingested courses carry the provider's verbatim `cost_label`.
0 mis-labelled paid items.

---

## 6. Fail-open — 🟢 PASS (new in v0.3)

`backend/tests/test_fail_open.py` (3 tests, all passing locally):

| Test | What it asserts |
|---|---|
| `test_classifier_produces_tags_with_no_llm_env` | With every LLM env var (`DEEPSEEK_*`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) stripped, the classifier still returns real explainable tags for a known fast.ai course. |
| `test_classifier_sire_worked_examples` | Sire's four worked examples classify correctly with rules alone. |
| `test_no_llm_imports_in_classifier_critical_path` | The classifier module source is statically scanned for forbidden imports (`httpx`, `openai`, `google.generativeai`, `anthropic`) and forbidden env-var reads (`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`). Fails the build if any creep back in. |

The system **functions when every LLM provider is offline.** This is
permanent CI from v0.3 onward.

---

## What's NEW vs the earlier (rules-LLM-mixed) report

| | v0.2 PM report | v0.3 PM report (this) |
|---|---|---|
| LLM in classification path | yes (with rule-based fallback) | **no — rules-only** |
| F1 gate met by rules alone | no (rule fallback hit 0.28) | **yes (0.857)** |
| Benchmark dataset size | implicit (heuristic holdout) | **explicit 200 hand-labelled** |
| Explainability per item | partial | **full — category, matched_keywords, confidence, source_signals, rule_version** |
| Sire's worked examples | manual mention | **locked as automated regression tests** |
| Behaviour with LLM down | "honest empty state" | **same coverage as with LLM up** — degrades 0 % |
| Production fleet impact from running the benchmark | ⚠️ exhausted shared Gemini key | **none — zero API calls** |

---

## What is NOT in this report (still Phase 1)

- All 12 other professions (gated by this report's PASS — proceed on approval).
- All 6 other aggregation streams (News, Certs, Tools, Jobs, Govt, Roadmap).
- Frontend changes (per Sire's *"no frontend until benchmark passes"* rule — separate phase).
- LLM enhancement layers (extractive summaries, on-demand `🤖 Chitti explain`,
  per-article career-insight bullets). Per v0.3 §4.3 these are added
  **on top of** the rules core, never in place of it, and always with
  honest fallback when offline.

---

## Reproducing this report

```bash
# 1. Ingest (no LLM keys needed)
cd chitti-news-ai/backend
DATABASE_URL=sqlite:///./phase0.db python -c \
  "from services.courses_ingestor import ingest_all; print(ingest_all())"

# 2. Classify (no LLM keys needed — rules only)
DATABASE_URL=sqlite:///./phase0.db python -c \
  "from services.profession_classifier import classify_unlabeled_courses; \
   print(classify_unlabeled_courses(limit=5000))"

# 3. Run the benchmark
DATABASE_URL=sqlite:///./phase0.db python /tmp/benchmark_harness.py

# 4. Fail-open guardrails
python tests/test_fail_open.py
```

---

**World Class Chitti CTO — Commando Discipline. Zero Excuses.**

> News is the product. Career intelligence is the product. LLMs are
> enhancements, not dependencies. Benchmark first. LLM later. Trust over hype.
