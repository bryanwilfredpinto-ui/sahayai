# VALUES — Chitti Voice Factory

## 1. Tier C never silently falls back

If a user requests speech in **Tulu, Kodava, or Oraon (Kurukh)**, the
router returns HTTP 503 with a `donor_url` pointing at
[`../../voice_donor.html`](../../voice_donor.html). It does *not* fall
back to Kannada, Tamil, or Hindi. This is the central value of the whole
service — explicit unavailability over invisible substitution.

See [`../API.md`](../API.md) §1 (`POST /api/voice/speak` — Response 503)
and [`../CONTEXT.md`](../CONTEXT.md) §1.

## 2. Mock supplier is honestly labelled

Until ULCA Bhashini credentials are issued, the active supplier is
`mock_bhashini`. The supplier name in the ledger row, in the API response,
and in the spoken disclaimer is **always `mock_bhashini`** — never
relabelled as `bhashini`. Spec §11.1. A blind user who hears "via
Bhashini" must mean *real* Bhashini, not a stub. See
[`../README.md`](../README.md) §8.

## 3. Community voices preferred over commercial when both available

When both a Hall of Fame winner voice and a commercial supplier (Sarvam)
can serve a language, the winner voice wins. The honest reason: a real
native speaker who consented under a credit-and-permanence contract
respects the user's mother tongue more than a paid commercial model.
Commercial spend should fund languages where no consenting donor exists
yet.

## 4. Honest availability — no fake `available:true`

A language is `available:true` in `/api/voice/status` **if and only if**
there is at least one `synthesis_log` row in the last 24 h with `ok=1`
and a non-null `latency_ms`. There is no other path to `true`. No
hard-coded list, no admin override, no "we have a model so it counts".
See [`../DATABASE.md`](../DATABASE.md) §1 (honest-status query) and spec
§5.

## 5. Donor consent is sacred and permanent-when-won

Every recording carries an explicit Stage-1 consent timestamp
(`consent_stage1_accepted_at`). When the admin confirms a winner,
`consent_stage2_accepted_at` is recorded too. From that moment on the row
in `voice_winners` carries `can_delete=0` and is never overwritten.
Compensation is revisited at 100 donors (spec §11.4). See
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §5.

## 6. Anonymity in the audit log

`synthesis_log` stores `text_sha256` and `text_chars`, never the raw
text. `voice_submissions` stores `audio_sha256` — the audio bytes
themselves live in TeraBox / MEGA, not SQLite. The ledger lets us prove
*what supplier was used when* without ever knowing *what was said*.
See [`../DATABASE.md`](../DATABASE.md) §7.

## 7. Legal-only corpora

No Doordarshan, no All India Radio, no Prasar Bharati anchor voices, no
YouTube scraping. Personality-rights case law (Anil Kapoor 2023, Arijit
Singh 2024) makes this a takedown risk and a moral failure. We use
Bhashini, AI4Bharat, Sarvam, Mozilla Common Voice, and opt-in donors.
[`../CONTEXT.md`](../CONTEXT.md) §4.1.

## 8. Voice-first across the family

Every Chitti product calls Voice Factory **before** writing anything to
the screen. The verdict is spoken first, captioned second. This is the
voice-first half of the four-user accessibility contract — the half that
keeps blind and illiterate users in the product.
