# Agent 4 — Tool Agent

> Per COSDF L6 (lines 296-300). Returns AI tools relevant to the user's role,
> with use-case examples. Rules-only catalog lookup.

---

## Purpose

Given the Role Mapping output, return AI tools relevant to that profession, each with at least one concrete use-case example so the user knows *why* the tool matters.

---

## Input

```json
{
  "role_normalised": "lawyer",
  "primary_domain": "legal",
  "tools_filter": ["legal-research", "contract-review", "ediscovery"],
  "lang": "en"
}
```

---

## Output

```json
{
  "tools": [
    {
      "name": "Harvey AI",
      "url": "https://www.harvey.ai",
      "category": "legal-research",
      "use_cases": [
        "Find cases related to AI copyright infringement",
        "Summarize a 200-page contract in 2 minutes"
      ],
      "pricing_band": "enterprise",
      "is_free": false,
      "free_tier_available": false,
      "logo_url": "/logos/harvey.svg",
      "verified_at": "2026-05-30"
    },
    {
      "name": "Spellbook",
      "url": "https://www.spellbook.legal",
      "category": "contract-review",
      "use_cases": [
        "Draft a data-protection clause for a vendor contract"
      ],
      "pricing_band": "starter",
      "is_free": false,
      "free_tier_available": true,
      "free_tier_note": "7-day free trial; no credit card"
    },
    {
      "name": "Casetext CoCounsel",
      "url": "https://casetext.com",
      "category": "legal-research",
      "use_cases": [
        "Generate a memo on a recent securities ruling"
      ],
      "pricing_band": "starter",
      "is_free": false,
      "free_tier_available": true
    }
  ]
}
```

Each tool MUST have at least one use_case entry; tools without use-cases are filtered at ingest.

---

## Rules

1. **Use-case requirement** — every tool must ship with ≥ 1 concrete use-case prompt the user can copy-paste. This is the difference between "a tool list" and "a coach".
2. **FREE-tier surfaced first** — tools with `free_tier_available=true` rank before equal-relevance tools without one.
3. **Pricing band shown** — never hide cost. Bands: `fully_free`, `starter` (< $50/mo), `professional` ($50-$500/mo), `enterprise` (custom). User's choice; we don't moralize.
4. **Logo + name + URL all real** — Trust Agent re-verifies URL host matches the official domain.
5. **No hallucinated tools** — every entry came from a human curator or Community Intelligence submission with Trust Agent approval.

---

## Catalog source

- `backend/services/streams_ingestor.py` ingests the AI Tools stream and joins to `data/tools_catalog.json` for use-case enrichment.
- Coverage: 87 tools across 12 domains as of 2026-06-06.
- Updated weekly; broken-URL sweep nightly.

---

## Use-case example contract

A good use-case is:
- Specific to the profession (not "do X with AI").
- Actionable (the user could paste it into the tool today).
- ≤ 20 words.

Bad use-case example: *"Use Harvey to do legal stuff."*
Good use-case example: *"Draft a force-majeure clause for a SaaS vendor contract that complies with DPDP Act 2023."*

---

## Tool Comparison Lab integration (COSDF L21 — Phase 2)

When two tools in the response are both `category=legal-research` and both `pricing_band ∈ {starter, professional}`, the response includes a `comparison_hint`:

```json
"comparison_hint": "Compare Harvey vs CoCounsel"
```

Frontend renders a "Compare these →" link to the Comparison Lab card. Phase 2.

---

## Failure mode

| Failure | Behavior |
|---|---|
| `tools_filter` matches zero tools | Fallback to `primary_domain` filter; if still zero, honest_note: *"No verified tools found for 'X'."* |
| Tool's use_cases array is empty | Tool is filtered out at response time; logged at ingest as YELLOW. |
| Logo URL 404 | Default placeholder rendered; logged. |

---

## Test

`backend/tests/test_feed_endpoints.py::test_tool_agent_use_cases_present` asserts:
- Every tool in the response has ≥ 1 use_case.
- For each of the 13 hubs, response is non-empty.
- Logo URLs are either local `/logos/*.svg` or HTTPS on the tool's official domain.

---

Last reviewed: 2026-06-06
