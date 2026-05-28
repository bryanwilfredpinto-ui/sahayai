# OBSERVABILITY — Chitti Vaani

How we know Vaani is actually working — for blind, deaf, mute, and illiterate users we cannot easily survey by form.

## 1. `vaani_audit.log` on Android (Phase 2)

The Android client writes a structured audit log on-device: every voice intent, every readback, every silent-cancel, every emergency trigger, every paired-Chitti event received. Per the four-user contract, the audit is **opt-in upload** (federated principle) — by default it stays on the phone and powers a "what did Chitti do last night?" voice query. See [../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md](../../CHITTI_VAANI_PHASE2_ANDROID_SPEC.md) and [../TODO.md](../TODO.md) §2.4–2.5.

## 2. Admin keepalive scheduler — monthly

[../backend/services/admin_scheduler.py](../backend/services/admin_scheduler.py) runs an APScheduler cron at 1st @ 06:00 IST (configurable via `ADMIN_KEEPALIVE_DAY/HOUR/MINUTE`). For each connected product Gmail account, it sends a "keep-alive" mail to `ADMIN_NOTIFY_EMAIL`. Two purposes:

- Exercises the OAuth refresh path so Google does not revoke the token after ~6 months of idle (7 days in Testing mode).
- Surfaces a connectivity-and-credentials health check Bryan reads on the 1st of every month.

Idempotent under multi-worker gunicorn via a same-calendar-month equality check (no leader election).

## 3. Feedback widget — daily 06:00 IST report

`feedback-widget.js` (repo root) posts to `/api/feedback/collect`. The widget is embedded on **every** Chitti HTML page. Daily report:

- Cron in [../backend/services/feedback_scheduler.py](../backend/services/feedback_scheduler.py), 06:00 IST.
- Score formula `(Impact × Frequency × Urgency) / Effort`, with PWD-weighted impact: 1.0 blind/deaf/mute/illiterate, 0.8 elderly, 0.6 general.
- Junk filter: `_IMPOSSIBLE` regex + one-word entries + duplicate collapse.
- Top suggestions emailed via any connected admin product mailbox.

## 4. Gmail send-receipts

Every `/api/vaani/email/send` returns the Gmail `messageId`. Persisted alongside the action timestamp in `oauth_tokens` send-history. The frontend reads back *"sent — message id ends in [last 4]"* for the user.

## 5. Emergency relay delivery confirmation

[../backend/services/relay_db.py](../backend/services/relay_db.py) marks each relay event delivered on poll. A 24-hour sweep keeps the inbox clean. The triggering user's Chitti can voice-query *"did Ramesh get my alert?"* and Vaani reads the delivered timestamp.

## 6. Health endpoints

`GET /health` + `GET /api/vaani/health` — used by Railway and any external uptime probe. Per the master memory `feedback_verify_before_handover.md`: never claim "live" without curling production first.
