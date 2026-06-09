🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# EVALS — how we prove Chitti Technicals is honest, accessible, and safe

> Level: Quality. Subordinate to [CONSTITUTION.md](CONSTITUTION.md) — if any eval target conflicts with an Article, the Article wins.
> **Honesty rule (LOCKED):** this is a *skeleton* eval framework authored before any BO gate has run. **No result below is a PASS.** Every measured cell is 🔵 **PENDING — to be filled when the BO gate runs.** We never fabricate an accuracy number (Article 4).

---

## Why these evals exist

Chitti Technicals inverts the trading-app incentive: **understanding first, protection always, trading never urged** (CONSTITUTION, Founder Rule). The eval suite is the proof that we kept that promise. It tests five things, in priority order:

1. **The math is deterministic and correct** — the engine, not the LLM, decides every number (Articles 6, 7).
2. **Every verdict is recoverable without sight OR without sound** — four-channel floor (Article 2).
3. **The LLM never originates a number or a buy/sell call** — it only phrases (Article 6; hallucination eval).
4. **The guardian rails hold** — stop-loss mandatory, scam shield, crisis redirect, NOT-SEBI present (Articles 3, 5, 8).
5. **All 26 languages render** without Hinglish leakage and keep proper-nouns English (Article 9).

## The eval families

| Family | What it proves | Doc | Dataset | Harness | Hard target |
|---|---|---|---|---|---|
| Indicator accuracy | RSI/MACD/ATR/Roshan match known fixtures exactly | [evals/indicator_accuracy.md](evals/indicator_accuracy.md) | [indicator_cases.json](evals/datasets/indicator_cases.json) | `tools/test_technical_engine.mjs` | **100% deterministic** |
| Confluence accuracy | Multi-TF 5-state verdict matches gold | [evals/confluence_accuracy.md](evals/confluence_accuracy.md) | [confluence_cases.json](evals/datasets/confluence_cases.json) | `tools/test_confluence.mjs` | **100% deterministic** |
| Accessibility | 9 archetypes recover the verdict; axe-core clean | [evals/accessibility_eval.md](evals/accessibility_eval.md) | (live DOM) | `tools/test_accessibility.mjs` | **100% (axe 0 serious)** |
| Hallucination | LLM never originates a number / call | [evals/hallucination_eval.md](evals/hallucination_eval.md) | (engine-vs-narration diff) | `tools/cert_chitti_technical_ai.mjs` | **< 1%**, 0 fabricated % |
| Safety | Stop-loss, crisis, loss-spiral, NOT-SEBI | [evals/safety_eval.md](evals/safety_eval.md) | (guardrail probes) | `tools/cert_chitti_technical_ai.mjs` | **0 violations** |
| Tip Shield | Scam-pattern verdicts match gold | [evals/tip_shield_eval.md](evals/tip_shield_eval.md) | [tip_shield_cases.json](evals/datasets/tip_shield_cases.json) | `tools/test_tip_shield.mjs` | **0 misses on gold** |
| Languages | 26/26 render, no Hinglish, EN proper-nouns | (see RESULTS) | (substrate) | `tools/test_languages.mjs` | **26/26** |
| Journals | Dual journal + AI insights deterministic | (see RESULTS) | (paper-trade fixtures) | `tools/test_journals.mjs` | **deterministic** |

## The only targets we may STATE (not claim achieved)

These are *commitments*, not measured results. They flip from 🔵 PENDING to ✅ only when the named harness emits the number:

- Indicator accuracy: **100% deterministic** (engine reproduces every fixture).
- Accessibility: **100%** — axe-core **0 serious/critical** across 9 archetypes × 5 devices.
- Hallucination: **< 1%**; **0 fabricated accuracy %** ever (Article 4).
- Coverage: **26 / 26 languages**.
- Frontend: **all 5 frontend gates** + **CTO 8-gate** + **375px screenshot on all 5 devices**.

## How an eval becomes GREEN

1. The BO's TEST GATE runs (`node tools/<harness>.mjs`) — see [BUILD_ORDER.md](BUILD_ORDER.md) test commands.
2. Output is pasted into [evals/RESULTS.md](evals/RESULTS.md) with the run date + commit.
3. A 375px screenshot is saved per box per device under `tools/cert_screenshots/`.
4. Only then does the cell flip from 🔵 PENDING to ✅ / ❌.

No GREEN is claimed before its gate runs. Honest stubs over fake demos.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
