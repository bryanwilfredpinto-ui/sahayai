# CNAI_BO5_BEST_PRACTICES.md — Swarm Learning

**Top 3 insights:** (1) deterministic single-writer fan-out with graceful degradation (no agent failure blocks consolidation); (2) cohort-gated social proof — show "X% of N professionals" only when N ≥ 50, always with sample size; (3) privacy-by-design — no user IDs, one-click immediate remembered opt-out.

### Applied
- **Preserve API:** `run, fanOut, consolidate, crossDomain, proposeToCatalog, speakable`. Additive: `setOptOut, isOptedOut, pattern, optOutControl`.
- **Opt-out (CEOS BO5):** `setOptOut(true/false)` persists to localStorage (`cnai_swarm_optout`) with in-memory fallback; `isOptedOut()` reads it; `run()` respects it — opted-out users contribute nothing but still see others' insights.
- **Min cohort 50 + sample size:** `pattern(profession, stage)` returns an aggregate ONLY if cohort ≥ 50, formatted "After Stage N, 87% of 214 doctors studied X next"; below 50 → suppressed with an honest "not enough data yet" note (prevents re-identification).
- **No user IDs:** swarm rows are `profession × skill × pattern × count` only.
- **Confirm-before-act guardrail** stays in the agent insights (Golden Rule).
- **No throw; <1s deterministic; a11y-ready text.**

### Accessibility specific to BO5
Insights + sample sizes are plain text (screen-reader friendly); opt-out is a single labelled control (UI). No color-only signalling; no competitive/streak pressure (cognitive + anxiety safety).

### CEOS / deviation
Satisfies CEOS BO5 (cohort 50, sample size, opt-out, no IDs). No deviation; additive.
