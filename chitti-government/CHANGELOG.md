# Chitti Government — Changelog

All notable changes to the `chitti-government/` product folder. Newest first.

Source: `git log --oneline -- chitti-government/` + product spec milestones
in [`../CHITTI_GOVERNMENT_MASTER_SPEC.md`](../CHITTI_GOVERNMENT_MASTER_SPEC.md).

---

## [CEOS v1.0] — 2026-06-06

Elevated from a 30-scheme directory to a full **Citizen Operating System (CEOS)** on
the chitti-fashion CEOS bar. Doctrine: rules are the product, the LLM is an enhancement.

- **CEOS doc set:** CONSTITUTION · ROLE · PRODUCT_VISION · PERSONAS · SUCCESS_METRICS ·
  PRD · EVALS · QUALITY · ROADMAP · BUILD_ORDER · RESEARCH_BEST_APPS + subfolders
  `swarm/` (10 agents) · `guardrails/` (5) · `evals/` (6 + datasets + RESULTS) ·
  `accessibility/` (4 users) · `observability/` (3) · `memory/` (Citizen Digital Twin) ·
  `skills/` (8 CEOS skills) · `sop/` (7-step citizen journey).
- **Catalog 30 → 84 schemes** across 13 categories, each with `source_url` + `status`
  (`active|closed|verify`) + `last_verified`. Merge tool: `tools/expand_government_schemes.mjs`.
- **8 features on the page:** added Citizen Readiness Score, Life-Event Engine (12
  events), Deadline Engine (confirm-gated reminders), Government Fraud Shield —
  all deterministic / offline-first; voice + icon + word labels; 26-language dropdown
  (chitti_lang.js) translates the new tabs; per-response widget on every new box.
- **Backend (deterministic, Vaani-routable):** `services/government_fraud.py`,
  `government_life_event.py`, `government_readiness.py`; routes `/fraud-check`,
  `/life-events`, `/life-event`, `/readiness`.
- **Measured:** Fraud Shield 12/12 exact (100%), 0 genuine false-positives
  ([evals/RESULTS.md](evals/RESULTS.md)); 84/84 schemes sourced; routes green.

## [Unreleased]

Open items: eligibility gold-set run, per-page Playwright/axe cert
(`tools/cert_government.mjs`), Family + Business Governance (Phase 2), Universal
Scanner camera path (funded vision key), DeepSeek verdict phrasing (funding + Vaani
relevance-rail). See [TODO.md](TODO.md) + [ROADMAP.md](ROADMAP.md).

---

## v1.0.1 — 2026-05-09 — DOB capture instead of plain age

Commit `ab8e665` · *feat(chitti-government): capture DOB (dd/mm/yyyy)
instead of plain age*.

### Added
- `_dob_to_age(dob_str)` helper in
  [`backend/routes/government.py`](backend/routes/government.py) — parses
  `dd/mm/yyyy`, `dd-mm-yyyy`, `dd.mm.yyyy`, or `ddmmyyyy` and returns
  integer age. Returns `None` on malformed input so the rule engine treats
  age as `"unknown"`.
- `_normalise_profile(profile)` — shallow-copies the inbound profile and
  derives `age` from `dob_ddmmyyyy` when only DOB is provided. Both
  `/eligibility/check` and `/eligibility/scan` call it.

### Why
Onboarding feedback: illiterate / elderly users can recite a date of birth
they've heard for 60 years more reliably than they can subtract from the
current year to give an age. The frontend now collects `dd/mm/yyyy` in the
profile modal; the backend converts on the way in so the rule engine
contract (`age:int`) stays unchanged.

### Backwards compatibility
- Callers that still pass `{age: 42, ...}` continue to work unchanged —
  `_normalise_profile` is a no-op when `age` is already set.
- Callers that pass only `{dob_ddmmyyyy: "05/01/1962", ...}` now get a
  derived `age` field on every evaluation.

---

## v1.0.0 — 2026-05-09 — Initial release

Commit `699b10c` · *feat(chitti): Chitti Government — voice-first guide to
Indian govt schemes*.

Tenth product in the Chitti family. The single commit shipped the full
v1 surface end-to-end (no "coming soon" stubs — per the
skeleton-first-pass-must-be-exhaustive guidance).

### Backend (Flask + SQLAlchemy + APScheduler)
- [`backend/main.py`](backend/main.py) — Flask app, CORS, error handlers,
  `_bootstrap()` sequence (`ensure_schema` → `create_all` → `seed_if_empty`
  → `scheduler.start`).
- [`backend/config.py`](backend/config.py) — env-driven Settings (no
  pydantic; mirrors chitti-medupi pattern).
- [`backend/database.py`](backend/database.py) — SQLAlchemy engine,
  `SessionLocal`, declarative `Base`. Auto-converts `postgres://` →
  `postgresql://`.
- [`backend/models/_schema.py`](backend/models/_schema.py) — Postgres
  schema isolation under `government.*`; no-op on SQLite.
- [`backend/models/scheme.py`](backend/models/scheme.py) — `schemes` row
  with eligibility predicates + JSON `exclusions` + `documents_required`.
- [`backend/models/pib_announcement.py`](backend/models/pib_announcement.py)
  — `pib_announcements` (deduped by GUID).
- [`backend/models/feedback.py`](backend/models/feedback.py) — anonymous
  up/down + optional 240-char note.
- [`backend/models/ingest_log.py`](backend/models/ingest_log.py) — one row
  per scheduler run.
- [`backend/data/schemes_seed.json`](backend/data/schemes_seed.json) — 30
  curated central + state schemes.
- [`backend/services/government_database.py`](backend/services/government_database.py)
  — `ensure_schema`, `seed_if_empty`, `list_schemes`, `get_by_slug`.
- [`backend/services/government_eligibility.py`](backend/services/government_eligibility.py)
  — pure-Python rule engine (`pass / fail / unknown / skip`).
- [`backend/services/government_deepseek.py`](backend/services/government_deepseek.py)
  — DeepSeek wrapper, disclaimer enforcement, deterministic fallback.
- [`backend/services/government_pib.py`](backend/services/government_pib.py)
  — 10-feed RSS poller, keyword filter, GUID dedupe, scheme matcher.
- [`backend/services/government_locator.py`](backend/services/government_locator.py)
  — Nominatim search with Google Maps fallback; 9 office kinds.
- [`backend/services/government_scheduler.py`](backend/services/government_scheduler.py)
  — APScheduler: `pib_poll` (6 h), `cleanup_old_pib` (03:00 IST),
  `heartbeat` (04:00 IST).
- [`backend/routes/government.py`](backend/routes/government.py) — full
  `/api/government/*` Blueprint (16 endpoints).

### Frontend
- [`../chitti_government.html`](../chitti_government.html) — 9-tab SPA
  (Eligibility, Schemes, Checklist, Form Helper, Alerts, Track Status,
  Locator, Documents, Profile).
- 6-button accessibility plugin + sticky disclaimer + onboarding modal.

### Infra
- [`render.yaml`](render.yaml) — Blueprint for `chitti-government-api`
  web service. Reuses chitti-shares Supabase DB; no `databases:` block.
- Entry on [`../index.html`](../index.html) home page.

### Honesty ledger established (see master spec)
- PIB RSS: live.
- MyScheme: deep-link only (no public API).
- DigiLocker: deferred (partner-only API).
- Status APIs: deep-link only (no public API).
- CSC locator: Nominatim + Google Maps fallback.

---

## Pre-v1.0.0

The chitti-government product folder did not exist before commit `699b10c`.
The umbrella Chitti spec
[`../CHITTI_TECHNICAL_MASTER_SPEC.md`](../CHITTI_TECHNICAL_MASTER_SPEC.md)
listed it as "pending — tenth product" before this release.
