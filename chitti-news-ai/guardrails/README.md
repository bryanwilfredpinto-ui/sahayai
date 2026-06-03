# CNAIOS — Guardrails

Hard rules. Locked. CI-enforced where possible.

---

## NEVER

| | What | Why |
|---|---|---|
| 🚫 | Add an LLM call to the classification critical path | v0.3 doctrine — rules-only |
| 🚫 | Recommend a paid tool as "best free" | Career-honesty hard rule |
| 🚫 | Hide an exam cost | Same |
| 🚫 | Generate a course recommendation that doesn't exist | Real free sources only |
| 🚫 | Surface a job without the employer's own URL | Source attribution |
| 🚫 | Override the user's profession selection | Personalization respect |
| 🚫 | Hallucinate matched_keywords / source_signals | Explainability hard rule |
| 🚫 | Fake-up trust score / confidence | Truth > virality |
| 🚫 | Push notifications | Chitti PA's domain |
| 🚫 | Default to a language | Picker on every page (26 Voice Factory locales) |
| 🚫 | Mix Hinglish unless user opts in | Vernacular respect |
| 🚫 | Ship a feature without a fail-open test | Reliability |

## ALWAYS

| | What |
|---|---|
| ✅ | Carry `category + confidence + matched_keywords + source_signals + rule_version` on every classified item |
| ✅ | Show provider name + provider URL on every item |
| ✅ | Show `is_free` + verbatim `cost_label` (when known) |
| ✅ | Surface stale-data flag on items > 30 days |
| ✅ | Surface "ℹ Why this matters" disclosure on every classified card |
| ✅ | Render Trust Strip badges in <2 s |
| ✅ | Voice-readable profession picker (auto-read for blind users) |
| ✅ | Honor `Chitti.forget()` |
| ✅ | Return 200 with honest empty state when no items match |

---

## CI enforcement

| Rule | Where enforced |
|---|---|
| Fail-open (6 tests) | [`backend/tests/test_fail_open.py`](../backend/tests/test_fail_open.py) |
| No LLM imports in classifier critical path | `test_no_llm_imports_in_classifier_critical_path` static scan |
| Sire's 4 worked examples | `test_classifier_sire_worked_examples` |
| Per-profession F1 ≥ 0.85 | benchmark harness on 250-row dataset |
| Feed-endpoint explainability contract | [`tests/test_feed_endpoints.py`](../backend/tests/test_feed_endpoints.py) |
| Mobile cert 18/20 | [`tools/cert_news_ai.mjs`](../../tools/cert_news_ai.mjs) |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
