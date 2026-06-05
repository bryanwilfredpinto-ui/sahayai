# Chitti News AI — SWARM Intelligence

Inherits the platform-wide [SAHAYAI_MASTER §2f Swarm Intelligence contract](../SAHAYAI_MASTER.md#2f-swarm-intelligence--locked-2026-05-14).

> *"Every Chitti of the same type learns from every other Chitti of the same type. Anonymised → pattern detect → ≥100 confirmations → human review → push to skills/*.md → all instances benefit."*

> **COSDF v1.1 (2026-06-05):** the existing 7-agent swarm extends to a
> per-request 8-agent swarm (Role-Mapping → Cert → Course → Tool → Prompt →
> Accessibility → Trust & Quality → Language) PLUS 10 v1.1 background agents
> for the new layers. Canonical spec: [COSDF.md](COSDF.md) Levels 6 + 13-22.

## COSDF v1.1 — Per-request 8-agent SWARM

Every user request passes through all 8 agents (per [COSDF.md Level 6](COSDF.md)):

1. **Role Mapping Agent** — ANY role → mapped domain/tools/keywords (L23)
2. **Certification Agent** — verified certs for that role, FREE-first
3. **Course Agent** — free courses, difficulty-tagged
4. **Tool Agent** — AI tools relevant to that role with use-case examples
5. **Prompt Agent** — curated copy-paste-ready prompts (L17 PROMPT_LIBRARY)
6. **Accessibility Agent** — adapts output for blind/deaf/illiterate/mute/blind+deaf/low-vision/cognitive
7. **Trust & Quality Agent** — verifies real links, no fake certs, FREE-first compliance
8. **Language Agent** — translates output to user's selected language (100+)

## COSDF v1.1 — Background agents (new layers)

| Agent | Role | Runs |
|---|---|---|
| **Impact Score Agent** (L13) | Computes 4 scores per profession; updates quarterly | Quarterly cron + on-demand |
| **Relevance Agent** (L14) | Tags every news article with 4-band relevance per profession | On ingest |
| **Readiness Agent** (L15) | Computes user's 0-100 score + 12-week roadmap | On intake change + weekly |
| **Mission Agent** (L16) | Builds the 30-min weekly mission per profession × week | Weekly cron |
| **Project Agent** (L17) | Surfaces 2-5 buildable projects per profession | On Hub render |
| **Jobs Radar Agent** (L18) | Links news → jobs → certs → tools → projects | On ingest |
| **Mentor Agent** (L19) | Reads profile, surfaces next 1 item, estimates ETA | On Hub render |
| **Community Moderation Agent** (L20) | Routes submissions to Pending → Approved | On submission |
| **Comparison Agent** (L21) | Renders head-to-head matrix per persona | On request |
| **Forecast Agent** (L22) | Renders 3-year per-profession trajectory | Quarterly cron + on Hub render |

All agents are **rules-only** (per CLAUDE.md fail-open contract). LLM may
enhance phrasing but is never in any critical path.

---

## Signals collected (anonymised)

| Signal | Source | Per-row attributes | Stored where |
|---|---|---|---|
| Per-card 👍 / 👎 | `feedback-widget.js` | item_kind, item_id, profession_slug, sentiment | `quality_feedback` table |
| Per-card "ℹ Why this matters" expand | `chitti_news_ai.html` (frontend) | item_kind, item_id, profession_slug, expanded | sent to `/api/feedback/collect` |
| Per-card "Open at source" CTR | frontend | item_kind, item_id, profession_slug, clicked | sent to `/api/feedback/collect` |
| Classifier classification | `profession_classifier.py` | item_kind, item_id, profession_slug, confidence, matched_keywords, rule_version | `profession_relevance` table |
| Boot-time + scheduled ingest results | `streams_ingestor.py` + `courses_ingestor.py` | source_slug, fetched, inserted, error | application logs (→ Founder dashboard) |

**Never collected:**
- User profession (lives in user's localStorage only; never sent to backend)
- User device identity
- User IP (hashed at ingest per the `/api/feedback/collect` ip_hash field)
- Cross-product linking

## Pattern detection (daily cron)

| Pattern | Detection | Threshold |
|---|---|---|
| **Stuck-classifier item** | item with ≥10 👎 from the SAME profession_slug, no 👍 | flag for human review |
| **Recurring high-👍 item** | item with ≥50 👍, ≥10:1 👍/👎 | candidate for "swarm-recommended" badge |
| **Stale-source detection** | source with last_verified_at > 30 days | flag UI staleness badge (NOT YET WIRED) |
| **Low-coverage profession** | profession with < 5 items above min_confidence | promote rules-tuning task to TODO.md |
| **New-keyword pattern** | profession's 👍 items repeatedly contain a keyword NOT in registry | candidate for `intent_keywords` addition |

## Weekly validation (Sunday 09:00 IST cron)

Per [SAHAYAI_MASTER §2f](../SAHAYAI_MASTER.md#2f-swarm-intelligence--locked-2026-05-14):
1. Aggregate the week's signals into per-profession metrics.
2. Identify patterns with ≥100 confirmations.
3. Surface candidates in [chitti-founder/](../chitti-founder/) inbox.
4. Sire reviews; approves → patterns become a TODO.md entry.
5. After human-approval, push to `skills/*.md` or `data/*.json` and benchmark re-runs.

## Monthly push

Approved swarm patterns get committed:
- New profession keywords → `profession_registry.json` (with benchmark re-run)
- New sources → `courses_sources.json` or `streams_sources.json`
- Rule weight tuning → `profession_classifier.py` (with benchmark re-run)
- Each commit references the swarm pattern ID for traceability.

## Quarterly full review

Every quarter:
- Audit per-profession F1 trend over 90 days
- Audit per-source staleness + dead-link rate
- Audit per-profession 👎 hotspots → rules iteration plan
- Update PRD.md acceptance criteria with quarterly targets

## Cross-Chitti swarm (the platform layer)

This product's swarm is anonymous-aggregated INSIDE its own DB (one DB per Chitti per [SAHAYAI §2 row 2](../SAHAYAI_MASTER.md#2-locked-decisions--do-not-relitigate)).

The cross-Chitti swarm (chitti-news-ai learning from chitti-news, chitti-medupi, etc.) flows through [chitti-founder/](../chitti-founder/) which:
- Reads `quality_feedback` from every Chitti via the Turso libsql URL per-Chitti env var
- Computes cross-product patterns (e.g. "users who say 👎 on AI medical news also say 👎 on AI legal news")
- Surfaces in the founder dashboard
- Never exposes one user's data to another product

## Hard rules (locked)

| Rule | Status |
|---|---|
| Anonymised before any cross-product analysis | ✅ enforced at ingest (ip_hash, no device_id) |
| User owns their data | ✅ `Chitti.forget()` wipes everything |
| Patterns require ≥100 confirmations before influencing rules | ⚠️ threshold defined, gating not yet automated |
| HIGH-risk Chittis (Legal/CA/Medical) require human-review approval before swarm-driven rule changes | N/A for chitti-news-ai (not in that risk class) |
| Locked decisions never learnable | ✅ — Swarm cannot change the v0.3 doctrine, the 13-profession registry shape, or the fail-open contract |

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
