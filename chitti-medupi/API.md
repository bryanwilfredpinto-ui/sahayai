# API Reference

All endpoints implemented in [`backend/routes/medupi.py`](backend/routes/medupi.py) as a Flask Blueprint mounted at `/api/medupi`. Light auth on family-wallet / reminder / scheduler-trigger routes via the `X-User-Token` header (≥8 chars). Frontend generates a UUID per device and stores it in `localStorage`.

Base URL (live): `https://chitti-medupi-api-production.up.railway.app`

---

## Health + meta

### `GET /`
App banner.
```json
{ "app": "Chitti MedUPI API", "version": "1.7.2-flask", "status": "ok" }
```

### `GET /health`
Lightweight liveness check.
```json
{ "ok": true }
```

---

## Recognition + lookup

### `POST /api/medupi/scan`
Multipart image upload → Anthropic vision extraction + DB lookup.

**Request**
- Content-Type: `multipart/form-data`
- Field `image`: jpg / png / webp · ≤8 MB

**Response (200 — match found)**
```json
{
  "ok": true,
  "extracted": {
    "brand_name": "Crocin 650",
    "salt_composition": "paracetamol",
    "strength": "650mg",
    "dosage_form": "Tablet",
    "pack_size": "15 tabs",
    "manufacturer": "GSK",
    "expiry_date": "12/2027",
    "confidence": "high"
  },
  "primary": { "...": "Medicine row dict" },
  "matches": [ "...3 candidate rows..." ],
  "risk": { "class": "L", "symbol": "✅", "label_en": "LOW RISK", "warning_en": "...", "warning_hi": "..." },
  "alternatives": [ { "brand_name": "...", "mrp": 20.0, "jan_aushadhi_price": 8.0, "savings_pct": 60.0, "freshness_jan_aushadhi": {...} } ],
  "cheapest": { "...": "..." },
  "max_savings_pct": 70.0,
  "disclaimer_en": "...",
  "disclaimer_hi": "...",
  "speak_en": "Found 4 same-composition options. The cheapest is Jan Aushadhi Paracetamol at rupees 8...",
  "speak_hi": "समान संरचना के 4 विकल्प मिले...",
  "caption_en": "4 same-composition options · max savings 70%",
  "caption_hi": "4 समान-संरचना विकल्प · अधिकतम बचत 70%",
  "purpose_en": "Used for fever and mild pain relief.",
  "purpose_hi": "बुख़ार और हल्के दर्द के लिए।"
}
```

**Response (200 — extraction OK but no DB match)**
```json
{ "ok": false, "stub": false, "extracted": {...}, "matches": [], "risk": {...}, "message": "..." }
```

**Error codes:** `400` (no image), `413` (>8 MB), `415` (non-image content type).

---

### `GET /api/medupi/medicine/<name>`
Fuzzy brand-name lookup + same-composition alternatives + risk + speak text.

**Path:** `name` (URL-encoded brand or molecule)

**Side effect:** bumps `search_log.count` for this normalized query — drives the daily 02:00 IST top-100 Brave refresh job.

**Response (200)** — same shape as `/scan` minus `extracted`, plus `query` echo.

---

### `GET /api/medupi/alternatives`
STRICT same-composition match.

**Query params**
| Param | Required | Notes |
|---|---|---|
| `molecule` | yes | salt composition string |
| `strength` | no | e.g. "650mg" |
| `dosage_form` | no | tablet/capsule/syrup/injection/cream/... |
| `current_brand` | no | echoes into the response (not used for filtering) |

**Response (200)**
```json
{
  "ok": true,
  "query": { "molecule": "paracetamol", "strength": "650mg", "dosage_form": "Tablet", "current_brand": "Crocin" },
  "risk": {...},
  "alternatives": [...],
  "cheapest": {...},
  "max_savings_pct": 70.0,
  "disclaimer_en": "...",
  "disclaimer_hi": "...",
  "speak_en": "...",
  "speak_hi": "...",
  "caption_en": "...",
  "caption_hi": "..."
}
```

---

### `GET /api/medupi/risk/<molecule>`
Risk classification of a single molecule.

**Response (200)**
```json
{
  "molecule": "Metformin",
  "class": "H",
  "symbol": "⛔",
  "label_en": "HIGH RISK",
  "label_hi": "उच्च जोखिम",
  "warning_en": "HIGH-RISK CATEGORY: This medicine belongs to a category where substitution may impact treatment...",
  "warning_hi": "उच्च जोखिम श्रेणी: ..."
}
```

Unknown molecules default to `L` (logged server-side so the RISK_MAP can be expanded).

---

## Jan Aushadhi

### `GET /api/medupi/jan_aushadhi`
Nearby Jan Aushadhi stores via haversine.

**Query params**
| Param | Required | Default | Range |
|---|---|---|---|
| `lat` | yes | — | float |
| `lng` | yes | — | float |
| `radius_km` | no | 5.0 | 0.1–50.0 |
| `limit` | no | 10 | 1–50 |

**Response (200)**
```json
{
  "items": [
    { "store_code": "JA001", "name": "Jan Aushadhi Kendra Bhopal", "address": "...",
      "district": "Bhopal", "state": "MP", "pincode": "462001",
      "phone": "...", "hours": "...", "lat": 23.26, "lng": 77.41, "distance_km": 1.2 }
  ],
  "count": 1,
  "centre": { "lat": 23.26, "lng": 77.41 },
  "radius_km": 5.0,
  "speak_en": "1 Jan Aushadhi stores within 5.0 kilometres.",
  "speak_hi": "5 किलोमीटर के अंदर 1 जन औषधि स्टोर मिले।"
}
```

---

### `GET /api/medupi/jan_aushadhi/state`
By-state fallback when no geolocation.

**Query params:** `state` (required) · `limit` (default 50, max 200)

---

## Insurance

### `GET /api/medupi/insurance/schemes`
All schemes for the Insurance tab cards.
```json
{ "items": [ { "slug": "ayushman", "name_en": "Ayushman Bharat", "name_hi": "...", "coverage_en": "...", "coverage_hi": "..." } ] }
```

### `GET /api/medupi/insurance/<molecule>`
Coverage check by therapeutic class.

**Query params:** `scheme` (default `ayushman` · also `cghs` / `esi` / `private`)

**Response (200)**
```json
{
  "ok": true,
  "scheme": "ayushman",
  "scheme_name_en": "Ayushman Bharat",
  "scheme_name_hi": "...",
  "molecule": "Telmisartan",
  "therapeutic_class": "antihypertensive",
  "covered": true,
  "reason_en": "Telmisartan (antihypertensive) is typically covered by Ayushman Bharat...",
  "reason_hi": "...",
  "speak_en": "...",
  "speak_hi": "..."
}
```

---

## Family wallet (X-User-Token required)

### `GET /api/medupi/family/profiles`
List profiles for the calling user_token.
```json
{ "items": [ { "id": 1, "name": "Self", "relation": "self", "dob": "1985-03-01", "conditions": ["diabetes"], "created_at": "..." } ] }
```

### `POST /api/medupi/family/profile`
Add a profile.

**Body**
```json
{ "name": "Mother", "relation": "mother", "dob": "1955-08-12", "conditions": ["BP", "thyroid"] }
```
Validation: `name` required, ≤120 chars · `conditions` must be a list.

### `DELETE /api/medupi/family/profile/<profile_id>`
Delete one profile (must belong to caller's user_token). Returns `{ "ok": true }` or `404`.

### `GET /api/medupi/family/wallet`
Monthly + annual report.

**Query:** `profile_id` (optional — filters to one profile)

**Response (200)**
```json
{
  "profile_id": 1,
  "this_month_spend": 1240.00,
  "this_month_saved": 870.00,
  "last_12_months_spend": 14800.00,
  "last_12_months_saved": 9620.00,
  "annual_projection": 14880.00,
  "entries": [...],
  "speak_en": "This month you spent 1240 rupees and saved 870. Over the last 12 months you saved 9620 rupees...",
  "speak_hi": "इस माह आपने 1240 रुपये खर्च किए और 870 रुपये बचाए...",
  "caption_en": "This month: ₹1240 spent · ₹870 saved",
  "caption_hi": "इस माह: ₹1240 खर्च · ₹870 बचत"
}
```

### `POST /api/medupi/family/wallet`
Log a wallet entry.

**Body**
```json
{
  "profile_id": 1,
  "medicine_name": "Crocin 650",
  "qty": 15,
  "price_paid": 30.0,
  "cheapest_equivalent_price": 8.0,
  "salt_composition": "paracetamol"
}
```

`savings_realized` is computed server-side as `(price_paid - cheapest_equivalent_price) * qty` when both are present and `price_paid > cheapest`. Returns 404 if `profile_id` not owned by caller.

---

## Reminders (X-User-Token required)

### `GET /api/medupi/reminder`
List reminders for the caller.

**Query:** `profile_id` (optional) · `status` (default `active` · also `done` / `dismissed`)

### `POST /api/medupi/reminder`
Schedule a reminder.

**Body**
```json
{
  "profile_id": 1,
  "medicine_name": "Telmisartan 40",
  "next_due": "2026-05-12T08:00:00",
  "kind": "refill",
  "recurrence": "monthly",
  "note": "BP — morning dose"
}
```
`kind` must be one of `refill | expiry | dose | appointment` (defaults to `refill` if invalid). `next_due` is ISO-8601.

### `PATCH /api/medupi/reminder/<id>`
Update status. Body: `{ "status": "done" | "dismissed" | "active" }`.

### `DELETE /api/medupi/reminder/<id>`
Delete a reminder. `{ "ok": true }` or `404`.

---

## Real-time pharmacy prices (Brave Search · snippet-only)

### `GET /api/medupi/price/live/<name>`
Snippet-only — never visits pharmacy URLs (zero-scrape policy).

**Query:** `refresh` (bool · forces a fresh API call) · `limit` (1–12, default 6)

**Response (200 — cache hit)**
```json
{
  "ok": true,
  "query": "crocin 650",
  "source": "cache",
  "ttl_hours": 24,
  "items": [
    { "source_domain": "1mg.com", "price": 31.5, "title": "...", "snippet": "...", "url": "...", "fetched_at": "...", "expires_at": "..." }
  ]
}
```

**Response (200 — unconfigured)** when `BRAVE_SEARCH_API_KEY` is unset:
```json
{ "ok": false, "source": "unconfigured", "items": [...cached if any...], "message": "BRAVE_SEARCH_API_KEY not set — live pharmacy price fetch disabled." }
```

---

## Community-reported prices

### `POST /api/medupi/community/price` (X-User-Token required)
Report a price.

**Body**
```json
{
  "medicine_name": "Telmisartan 40",
  "price_paid": 90.0,
  "pharmacy_name": "Apollo Pharmacy",
  "city": "Bhopal",
  "state": "MP",
  "pincode": "462001",
  "lat": 23.26,
  "lng": 77.41,
  "salt_composition": "telmisartan",
  "strength": "40mg",
  "dosage_form": "Tablet"
}
```

Validation: `price_paid` must be `> 0` and within `[0.5, 100000]`. Rate-limit: max 20 reports/minute per user_token.

### `GET /api/medupi/community/price`
List reports + aggregate stats.

**Query:** `medicine_name` · `city` · `limit` (default 50, max 200)

**Response (200)**
```json
{
  "items": [...],
  "count": 12,
  "stats": {
    "count": 12,
    "median": 92.0,
    "min": 80.0,
    "max": 110.0,
    "p25": 88.0,
    "p75": 98.0,
    "latest_at": "...",
    "by_city": { "Bhopal": 7, "Indore": 5 }
  },
  "disclaimer_en": "Community prices are user-reported. Verify with the pharmacy before purchase.",
  "disclaimer_hi": "..."
}
```

Every item carries a `freshness` badge (👥 community · with EN/HI caption "Reported by user in <city> N day(s) ago").

---

## Scheduler ops

### `GET /api/medupi/scheduler/status`
Diagnostic — what's scheduled and the next run times in IST.
```json
{
  "running": true,
  "tz": "Asia/Kolkata",
  "jobs": [
    { "id": "monthly_jan_aushadhi", "next_run": "2026-06-01T03:00:00+05:30", "trigger": "cron[day=1, hour=3, minute=0]" },
    { "id": "weekly_nppa",          "next_run": "2026-05-18T04:00:00+05:30", "trigger": "cron[day_of_week=mon, hour=4, minute=0]" },
    { "id": "daily_top100_brave",   "next_run": "2026-05-12T02:00:00+05:30", "trigger": "cron[hour=2, minute=0]" },
    { "id": "cache_evict",          "next_run": "2026-05-12T02:55:00+05:30", "trigger": "cron[hour=2, minute=55]" }
  ]
}
```

### `POST /api/medupi/scheduler/trigger/<job_id>` (X-User-Token required)
Force a job to run NOW.
```json
{ "ok": true, "job_id": "weekly_nppa" }
```

---

## Error shape

Every Flask error handler returns:
```json
{ "error": "<code>", "detail": "<human-readable message>" }
```
Where `<code>` is one of `bad_request | not_found | method_not_allowed | payload_too_large | unsupported_media_type | internal_server_error`.

---

## NOT YET in this route file (per master spec §13 Phase 7)

The following endpoints are documented in the master spec as shipped in Phase 7 P1 but the route handlers are in a separate agent file (`/api/agent/medupi/ask`) or pending wiring:

- `POST /api/medupi/cart-simulator` — cheapest same-composition cart + savings
- `GET /api/medupi/jan_aushadhi/stock` — store-level stock (SKELETON)
- `GET /api/medupi/insurance-match` — coverage chip (SKELETON)
- `POST /api/medupi/ask` — agentic loop (blocked on DeepSeek HTTP 402)
