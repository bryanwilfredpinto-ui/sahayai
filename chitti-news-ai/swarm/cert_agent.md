# Agent 2 — Certification Agent

> Per COSDF L6 (lines 284-288). Returns verified certifications for the user's mapped role.
> FREE-first by hard constraint. Rules-only catalog lookup.

---

## Purpose

Given the Role Mapping Agent's output, return a list of REAL, verified certifications for that profession. Never invent, never recommend a paid cert without surfacing the FREE alternative first.

---

## Input

```json
{
  "role_normalised": "accountant",
  "primary_domain": "finance",
  "lang": "en",
  "free_only": false
}
```

The `free_only` flag is read from `profile.preferences.free_only`. When true, paid certs are filtered out entirely.

---

## Output

```json
{
  "certifications": [
    {
      "title": "AI for Finance",
      "issuer": "Coursera (Wharton Online)",
      "url": "https://www.coursera.org/learn/ai-for-finance",
      "is_free": true,
      "free_mode": "audit",
      "duration_hours": 20,
      "difficulty": "intermediate",
      "verified_at": "2026-05-30",
      "source": "official_domain:coursera.org"
    },
    {
      "title": "Accounting Automation Certificate",
      "issuer": "AICPA",
      "url": "https://www.aicpa.org/...",
      "is_free": false,
      "price": "USD 49",
      "duration_hours": 10,
      "difficulty": "beginner",
      "verified_at": "2026-05-30"
    }
  ],
  "free_count": 1,
  "paid_count": 1,
  "honest_note": null
}
```

When the catalog has zero certs for the mapped role, `honest_note = "No verified certifications found for 'X'. Showing adjacent domain options instead."`

---

## Rules

1. **FREE-first ordering** — sort `is_free=true` before `is_free=false`, then by `verified_at DESC`.
2. **Source allowlist** — the cert's URL host MUST match the issuer's `official_domain` (e.g. AICPA cert must be on `aicpa.org`). Trust Agent (Agent 7) re-verifies.
3. **Verified-real only** — every entry was added by a human curator or promoted via Community Intelligence with Trust Agent approval. No LLM-generated entries.
4. **Difficulty required** — beginner / intermediate / advanced. Catalog entries missing difficulty are filtered out.
5. **No "guaranteed" language** — entries that contain "guaranteed", "double salary", "₹X LPA assured" are rejected at ingest time.

---

## Catalog source

- `backend/services/courses_ingestor.py` reads `data/certifications_catalog.json` (hand-curated).
- 172 verified entries across 6 sections (per the Coach Picks library).
- Updated weekly via the `streams_refresh` APScheduler job.
- Broken-link detection runs nightly (see [`../observability/logs.md`](../observability/logs.md)).

---

## FREE-mode taxonomy

| Mode | Meaning |
|---|---|
| `audit` | Free to take; certificate is paid (e.g. Coursera audit). |
| `fully_free` | Free including certificate (e.g. Anthropic Skilljar). |
| `free_trial` | Free for a limited period (e.g. 30-day trial). |
| `free_for_students` | Free with .edu email. |

---

## Failure mode

| Failure | Behavior |
|---|---|
| Catalog file missing | Empty list; honest_note returned; Trust Agent flags RED to /health. |
| All certs for role are paid | Honest_note: *"No FREE certs found for this role. Showing paid options with FREE adjacent-domain alternatives."* |
| Broken URL detected | Cert removed from response; logged for monthly cleanup. |

---

## Test

`backend/tests/test_feed_endpoints.py::test_cert_agent_free_first` asserts:
- For each of the 13 hardcoded hubs, the first cert in the response has `is_free=true` when ≥ 1 FREE cert exists.
- For garbage role, response is empty + `honest_note` set.
- No URL on the deny-list ever appears in output.

---

Last reviewed: 2026-06-06
