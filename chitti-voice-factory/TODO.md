# TODO — Chitti Voice Factory

Outstanding work items, ranked roughly by urgency. Sources:
- `CHITTI_VOICE_FACTORY_MASTER_SPEC.md` §10 build phases + §11 non-negotiables.
- `TODO` / `FIXME` markers in code (4 in-code today).
- Memory file `feedback_verify_before_handover.md` — never claim "live" without curl-verifying production.

---

## 1. Critical — credentials + provider wiring

### 1.1 Obtain ULCA Bhashini citizen credentials (Phase 6)
- Submit ULCA application with the body draft in [`README.md`](README.md) §6 / spec §9.
- On approval, set on Railway:
  - `BHASHINI_USER_ID`
  - `BHASHINI_API_KEY`
  - `BHASHINI_INFERENCE_KEY`
  - `VOICE_FACTORY_USE_MOCK_BHASHINI=0`
- No code change required — [`backend/suppliers/bhashini.py`](backend/suppliers/bhashini.py) already implements the ULCA pipeline-config → inference call.
- **Verify before handover:** curl `POST /api/voice/speak` on production for `hi`, confirm `supplier: "bhashini"` in the response — not `mock_bhashini`.

### 1.2 Wire AI4Bharat IndicTTS / IndicParler-TTS (Phase 7)
- [`backend/suppliers/ai4bharat.py`](backend/suppliers/ai4bharat.py) is a stub. It checks `AI4BHARAT_ENDPOINT` and returns `not_implemented`.
- Decide hosting model: self-host on a small GPU box vs HuggingFace inference endpoint.
- Cover Bhojpuri, Bodo, Manipuri, Santhali, Sanskrit (Tier B where Bhashini is thin).
- Add `AI4BHARAT_API_KEY` env if HF route.

### 1.3 Wire Sarvam paid fallback (Phase 8)
- [`backend/suppliers/sarvam.py`](backend/suppliers/sarvam.py) is a stub gated on `SARVAM_ENABLED=1` + `SARVAM_API_KEY`.
- Spec §11.3: must rate-limit to 100 chars/request and only fire after free suppliers fail. Implement that limit in the supplier (not in the router) so the rule lives with the cost.
- Cost ledger: surface ₹/char in `/api/voice/ledger` rows where `supplier=sarvam`.

### 1.4 On-device IndicTTS via `onnxruntime-web` (Phase 10)
- [`backend/suppliers/on_device.py`](backend/suppliers/on_device.py) reports `supports() = False` for every language today.
- Package quantised IndicTTS ONNX models per language (~50–200 MB each).
- IndexedDB cache, `<lang>.html` "Download voice model" button → triggers download + registers with the supplier.
- Status pill must say `(local cache · 124 MB)` once a model is registered.

---

## 2. Hall of Fame — finish Phase 2

### 2.1 Wire real audio uploads (currently mocked)

Three `TODO` markers in code:

- [`backend/services/storage_service.py:39`](backend/services/storage_service.py) — `# TODO: Real TeraBox API call`
- [`backend/services/storage_service.py:50`](backend/services/storage_service.py) — `# TODO: Real MEGA API call (using mega.py or similar)`
- [`backend/services/storage_service.py:58`](backend/services/storage_service.py) — `# TODO: Implement based on provider` (in `download_winner_audio`)
- [`backend/routes/voice.py:244`](backend/routes/voice.py) — `# TODO: Upload to TeraBox/MEGA`

Today `submit_voice` allocates a deterministic mock URL (`https://chitti-internal/submissions/<uuid>`) and never calls `storage_service.upload_audio_blob`. Need to:

- Decide provider (TeraBox or MEGA) based on cost + Indian-jurisdiction storage.
- Add the call site in `submit_voice` *before* `ledger.create_submission`.
- Fail closed: if upload fails, do not create a submission row (otherwise the row points at an empty URL).

### 2.2 Hall-of-Fame audio playback in the cascade

`voice_synthesis_map[language_code]` is populated when an admin confirms a winner (`supplier_type="winner_voice"`, `winner_id=...`). The router does **not** consult this map yet — it still walks the generic supplier cascade.

- Add a new `WinnerVoiceSupplier` at priority 1.5 (after `on_device`, before `bhashini`).
- It checks the map; on hit, returns the winner's audio (downloaded from storage and served as `audio_url`).
- This is how the Hall of Fame voice actually gets used.

### 2.3 Moderation + abuse handling

Hall-of-Fame winners are by design permanent (`can_delete=0`). That cuts both ways:

- **Pre-confirmation:** add SNR + duration sanity checks before a submission reaches the admin queue. Reject submissions <5 s or >30 s, <-20 dB SNR.
- **Hate-speech / impersonation filter:** scan submitted audio for obvious red flags before showing in the admin queue. A misuse here is permanent so the gate has to be strong.
- **Abuse-removal procedure:** spec promises permanence, but a legal takedown (impersonation of a real person, child-protection) must still be possible. Add an `is_legally_removed` flag separate from `can_delete`. Keep the row for audit; stop serving the audio.
- **Reporting endpoint:** `POST /api/voice/hall-of-fame/<winner_id>/report` for public reports.

### 2.4 Donor email confirmation

`/api/voice/submit` accepts an email. Today it is never used. Per the timeline
on [`../voice_confirmation.html`](../voice_confirmation.html), the winner is
notified by email to give Stage-2 confirmation. Need to:

- Send a confirmation email on submission ("we received your voice").
- Send a winner-selection email when admin confirms the winner.
- Email provider: SES / SendGrid / Resend — same provider as feedback infra.

### 2.5 OAuth state bug

[`backend/services/admin_auth.py:48`](backend/services/admin_auth.py) reassigns `_OAUTH_STATE_CACHE` inside `validate_oauth_state` — but the assignment hits a local because there is no `global` declaration. The reassignment silently shadows the module global, so expired states never get GC'd from the *real* cache. Fix:

```python
def validate_oauth_state(state: str) -> bool:
    global _OAUTH_STATE_CACHE
    now = time.time()
    _OAUTH_STATE_CACHE = {...}
    ...
```

### 2.6 Admin route uses hard-coded DB path

[`backend/routes/admin.py:96`](backend/routes/admin.py) opens `"./chitti_voice_factory.sqlite"` directly with `sqlite3.connect(...)` instead of going through `ledger.py`. On Railway this should be `/tmp/chitti_voice_factory.sqlite` per the `VOICE_FACTORY_DB` env var. Route through the ledger module or read the env var.

---

## 3. Hardening the supplier cascade

### 3.1 Real Bhashini error handling

`backend/suppliers/bhashini.py` currently catches `requests.RequestException` and `(KeyError, IndexError, ValueError)`. We need:

- Per-language failure tracking — if Bhashini fails 3× for one language in 5 min, temporarily prefer `ai4bharat`.
- Retry with exponential backoff inside the supplier (1×, 2×, 4× seconds, max 3 attempts).
- Circuit breaker: if Bhashini availability drops below 80% over the last hour, mark `enabled=False` for 15 min and let the cascade fall through.

### 3.2 Ledger growth

`synthesis_log` grows unbounded. On Railway free tier (`/tmp/chitti_voice_factory.sqlite`) this resets on every deploy but accumulates within a deploy. Need:

- A nightly job (cron via Railway or an `apscheduler` job inside the app) that prunes `synthesis_log` rows older than 30 days.
- Or migrate to durable Postgres so we keep history.

### 3.3 STT (speech-to-text)

The product is currently TTS-only. The Mute and Illiterate users in the
four-user contract need **voice IN** to work, which means STT. The cascade
abstraction should extend to STT:

- New `synthesize_to_text(audio_bytes, language_code)` method on `Supplier`.
- Bhashini ASR + AI4Bharat IndicConformer + Sarvam STT in parallel cascade.
- New table `transcription_log` with `audio_sha256` + `text_sha256` for honest ledger parity.

### 3.4 Renaming `COUSIN_12` → `COUSIN_14`

[`backend/languages.py`](backend/languages.py) variable is `COUSIN_12` but the list has 14 entries (the original 11 Tier B + Sanskrit + Tulu + Kodava + Oraon). Cosmetic but it confuses readers — rename to `COUSIN_14` or just `COUSIN`.

---

## 4. Frontend polish

- [`../chitti_voice_factory.html`](../chitti_voice_factory.html) status dashboard hardcodes the API base. Confirm it falls back gracefully when the backend is sleeping (Railway free tier cold-starts).
- [`../voice_donor.html`](../voice_donor.html) stage transitions are checkbox-driven. Add an aria-live region for screen readers; blind donors should hear "now on stage 2 of 3, please press record".
- [`../chitti_voice_hall_of_fame.html`](../chitti_voice_hall_of_fame.html) renders nothing on a backend cold-start because there is no skeleton state. Add a "Waking up Chitti…" placeholder.
- Add a "Listen to current winner" button on each language's `chitti_<lang>.html` once §2.2 ships.

---

## 5. Deployment & ops

- Production URL `https://chitti-voice-factory-production.up.railway.app` per spec — confirm Railway service is actually live before next handover (memory: never say "live" without curling).
- `VOICE_FACTORY_DB=/tmp/...` on Railway means the SQLite database resets on every restart. Move to mounted disk or migrate to Postgres before any data we care about lives in it (i.e. before first real Hall of Fame winner).
- Health-check `/health` is wired but not pinged. Add a Railway health-check URL or a UptimeRobot ping.
- Add a `/admin/auth-status` endpoint so the dashboard can show "logged in as bryan@..." without exposing OAuth internals.

---

## 6. In-code TODO markers — full list

```
backend/services/storage_service.py:39   # TODO: Real TeraBox API call
backend/services/storage_service.py:50   # TODO: Real MEGA API call (using mega.py or similar)
backend/services/storage_service.py:58   # TODO: Implement based on provider
backend/routes/voice.py:244              # TODO: Upload to TeraBox/MEGA
```

No `FIXME`, `XXX`, or `HACK` markers in the codebase as of 2026-05-11.
