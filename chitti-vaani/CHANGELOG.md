# CHANGELOG — Chitti Vaani

Derived from `git log --oneline --reverse -- chitti-vaani/`. Newest at the bottom.

| Commit | Title |
|---|---|
| `bc3673b` | feat(chitti): ship Vaani + UPI Fraud Guard + Scanner — full skeleton |
| `4c72e42` | feat(vaani): Phase 1.5 — voice grant, trusted circle, WA/UPI/email pro actions |
| `059ab22` | feat(vaani): Phase 1.6 Gmail OAuth + Phase 2 Android skeleton |
| `e9aaf6c` | feat(vaani): outbound calls — Chitti makes calls too, not just takes |
| `ce0d260` | feat(vaani): 24/7 emergency cascade — family only, never cops |

## Phase 1.0 — `bc3673b`

Initial skeleton: Flask app, [vaani.py](backend/routes/vaani.py), [vaani_service.py](backend/services/vaani_service.py), DeepSeek wiring, `/api/vaani/ask`, `/health`, `/languages`. Renders the canonical `CHITTI_VAANI_PROMPT` system message and enforces the Hindi legal disclaimer on every reply. Ships alongside UPI Fraud Guard and Chitti Scanner as the first wave of Chitti products.

## Phase 1.5 — `4c72e42`

Voice-grant onboarding (consent gate + 6-section T&C modal, each section with a speaker readback). Trusted-circle dictation. Deep-link "pro actions":
- WhatsApp via `whatsapp://` / `wa.me/<num>?text=<msg>`
- UPI payment via `upi://pay?…` (user enters PIN in the UPI app — NPCI mandate)
- Email send via Gmail web compose deep-link (browser-only fallback before OAuth)

## Phase 1.6 — `059ab22`

Gmail OAuth + send-as-user backend:
- [`routes/email.py`](backend/routes/email.py), [`services/email_service.py`](backend/services/email_service.py), [`services/email_db.py`](backend/services/email_db.py)
- SQLite `oauth_tokens` + `oauth_state` tables (per `user_token` device UUID)
- Scope `gmail.send + userinfo.email`, refresh-token flow with 60 s skew buffer, best-effort revoke on disconnect
- Auto-appended Chitti AI signature on every outbound message
- The Android Phase 2 spec (`CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` at repo root) lands as a separate file documenting what cannot be done in a browser

## Outbound calls — `e9aaf6c`

Chitti gains the symmetric capability: not just answering calls for mute users, but **making them**. Web variant uses `tel:` deep-links that open the dialer pre-filled. Android Phase 2 will direct-dial via `ACTION_CALL` + `CALL_PHONE` permission, with a mute-user "Chitti speaks for me" toggle that routes through `VaaniInCallService` (Phase 2.3.1).

## 24/7 Emergency cascade — `ce0d260`

The big one. Lands the family-cascade-never-cops protocol end-to-end:
- [`routes/emergency.py`](backend/routes/emergency.py) — trigger / check-in / pair-issue / pair-accept / pair-unpair / pair-list / poll
- [`services/emergency_service.py`](backend/services/emergency_service.py) — multi-language `EMERGENCY_KEYWORDS`, `COP_DENYLIST` refusal of 112 / 100 / 101 / 102 / 108 / 1098 / 1930 / 139
- [`services/relay_db.py`](backend/services/relay_db.py) — pair codes (6 digit, 5 min TTL), symmetric pairs, relay inbox with 24 h sweep, web long-poll endpoint
- Frontend local cascade: master-confirm 10 s → alarm 10 s (`STREAM_ALARM` on Android, Web Audio on web, bypassing silent) → outbound call to spouse from trusted circle → Chitti-to-Chitti relay fans the event out to every paired partner's phone

## Working tree (uncommitted, not yet in git log) — 2026-05-11

The following are present on disk but **not yet committed**:

- [`routes/admin.py`](backend/routes/admin.py) + [`services/admin_db.py`](backend/services/admin_db.py) + [`services/admin_oauth.py`](backend/services/admin_oauth.py) + [`services/admin_scheduler.py`](backend/services/admin_scheduler.py) — Sahay AI Admin Dashboard backend (product Gmail OAuth + monthly keep-alive)
- [`scripts/admin_seed.py`](backend/scripts/admin_seed.py) — seeds 17 default product rows on every boot
- [`routes/feedback.py`](backend/routes/feedback.py) + [`services/feedback_db.py`](backend/services/feedback_db.py) + [`services/feedback_scheduler.py`](backend/services/feedback_scheduler.py) — cross-product feedback widget + daily 06:00 IST report
- `main.py` updated to register the new blueprints and mount the schedulers
- `requirements.txt` adds `apscheduler`, `sqlalchemy`, `psycopg2-binary`, `tzdata`
- `render.yaml` adds the admin + feedback env vars (`ADMIN_SECRET`, `ADMIN_DATABASE_URL`, `ADMIN_OAUTH_REDIRECT_URI`, `ADMIN_KEEPALIVE_*`, `FEEDBACK_*`)
- Companion HTML files at repo root: `chitti_admin_feedback.html`, `chitti_admin_products.html`, `feedback-widget.js`

These will appear in a single commit once admin / feedback are verified live (per the `feedback_verify_before_handover.md` rule — never call something "live" without curling production first).
