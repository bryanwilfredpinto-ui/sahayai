🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Metrics — the numbers that tell us the guardian is alive

> Subordinate to [../OBSERVABILITY.md](../OBSERVABILITY.md). **All values 🔵 PENDING** — emitted only once the engine runs in production (BO11/BO12). No fabricated metric.

---

## Metric families

### 1. Safety-rail metrics (SEV-1 if breached)

| Metric | Definition | Target | Current |
|---|---|---|---|
| `stopless_signals` | Buy/Sell verdicts emitted without an ATR stop | **0** (Article 5) | 🔵 PENDING |
| `crisis_redirects` | crisis keyword → Tele-MANAS 14416 fired | 100% of crisis turns | 🔵 PENDING |
| `crisis_llm_leak` | crisis turns that touched the LLM | **0** (Article 6) | 🔵 PENDING |
| `loss_spiral_cooldowns` | cool-downs engaged on >5%/3-loss trigger | 100% of triggers | 🔵 PENDING |
| `not_sebi_present_rate` | surfaces rendering the NOT-SEBI bar+modal | **100%** | 🔵 PENDING |

### 2. Determinism / honesty metrics

| Metric | Definition | Target | Current |
|---|---|---|---|
| `hallucination_rate` | narrated tokens not traceable to engine | **< 1%** | 🔵 PENDING |
| `fabricated_accuracy_pct` | bare accuracy % appearing in any output | **0** | 🔵 PENDING |
| `engine_narration_drift` | mismatches between engine object & narration | **0** | 🔵 PENDING |

### 3. Coverage / accessibility metrics

| Metric | Definition | Target | Current |
|---|---|---|---|
| `languages_live` | languages rendering end-to-end | **26 / 26** | 🔵 PENDING |
| `four_channel_complete_rate` | verdicts present in all 4 channels | **100%** | 🔵 PENDING |
| `axe_serious_findings` | axe-core serious/critical in prod sweep | **0** | 🔵 PENDING |
| `isl_panel_availability` | ISL panel reachable per response | 100% | 🔵 PENDING |

### 4. Engagement-honesty metrics (we measure the inversion)

> Per the Founder Rule, we do **not** optimise for more trades. These metrics watch that we are *not* nudging churn.

| Metric | Definition | Healthy direction | Current |
|---|---|---|---|
| `tip_shield_invocations` | tips screened for scams | up = good (guardian used) | 🔵 PENDING |
| `scam_tips_flagged` | tips classified SCAM/LIKELY_SCAM | tracked, never suppressed | 🔵 PENDING |
| `paper_trades_logged` | paper journal entries | tracked honestly (winners + losers) | 🔵 PENDING |
| `signals_urged` | signals framed as "you should trade" | **0** (Article 8) | 🔵 PENDING |

## Collection

- Emitted by the engine + cert harness (`tools/cert_chitti_technical_ai.mjs`) and the production backend (`chitti-shares-api`).
- Aggregated to the [quality_dashboard.md](quality_dashboard.md).
- SEV-1 metrics (`stopless_signals`, `crisis_llm_leak`, `fabricated_accuracy_pct`) page the CTO immediately.

Cross-links: [logs.md](logs.md) (raw traces behind these) · [feedback.md](feedback.md) (👍/👎 stream) · [../evals/RESULTS.md](../evals/RESULTS.md).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
