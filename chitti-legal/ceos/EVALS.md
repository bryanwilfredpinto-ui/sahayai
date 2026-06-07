🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# EVALS — Chitti Legal OS evaluation contract

> Nothing ships below these gates ([CONSTITUTION.md](CONSTITUTION.md)). Deterministic
> outputs are gold-tested to the exact value; LLM-phrasing (BO11) is judged once funded.

| Evaluation | Target | Harness | Status |
|---|---|---|---|
| Legal explanation accuracy | **≥ 95%** | judge vs reference ([evals/legal_accuracy.md](evals/legal_accuracy.md)) | 🔵 needs DeepSeek (BO11) |
| Rights mapping | **≥ 95%** | KB vs reference ([evals/rights_mapping.md](evals/rights_mapping.md)) | 🟢 deterministic |
| Deadline / limitation | **= 100%** | `tools/legal_os_engine_test.mjs` | 🟢 **60/60** |
| Notice classification | **≥ 90%** | labelled corpus vs `classifyNotice` | 🟢 deterministic (sample asserted) |
| Free-legal-aid match | **≥ 90%** | s.12 category set ([evals/scheme_match.md](evals/scheme_match.md)) | 🟢 deterministic |
| Scam detection | **≥ 90%** | labelled scenarios | 🟢 deterministic (sample asserted) |
| Accessibility | **= 100%** | axe-core 0 serious/critical + four-user journeys ([evals/accessibility.md](evals/accessibility.md)) | 🟢 **27/27 cert** |
| Hallucination | **< 1%** | engine never emits a non-table value ([evals/hallucination.md](evals/hallucination.md)) | 🟢 by construction |
| Critical legal errors | **= 0** | any wrong deadline/jurisdiction as certain = P0 | 🟢 deterministic |
| Mobile @375px | **= 100%** | responsive cert | 🟢 screenshots @375/768/1280 |

## How the gates run

```
node tools/legal_os_engine_test.mjs   # BO6/BO9 — deterministic gold (60/60)
node tools/cert_legal_os.mjs          # BO7/BO8/BO10 — live Playwright + axe (27/27)
```

## Honest gaps

- LLM-phrasing accuracy (BO11) is **AUTOMATION-LIMITED** until DeepSeek funding + the
  Vaani relevance-rail allowlist (standing fleet blocker). The deterministic core carries
  the value without it.
- A larger labelled notice/scam corpus (1000+ rows) is roadmapped to lift the
  classification/scam numbers from "sample-asserted" to a published percentage.

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
