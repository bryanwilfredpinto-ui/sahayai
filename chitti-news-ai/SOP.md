# CNAIOS — STANDARD OPERATING PROCEDURES

Mechanical steps for the operational events. Owned by the 7-agent swarm in [`swarm/`](swarm/).

---

## SOP-001 — New course / item lands in ingest

When `streams_ingestor` or `courses_ingestor` writes a new row:

| Step | Owner | Output |
|---|---|---|
| 1. **Verify source** | Verification Agent | source_slug ∈ allowed registry; URL on `official_domain` |
| 2. **Classify profession** (rules-only) | News Agent + `profession_classifier.py` | per-profession labels with confidence + matched_keywords + source_signals |
| 3. **Determine free/paid** | from source manifest | `is_free` + `cost_label` verbatim — NEVER inferred |
| 4. **Estimate effort** | from source manifest (`duration_minutes`) | optional |
| 5. **Apply exclude-keyword veto** | classifier `exclude_keywords` rule | drop profession tag if any veto fires |
| 6. **Publish** | feed engine | item surfaces in `/api/news-ai/feed/<stream>?profession=X` |

**Hard rules:**
- Zero LLM calls in steps 1–6 (rules-only critical path)
- Every published item carries full explainability bundle
- Items > 30 days unverified get a `⏳ Nd STALE` flag (frontend)

---

## SOP-002 — Sire's worked examples regression check

Every commit that touches `profession_classifier.py` or `profession_registry.json` MUST pass `test_classifier_sire_worked_examples`:

1. NVIDIA CUDA C/C++ → `software-developer`
2. Oncology AI Conference → `oncologist`
3. Precision Agriculture Drone Training → `farmer`
4. ATS Optimization → `talent-acquisition`

If any fails → block merge.

---

## SOP-003 — Fail-open guardrail

CI test forbids:
- `import httpx` / `import openai` / `import anthropic` / `google.generativeai` in `profession_classifier.py`
- env-var reads of `DEEPSEEK_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` in the classifier module

If any new commit re-introduces forbidden imports → block merge.

---

## SOP-004 — Per-profession F1 regression

After every rule edit:

1. Run benchmark harness against 250-row hand-labelled dataset
2. Compute per-profession precision / recall / F1
3. If any profession drops below 0.85 → block merge, surface drop
4. Commit benchmark report alongside the rule change

Current state: 13/13 PASS (business-owner 0.97; software-developer 0.857).

---

## SOP-005 — Scheduler refresh cycle

| Job | Cadence |
|---|---|
| `rss_poll` (news articles) | every 6 h |
| `streams_refresh` (cert/tool/job/scheme/roadmap) | every 6 h |
| `classify_sweep` (catch un-tagged) | hourly |
| Per-source link-check (HEAD probe) | weekly Sunday 04:00 IST (PENDING build) |

All scheduler runs log to application logs + Founder dashboard.

---

## SOP-006 — On-demand 🤖 Chitti explains

1. Try LLM path via `news_explain.py` (if LLM key configured)
2. On LLM failure: extractive fallback via `enhancement.summarise()`
3. Response carries `source: "llm"|"extractive"` so UI shows honesty marker
4. NEVER 500 — always returns useful text

Cert: 6/6 fail-open tests.

---

## SOP-007 — Profession picker UX

1. Stored in `localStorage.chitti_news_ai_profession`
2. NEVER sent to backend
3. Triggers For You tab to appear in nav
4. Triggers blind-user auto-read if Disability Profile has blind=true
5. User can clear any time via "✕ Clear" link → reverts to Everyone

Cert: `cert_news_ai.mjs` verifies aria + auto-read + persistence across reload.

---

## SOP-008 — Stale-data flag rendering

1. Compute `ageDays = (now - (last_verified_at || ingested_at)) / 86400000`
2. If `ageDays > 30`: render `⏳ <ageDays>d STALE` badge
3. Yellow with amber border + title attribute for screen readers

---

## SOP-009 — Per-stream tab navigation

5 stream tabs (Certs / Tools+ / Jobs / Schemes / Roadmaps) always visible:

1. Each tab loads `/api/news-ai/feed/<kind>?profession=<X>&n=30`
2. Profession filter honored (default Everyone)
3. Honest empty state: "No <kind> classified for X yet — try Everyone"
4. Every card: Trust Strip + stale flag + "ℹ Why this matters" disclosure + 4-user widgets

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
