# CNOS — Swarm

The 7-agent swarm. Per Sire's directive: *"Not one AI. 7 agents."*

Every story passes through all 7 in order. Each agent has a specific job and its output is the next agent's input.

---

## The 7 agents

| # | Agent | Question it answers | Status |
|---|---|---|---|
| 1 | **News Agent** | *"What happened?"* — ingest + category classification | ✅ live (RSS poller + content classifier) |
| 2 | **Verification Agent** | *"Can we trust it?"* — cross-source matching + verdict | ✅ live ([`skills/chitti-news-factcheck/`](../skills/chitti-news-factcheck/)) |
| 3 | **Context Agent** | *"Why does it matter?"* — 1-line stake + affected group | ⚠️ partial (some categories have it; not universal) |
| 4 | **Personalization Agent** | *"Should THIS user care?"* — state/language/profession surface ranking | ✅ state-aware routing live |
| 5 | **Accessibility Agent** | *"Can blind/deaf users consume this?"* — speaker + ISL panel + ARIA | ✅ via `chitti_a11y.js` + `feedback-widget.js` |
| 6 | **Career Agent** | *"Does this affect jobs / learning / skills?"* — handoff to CNAIOS for relevance | 🔴 not yet wired (planned cross-Chitti swarm) |
| 7 | **Action Agent** | *"What should user do next?"* — 1-sentence next-step (or "watch for X") | 🔴 not yet wired (Phase 2) |

---

## Hand-off contract

Each agent reads the previous agent's output + the original article, and writes ONE new field. No agent overwrites another agent's output. Full audit trail per story.

```
article (raw RSS)
  → News Agent      → article + category
  → Verification    → article + verdict + match_count
  → Context         → article + impact_oneline + affected_group
  → Personalization → article + relevance_score per (state, lang, profession)
  → Accessibility   → article + speaker_payload + isl_payload + reading_time
  → Career          → article + career_impact_hint (cross-handoff to CNAIOS)
  → Action          → article + next_action_oneline
```

---

## When an agent fails

| Failure mode | Handling |
|---|---|
| News Agent classify fails | Default category = `national`; flag for human review |
| Verification timeout | Verdict = `unverified`; honest narration in Trust Strip |
| Context Agent silent | No impact line; card still publishes |
| Personalization fails | Default ranking by publish date |
| Accessibility missing | Card still publishes; accessibility-failure flagged in observability |
| Career Agent unavailable | No CNAIOS hand-off; card still publishes |
| Action Agent unavailable | No next-action line; card still publishes |

**Hard rule:** No agent failure blocks publish. Every failure is logged + surfaced in [`observability/`](../observability/).

---

## Where each agent lives in code

| Agent | Code path |
|---|---|
| News | [`backend/services/news_ingest.py`](../backend/services/news_ingest.py) + content classifier |
| Verification | [`backend/services/news_factcheck.py`](../backend/services/news_factcheck.py) (if file) + `skills/chitti-news-factcheck/` |
| Context | distributed across category sub-agents in `skills/` |
| Personalization | `news_db.feed()` state-aware ranking |
| Accessibility | inherited via repo-root `chitti_a11y.js` + `feedback-widget.js` |
| Career | TODO — to be wired as cross-Chitti event to CNAIOS |
| Action | TODO — Phase 2 feature |

---

See per-agent specs in:
- [NEWS_AGENT.md](NEWS_AGENT.md)
- [VERIFICATION_AGENT.md](VERIFICATION_AGENT.md)
- [CONTEXT_AGENT.md](CONTEXT_AGENT.md)
- [PERSONALIZATION_AGENT.md](PERSONALIZATION_AGENT.md)
- [ACCESSIBILITY_AGENT.md](ACCESSIBILITY_AGENT.md)
- [CAREER_AGENT.md](CAREER_AGENT.md)
- [ACTION_AGENT.md](ACTION_AGENT.md)

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
