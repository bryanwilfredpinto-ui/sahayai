# Chitti News AI — Swarm (8 Agents)

> Per [`../COSDF.md`](../COSDF.md) §LEVEL 6 (lines 270-329). Every user request
> passes through ALL eight agents in order. The output of agent N is the input
> of agent N+1. The final output goes to the user.

This supersedes the prior 7-agent README. The 8th agent (Language) was implicit
before; it is now explicit and contractual.

---

## The 8 agents in order

| # | Agent | Question it answers | Status | Doc |
|---|---|---|---|---|
| 1 | **Role Mapping** | *"What domain / keywords / tools does this role need?"* | ✅ LIVE | [`role_mapping_agent.md`](role_mapping_agent.md) |
| 2 | **Certification** | *"What verified certs exist for this role, FREE-first?"* | ✅ LIVE | [`cert_agent.md`](cert_agent.md) |
| 3 | **Course** | *"What FREE courses match, by difficulty?"* | ✅ LIVE | [`course_agent.md`](course_agent.md) |
| 4 | **Tool** | *"Which AI tools matter for this role, with use-cases?"* | ✅ LIVE | [`tool_agent.md`](tool_agent.md) |
| 5 | **Prompt** | *"Which curated prompts copy-paste straight into ChatGPT?"* | ✅ LIVE | [`prompt_agent.md`](prompt_agent.md) |
| 6 | **Accessibility** | *"How do we render this for blind / deaf / mute / illiterate?"* | ✅ LIVE | [`accessibility_agent.md`](accessibility_agent.md) |
| 7 | **Trust & Quality** | *"Is every URL real? FREE-first? No fake certs?"* | ✅ LIVE | [`trust_quality_agent.md`](trust_quality_agent.md) |
| 8 | **Language** | *"Translate to user.lang, honest fallback when missing"* | ✅ LIVE | [`language_agent.md`](language_agent.md) |

---

## Hand-off contract

```
user_request (role + lang + disability_profile)
   ↓
Agent 1 (Role Mapping)        → role_normalised, primary_domain, filters
   ↓
Agent 2 (Certification)       → certifications[]
   ↓
Agent 3 (Course)              → courses[]
   ↓
Agent 4 (Tool)                → tools[]
   ↓
Agent 5 (Prompt)              → prompts[]
   ↓
[merge to assembled_response]
   ↓
Agent 6 (Accessibility)       → modality + render_hints + adapted content
   ↓
Agent 7 (Trust & Quality)     → verified content + trust_strip
   ↓
Agent 8 (Language)            → translated_response + translation_meta
   ↓
FINAL OUTPUT TO USER
```

---

## Hard rules

1. **No agent failure blocks publish** — each agent has an honest empty-state fallback.
2. **No LLM in the critical path** — Agents 1, 2, 3, 4, 5, 6, 7 are rules-only. Agent 8 may use DeepSeek for non-P0 languages but with honest fallback note.
3. **Order is fixed** — Accessibility BEFORE Trust BEFORE Language. Re-ordering breaks the contract.
4. **Founder Rule is enforced at Agent 7** — if any clause is violated, Agent 7 corrects or blocks.

---

## Where the code lives

| Agent | Code path |
|---|---|
| 1 — Role Mapping | `../backend/services/profession_classifier.py` + `chitti_coach.js` `SKILL_VOCAB` / `GOAL_VOCAB` |
| 2 — Certification | `../backend/services/courses_ingestor.py` + `data/certifications_catalog.json` |
| 3 — Course | `../backend/services/courses_ingestor.py` + `data/courses_catalog.json` |
| 4 — Tool | `../backend/services/streams_ingestor.py` + `data/tools_catalog.json` |
| 5 — Prompt | `data/prompts_library.json` |
| 6 — Accessibility | `../../chitti_a11y.js` substrate + per-card `data-chitti-response` |
| 7 — Trust & Quality | URL-host enforcement in ingestors + nightly broken-link sweep |
| 8 — Language | `../../chitti_lang.js` substrate + Voice Factory cascade |

---

## CI guardrails

- `test_fail_open.py` — every agent must work with all LLM env vars stripped.
- `test_no_llm_imports_in_classifier_critical_path` — static scan of forbidden imports.
- `test_classifier_sire_worked_examples.py` — F1 ≥ 0.85 per profession.
- `test_accessibility_agent_modality_matrix` — every modality combination produces correct render_hints.
- `test_language_agent_no_mixed_lang` — no English bleed into P0 language responses.

---

## Phase 2 agents (specced, not yet ranked among the 8)

| Future agent | Source | Status |
|---|---|---|
| Career Agent | COSDF L18 Jobs Radar + L22 Future Forecast | 🔴 Phase 2 |
| Action Agent | COSDF L19 Chitti Mentor + L16 Weekly Missions | 🟡 partial — Mentor LIVE, Action wiring partial |
| Community Intelligence Agent | COSDF L20 | 🔴 Phase 2 |
| Tool Comparison Agent | COSDF L21 | 🔴 Phase 2 |

When promoted to the critical path, these agents will be numbered 9, 10, 11, 12 and slotted between Agent 5 (Prompt) and Agent 6 (Accessibility) — i.e. all data-shaping agents run before modality / trust / language.

---

Last reviewed: 2026-06-06
