# API — Chitti Voice Factory

Base: `https://chitti-voice-factory-production.up.railway.app`
Local dev: `http://localhost:8000`

Two blueprints:

- `voice` — public TTS surface, mounted at `/api/voice/*` ([`backend/routes/voice.py`](backend/routes/voice.py))
- `admin` — OAuth-gated admin surface, mounted at `/admin/*` ([`backend/routes/admin.py`](backend/routes/admin.py))

Plus two app-level routes in [`backend/main.py`](backend/main.py).

---

## 0. App-level

### `GET /`
Banner JSON. No auth.

**Response 200**
```json
{
  "name": "chitti-voice-factory",
  "version": "2.0",
  "spec": "CHITTI_VOICE_FACTORY_MASTER_SPEC.md",
  "ledger_endpoint": "/api/voice/ledger",
  "status_endpoint": "/api/voice/status",
  "hall_of_fame": "/api/voice/hall-of-fame",
  "submit_voice": "/api/voice/submit",
  "admin_dashboard": "/admin/dashboard.html",
  "use_mock_bhashini": true
}
```

### `GET /health`
Liveness probe. No auth.

**Response 200**
```json
{"ok": true}
```

---

## 1. Voice — public

### `GET /api/voice/languages`
Returns the 26-language registry split into primary + cousin.

**Response 200**
```json
{
  "count": 26,
  "primary": [
    {"code":"hi","name_en":"Hindi","name_native":"हिन्दी","web_speech_code":"hi-IN","tier":"A","bhashini_supported":true,"ai4bharat_supported":true},
    ...
  ],
  "cousin": [
    {"code":"bho","name_en":"Bhojpuri","name_native":"भोजपुरी","web_speech_code":"hi-IN","tier":"B","bhashini_supported":false,"ai4bharat_supported":true},
    ...
  ]
}
```

### `GET /api/voice/status`
Honest status for every language. Honest means `available:true` only when there is at least one `synthesis_log` row with `ok=1` and a non-null `latency_ms` in the last 24 hours.

**Response 200**
```json
{
  "count": 26,
  "languages": {
    "hi": {
      "name_en": "Hindi", "name_native": "हिन्दी", "tier": "A",
      "available": true,
      "reason": null,
      "supplier": "mock_bhashini",
      "last_success_at": "2026-05-11 09:14:22",
      "avg_latency_ms_24h": 21,
      "calls_24h": 142,
      "ok_24h": 142
    },
    "tcy": {
      "name_en": "Tulu", "name_native": "ತುಳು", "tier": "C",
      "available": false,
      "reason": "no_successful_synthesis_in_last_24h",
      "supplier": null,
      "last_success_at": null,
      "avg_latency_ms_24h": null,
      "calls_24h": 0,
      "ok_24h": 0
    }
  },
  "suppliers": [
    {"name": "on_device",     "enabled": true},
    {"name": "bhashini",      "enabled": false},
    {"name": "mock_bhashini", "enabled": true},
    {"name": "ai4bharat",     "enabled": false},
    {"name": "sarvam",        "enabled": false}
  ]
}
```

### `GET /api/voice/status/<lang>`
Single-language detail. Same shape as a member of `/api/voice/status` plus `family`.

**Response 404** if `lang` not in registry:
```json
{"error": "unknown_language", "code": "xx"}
```

### `POST /api/voice/speak`
Synthesise. Walks the supplier cascade, logs every attempt, returns the first success.

**Request body**
```json
{
  "text": "Namaste, main Chitti hoon",
  "language": "hi"
}
```

Constraints:
- `text` required, non-empty after `.strip()`, ≤ 2000 chars.
- `language` required, must be in [`backend/languages.py`](backend/languages.py) registry.
- If the language is Tier C, **short-circuits** to the donor banner — never calls a supplier.

**Response 200 — mock_bhashini (current default, client-side TTS)**
```json
{
  "ok": true,
  "supplier": "mock_bhashini",
  "language": "hi",
  "text": "Namaste, main Chitti hoon",
  "voice_lang_code": "hi-IN",
  "client_directive": "speech_synthesis",
  "audio_url": null,
  "audio_bytes": 0,
  "latency_ms": 18,
  "disclaimer": "MOCK supplier — replaces real Bhashini once NLTM credentials are issued. Voice is your device's built-in TTS. Not a real person."
}
```

**Response 200 — real Bhashini (future)**
```json
{
  "ok": true,
  "supplier": "bhashini",
  "language": "hi",
  "text": "...",
  "voice_lang_code": "hi-IN",
  "client_directive": null,
  "audio_url": "https://cdn.../audio.mp3",
  "audio_bytes": 48312,
  "latency_ms": 612,
  "disclaimer": "Voice via Bhashini (Govt of India NLTM). Not a real person."
}
```

**Response 400 — bad input**
```json
{"ok": false, "error": "missing_text"}
{"ok": false, "error": "unknown_language", "code": "xx"}
```

**Response 413 — text too long**
```json
{"ok": false, "error": "text_too_long", "max_chars": 2000}
```

**Response 502 — supplier cascade exhausted**
```json
{
  "ok": false,
  "supplier": "bhashini",
  "language": "hi",
  "error_code": "upstream_error",
  "error_message": "ConnectionError: ..."
}
```

**Response 503 — Tier C, donor program required**
```json
{
  "ok": false,
  "supplier": null,
  "language": "tcy",
  "reason": "voice_not_available",
  "human_message_en": "Chitti is still learning Tulu. We need volunteer voice donors.",
  "human_message_native": "ಚಿಟ್ಟಿ ತುಳುನು ಕಲ್ತೊಂದುಲ್ಲೆ. ಎಂಕುಲೆಗ್ ತುಳುದ ಕಂಠದಾನಿಗ್ ಬೋಡು.",
  "donor_url": "/voice_donor.html?lang=tcy"
}
```

### `GET /api/voice/honest-banner/<lang>`
Returns the spoken status banner for a language. Three verdicts:

- `verdict:"ok"` — Tier A/B, recent successful synthesis exists.
- `verdict:"not_yet"` — Tier A/B, no synthesis in last 24 h. UI says "tap Speak to test".
- `verdict:"donor_required"` — Tier C. UI shows donor banner in English + native.

**Response 200**
```json
{
  "code": "hi",
  "verdict": "ok",
  "supplier": "mock_bhashini",
  "english": "Hindi voice is live via mock_bhashini. Average latency 21 ms over last 24 h."
}
```
```json
{
  "code": "tcy",
  "verdict": "donor_required",
  "english": "Chitti is still learning Tulu. We need volunteer voice donors.",
  "native":  "ಚಿಟ್ಟಿ ತುಳುನು ಕಲ್ತೊಂದುಲ್ಲೆ. ಎಂಕುಲೆಗ್ ತುಳುದ ಕಂಠದಾನಿಗ್ ಬೋಡು."
}
```

**Response 404** if `lang` not in registry.

### `GET /api/voice/ledger?limit=200`
Returns recent rows from `synthesis_log`. Always anonymised — `text_sha256` only, never raw text. `limit` capped at 1000.

**Response 200**
```json
{
  "count": 200,
  "rows": [
    {
      "id": 1421,
      "language_code": "hi",
      "supplier": "mock_bhashini",
      "text_sha256": "8c1e...",
      "text_chars": 24,
      "bytes_out": 0,
      "latency_ms": 18,
      "ok": 1,
      "error_code": null,
      "created_at": "2026-05-11 09:14:22"
    }
  ]
}
```

### `POST /api/voice/donate`
**v1 stub.** Full donor flow ships in Phase 9.

**Response 501**
```json
{
  "ok": false,
  "error": "donor_flow_not_yet_open",
  "message": "Voice donor flow ships in Phase 9. See spec §9."
}
```

(Real donor enrollment goes through `POST /api/voice/submit` below — `donate` is the legacy public-attribution stub from Phase 1.)

### `GET /api/voice/donations`
Public donor list (no audio, just credit). Currently always empty.

**Response 200**
```json
{"count": 0, "donors": []}
```

### `POST /api/voice/submit`
**Phase 2 — primary voice-donor submission endpoint.** Recording + Stage-1 consent.

**Request body**
```json
{
  "language_code": "bho",
  "donor_name":  "Priya",
  "donor_email": "priya@example.com",
  "donor_phone": "+91-...",
  "audio_base64": "UklGRiR...",
  "consent_stage1": true
}
```

Constraints:
- All fields required except `donor_phone`.
- `consent_stage1` must be truthy.
- `language_code` must be in the registry.
- Audio must base64-decode cleanly.
- Decoded audio ≤ 50 MB (`50 * 1024 * 1024` bytes).

**Response 201**
```json
{
  "ok": true,
  "submission_id": "f6d3c1...-uuid",
  "message": "Thank you, Priya! Your voice has been recorded.",
  "next_step": "/voice_confirmation.html?submission_id=f6d3c1..."
}
```

**Errors**
- `400 missing_required_fields`
- `400 unknown_language`
- `400 invalid_audio_encoding`
- `413 audio_too_large` (`max_bytes: 52428800`)
- `500 submission_failed`

Note: today the audio is **not** actually uploaded to TeraBox / MEGA — `storage_service` is a stub. A deterministic mock URL is written into `voice_submissions.audio_storage_url`. See [`TODO.md`](TODO.md) §2.1.

### `GET /api/voice/hall-of-fame`
Public winners. Returns both grouped-by-language and flat lists. Never includes donor email or phone.

**Response 200**
```json
{
  "ok": true,
  "total_winners": 12,
  "languages_represented": 8,
  "winners_by_language": {
    "hi": [
      {
        "winner_id": "ab12-...",
        "donor_name": "Priya",
        "donor_photo_url": "https://...",
        "language_code": "hi",
        "created_at": "2026-05-11 09:00:00"
      }
    ]
  },
  "all_winners": [ {...}, {...} ]
}
```

---

## 2. Admin — OAuth-gated

All `/admin/*` endpoints below `oauth/*` require a valid session whose `user_email` is in `ADMIN_EMAILS`. The decorator is in [`backend/routes/admin.py`](backend/routes/admin.py).

### `GET /admin/oauth/start`
Returns the URL to redirect the user to. Provider is whichever `ADMIN_OAUTH_PROVIDER` env var is set to (`github` or `google`).

**Response 200**
```json
{"ok": true, "auth_url": "https://github.com/login/oauth/authorize?client_id=..."}
```

### `GET /admin/oauth/callback?code=...&state=...`
OAuth callback. Validates state, exchanges code for user info, checks `_is_admin(user)` against `ADMIN_EMAILS`, sets `session["user_email"]`. Then returns a redirect hint.

**Response 200**
```json
{"ok": true, "redirect": "/admin/dashboard.html"}
```

**Errors**
- `400 invalid_oauth_state`
- `401 oauth_exchange_failed`
- `403 not_authorized` (email not in `ADMIN_EMAILS`)
- `500 unknown_provider`

### `GET /admin/submissions`
List up to 500 most recent voice submissions.

**Response 200**
```json
{
  "ok": true,
  "count": 23,
  "submissions": [
    {
      "submission_id": "...",
      "language_code": "bho",
      "donor_name": "Priya",
      "donor_email": "priya@...",
      "audio_storage_url": "...",
      "consent_stage1_accepted_at": "2026-05-11 09:00:00",
      "is_winner": 0,
      "created_at": "2026-05-11 09:00:00"
    }
  ]
}
```

**Errors**: `401 unauthorized` if not admin.

### `GET /admin/submissions/<submission_id>`
Single submission detail.

**Response 200**
```json
{
  "ok": true,
  "submission": {
    "submission_id": "...",
    "language_code": "bho",
    "donor_name": "Priya",
    "donor_email": "...",
    "donor_phone": "...",
    "audio_storage_url": "...",
    "audio_sha256": "...",
    "consent_stage1_accepted_at": "...",
    "is_winner": 0,
    "created_at": "..."
  }
}
```

**Errors**: `401 unauthorized`, `404 not_found`.

### `POST /admin/submissions/<submission_id>/confirm-winner`
Stage 2 — admin marks the submission as the permanent winner for its language. Idempotency check: refuses if already a winner.

**Request body**
```json
{"donor_photo_url": "https://..."}
```

Side effects:
1. INSERT into `voice_winners` with `can_delete=0`.
2. UPDATE `voice_submissions.is_winner = 1`.
3. UPSERT `voice_synthesis_map` with `(language_code, "winner_voice", winner_id)`.

**Response 201**
```json
{
  "ok": true,
  "winner_id": "...",
  "message": "Priya is now the voice of bho!"
}
```

**Errors**
- `401 unauthorized`
- `404 submission_not_found`
- `409 already_a_winner`
- `500 confirmation_failed`

### `GET /admin/winners`
All Hall of Fame winners (including `can_delete` flag, which is always `0` today).

**Response 200**
```json
{
  "ok": true,
  "count": 12,
  "winners": [
    {
      "winner_id": "...",
      "submission_id": "...",
      "language_code": "hi",
      "donor_name": "Priya",
      "donor_photo_url": "https://...",
      "can_delete": 0,
      "created_at": "..."
    }
  ]
}
```

### `GET /admin/voice-synthesis-map`
Per-language mapping of `supplier_type` + `winner_id`. Empty entries omitted.

**Response 200**
```json
{
  "ok": true,
  "count": 4,
  "synthesis_map": {
    "hi": {"supplier_type": "winner_voice", "winner_id": "...", "updated_at": "..."},
    "bho": {"supplier_type": "winner_voice", "winner_id": "...", "updated_at": "..."}
  }
}
```

---

## 3. Notes for callers

- **CORS:** the `ALLOWED_ORIGINS` env var controls who can call. In dev defaults include `localhost:5500` and `127.0.0.1:5500` for live-server.
- **No raw text in the ledger.** `synthesis_log.text_sha256` is the audit hash; you cannot reverse-engineer what users asked Chitti to say.
- **Railway free tier cold-starts.** Expect the first request after idle to take 30–60 s. Frontends must show a "Waking up Chitti…" state.
- **Mock supplier is always honestly labelled.** Every successful `/api/voice/speak` carries a `supplier` field. If you see `"supplier": "mock_bhashini"`, that is the truth — never relabel it client-side.
