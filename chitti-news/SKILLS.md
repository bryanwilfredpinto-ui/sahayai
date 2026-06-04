# CNOS — SKILLS

The capabilities every CNOS contributor (human or agent) must master.

---

## Skill 1 — News Classification

| Category | Owner | Eval bar |
|---|---|---|
| National | content classifier | F1 ≥ 0.90 |
| Politics | [`skills/chitti-news-politics/`](skills/chitti-news-politics/) — hard neutrality | F1 ≥ 0.92 |
| Business | [`skills/chitti-news-business/`](skills/chitti-news-business/) | F1 ≥ 0.90 |
| Sports | [`skills/chitti-news-sports/`](skills/chitti-news-sports/) — cricket-first India | F1 ≥ 0.90 |
| Entertainment | [`skills/chitti-news-entertainment/`](skills/chitti-news-entertainment/) — tasteful, no gossip | F1 ≥ 0.90 |
| Technology | [`skills/chitti-news-tech/`](skills/chitti-news-tech/) | F1 ≥ 0.90 |
| World | covered by national + tech | — |
| State / Local | state-aware routing via `state` query param | per-state coverage SLA |
| Government | overlap with politics + national; PIB-sourced when possible | F1 ≥ 0.90 |
| Education / Health / Agriculture | partial coverage today; extend | — |

**Hard rule:** Content-based reclassifier MUST get the FIFA-in-Amazon-Prime-Day → Business case right (commit `7466a91`), AND Telugu-film-business-deal → Entertainment. Both in benchmark seed.

---

## Skill 2 — Fact Verification

| Sub-skill | Owner | Output |
|---|---|---|
| Cross-source matching | [`skills/chitti-news-factcheck/`](skills/chitti-news-factcheck/) | `match_count` ≥ 2 → eligible for `verified` |
| Confidence scoring | factcheck service | 0-100, surfaced on card |
| Source reputation | weekly per-publisher trust score | per-source `trust_score` **LIVE 2026-06-04** — backend `services/publisher_trust.py` loads latest snapshot; frontend `publisherTrustBadge()` renders coloured chip on every card (TRUSTED / ACCEPTABLE / QUESTIONABLE / LOW TRUST) |
| Hyperlocal handling | factcheck rationale | "single-source story — may be hyperlocal or just-breaking" |

**Hard rule:** Never assign `verified` verdict without ≥2 independent source corroboration. Single-source → `partial` at most.

---

## Skill 3 — Personalization

| Dimension | Where | Privacy |
|---|---|---|
| State | URL query + localStorage | per-device |
| Language | URL query + localStorage | per-device |
| Profession (handoff to CNAIOS) | localStorage | per-device |
| Interest history (For You) | localStorage | per-device, never synced |
| Reading history (Read Later / Cancelled) | localStorage | per-device |

**Hard rule:** Nothing leaves the user's device. `Chitti.forget()` wipes everything.

---

## Skill 4 — Trust Strip composition

| Element | Source | Render |
|---|---|---|
| Verdict badge | `factcheck.verdict` | colour-coded chip |
| Corroboration count | `factcheck.match_count` | "verified by N sources" |
| Publisher trust score | per-publisher rolling score (**LIVE 2026-06-04**) | numeric chip with band (TRUSTED ≥80 / ACCEPTABLE ≥60 / QUESTIONABLE ≥40 / LOW TRUST <40) |
| Reading time | computed from content length | "X min read" |

**Hard rule:** Trust Strip must render in <2 s. CI cert: `cert_chitti_news_v2.mjs`.

---

## Skill 5 — Coverage honesty

| When | What |
|---|---|
| Per-(state, lang, cat) returns 0 items | Embed `coverage` payload narrating per-category counts + english_fallback + tap-to-switch action |
| Per-language thin (<10 publishers) | Same payload + flag |
| Per-publisher dead-link rate >10 % | Auto-deprioritise + flag in chitti-founder dashboard |

**Hard rule:** No silent empty feed. Every empty state carries coverage payload + action to escape.

---

## Skill 6 — SOP-001 per-article enrichment contract (CNOS SOP-001 steps 4-6)

| Field | Owner | Render | Source-of-truth |
|---|---|---|---|
| `chitti_insight` | step 4 Summarizer | inline italic "Chitti's Take" line on card | `articles.chitti_insight` column, set by `news_insight` sweeper, validated for hallucinations |
| `why_this_matters` | step 5 Context Agent | "🎯 Why this matters:" line on card | `articles.why_this_matters` column **shipped 2026-06-04** per compliance audit |
| `action_plan` | step 6 Action Agent | "✅ What to do:" line on card | `articles.action_plan` column **shipped 2026-06-04** per compliance audit |

**Hard rule:** Each field renders NULL → nothing (no placeholder, no spinner). Trust over coverage.

---

## How mastery is proved

Build a 30-row hand-labelled mini-benchmark per skill, run the eval, commit the report with F1 ≥ target.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
