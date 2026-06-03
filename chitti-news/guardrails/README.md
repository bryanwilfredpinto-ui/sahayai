# CNOS — Guardrails

Hard rules. Locked. CI-enforced where possible.

---

## NEVER

| | What | Why |
|---|---|---|
| 🚫 | Fake verification badge | Trust is the product; once broken, never recovered |
| 🚫 | Fake confidence score | Same |
| 🚫 | Hallucinate statistics | Same |
| 🚫 | Hallucinate sources | Every claim → real URL |
| 🚫 | Rewrite a publisher's headline | Publisher's voice = publisher's responsibility |
| 🚫 | Show partisan adjective in summary | Politics neutrality lock (eval: 0/100 violations 2026-06-03) |
| 🚫 | Auto-play video | Founder rule — anti-doomscroll |
| 🚫 | Hide reading time | Anti-doomscroll |
| 🚫 | Lock content behind paywall | Free, forever |
| 🚫 | Track readers off-device | Privacy by design |
| 🚫 | Translate-and-ship without a vernacular publisher | Cosmetic-vernacular = anti-pattern |
| 🚫 | Surface `verified` verdict without ≥2 source corroboration | Verification hard rule |
| 🚫 | Show "Verified" without showing WHAT verified it | Explainability |

## ALWAYS

| | What |
|---|---|
| ✅ | Show uncertainty when present |
| ✅ | Show evidence (corroborating source URLs) |
| ✅ | Show source (publisher name + URL on every card) |
| ✅ | Show reading time |
| ✅ | Respect Cancelled folder (cancelled never re-appears) |
| ✅ | Render Trust Strip in <2 s |
| ✅ | Carry `coverage` payload when feed is thin |
| ✅ | Surface stale-data flag on items > 30 days |
| ✅ | Honor `Chitti.forget()` (wipes everything for that device) |

---

## CI enforcement

| Rule | Where enforced |
|---|---|
| Politics neutrality (0 partisan adjectives per 100-article sample) | [`scripts/neutrality_eval.py`](../backend/scripts/neutrality_eval.py) — weekly |
| Cancelled-story respect | [`tools/cert_cancelled_story.mjs`](../../tools/cert_cancelled_story.mjs) — per release |
| Trust Strip render | [`tools/cert_chitti_news_v2.mjs`](../../tools/cert_chitti_news_v2.mjs) — per release |
| Coverage payload | manual smoke; auto via `coverage_sla_check.py` |
| Source attribution | structural in feed response shape |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
