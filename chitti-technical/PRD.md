🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# PRD — Chitti Technical (F0–F9)

Each feature carries: **What · Output · UX flow · Accessibility · Failure mode.**
No feature ships without its row in [evals/](evals/) and its accessibility review
in [accessibility/](accessibility/).

---

## F0 — Stock Search

| | |
|---|---|
| **What** | Find any NSE instrument by name or symbol — stocks, indices, ETFs. |
| **Output** | Resolved symbol + current price (last manual refresh) + market-cap tier + sector. |
| **UX** | Type or speak → fuzzy match → pick → land on the analysis surface. Voice search reads back the resolved name for confirmation (Golden Rule for the *selection*, not an action). |
| **Accessibility** | Blind: results spoken, top match auto-read. Illiterate: recent + favourite stocks as logo tiles. Mute: tap-only. |
| **Failure** | No match → honest *"I couldn't find that on NSE — did you mean …?"* Never silently pick the wrong symbol. |

## F1 — Technical Scanner

| | |
|---|---|
| **What** | The core engine. Run every indicator + Roshan + the swarm on the resolved instrument and emit a single verdict. |
| **Output** | **BUY · SELL · HOLD** + confidence band (LOW / MEDIUM / HIGH) + the confluence score + the list of contributing/contradicting signals. |
| **UX** | One tap "Scan." Result card carries the 5-element box (🔊 / 🤖 / 👍 / 👎 + feedback). HOLD is a first-class answer, not a failure. |
| **Accessibility** | Verdict is icon + word + colour (never colour alone): 📈 BUY / 🛑 SELL / ⏸️ HOLD. Audio summary on demand. |
| **Failure** | Insufficient candles / stale data → honest "not enough data to judge — refresh or pick another timeframe," never a guessed verdict. |

Engine spec: [scanners/SCANNER.md](scanners/SCANNER.md).

## F2 — Multi-Timeframe Analysis

The heart of the product. The verdict is built bottom-up but **governed top-down**.

```
LONG TERM        POSITIONAL       SWING            INTRADAY
  Monthly          Weekly           Daily            4-Hourly
    ↓                ↓                ↓                  ↓
  Weekly           Daily          4-Hourly           Hourly
    ↓            (entry)          (trigger)         (trigger)
  Daily (entry)
```

| | |
|---|---|
| **What** | For the chosen trade type, compute trend/momentum on each rung of its ladder, then resolve to a single decision. |
| **Rule** | Higher timeframe sets **direction**; lower timeframe sets the **trigger**. Disagreement → **WAIT/HOLD**. (Founder Rule #4.) |
| **Output** | Per-timeframe rating (strong-up / up / neutral / down / strong-down) + the resolved entry timeframe + an explicit "why these align / why they don't." |
| **Accessibility** | Each rung shown as a labelled bar with word + arrow; narrated top-to-bottom for blind users. |
| **Failure** | A missing timeframe (e.g. illiquid microcap has no clean 4H) → say so; never fabricate the rung. |

## F3 — Entry Engine

| | |
|---|---|
| **What** | Convert "where" into three concrete prices. |
| **Output** | **Entry Zone** (a band, not a point) + **Ideal Entry** (best risk/reward) + **Aggressive Entry** (earlier, wider risk) + **Conservative Entry** (confirmation-first, smaller reward). |
| **UX** | Three labelled prices with one line each on the tradeoff. |
| **Accessibility** | Prices spoken; "aggressive vs conservative" explained in plain language. |
| **Failure** | If price is already past a sensible entry → "entry missed; wait for pullback to X," never chase. |

## F4 — Stop Loss Engine

| | |
|---|---|
| **What** | The non-negotiable. Every BUY/SELL carries a stop loss. |
| **Output** | Stop **price** + **% from entry** + **ATR-based** distance + **support/structure-based** level — and which one Chitti recommends and why. |
| **Rule** | A signal without a valid stop (on the correct side of entry) **does not ship** ([guardrails/stop_loss_mandatory.md](guardrails/stop_loss_mandatory.md)). |
| **Accessibility** | "If price closes below ₹X, you are wrong — exit" — spoken plainly. |
| **Failure** | If structure gives no clean stop within the trade-type risk budget → "no clean stop here, skip this trade." |

## F5 — Target Engine

| | |
|---|---|
| **What** | Where to take profit, with the reward honestly tied to the risk. |
| **Output** | **Target 1 / 2 / 3** + **RR ratio** for each (vs the chosen stop). |
| **Rule** | RR must clear the trade-type floor (intraday ≥ 1:1.5, swing ≥ 1:2, positional/long ≥ 1:3) or Chitti flags "reward does not justify risk." |
| **Accessibility** | Targets + RR spoken; "you risk ₹1 to make ₹3" framing. |
| **Failure** | Targets capped at the next real structure level, never an invented round number. |

## F6 — Chitti Explain

| | |
|---|---|
| **What** | Translate every indicator and the final verdict into plain language, in the user's language. |
| **Example** | Instead of `RSI = 31` → *"RSI is oversold. This does NOT mean buy. Wait for trend confirmation."* |
| **Engine** | DeepSeek (sole LLM), fed the **deterministic** numbers — it phrases, it never decides. |
| **Accessibility** | This **is** the accessibility layer: it is what blind/illiterate users hear and what beginners read. |
| **Failure** | DeepSeek down → fall back to a deterministic templated explanation (degraded phrasing, correct content), never silence and never a hallucinated number. |

## F7 — Roshan Indicator

| | |
|---|---|
| **What** | Sire's **custom composite indicator layer** — Chitti Technical's signature signal. |
| **Output** | A Roshan reading + its own BUY/SELL/neutral lean, surfaced both as a chart overlay and as a swarm voter ([swarm/roshan-agent.md](swarm/roshan-agent.md)). |
| **Status** | First-class, favourited by default; full logic in [indicators/ROSHAN.md](indicators/ROSHAN.md). |
| **Accessibility** | Presented in plain language like any other signal — "Roshan says momentum + trend agree, leaning buy." |

## F8 — Screener

| | |
|---|---|
| **What** | Find stocks across the full NSE universe that match indicator + fundamental-tier conditions. |
| **Filters** | **Market Cap** (Nifty50 / Large / Mid / Small / Micro per [README.md](README.md) tiers) · **Sector** · **RSI** · **MACD** · **Supertrend** · **Roshan** · **Breakout** · **Volume Spike** · (extensible). |
| **Output** | Ranked match list, each row tappable into the full F1 scan. |
| **UX** | Filter chips + presets ("oversold large-caps," "Roshan buy + volume spike"). **Manual "Run screen"** button — no auto-refresh. |
| **Accessibility** | Result count + top matches spoken; filters as labelled toggles. |
| **Failure** | Zero matches → "no stock matches all filters today" + suggest the nearest-miss relaxation. |

Spec: [screeners/SCREENER.md](screeners/SCREENER.md).

## F9 — Portfolio Mode

| | |
|---|---|
| **What** | The user's private trade journal driven off Chitti's signals. |
| **Output** | **Open Trades · Closed Trades · PnL · Risk** (per-trade and aggregate). |
| **Privacy** | On-device first; never sold; never a public leaderboard. |
| **Accessibility** | Each trade narrated; "you are up ₹X, your stop is at ₹Y." |
| **Failure** | Never auto-creates a trade — the user explicitly logs it (Golden Rule: a side-effecting "set trade" confirms first). |

Spec: [portfolio/PORTFOLIO.md](portfolio/PORTFOLIO.md).

---

## Cross-cutting requirements (apply to F0–F9)

- **5-element box** on every response card ([accessibility/](accessibility/)).
- **NOT SEBI REGISTERED** bar + modal on the page ([guardrails/](guardrails/)).
- **Manual refresh** with a visible "data as of <timestamp>" stamp.
- **Full responsive** — desktop / laptop / tablet / mobile (375px floor), per [ui/UI.md](ui/UI.md).
- **Whole-UI language switch** — selecting a language re-renders the entire screen.
- **Every signal is logged** for the accuracy eval ([observability/](observability/)).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
