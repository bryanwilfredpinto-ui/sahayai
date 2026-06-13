🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# watchlist_memory — the symbols the user is tracking

> Subordinate to [../CONSTITUTION.md](../CONSTITUTION.md) and [../MEMORY.md](../MEMORY.md). Local-first (localStorage + IndexedDB). A watchlist is a list of symbols to *read honestly* — never a queue of "trades to make".

---

## What the watchlist is (and is not)

- ✅ A user-curated set of **NSE/BSE symbols** the user wants Chitti to keep an eye on and read on demand.
- ✅ A way to attach an optional, honest **threshold reminder** ("tell me if RELIANCE RSI crosses 70").
- ❌ NOT a portfolio (no holdings, no real positions).
- ❌ NOT an auto-trader (Chitti never acts on a threshold — it *informs*, then asks; Art. 3 Golden Rule).
- ❌ NOT a "hot tips" feed pushed by Chitti — the user adds symbols; Chitti does not seed churn-bait (Art. 8).

---

## Watchlist item schema (localStorage list + IndexedDB)

| Field | Type | Notes |
|---|---|---|
| `symbol` | string | NSE/BSE symbol, e.g. `TCS`, `HDFCBANK`. Validated against the symbol map. |
| `exchange` | enum | `NSE · BSE` |
| `display_name` | string | Company name in the user's language where available; ticker stays English (Art. 9) |
| `added_ts_ist` | ISO8601 | When the user added it |
| `trade_type_hint` | enum \| null | Optional per-symbol lens (`longterm · positional · swing · intraday`) |
| `alerts` | array | Optional honest thresholds (below) |
| `last_read_verdict` | enum \| null | Cached last verdict for quick re-read (4-channel) |

### Alert sub-schema (`alerts[]`)

| Field | Type | Notes |
|---|---|---|
| `kind` | enum | `rsi_cross · macd_cross · price_level · sr_touch` |
| `param` | object | e.g. `{ "level": 70 }` or `{ "price": 2900 }` |
| `channel` | enum | How the user wants to be told: `voice · text · isl · all` |
| `active` | bool | User can pause without deleting |

---

## How alerts behave (informs, never acts — Art. 3)

1. The deterministic engine evaluates the threshold on refresh (manual or scheduled) — **no LLM on this path** (Art. 6).
2. When a threshold is met, Chitti **tells** the user, four-channel: *"Sire — TCS RSI just crossed 70. This is what the chart says, I am not telling you to buy. Most short-term traders lose money — SEBI."*
3. Any follow-on side effect (log a paper trade, set another reminder) gates through `chittiConfirmAndDo()`.
4. Alerts are **honest, not hype** — no "🚀 don't miss out" framing; no urgency manufacturing (Art. 8).

---

## Accessibility of the watchlist (Art. 1, 2)

- **Blind:** the list is spoken on demand ("you are tracking 6 symbols: …"); each row's last verdict is sonifiable + available as a data table.
- **Deaf:** text + icon+shape (▲▲/▲/■/▼/▼▼) + ISL panel; alerts arrive visually, never audio-only.
- **Mute:** add/remove via tap-list + type box; no voice required.
- **Illiterate / rural:** icon-grid of tracked symbols, each paired with audio; works offline on cached data (2G).

---

## Storage, export, forget, swarm

- **Store:** localStorage (the list) + IndexedDB (cached reads), local-first, per-device.
- **Export:** included in the CSV export ([../MEMORY.md](../MEMORY.md)).
- **Forget:** "Chitti, forget my watchlist" clears all symbols + alerts; per-symbol "Chitti, stop watching TCS" removes one.
- **Swarm:** individual watchlists are **never** uploaded. Only de-identified *aggregate* "most-tracked symbols" (consent-gated) could inform anonymised popularity — never tied to a user, never used to push trades.

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
