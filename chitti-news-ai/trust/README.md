# CNAIOS — Trust

> *"Trust is the primary KPI. Rules-only critical path. Every classification auditable."*

---

## Per-card Trust Strip

| Element | What it shows | Source |
|---|---|---|
| Confidence badge | HIGH-CONFIDENCE (≥ 0.85) / MEDIUM (≥ 0.6) / LOW | classifier confidence |
| FREE / PAID badge | item-level | from source manifest, verbatim |
| Provider name | "📡 Microsoft Learn · learn.microsoft.com" | source row |
| Stale flag | "⏳ Nd STALE" when ingested_at > 30d | computed |
| "ℹ Why this matters" disclosure | category + confidence% + matched_keywords + source_signals + rule_version | classifier output |

---

## Explainability contract (per card, always)

Every classified card MUST carry:

```json
{
  "classification": {
    "category": "software-developer",
    "confidence": 0.7,
    "matched_keywords": ["python", "huggingface"],
    "source_signals": ["source_default:fast-ai"],
    "rule_version": "v0.3-rules-2026-05-29"
  }
}
```

If ANY of the 5 fields is missing → CI test fails → block merge.

---

## Source allowlist enforcement

| Layer | What it checks |
|---|---|
| Ingest-time | URL contains `official_domain` (from source manifest) — else reject |
| Classifier-time | source_slug must exist in `streams_sources.json` or `courses_sources.json` |
| Feed-time | item rows missing `source_name` are dropped before render |

**Hard rule:** Never publish an item whose URL is not on the provider's own domain. Verified by `test_each_item_carries_source_attribution`.

---

## Verbatim cost label

`cost_label` field is copied **VERBATIM** from the provider's own statement. We never:
- Round / re-format prices
- Hide exam fees
- Imply "free" when source says "free study; paid exam"
- Recommend paid as the default

Example from Microsoft Learn Az-900: `"Study free; exam USD 99 (was 165)"`.

---

## Classifier-mode honesty

Every feed response carries:
- `classification_mode: "on"` when profession filter applied
- `classification_mode: "off"` when default Everyone

Users can see exactly which mode they're in.

---

## What we will never do

| | |
|---|---|
| 🚫 | Generate a course or cert that doesn't exist |
| 🚫 | Inflate confidence to push a card up the ranking |
| 🚫 | Hide matched_keywords (the audit must be visible) |
| 🚫 | Override exclude_keywords veto |
| 🚫 | Surface a job without the employer's own URL |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
