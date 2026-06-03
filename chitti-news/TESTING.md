# Chitti News — TESTING

What is tested today, what isn't, and the gaps that hold us back from world-class.

---

## Current test inventory

| Test | File / location | Status |
|---|---|---|
| Cricket-in-Business regression probe | [tools/cert_chitti_news_result.json](../tools/cert_chitti_news_result.json) ←→ committed manual probes | ✅ ad-hoc, not yet a CI fixture |
| Trust Strip render screenshot | [tools/cert_screenshots/](../tools/cert_screenshots/) | ✅ snapshot saved |
| Per-language home screenshots | [tools/cert_screenshots/live_*_home.png](../tools/cert_screenshots/) | ✅ kn/te/mr/hi/en/gu/or/ml |
| News insight unit | [backend/tests/test_news_insight.py](backend/tests/test_news_insight.py) | ✅ |
| Coverage-payload integration | smoke via [tools/probe_*](../tools/) | ⚠️ ad-hoc |

## What's NOT tested

| Gap | Severity | Plan |
|---|---|---|
| Per-(state×language×category) coverage SLA | 🔴 | New cron job: dump coverage payload nightly, fail if below SLA per Indian state language |
| Fact-check verdict ground-truth | 🔴 | Hand-labelled 200 articles per category with verdicts; CI re-runs after sub-agent change |
| Per-category classifier accuracy benchmark | 🔴 | NOT YET BUILT — chitti-news-ai has its 250-row benchmark; chitti-news needs the equivalent for the category classifier |
| Cloudscraper-fallback regression | 🟡 | After 2026-06-02 fix, no automated test that the fallback continues to work |
| Trust Strip render-time SLA (<2s) | 🟡 | Lighthouse / WebPageTest assertion |
| Per-publisher trust-score drift | 🟡 | Weekly cron emits alert if any publisher's trust score moves > 0.1 |
| Cancelled-story respect (frontend) | 🟡 | Playwright cert |
| For You algorithm correctness | 🟡 | Frontend unit test against a localStorage profile fixture |
| Mobile 375 px cert post Trust Strip rollout | 🔴 | Last full cert 2026-05-27 — pre Trust Strip |

## CI policy

| Currently CI-enforced | What |
|---|---|
| Health endpoint | ✅ via chitti-founder self-ping every 4 min |
| Cricket-in-Business regression | ⚠️ probe exists but not run automatically per commit |
| Cloudscraper fallback live | ❌ not CI-checked |
| Coverage-payload SLA | ❌ not CI-checked |

## Recommended additions (in priority order)

1. **`scripts/coverage_sla_check.py`** — nightly cron that fails if per-(state×language×category) coverage drops below SLA
2. **`tests/test_factcheck_verdicts.py`** — hand-labelled 200 articles; verdicts must match within tolerance
3. **`tests/test_category_classifier.py`** — equivalent to chitti-news-ai's 250-row benchmark, for the category classifier
4. **`tools/cert_news.mjs`** — Playwright cert post Trust Strip (refresh of 2026-05-27 cert)
5. **`tests/test_neutrality.py`** — 100-politics-article corpus; politics sub-agent's summary contains no partisan adjective
6. **Load test** — Locust against `/api/news/feed` at 200 concurrent

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
