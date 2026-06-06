# 02 — ARCHITECTURE REVIEW · Chitti MedUPI

**Date:** 2026-06-06 · **Build:** `f9ec517` · **Solution Architect:** Claude Code (Auto Architect, Opus 4.8 1M)
**Reference:** `chitti-medupi/ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `chitti-medupi/backend/`.

## 5.1 Architecture (4 items)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | System diagram | ✅ | Frontend `chitti_medupi.html` (GitHub Pages, served from repo root) → backend `chitti-medupi-api` (Flask on Railway) → DB (Turso libSQL via the direct-HTTPS shim per SAHAYAI_MASTER §2; see KNOWN_ISSUES #7 for the doc-reconciliation note). Substrates `chitti_a11y.js` / `feedback-widget.js` / `chitti_card_widget.js` / `chitti_lang.js` / `chitti_isl.js` auto-load on the page. Full diagram in `ARCHITECTURE.md`. |
| 2 | Data flows | ✅ | (a) **Compare**: medicine name/strip → `medupi_recognition` (DeepSeek-VL, optional) → `medupi_database.search_by_composition` (STRICT molecule+strength+form) → `medupi_pricing.annotate_savings` + `medupi_jan_aushadhi` + `medupi_risk` → response with disclaimer. (b) **Family wallet / Health File / reminders / price alerts / insurance**: per-`user_token` rows. (c) **Camera capture**: §2b six-tuple → anonymised aggregate. |
| 3 | External dependencies | ✅ | DeepSeek (LLM/vision — sole provider, honest-degrades when unfunded); Turso (DB); Voice Factory (TTS/STT via substrate); screener/NPPA/Jan-Aushadhi public data as seed. No Anthropic SDK (removed per §2). |
| 4 | Failure behaviours | ✅ | Backend-down → page renders, calls caught (edge #5). DeepSeek-down → deterministic match still works; vision honest-`unavailable`. DB-down → engine is DB-agnostic (proven on in-memory SQLite). No silent fallbacks. |

## 5.2 Scalability (4 items)

| # | Item | Status |
|---|---|---|
| 1 | 1,000 concurrent users | ✅ likely — frontend is static (GitHub Pages CDN); read-heavy compare queries are indexed lookups on a ~51-row→full-catalog table; stateless Flask scales horizontally on Railway. |
| 2 | 100,000 concurrent users | ⚠️ needs review — Railway free-tier single dyno + Turso free tier are the bottleneck; the deterministic engine itself is cheap (no per-request LLM in the critical path). Path: cache compare results (composition key is a natural cache key), scale dynos, Turso paid tier. |
| 3 | What breaks first | Documented — the LLM vision path (paid, rate-limited) and the Railway free dyno idle/restart; NOT the deterministic same-composition engine. |
| 4 | Scaling recommendations | ✅ — (a) edge-cache the composition→alternatives map (immutable per catalog version); (b) move vision to an async/queued path so it never blocks compare; (c) Turso paid tier before 100k DAU; (d) ship the §5b offline cache to shed repeat traffic. |

## 5.3 Security (6 items)

| # | Item | Status |
|---|---|---|
| 1 | No PII without consent | ✅ — per-device `user_token`; camera six-tuple anonymised before aggregation (§2b); "Chitti forget" tombstone. |
| 2 | localStorage encrypted? | N/A — non-sensitive UI state (lang, disability profile, disclaimer-ack). Health-File sensitive content is server-side per-token; `health_file_crypto.py` exists for at-rest handling. |
| 3 | Backend auth required? | ✅/N/A — public read endpoints (compare/pricing) need no auth by design (free, no sign-up); per-token write endpoints are scoped to the device token; admin endpoints gated by `ADMIN_SECRET`. |
| 4 | No API keys exposed | ✅ — DeepSeek/Turso keys are server-side env only; grep of the frontend shows no secret literals. |
| 5 | XSS tested | ✅ structural — feedback-widget escapes attrs (`escAttr`); junk-input edge #8 caused no script execution/crash. Recommend a CSP header on the host as defence-in-depth. |
| 6 | CSP/CSRF | ⚠️ recommend — add a Content-Security-Policy + standard CSRF protection on write endpoints (follow-up, not a launch blocker for read-mostly public flows). |

## 5.4 Deployment (4 items)

| # | Item | Status |
|---|---|---|
| 1 | Deployment process | ✅ — frontend = push to `main` (GitHub Pages); backend = Railway deploy (`./deploy_to_railway.sh`), `render.yaml` keeps it reconstitutable. |
| 2 | Rollback procedure | ✅ — revert commit + redeploy; DB is additive-seed/idempotent. `sop_incident_wrong_match` documents the safety rollback. |
| 3 | Env-var management | ✅ — `DATABASE_URL` (libsql form), `DEEPSEEK_API_KEY`, `ADMIN_SECRET` on Railway; honest fallback to local SQLite when unset. |
| 4 | CI/CD pipeline | ⚠️ partial — deploy script exists; no gated CI test stage running these QA harnesses automatically yet. Recommend wiring `test_medupi_samples.py` + `medupi_a11y.mjs` as a CI gate. |

## 5.5 Technical Debt

| # | Item | Priority | Effort | Status |
|---|---|---|---|---|
| 1 | Offline/service-worker cache (§5b) not wired to MedUPI | Should | ~1d | open (cross-cutting wave) |
| 2 | Slow-3G payload — 213 KB inline page; split/defer non-critical CSS/JS | Should | ~0.5d | open |
| 3 | Language re-translate walks whole DOM each switch — scope to changed subtrees | Nice | ~0.5d | open |
| 4 | Wire QA harnesses as a CI gate (sample-engine + axe) | Should | ~0.5d | open |
| 5 | Reconcile DB docs (Neon vs Turso) across chitti-medupi/*.md | Nice | ~0.25d | open |
| 6 | Add CSP/CSRF headers on the host/API | Should | ~0.5d | open |

**Architecture verdict: ✅ PASS for launch.** The core value (deterministic strict same-composition + Jan Aushadhi pricing) is LLM-independent, DB-agnostic, and scales cheaply. The open debt is performance/hardening/cross-cutting, none of it on the safety-critical path.
