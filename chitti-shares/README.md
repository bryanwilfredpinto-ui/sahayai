🎖️ **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Technical AI — README

> **Multilingual technical stock market intelligence platform — focused exclusively on technical analysis, chart pattern recognition, risk analysis, and educational coaching. NOT fundamentals. NOT macro. NOT auto-trading.**

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_complete_technical.html |
| Health | https://chitti-shares-api-production.up.railway.app/health |
| Status | 🟢 GREEN — `chat_with_tools` rail-gated |
| Risk class | 🟡 Financial — sticky `NOT SEBI REGISTERED` bar + full legal modal mandatory |
| Users served | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, plain-English coaching |
| Languages | English + Hindi + Telugu + Tamil + Bengali + Marathi + 20 more Indian languages (auto-detect) |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_TECHNICAL_MASTER_SPEC.md](../CHITTI_TECHNICAL_MASTER_SPEC.md) |

---

## Overview

**Chitti Technical AI** is a multilingual technical stock market intelligence platform focused **exclusively** on:

- Technical analysis (RSI · MACD · EMA/SMA · Bollinger · Volume · Candlestick · Fibonacci)
- Chart breakdowns
- Pattern recognition
- Trade education
- Multilingual voice interaction
- Personalised AI coaching
- Human-like conversational UI

**The platform deliberately avoids fundamental analysis and focuses only on technical indicators and price action.** A separate companion product, [Chitti Fundamentals](https://sahayai.in/chitti_fundamentals.html), handles balance-sheet / cash-flow / management lens work — they share a backend but the two front-ends are scoped products.

## Core Features

### Technical Analysis
- **RSI** — interpretation + overbought / oversold zones
- **MACD** — crossover detection + histogram divergence
- **Volume breakout** analysis
- **Support & resistance** auto-detection
- **Trendline** drawing + breakdown alerts
- **Candlestick pattern** recognition (Doji, Hammer, Engulfing, Marubozu, …)
- **Multi-timeframe alignment** (M / W / D / 4H / 1H)

### Multilingual AI
UI automatically adapts to the user's language:
- English · Hindi · Telugu · Tamil · Bengali · Marathi · Gujarati · Kannada · Malayalam · Punjabi · Odia · Assamese · Urdu · Sanskrit · Maithili · Konkani · Dogri · Kashmiri · Nepali · Sindhi · Manipuri · Santali · Bhojpuri · Rajasthani · Kurukh · Ho

Auto-detect by browser / device locale; manual override via dropdown. Indicator names (RSI, MACD, EMA, Bollinger, Roshan, etc.) and stock tickers (RELIANCE, TCS, …) stay English in every language; verdicts and explanations translate.

### Voice-first Interface
Every response card includes:
- 🔊 **Speaker** — hear the analysis aloud
- 🎙️ **Voice replay** — re-speak with different speed / voice
- 🎤 **Microphone feedback** — correct or refine via voice
- 🤖 **Chitti avatar** — identity / personality

### User Feedback Loop
Every AI response includes:
- 👍 thumbs up
- 👎 thumbs down
- ✏️ edit feedback (text)
- 🎤 voice feedback

Feedback is stored for:
- Quality improvement
- Hallucination detection
- Coaching refinement

### Hallucination Prevention
AI is forced to:
- Refer to [SKILLS.md](SKILLS.md) capability list before answering
- Follow [SOP.md](SOP.md) 10-step procedure
- Verify technical signals against live chart data (Angel SmartAPI candles)
- Avoid guaranteed predictions (Compliance INJECT scrubs "you will make X%" / "100% sure" / "no risk")

### AI Coaching Evolution
- **Stage 1 — Technical analysis assistant.** Reads the chart, presents indicators, explains what they mean.
- **Stage 2 — Learning assistant.** Adapts explanations to user's level (beginner vs intermediate), generates lessons, tracks what the user has been taught.
- **Stage 3 — Personalised technical trading coach.** Reviews user's prior calls (Journal tab), points out repeated mistakes, suggests skill drills.

---

## Architecture

```
User
 ↓
Language Detection (chitti_lang.js + browser locale)
 ↓
Technical Analysis Agent (services/technical/ + services/indicators/)
 ↓
Verification Agent (services/agent_runtime.py — cross-checks indicator outputs against raw OHLC)
 ↓
Risk Agent (services/intraday_candles.py::_buildTradeSetupFromATR)
 ↓
Guardrails (Compliance INJECT in after_model hook)
 ↓
Response Generator (DeepSeek chat_with_tools, rail-gated)
 ↓
Voice Engine (Chitti Voice Factory — 26-lang Bhashini + community voices)
 ↓
Feedback Engine (/api/feedback/collect → shares.feedback)
 ↓
Audit + Memory Storage (shares.audit_log, 90 d hot · 7 yr cold)
```

## UI Components — every response card MUST contain

| Element | Purpose |
|---|---|
| 🤖 Chitti avatar | Identity |
| 🔊 Speaker button | Hear response |
| 🎤 Mic button | Voice feedback |
| ✏️ Pencil button | Text feedback |
| 👍 👎 | Quality rating |
| Confidence meter | AI certainty (%) |
| Risk meter | Trade risk (Low / Med / High) |
| Technical indicator summary | RSI · MACD · EMA · Vol at a glance |
| Language toggle | Manual lang switch (auto-detect default) |
| 💡 Simplify button | Beginner-friendly re-explanation |
| 📘 Learn More button | Open coaching mode for that indicator |

---

## Constraints (non-negotiable)

- **No guaranteed profits** — Compliance INJECT scrubs guarantee phrases
- **No auto-trading** — Chitti EXPLAINS; user TRADES via their own broker
- **No financial advice claims** — sticky `NOT SEBI REGISTERED` bar on every page
- **No hallucinated indicators** — every RSI / MACD / EMA value rendered must come from the verified Angel candles, not LLM imagination
- **Must validate signals from chart data** — Verification Agent re-runs the indicator math before the response leaves the rail

## Future Vision

Transform from **Technical Analysis AI** → **Personalised Technical Trading Coach**.

The Journal tab stores every call the user made, the indicators that drove it, the actual outcome, and Chitti's per-call coaching note. Over weeks, Chitti builds a profile of the user's strengths (which patterns they read well) and gaps (which they consistently misread), and converts that into targeted drills.

---

## Data sources (locked)

Yahoo Finance is **BLOCKED** from Railway IPs. The active sources are:

| Need | Source | File |
|---|---|---|
| Live quotes, intraday candles (15m / 5m / 1m), historical OHLC | **Angel SmartAPI** | [`backend/services/angel_client.py`](backend/services/angel_client.py), [`backend/services/intraday_candles.py`](backend/services/intraday_candles.py) |
| AI synthesis (technical commentary, Story Mode, Ask Chitti, coaching) | **DeepSeek** chat completions | [`backend/services/deepseek_client.py`](backend/services/deepseek_client.py) |
| Index quotes (Nifty / Sensex when NSE blocked) | Laptop pusher → `POST /debug/ingest-indices` | [`backend/main.py`](backend/main.py) |
| Yahoo Finance | LOCAL-DEV FALLBACK ONLY | [`backend/services/yahoo_client.py`](backend/services/yahoo_client.py) |
| News (per stock + market — used by coaching context, NOT signal generation) | Moneycontrol + LiveMint + BSE + NSE RSS | [`backend/services/news_client.py`](backend/services/news_client.py) |

## Stock universe (honest counts — current state)

| Bucket | Stocks today | NSE official index | Gap |
|---|---:|---:|---:|
| Nifty 50 | 50 | 50 | ✅ matched |
| Largecap | 107 | 100 (Nifty 100) | +7 |
| Midcap | 110 | 150 (Nifty Midcap 150) | -40 |
| Smallcap | 113 | 250 (Nifty Smallcap 250) | -137 |
| Microcap | 52 | 250 (Nifty Microcap 250) | -198 |

The UI shows these **actual** counts in the universe dropdown — no inflated promises. Expanding to the full NSE indices is tracked in [TODO.md](TODO.md).

## Layout

```
chitti-shares/
+- backend/                 FastAPI + SQLAlchemy + JWT + Angel + DeepSeek
|  +- config/               nifty_universe.json + stock_specialists.json
|  +- routes/               auth, user, market, stocks, technical, portfolio,
|  |                        chat, quota, specialists, cron     (10 routers)
|  +- services/             angel_client, news_client, technical, indicators,
|  |                        scanner, strength, snowflake, returns,
|  |                        rule_engine, specialist, deepseek_client,
|  |                        usage_tracker, agent_runtime, agent_tools, …
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
+- SKILLS.md                Capability ledger
+- SOP.md                   10-step operating procedure
+- ARCHITECTURE.md          Engine map, schema isolation, scheduler design
+- API.md                   Every route grouped technical / agentic / shared
+- DATABASE.md              Tables, columns, indexes, schema isolation
+- CHANGELOG.md             git-log driven history
+- TODO.md                  Outstanding spec items + universe expansion roadmap
+- PROMPTS.md               Every LLM prompt template in the codebase
+- DEPLOY_FULL.md           Canonical Railway walkthrough
```

## Production deploy

Railway Blueprint (`render.yaml`) provisions:

1. `chitti-shares-api` — FastAPI web service (cold-start friendly; `/health` is the wake-up ping).
2. `chitti-shares-web` — legacy React static site (the single-file HTMLs now serve from GitHub Pages root).

Env vars (Railway dashboard):

```
DATABASE_URL          (Supabase / Neon Postgres "Direct" string)
FAST2SMS_API_KEY      (OTP delivery)
DEEPSEEK_API_KEY      (AI synthesis)
ADMIN_MOBILE          (10-digit, no +91 — gates Kite OAuth endpoints)
CRON_SECRET           (long random; shared by ingest + cron URLs)
ANGEL_API_KEY / ANGEL_CLIENT_CODE / ANGEL_PIN / ANGEL_TOTP_SECRET   (price feed)
KITE_API_KEY / KITE_API_SECRET                                       (optional)
TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID                                 (optional)
```

---

## Quality Control System — *"how we know Chitti is trustworthy"*

### Quality Metrics

| Metric | Purpose | Where measured |
|---|---|---|
| Technical Accuracy | Correct indicator interpretation vs raw OHLC | `judge_eval/indicator_accuracy_*.json` (weekly) |
| Hallucination Rate | % responses containing a fabricated indicator value, candle, or pattern | Verification Agent → audit log (target 0%) |
| Timeframe Alignment Accuracy | Cross-timeframe consistency (Daily call agrees with Weekly trend) | `judge_eval/mtf_alignment_*.json` |
| User Satisfaction | 👍 / (👍 + 👎) on response widget | `/api/feedback/collect` → `shares.feedback` (target ≥ 85%) |
| Voice Quality | Speech clarity per user device | Voice Factory ledger feedback |
| Language Accuracy | Translation quality across 26 langs | `chitti_lang_runtime.js` user-flag rate |
| Response Latency | AI speed | `_chitti_timing_mw` (P95 < 2.5s target) |
| Confidence Reliability | Was confidence realistic vs realised outcome? | Journal tab → `shares.audit_log_archive` |
| Educational Clarity | Did the beginner understand the explanation? | Post-response "Was this clear?" widget |
| Feedback Resolution | Did Chitti improve after corrections? | Same-prompt re-ask comparison job |

### Hallucination Control — *"this is VERY important"*

**Before every analysis** Chitti MUST silently re-load:
- [SKILLS.md](SKILLS.md) — only do what's listed
- [SOP.md](SOP.md) — follow the 10 steps
- Guardrail rules (Compliance INJECT)
- Verified Technical Data Only (Angel candles, not LLM memory)

A response that names a candle/pattern/value not present in the underlying OHLC frame is a P0 defect — Verification Agent rejects it and the rail returns an honest "I cannot verify that from the data" instead.

### Enterprise Safety Layer

| Layer | Purpose | Code |
|---|---|---|
| Guardrails | Prevent fake claims (guarantee phrases, fake SEBI registration) | `agent_runtime.py::after_model_inject` |
| Verification Agent | Re-check signals against raw OHLC before reply leaves rail | `services/agent_runtime.py::verify_response` |
| Audit Logs | Permanent record of who-asked-what-when (90 d hot, 7 yr cold) | Turso `shares.audit_log` |
| Observability | Monitor failures, latency, cost | `_chitti_timing_mw` + `chitti_obs` |
| Feedback Engine | Learn from user 👍/👎/edits/voice | `/api/feedback/collect` |
| Human Override | Manual corrections promoted to skills (Swarm Intelligence) | Sire review → `skills/*.md` |
| Confidence Scoring | Reduce overconfidence — Verification + MTF alignment lowers conf if signals conflict | `agent_runtime.py::compose_confidence` |

---

## UI Vision

> **Bloomberg Terminal + Duolingo + Jarvis + TradingView** — combined.

- **Bloomberg Terminal** — dense indicator panel, professional polish, fast keyboard nav.
- **Duolingo** — gamified learning, beginner-friendly progression, "Why did this signal form?" micro-lessons.
- **Jarvis** — voice-first ("Chitti, show me Reliance daily"), conversational, ambient.
- **TradingView** — chart-first, pattern overlays, multi-timeframe split view.

---

## Standing rules

- **NOT SEBI Registered** sticky banner + full-legal modal — never moved to footer.
- **Four-user contract**: Blind, Deaf, Mute, Illiterate — voice IN + voice OUT + symbols + plain English, never colour-only.
- **iloc[-2] only** for the last *closed* candle in every indicator computation; never `[-1]` (in-progress).
- **Free-tier sources only** — no Bloomberg / Refinitiv / Tickertape API.
- **Technical only** — never wander into fundamentals / management lens / macro. That's [Chitti Fundamentals'](https://sahayai.in/chitti_fundamentals.html) job.

---

> **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**
