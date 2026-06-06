# SOP-005 — Universal Handover Protocol

> Standard Operating Procedure for handing off Chitti News AI to a new
> maintainer, a new AI agent, or for Sire's quarterly product review.
> Defines the **Chitti Universal Handover Document** checklist —
> the 31-file set that this SOP itself completes.

---

## What "handover" means here

A handover is complete when a fresh reader — human or AI — can:

1. Reproduce the product from a clean clone.
2. Run all CI checks GREEN.
3. Make a change end-to-end (edit → CI → deploy → verify).
4. Defend the locked decisions against a "why don't you just …" challenge.

If any of these four can't be done from the docs alone, the handover is incomplete.

---

## The 31-file checklist (the Universal Handover Document)

### Level 0-1 — Constitution + Vision

- [ ] `CONSTITUTION.md` — Role + Founder Rule + Never/Always
- [ ] `VISION.md` — Mission + Vision + Shift

### Level 10 — Quality

- [ ] `QUALITY.md` — 8 gates

### Roadmap

- [ ] `ROADMAP.md` — v0.3 / v1.1 / v2.0 honest split

### Accessibility (4 journeys)

- [ ] `accessibility/blind_user.md`
- [ ] `accessibility/deaf_user.md`
- [ ] `accessibility/mute_user.md`
- [ ] `accessibility/illiterate_user.md`

### Swarm (8 agents + README)

- [ ] `swarm/role_mapping_agent.md` — Agent 1
- [ ] `swarm/cert_agent.md` — Agent 2
- [ ] `swarm/course_agent.md` — Agent 3
- [ ] `swarm/tool_agent.md` — Agent 4
- [ ] `swarm/prompt_agent.md` — Agent 5
- [ ] `swarm/accessibility_agent.md` — Agent 6
- [ ] `swarm/trust_quality_agent.md` — Agent 7
- [ ] `swarm/language_agent.md` — Agent 8
- [ ] `swarm/README.md` — overview

### Guardrails

- [ ] `guardrails/safety.md` — Rules-only critical path + disclaimers
- [ ] `guardrails/hallucination.md` — Extractive summarization contract
- [ ] `guardrails/privacy.md` — localStorage-only + anonymised feedback

### Memory

- [ ] `memory/life_twin.md` — chittiCoachProfile_v1 schema
- [ ] `memory/family_graph.md` — N/A explicitly documented

### Observability

- [ ] `observability/metrics.md` — vote / click / classifier / source / latency
- [ ] `observability/logs.md` — backend logs + frontend console policy

### Evals

- [ ] `evals/router_accuracy.md` — F1 ≥ 0.85 per profession
- [ ] `evals/accessibility_eval.md` — axe-core WCAG 2.1 AA

### SOPs

- [ ] `sop/sop_001_onboarding.md` — first visit flow
- [ ] `sop/sop_002_swarm_pattern_promotion.md` — daily/weekly/monthly/quarterly cycle
- [ ] `sop/sop_003_classifier_rule_update.md` — adding profession / keywords
- [ ] `sop/sop_004_backend_redeploy.md` — Railway redeploy flow
- [ ] `sop/sop_005_handover_protocol.md` — this file

Every file on this list MUST exist and MUST end with a "Last reviewed: YYYY-MM-DD" footer no older than 90 days.

---

## Existing docs that stay AS-IS

These were good and should not be touched during a handover:

| File | Role |
|---|---|
| `COSDF.md` | 950-line canonical spec — single source of truth |
| `PERSONAS.md` | Persona depth document |
| `SUCCESS_METRICS.md` | KPI definitions |
| `PRD.md` | Feature requirements |
| `SKILLS.md` | Skill catalog |
| `SWARM.md` | Pre-existing swarm overview (the per-agent .md files in swarm/ add depth) |
| `ROLE.md` | Pre-COSDF role statement (CONSTITUTION.md is the v1.1 version) |
| `PRODUCT_VISION.md` | Pre-COSDF vision (VISION.md is the v1.1 version) |
| `ARCHITECTURE.md` | System architecture |
| `BENCHMARKS.md` + `BENCHMARK_VS_INDUSTRY.md` | Benchmark history |
| `BUILDORDER.md` | Build sequence |
| `CHANGELOG.md` | Per-release notes |
| `CONTEXT.md` | Onboarding orientation |
| `EVALS.md` | Top-level evals overview (evals/ folder adds depth) |
| `HANDOVER/01-07_*.md` | The chitti-cto handover artefacts |
| `PHASE_0_BENCHMARK.md` | Initial benchmark |
| `README.md` | Repo entrypoint |
| `SHIP.md` | Release log |
| `SOP.md` | Pre-SOP-folder operations doc |
| `TESTING.md` | Test plan |
| `TODO.md` | Live todo list |
| `SKILL.md` | Top-level skill manifest |

---

## Handover walkthrough — the 30-minute path

A new maintainer takes ~ 30 minutes:

1. Read `COSDF.md` (skim 950 lines, deep on locked decisions §LEVEL 0 + §LEVEL 7).
2. Read `CONSTITUTION.md` + `VISION.md` (5 min).
3. Read `ROADMAP.md` (3 min) — what's built, what's not.
4. Skim `accessibility/*.md` (5 min) — the 4 journeys.
5. Skim `guardrails/*.md` (5 min) — the safety contract.
6. Skim `swarm/README.md` + 1-2 agent files (5 min).
7. Read `sop/sop_004_backend_redeploy.md` (3 min) — how to ship.
8. Read `evals/*.md` (2 min) — what success looks like.

After this, the maintainer can:
- Find the rules-only critical path.
- Identify what is LIVE vs spec'd-not-built.
- Make a classifier-rule change (SOP-003) and deploy (SOP-004).

---

## When this SOP is invoked

- Sire's quarterly product review.
- New AI agent (Claude, GPT, Gemini) is brought in to assist on this product.
- A new human maintainer joins.
- After a major refactor that changes architecture (rare).

Each invocation generates a `HANDOVER_<YYYY-MM-DD>.md` artefact in `chitti-news-ai/HANDOVER/` that records:
- Who received the handover.
- Which files were reviewed.
- What changes were made during the handover (if any).
- Sign-off date.

---

## Verification

After completing this SOP:

1. Run `find chitti-news-ai/ -name '*.md' -newer 'chitti-news-ai/COSDF.md'` — should list at least the 31 handover files.
2. Run `grep -L 'Last reviewed: 2026' chitti-news-ai/**/*.md` — should be empty (every doc has a recent review footer).
3. Run all CI checks — should be GREEN.
4. Run `tools/qa_news_ai_a11y.mjs` — should pass per `evals/accessibility_eval.md`.

If all four verify, the handover is complete.

---

## Hard rule

A "complete handover" is not a checklist of files existing. It is the maintainer's ability to ship a working change end-to-end. If you can do SOP-001 → SOP-003 → SOP-004 from these docs without asking Sire a question, the handover worked.

If you can't, the docs are wrong — file the gap against this SOP.

---

Last reviewed: 2026-06-06
