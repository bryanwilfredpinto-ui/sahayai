🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ARCHITECTURE — how Chitti Technicals is wired (reuse, not rebuild)

> Level 2. Subordinate to [CONSTITUTION.md](CONSTITUTION.md). Doctrine (Art. 6–7): **rules are the product, the LLM is an enhancement.** The deterministic engine carries the value; DeepSeek only phrases and cites.

---

## 1. The layers

| Layer | What | Where |
|---|---|---|
| **Client (offline-capable)** | Static page + the deterministic engine. Computes RSI/MACD/ATR/Roshan/confluence/risk **in the browser, no network needed** | `../chitti_technical_ai.html` + [`../chitti_technical_engine.js`](../chitti_technical_engine.js) (`window.TechEngine`) + service worker `../chitti_technical_sw.js` |
| **Data API** | NSE/BSE multi-TF candles | `chitti-shares-api` → `/api/historical` |
| **Market feed** | Real OHLCV candles per timeframe | Angel One SmartAPI |
| **Store** | Dual journal (system signals + paper trades) | Turso (libSQL, direct-HTTPS shim) |
| **Warm layer (v2)** | Vernacular narration of the deterministic verdict — **phrasing only** | DeepSeek (OpenAI-compatible) |
| **Front door** | The user never opens the page — they ask **Vaani** | Vaani (sole interface, SAHAYAI_MASTER §2 row 1) |

The engine is **zero-dependency** and dual-target (`window.TechEngine` in the browser, `module.exports` in Node) — so every number is unit-testable without a browser or a network (`tools/test_technical*.mjs`).

## 2. Data flow

```
   ┌─────────┐   "Reliance ka chart"   ┌──────────────────────┐
   │  USER   │ ──────────────────────▶ │        VAANI         │  (sole interface; v2 routing)
   └─────────┘                         └──────────┬───────────┘
                                                  │ technical intent
                                                  ▼
                            ┌─────────────────────────────────────┐
                            │   CHITTI TECHNICALS (static client)  │
                            │   chitti_technical_ai.html           │
                            │   + chitti_technical_engine.js       │
                            └───────┬───────────────────┬─────────┘
            live candles (v2)       │                   │   offline / fallback
        ┌───────────────────────────▼──────┐            ▼
        │ chitti-shares-api /api/historical │   genAllTf(symbol)  → DEMO candles
        └───────────────┬──────────────────┘     (labelled "DEMO — tap Refresh")
                        │
                        ▼
              Angel One SmartAPI   (NSE/BSE OHLCV, multi-TF)
                        │
                candlesByTf = { monthly, weekly, daily, '4h', '1h', ... }
                        │
                        ▼
        ┌──────────────────────────────────────────────────────┐
        │  DETERMINISTIC ENGINE (the product)                   │
        │  confluence(candlesByTf, tradeType)  → higher TF gov.  │
        │  scan(candlesByTf, {tradeType})      → verdict block   │
        │  riskBlock(...)  NO stop → NO signal → downgrade HOLD  │
        │  roshan(closes)  · indicatorSet(candles) · Tip Shield  │
        └──────────────┬───────────────────────┬───────────────┘
                       │ verdict + cites        │ outcomes
                       ▼                        ▼
        ┌──────────────────────────┐   ┌─────────────────────────┐
        │ DeepSeek (v2): PHRASE     │   │ Turso: dual journal     │
        │ ONLY — never a number     │   │ (signals + paper trades)│
        └──────────────┬───────────┘   └─────────────────────────┘
                       ▼
        4-channel verdict box (voice · text · icon+shape · ISL)
        + vote tally + MMI mood + risk-first + honesty rail + widget
```

**Critical invariant:** DeepSeek is **never on the path of a number, a stop, a position size, or a crisis response** (Art. 6). It receives the engine's already-computed `scan()` result and renders it in the user's language. If DeepSeek is down/off, the engine's deterministic `explain()` template renders the same verdict.

## 3. Engine contract (the real surface — see [SKILLS.md](SKILLS.md))

- `scan(candlesByTf, {tradeType, riskBudget})` → `{ verdict, confidence, confluence_score, why, timeframes, contributing[], contradicting[], roshan, entry, stop, targets, position_size, invalidation, risk_downgraded, disclaimer }`
- `tradeType ∈ longterm | positional | swing | intraday` selects a `LADDERS` row (higher TF governs the trigger TF).
- `riskBlock()` is consulted inside `scan()`: no clean stop or RR below floor → verdict **downgraded to HOLD**.

## 4. Rollback plan

| Failure | Detection | Rollback |
|---|---|---|
| Angel One feed dies | `/api/historical` non-200 | client falls back to `genAllTf()` DEMO candles, **labelled DEMO** — never silently shows stale data as "live" |
| chitti-shares-api down | health curl fails | same DEMO fallback; banner "live data unavailable" |
| DeepSeek down / unfunded | LLM call errors/absent | deterministic `explain()` template narrates; verdict unchanged (engine is source-of-truth) |
| Engine regression | `tools/test_technical*.mjs` gold fails in CI | block deploy; revert engine to last GREEN tag (engine is versioned: `VERSION` in API) |
| Turso write fails | journal write error | queue locally (IndexedDB), retry; verdict path unaffected (journal is audit, not gate) |
| Page regression | `cert_chitti_technical_ai.mjs` not GREEN + 5-device screenshots | block ship (Art. 12) |

Because the engine is static and offline-capable, **the core read keeps working even when every backend is down** — only live data and vernacular warmth degrade, never correctness.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
