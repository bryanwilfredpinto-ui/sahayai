# TRUTH_SOURCES — Chitti Voice Factory

Where every claim in this service is anchored. If a claim has no entry
below, treat it as unsupported.

## 1. Supplier APIs

| Supplier | Tier | Source | Endpoint / Library | Status |
|---|---|---|---|---|
| `on_device` | n/a | quantised ONNX IndicTTS in browser | `onnxruntime-web` (planned, Phase 10) | placeholder; `supports()=False` for every language |
| `bhashini` | A premium (govt-backed) | Government of India NLTM, ULCA pipeline-config → inference | `https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/...` | **wired, disabled** until 3 ULCA env vars set |
| `mock_bhashini` | transitional stub | client-side Web Speech directive | browser `speechSynthesis` API | **active** default, honestly labelled |
| `ai4bharat` | B Indic | IIT Madras IndicTTS / IndicParler-TTS | `AI4BHARAT_ENDPOINT` env (self-host or HF inference) | stub — Phase 7 |
| `google_tts` | B fallback | Google Cloud TTS Neural2 voices | not currently wired into the cascade | aspirational — not in `_SUPPLIER_ORDER` today |
| `sarvam` | last-resort paid | Sarvam AI commercial TTS | `https://api.sarvam.ai/text-to-speech` | stub — Phase 8 |

The router order is fixed in
[`../backend/router.py`](../backend/router.py); see
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §2.3.

## 2. Language registry

[`../backend/languages.py`](../backend/languages.py) — 26 `Language`
records. Each carries `code`, `name_en`, `name_native`,
`web_speech_code`, `tier`, `family`, `bhashini_supported`,
`ai4bharat_supported`. This file is the single source of truth for which
languages exist and which suppliers they map to.

## 3. Donor-consent table

[`../backend/ledger.py`](../backend/ledger.py) creates
`voice_submissions` and `voice_winners`. Schema in
[`../DATABASE.md`](../DATABASE.md) §§3–4. Every audio asset served by
Voice Factory must trace back through:

```
audio_storage_url
   └→ voice_winners.winner_id  (with consent_stage2_accepted_at NOT NULL)
        └→ voice_submissions.submission_id  (with consent_stage1_accepted_at NOT NULL)
```

If either consent timestamp is missing, the asset must not be played.

## 4. Mock-flag and ULCA wiring

- Env var: `VOICE_FACTORY_USE_MOCK_BHASHINI` (default `1`)
- ULCA creds env vars: `BHASHINI_USER_ID`, `BHASHINI_API_KEY`,
  `BHASHINI_INFERENCE_KEY`
- Application body: [`../README.md`](../README.md) §6, spec §9.

## 5. Storage providers

Env: `STORAGE_PROVIDER` ∈ {`terabox`, `mega`}.
- TeraBox: `TERABOX_API_KEY`
- MEGA: `MEGA_EMAIL`, `MEGA_PASSWORD`
Status today: stubs only — see
[`../backend/services/storage_service.py`](../backend/services/storage_service.py)
and [`../TODO.md`](../TODO.md) §2.1.

## 6. Admin OAuth

- Providers: `ADMIN_OAUTH_PROVIDER` ∈ {`github`, `google`}.
- Credentials: `ADMIN_OAUTH_ID`, `ADMIN_OAUTH_SECRET`.
- Allowlist: `ADMIN_EMAILS` (comma-separated). Enforced in
  [`../backend/services/admin_auth.py`](../backend/services/admin_auth.py).

## 7. Legal blocks (where we will *never* source voice)

[`../CONTEXT.md`](../CONTEXT.md) §4 — Doordarshan / All India Radio /
Prasar Bharati / YouTube. Case law: Anil Kapoor v. Simply Life India
(Delhi HC 2023), Arijit Singh v. Codible Ventures (Bombay HC 2024).

## 8. Public API surface

[`../API.md`](../API.md) — every public endpoint, request shape, response
shape, and error code. Anything not documented there is not part of the
public contract.

## 9. Honest-status SQL

[`../DATABASE.md`](../DATABASE.md) §1 — the exact `SELECT` that drives
`available:true`. No code path may shortcut this.
