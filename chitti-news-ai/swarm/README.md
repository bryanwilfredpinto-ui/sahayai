# CNAIOS — Swarm

The 7-agent swarm. Per Sire's directive: *"Not one AI. 7 agents."*

---

## The 7 agents

| # | Agent | Question | Status |
|---|---|---|---|
| 1 | **News Agent** | *"What's new in AI today?"* — ingest from 8 RSS sources + manifest providers | ✅ live |
| 2 | **Verification Agent** | *"Is the source real + free?"* — source allowlist + URL on official_domain check | ✅ live (per-ingest) |
| 3 | **Context Agent** | *"Why does it matter to a profession?"* — rule-driven matched_keywords / source_signals | ✅ live (rules-only classifier) |
| 4 | **Personalization Agent** | *"Should THIS profession care?"* — per-profession `confidence ≥ 0.5` gate | ✅ live |
| 5 | **Accessibility Agent** | *"Can blind / deaf / mute / illiterate users consume this?"* — 5-element widget per card | ✅ live (67 cards in production) |
| 6 | **Career Agent** | *"How does this affect career outcomes?"* — Opportunity Radar + Skill Gap Radar (Phase 2) | 🔴 Phase 2 |
| 7 | **Action Agent** | *"What should the user do next?"* — Chitti Mentor + Coach + Opportunity Engine (Phase 2) | 🔴 Phase 2 |

---

## Hand-off contract

```
ingest_event (course / cert / tool / job / scheme / roadmap / article)
  → News Agent       → item + source attribution
  → Verification     → item + verified_source ∈ allowlist
  → Context          → item + matched_keywords + source_signals
  → Personalization  → item + profession_labels + confidence
  → Accessibility    → item + speaker_payload + isl_payload + 5-element widget hooks
  → Career           → item + opportunity_score per profession (Phase 2)
  → Action           → item + next_action per profession (Phase 2)
```

---

## Failure handling

| Failure | Behavior |
|---|---|
| News Agent ingest fails | Per-source `last_error` logged; other sources continue |
| Verification finds source outside allowlist | Item rejected; never published |
| Context Agent finds zero keywords | Item has empty profession labels; appears in "Everyone" only |
| Personalization low confidence | Item only in "Everyone"; not in any profession feed |
| Accessibility hook missing | Item still published; flagged in observability |
| Career / Action unavailable (Phase 2 not built) | Item published as-is |

**Hard rule:** No agent failure blocks publish. Honest empty state always.

---

## Where each agent lives

| Agent | Code |
|---|---|
| News | [`backend/services/courses_ingestor.py`](../backend/services/courses_ingestor.py) + [`streams_ingestor.py`](../backend/services/streams_ingestor.py) + [`rss_fetcher.py`](../backend/services/rss_fetcher.py) |
| Verification | source-allowlist enforced in ingestors (URL must contain `official_domain`) |
| Context | [`profession_classifier.py`](../backend/services/profession_classifier.py) keyword + source-default layers |
| Personalization | [`profession_classifier.py`](../backend/services/profession_classifier.py) confidence threshold |
| Accessibility | inherited via `feedback-widget.js` + `chitti_a11y.js` + per-card `data-chitti-response` |
| Career | TODO — `features/CAREER_AGENT.md` Phase 2 |
| Action | TODO — `features/ACTION_AGENT.md` Phase 2 |

---

## CI guardrails

- `test_fail_open.py` — every agent must work with all LLM env vars stripped (6/6 PASS)
- `test_no_llm_imports_in_classifier_critical_path` — Context + Personalization agents are statically scanned for forbidden LLM imports

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
