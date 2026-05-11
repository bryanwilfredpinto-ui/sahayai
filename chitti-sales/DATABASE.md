# Chitti Sales — Database

**N/A today.** Chitti Sales has no database in v1. It is a stateless DeepSeek wrapper: every `POST /api/sales/ask` will be an independent request, nothing is persisted, and there will be no schema, migration, ORM, or connection string anywhere in the backend code.

## Why stateless to start

- The product is a **coach**, not a doer. There is no contact list, no lead pipeline, no CRM. There is nothing the user owns inside Chitti Sales that needs persisting.
- The four-user contract (see [CONTEXT.md](CONTEXT.md)) is easier to honour without accounts — no login flow, no password, no OTP, no Aadhaar / phone capture.
- Privacy posture matches [chitti-ca](../chitti-ca/) and [chitti-legal](../chitti-legal/): the user can paste anything they want about their business, and nothing is stored.

## Future schema (if user feedback gets stored)

The feedback widget at the repo root ([feedback-widget.js](../feedback-widget.js)) already POSTs to the Chitti Vaani feedback endpoint — that means v1 of Chitti Sales gets feedback storage **for free** through the existing shared pipeline (see [FEEDBACK_CAPTURE.md](FEEDBACK_CAPTURE.md)). No new schema is needed in this folder.

If a future v2 wants Sales-specific tracking (per-tactic outcome, "did this tactic close a sale for you?" follow-ups, roleplay session history), the proposed shape — to be added in a separate, isolated Turso libSQL DB per the [LLM/DB strategy](../MASTER_CONTEXT.md) — is sketched below. **None of this exists today.**

### `sales_sessions` (proposed, future)

A coaching ask + reply pair, anonymised.

| Column           | Type    | Notes                                                                  |
| ---------------- | ------- | ---------------------------------------------------------------------- |
| `id`             | TEXT PK | UUIDv4.                                                                |
| `created_at`     | TEXT    | ISO-8601 timestamp.                                                    |
| `device_id`      | TEXT    | Sticky-per-device random ID set by the frontend in `localStorage`. **Not** a user identity. |
| `language`       | TEXT    | The reply language code (en, hi, ta, ...).                              |
| `topic`          | TEXT    | The topic chip (lead, follow_up, pricing, ...) — nullable.              |
| `text_len`       | INTEGER | Length of the user's question. **The body is never stored.**           |
| `reply_len`      | INTEGER | Length of the reply.                                                   |
| `book_cited`     | TEXT    | Which of the 10 books the reply attributed the tactic to — nullable.    |
| `source`         | TEXT    | `deepseek` / `fallback_no_key` / `fallback_http_<code>` / `fallback_network`. |
| `disclaimer_in_reply` | INTEGER | 1 if the canonical disclaimer string was present in the reply, 0 otherwise. Used by the disclaimer-injection audit metric. |

### `sales_outcomes` (proposed, future, opt-in)

If a user later returns and answers "did this tactic actually work?", the result is stored here. Strictly opt-in via a "Tell us how it went" button on the page — never auto-prompted.

| Column         | Type    | Notes                                                                  |
| -------------- | ------- | ---------------------------------------------------------------------- |
| `id`           | TEXT PK | UUIDv4.                                                                |
| `session_id`   | TEXT FK | References `sales_sessions.id`.                                         |
| `created_at`   | TEXT    | ISO-8601 timestamp of the outcome report.                                |
| `outcome`      | TEXT    | `worked` / `did_not_work` / `did_not_try` / `unsure`.                   |
| `note_len`     | INTEGER | Length of the optional free-text note. **The body is never stored** in the default config; an opt-in `note` column may be added behind a feature flag if the user explicitly consents on a per-session basis. |

### Why this is **not** v1

- The product can ship its coaching value with zero storage. Adding a DB before we know whether the coaching is useful is premature.
- Storing outcome data has real consequences: the user is telling us about their actual sales, their actual pricing, their actual customer behaviour. That requires a privacy-policy update, an opt-in consent flow, and a deletion endpoint — all out of scope for the initial scaffold.
- The feedback widget already gives us a thumbs-up / thumbs-down / suggestion stream through the shared Chitti Vaani feedback endpoint, which is enough signal for the first quarter.

## Operational note

When the schema lands, it will live in its own Turso libSQL database (`chitti-sales-<org>.turso.io`) per the per-product database isolation policy in [MASTER_CONTEXT.md](../MASTER_CONTEXT.md). Tables will be flat (no schema prefix), and types will be SQLite-compatible (no `JSONB`, no `DOUBLE PRECISION`).
