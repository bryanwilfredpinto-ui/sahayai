🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# journal_memory — the dual journal (system signals + user paper trades)

> Subordinate to [../CONSTITUTION.md](../CONSTITUTION.md) Art. 11 (Journal Everything) and [../MEMORY.md](../MEMORY.md). Local-first (IndexedDB + CSV export). Paper-only — **no row is ever a real order or real holding** (Art. 3).

---

## Why two journals

A single trade log lies by omission. We keep **two** so the user can see the honest gap between *what Chitti read* and *what the user actually did*:

1. **`system_signals`** — every deterministic read Chitti generated (whether or not the user acted). This is Chitti's own honesty ledger: did our reads, in aggregate, behave the way we said?
2. **`user_paper_trades`** — every PAPER trade the user chose to log. This is the user's mirror: their discipline, their winners, their losers, their emotion.

Insights (below) come from comparing the two.

---

## Schema A — `system_signals` (IndexedDB store + CSV columns)

| Field | Type | Notes |
|---|---|---|
| `signal_id` | string (uuid) | Primary key |
| `ts_ist` | ISO8601 | Generation time, IST |
| `symbol` | string | NSE/BSE symbol (e.g. `RELIANCE`) |
| `timeframe` | enum | `intraday` · `swing` · `positional` · `longterm` |
| `verdict` | enum | `STRONG_BUY · BUY · NEUTRAL · SELL · STRONG_SELL` |
| `confidence` | int 0–100 | Engine-reproducible only (Art. 4 — no fabricated %) |
| `confluence` | int | Count of timeframes agreeing |
| `roshan` | number | Roshan composite (RSI14 vs SMA20) |
| `atr_stop` | number | Mandatory ATR stop (Art. 5 — no stop, no signal) |
| `t1`, `t2` | number | Honest targets |
| `engine_version` | string | For reproducibility audit |
| `disclaimer_shown` | bool | "Most short-term traders lose — SEBI" rail present |

`system_signals` is **read-only to the user** — it is Chitti's record of what it said, so it can be held to account.

---

## Schema B — `user_paper_trades` (IndexedDB store + CSV columns)

| Field | Type | Notes |
|---|---|---|
| `trade_id` | string (uuid) | Primary key |
| `linked_signal_id` | string \| null | The system signal this followed (if any) |
| `symbol` | string | NSE/BSE symbol |
| `trade_type` | enum | `longterm · positional · swing · intraday` |
| `entry_ts_ist`, `entry_price` | ISO8601, number | Logged on entry (paper) |
| `qty_paper` | int | Paper quantity (never a real order) |
| `stop_set`, `target_set` | number | What the user actually set |
| `exit_ts_ist`, `exit_price` | ISO8601, number | Logged on exit (paper) |
| `outcome` | enum | `WIN · LOSS · BREAKEVEN · OPEN` |
| `pnl_paper` | number | Computed, paper only |
| `emotion_tag` | enum \| null | Optional, user-set: `calm · fomo · revenge · fear · greed` |
| `note` | string | Free text (voice-dictated for blind/illiterate users) |

Every write of a `user_paper_trade` gates through `chittiConfirmAndDo()` (Art. 3 Golden Rule) — Chitti drafts the row, reads it back, waits for explicit *haan*.

---

## Honest outcomes (Art. 11)

- **Winners AND losers are recorded.** No row is silently dropped to flatter the user.
- A LOSS is shown plainly, with the read that preceded it, so the user (and Chitti) can learn.
- Outcomes are **four-channel**: spoken ("this paper trade closed a loss of ₹X"), text, icon+shape (▼), ISL — never colour-only (Art. 2).

---

## AI insights — unlocked after 10 paper trades

DeepSeek **only phrases** these; the **detection is deterministic** (CONSTITUTION Art. 6 — engine decides, LLM phrases). Below 10 trades, Chitti says honestly: *"Not enough paper trades yet to spot a pattern — keep logging."*

| Insight | Deterministic trigger (computed, reproducible) |
|---|---|
| **Overtrading** | Paper-trade frequency well above the user's stated trade type cadence (e.g. many intraday entries when prefs say `positional`) |
| **Cutting winners early** | Median win held materially shorter than median loss (the classic disposition error) |
| **Best & worst setup** | Outcome distribution grouped by setup signature (timeframe × verdict × confluence band) → surface the user's most/least reliable setup |
| **Emotional trading** | Outcomes tagged `fomo` / `revenge` / `greed` show materially worse paper P&L → gentle flag + cool-down nudge |

Insights are **framed as coaching, never as a trade urge** (Art. 8). Loss-spiral (>5% paper drawdown in a day OR 3 losing paper trades) triggers the mandatory cool-down, not a "win it back" prompt (Art. 6).

---

## Storage, export, forget

- **Store:** IndexedDB (both schemas), local-first, per-device.
- **Export:** one tap → CSV of both journals (user ownership; [../MEMORY.md](../MEMORY.md)).
- **Forget:** "Chitti, forget this trade" tombstones a row; tombstoned rows are excluded from insights and never contributed to the swarm.
- **Swarm:** only de-identified setup-outcome aggregates leave the device, consent-gated; raw rows never do.

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
