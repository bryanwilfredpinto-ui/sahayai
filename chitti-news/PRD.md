# Chitti News — Product Requirements (PRD)

**Version:** v1.x (post-2026-06-02 language-coverage fix) · **Status:** Production LIVE; PRD parity audit complete by Chitti News AI CTO 2026-06-03.

Cross-references: [ROLE.md](ROLE.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md) · [PERSONAS.md](PERSONAS.md) · [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md).

---

## 1. Functional requirements

### FR-1 — State-aware multi-language news feed
**FR-1.1** `GET /api/news/feed?state=<code>&language=<code>&category=<slug>&n=<int>` returns ranked articles for that slice.
**FR-1.2** Response carries a `coverage` payload: `{available_categories, per_category, total_in_language, english_fallback_count}` so the UI can narrate gaps honestly.
**FR-1.3** State-first routing: when a user is in Maharashtra, Maharashtra-state stories outrank national in the state-category view.
**FR-1.4** **Verified live** 2026-06-03: `state=mh&language=mr&category=national` returned 30 items with full coverage payload (2,151 mr items across 6 categories).

### FR-2 — Multi-language publisher coverage
**FR-2.1** Current: ≥10 publishers for en + hi; 1-5 publishers for bn, te, ta, mr, kn, ml, gu, pa, or.
**FR-2.2** Cloudscraper-fallback ingest (`news_ingest._http_get`) for Cloudflare-protected publishers (Saamana, Prajavani, Rozana Spokesman) — was a 2026-06-02 fix.
**FR-2.3** `json+`-prefixed `rss_url` routes to per-slug `data/json_configs/<slug>.json` for app-API publishers.
**FR-2.4** Source seed idempotent UPSERT (was empty-only; bug fixed 2026-06-02 in `news_seed`).

### FR-3 — Per-category sub-agents
| Sub-agent | Skill folder |
|---|---|
| Politics | [skills/chitti-news-politics/](skills/chitti-news-politics/) — hard neutrality, equal coverage across parties |
| Business | [skills/chitti-news-business/](skills/chitti-news-business/) — Sensex/Nifty/RBI/GST context |
| Sports | [skills/chitti-news-sports/](skills/chitti-news-sports/) — cricket-first India focus |
| Entertainment | [skills/chitti-news-entertainment/](skills/chitti-news-entertainment/) — tasteful, no gossip |
| Tech | [skills/chitti-news-tech/](skills/chitti-news-tech/) — Indian startups + global AI |
| Fact-check | [skills/chitti-news-factcheck/](skills/chitti-news-factcheck/) — verdict on cross-reference |
| Summarizer | [skills/chitti-news-summarizer/](skills/chitti-news-summarizer/) — "Chitti's Take" 3-bullet |

### FR-4 — Content-based reclassifier
**FR-4.1** Articles classified by content not just by publisher's RSS feed name (so a FIFA story on Amazon Business RSS gets tagged Sports, not Business — see [`fix(chitti-news): context-check classifier so FIFA-in-Amazon-Prime-Day stays business`](../) commit history).
**FR-4.2** `/admin/reclassify` endpoint runs paginated re-classification with per-batch commit (so a long reclass can resume).

### FR-5 — "Chitti's Take" 3-bullet summary
**FR-5.1** Every article carries a 3-bullet summary in the user's chosen language (CNA Singapore FAST button inspired).
**FR-5.2** **Honest mode** — if the article body lacks substance, the summary returns the title + an honest empty-third-bullet.
**FR-5.3** Speaker reads the FULL RSS body (content:encoded) via Voice Factory cascade, not just the headline.

### FR-6 — Fact-check verdicts
**FR-6.1** Verdict on every article: `verified` / `partial` / `disputed` / `unverified`.
**FR-6.2** ≥2 trusted source corroboration required for `verified`.
**FR-6.3** Verdict + rationale visible in <2s on the card (Trust Strip).

### FR-7 — Trust Strip (verification UX user reads in <2s)
**FR-7.1** Every card carries: verdict badge · ≥2-source corroboration count · publisher trust score · reading time.
**FR-7.2** Sticky at top of every article view.
**FR-7.3** Locked 2026-05-29 per `159ee02 feat(chitti-news): Trust Strip` commit.

### FR-8 — For You + Read Later + Cancelled folders
**FR-8.1** Per-device localStorage for: For You profile (👍/👎 → category weights) · Read Later · Cancelled (permanently mute a story).
**FR-8.2** Per-device only. Never synced to backend. `Chitti.forget()` wipes everything.
**FR-8.3** Locked 2026-05-23 per `project_chitti_news_politics_foryou_locked` memory.

### FR-9 — Politics tab (first-class)
**FR-9.1** Politics added as first-class tab 2026-05-23 with 7 RSS sources, neutrality guardrails.
**FR-9.2** No party labelling. Equal coverage. No opinion language in summaries.

### FR-10 — Voice + ISL on every response
**FR-10.1** 🔊 speaker icon on every card, reads in user's chosen language via Voice Factory cascade.
**FR-10.2** 🤟 ISL panel auto-on for users with ☑ ISL in disability profile.
**FR-10.3** 🌐 Language picker on every page (26 Voice Factory languages).

---

## 2. Non-functional requirements

### NFR-1 — Performance
| Bar | Target | Status |
|---|---|---|
| Feed query p50 latency | < 300 ms | ⚠️ untested under load |
| Frontend first-paint on 4G | < 3 s | ⚠️ untested |
| Frontend first-paint on 2G | < 12 s | ❌ untested |

### NFR-2 — Reliability
| Bar | Target | Status |
|---|---|---|
| RSS ingest survives Railway redeploy | every poll force-syncs to Turso | ✅ (post 2026-05-23 fix) |
| Empty-feed honesty | every empty response carries `coverage` payload narrating the gap | ✅ |
| Production persistence | Turso wired | ✅ (chitti-news has real DATABASE_URL) |

### NFR-3 — Accessibility (four-user contract)
| Bar | Status |
|---|---|
| 🔊 speaker per card | ✅ (inherited via `feedback-widget.js` + `data-chitti-response`) |
| 🤖 Chitti icon per card | ✅ |
| 👍 / 👎 thumbs per card | ✅ |
| ✏️ + 🎙️ widget per card | ✅ |
| 🌐 language selector | ✅ |
| ISL panel per response | ✅ (auto-on via `chitti_a11y.js`) |
| Profession-style picker | N/A (this is news, not career) |

### NFR-4 — Trust
| Bar | Status |
|---|---|
| Every article has publisher URL | ✅ |
| Trust Strip visible in <2s | ✅ (2026-05-29 commit) |
| Fact-check verdict per article | ✅ (chitti-news-factcheck sub-agent) |
| No clickbait headline rewriting | ✅ (publisher headlines preserved) |
| Per-publisher trust score | ⚠️ scored but not surfaced per-card consistently |

### NFR-5 — Language completeness
| Language | Publisher count | Status |
|---|---|---|
| en | ≥10 | ✅ |
| hi | ≥10 | ✅ |
| mr | ~5 | ✅ (Saamana via cloudscraper) |
| bn | ~3 | ⚠️ |
| ta | ~5 | ✅ |
| te | ~3 | ⚠️ |
| kn | ~3 | ⚠️ |
| ml | ~3 | ⚠️ |
| gu | ~2 | ⚠️ (Sandesh / Divya Bhaskar pending mitmproxy capture) |
| pa | ~2 | ⚠️ (Rozana Spokesman via cloudscraper) |
| or | ~1 | ❌ underserved |

### NFR-6 — Mobile
| Bar | Status |
|---|---|
| Works at 375 px | ✅ (inherits from `chitti_a11y.js`) |
| Tap targets ≥ 48×48 px | ✅ (per-card feedback-widget) |
| Real-phone cert | ⚠️ partial (last full cert pass 2026-05-27 — pre Trust Strip rollout) |

---

## 3. Out-of-scope (deferred)

- 200+ publisher coverage (currently ~50)
- Per-language publisher count ≥ 10 for every Indian state language (currently only en/hi/mr/ta)
- Push notifications (Chitti PA's domain)
- Native Android app (Chitti Vaani Android's domain)
- Per-story TTS pre-warm cache (cost decision pending)
- Live reader analytics (privacy by design — limited surface)

---

## 4. Acceptance criteria summary

| Acceptance bar | Status |
|---|---|
| AC-1 — `/api/news/feed` returns state+language+category-filtered articles | ✅ |
| AC-2 — Coverage payload narrates gaps when language thin | ✅ |
| AC-3 — Cloudflare-protected publishers ingestable | ✅ (cloudscraper fallback live) |
| AC-4 — Politics tab neutral, equal coverage, no party labelling | ✅ |
| AC-5 — Fact-check verdicts on every article | ✅ |
| AC-6 — Trust Strip visible in <2s | ✅ |
| AC-7 — "Chitti's Take" 3-bullet on every article | ✅ |
| AC-8 — For You / Read Later / Cancelled per-device | ✅ |
| AC-9 — Voice + ISL on every response | ✅ |
| AC-10 — ≥10 publishers per Indian-language state | ⚠️ partial (en/hi/mr/ta done; or/bn/te/kn/ml/gu/pa underserved) |
| AC-11 — Per-publisher trust score surfaced per-card | ⚠️ scored but not consistently rendered |
| AC-12 — Mobile cert at 375 px after Trust Strip rollout | ❌ pending refresh |

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
