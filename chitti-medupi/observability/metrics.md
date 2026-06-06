CEOS Level 10 — Observability: Metrics

Authored 2026-06-06

> What MedUPI measures, what it pointedly does not, and where each number comes
> from. All metrics are anonymised, aggregate, and on-device-first — never a
> per-user time-series on a medicine query.

Companion docs: [observability/logs.md](logs.md) · [skills/OBSERVABILITY.md](../skills/OBSERVABILITY.md) · [guardrails/privacy.md](../guardrails/privacy.md) · QUALITY_STATUS.md §1 (the quality stack) · CHITTI_SOP.md §2 (success metric).

---

## 1. North-star + success metrics (CHITTI_SOP §2)

| Metric | Target | Source |
|---|---|---|
| **₹ saved per cart vs branded equivalent** (north star) | maximise | `WalletEntry.savings_realized` → `wallet_report` monthly/annual |
| Same-composition match rate | maximise; **zero cross-molecule leakage** as a hard floor | strict-match harness `tools/test_medupi_samples.py` |
| Expiry-reminder follow-through rate | improve over baseline | `Reminder.status` transitions (active→done) |
| Per-response 👍 rate | ≥ 80% (platform target) | feedback-widget per box |

Measured baseline today (`tools/test_medupi_samples_result.json`): **25/25** samples pass · **leaks=0** · **over_ceiling=0** · savings **67–78%** on Jan-Aushadhi-vs-branded deltas. These are the only hard, machine-verified numbers — everything else above is a target.

---

## 2. The quality stack (how it is wired)

Per [QUALITY_STATUS.md §1 row chitti-medupi](../../QUALITY_STATUS.md), the backend is GREEN across the quality axes:

| Axis | Where | What it produces |
|---|---|---|
| **Observability** | `main.py:161` — `Observability(chitti="chitti-medupi", engine=engine)` | per-request `quality_audit(kind="http")` rows |
| **Quadrails** | `main.py:163` — 4 rails (relevance / safety / truth / compliance) | rail decisions logged; refusals short-circuit |
| **wrap_llm** | `medupi_recognition.py:185–193` | wraps the DeepSeek vision call; `compliance_inject=False` so JSON isn't corrupted (disclaimer rides `speak_*`) |
| **SLA timing** | `main.py:168` — `install_request_timing` | `x-chitti-response-time-ms` response header |
| **Swarm** | `lib/swarm.py` + founder cron Sun 09:00 IST | HIGH-risk proposals land in `SWARM_PROPOSED.md` (Sire approves) |
| **HookRegistry** | `app.config["CHITTI_HOOKS"]` | the registry `wrap_llm` pulls per-request |

The vision path degrades gracefully: outside a Flask request (CLI/tests) `current_app` raises and the call runs un-wrapped; a rail block surfaces as `_error: blocked:<rail>:<reason>` ([guardrails/hallucination.md §6](../guardrails/hallucination.md)).

---

## 3. Per-request latency

- **Header:** every API response carries `x-chitti-response-time-ms` (installed by `install_request_timing`, `main.py:168`).
- **Curl-verified** in production: `curl -sI https://chitti-medupi-api-production.up.railway.app/health` → `HTTP 200` + `x-chitti-response-time-ms` header present (QUALITY_STATUS §5).
- Target: median user-facing lookup < 3 s warm (Railway free-tier cold start ~30 s — kept warm by the UptimeRobot 5-min cadence during business hours).

---

## 4. Savings, match rate, audit

| What | How measured | Stored |
|---|---|---|
| Savings achieved | `price_paid − cheapest_equivalent_price`, only when positive | `WalletEntry.savings_realized` |
| Match rate | hits per strict-match query | `medupi.search_log` (timestamp, brand/salt/strength/form, hit count, response time) |
| Audit rows | one per HTTP request | `quality_audit(kind="http")` via Observability |
| Per-response 👍/👎 | feedback-widget tagged to box ID | `quality_feedback` (Turso) → Founder dashboard daily |

---

## 5. Explicitly NOT tracked

Founder Rule — we never measure addiction:

- **No** time-in-app, session count, or "engagement."
- **No** per-user medicine time-series.
- **No** Google Analytics custom dimensions / Mixpanel / Amplitude / Segment on health events ([skills/OBSERVABILITY.md §6](../skills/OBSERVABILITY.md)).

Only aggregate counts leave a user's scope: total queries today, top-N searched salts (by salt, not user), Jan Aushadhi coverage gaps by district.

---

## 6. Trust strip + Founder dashboard

The page surfaces a trust strip (risk badge · last audit · "helped today") via feedback-widget; full status at **sahayai.in/founder** ([skills/OBSERVABILITY.md §7](../skills/OBSERVABILITY.md)): live `/health` colour-**and**-symbol (never colour-only), latest loader-run timestamps per source, today's query volume, today's degraded-provider count, open P0/P1 from TODO.md.
