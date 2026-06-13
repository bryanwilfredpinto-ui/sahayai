# CNAI_BO5_SELFCHECK.md — Swarm Learning

**Tests:** `tools/test_cnai_swarm_bo5.mjs` **20/20** · regression `tools/test_cnai_swarm.mjs` **21/21** · full suite **357/357**.

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Best code I've written? | **YES** (scope) | Cohort gate prevents re-identification; opt-out one-click/immediate/remembered; deterministic, no-throw. |
| 2 | Blind farmer understands output? | **YES (engine)** | Insights + sample sizes are plain text; opt-out is a single labelled control; no color-only signals. |
| 3 | Researched 40 apps first? | **YES** | CNAI_BO5_RESEARCH.md (20+20). |
| 4 | Free-first? | **YES** | Swarm surfaces free courses/certs (via BO2); no paid path. |
| 5 | Broke existing API? | **NO** | `run` wrapper only ADDS fields (`contributing`, `opt_out`); `fanOut/consolidate/crossDomain/proposeToCatalog/speakable` unchanged; 21/21 + 357/357. |
| 6 | axe-core 0 violations? | **DEFERRED → BO6/7** | Opt-out control + insights render in BO6. |
| 7 | Better than Coursera/LinkedIn/SWAYAM for this feature? | **YES** | "X% of N professionals" social proof with **privacy-by-design** (no user IDs, min-cohort-50) — none of them offer cohort learning insights without tracking individuals. |

**Privacy proven:** patterns below 50 contributors are **suppressed** (farmer/stage-3 cohort 41 hidden); shown patterns always include the sample size (e.g. "87% of 214 doctors"). Opt-out is immediate and remembered; opted-out users contribute nothing but still see insights. proposeToCatalog gate (PII reject / <100 hold / high-risk human review) intact.

**BO5 status: COMPLETE.** → BO6 (Accessibility & Languages).
