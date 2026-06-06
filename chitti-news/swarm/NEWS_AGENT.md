# CNOS — News Agent

> Agent 1 of 7. *"What happened?"* — ingest + category classification.

The first agent in the swarm. It turns a raw RSS item into a CNOS article row with a trustworthy category. Nothing downstream runs until this agent has committed a row.

---

## The question it answers

> **"What happened — and which shelf does it belong on?"**

The News Agent does not opine, summarise, or re-write. It ingests the publisher's verbatim headline + body and assigns exactly one category. The headline is never edited (founder rule: *"Never re-write a headline."*).

---

## Contract

| | |
|---|---|
| **Input** | Raw RSS item (title, body/`content:encoded`, link, source slug, publish date) |
| **Single output field** | `category` (one of the curated CNOS categories; written onto the article row) |
| **Status** | ✅ live — RSS poller + deterministic content classifier |
| **Code** | [`backend/services/news_ingest.py`](../backend/services/news_ingest.py) + [`backend/services/category_classifier.py`](../backend/services/category_classifier.py) |

---

## How it works

1. **Ingest** — `news_ingest.py` polls the configured RSS sources, dedupes by normalized title + link, and stores the publisher's verbatim text.
2. **Source category as prior** — each source's declared RSS category is the starting hypothesis (e.g. NDTV `/business` → `business`).
3. **Content re-classification** — `category_classifier.py` inspects `title + summary` against a curated keyword bank per category. **No ML, no LLM, no remote call** — keyword precision + ordering.
4. **High-precision override** — the source's category is overridden **only** when the content carries unambiguous evidence of a different category. Weak signal → trust the source.
5. **Commit** — refined category written before the row is committed; a one-shot `/api/news/admin/reclassify` endpoint walks the existing corpus.

This module exists because of a real failure Sire caught 2026-06-03: clicking **Business** surfaced a cricket-schedule article (NDTV's `/business` firehose dumps cricket, weather, and ceremonies into one feed). A mis-shelved card *"alone undermines trust in the information architecture."*

---

## Targets

| Metric | Target |
|---|---|
| Category classification F1 | **≥ 0.95** |
| Source attribution F1 | ≥ 0.99 |
| Override precision (only override when sure) | high-precision by design |

---

## Failure handling

| Failure | Handling |
|---|---|
| Classifier cannot decide | Default category = `national`; flag for human review |
| Source category missing/blank | Fall back to `national` |
| Ingest fetch error | Skip item, log to observability; poller continues |

**Hard rule:** No agent failure blocks publish. A mis-classified or unclassified card still publishes under `national` and is surfaced in [`observability/`](../observability/) — never silently dropped.

---

## What it will never do

- Re-write or paraphrase a publisher headline.
- Invent a category not in the curated bank.
- Override a source's category on weak signal.
- Use an LLM in the deterministic ingest path (LLM tier, if added, slots in via `classify_with_llm()` as a borderline-row confirmation step only).

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
