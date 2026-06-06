# CNOS — Action Agent

> Agent 7 of 7. *"What should the user do next?"* — 1-sentence next-step / "what to watch for".

The last agent in the swarm and the one that closes the CNOS promise: a reader should leave a story knowing not just *what happened*, but *what to do* or *what to watch for next*.

> **🔴 STATUS: NOT BUILT.** This is a Phase-2 feature. No code path computes a next-action line today. Documented honestly so intent is never mistaken for delivery.

---

## The question it answers (when built)

> **"Now that you've read this — what is the one thing to do, or the one thing to watch for next?"**

This is the final shift in CNOS's reason to exist: from *"What happened?"* to *"What should I do?"* (see [ROLE.md](../ROLE.md)).

---

## Contract (planned)

| | |
|---|---|
| **Input** | Career Agent output (article + career_impact_hint) + raw article |
| **Single output field** | `next_action_oneline` |
| **Status** | 🔴 **not yet wired** — Phase 2 |
| **Code** | **TODO** — Phase 2 feature; no module exists |

---

## Current build status — honest

| What | State |
|---|---|
| `next_action_oneline` field on the article row | 🔴 not built |
| `services/news_action.py` or equivalent | 🔴 does not exist |
| "What to watch for" rendering on the card | 🔴 not built |
| Any code path that runs this agent | 🔴 does not exist |

PRODUCT_VISION.md lists *"What happens next? → Action Agent's 1-sentence 'what to watch for'"* as part of the five questions every CNOS article should answer. That is the **target**, not today's reality. Today a story answers four of the five at best; the action line is unshipped.

---

## Intended design (for reference only)

When built, the Action Agent would produce one of two outputs per story:

| Output type | Example |
|---|---|
| **Next step** (actionable story) | "File your updated KYC before the 30 June deadline." |
| **Watch-for** (developing story) | "Watch for the RBI policy statement on Friday — it may change home-loan EMIs." |

It reads the Career hint + impact line and writes ONE field, overwriting nothing — same hand-off contract as every other agent.

---

## Failure handling (planned)

| Failure | Handling |
|---|---|
| Action Agent unavailable | No next-action line; **card still publishes** |
| No actionable signal in story | Field left empty; card publishes normally |

**Hard rule:** No agent failure blocks publish. Until this agent ships, every card publishes without a next-action line — the gap is the documented status, surfaced in [`observability/`](../observability/).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
