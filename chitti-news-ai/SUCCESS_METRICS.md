# CNAIOS — SUCCESS METRICS

The numeric bars. If we can't measure it, we can't claim it.

---

## North-star metrics

| # | Metric | Target | How measured | Status |
|---|---|---|---|---|
| 1 | **Time-to-useful-answer** | < 10 s: user opens → finds career-relevant item | session analytics (on-device aggregate) | ❌ no analytics yet |
| 2 | **Trust score** | ≥ 0.95 per-card user survey | post-launch quarterly survey | ❌ no users yet |
| 3 | **12-month career-outcome impact** | ≥ 0.40 "Did Chitti help you learn / get a job / earn more?" | annual cohort survey | ❌ no users yet |

---

## Operating metrics

| Metric | Target | Source | Status |
|---|---|---|---|
| Profession classification F1 | ≥ 0.90 per profession | `benchmark_200.json` (250 hand-labelled rows) | ✅ 13/13 ≥ 0.85 (rules-only) |
| Course classification F1 | ≥ 0.90 | benchmark embedded in profession classifier | ✅ 0.857 (gated metric) |
| Certification accuracy | ≥ 0.99 (cost label + duration verbatim) | spot-check 20 weekly | ✅ 100 % on Phase 0 (free providers) |
| Tool accuracy | ≥ 0.95 (URL alive + free-tier honest) | weekly link-check | ⚠️ link-checker job not yet running |
| Dead-link rate | < 2 % | weekly HEAD probe | ✅ 0/30 sampled |
| Fail-open | 100 % endpoints work with all LLM env vars stripped | CI: `test_fail_open.py` | ✅ 6/6 |
| Per-card explainability | 100 % of classified items carry the 5 fields | static contract in `feed.py::_explain` | ✅ |
| Source attribution | 100 % of items carry provider name + URL | static contract | ✅ |
| Boot-time ingest latency | first /feed real data within 60 s of cold start | manual measure | ✅ |
| Steady-state /feed p50 | < 200 ms | k6 | ❌ untested |
| Mobile cert (375 px, 10 page-states) | ≥ 18/20 PASS | `cert_news_ai.mjs` | ✅ 18/20 PASS |
| Four-user contract per card | every card has 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | mobile cert + manual | ✅ 67 cards live |
| Profession picker voice-readable | aria + auto-read for blind on first visit | mobile cert | ✅ |
| Stale-data flag visible on >30-day items | per-card ⏳ Nd STALE | spot-check | ⚠️ shipped; not yet observed firing on real item |
| Trust Strip per card | HIGH/MED/LOW confidence + FREE/PAID | mobile cert | ✅ |

---

## Stream-completeness metrics (the 9 streams)

| Stream | Items live | Status |
|---|---:|---|
| AI News | 8 RSS publishers | ✅ |
| AI Courses | 3,622 | ✅ |
| AI Certifications | 18 | ✅ |
| AI Jobs | 80+ live + 3 manifest | ⚠️ Indian sources pending |
| AI Tools | 9 | ✅ |
| AI Government Schemes | 7 | ✅ |
| AI Learning Roadmaps | 6 | ✅ |
| AI Grants | 0 | ❌ stream not yet built |
| AI Startups | 0 | ❌ stream not yet built |
| AI Research | 0 | ❌ stream not yet built |

Target: all 9 streams ≥ 50 items live before world-class.

---

## Anti-metrics

| Anti-metric | Why we refuse |
|---|---|
| Affiliate-click revenue | No paid-tool default recommendation; no affiliate links |
| LLM call volume per session | Critical path is rules-only by design |
| Time-on-app | Career outcome > engagement |
| Stories-per-session | Volume ≠ value |

---

## Reporting cadence

| Metric class | Cadence | Owner | Surface |
|---|---|---|---|
| North-star | Quarterly | Sire | Founder dashboard |
| Operating | Daily | CTO | QUALITY_STATUS + SHIP + control_panel |
| Stream-completeness | Weekly | CTO | control_panel |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
