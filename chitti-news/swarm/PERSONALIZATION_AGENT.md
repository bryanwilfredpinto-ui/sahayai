# CNOS — Personalization Agent

> Agent 4 of 7. *"Should THIS user care?"* — state / language / profession surface ranking.

The agent that decides whether a story belongs on **your** surface. State-aware, language-aware, and — by design — privacy-first: the personal half of the algorithm runs in the browser, never on the backend.

---

## The question it answers

> **"Of everything that happened, which stories belong on THIS reader's surface — by their state, their language, their profession, and their own taps?"**

---

## Contract

| | |
|---|---|
| **Input** | Context Agent output (article + impact_oneline + affected_group) + raw article |
| **Single output field** | `relevance_score` per `(state, language, profession)` |
| **Status** | ✅ state-aware routing live; per-device For You live in browser |
| **Code** | [`backend/services/news_db.py`](../backend/services/news_db.py) — `feed()` state-aware ranking + on-device For You weights |

---

## Two halves — by design

| Half | Where it runs | What it does |
|---|---|---|
| **Server ranking** | `news_db.feed()` | State-first ordering for a `(state, language, category)` request; honest `coverage` payload narrating gaps; English-fallback CTA when a language is thin |
| **For You weights** | **localStorage only** | 👍/👎 + saved/cancelled state build a per-category weight profile that re-ranks the For You tab |

The server knows *state, language, category*. The browser knows *your taste*. The two never merge.

---

## Privacy contract — LOCKED

- **For You weights live in `localStorage` only. Never synced to the backend.**
- Read Later + Cancelled folders are also per-device, on-device only.
- This is moat #5: the algorithm runs in the browser — no tracking, no off-device profile. A defence against Google/Meta data-extraction aggregators.

---

## How server ranking works

1. Query articles for the requested `(state, language, category)`.
2. State-first ordering — a reader's state surfaces ahead of national, national ahead of unrelated states.
3. Outer-join the Verification verdict so every card carries its Trust Strip badge.
4. Emit a `coverage` payload: per-category counts, total-in-language, available categories, English-fallback count — so empty tabs are hidden honestly and a fallback CTA appears when the language is thin.

---

## Targets

| Metric | Target |
|---|---|
| Vernacular completion (pick Marathi → ≥10 mr stories per category) | ≥ 0.95 per state official language |
| State-first ordering on every state-category combo | universal |
| For You re-rank latency (in-browser) | imperceptible (< 1 frame) |

---

## Failure handling

| Failure | Handling |
|---|---|
| Personalization fails | Default ranking by publish date |
| localStorage unavailable | For You tab falls back to chronological; no error to user |
| Thin language coverage | `coverage` payload narrates the gap + offers English fallback |

**Hard rule:** No agent failure blocks publish. A ranking failure degrades to newest-first and is surfaced in [`observability/`](../observability/).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
