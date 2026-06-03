# CNOS — Evals

Per Sire's spec:

| Eval | Target | Status |
|---|---|---|
| Category accuracy F1 | ≥ 0.95 | ⚠️ seed dataset 30 rows only; eval script PENDING |
| Source accuracy | ≥ 0.99 | ✅ structural (source_slug is mandatory ingest field) |
| Verification accuracy F1 | ≥ 0.95 | ⚠️ seed dataset 20 rows; eval script PENDING |
| Accessibility | ≥ 0.99 (every card has 5 elements) | ✅ inherited via `feedback-widget.js` |
| Latency | < 2 s feed render | ❌ untested at scale |
| Politics neutrality | 0 partisan adjectives per 100 articles | ✅ 0/100 ([`neutrality_eval.py`](../backend/scripts/neutrality_eval.py)) |
| Coverage SLA | per-(state×lang×cat) ≥ 5/day | ⚠️ 27/66 pass — multi-lang depth gap |
| Cancelled-story respect | 100 % | ✅ 4/4 ([`cert_cancelled_story.mjs`](../../tools/cert_cancelled_story.mjs)) |
| Mobile cert (375 px) | ≥ 18/20 | ✅ 13/14 ([`cert_chitti_news_v2.mjs`](../../tools/cert_chitti_news_v2.mjs)) |

---

## Datasets

| Dataset | Rows | File |
|---|---:|---|
| Category benchmark | 30 seed (target 200) | [`backend/data/benchmark_category_200.json`](../backend/data/benchmark_category_200.json) |
| Fact-check benchmark | 20 seed (target 200) | [`backend/data/benchmark_factcheck_200.json`](../backend/data/benchmark_factcheck_200.json) |

---

## Cadence

| Eval | Cadence | Owner |
|---|---|---|
| Category F1 | After every classifier change | CTO |
| Verification F1 | After every factcheck change | CTO |
| Neutrality (politics) | Weekly | cron |
| Coverage SLA | Nightly | cron |
| Mobile cert | Per release | CTO |
| Cancelled cert | Per release | CTO |

---

## Gates

A change DOES NOT MERGE if:
- Category F1 drops > 0.05 from baseline
- Verification F1 drops > 0.05
- Neutrality has > 0 violations
- Mobile cert PASS rate < baseline

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
