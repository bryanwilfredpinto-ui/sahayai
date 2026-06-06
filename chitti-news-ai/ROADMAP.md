# ROADMAP — Chitti News AI

> Honest split of **built · in-flight · spec'd-not-built**.
> The "spec'd-not-built" column is governed by [`COSDF.md`](COSDF.md) Levels 13-23.

---

## v0.3 — LIVE (shipped 2026-05-23 → 2026-06-06)

**Status:** ✅ in production. Curl-verified e2e on `chitti-news-ai-production-*.up.railway.app`.

### Publishers (8 RSS feeds)
- 5 LIVE: Anthropic blog, OpenAI blog, Google AI blog, MIT Tech Review AI, IndianExpress / Inc42 (Bharat AI mix).
- 3 HONEST STUBS: govt skill-india API, NPTEL feed, BIS digital-india policy feed.

### Streams (7 generic + 1 news)
1. AI Aaj — top AI news today (live)
2. Tools — AI tools surfaced from news
3. Bharat AI — India-specific stories
4. Prashikshan — courses + certs
5. Free Resources — FREE-first ranked
6. Coach Picks — 172 hand-curated entries across 6 sections
7. Skip This — community-marked low-value content
8. (sub-feed) News for ANY profession via classifier filter

### Frontend
- `chitti_news_ai.html` — 4-tab layout (AI Aaj, Tools, Bharat AI, Prashikshan).
- 🤖 Chitti icon on every card → DeepSeek explains in user's language through 9-profession jargon lens.
- Voice-First Mode auto-activated for `disability_profile.blind` or `.illiterate`.
- ISL panel attached by `chitti_a11y.js` substrate to every `[data-chitti-response]`.

### Backend
- Flask + APScheduler (`backend/main.py`).
- `rss_fetcher.py` polls 8 sources every 30 min.
- `profession_classifier.py` rules-only, F1 ≥ 0.85 / profession.
- `streams_ingestor.py` + `courses_ingestor.py` fan into `news.*` schema.
- CI gate `test_fail_open.py` boots with ALL LLM env vars stripped.

---

## v1.1 — NEW (in flight, 2026-06-05 onwards)

**Status:** 🟡 partial — `chitti_coach.js` LIVE, Hub UI being assembled.

### Profession Hub (COSDF L23) — Phase 1
- 13 hardcoded hubs being wired into `chitti_news_ai.html`: Doctor · Oncologist · Nurse · CA / Accountant · Lawyer · Teacher · Software Developer · Talent Acquisition · HR Professional · Farmer · Government Employee · Business Owner · Student.
- Each hub renders 10 sections (News / Chitti Explains / Readiness / Certs / Courses / Tools / Prompts / Projects / Jobs Radar / Mentor).
- `chitti_coach.js` already exposes `aiReadinessScore`, `aiImpactScore`, `mentorNext`, `missionThisWeek`.

### 28-Day AI Tool Tour
- `chitti_coach.js` already tracks `tour_days_done` per profile.
- 28 day-cards rendered in `chitti_news_ai.html` → tour-section.
- Mark-Done is a tap (mute-friendly); voice read-back per day (blind / illiterate friendly).

### 8 Curricula (one per profession family)
- Per-curriculum progress stored as `curric_<id>_days` in localStorage.
- Curricula: AI for Doctors · AI for CAs · AI for Lawyers · AI for Teachers · AI for HR · AI for Devs · AI for Govt · AI for Business.
- Wired through `_curriculumDoneKey` in `chitti_coach.js`.

### Layers being added (COSDF L13-L22, partial)
| Layer | Spec | Built |
|---|---|---|
| L13 — AI Impact Score™ | ✅ | 🟡 `aiImpactScore(profession)` returns numbers; per-task overrides not yet from `COSDF_IMPACT_DATA.json` |
| L14 — Chitti Explains relevance verdict | ✅ | 🟡 4 relevance bands wired in classifier; UI band not yet on every card |
| L15 — AI Readiness Score | ✅ | ✅ `aiReadinessScore(profile)` LIVE; 8-question intake live |
| L16 — Weekly Missions | ✅ | ✅ `missionThisWeek(profession, week_offset)` LIVE |
| L17 — Real-World Projects | ✅ | 🟡 project cards rendered for 13 hubs; starter repos partial |
| L18 — AI Jobs Radar | ✅ | 🔴 `jobs_radar` field not yet enriched per article |
| L19 — Chitti Mentor | ✅ | ✅ `mentorNext(profile)` returns next-1-thing |
| L20 — Community Intelligence | ✅ | 🔴 Phase 2 — submission modal stub only |
| L21 — Tool Comparison Lab | ✅ | 🔴 `COSDF_COMPARISONS.json` not yet shipped |
| L22 — Future Forecast™ | ✅ | 🔴 `COSDF_FORECASTS.json` not yet shipped |

---

## v2.0 — NEXT (spec'd, not yet built)

**Status:** 🔴 spec only — no code commits.

### Community Intelligence (COSDF L20 Phase 2)
- `/api/news-ai/community/submit` rate-limited endpoint.
- Submission types: prompt · course · tool · cert · use-case.
- Moderation queue → Trust Agent checks → "Most Useful For [Profession]" panel.
- Persistence: Turso-backed once `turso auth login` lands across the fleet.
- "Hall of Fame" credit per Voice Strategy LOCKED rule.

### Dynamic ANY-role mapping (COSDF L23 Phase 2)
- User types "Veterinarian" / "Welder" / "Pilot" → Hub auto-assembles.
- Maps domain → tools-filter → courses-filter → jobs-filter via Role Mapping Agent (see [`swarm/role_mapping_agent.md`](swarm/role_mapping_agent.md)).
- Default Impact-Score template when role not in `COSDF_IMPACT_DATA.json` — with honest "based on adjacent domain, not direct measurement" footnote.
- Unknown-role logging (Gate 7) drives prioritization of which roles graduate from Phase 2 dynamic to Phase 1 hardcoded.

### Offline + low-bandwidth mode (COSDF L12)
- Voice mode works offline.
- Last-fetched corpus cached in IndexedDB.
- Sync queue for `/api/feedback/collect` events when reconnected.

### Tool Comparison Lab (COSDF L21)
- `COSDF_COMPARISONS.json` hand-curated head-to-head matrices.
- Side-by-side cards (Harvey vs CoCounsel for Lawyers; ChatGPT vs Claude vs Gemini per role).
- Monthly refresh; "as of YYYY-MM" stamp visible.

### Future Forecast™ (COSDF L22)
- 3-year AI trajectory per profession.
- Cited from McKinsey GenAI Outlook + WEF Future of Jobs + Gartner Future of Work.
- Rendered as Forecast panel inside each Hub (7th tab).

---

## What's intentionally NOT on the roadmap

- ❌ Becoming a course marketplace (we link out; we don't sell).
- ❌ Becoming a job board (Jobs Radar surfaces signals — we don't host listings).
- ❌ Becoming a generic chatbot (DeepSeek call is scoped to "explain *this* article").
- ❌ Family-graph features (single-user product — see [`memory/family_graph.md`](memory/family_graph.md)).
- ❌ Affiliate revenue (would distort FREE-first ranking — see Founder Rule clause 2).

---

## Honesty footer

- "LIVE" = curl-verified on production, with screenshot in `tools/cert_screenshots/`.
- "in flight" = code committed; not yet fully integrated into the user-facing path.
- "spec'd, not yet built" = COSDF.md describes it; zero code.

If a section claims "LIVE" and you can't reproduce it from a fresh clone, file a bug in [`HANDOVER/04_BUG_REPORT.md`](HANDOVER/04_BUG_REPORT.md).

---

Last reviewed: 2026-06-06
