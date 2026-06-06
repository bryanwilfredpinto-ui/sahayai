# CNOS — Context Agent

> Agent 3 of 7. *"Why does it matter?"* — 1-line stake + affected group.

The agent that converts an event into meaning. It answers the question every aggregator skips: not *what happened*, but *why a reader should care*.

---

## The question it answers

> **"Why does this matter, and to whom?"**

One line. The stake of the story plus the group it touches — surfaced under the headline so a reader knows in a glance whether the story is theirs.

---

## Contract

| | |
|---|---|
| **Input** | Verification Agent output (article + verdict + match_count) + raw article |
| **Single output field** | `impact_oneline` (+ `affected_group`) |
| **Status** | ⚠️ **partial** — present on some categories, not yet universal |
| **Code** | distributed across category sub-agents in [`skills/`](../skills/) (politics, business, sports, tech, entertainment) |

---

## Current build status — honest

| What | State |
|---|---|
| 1-line stake for some categories | ⚠️ partial, via category sub-agents |
| Universal coverage on every card | 🔴 not yet — many cards publish with no impact line |
| Dedicated `services/news_context.py` module | 🔴 not built — logic lives inside category skills |
| Structured `affected_group` field on the row | 🔴 planned |

This agent is **not** a green stage. It is documented here as the swarm's intended shape; today its output is opportunistic, not guaranteed.

---

## How it works (where present)

The category sub-agents in `skills/` carry domain context (e.g. `chitti-news-business` knows a repo-rate move affects borrowers; `chitti-news-politics` knows an election-date notification affects voters in a state). When a story falls into one of these categories, the sub-agent can supply the stake line. Stories outside those categories currently get no context line.

---

## Targets (when fully built)

| Metric | Target |
|---|---|
| Cards with an impact line | universal (every promoted card) |
| Stake-line accuracy (reader survey: "did this help me understand why it matters?") | ≥ 0.90 |
| Affected-group precision (feeds Personalization Agent) | ≥ 0.90 |

The `affected_group` output is intended to feed Agent 4 (Personalization) — it is the bridge between *"why it matters"* and *"does it matter to YOU."*

---

## Failure handling

| Failure | Handling |
|---|---|
| Context Agent silent (no signal) | No impact line; card still publishes |
| Category sub-agent unavailable | Card publishes with verdict only |

**Hard rule:** No agent failure blocks publish. A missing context line is logged and surfaced in [`observability/`](../observability/) — never a reason to drop a card.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
