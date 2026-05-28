# Architecture — Chitti Voice Factory

## 1. High-level shape

```
                    sahayai.in (GitHub Pages)
                    ┌──────────────────────────────────────────────┐
 26 user pages  --> │  chitti_<lang>.html × 26                     │
                    │  chitti_voice_factory.html  (status dash)    │
                    │  chitti_voice_hall_of_fame.html  (winners)   │
                    │  voice_donor.html       (consent + record)   │
                    │  voice_confirmation.html  (receipt page)     │
                    └──────────────────────────────────────────────┘
                                       │ HTTPS + CORS
                                       ▼
   chitti-voice-factory-production.up.railway.app   (Flask · gunicorn · Python 3.11.10)
                    ┌──────────────────────────────────────────────┐
                    │  main.py        create_app · CORS · /  /health│
                    │  routes/voice.py  /api/voice/*                │
                    │  routes/admin.py  /admin/*  (OAuth gate)      │
                    │  router.py        cascade walker              │
                    │  ledger.py        SQLite — 5 tables           │
                    │  languages.py     26-language registry        │
                    │  config.py        env-driven Settings         │
                    │  suppliers/       on_device · bhashini ·      │
                    │                   mock_bhashini · ai4bharat · │
                    │                   sarvam                      │
                    │  services/        admin_auth · storage_service│
                    └──────────────────────────────────────────────┘
                                       │
                                       ▼
                          chitti_voice_factory.sqlite
                          (synthesis_log · donor_consents ·
                           voice_submissions · voice_winners ·
                           voice_synthesis_map)
                                       │
                                       ▼
                   external uploads → TeraBox / MEGA (stubs)
                   external TTS    → ULCA Bhashini / AI4Bharat / Sarvam
                   external auth   → GitHub OAuth or Google OAuth
```

The Voice Factory is **the only Chitti backend that other Chittis call directly
for voice**. Chitti News, MedUPI, Shares, Vaani, Government etc. all route
TTS / STT through `chitti-voice-factory-production.up.railway.app`, so the cascade and the
ledger are shared across the entire product family.

---

## 2. Backend — file by file

### 2.1 Entry point — [`backend/main.py`](backend/main.py)

- `create_app()` — builds the Flask app, configures CORS from `ALLOWED_ORIGINS`, initialises SQLite via `ledger.init_db()`, registers two blueprints (`voice_bp` and `admin_bp`).
- `GET /` — banner JSON (name, version, links to ledger / status / hall-of-fame / admin dashboard, current `use_mock_bhashini` flag).
- `GET /health` — liveness probe `{"ok": true}`.

### 2.2 Routes

| File | Blueprint | URL prefix | Purpose |
|---|---|---|---|
| [`routes/voice.py`](backend/routes/voice.py) | `voice` | `/api/voice` | TTS cascade, status, donor submission, Hall of Fame |
| [`routes/admin.py`](backend/routes/admin.py) | `admin` | `/admin` | OAuth login, list submissions, confirm winners, synthesis-map |

See [`API.md`](API.md) for every endpoint.

### 2.3 Cascade router — [`backend/router.py`](backend/router.py)

```
_SUPPLIER_ORDER = [
    OnDeviceSupplier(),
    BhashiniSupplier(),
    MockBhashiniSupplier(),
    AI4BharatSupplier(),
    SarvamSupplier(),
]
```

`synthesize(text, language_code)`:

1. Walks suppliers in order.
2. Skips suppliers where `enabled=False` or `supports(lang)=False`.
3. Calls `supplier.synthesize(...)` — gets a `SynthesisResult`.
4. **Logs every attempt** (success or failure) to `synthesis_log` with `text_sha256` (never raw text).
5. First `ok=True` wins, returns immediately.
6. If nothing supports the language → synthetic failure with `error_code=no_supplier_supports_language` (this is the Tier C path).

### 2.4 Suppliers — [`backend/suppliers/`](backend/suppliers/)

Every supplier implements the `Supplier` ABC in [`base.py`](backend/suppliers/base.py):

```python
class Supplier:
    name: str
    enabled: bool          # property or attribute
    def supports(self, language_code) -> bool: ...
    def synthesize(self, text, language_code) -> SynthesisResult: ...
```

The `SynthesisResult` dataclass carries `ok`, `supplier`, `audio_url`, `audio_bytes_count`, `client_directive`, `voice_lang_code`, `latency_ms`, `disclaimer`, `error_code`, `error_message`.

| File | Implementation status |
|---|---|
| [`on_device.py`](backend/suppliers/on_device.py) | Placeholder. `supports()` returns False for everything. Phase 10. |
| [`bhashini.py`](backend/suppliers/bhashini.py) | Full ULCA wire protocol (pipeline-config → inference). Disabled unless 3 env vars set + `VOICE_FACTORY_USE_MOCK_BHASHINI != "1"`. |
| [`mock_bhashini.py`](backend/suppliers/mock_bhashini.py) | **Active.** Returns `client_directive: speech_synthesis` so the client uses Web Speech. Covers Tier A + B, refuses Tier C. |
| [`ai4bharat.py`](backend/suppliers/ai4bharat.py) | Stub. Enabled if `AI4BHARAT_ENDPOINT` set. Returns `not_implemented`. Phase 7. |
| [`sarvam.py`](backend/suppliers/sarvam.py) | Stub. Enabled if `SARVAM_ENABLED=1` + `SARVAM_API_KEY`. Returns `not_implemented`. Phase 8. |

### 2.5 Ledger — [`backend/ledger.py`](backend/ledger.py)

SQLite via the `sqlite3` standard library. WAL mode. One module-level `threading.Lock()` around every connection because gunicorn runs 2 workers and we want serialised writes. See [`DATABASE.md`](DATABASE.md) for schema.

Key invariant: `status_for(language_code)` returns `available:true` **only** if there is at least one row in `synthesis_log` with `ok=1` and `latency_ms IS NOT NULL` in the last 24 hours. There is no other route to `available:true`.

### 2.6 Language registry — [`backend/languages.py`](backend/languages.py)

`PRIMARY_12 + COUSIN_12 = ALL_LANGUAGES` (26 total — the dataclass list literally has 26 entries despite the variable name; the "12 cousin" was the initial count when only 12 cousins existed, then expanded to 14 including Sanskrit + Tulu + Kodava + Oraon. The list is correct; the variable name is historical and could be renamed `COUSIN_14` in a future pass).

Each `Language` carries: `code`, `name_en`, `name_native`, `web_speech_code`, `tier` (`A`/`B`/`C`), `family` (`primary`/`cousin`), `bhashini_supported`, `ai4bharat_supported`.

`is_tier_c(code)` is the gate used by `/api/voice/speak` to short-circuit to the donor flow.

### 2.7 Config — [`backend/config.py`](backend/config.py)

Frozen `@dataclass Settings` built from `Settings.from_env()`. Imported as `settings` once. Drives the admin OAuth gate and audio storage selection.

### 2.8 Services

- [`services/admin_auth.py`](backend/services/admin_auth.py) — GitHub + Google OAuth code-exchange flow, in-process state cache with 10-minute TTL, `_is_admin()` check against `settings.ADMIN_EMAILS`. Uses stdlib `urllib`, no `httpx` / `requests` dependency.
- [`services/storage_service.py`](backend/services/storage_service.py) — async stubs for TeraBox + MEGA uploads. Today returns a deterministic mock URL keyed by sha256 + uuid. Real wire calls are TODOs (see [`TODO.md`](TODO.md)).

---

## 3. Voice donor flow (Phase 2)

```
[ user lands on chitti_<lang>.html with a Tier C / B language ]
              │
              │ taps "Donate my voice"
              ▼
[ voice_donor.html ?lang=<code> ]
   Stage 1: name + email + phone + 3 consent checkboxes
              │
              ▼
   Stage 2: getUserMedia → MediaRecorder → in-browser WAV blob
              │
              ▼
   Stage 3: irreversible-confirmation checkbox
              │
              │ POST /api/voice/submit
              │ { language_code, donor_name, donor_email, donor_phone,
              │   audio_base64, consent_stage1: true }
              ▼
[ voice.py · submit_voice ]
   - validate fields + language code
   - base64-decode audio (max 50 MB)
   - sha256 the bytes
   - allocate submission_id (uuid4)
   - TODO: storage_service.upload_audio_blob(...)
     (today: deterministic mock URL string)
   - ledger.create_submission(...) → voice_submissions
              │
              ▼
   redirect /voice_confirmation.html?submission_id=...
              │
              ▼
[ admin opens /admin/dashboard.html ]
   - OAuth login (GitHub or Google) → /admin/oauth/start → /admin/oauth/callback
   - GET /admin/submissions → list pending
   - GET /admin/submissions/<id> → detail + audio replay
              │
              │ POST /admin/submissions/<id>/confirm-winner
              │ { donor_photo_url: "..." }
              ▼
   ledger.confirm_winner(...)
     → INSERT into voice_winners (can_delete=0, immutable)
     → UPDATE voice_submissions SET is_winner=1
   ledger.set_synthesis_map(language_code, "winner_voice", winner_id)
              │
              ▼
[ chitti_voice_hall_of_fame.html ]
   GET /api/voice/hall-of-fame → renders grid of winner cards
```

---

## 4. Contest scoring

**There is no algorithmic scoring in v1.** Winner selection is curatorial:
the admin reviews submissions in the dashboard, listens to the audio, and
manually confirms the one that best represents the language. The `is_winner`
flag flips on `voice_submissions`; the row in `voice_winners` is permanent
(`can_delete=0`).

This is intentional. Spec §11.1 forbids fake data; an algorithmic "voice
quality score" would be smoke. A human Indian-language speaker picking the
voice is honest and scales for the volumes we expect in Phase 2 (tens to
hundreds of submissions per language, not millions).

When volume grows past human review, an algorithmic pre-filter (SNR + duration
sanity + script-match) can be added in front of the admin queue. That belongs
in [`TODO.md`](TODO.md), not in v1.

---

## 5. Hall-of-Fame storage

Winners live in two places:

1. **`voice_winners` table** — permanent record with `can_delete=0`, `donor_photo_url`, `audio_storage_url`, `audio_sha256`, `consent_stage2_accepted_at`.
2. **`voice_synthesis_map` table** — per-language pointer: `(language_code, supplier_type="winner_voice", winner_id, updated_at)`. The router will eventually consult this map to use the winner's audio for that language instead of the generic supplier cascade. (Today the router still goes to `mock_bhashini` for synthesis; integrating winner-voice playback into the cascade is on [`TODO.md`](TODO.md).)

`GET /api/voice/hall-of-fame` is public, anonymous, and returns winners grouped both by language and as a flat list. Donor email and phone are **never** in this response — only `donor_name`, `donor_photo_url`, `language_code`, `created_at`.

---

## 6. Frontend pages at repo root

| File | Purpose | Calls |
|---|---|---|
| [`../chitti_voice_factory.html`](../chitti_voice_factory.html) | Public status dashboard for all 26 languages | `GET /api/voice/status`, `GET /api/voice/languages` |
| [`../chitti_voice_hall_of_fame.html`](../chitti_voice_hall_of_fame.html) | Public winners grid | `GET /api/voice/hall-of-fame` |
| [`../voice_donor.html`](../voice_donor.html) | 3-stage consent + record + submit | `POST /api/voice/submit` |
| [`../voice_confirmation.html`](../voice_confirmation.html) | Post-submission receipt + timeline | reads `submission_id` from query |
| [`../chitti_<lang>.html` × 26](../) | Per-language front doors (Hindi, Bangla, …, Tulu, Oraon) | `GET /api/voice/honest-banner/<lang>`, `POST /api/voice/speak` |
| [`admin/dashboard.html`](admin/dashboard.html) | OAuth-gated admin UI | `GET /admin/submissions`, `POST /admin/submissions/<id>/confirm-winner`, `GET /admin/winners` |

All pages are static, deployed via GitHub Pages alongside the rest of the
Chitti family.

---

## 7. Cross-cutting

- **APScheduler:** none. The backend is fully request-driven. No background polling, no schedulers. (Other Chittis like News and Government have schedulers; Voice Factory does not.)
- **Disclaimer text:** every successful `POST /api/voice/speak` response includes a `disclaimer` field. Clients are required to render it. Frontends speak it through the same TTS pipeline so a blind user hears it.
- **SEBI banner:** not shown — Voice Factory is not a finance product. The AI-not-a-doctor / AI-not-a-lawyer banner via `chitti_disclaimer.js` is shown on every `chitti_<lang>.html` page.
- **No LLM calls.** Voice Factory is pure TTS / STT routing. See [`PROMPTS.md`](PROMPTS.md).
