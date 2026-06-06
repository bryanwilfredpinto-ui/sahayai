# CNOS — Career Agent

> Agent 6 of 7. *"Does this affect jobs / learning / skills?"* — career-impact hint + cross-handoff to CNAIOS.

The agent that connects the news to the reader's livelihood. It is the bridge between CNOS (news) and CNAIOS (Chitti News AI — tool & model discovery, upskilling).

> **🔴 STATUS: NOT BUILT.** This is a planned cross-Chitti swarm agent. Nothing in the codebase wires it today. Documented honestly so the swarm shape is clear and no one mistakes intent for delivery.

---

## The question it answers (when built)

> **"Does this story affect this reader's job, their skills, or what they should be learning — and is there a CNAIOS resource for it?"**

---

## Contract (planned)

| | |
|---|---|
| **Input** | Accessibility Agent output (article + speaker_payload + isl_payload + reading_time) + raw article |
| **Single output field** | `career_impact_hint` (+ cross-handoff event to CNAIOS) |
| **Status** | 🔴 **not yet wired** — planned cross-Chitti swarm |
| **Code** | **TODO** — to be wired as a cross-Chitti event to CNAIOS ([Chitti News AI](../../chitti-news-ai/)) |

---

## Current build status — honest

| What | State |
|---|---|
| `career_impact_hint` field on the article row | 🔴 not built |
| Cross-Chitti event emitter to CNAIOS | 🔴 not built |
| Profession → relevance mapping | 🔴 not built |
| Any code path that runs this agent | 🔴 does not exist |

There is **no** `services/news_career.py`. There is **no** CNAIOS hand-off in the ingest pipeline. The Career Agent is a Phase-2+ concept, not a shipped capability. Any claim that career impact is computed today would be false.

---

## Intended design (for reference only)

When a story carries profession-relevance (e.g. a DPDP-Act update for compliance officers, an AI model release for developers, a GST change for shopkeepers), the Career Agent would:

1. Read the affected group from Context + the reader's profession from Personalization.
2. Emit a `career_impact_hint` one-liner ("this affects how you file GST from April").
3. Fire a cross-Chitti hand-off so **CNAIOS** can surface a matching tool/course/explainer.

This mirrors the swarm hand-off contract: read previous output + raw article, write ONE field, overwrite nothing.

---

## Failure handling (planned)

| Failure | Handling |
|---|---|
| Career Agent unavailable | No CNAIOS hand-off; **card still publishes** |
| CNAIOS unreachable | Hint suppressed; gap logged |

**Hard rule:** No agent failure blocks publish. Until this agent exists, every card simply publishes without a career hint — the gap is the documented status, surfaced in [`observability/`](../observability/).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
