# Metrics — Chitti Vaani

> What Vaani measures, how it emits signals, and what it deliberately does NOT
> measure. All metrics are anonymised per [`../guardrails/privacy.md`](../guardrails/privacy.md).
> The quality framework is implemented in
> [`../backend/lib/observability.py`](../backend/lib/observability.py) and
> [`../backend/lib/chitti_quality.py`](../backend/lib/chitti_quality.py).

---

## Surface-level metrics (the dashboards Sire sees)

| Metric | Source | Cadence | Where it surfaces |
|---|---|---|---|
| Per-response 👍 / 👎 | `feedback-widget.js` → `/api/feedback/collect` | Real-time | chitti-founder weekly digest |
| Suggestion free-text | Same widget, `type=suggestion` | Real-time | chitti-founder daily 06:00 IST report |
| Route confidence distribution | `vaani_service.py route_intent()` → `quality_audit` | Per request | `/health` + weekly digest |
| Emergency cascade latency | Frontend timestamps: keyword-spot → trigger POST → relay fan-out → partner poll/FCM | Per trigger event | Founder dashboard + weekly digest |
| Voice Factory cascade ledger | 4-supplier attempt → success/fail per tier per language | Per TTS call | `/api/vaani/health` + weekly digest |
| SLA timing header | `X-Chitti-Response-Time-Ms` on every response | Per request | Prometheus histogram + weekly P50/P95 |
| Intent-route accuracy | `route_confidence` distribution + swarm feedback loop | Daily aggregate | Founder dashboard |
| Per-action Golden Rule compliance | AuditLog entry per confirmed/rejected action | Per action | chitti-founder audit trail |
| Language coverage gap | Voice Factory `tier_used` + `language` per TTS call | Per call | Weekly digest — flags languages stuck on Tier C |
| Disability-profile adoption | `disability_profile` field counts (blind/deaf/mute/illiterate) | Daily local snapshot | Weekly digest — drives four-user contract investment |
| Emergency keyword false-positive rate | `emergency/check-in` responses within 10 s of trigger | Per trigger event | Quarterly safety review |

---

## Per-response 👍 / 👎 payload

The single most important signal for Vaani — every response box carries the
widget; every vote is captured immediately.

```json
POST /api/feedback/collect
{
  "page":         "chitti_vaani",
  "type":         "thumbs_up",
  "text":         null,
  "user_segment": "blind",
  "ip_hash":      "sha256(FEEDBACK_IP_SALT + client_ip)[:24]",
  "created_at":   "2026-06-06T07:00:00Z"
}
```

Server stores: `page`, `type`, `text` (PII-scanned), `user_segment`, `ip_hash`, `created_at`.
Server never stores: User-Agent, Referer, client IP raw, disability profile in full.

PWD-weighted scoring formula
(per [`../backend/services/feedback_db.py`](../backend/services/feedback_db.py)):

```
score = (impact × frequency × urgency) / effort
impact:   1.0 for blind/deaf/mute/illiterate · 0.8 elderly · 0.6 general
urgency:  1.5 if page has more thumbs_down than thumbs_up in last 24 h · else 1.0
effort:   1.0 (placeholder until admin tagging lands)
frequency: duplicate-collapse count
```

---

## Route confidence metric

Every call to `POST /api/vaani/ask` will emit (once Q1 lands):

```json
{
  "reply":            "...",
  "route_confidence": 0.87,
  "routed_to":        "chitti-ca",
  "lang":             "hi"
}
```

The backend records one `quality_audit` row of `kind="rail"`, `rail="relevance"`,
`action="pass"` when confidence ≥ 0.70, and `action="warn"` when < 0.70 (which
also triggers the spoken confirmation per
[`../guardrails/hallucination.md §Principle 2`](../guardrails/hallucination.md)).

Aggregated daily into a histogram with buckets [0.0–0.5, 0.5–0.7, 0.7–0.85, 0.85–1.0].
Right-tail growth = routing improving. Left-tail spike = new user utterance
patterns the classifier doesn't recognise → feeds the Swarm weekly cycle.

**Status:** Planned (Q1 backlog). The `quality_audit` table and `Observability`
class are live — only the `route_confidence` field on the `/api/vaani/ask`
response is not yet emitted.

---

## Emergency cascade latency

Measured from keyword-spot (or button press) to each of four milestones:

| Milestone | How measured |
|---|---|
| T0: keyword spotted / button pressed | Frontend `performance.now()` at trigger |
| T1: `POST /api/vaani/emergency/trigger` 200 OK | Frontend receives response |
| T2: relay fan-out complete (backend `fanout_ids` returned) | Included in T1 response |
| T3: partner Chitti polls and marks `relay_inbox.delivered = 1` | Backend sweep |

Target SLA (not yet measured — honest):

- T1 − T0 < 2 s on 3G (Slow-3G budget: ~4 s).
- T2 − T0 < 3 s.
- T3 − T0: depends on partner device poll interval (default 10 s web long-poll / FCM < 5 s Phase 2).

Each trigger event is logged to `quality_audit` with `kind="tool"`,
`phase="before"` (trigger received) and `phase="after"` (fan-out complete),
allowing elapsed_ms to be computed from the pair.

False-positive rate is computed from `emergency/check-in` events that arrive
within 10 s of the trigger (master said *"theek hun"* immediately → keyword
was misdetected). Target: < 5% false-positive rate per language. Current
status: not yet instrumented.

---

## Voice Factory cascade ledger

Every call to the Voice Factory (TTS for any Vaani utterance) produces a ledger
entry. The ledger is not yet persisted to `quality_audit` — it is logged to stdout
per the format defined in
[`CHITTI_VOICE_FACTORY_MASTER_SPEC.md`](../../CHITTI_VOICE_FACTORY_MASTER_SPEC.md).

Planned `quality_audit` row per TTS call:

```json
{
  "kind":    "tool",
  "phase":   "after",
  "reason":  "voice_factory_tts",
  "payload": {
    "lang":        "hi",
    "tier_used":   "A",
    "supplier":    "bhashini_mock",
    "latency_ms":  320,
    "success":     true,
    "text_len":    142
  }
}
```

Tier C success rate is tracked per language. If Tier C (community voice, no
fallback) fails, the ledger records `success: false` and the frontend renders
*"Voice in [lang] temporarily unavailable."* — never silent.

---

## SLA timing header — X-Chitti-Response-Time-Ms

`install_request_timing(app, "chitti-vaani", obs)` in
[`../backend/lib/observability.py`](../backend/lib/observability.py)
adds the `X-Chitti-Response-Time-Ms` header to every Flask response
and a `kind="http"` row to `quality_audit`.

Prometheus histogram: `chitti_http_latency_ms{chitti="chitti-vaani", method, endpoint, status}`
with buckets `(10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000)` ms.

The Functional Gate (Quality Gate 1) requires P95 of `/api/vaani/ask` < 5 s
on Slow-3G (budget for the combined frontend + backend round-trip).

---

## AuditLog — Golden Rule action outcomes

Every call to `chittiConfirmAndDo(question, onYes)` writes an AuditLog entry
via the frontend before the action fires, and updates it on completion.
For email sends, the server-side action also writes a `product_action_logs`
row (see [DATABASE.md](../DATABASE.md)).

Aggregated daily metric: Golden Rule compliance rate =
`confirmed_actions / (confirmed_actions + rejected_actions + timed_out_waiting)`.
Target: confirmed rate ≥ 50% (a high rejection rate may mean Vaani is
triggering confirms for actions users didn't intend).

---

## Aggregation cadence

- **Real-time**: feedback events stream into Turso `chitti_vaani_quality.db`
  (tables: `quality_audit`, `feedback_log`).
- **Hourly :15**: chitti-founder escalator job aggregates per-page vote
  ratios; any page with > 10 downvotes and < 2 upvotes in 24 h is
  auto-flagged for human review.
- **Daily 06:00 IST**: `feedback_scheduler.py` daily report — top-3
  suggestions + 👍/👎 ratios per page + Voice Factory language gaps.
- **Daily 07:00 IST**: founder digest (per `lib/founder_report.py`) — full
  quality slice including route confidence, emergency latency, AuditLog summary.
- **Weekly Sun 08:00 IST**: trend report — week-over-week changes in vote
  ratios, cascade latency, language coverage, four-user disability adoption.

---

## What we never measure

- ❌ Dwell time per conversation turn (no scroll or gaze tracking).
- ❌ Keystroke or voice-input patterns beyond the spoken transcript.
- ❌ Device fingerprint (canvas, fonts, WebGL).
- ❌ Cross-session identity (no login; user_token is opaque UUID).
- ❌ Geographic IP-to-location lookup (only ip_hash aggregates).
- ❌ Disability profile in any server-side payload.
- ❌ Medical ID fields in any server-side payload.
- ❌ Trusted Circle contact list in any server-side payload.

---

Last reviewed: 2026-06-06
