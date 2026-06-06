# SUCCESS METRICS — Chitti Vaani

The numeric bars. If we cannot measure it, we cannot claim it.

> Sourced from [`CHITTI_SOP.md`](../CHITTI_SOP.md) §1 (three canonical success metrics)
> + [`SOP.md`](SOP.md) quality standard + [`CONTEXT.md`](CONTEXT.md)
> emergency protocol + [`skills/FEATURES.md`](skills/FEATURES.md) operating data.
>
> **Honesty rule:** any metric marked ⚠️ or ❌ is not fabricated —
> it is a gap that must be closed before the metric is cited as evidence of success.
> Live LLM-routed accuracy numbers are GATED on DeepSeek funding + the Vaani
> relevance-rail build. Do not report numbers that are not measured.

---

## North-star metrics (from CHITTI_SOP §1)

These three are the canonical success metrics Sire tracks. Everything else is
supporting telemetry.

| # | Metric | Target | How measured | Status |
|---|---|---|---|---|
| NS1 | **Intent-route accuracy across all 14 Chittis** | ≥ 85% correct route on judge eval (target: ≥ 92% at steady state) | Offline benchmark: 200 hand-labelled utterances across all 14 route targets, scored by `route_intent()` in `vaani_service.py` | ⚠️ Benchmark dataset exists as a design goal; offline eval harness not yet built. Live numbers require DeepSeek funding + relevance-rail. |
| NS2 | **Per-response 👍 rate** | ≥ 75% thumbs-up across all response boxes | `POST /api/feedback/collect` → daily 06:00 IST report → Founder dashboard | ⚠️ Infrastructure live (feedback.py, feedback_db.py, scheduled report); real-user volume too low to report a stable rate. Will report once ≥ 100 daily active users. |
| NS3 | **Emergency-cascade median response time** — keyword spot → spouse-tier acknowledgement | < 30 s median; < 60 s p95 | `emergency_service.py` timestamps: `keyword_spotted_at` → `pair_acknowledged_at` | ⚠️ Backend cascade wired; timestamp instrumentation designed; production p50 not yet measured under real traffic. Escalation to CTO if p50 > 30 s once measured. |

---

## Operating metrics

These are the merge-blocker bars. A deploy that fails any ✅ row is a regression.

### Voice + LLM substrate

| Metric | Target | Source | Status |
|---|---|---|---|
| DeepSeek `/api/vaani/ask` success rate | ≥ 99% (gated on DeepSeek funding; fallback to Gemini) | health endpoint + Railway logs | ⚠️ Layer-5 fallback (Gemini) not yet wired across all backends |
| Voice Factory supplier cascade | Tier C surfaces "not supported" honestly — never silent fallback | Voice Factory ledger | ✅ mock_bhashini active; ledger wired |
| Voice Factory language coverage | 26 languages incl. Sanskrit + Oraon | `GET /api/vaani/languages` | ✅ 9 first-class in conversational API; 26 via Voice Factory cascade |
| Legal disclaimer enforcement | 100% of replies carry `_enforce_disclaimer()` footer | server-side, `vaani_service.py` | ✅ enforced server-side |
| LLM fallback notice | 100% of fallback events surface a visible notice; 0 silent falls | Layer-5 fallback chain | ❌ not yet wired for Vaani |

### Emergency cascade

| Metric | Target | Source | Status |
|---|---|---|---|
| Cop-denylist refusal rate | 100% of `COP_DENYLIST` numbers refused even in misconfigured trusted circle | `is_cop_number()` in `emergency_service.py` + CI test | ✅ enforced at protocol layer |
| Emergency keyword coverage | Hindi + English + Bangla + Tamil + Telugu + Marathi regional variants | `EMERGENCY_KEYWORDS` in `vaani_service.py` | ⚠️ Hindi + English live; regional variants queued as Q3 improvement |
| Chitti-to-Chitti relay uptime | Paired partners receive emergency event within relay poll window | `/api/vaani/emergency/poll` | ✅ long-poll wired; FCM (Phase 2 Android) not yet deployed |
| Family cascade abort | `check-in` endpoint aborts cascade and notifies pairs within 5 s | `emergency_service.py` | ✅ wired |

### Pro Actions + Golden Rule

| Metric | Target | Source | Status |
|---|---|---|---|
| Golden Rule gate coverage | 100% of side-effecting actions route through `chittiConfirmAndDo()` | `chitti_vaani.html` code audit | ✅ all Pro Cards + device-control cards wired |
| Readback accuracy | Action description read before execution matches actual action taken | Manual audit per release | ⚠️ not yet in automated cert harness |
| 30-second undo window | Present after every Pro Action that mutates state | `audit log + undo()` in frontend | ✅ wired |
| UPI PIN non-exposure | 0 occurrences of PIN in any log, response, or readback | code audit + log scan | ✅ enforced — PIN never leaves UPI app |

### Accessibility — four-user contract

| Bar | Target | Status |
|---|---|---|
| Per-response widget (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️) on every response box | 100% of `[data-chitti-response]` boxes | ✅ `feedback-widget.js` auto-attaches |
| ISL Phase 1 panel on every response box | 100% | ✅ `chitti_a11y.js` substrate auto-injects |
| Voice-first mode auto-activates for `disability_profile.blind` | 100% | ✅ `chitti_a11y.js` reads profile on page load |
| Colour-only feedback | 0 occurrences | Code audit + manual cert | ⚠️ design rule enforced; automated scan not yet in CI |
| Tap targets ≥ 48×48 px | 100% of interactive elements on 375 px viewport | `cert_chitti_vaani.mjs` | ⚠️ cert harness exists for other pages; Vaani-specific cert pass pending |
| Mobile cert at 375 px | ≥ 18/20 PASS | `cert_chitti_vaani.mjs` | ⚠️ to run |

### Local-business directory

| Metric | Target | Source | Status |
|---|---|---|---|
| Geo-aware "actually nearby" | Haversine + 5 km metro / 25 km auto-expand | `local_chitti_service.nearby()` | ✅ shipped 2026-05-13 |
| Honest empty state | Banner + spoken message when no results within radius | Frontend + `nearby()` | ✅ |
| Chitti-first, external-app-fallback ordering | Chitti directory queried before Zomato / Swiggy / Ola | `local_chitti_service.py` | ✅ |

### Quality framework

| Metric | Target | Source | Status |
|---|---|---|---|
| Founder daily report | Computes 👍/👎 ratios + top-3 suggestions by 06:00 IST | `admin_scheduler.py` | ✅ scheduled |
| Channels health endpoint | `GET /api/vaani/channels/health` returns real configured-state of all outbound channels | `channel_verify.py` | ✅ wired |
| Consent gate | 100% of features locked until user taps I AGREE; each section voice-readable | `localStorage.chitti_vaani_consent_given` + T&C modal | ✅ |

---

## Anti-metrics

| Anti-metric | Why we refuse |
|---|---|
| Time-in-conversation | User outcome > engagement. A faster resolution is a better result. |
| LLM call volume per session | The four-user contract floor does not depend on LLM availability. |
| Affiliate-click revenue | No affiliate links in the local-business directory; no paid-first ranking. |
| Stories-per-session or taps-per-session | Volume of interactions ≠ user value. |
| App-install count | Vaani is a web-first product until Phase 2 Android. Installs are a vanity metric until the Android APK ships. |

---

## Reporting cadence

| Metric class | Cadence | Owner | Surface |
|---|---|---|---|
| North-star (NS1–NS3) | Quarterly once live-user base ≥ 100 DAU | Sire | Founder dashboard |
| Operating | Daily at 06:00 IST | CTO | QUALITY_STATUS.md + `chitti_cto_inbox.html` |
| Escalation thresholds | On breach | CTO → Sire | Vaani CTO panel |

Escalation to Sire if any of these fire in production:
- Voice Factory ledger > 5% supplier failures over 24 h
- Emergency cascade p50 > 30 s
- Intent-route accuracy < 85% on judge eval
- Any Golden Rule bypass attempt logged in `AuditLog`
- Any HIGH-risk corpus drift detected by Swarm validation

---

**World Class Chitti Vaani — Commando Discipline. Zero Excuses.**
