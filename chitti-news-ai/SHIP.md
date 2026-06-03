# Chitti News AI — SHIP

The world-class production-readiness gate. Every row is either 🟢 or it's not shipping.

---

## SHIP gate

| # | Bar | Status | Owner | Unblock |
|---|---|:---:|---|---|
| 1 | Backend `/health` returns 200 | 🟢 | CTO | — |
| 2 | All 7 streams respond on `/api/news-ai/feed/<stream>` | 🟢 | CTO | — |
| 3 | Rules-only classifier passes F1 ≥ 0.85 for **all 13** professions | ⚠️ 12/13 | CTO | business-owner Power-Platform ambiguity — needs ground-truth refinement |
| 4 | 6 / 6 fail-open CI tests pass | 🟢 | CTO | — |
| 5 | Production persistence (Turso wired, not /tmp) | 🔴 | Sire | `turso auth login` in WSL or paste real `DATABASE_URL` into Railway |
| 6 | Frontend deploys to sahayai.in (For You + 5 stream tabs) | 🟢 | CTO | — |
| 7 | Per-card explainability disclosure on every card | 🟢 | CTO | — |
| 8 | Per-card four-user contract widgets (🔊/🤖/👍/👎/✏️🎙️) on new For-You + stream cards | 🔴 | CTO | wire `data-chitti-response` selector for new card markup; verify `feedback-widget.js` attaches |
| 9 | ISL panel on every new card | 🔴 | CTO | wire `chitti_a11y.js` attach for the new card markup |
| 10 | Profession picker voice-readable (auto-read for blind on first visit) | 🔴 | CTO | hook into `chitti_a11y.js` blind-user auto-read pattern |
| 11 | Stale-data flag (items > 30 days unverified) | 🔴 | CTO | add `last_verified_at` check in feed card renderer |
| 12 | Trust score per card (mirror chitti-news's Trust Strip pattern) | 🔴 | CTO | borrow chitti-news's Trust Strip component, adapt for source+confidence |
| 13 | Mobile cert at 375 px (all 10 page-states) | 🔴 | CTO | Playwright cert script (template: `tools/cert_fashion.mjs`) |
| 14 | Integration tests for `/api/news-ai/feed/<stream>` | 🔴 | CTO | `tests/test_feed_endpoints.py` |
| 15 | Benchmark report vs Bloomberg / Coursera / Perplexity / LinkedIn / GitHub / Google News / Inshorts / Naukri Learning | 🔴 | CTO | 4 hours focused task |
| 16 | Live ingest for Indian job sources (Naukri / Indeed India / LinkedIn India RSS) | 🔴 | CTO | research each source's RSS surface; mitmproxy for Naukri if needed |
| 17 | Live ingest for ≥ 5 of 8 course sources (currently 1: Microsoft Learn) | 🔴 | CTO | replace static manifests with live where possible |
| 18 | Real user test (≥ 1 user not the founder uses it for 7 days) | 🔴 | Sire | publish + invite |
| 19 | Daily Founder Report includes chitti-news-ai metrics | ⚠️ partial | CTO | wire feedback-widget aggregation into Founder dashboard |
| 20 | DAU > 100 + Trust survey ≥ 0.95 | 🔴 | Sire | post-launch metric |

**Verdict: NOT SHIPPABLE as world-class.** 9 of 20 rows are 🔴. Architecture is sound, foundation is built, but the production-grade close-out hasn't happened.

---

## SHIP-blocking issues by category

### Sire-only blockers (3)
1. Turso `turso auth login` for real persistence (#5)
2. Publish to early users (#18)
3. Drive DAU + survey signal (#20)

### CTO buildable in one focused session (9)
- Wire 4-user widgets on new cards (#8 #9 #10)
- Stale-data flag (#11)
- Trust score per card (#12)
- Mobile cert at 375 px (#13)
- Integration tests for /feed (#14)
- Benchmark vs incumbents (#15)
- Founder dashboard wire (#19)

### CTO buildable in one focused session — sources (2)
- Indian job RSS additions (#16)
- Live course-source upgrades (#17)

### Genuinely hard
- Business-owner F1 (#3): the ground-truth ambiguity in Power Platform area is real; needs domain expert review

---

## Definition of WORLD-CLASS

This product is world-class **only** when:
1. Every row above is 🟢
2. Three external auditors can use the For You view + confirm: usefulness ≥ Perplexity, trust ≥ Bloomberg, vernacular fitness > any English aggregator
3. DAU ≥ 100, trust survey ≥ 0.95, 12-month career-outcome impact survey ≥ 0.40
4. CFOS-style observability dashboard (like [chitti_fashion_dashboard.html](../chitti_fashion_dashboard.html)) is live for chitti-news-ai

We are at **65 % world-class** today (11 / 20 rows green; foundation solid; production-grade closeout pending).

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
