# MEMORY — Citizen Digital Twin

> The CHITTI moat: Chitti remembers everything so the citizen never re-enters it.
> **On-device only** ([guardrails/privacy.md](../guardrails/privacy.md)).

## What it stores (localStorage key `chitti_gov_twin_v1`)

```jsonc
{
  "self": {
    "name": null,                 // optional, never required
    "dob": "1979-06-01", "age": 46, "gender": "female",
    "state": "MH", "district": null, "rural": true,
    "occupation": "farmer", "income_annual": 90000,
    "category": "OBC",            // SC|ST|OBC|EWS|GEN
    "bpl": true, "secc": true,
    "landholding_acres": 1.5, "disability": null
  },
  "documents": { "aadhaar": true, "pan": false, "voter_id": true,
                 "ration": true, "abha": false, "udid": false,
                 "income_cert": false, "caste_cert": true, "land_record": true,
                 "jan_dhan": true, "eshram": false },
  "family": [ { "relation": "daughter", "dob": "...", "documents": {...} } ],
  "schemes_claimed": ["pm-kisan"],
  "deadlines": [ { "name": "PM-Kisan e-KYC", "due": "2026-07-31" } ],
  "preferences": { "language": "mr", "accessibility": ["illiterate","rural"] }
}
```

## Rules
- Populated by voice/tap; reused by every feature (Memory Agent), never re-asked.
- Drives the deterministic Eligibility, Readiness, Life-Event, Deadline engines —
  all run **offline** from this object.
- Sent to the server only as anonymised JSON for one eligibility evaluation; never
  persisted server-side.
- **"Chitti forget"** clears the key; family members removable individually.
- Stale fields (e.g. income > 12 months old) flagged for re-confirmation.
- Synced across all Chittis on the device via the shared a11y profile where overlap
  exists (language + accessibility profile).

## Family Governance extension
The `family[]` array makes the Twin a **household** twin — each member carries their
own documents/schemes/deadlines/readiness, powering the Family Governance OS (PRD F4).
