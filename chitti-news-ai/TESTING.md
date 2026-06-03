# Chitti News AI — TESTING

What is tested today, what isn't, and the gaps that hold us back from world-class.

---

## Current test inventory

| Test | File | Status | What it verifies |
|---|---|---|---|
| Fail-open: classifier with no LLM env | [`tests/test_fail_open.py::test_classifier_produces_tags_with_no_llm_env`](backend/tests/test_fail_open.py) | ✅ | Rules-only classifier returns real explainable tags with every LLM env var stripped |
| Fail-open: Sire's worked examples | `test_classifier_sire_worked_examples` | ✅ | NVIDIA CUDA → SD · Oncology AI → oncologist · Precision Agri → farmer · ATS → talent-acquisition |
| Fail-open: static-scan classifier source | `test_no_llm_imports_in_classifier_critical_path` | ✅ | Forbidden imports (httpx/openai/google.generativeai/anthropic/*_API_KEY) absent from classifier module |
| Fail-open: enhancement summarise | `test_enhancement_summarise_works_offline` | ✅ | Extractive summary works with no LLM |
| Fail-open: enhancement explain fallback | `test_enhancement_explain_falls_back_to_extractive` | ✅ | LLM down → extractive fallback (never 500) |
| Fail-open: enhancement career_insight | `test_enhancement_career_insight_offline` | ✅ | Rules-only career bullets with no LLM |
| Per-profession F1 benchmark | `c:/tmp/benchmark_harness.py` (to be moved to `scripts/`) | ✅ | F1 per profession against 250-row hand-labelled dataset |

## What's NOT tested

| Gap | Severity | Plan |
|---|---|---|
| Integration test: `/api/news-ai/feed/<stream>` end-to-end | 🔴 | Add `tests/test_feed_endpoints.py` — boot Flask test client, hit every stream, assert shape |
| Integration test: ingestor real-network smoke | 🔴 | Add `tests/test_ingest_smoke.py` — hit Microsoft Learn live, RemoteOK RSS, parse expected ≥10 items |
| Frontend test: For You tab loads + filters + per-card disclosure works | 🔴 | Add Playwright cert (currently no Playwright for chitti-news-ai) |
| Mobile cert: 375 px screenshot per tab | 🔴 | Add `tools/cert_news_ai.mjs` (chitti-fashion has the template) |
| Per-card four-user contract: 🔊/🤖/👍/👎 on every card | 🔴 | Audit `chitti_news_ai.html` `data-chitti-response` wrappers; add `data-chitti-card-selector` if missing |
| ARIA contract: every interactive element labelled | 🟡 | axe-core scan |
| Stale-data flag UI | 🟡 | New feature, then test |
| Trust-score per-card (chitti-news has it; this doesn't) | 🟡 | New feature, then test |
| Load test: 100 concurrent /feed requests | 🟡 | k6 or Locust script |
| Translation cache coverage | 🟡 | New feature, then test |

## CI policy

| Currently CI-enforced | What |
|---|---|
| Fail-open guardrail | ✅ via Git pre-commit if Sire enables; manually verified per commit today |
| Forbidden imports in classifier | ✅ static scan in `test_fail_open.py` |
| Benchmark F1 ≥ 0.85 for software-developer | ❌ NOT yet CI-blocked (manually verified per commit) |
| 12/13 PASS in benchmark | ❌ NOT yet CI-blocked |
| Frontend doesn't drop 4-user widget per card | ❌ NOT CI-checked |

## Recommended additions (in priority order)

1. **`scripts/benchmark_harness.py`** — move the throwaway `c:/tmp` script into the repo so it runs reproducibly
2. **`tests/test_feed_endpoints.py`** — integration covering all 7 streams
3. **`tests/test_classifier_benchmark.py`** — wraps the benchmark harness; CI fails if F1 < 0.85 for any profession
4. **`tools/cert_news_ai.mjs`** — Playwright cert for the 10 page-states (4 original tabs + For You + 5 new stream tabs)
5. **`tests/test_explainability_disclosure.py`** — assert every classified card carries the 5 explainability fields
6. **Load test** — Locust against `/api/news-ai/feed/*` at 100 concurrent

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
