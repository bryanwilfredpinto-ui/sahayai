🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# PORTFOLIO MODE (F9) — the user's private trade journal

A private ledger of the trades the user takes off Chitti's signals — so the
product can close the loop (SOP 5 Trade Review, SOP 6 Risk Review) and so the user
learns from their own outcomes.

## What it tracks

| Section | Fields |
|---|---|
| **Open trades** | instrument · side · entry · stop · targets · RR promised · qty · rupee risk · date · which signal/timeframe |
| **Closed trades** | the above + exit price · exit reason (target / stop / manual) · realised PnL · realised RR · win/loss |
| **PnL** | per trade + aggregate (the user's own ledger) |
| **Risk** | open risk (sum of rupee-risk on open trades) · % of capital at risk · over-exposure flag |

## Aggregate insights (private)

- Win rate · loss rate
- **Average RR promised vs realised** — did the trades honour their risk plan?
- Confluence-score distribution of taken vs skipped trades
- Behaviour flags ([../guardrails/overconfidence.md](../guardrails/overconfidence.md)):
  over-trading, revenge-trading after a loss, stops widened after entry

## Privacy (locked)

- **On-device first** — the ledger lives in `localStorage`/IndexedDB; it is the
  user's data ([SAHAYAI_MASTER.md §2b/§2f](../../SAHAYAI_MASTER.md) ownership contract).
- **Never sold, never a public leaderboard.** Anonymised aggregate may feed the
  signal-accuracy eval only with the user's consent, PII-stripped.
- **"Chitti forget"** wipes the ledger (tombstone preserved so accuracy counts stay honest).

## Golden Rule (side effects confirm first)

Logging or closing a trade is a user action — Chitti **never** auto-creates,
auto-closes, or auto-sizes a trade. Setting a trade or a price alert speaks
*"Sire, shall I log this RELIANCE swing trade — entry ₹X, stop ₹Y?"* and fires
only on explicit Yes ([SAHAYAI_MASTER.md §2g](../../SAHAYAI_MASTER.md) Golden Rule).
This is mute-user safe (Yes/No buttons) and never times out into Yes.

## Accessibility

- Every trade row is **narratable**: *"RELIANCE swing, you are up ₹420, stop at
  ₹2,840, target 1 hit."*
- Risk shown as icon + word + number (🛑 + "open risk" + ₹), never colour alone.
- Full language switch; the journal renders in the user's language.
- 5-element box on every trade card (🔊 / 🤖 / 👍 / 👎 + feedback).

## What it is NOT

- Not a broker — it records the trade the user made elsewhere; it never places,
  modifies, or routes an order.
- Not tax/accounting software — PnL is an educational running tally, not a
  capital-gains statement.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
