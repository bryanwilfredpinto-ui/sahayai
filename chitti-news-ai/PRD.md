# Chitti News AI — Product Requirements (PRD)

**Version:** v0.3.0 (2026-05-29) · **PRD v1.1 (2026-06-05): expanded for COSDF v1.1 — 10 new features + Profession Hub architecture.**
**Status:** v0.3 doctrine LIVE; PRD v1.1 features N6-N15 spec'd; Profession Hub architecture spec'd.

Cross-references: [COSDF.md](COSDF.md) (canonical) · [ROLE.md](ROLE.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md) · [PERSONAS.md](PERSONAS.md) · [CHITTI_NEWS_AI_MASTER_SPEC.md](../CHITTI_NEWS_AI_MASTER_SPEC.md) v0.3 · [PHASE_0_BENCHMARK.md](PHASE_0_BENCHMARK.md).

---

## COSDF v1.1 Features (added 2026-06-05) — to build

| Feature | Status | COSDF Level | One-line |
|---|---|---|---|
| N6 — AI Impact Score™ (4 scores per profession) | spec'd | L13 | Disruption Risk · Adoption · Opportunity · Readiness |
| N7 — Chitti Explains relevance (per-card verdict) | spec'd | L14 | IGNORE / PAY-ATTENTION / VERY-IMPORTANT / CRITICAL per profession |
| N8 — Personal AI Readiness Score + roadmap | spec'd | L15 | 0-100 score, 12-week roadmap to 80/100 |
| N9 — Weekly Learning Missions (30 min) | spec'd | L16 | watch/read/practice/try — completion-optimised |
| N10 — Real World Projects (2-5 per profession) | spec'd | L17 | starter repos + sample demos — courses don't create careers, projects do |
| N11 — AI Jobs Radar (news → jobs → skills) | spec'd | L18 | causal chain nobody else has |
| N12 — Chitti Mentor (addictive progress) | spec'd | L19 | "you completed 2, skipped 4, AI-ready in 14 months" |
| N13 — Community Intelligence (submission flow) | spec'd | L20 | users submit prompts/courses/tools/certs → moderated → ranked |
| N14 — AI Tool Comparison Lab (Harvey vs CoCounsel etc.) | spec'd | L21 | side-by-side decisions |
| N15 — Future Forecast™ (3-year per profession) | spec'd | L22 | 2026/2027/2028 trajectory + verdict |
| **N16 — Profession Hub architecture** | spec'd | **L23** | **replace flat-tab feed with hub-per-role (10 tabs inside each hub); dynamic mapping for ANY role typed** |

---

## 1. Functional requirements

### FR-1 — Seven aggregation streams (live)
| Stream | Status |
|---|---|
| News | ✅ Live (8 RSS publishers via [rss_fetcher](backend/services/rss_fetcher.py)) |
| Courses | ✅ Live (3 622 entries; Microsoft Learn live REST + 7 manifests) |
| Certifications | ✅ Live (18 entries; Microsoft + AWS + NASSCOM + Google Cloud) |
| Tools | ✅ Live (9 entries; Hugging Face Spaces + GitHub Trending AI) |
| Jobs | ✅ Live (80+ from RemoteOK/WWR/Remotive live RSS + HN + NCS) |
| Government Schemes | ✅ Live (7 manifest; PMKVY/iGOT/Startup India/MUDRA/PM-Kisan/Stand-Up/MeitY) |
| Learning Roadmaps | ✅ Live (6 manifest; roadmap.sh + OSSU) |

**FR-1.1** Each stream is queryable at `GET /api/news-ai/feed/<stream>?profession=<slug>&n=<int>` with consistent JSON shape.
**FR-1.2** Each item carries: `id` · `title` · `url` (provider's own URL) · `source{name,domain,slug}` · `is_free` + `cost_label` (verbatim) · `classification{category, confidence, matched_keywords, source_signals, rule_version}`.
**FR-1.3** Each stream has an honest empty state when no rows match — never a fabricated entry.

### FR-2 — Profession registry (data, not code)
**FR-2.1** 13 professions seeded in [`backend/data/profession_registry.json`](backend/data/profession_registry.json) — extensible by row, not by code edit.
**FR-2.2** Each profession declares: `slug` · `label_en` · `label_hi` · `aliases` · `strong_keywords` · `intent_keywords` · `exclude_keywords` (veto).
**FR-2.3** Adding a new profession is a JSON edit + benchmark re-run, never a code deploy.

### FR-3 — Rules-only classifier (no LLM in critical path)
**FR-3.1** Classifier at [`backend/services/profession_classifier.py`](backend/services/profession_classifier.py) uses 4 signal layers: source-default tags · URL pattern matches · keyword hits · exclude-keyword veto.
**FR-3.2** Forbidden imports CI-enforced: [`test_no_llm_imports_in_classifier_critical_path`](backend/tests/test_fail_open.py) statically scans the module source.
**FR-3.3** Per-emit explainability fields: `profession_slug` · `confidence` · `matched_keywords` · `source_signals` · `rule_version`.

### FR-4 — Inline profession picker + For You view
**FR-4.1** Inline "I am a…" picker on every Chitti News AI page; default = "Everyone"; localStorage only.
**FR-4.2** **🎯 For You** tab appears when a profession is selected; renders all 7 streams filtered for that profession.
**FR-4.3** **5 per-stream tabs** (🏅 Certs · 🛠️ Tools+ · 💼 Jobs · 🏛️ Schemes · 🗺️ Roadmaps) always visible for direct browse.
**FR-4.4** Original 4-tab base (AI Aaj / Tools / Bharat AI / Prashikshan) untouched (2026-05-23 minimal-product lock).

### FR-5 — Per-card explainability
**FR-5.1** Every classified card carries an `<details>` "ℹ Why this matters" disclosure showing category + confidence% + matched keywords + source signals + rule version.
**FR-5.2** The disclosure is keyboard-navigable and ARIA-labelled.

### FR-6 — LLM enhancement layer (offline-fallback first)
**FR-6.1** `services/enhancement.py::summarise` is extractive (never LLM); pulls verbatim sentences from summary > content > title.
**FR-6.2** `services/enhancement.py::explain` tries LLM (`news_explain.py`), falls back to extractive on any failure; response carries `source: "llm"|"extractive"`.
**FR-6.3** `services/enhancement.py::career_insight` is rules-only; extracts sentences containing profession-relevant keywords.
**FR-6.4** API endpoints:
- `POST /api/news-ai/feed/<stream>/<id>/explain`
- `POST /api/news-ai/feed/<stream>/<id>/career-insight`

### FR-7 — Trust + cost contract
**FR-7.1** Every item: source provenance shown (`📡 source.name · source.domain`).
**FR-7.2** Every item: `is_free` + `cost_label` (verbatim from provider).
**FR-7.3** Items > 30 days unverified: stale-flag in UI. *(Status: ❌ NOT yet wired — see [BENCHMARKS.md](BENCHMARKS.md) gap.)*

### FR-8 — Multi-language
**FR-8.1** Picker for 26 Voice Factory languages on every page.
**FR-8.2** Item titles + provider names stay original (never translated).
**FR-8.3** Section labels + helper text translate via I18N dictionary.
**FR-8.4** Headline translation on-demand via `POST /api/news-ai/article/<id>/translate_headline`.

### FR-9 — Boot-time + scheduled ingestion
**FR-9.1** Background thread on container boot: ingest courses + 5 streams + classify everything.
**FR-9.2** APScheduler jobs: `rss_poll` (default 6h) · `streams_refresh` (6h) · `classify_sweep` (1h).
**FR-9.3** Forced Turso sync after every poll to survive Railway redeploys.

### FR-10 — Fail-open
**FR-10.1** With every LLM env var unset, every `/api/news-ai/feed/*` returns 200 with real items.
**FR-10.2** Per-card classification still works (rules-only).
**FR-10.3** 6 CI tests in [`backend/tests/test_fail_open.py`](backend/tests/test_fail_open.py).

---

## 2. Non-functional requirements

### NFR-1 — Performance
| Bar | Target | Status |
|---|---|---|
| Cold-start to first /feed response | < 60 s | ✅ |
| Steady-state /feed?profession=X p50 latency | < 200 ms | ⚠️ untested in production |
| Frontend first-paint on 4G | < 3 s | ⚠️ untested |
| Frontend first-paint on 2G | < 12 s | ❌ untested |

### NFR-2 — Reliability
| Bar | Target | Status |
|---|---|---|
| Fail-open with all LLM env vars unset | 100 % | ✅ CI-enforced |
| Boot-time ingest non-fatal failure | catches, logs, never blocks /health | ✅ |
| Production persistence across restart | survives Railway redeploy | ❌ DATABASE_URL still placeholder |

### NFR-3 — Accessibility (four-user contract)
| Bar | Status |
|---|---|
| 🔊 Speaker icon on every card (auto-read for blind) | ❌ NOT on new For You cards |
| 🤖 Chitti icon (explain in language + analogy) on every card | ❌ NOT on new For You cards |
| 👍 / 👎 thumbs on every card | ❌ NOT on new For You cards |
| ✏️ + 🎙️ widget (speak → LLM writes → reads back) | ❌ NOT on new For You cards |
| 🌐 Language selector | ✅ inherited from `chitti_a11y.js` |
| Indian Sign Language panel per response | ❌ NOT on new For You cards |
| Profession picker voice-readable | ❌ |

### NFR-4 — Trust
| Bar | Status |
|---|---|
| Every item has source URL | ✅ |
| Every classification has audit trail | ✅ |
| No fabricated content anywhere | ✅ |
| Free/paid honestly labelled | ✅ |
| Trust Strip per card (verified-by-N-sources) | ❌ not yet implemented (chitti-news has it; this product doesn't) |

### NFR-5 — Mobile
| Bar | Status |
|---|---|
| Works at 375 px | ❌ never tested |
| Tap targets ≥ 48×48 px | ❌ never measured |
| Real-phone cert | ❌ never done |

---

## 3. Out-of-scope (deferred to Phase 2)

- Live ingest for Naukri/Indeed/LinkedIn India (currently RemoteOK/WWR/Remotive only)
- Translation cache across all 26 languages (currently on-demand only)
- Stale-data flag UI (data exists, UI not built)
- Profession registry → 50 (currently 13)
- Federated swarm (see [SWARM.md](SWARM.md))
- Mobile native app
- Push notifications (Chitti PA's domain)

---

## 4. Acceptance criteria summary

| Acceptance bar | Status |
|---|---|
| AC-1 — 7 streams live via `/api/news-ai/feed/<stream>` | ✅ |
| AC-2 — Rules-only classifier passes F1 ≥ 0.85 for software-developer (Phase 0 gate) | ✅ (F1 = 0.857) |
| AC-3 — 12 of 13 professions pass F1 ≥ 0.85 | ✅ |
| AC-4 — Fail-open: 6/6 CI tests with no LLM env | ✅ |
| AC-5 — Frontend For You + 5 stream tabs live on sahayai.in | ✅ |
| AC-6 — Per-card explainability disclosure shipping | ✅ |
| AC-7 — Production persistence (Turso wired) | ❌ blocker on Sire `turso auth login` |
| AC-8 — Per-card four-user-contract widgets (🔊/🤖/👍/👎/✏️🎙️) | ❌ |
| AC-9 — Mobile cert at 375 px | ❌ |
| AC-10 — Benchmark vs Bloomberg/Coursera/Perplexity | ❌ |

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
