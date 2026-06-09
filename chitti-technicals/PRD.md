🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# PRD — Product Requirements for Chitti Technicals (v1)

> Level 2 product law. Subordinate to [CONSTITUTION.md](CONSTITUTION.md) and the SAHAYAI_MASTER §2 locks. Scope is **honest read + guardian**, never a signal-pusher. Reuses the deterministic engine [`../chitti_technical_engine.js`](../chitti_technical_engine.js) (`window.TechEngine`) — we wire, we do not re-author the math.

---

## 1. Problem (the one we exist to fix)

~15 crore Indians hold shares; far more are *cold-called or WhatsApp-pitched* a "tip." No chart tool on earth speaks a verdict to a **blind** user, mirrors it for a **deaf** user, lets a **mute** user tap-and-approve, or carries it by voice for an **illiterate** user in their dialect. And every existing app's incentive is *more trades*. SEBI's data: ~70% of intraday traders lose; 9 of 10 F&O traders lose ~₹1.1 lakh each. We invert the incentive — **understand first, protect always, trade never urged** (CONSTITUTION Founder Rule).

## 2. In scope — v1 (must ship, all four-user-accessible)

| # | Capability | Engine surface (real) |
|---|---|---|
| 1 | **Read any NSE/BSE stock by voice** ("Chitti, Reliance ka chart") | `genAllTf(symbol)` (demo candles offline) → `scan(candlesByTf, {tradeType})` |
| 2 | **Four-channel verdict** (voice · text · icon+shape · ISL) — never colour-only | `scan().verdict` ∈ Strong-Buy…Strong-Sell, mapped to ▲▲/▲/■/▼/▼▼ + word + voice |
| 3 | **Multi-TF confluence** (higher TF governs the trigger TF) | `confluence(candlesByTf, tradeType)` · `LADDERS` (longterm/positional/swing/intraday) |
| 4 | **Roshan composite** (RSI14 vs SMA20-of-RSI14 → BUY/SELL/WAIT) — Sire's signature | `roshan(closes)` ([skills/roshan.md](skills/roshan.md)) |
| 5 | **ATR risk block** — NO stop → NO signal; risk shown before reward | `riskBlock(candles, side, rrFloor, riskBudget)` ([skills/risk_engine.md](skills/risk_engine.md)) |
| 6 | **Tip Shield** — paste a forwarded "tip" → deterministic scam-pattern check | `hasBannedPhrase()` + Tip Shield patterns ([skills/tip_shield.md](skills/tip_shield.md)) |
| 7 | **Dual paper journal** (system signals + user paper trades) + AI insights after 10 | `backtestJournal` / `aiInsights` — paper only, never a real order |
| 8 | **26-language** delivery via `chitti_lang.js`; RSI/MACD/EMA/NSE/Nifty stay English | `#lang-select` re-render; proper-nouns frozen (Art. 9) |
| 9 | **9 archetypes** served (blind/deaf/mute/illiterate/elderly/low-vision/cognitive/motor/rural) | every verdict 100% recoverable with sight OR sound removed (Art. 2) |

The 7 CEOS verdict indicators: **RSI · Williams %R · Stochastic · Bollinger** ship in the engine today; **Camarilla pivots · Classic pivots · S/R-confluence zones** were the BO6 additions and **are now also in the engine** (`camarillaPivots`, `classicPivots`, `srConfluence` — see those skill docs).

## 3. Out of scope — never (v1 *or* later)

- ❌ **Real order placement / routing / holding** — paper journaling only (CONSTITUTION Art. 3). Chitti is not a broker.
- ❌ **Options / F&O** — where 9 of 10 lose; we will not hand leveraged derivatives to a first-time vernacular user.
- ❌ **Crypto** — out of mandate; NSE/BSE cash equity only (Art. 9).
- ❌ **Fabricated accuracy %** — no "92%/95%" claims (Art. 4; REJECT list in [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)).

## 4. Deferred to v2 (honest stubs / blocked on Sire)

- 🔵 **DeepSeek warm layer** — narrate the deterministic verdict in dialect (LLM phrases only, never originates a number). Blocked on DeepSeek funding.
- 🔵 **Live Angel One feed** — replace demo candles with `/api/historical` multi-TF candles. Blocked on Angel One keys.
- 🔵 **Vaani routing** — `technical` intent on the Vaani relevance rail (the canonical front door). Blocked on Vaani allowlist.

(All three = BO12 in [BUILD_ORDER.md](BUILD_ORDER.md), the single Sire-blocked item.)

## 5. User stories

1. **Blind** — "I hold Reliance and I'm scared. Read me the chart." → Chitti speaks a one-sentence verdict, sonifies the price line, offers "show data as table." Verdict recoverable with the screen off.
2. **Deaf** — sees the ▲▲ shape + the word "Strong Buy" + the vote tally "11 say Buy, 2 say Sell" + the ISL panel. No audio needed.
3. **Mute** — taps a symbol from a list, taps "swing"; Chitti drafts "Log this as a paper trade?" → user taps *haan* (`chittiConfirmAndDo`). Zero voice.
4. **Illiterate / rural** — speaks "SBI", hears the verdict and the **"most traders lose — SEBI"** rail in Bhojpuri; icons only reinforce. Works on 2G.
5. **Tip victim** — forwards "BUY XYZ guaranteed 3x in 2 weeks!" → Tip Shield: *"This looks like a scam. Chitti is NOT telling you to buy."* with the matched pattern named.

## 6. UX flows (canonical)

```
Vaani  ──"technical intent"──▶  Chitti Technicals service
   │                                  │
   │   pick symbol + tradeType        │ genAllTf → scan()
   │◀──────────────────────────────── │
   ▼
4-channel verdict box  (voice · text · icon+shape · ISL)
   ├─ vote tally + MMI mood dial + confluence score
   ├─ risk block FIRST (stop, then targets)  ── if no clean stop → HOLD
   ├─ Danelfin-style "tap any indicator → why" (cites the indicator)
   ├─ "most short-term traders lose — SEBI" honesty rail  (always)
   └─ per-response widget (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
```
Side-effects (log paper trade, set reminder) → `chittiConfirmAndDo()` (Golden Rule: speaks the question, waits for explicit *haan*, never defaults to yes).

## 7. Failure modes (honest, designed-for)

| Failure | Behaviour |
|---|---|
| No clean ATR stop / RR below floor | `scan()` **downgrades to HOLD** (`risk_downgraded`), says "skip this trade" — never a stop-less signal (Art. 5) |
| Higher TFs disagree | verdict = HOLD, *"wait for alignment"* — not a guess |
| Backend down (no live candles) | falls back to deterministic DEMO candles, labelled **"DEMO — tap Refresh for live"** (never fakes "live") |
| LLM (DeepSeek) down or off | engine verdict still renders 4-channel; only the *vernacular narration* degrades to the deterministic `explain()` template |
| Crisis keyword (suicide/self-harm) | immediate Tele-MANAS **14416**, no LLM, no trade talk (`detectCrisis`) |
| Loss spiral (>5%/day or 3 losers) | mandatory cool-down screen (`detectLossSpiral`) |
| Banned phrase in any output | blocked by `hasBannedPhrase()` before render |

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
