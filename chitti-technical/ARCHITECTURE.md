🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Technical

## The pipeline

```
                 User (via Chitti Vaani — sole interface)
                              │
                              ▼
                  ┌───────────────────────┐
                  │   TECHNICAL ENGINE     │  deterministic
                  │  candles → indicators  │  (no LLM)
                  │  (43+) + Roshan        │
                  └───────────┬───────────┘
                              ▼
                  ┌───────────────────────┐
                  │     SWARM LAYER        │  10 agents score in parallel
                  │  Trend · Momentum ·    │  (Trend/Momentum/Volume/Pattern/
                  │  Volume · Pattern ·    │   Roshan/Risk; Confluence/Trust/
                  │  Roshan · Risk · …     │   Accessibility/Explain synthesize)
                  └───────────┬───────────┘
                              ▼
                  ┌───────────────────────┐
                  │  CONFLUENCE ENGINE     │  weighted multi-timeframe vote
                  │  higher TF governs     │  → BUY / SELL / HOLD + confidence
                  └───────────┬───────────┘
                              ▼
                  ┌───────────────────────┐
                  │     TRUST LAYER        │  hard checks: stop present?
                  │  guardrails + SEBI +   │  RR valid? disclaimers? no
                  │  no-hallucination gate │  invented numbers? → can BLOCK
                  └───────────┬───────────┘
                              ▼
                  ┌───────────────────────┐
                  │     CHITTI EXPLAIN     │  DeepSeek phrases the verdict
                  │  numbers → plain lang  │  in the user's language
                  └───────────┬───────────┘
                              ▼
                  ┌───────────────────────┐
                  │       UI LAYER         │  responsive cards · charts ·
                  │  5-element box · ISL · │  5-element box · audio summary
                  │  voice · 9-lang UI     │  · NOT SEBI REGISTERED bar
                  └───────────────────────┘
```

### Why this order matters

- The **engine is deterministic** — indicators and Roshan are pure math. The LLM
  is downstream of the decision, so a DeepSeek outage degrades *phrasing*, never
  *correctness*. (Doctrine inherited from chitti-news-ai / chitti-fashion: *rules
  are the product, the LLM is an enhancement.*)
- The **Trust Layer sits between the decision and the explanation** — it can
  block a signal (missing stop, broken RR, hallucinated level) *before* Chitti
  Explain ever phrases it. A blocked signal becomes an honest "no clean trade."

## Components

| Layer | Where it lives | Notes |
|---|---|---|
| Data / candles | `chitti-shares-api` services (`angel_client`, `nse_client`, `intraday_candles`) | Manual-refresh only; "data as of" stamp surfaced to UI. |
| Indicators | extracted from `chitti-shares/backend/services/indicators.py` + `technical.py` + `strength.py` → [indicators/INDICATORS.md](indicators/INDICATORS.md) | Pure Python, 50–500 candles. |
| Roshan | [indicators/ROSHAN.md](indicators/ROSHAN.md) | Custom composite. |
| Multi-timeframe / confluence | [scanners/SCANNER.md](scanners/SCANNER.md) | Resolves the F2 ladder. |
| Swarm | [swarm/](swarm/) | 10 agents, weighted vote. |
| Trust / guardrails | [guardrails/](guardrails/) | Hard gates. |
| Explain | DeepSeek via `chitti-vaani-api` | Sole LLM. |
| UI | `chitti_technical.html` (parity) + Vaani (canonical) | [ui/UI.md](ui/UI.md). |
| Memory | on-device `localStorage` first | [memory/](memory/). |
| Observability | `lib/observability.py` + founder report | [observability/](observability/). |

## Data sources (locked, [SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md))

- **Angel** for prices/candles · **screener.in** for fundamentals (market-cap
  tiering) · **Yahoo BLOCKED from Railway** (`yahoo_client` = local-dev fallback only).
- NSE/BSE candles refresh at session close (15:30 IST) **and on manual request**.

## Refresh model (Sire's 2026-06-06 decision)

- **Manual only.** No polling, no websockets, no auto-tick. A visible **Refresh**
  control fetches the latest candles/quote on demand and updates the "data as of"
  stamp. Rationale: honest 2G-data + battery cost, and it forces a deliberate
  decision rather than reactive screen-watching (Founder Rule #5).

## Backend

Reuses **`chitti-shares-api`** (the existing technical engine already lives
there). Chitti Technical is the CEOS productisation + UI + swarm/explain layer on
top of that engine — not a new Flask app. Endpoints under the existing
`/technical/*`, `/market/*`, `/stocks/*` routes; new screener/Roshan/multi-TF
endpoints added there.

## Dismantle of the legacy UI (DONE 2026-06-06)

Per Sire's order, the legacy 7,447-line monolith `chitti_complete_technical.html` is
**dismantled**: archived to [_legacy/chitti_complete_technical.legacy.html](_legacy/) and the
root URL replaced by a redirect to the rebuilt `chitti_technical.html`. Only the **technical
indicators** from its scanner section are kept (ported into `chitti_technical_engine.js`). The old
React technical surface in `chitti-shares/frontend` is not the canonical UI any longer — the new
standalone product is.

## Rollback plan

- The legacy monolith is preserved in [_legacy/](_legacy/) (full git history via `git mv`).
  Rollback = restore that file to the root path. Cutover is a single redirect swap.
- The deterministic engine is versioned; a bad indicator change reverts by git
  revert of the engine commit without touching the UI.
- DeepSeek/Explain is non-critical: if a new prompt regresses, disable Explain
  enhancement (templated fallback) without taking down the signal.

## Failure modes (summary; detail in [observability/logs.md](observability/logs.md))

| Failure | Behaviour |
|---|---|
| Data feed down / stale | "Data as of <old timestamp> — refresh failed; signal withheld." Never a stale verdict shown as fresh. |
| Too few candles | "Not enough history to judge this timeframe." |
| Indicator NaN / warmup | That indicator abstains from the vote; never counted as 0. |
| Timeframes disagree | HOLD/WAIT with the disagreement explained. |
| DeepSeek down | Templated deterministic explanation. |
| Trust layer blocks | Honest "no clean trade" + the reason. |

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
