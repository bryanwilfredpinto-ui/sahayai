🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# QUALITY — CFOS v2.0

> The merge-blocker bar + how it is *measured*, not claimed. Pairs with
> [EVALS.md](EVALS.md) (targets) and [OBSERVABILITY.md](OBSERVABILITY.md) (live signals).
> Reproducible harnesses live in `tools/`.

## Quality gates (nothing ships below these)

| Gate | Target | How it's measured | Current |
|---|---|---|---|
| Fashion accuracy | ≥ 95% (within-band) | 1000-case GOLD set, deterministic engine — `tools/fashion_gold_eval.mjs` | **99.3% within-band / 91.6% exact** |
| Colour harmony | ≥ 95% | same gold set | **96.9%** |
| Seasonal suitability | ≥ 95% | same gold set | **98.4%** |
| Accessibility | 100% | `tools/fashion_eval_harness.mjs` (100 cases) + cert | **100/100** |
| Body-shaming | 0% | guardrail classifier on every response | **0** |
| Hallucination | < 1% | engine never emits a non-owned item (by construction) | **~0** |
| Critical bugs | 0 | `tools/fashion_qa.mjs` (all tabs/buttons/forms/console) | **0 (QA 37/37)** |
| Mobile @375px | 100% | `tools/cert_fashion.mjs` real screenshots @375/768/1280 | **14/14** |
| Engine unit | 100% | `tools/fashion_engine_test.mjs` | **33/33** |

## Verification protocol (every change)

```bash
python -m http.server 8765
node tools/fashion_engine_test.mjs        # engine + colour science + learning
node tools/fashion_gold_eval.mjs          # 1000-case accuracy (must stay ≥ gate)
CERT_BASE=http://127.0.0.1:8765 node tools/cert_fashion.mjs           # responsive + 5-gate
CERT_BASE=http://127.0.0.1:8765 node tools/fashion_qa.mjs             # tabs/buttons/forms/i18n/console
CERT_BASE=http://127.0.0.1:8765 node tools/cert_fashion_journeys.mjs  # 5 user journeys
```

## CTO compliance (UI Standard v1.0)

- §1 Saffron/Navy/Green theme · §2 per-box feedback strip (feedback-widget.js) ·
  §3 Quality + §4 Observability per-card overlays (role=cto/admin) · §5 No-Hinglish
  (9-language native) · §6 domain allowlist · World Class identity badge.
- 5 frontend gates (G1–G5) + 8 CTO gates. See [QUALITY_STATUS.md](../QUALITY_STATUS.md).

## Honest open items (not yet GREEN)

- **Fashion-accuracy gold is deterministic vs synthetic labels** — not yet stylist-rated
  or real-user-acceptance validated.
- **Vision (photo garment-read)** needs the DeepSeek/vision unblock — engine-ready.
- **Live-prod re-cert + Lighthouse** after each deploy.

## Hard rule

A claim without a reproducible number is not a quality claim. Every gate above maps to
a script in `tools/`. No GREEN without proof.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
