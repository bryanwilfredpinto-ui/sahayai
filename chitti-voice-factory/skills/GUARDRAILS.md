# GUARDRAILS — Chitti Voice Factory

State, flags, and machine-checkable constraints. If any of these drift
from the values below, the service is misbehaving.

## 1. Per-language tier (single source of truth)

[`../backend/languages.py`](../backend/languages.py) — each `Language`
dataclass carries `tier: "A" | "B" | "C"`. The router consults this and
nothing else for Tier C short-circuit.

| Tier | Languages |
|---|---|
| A (12) | hi, bn, te, ta, kn, ml, mr, gu, or, as, pa, ur |
| B (11) | bho, hne, mai, kok, doi, sd, ks, mni, brx, sat, sa |
| C (3)  | tcy (Tulu), kfa (Kodava), kru (Oraon / Kurukh) |

`is_tier_c(code)` is the gate inside `/api/voice/speak`. If the function
returns `True`, no supplier is called; 503 + donor_url is returned.

## 2. Supplier cascade order

[`../backend/router.py`](../backend/router.py) declares
`_SUPPLIER_ORDER` exactly:

```
on_device → bhashini → mock_bhashini → ai4bharat → sarvam
```

The order is the priority. First supplier where `enabled=True` and
`supports(lang)=True` and `synthesize(...).ok=True` wins. No other code
path may rearrange the cascade.

## 3. Honest-availability invariant

`/api/voice/status` returns `available:true` for a language **iff** the
SQL in [`../DATABASE.md`](../DATABASE.md) §1 returns a row. No
hard-coded list, no manual override.

## 4. Donor consent timestamps (cannot be NULL when claimed)

- `voice_submissions.consent_stage1_accepted_at` — **NOT NULL**. Written
  by `submit_voice` only when request body `consent_stage1` is truthy.
- `voice_winners.consent_stage2_accepted_at` — **NOT NULL**. Written by
  `confirm_winner` only via the OAuth-gated admin route.

If a row exists without these timestamps, the data is corrupt — the audio
was not consented and must not be served.

## 5. Permanence flag

`voice_winners.can_delete` — **default 0, always 0**. No `UPDATE` query
in [`../backend/ledger.py`](../backend/ledger.py) sets this to anything
else. Spec §11.4 / §11.6.

## 6. Contest entry hashes

- `voice_submissions.audio_sha256` — sha256 of the raw recording. Used to
  detect duplicate submissions and to audit-link the recording in
  TeraBox / MEGA back to the SQLite row.
- `synthesis_log.text_sha256` — sha256 of the input text for every TTS
  call. The raw text is never stored. [`../DATABASE.md`](../DATABASE.md)
  §1.

## 7. Hall of Fame eligibility flag

`voice_submissions.is_winner = 1` is set **only** by the admin Stage-2
confirmation path, which also INSERTs into `voice_winners` and UPSERTs
`voice_synthesis_map`. The three writes happen inside a single
transaction in `ledger.confirm_winner`.

## 8. Audio storage URI

`voice_submissions.audio_storage_url` and `voice_winners.audio_storage_url`
**should** be TeraBox / MEGA URLs. Today they are deterministic mock
strings of the form `https://chitti-internal/submissions/<uuid>` because
the storage stubs are not yet wired. See
[`../TODO.md`](../TODO.md) §2.1. Treat any URL that hosts at
`chitti-internal` as a placeholder, not a playable asset.

## 9. Mock-flag env var

`VOICE_FACTORY_USE_MOCK_BHASHINI=1` keeps `mock_bhashini` ahead of
`bhashini` in the practical cascade. Setting it to `0` plus providing
`BHASHINI_USER_ID`, `BHASHINI_API_KEY`, `BHASHINI_INFERENCE_KEY` flips
real Bhashini live — no other code change required.

## 10. Admin allowlist

Every `/admin/*` request (except `oauth/*`) requires
`session["user_email"]` in `settings.ADMIN_EMAILS`. The check lives in
[`../backend/services/admin_auth.py`](../backend/services/admin_auth.py)
(`_is_admin`).

## 11. CORS allowlist

`ALLOWED_ORIGINS` defaults to
`https://sahayai.in,https://www.sahayai.in,http://localhost:5500`.
Other-origin browsers are blocked at the Flask-CORS layer.
