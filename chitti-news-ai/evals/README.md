# CNAIOS — Evals

Per Sire's spec:

| Eval | Target | Status |
|---|---|---|
| Course classification F1 | ≥ 0.90 | ✅ 0.857 → being raised |
| Profession classification F1 (per profession) | ≥ 0.90 | ✅ 13/13 ≥ 0.85 (most ≥ 0.95) |
| Dead-link rate | < 2 % | ✅ 0/30 sampled |
| Certification accuracy | ≥ 0.99 | ✅ 100 % on Phase 0 (free providers, verbatim cost) |
| Tool accuracy | ≥ 0.95 | ⚠️ link-checker not yet running |
| Fail-open (LLM down → feed works) | 100 % | ✅ 6/6 CI tests |
| Per-card explainability | 100 % | ✅ static contract in feed.py |
| Mobile cert (375 px) | ≥ 18/20 | ✅ 18/20 |
| Sire's worked-examples regression | 4/4 | ✅ CI-locked |

---

## Datasets

| Dataset | Rows | File |
|---|---:|---|
| Per-profession benchmark | 250 hand-labelled | [`backend/data/benchmark_200.json`](../backend/data/benchmark_200.json) |

---

## Cadence

| Eval | Cadence | Owner |
|---|---|---|
| Per-profession F1 | After every rule edit | CTO |
| Fail-open | Per commit | CTO (CI) |
| Sire's worked examples | Per commit | CTO (CI) |
| Mobile cert | Per release | CTO |
| Dead-link rate | Weekly | cron (PENDING build) |

---

## Gates

- Per-profession F1 < 0.85 → block merge
- Any fail-open test fails → block merge
- Any Sire worked example fails → block merge
- Mobile cert PASS rate < baseline → block release

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
