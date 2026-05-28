# OBSERVABILITY — Chitti Voice Factory

What we measure, where it lives, and the signals that say "something is
quietly wrong."

## 1. Per-supplier latency

Every call to a supplier writes a row in `synthesis_log` with
`latency_ms` (wall-clock ms of the supplier call). See
[`../DATABASE.md`](../DATABASE.md) §1.

- **Per-language average over 24 h** is published at
  `GET /api/voice/status` → `avg_latency_ms_24h`.
- **Per-supplier comparison** can be derived via
  `GET /api/voice/ledger?limit=1000` and grouping client-side.

Latency budget: `mock_bhashini` < 50 ms (no network);
`bhashini` < 1500 ms; `ai4bharat` < 2000 ms; `sarvam` < 1500 ms.

## 2. Fallback rate

Every cascade walk logs **every attempt** — including failures — so a
single user request can produce 2–3 rows in `synthesis_log`. The
fallback rate per language is:

```
fallback_rate = (rows_with_ok=0) / (total_rows)
```

over the time window. High fallback rate for a Tier A language is a red
flag — usually Bhashini being flaky or `on_device` blocking when it
shouldn't.

## 3. Tier C silent-fallback canary

**Critical signal.** If `synthesis_log` ever contains a row with
`language_code IN ('tcy', 'kfa', 'kru')` *and* `ok=1`, something is
wrong — Tier C requests are supposed to short-circuit before any
supplier is called. A nightly check should alert on:

```sql
SELECT COUNT(*) FROM synthesis_log
 WHERE language_code IN ('tcy','kfa','kru')
   AND ok = 1
   AND created_at >= datetime('now','-1 day');
```

Expected value: **always 0**. Anything else is a guardrail breach.

## 4. Donor-consent timestamps (audit)

Every winner row must satisfy:

```sql
SELECT winner_id FROM voice_winners
 WHERE consent_stage2_accepted_at IS NULL
    OR submission_id NOT IN (
        SELECT submission_id FROM voice_submissions
         WHERE consent_stage1_accepted_at IS NOT NULL
    );
```

Expected: **empty**. Any winner without a Stage-1 + Stage-2 chain is a
data-integrity bug and the audio must be pulled.

## 5. Contest-vote / admin-confirmation audit log

There is no algorithmic scoring (see
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §4) — winners are curatorially
chosen. Every confirmation goes through
`POST /admin/submissions/<id>/confirm-winner`, which is OAuth-gated and
records `session["user_email"]` in the gunicorn access log. Pair the
access log entry with the `voice_winners.created_at` timestamp to audit
**who** confirmed **which** winner **when**.

## 6. Hall of Fame play counts

Today `GET /api/voice/hall-of-fame` is read-only and does not increment a
play counter. To learn which winners are actually being used by Chittis
across the family, we have to grep `synthesis_log` for rows where
`supplier='winner_voice'` — and that supplier doesn't exist yet (see
[`DEVILS_ADVOCATE.md`](DEVILS_ADVOCATE.md) §4). Until the winner-voice
cascade ships, Hall of Fame play counts are unknown by construction.

## 7. OAuth-state cache size (memory-leak canary)

Because of the bug noted in [`DEVILS_ADVOCATE.md`](DEVILS_ADVOCATE.md)
§2, `_OAUTH_STATE_CACHE` can grow unbounded. A small ops endpoint —
`GET /admin/auth-status` (proposed in [`../TODO.md`](../TODO.md) §5) —
could expose `len(_OAUTH_STATE_CACHE)`. Alert if > 1000.

## 8. Railway cold-start latency

Railway free tier sleeps the service after ~15 min idle. First request
after sleep takes 30–60 s. Surface this to callers: every Chitti
frontend that calls Voice Factory must show a "Waking up Chitti…"
placeholder. The dashboard at
[`../../chitti_voice_factory.html`](../../chitti_voice_factory.html)
should not interpret a cold-start delay as the service being broken.

## 9. SQLite size

`synthesis_log` grows unbounded. On `/tmp` it resets on every deploy, but
within a long-lived deploy on a paid disk it would need pruning. Spec
recommends nightly pruning of rows older than 30 days
([`../TODO.md`](../TODO.md) §3.2).
