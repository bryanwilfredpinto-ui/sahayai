# Agent 7 — Trust & Quality Agent

> Per COSDF L6 (lines 315-320). The last gatekeeper before the response leaves
> the swarm. Rules-only; no LLM dependence.

---

## Purpose

Verify the merged response from Agents 1-6 passes the Trust contract:
1. Every URL resolves to a real, real-domain page.
2. FREE-first ordering is honoured.
3. No fake certs, no inflated claims, no "guaranteed job" language.
4. Every recommendation has a source link.
5. The output respects the Founder Rule.

If any check fails, the agent either (a) corrects the response in place, or (b) blocks it and emits a structured failure log.

---

## Input

```json
{
  "merged_response": { ... output of Agents 1-6 ... },
  "lang": "en"
}
```

---

## Output

```json
{
  "verified_response": { ... possibly-modified merged_response ... },
  "trust_strip": {
    "free_first_count": 7,
    "paid_count": 3,
    "url_check_passed": 10,
    "url_check_failed": 0,
    "fake_cert_blocked": 0,
    "inflated_claim_blocked": 0,
    "as_of": "2026-06-06T07:00:00Z"
  },
  "blocked_items": [],
  "warnings": []
}
```

The Trust Strip JSON is rendered as the verification footer on the user-facing card per the [Trust Strip](../../chitti-news/backend/services/news_db.py) pattern committed 2026-06-04.

---

## Checks (the entire critical path)

### 1. URL host verification
For each item with a URL, the host MUST match the item's `issuer` / `provider` / `tool_name` official_domain map. If not, the item is removed; `blocked_items` records the reason.

### 2. FREE-first ordering
For each category (`certifications`, `courses`, `tools`), the agent verifies items with `is_free=true` come before items with `is_free=false`. If not, reorders.

### 3. Fake cert detector
Three signals trigger a block:
- Title contains "guaranteed", "100% placement", "double salary", "X-figure income".
- Issuer is on the deny-list (`data/fake_issuers_denylist.json`).
- URL fails HTTP HEAD with 4xx/5xx in the nightly sweep.

### 4. Inflated-claim language scan
Regex over the prompt warnings, mentor card text, mission descriptions:
- `/guarantee[ds]?/i`, `/assured.{0,20}job/i`, `/X.figure income/i`, `/become a millionaire/i`.

Hits are stripped or downgraded; `warnings` records the action.

### 5. Source-link presence
Every recommendation (cert, course, tool, project, news, prompt) MUST have a `url` or `source` field. Items without are blocked.

### 6. Founder-Rule conformance
Sample-check 1 random item per category against:
- Universal Access — output isn't gated to a "premium" plan.
- FREE First — verified above.
- Coach > Curator — the item carries a `why-it-matters` or `use_case` field.
- Trust Over Everything — verified above.
- No Hardcoded Roles — the Role Mapping confidence is logged.

---

## Trust Strip rendering

The trust_strip object is rendered on every response card as a small verification footer:

```
✅ 10/10 links verified · 7 FREE · 3 paid · as of 2026-06-06
```

This is the < 2-second-read verification UX committed 2026-06-04 (commit 159ee02 in the chitti-news repo).

---

## Failure mode

| Failure | Behavior |
|---|---|
| URL HEAD check times out (3 s) | Item kept; flagged "unverified-since:<date>"; nightly sweep retries. |
| Fake issuer found post-publish | Item removed at next ingestion; cache invalidated; users who saw it get a corrective ARIA-live announcement on next visit. |
| Trust Strip cannot render | Card is shown without strip; logged as RED. Hard rule: a card with NO trust strip is itself a quality failure. |

---

## Test

`backend/tests/test_fail_open.py::test_trust_agent_blocks_fake_cert` asserts:
- A planted fake cert (issuer on deny-list) is blocked.
- A planted "guaranteed job" course title triggers a warning.
- A planted broken URL is removed from output.
- The trust_strip counts match the planted fixtures.

---

## Append-only audit log

Every block / warning event writes to `chitti-founder/trust_events.db`:

```
event_id · agent · item_id · check · action · timestamp · run_id
```

This feeds the weekly Trust Health report (Sun 08:00 IST per [`project_chitti_quality_v2`](../../SAHAYAI_MASTER.md)).

---

Last reviewed: 2026-06-06
