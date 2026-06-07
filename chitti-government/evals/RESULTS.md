🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# EVALS — measured results (honest, deterministic)

> Only measured numbers appear here. LLM-phrasing metrics gated on DeepSeek funding +
> the Vaani relevance-rail are `AUTOMATION-LIMITED`, never fabricated.

## Run 2026-06-06 (CEOS v1.0 build)

| Eval | Gate | Measured | Status |
|---|---|---|---|
| **Fraud detection** (deterministic) | ≥95% recall, low FP | **12/12 exact (100%) · 0 genuine false-positives** | 🟢 [datasets/fraud_cases.json](datasets/fraud_cases.json) via `services/government_fraud.py` |
| **Scheme catalog integrity** | 99% real + sourced | **84/84 carry `source_url`; 0 missing; dedup-clean** | 🟢 validated in `tools/expand_government_schemes.mjs` |
| **Backend routes** | 200 + correct verdict | **/health, /schemes(84), /fraud-check, /life-events, /life-event, /readiness all green** (Flask test client) | 🟢 |
| **Inline JS syntax** (frontend engines) | 0 errors | **3/3 inline blocks parse clean** | 🟢 vm.Script check |
| **Eligibility accuracy** (deterministic) | 95% | **23/23 exact (100%) · 0 guess-to-eligible violations** — cross-validated against the live Python engine AND the JS port | 🟢 [datasets/eligibility_cases.json](datasets/eligibility_cases.json) via `tools/eval_government_eligibility.mjs` + `services/government_eligibility.py` |
| **Accessibility (axe + 26-lang + 4-user)** | 100% | Playwright cert: 5 gates · #lang-select dropdown fires (en→hi→ta→en, Hindi pack translates) · 13 tabs · 4 engines render tap-only · tap targets ≥44px · axe 0 serious · console clean | 🟢 `tools/cert_government.mjs` |
| LLM verdict phrasing | n/a | DeepSeek funding + Vaani relevance-rail | ⛔ AUTOMATION-LIMITED |

Reproduce fraud eval:
```
cd chitti-government/backend && python -c "import sys,json;sys.path.insert(0,'services');\
import government_fraud as gf;\
[print(gf.classify(c['text'])['verdict'],'|',c['expected']) for c in json.load(open('../evals/datasets/fraud_cases.json',encoding='utf-8'))]"
```

Reproduce eligibility eval: `node tools/eval_government_eligibility.mjs`
Reproduce accessibility/page cert: `node tools/cert_government.mjs`

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
