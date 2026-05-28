# Chitti Government — HTTP API

Base URL (prod): `https://chitti-government-api-production.up.railway.app`
Local dev:       `http://localhost:8003`

All product endpoints live under the `/api/government` prefix and are
defined in [`backend/routes/government.py`](backend/routes/government.py).

Common response envelope:

```json
{ "ok": true, ... }
```

Error envelope (registered globally in [`backend/main.py`](backend/main.py)):

```json
{ "error": "bad_request | not_found | method_not_allowed
          | payload_too_large | unsupported_media_type
          | internal_server_error",
  "detail": "human-readable string" }
```

Upload cap: `MAX_CONTENT_LENGTH = 8 MB` (reserved for the future DigiLocker XML/PDF).

CORS: comma-split allowlist from `ALLOWED_ORIGINS`; defaults to localhost
+ `https://sahayai.in`.

---

## Top-level (root + health)

### GET `/`

Service banner + complete route map.

```json
{
  "app": "Chitti Government API",
  "version": "1.0.0",
  "status": "ok",
  "endpoints": ["GET  /health", "GET  /api/government/health", ...]
}
```

### GET `/health`

Liveness probe used by Railway. Always 200.

```json
{ "ok": true }
```

### GET `/api/government/health`

Service banner + DeepSeek configuration check.

```json
{
  "ok": true,
  "service": "chitti-government",
  "deepseek_configured": true,
  "model": "deepseek-chat",
  "disclaimer": "यह government AI है। Official source se confirm karo. Chitti government scheme guide hai, sarkari seva nahi."
}
```

---

## Catalog

### GET `/api/government/schemes`

List the curated catalog.

**Query parameters**

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `state` | string | — | Filter to a state code (e.g. `MP`). Central-level schemes are always included for the given state. |
| `category` | string | — | One of the JSON `category[]` values: `agriculture`, `health`, `insurance`, `education`, `housing`, `pension`, `disability`, `income-support`, etc. |
| `q` | string | — | Substring match across `name_en`, `name_hi`, `short_code`, `slug` (SQL `ILIKE`). |
| `limit` | int | 200 | 1–500. |

**Response**

```json
{
  "ok": true,
  "count": 30,
  "schemes": [
    {
      "id": 1, "slug": "pm-kisan", "short_code": "PM-Kisan",
      "name_en": "Pradhan Mantri Kisan Samman Nidhi",
      "name_hi": "प्रधानमंत्री किसान सम्मान निधि",
      "ministry": "Ministry of Agriculture & Farmers Welfare",
      "level": "central", "state_code": null,
      "category": ["agriculture", "income-support"],
      "benefit_amount_inr": 6000, "benefit_type": "cash",
      "benefit_summary_en": "...", "benefit_summary_hi": "...",
      "age_min": null, "age_max": null, "gender": null,
      "income_max_annual_inr": null,
      "bpl_required": null, "secc_deprivation_required": null,
      "occupation": ["farmer"],
      "landholding_min_ha": 0.01, "landholding_max_ha": null,
      "caste": [], "disability_required": null, "rural_urban": "both",
      "exclusions": ["income-tax payer", "..."],
      "eligibility_notes_en": "...", "eligibility_notes_hi": "...",
      "documents_required": ["Aadhaar","Bank passbook","..."],
      "application_url": "https://pmkisan.gov.in/RegistrationFormnew.aspx",
      "status_check_url": "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx",
      "source_url": "https://pmkisan.gov.in/",
      "helpline": "155261 / 011-24300606",
      "is_active": true,
      "last_synced_at": "2026-05-09T11:02:13.412104"
    }
  ]
}
```

### GET `/api/government/schemes/<slug>`

Single scheme detail. Returns 404 if slug is unknown.

```json
{ "ok": true, "scheme": { ... same shape as above ... } }
```

### GET `/api/government/schemes/<slug>/checklist`

Per-scheme document checklist (one entry per `documents_required[]` row).

```json
{
  "ok": true,
  "scheme_slug": "pm-kisan",
  "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
  "items": [
    { "name": "Aadhaar", "status": "pending" },
    { "name": "Bank passbook", "status": "pending" },
    { "name": "Land ownership records (khasra / khatauni)", "status": "pending" }
  ],
  "application_url": "https://pmkisan.gov.in/RegistrationFormnew.aspx",
  "helpline": "155261 / 011-24300606"
}
```

Tick state is stored in the frontend's `localStorage` only.

### GET `/api/government/schemes/<slug>/status_link`

Honest deep-link handoff to the official scheme portal. Two response
shapes depending on whether `status_check_url` is set.

**When `status_check_url` is present:**

```json
{
  "ok": true,
  "available": true,
  "scheme_slug": "pm-kisan",
  "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
  "official_url": "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx",
  "voice_handoff_en": "I will now open the official Pradhan Mantri Kisan Samman Nidhi status page. Enter your registration number or Aadhaar there. Chitti does not see those details.",
  "voice_handoff_hi": "Main प्रधानमंत्री किसान सम्मान निधि ka sarkari status page khol raha hoon. Wahaan apna registration number ya Aadhaar daaliye. Chitti ko ye details nahin dikhti.",
  "helpline": "155261 / 011-24300606"
}
```

**When the scheme has no status URL:**

```json
{
  "ok": true,
  "available": false,
  "scheme_slug": "...", "scheme_name": "...",
  "voice_handoff_en": "Application status for ... cannot be checked through Chitti yet. The official portal at ... is the only authoritative source.",
  "voice_handoff_hi": "... ke aavedan ki sthiti Chitti se nahin dikhayi ja sakti. Sarkari portal hi ekmatra sahi srot hai.",
  "official_url": "https://...", "helpline": "..."
}
```

---

## Eligibility

### POST `/api/government/eligibility/check`

Run the rule engine on a single scheme.

**Request**

```json
{
  "scheme_slug": "pm-kisan",
  "language": "hi",
  "profile": {
    "age": 42,
    "dob_ddmmyyyy": "05/01/1962",
    "gender": "m",
    "income_annual_inr": 180000,
    "bpl": false,
    "secc_deprived": false,
    "occupation": "farmer",
    "landholding_ha": 1.2,
    "caste": "OBC",
    "disability": false,
    "rural_urban": "rural",
    "state_code": "MP"
  }
}
```

Either `age` or `dob_ddmmyyyy` is enough — see
[`_dob_to_age()` and `_normalise_profile()` in routes/government.py](backend/routes/government.py).
Accepted DOB formats: `dd/mm/yyyy`, `dd-mm-yyyy`, `dd.mm.yyyy`, `ddmmyyyy`.

`language` is one of `hi | en | ta | te | bn | mr | gu | kn | ml | or | pa | ur`
(see [PROMPTS.md](PROMPTS.md)). Defaults to `hi`.

**Response**

```json
{
  "ok": true,
  "verdict": {
    "verdict": "eligible",
    "rules": [
      { "rule": "occupation", "label": "Occupation: farmer", "verdict": "pass" },
      { "rule": "landholding", "label": "Landholding ≥ 0.01 ha", "verdict": "pass" }
    ],
    "exclusions": ["income-tax payer", "..."],
    "scheme_slug": "pm-kisan", "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
    "ministry": "...",
    "documents_required": ["Aadhaar","Bank passbook","..."],
    "application_url": "https://pmkisan.gov.in/...",
    "status_check_url": "https://pmkisan.gov.in/...",
    "source_url": "https://pmkisan.gov.in/",
    "helpline": "155261 / 011-24300606",
    "benefit_summary_en": "...", "benefit_summary_hi": "...",
    "eligibility_notes_en": "...", "eligibility_notes_hi": "..."
  },
  "voice": {
    "ok": true,
    "source": "deepseek | rule_engine_fallback",
    "language": "hi",
    "reply": "Aap PM-Kisan ke liye eligible dikhte hain ... यह government AI है। ...",
    "model": "deepseek-chat",
    "tokens": { "input": 412, "output": 178 }
  }
}
```

Verdict vocabulary:

| Value | Meaning |
| --- | --- |
| `eligible` | every constrained predicate matches |
| `partial` | at least one predicate is `unknown` and none are `fail` |
| `ineligible` | at least one predicate is `fail` |
| `unknown` | the scheme has no constraints — cannot determine |

### POST `/api/government/eligibility/scan`

Run the rule engine across every scheme in the catalog (or filtered by the
profile's `state_code` if present). Returns up to 25 results sorted
`eligible → partial → unknown → ineligible`, then by `scheme_name`.

**Request**

```json
{ "profile": { ... same shape as /eligibility/check ... } }
```

**Query parameters**

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `eligible_only` | bool | `false` | If `true`, drop `ineligible` and `unknown` rows before slicing the top 25. |

**Response**

```json
{
  "ok": true,
  "count": 25,
  "total_evaluated": 30,
  "results": [ /* array of verdict objects (no voice; call /check for prose) */ ]
}
```

---

## PIB alerts

### GET `/api/government/alerts`

Recent scheme-relevant PIB announcements.

**Query parameters**

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `limit` | int | 30 | 1–100. |

**Response**

```json
{
  "ok": true,
  "count": 12,
  "items": [
    {
      "id": 487, "guid": "https://pib.gov.in/PressRelease.aspx?PRID=12345",
      "title": "Cabinet approves continuation of PM-Kisan ...",
      "title_hi": null,
      "summary": "...",
      "link": "https://pib.gov.in/PressRelease.aspx?PRID=12345",
      "ministry": "Agriculture & Farmers Welfare",
      "language": "en",
      "matched_scheme_slug": "pm-kisan",
      "published_at": "2026-05-08T16:21:00"
    }
  ]
}
```

### POST `/api/government/alerts/poll`

Force-run a PIB poll. Idempotent (GUID dedupe).

**Response**

```json
{ "ok": true, "rows_in": 247, "rows_new": 4 }
```

On error: `{ "ok": false, "error": "...", "rows_in": 0, "rows_new": 0 }`.

---

## Locator (Nominatim + Google Maps fallback)

### GET `/api/government/locator/kinds`

```json
{
  "ok": true,
  "kinds": [
    { "kind": "csc", "label": "Common Service Centre (CSC)",
      "official_locator_url": "https://locator.csccloud.in/" },
    { "kind": "post_office", "label": "Post Office", "official_locator_url": "..." },
    { "kind": "aadhaar", "label": "Aadhaar Seva Kendra", "official_locator_url": "..." },
    { "kind": "passport", "label": "Passport Seva Kendra", "official_locator_url": "..." },
    { "kind": "ration", "label": "Ration Office / FPS", "official_locator_url": "..." },
    { "kind": "jan_aushadhi", "label": "Jan Aushadhi Kendra", "official_locator_url": "..." },
    { "kind": "panchayat", "label": "Gram Panchayat / Tehsil office", "official_locator_url": null },
    { "kind": "bank", "label": "Public-sector bank branch", "official_locator_url": null },
    { "kind": "police_station", "label": "Police Station", "official_locator_url": null }
  ]
}
```

### GET `/api/government/locator`

Find offices near a coordinate.

**Query parameters**

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `kind` | string | required | One of the kinds above. |
| `lat` | float | — | Caller latitude. |
| `lng` | float | — | Caller longitude. |
| `radius_km` | float | 10.0 | Used to compute Nominatim viewbox (±`radius_km / 111°`). |

**Response**

```json
{
  "ok": true,
  "kind": "csc",
  "label": "Common Service Centre (CSC)",
  "results": [
    { "name": "Common Service Centre, Sector 14, Gurugram, ...",
      "lat": 28.4595, "lng": 77.0266,
      "city": "Gurugram", "district": "Gurugram",
      "state": "Haryana", "postcode": "122001", "country": "India" }
  ],
  "official_locator_url": "https://locator.csccloud.in/",
  "google_maps_search_url": "https://www.google.com/maps/search/?api=1&query=Common+Service+Centre&center=28.46,77.03",
  "attribution": "© OpenStreetMap contributors (Nominatim)"
}
```

`results: []` is a valid response (Nominatim returned nothing, or its egress
flapped). `google_maps_search_url` is always present so the frontend can
still offer a working handoff.

---

## Feedback

### POST `/api/government/feedback`

Anonymous up/down + optional note. No user identifier is stored.

**Request**

```json
{
  "feature": "eligibility_checker",
  "scheme_slug": "pm-kisan",
  "verdict": "up",
  "note": "Helpful, but my landholding type wasn't asked."
}
```

Allowed `feature` values:

```
eligibility_checker · alerts · locator · checklist · status_tracker
form_filler · digilocker_upload · general
```

`verdict` must be `up` or `down`. `note` is trimmed to 240 chars.

**Response**

```json
{ "ok": true }
```

### GET `/api/government/feedback/summary`

Aggregated counts per feature (operator view).

```json
{
  "ok": true,
  "by_feature": {
    "eligibility_checker": { "up": 42, "down": 3 },
    "alerts":              { "up": 11, "down": 0 },
    "locator":             { "up": 7,  "down": 1 }
  },
  "total": 64
}
```

---

## Scheduler + freshness

### GET `/api/government/scheduler/status`

```json
{
  "ok": true,
  "running": true,
  "jobs": [
    { "id": "pib_poll", "next_run_time": "2026-05-09T20:45:13+05:30", "trigger": "interval[6:00:00]" },
    { "id": "cleanup_old_pib", "next_run_time": "2026-05-10T03:00:00+05:30", "trigger": "cron[hour='3', minute='0']" },
    { "id": "heartbeat", "next_run_time": "2026-05-10T04:00:00+05:30", "trigger": "cron[hour='4', minute='0']" }
  ]
}
```

### GET `/api/government/freshness`

```json
{
  "ok": true,
  "now_utc": "2026-05-09T17:42:11.812044",
  "schemes_last_synced_at": "2026-05-09T11:02:13.412104",
  "jobs": [
    {
      "job": "pib_poll", "status": "ok",
      "rows_in": 247, "rows_new": 4,
      "started_at": "2026-05-09T17:00:01.012004",
      "finished_at": "2026-05-09T17:00:09.482103",
      "detail": null
    },
    { "job": "heartbeat", "status": "ok", "rows_in": 0, "rows_new": 0, ... }
  ]
}
```

---

## Quick `curl` smoke-test recipe

```bash
BASE=https://chitti-government-api-production.up.railway.app

curl -s "$BASE/health"
curl -s "$BASE/api/government/health"
curl -s "$BASE/api/government/schemes?limit=3"
curl -s "$BASE/api/government/schemes/pm-kisan"
curl -s "$BASE/api/government/schemes/pm-kisan/checklist"
curl -s "$BASE/api/government/schemes/pm-kisan/status_link"

curl -s -X POST "$BASE/api/government/eligibility/check" \
  -H 'Content-Type: application/json' \
  -d '{"scheme_slug":"pm-kisan","language":"hi",
       "profile":{"dob_ddmmyyyy":"05/01/1962","occupation":"farmer",
                  "landholding_ha":1.2,"rural_urban":"rural"}}'

curl -s "$BASE/api/government/alerts?limit=5"
curl -s -X POST "$BASE/api/government/alerts/poll"

curl -s "$BASE/api/government/locator/kinds"
curl -s "$BASE/api/government/locator?kind=csc&lat=28.46&lng=77.03&radius_km=10"

curl -s -X POST "$BASE/api/government/feedback" \
  -H 'Content-Type: application/json' \
  -d '{"feature":"eligibility_checker","verdict":"up","scheme_slug":"pm-kisan"}'

curl -s "$BASE/api/government/feedback/summary"
curl -s "$BASE/api/government/scheduler/status"
curl -s "$BASE/api/government/freshness"
```
