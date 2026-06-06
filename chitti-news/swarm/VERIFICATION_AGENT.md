# CNOS — Verification Agent

> Agent 2 of 7. *"Can we trust it?"* — cross-source matching + verdict.

The trust engine of CNOS. It cross-references one article against every other article in our DB and returns an honest verdict — never a verdict without showing what produced it.

---

## The question it answers

> **"How many independent trusted sources corroborate this story?"**

The output drives the **Trust Strip** on every card. The reader sees the verdict *and* the corroborating sources — trust is shown, never asserted.

---

## Contract

| | |
|---|---|
| **Input** | News Agent output (article + category) + the raw article |
| **Single output field** | `verdict` (+ `match_count` of distinct corroborating sources) |
| **Status** | ✅ live |
| **Code** | [`backend/services/news_factcheck.py`](../backend/services/news_factcheck.py) + [`skills/chitti-news-factcheck/`](../skills/chitti-news-factcheck/) |

---

## How it works (v1, no LLM required)

1. Normalize the article's title.
2. Find other articles in the last **48h** with high-similarity titles (`rapidfuzz token_set_ratio ≥ 70`).
3. Count **distinct trusted source slugs** that match (whitelist = slugs in `data/sources.json`).
4. Assign the verdict (below).
5. Cache in the `fact_checks` table; a re-run within **6 hours** returns the cache.

The verdict is outer-joined onto every feed card (`news_db.feed()`), so the badge is visible on the card — not hidden behind a modal-open.

---

## Verdict table

| Verdict | Condition |
|---|---|
| `verified` | ≥ **3** distinct trusted sources corroborate |
| `partial` | exactly **2** distinct sources |
| `disputed` | exactly **1** other source AND headlines diverge sharply |
| `unverified` | no cross-source signal |

---

## HARD RULES — locked

- **Never `verified` without ≥2 independent source corroboration.** (The code is stricter still: `verified` requires ≥3 distinct trusted sources; `partial` covers the 2-source case.)
- **Never show "Verified" without showing what verified it.** The corroborating source list ships with the badge — a verdict with no visible evidence does not render.
- Trust whitelist only — uncurated sources never count toward corroboration.

---

## Failure handling

| Failure | Handling |
|---|---|
| Verification times out | Verdict = `unverified`; honest narration in the Trust Strip |
| No cross-source matches yet | Verdict = `unverified` (not "false" — absence of corroboration ≠ disproof) |
| Cache miss + DB slow | Card publishes; verdict back-fills on next poll |

**Hard rule:** No agent failure blocks publish. A card with no verdict yet publishes as `unverified` and the gap is surfaced in [`observability/`](../observability/).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
