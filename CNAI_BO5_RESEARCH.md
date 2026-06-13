# CNAI_BO5_RESEARCH.md
## BO5 — Swarm Learning (multi-agent / community intelligence) · Top-20 + Top-20

**Date:** 2026-06-13 · No code before research.

### A. Top 20 — multi-agent / parallel-work / community-learning systems
| # | System | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1 | LangGraph | Stateful agent graphs, single-writer | Code-level | Deterministic baseline, no LLM needed |
| 2 | CrewAI | Role-based agent crews | Needs LLM | Reproducible fan-out |
| 3 | AutoGen | Conversable agents | Cost; nondeterministic | Deterministic + graceful-degrade |
| 4 | OpenAI Swarm | Lightweight handoffs | Experimental | Privacy + cohort gate |
| 5 | smolagents (HF) | Minimal agents | Code | Profession framing |
| 6 | MetaGPT | SOP-driven agents | Heavy | Lightweight |
| 7 | Microsoft Magentic | Orchestration | Enterprise | Consumer |
| 8 | Camel-AI | Role-play agents | Research | Applied learning |
| 9 | Stack Overflow | Community Q&A | No privacy aggregation | Anonymised swarm |
| 10 | Reddit/Discord study groups | Peer signals | No structure/privacy | Aggregated, anonymised |
| 11 | Duolingo leaderboards | Social proof | Competitive pressure | Non-competitive insight |
| 12 | Strava segments | Cohort comparison | Fitness | Learning cohort patterns |
| 13 | GitHub trending | What peers build | No personalization | Profession patterns |
| 14 | Kaggle community | Shared notebooks | Expert-level | Beginner-safe |
| 15 | Goodreads "readers also" | Social recommendation | Books | "Doctors also studied" |
| 16 | Coursera "learners also took" | Path recommendation | Paid catalog | Free + cohort-gated |
| 17 | LinkedIn "people also viewed" | Peer paths | Privacy concerns | No user IDs |
| 18 | Degreed pathways | Skill graph | Enterprise | Consumer |
| 19 | Wikipedia crowd | Collective knowledge | Not personalized | Per-profession |
| 20 | Khan "mastery community" | Aggregate progress | US curriculum | India professions |

### B. Top 20 AI apps — swarm / orchestration / collective intelligence
| # | App | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1–8 | ChatGPT Teams / Claude Projects / Perplexity Spaces / Sana / Glean / Dust / Lindy / Relevance AI | multi-agent workflows | enterprise, LLM-cost, opaque | deterministic baseline, anonymised cohort, free |
| 9 | DeepLearning.AI multi-agent course | teaches the pattern | not a product | applied to learning paths |
| 10 | LangSmith | agent eval | dev | built-in coverage report |
| 11 | CrewAI Studio | no-code crews | needs keys | no-LLM baseline |
| 12 | Cognosys/Godmode | autonomous agents | unreliable | confirm-before-act guardrail |
| 13 | MultiOn | web agents | risky autonomy | Golden-Rule guardrail |
| 14 | Adept ACT | action models | research | safe baseline |
| 15 | Fixie/AI town | agent sims | research | real learning value |
| 16 | Replit Agent | builds apps | code | learning fan-out |
| 17 | Devin | SWE agent | code; cost | learning, free |
| 18 | "learners like you" recommenders | social proof | privacy risk | min-cohort-50, no IDs |
| 19 | Quizlet "classes" | shared study | no privacy aggregation | anonymised aggregate |
| 20 | Brainly community | crowd answers | cheating risk | anti-cheat + insight |

### C. 3 best ideas to adopt
1. **LangGraph single-writer / fixed-order fan-out** → already the engine's contract; keep deterministic + graceful-degradation (no agent failure blocks consolidation).
2. **"Learners like you also studied X" social proof (Coursera/Goodreads)** → add cohort-gated aggregate patterns: "After Stage 2, 87% of 214 doctors studied Medical Imaging AI next" — with **minimum cohort of 50** and **sample size shown**.
3. **Privacy-by-design (no user IDs)** → swarm stores only `profession × skill × pattern × count`; opt-out is one click, immediate, remembered.

### D. 3 anti-patterns to avoid
- **Re-identification from tiny cohorts** → enforce min cohort 50 before display.
- **Competitive pressure (leaderboards/streaks)** → insight, never ranking/guilt.
- **Unreliable autonomous agents acting** → confirm-before-act guardrail (Golden Rule) already encoded.

### E. Mapping (CEOS BO5)
- Aggregation with consent; pattern extraction; social-proof display; **no personal data**; **min cohort 50**; sample size shown; opt-out visible + immediate + remembered; swarm API <1s; **add** `setOptOut/isOptedOut`, `pattern(profession, stage)`, cohort gate.

### F. Deviation
None — additive; `run/fanOut/consolidate/crossDomain/proposeToCatalog/speakable` unchanged.
