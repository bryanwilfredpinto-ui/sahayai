🎖️ **World Class Chitti Stock AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Bharat-themed agentic Technical + Fundamentals · **Roshan Indicator (Sire's proprietary composite)** · 43 indicators · Story Mode · sticky `NOT SEBI REGISTERED` bar · Angel One / Zerodha-class scanner skeleton, retail-investor UX.

**Product name** — Chitti Stock AI (front-end label on `chitti_complete_technical.html` since 2026-05-29). Repo / API still named `chitti-shares` for historical continuity.

| Field | Value |
|---|---|
| Live URL — Chitti Stock AI (Technical) | https://sahayai.in/chitti_complete_technical.html |
| Live URL — Fundamentals | https://sahayai.in/chitti_fundamentals.html |
| Health | https://chitti-shares-api-production.up.railway.app/health |
| Status | 🟢 GREEN — `chat_with_tools` rail-gated post commit #2 |
| Risk | 🟡 Financial — sticky `NOT SEBI REGISTERED` bar + full legal modal mandatory |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, Story Mode |
| Languages | English + 9 Indian languages |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §10](../CHITTI_SOP.md) · [CHITTI_TECHNICAL_MASTER_SPEC.md](../CHITTI_TECHNICAL_MASTER_SPEC.md) · [CHITTI_FUNDAMENTALS_MASTER_SPEC.md](../CHITTI_FUNDAMENTALS_MASTER_SPEC.md) |

---

# Chitti Shares

Indian equities backend that powers **two** Chitti front-ends from a single FastAPI service:

| Frontend (repo root) | Live URL | Persona |
|---|---|---|
| [`chitti_fundamentals.html`](../chitti_fundamentals.html) | https://sahayai.in/chitti_fundamentals.html | Patient teacher (Buffett / Lynch / Graham / Greenblatt lenses) |
| [`chitti_complete_technical.html`](../chitti_complete_technical.html) | https://sahayai.in/chitti_complete_technical.html | Fast technical trader (Roshan Indicator + 43 indicators) |

Backend service: `https://chitti-shares-api-production.up.railway.app`

## Data sources (locked)

Yahoo Finance is **BLOCKED** from Railway IPs. The active sources are:

| Need | Source | File |
|---|---|---|
| Fundamentals, financials, shareholding, CAGR inputs | **screener.in** scrape | [`backend/services/screener_client.py`](backend/services/screener_client.py) |
| Live quotes, intraday candles (15m / 5m / 1m), historical OHLC | **Angel SmartAPI** | [`backend/services/angel_client.py`](backend/services/angel_client.py), [`backend/services/intraday_candles.py`](backend/services/intraday_candles.py) |
| News (per stock + market) | **Moneycontrol + LiveMint + BSE + NSE RSS** | [`backend/services/news_client.py`](backend/services/news_client.py) |
| AI synthesis (Chitti's View, Story Mode, Ask Chitti, agentic loops) | **DeepSeek** chat completions (migrating off Anthropic) | [`backend/services/deepseek_client.py`](backend/services/deepseek_client.py) |
| Index quotes (Nifty / Sensex when NSE/Yahoo blocked) | Laptop pusher → `POST /debug/ingest-indices` | [`backend/main.py`](backend/main.py) |
| Yahoo Finance | LOCAL-DEV FALLBACK ONLY | [`backend/services/yahoo_client.py`](backend/services/yahoo_client.py) |

## What ships today

- 60+ HTTP routes split across `routes/` and the agentic `main.py` entry endpoints
- Mobile-OTP auth + JWT refresh + 2-device-per-user enforcement (Phase 1)
- Live Nifty/Sensex + Chitti Market View (Phase 2)
- Fundamentals scorecard (A+ to F) + 8-quarter results + star rating (Phase 3)
- Roshan Indicator + 43 technical indicators + custom rule DSL + call reports (Phase 4)
- Watchlist + alerts + Portfolio Doctor + Chitti AI Chat + Hindi UI (Phase 5)
- 10 per-stock specialists + ATR trade plans + multi-TF consensus + saved rules + quota tracking + AI portfolio insights (Phase 6)
- Phase 7 agentic surface: `/api/agent/technical/ask`, `/api/agent/fundamental/ask`, `/api/agent/medupi/ask` (true DeepSeek tool-calling loop)
- Phase 7 compute-only differentiators: 5D Snowflake radar, Confidence Dial, Risk-Fit Dial, Performance vs NIFTY, Returns calculator
- Universe scanner (Roshan + 43 indicators) across 5 universes (NIFTY 50 / Largecap / Midcap / Smallcap / Microcap)
- Strategy screener with 30+ investor-lens slugs (Buffett / Lynch / Graham / Greenblatt / Munger / Pabrai / Marks / RJ / Kedia / RKD / RMD / NS / HDFC / Mirae / Motilal / etc.)
- Per-call DeepSeek quota tracking (soft cap ₹50 / day, hard cap ₹100 / day, IST reset)
- In-process APScheduler (replaced paid Railway cron jobs)
- MedUPI endpoints co-hosted in this service (sibling product, separate Neon DB)

## Layout

```
chitti-shares/
+- backend/                 FastAPI + SQLAlchemy + JWT + Angel + screener + DeepSeek
|  +- config/               nifty_universe.json + stock_specialists.json
|  +- routes/               auth, user, market, stocks, technical, portfolio,
|  |                        chat, quota, specialists, cron     (10 routers)
|  +- services/             angel_client, screener_client, news_client,
|  |                        technical, indicators, scanner, strength,
|  |                        snowflake, returns, fundamentals_extras,
|  |                        fundamental_scanner, scorecard, rule_engine,
|  |                        specialist, deepseek_client, usage_tracker,
|  |                        cache, deps, auth_helpers, otp_sender,
|  |                        symbol_resolver, stock_universe, levels,
|  |                        intraday_candles, scheduler,
|  |                        agent_runtime, agent_tools,
|  |                        medupi_* (sibling)
|  +- models/               user, device, kite_token, stock, quota,
|  |                        stock_universe, index_quote, _schema
|  +- main.py               app entry; public + Phase 7 endpoints live here
|  +- database.py           engine + Base + ensure_schema('shares')
|  +- config.py             pydantic Settings (env vars)
|  +- requirements.txt
|  L- runtime.txt
+- frontend/                React 18 + Vite + Tailwind (legacy; replaced by single-file HTML)
+- render.yaml              Blueprint: backend (web) + frontend (static)
+- README.md                <- you are here
+- CONTEXT.md               Why this product exists + accessibility contract
+- ARCHITECTURE.md          Engine map, schema isolation, scheduler design
+- API.md                   Every route grouped fundamentals / technical / shared
+- DATABASE.md              Tables, columns, indexes, schema isolation
+- CHANGELOG.md             git-log driven history
+- TODO.md                  Outstanding spec items + code TODOs
+- PROMPTS.md               Every LLM prompt template in the codebase
+- DEPLOY_FULL.md           Canonical Railway walkthrough
+- DEPLOY_PHASE1..3-5.md    Historical phase guides
```

## Production deploy

Railway Blueprint (`render.yaml`) provisions:

1. `chitti-shares-api` — FastAPI web service on the Railway free tier (cold-start friendly; `/health` is the wake-up ping).
2. `chitti-shares-web` — legacy React static site (the single-file HTMLs now serve from GitHub Pages root).

Manual env vars to set in the Railway dashboard:

```
DATABASE_URL          (Supabase / Neon Postgres "Direct" string)
FAST2SMS_API_KEY      (OTP delivery)
DEEPSEEK_API_KEY      (AI synthesis)
ADMIN_MOBILE          (10-digit, no +91 — gates Kite OAuth endpoints)
CRON_SECRET           (long random; same value used by ingest + cron URLs)
ANGEL_API_KEY / ANGEL_CLIENT_CODE / ANGEL_PIN / ANGEL_TOTP_SECRET   (price feed)
KITE_API_KEY / KITE_API_SECRET                                       (optional)
TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID                                 (optional)
```

`DATA_SOURCE=yahoo` is the default but is effectively bypassed by `screener_client` + `angel_client` paths because Yahoo is IP-blocked from Railway.

## Standing rules

- **NOT SEBI Registered** sticky banner + full-legal modal — never moved to footer (see [`project_legal_disclaimer.md`](../memory)).
- **Four-user contract**: Blind, Deaf, Mute, Illiterate — voice IN + voice OUT + symbols + plain English, never colour-only.
- **Investor lens always declared** on every fundamentals verdict.
- **iloc[-2] only** for the last *closed* candle in the Roshan rule; never `[-1]` (in-progress).
- **Free-tier sources only** — no Bloomberg / Refinitiv / Tickertape API.

---

## 🛡️ Chitti Stock AI — 9-Layer Architecture (Sire 2026-05-29)

Every Chitti — including Chitti Stock AI — runs on the **same 9-layer agentic stack**. This section is the canonical reference for Stock AI; other Chitti docs cross-link here.

### Layer 1 · Agent

- **Identity** — "Chitti Stock AI is your patient market companion. It explains, it never advises."
- **Role** — Reads NSE / BSE candles + fundamentals + news → composes Roshan Indicator + 43 indicators → narrates Story Mode in user's language.
- **Boundaries** — `chat_with_tools` rail-gated; refuses buy/sell prescriptions; routes every side-effecting call through `chittiConfirmAndDo()`.
- **Code** — `backend/main.py` (`/api/agent/technical/ask`), `backend/services/agent_runtime.py`, `backend/services/agent_tools.py`.

### Layer 2 · README.MD

- **Purpose** — One-page entry point: what it does · where it lives · who runs it.
- **You are reading it.** Keep ≤ 200 lines. Detail belongs in `ARCHITECTURE.md` / `API.md` / `CHITTI_TECHNICAL_MASTER_SPEC.md`.

### Layer 3 · SKILLS.MD

- **Purpose** — Capability ledger. Every shippable feature flagged ✅ / 🟡 / ⬜ with Tested-By + Date.
- **Spec** — Roshan composite, 43 indicators, Story Mode, ATR trade plans, 9-profession news lens, voice readout 26 langs, per-response widget.
- **Code reference** — [`SKILLS.md`](SKILLS.md).

### Layer 4 · SOP.MD

- **Purpose** — Operating procedure: how to scan, when to refresh, what triggers escalation.
- **Critical SOP** — `iloc[-2]` rule, screener.in quarterly refresh cadence, Angel 15:30 IST close-of-session cron, DeepSeek quota tracking.
- **Code reference** — [`SOP.md`](SOP.md).

### Layer 5 · Quality Measures

| Metric | Target | Measured by |
|---|---|---|
| Accuracy — Roshan directional correctness over N days | ≥ 60% | `judge_eval/roshan_directional_*.json` weekly |
| Speed — `/api/scan/roshan` P95 latency | < 2.5 s | `chitti_obs` middleware → `_chitti_timing_mw` |
| Hallucination rate — Story Mode fabricates a stock event | 0% | judge audit on every Story Mode output (sample N=50/wk) |
| Reliability — `/health` uptime | ≥ 99.5% / 30-day | Layer-1 self-ping cron in `chitti-founder` |
| User satisfaction — 👍 / (👍+👎) on response widget | ≥ 85% | `feedback-widget.js` → `/api/feedback/collect` |
| Safety — % responses with SEBI disclaimer present | 100% | Compliance INJECT in `after_model` hook |
| Cost — DeepSeek spend per active user / day | ≤ ₹2.0 | `usage_tracker.py` daily roll-up |

### Layer 6 · Guardrails

**Hard refusals** — non-negotiable, baked into the rail-gate:

1. **Never guarantee profits** — Compliance INJECT scrubs phrases like "you will make X%", "this is going to ₹Y", "100% sure", "no risk".
2. **Never leak user data** — watchlist / call history / preferences scoped to JWT subject; `agent_tools.py` refuses cross-user queries.
3. **Never auto-trade** — no broker integration, no order routing. EXPLAIN only.
4. **Never bypass SEBI bar** — every response surface carries `NOT SEBI REGISTERED` banner OR per-section warning (see `chitti_complete_technical.html` line ~5664).
5. **Never claim SEBI registration** — Compliance INJECT scrubs "registered advisor", "SEBI certified", "RIA".
6. **Never recommend leverage / F&O for beginners** — Story Mode prefixes risk disclaimer when leveraged products appear.
7. **Always mention risk** — every Roshan call ends with "Past indicator triggers do not predict future returns."
8. **Golden Rule** — every side-effecting action (watchlist save, alert create, story-mode subscription) gates on `chittiConfirmAndDo()`; SAHAYAI_MASTER §2g.

### Layer 7 · Observability

| Signal | Where it lands | TTL |
|---|---|---|
| Request logs (path, status, latency, JWT sub, cost) | `_chitti_timing_mw` → Turso `shares.audit_log` | 90 d |
| Error logs (stack + request_id) | Sentry-compatible JSON to stdout → Railway log | 30 d |
| DeepSeek cost per call | `usage_tracker.py` → `shares.quota` | 365 d |
| Speed buckets (P50/P95/P99 per endpoint) | `chitti_obs` rollup, hourly | 30 d |
| Workflow trace — agentic tool turns | `record_tool_call(phase, args, result)` → `shares.tool_audit` | 90 d |
| 👍 / 👎 per response box | `/api/feedback/collect` → `shares.feedback` | 365 d |
| Roshan call → realised P&L (back-test) | `judge_eval/roshan_*.json` | permanent |

### Layer 8 · Audit

- **Permanent history** of who-asked-what-when, immutable, indexed by user JWT sub + day.
- **What's logged** — input prompt (hashed), tool calls fired, retrieved data sources, final response, compliance INJECT applied (y/n), 👍/👎 received.
- **Where it lives** — Turso `shares.audit_log` (Mumbai region). Replicated nightly to `shares.audit_log_archive` (cold).
- **Retention** — 90 d hot, 7 yr cold (matches SEBI record-keeping recommendation for advisory adjacent products even though we are NOT SEBI registered — defensive posture).
- **Access** — Sire-only via `/api/admin/audit/*` gated by `ADMIN_MOBILE` env var.

### Layer 9 · Swarm Intelligence

Chitti Stock AI composes verdicts from **multiple sub-agents** then combines:

| Sub-agent | Job | Code |
|---|---|---|
| 📰 News Agent | Pulls Moneycontrol / LiveMint / BSE / NSE RSS for the stock; surfaces sentiment-tagged top 3 stories | `services/news_client.py` |
| 📊 Technical Agent | Runs Roshan composite + 43 indicators; outputs directional pill + confidence | `services/technical/*.py` + `services/indicators/*.py` |
| 🌍 Macro Agent | Layers Nifty trend + sector strength + FII/DII flow context | `services/strength.py` + `services/scanner.py` |
| ⚠️ Risk Agent | ATR-based stop loss + target + R:R suggestion + drawdown guard | `services/intraday_candles.py::_buildTradeSetupFromATR` |
| 🏛️ Fundamentals Agent | screener.in scorecard A+ to F + 8-quarter results context | `services/screener_client.py` + `services/scorecard.py` |
| 🧠 Combine | Weighted ensemble (Roshan 40% / News 15% / Macro 15% / Risk 15% / Fundamentals 15%) → final Stock AI verdict | `services/agent_runtime.py::compose_verdict` |

**Swarm learning** (SAHAYAI_MASTER §2f) — across all Stock AI users, 👍/👎 reversals on identical calls feed a daily pattern-detect job; ≥ 100 corroborating confirmations promote a tweak to `skills/*.md` for human review.

---
