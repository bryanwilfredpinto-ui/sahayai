# BOUNDARIES — Chitti Voice Factory

Hard "no"s. These are not preferences; they are the lines that, if
crossed, destroy the trust the four-user contract depends on.

## 1. Never silently fall back from Tier C → Tier B

Tier C languages (Tulu `tcy`, Kodava `kfa`, Oraon `kru`) have **no**
production model from Bhashini, AI4Bharat, or Sarvam. The router does not
attempt synthesis; it short-circuits in `/api/voice/speak` and returns
HTTP 503 with a donor URL. Routing Tulu text through a Kannada voice
would *sound like mockery to a Tulu speaker* — see
[`../CONTEXT.md`](../CONTEXT.md) §4.2.

If a future code change introduces silent Tier C → Tier B fallback, that
is a regression of a non-negotiable. See
[`../API.md`](../API.md) §1 (Response 503).

## 2. Never use a donor voice without explicit consent

A recording does **not** become a usable voice until:

1. Stage 1 — submitter signs three explicit consent boxes in
   [`../../voice_donor.html`](../../voice_donor.html), and
   `consent_stage1_accepted_at` is written into `voice_submissions`.
2. Stage 2 — an admin (OAuth-gated, email in `ADMIN_EMAILS`) confirms the
   submission as a winner. `consent_stage2_accepted_at` is written into
   `voice_winners`.

Anything else is a deepfake. See
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3 and
[`../DATABASE.md`](../DATABASE.md) §§3–4.

## 3. Never relabel `mock_bhashini` as `bhashini`

The supplier field in the API response, the ledger row, and the spoken
disclaimer is `mock_bhashini` whenever the Web Speech directive path is
used. The day real Bhashini comes online — three env vars on Render — the
supplier field flips to `bhashini` automatically. Code that hard-codes
the label, or a UI that strips "mock_" client-side, breaks spec §11.1.

## 4. Never scrape Doordarshan, AIR, Prasar Bharati, or YouTube

Personality-rights and broadcast-copyright law (Anil Kapoor 2023, Arijit
Singh 2024). [`../CONTEXT.md`](../CONTEXT.md) §4.1. Use Bhashini,
AI4Bharat, Sarvam, Mozilla Common Voice, opt-in donors. Full stop.

## 5. Never delete a confirmed winner

`voice_winners.can_delete` is **always `0`**. There is no admin endpoint
to flip it. A confirmed winner stays. The only legitimate response to a
legal takedown (impersonation, child-protection) is an
`is_legally_removed` flag that stops serving audio while preserving the
audit row — and that flag does not exist yet (see
[`../TODO.md`](../TODO.md) §2.3). Until it does, do not pretend the row
is removable.

## 6. Never store raw text or raw audio in the ledger

`synthesis_log` stores `text_sha256` only — never the raw transcript.
Submission audio lives in TeraBox / MEGA, never as a BLOB in SQLite.
This is the privacy primitive of the system.
[`../DATABASE.md`](../DATABASE.md) §7.

## 7. Never call an LLM from this service

Voice Factory is pure TTS / STT routing. No DeepSeek, no Anthropic, no
OpenAI. If a feature seems to need an LLM, it belongs in the **caller**
(Chitti News, MedUPI, etc.), not here. [`../PROMPTS.md`](../PROMPTS.md).

## 8. Never let Sarvam fire before the free cascade

Sarvam is metered ₹/char. Spec §11.3: rate-limit 100 chars/request, only
after every free supplier has returned `ok=False`. The limit must live in
[`../backend/suppliers/sarvam.py`](../backend/suppliers/sarvam.py) — *not*
in the router — so the rule travels with the cost. [`../TODO.md`](../TODO.md) §1.3.

## 9. Never expose donor PII in public endpoints

`/api/voice/hall-of-fame` returns `donor_name` and `donor_photo_url`
only. `donor_email` and `donor_phone` exist in `voice_winners` for legal
contact, and they **must never** appear in any public response.
[`../API.md`](../API.md) §1 (`GET /api/voice/hall-of-fame`).
