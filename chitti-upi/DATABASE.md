# Chitti UPI Fraud Guard — Database

## Status: **N/A — fully stateless service**

There is **no `models/` directory** in `chitti-upi/backend/`. There is no
SQLite, Postgres, MongoDB, Redis, or any other persistence layer.
[`backend/requirements.txt`](./backend/requirements.txt) contains exactly
four packages — `flask`, `flask-cors`, `gunicorn`, `httpx` — none of which
is a database client.

## Why stateless is the right call here

| Risk of persisting                                              | Why we don't                                                                                  |
|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Storing the user's pasted SMS / WhatsApp text                   | Often contains the user's real name, account suffix, OTP. DPDP Act 2023 — minimise / don't.   |
| Storing the verdict + indicators                                | Would let an attacker who breaches the DB map "who got phished today".                        |
| Storing the user's UPI ID / payee VPA                           | We never receive them — the v1 product is text-classification, not payment.                   |
| Storing tokens / cookies / session                              | No login. Anonymity is the privacy guarantee.                                                 |

## What the service *does* hold in memory

- The `CHITTI_UPI_FRAUD_PROMPT` constant (loaded once at import).
- The 4 RBI 2026 cards dict (returned by `rbi_2026_rules()`).
- The `LEGAL_LINES` 2-tuple.
- The `Settings` dataclass (env-driven, frozen).

All of these are immutable and shipped with the code. None is user data.

## What the *frontend* persists (separate from this backend)

For completeness — these live in the browser, not on the server:

| Key                                | Where         | Purpose                                                  |
|------------------------------------|---------------|----------------------------------------------------------|
| `chitti_upi_consent_given`         | `localStorage`| T&C consent gate (mirrors Vaani structure).              |
| Language preference                 | `localStorage`| For the header language selector.                        |

The backend has no visibility into either.

## If persistence is ever added

Likely triggers (none active today):

1. **Scam corpus** for prompt tuning — would store *only* the user-pasted
   text after explicit opt-in via a "Report this scam" button. See
   `TODO.md` P1-8.
2. **Aggregate counters** for the founder dashboard — would store
   anonymous counts (`{date, risk, fallback_used}`), no PII.
3. **v2 payment-intent flow** — would still *not* store the payment
   itself; voice biometrics enrolment would live on-device (Android
   Keystore), not server-side. See `TODO.md` P2.

Until one of those lands, this file stays N/A.
