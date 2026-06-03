# Chitti News — SHIP

The world-class production-readiness gate. Every row is either 🟢 or it's not shipping.

---

## SHIP gate

| # | Bar | Status | Owner | Unblock |
|---|---|:---:|---|---|
| 1 | Backend `/health` returns 200 | 🟢 | CTO | — |
| 2 | `/api/news/feed?state=X&language=Y&category=Z` returns ranked articles + coverage payload | 🟢 | CTO | — |
| 3 | Cloudflare-protected publishers ingestable (cloudscraper fallback) | 🟢 | CTO | — |
| 4 | Trust Strip on every article (verdict · corroboration · publisher trust · reading time) | 🟢 | CTO | — |
| 5 | Per-card four-user contract widgets (🔊/🤖/👍/👎/✏️🎙️) | 🟢 | CTO | inherited from `feedback-widget.js` |
| 6 | ISL panel on every response | 🟢 | CTO | inherited from `chitti_a11y.js` |
| 7 | Mobile cert at 375 px (refreshed post Trust Strip) | 🔴 | CTO | last full cert 2026-05-27; need refresh |
| 8 | Production persistence (Turso wired) | 🟢 | CTO | DATABASE_URL is real Turso |
| 9 | Per-language publisher coverage ≥10 per Indian-state official language | 🔴 | CTO | currently: en/hi/ml/ta/te/pa ≥7; mr/or/bn/kn/ur/gu below |
| 10 | Gujarati publisher coverage (app-API capture) | 🔴 | Sire | mitmproxy capture of Sandesh / Divya Bhaskar — outside CTO autonomy |
| 11 | Per-publisher trust score visible on every card | ⚠️ | CTO | scored but not consistently rendered |
| 12 | Fact-check verdict accuracy benchmark | 🔴 | CTO | 200-row hand-labelled dataset not built |
| 13 | Per-category classifier accuracy benchmark | 🔴 | CTO | dataset not built |
| 14 | Politics neutrality eval (zero partisan adjectives in summaries) | 🔴 | CTO | corpus + automated eval missing |
| 15 | Coverage SLA nightly cron + alerting | 🔴 | CTO | `scripts/coverage_sla_check.py` |
| 16 | Per-(state×language×category) coverage dashboard | 🔴 | CTO | extend chitti-founder dashboard with chitti-news cards |
| 17 | Load test: `/api/news/feed` at 200 concurrent | 🔴 | CTO | Locust script |
| 18 | Benchmark report vs MSN India / DailyHunt / Inshorts / Google News India / AltNews / BoomLive | 🔴 | CTO | 4 hours focused task |
| 19 | "Cancelled" folder respected — Playwright cert | 🔴 | CTO | frontend test |
| 20 | DAU > 100 + trust survey ≥ 0.95 | 🔴 | Sire | post-launch metric |

**Verdict: NOT SHIPPABLE as world-class.** 11 of 20 rows are 🔴 or ⚠️. The user-facing surface is genuinely good (Trust Strip, coverage payload, vernacular handling) — but the closeout (benchmark vs incumbents, per-language depth, automated guardrails) is missing.

---

## SHIP-blocking issues by category

### Sire-only blockers (2)
1. Gujarati app-API mitmproxy capture (#10)
2. DAU + survey signal (#20)

### CTO buildable in one focused session (8)
- Mobile cert refresh post Trust Strip (#7)
- Per-publisher trust score rendering audit (#11)
- Fact-check accuracy benchmark dataset (#12)
- Per-category classifier benchmark dataset (#13)
- Politics neutrality eval (#14)
- Coverage SLA cron (#15)
- Founder dashboard chitti-news cards (#16)
- Benchmark vs incumbents (#18)

### CTO buildable across multiple sessions
- Per-language publisher expansion to ≥10 for mr/or/bn/kn/ur (#9) — requires publisher discovery per language
- Cancelled-story Playwright cert (#19)
- Load test (#17)

---

## Definition of WORLD-CLASS

This product is world-class **only** when:
1. Every row above is 🟢
2. ≥200 publishers ingested with ≥10 per Indian-state official language
3. Fact-check verdict accuracy ≥ AltNews / BoomLive on the 200-row benchmark
4. Three readers from different states confirm: state-awareness > MSN India, vernacular > DailyHunt, trust > Inshorts
5. CFOS-style observability dashboard live for chitti-news

We are at **45 % world-class** today (9 / 20 rows green; foundation excellent; closeout pending).

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
