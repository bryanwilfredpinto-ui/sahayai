🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# MEMORY — what Chitti Technicals remembers, and why

> Level 7 (Intelligence). Subordinate to [CONSTITUTION.md](CONSTITUTION.md). Memory exists to serve the user, never to surveil them. Everything here is **local-first / on-device** by default (DPDP-compliant); only **anonymised, aggregated** signals leave the device, and only with consent (swarm).

---

## The memory contract (one line)

> **Chitti Technicals remembers so it can protect you better — and forgets the moment you ask. Your journal, your watchlist, your preferences are yours.**

This is the inversion of the surveillance-trading-app norm: incumbents hoard your behaviour to nudge more trades. We store the minimum, on your device, and use it to surface honest insight ("you keep cutting your winners early") — never to push churn (CONSTITUTION Art. 8, Guardian Not Croupier).

---

## The three memory stores (all local-first)

| Store | What it holds | Where | Doc |
|---|---|---|---|
| **Journal** | Dual log: (a) every **system signal** generated, (b) every **user PAPER trade** taken — winners AND losers, honestly | IndexedDB + CSV export | [memory/journal_memory.md](memory/journal_memory.md) |
| **Preferences** | Trade type · risk budget · language · disability profile (synced from `chitti_a11y.js`) | localStorage | [memory/preference_memory.md](memory/preference_memory.md) |
| **Watchlist** | NSE/BSE symbols the user is tracking, with optional alert thresholds | localStorage + IndexedDB | [memory/watchlist_memory.md](memory/watchlist_memory.md) |

**Nothing in these three stores is a real holding or a real order.** Paper-only (CONSTITUTION Art. 3). Chitti never places, holds, or routes a real trade.

---

## Local-first architecture (DPDP by design)

1. **On-device default.** Journal rows, watchlist, and preferences live in the browser (IndexedDB / localStorage), keyed per-device. No account required to use Chitti Technicals.
2. **No silent sync.** Nothing is uploaded unless the user explicitly opts into swarm contribution or cloud backup. The default is OFF.
3. **CSV export = user ownership.** The user can export the full journal to CSV at any time and take it elsewhere. We are a custodian, not an owner.
4. **"Chitti forget" = real deletion.** Saying or tapping **"Chitti forget"** tombstones the targeted store (or all stores) — see below.

---

## "Chitti forget" — the tombstone protocol

| Command | Effect |
|---|---|
| "Chitti, forget this trade" | Tombstones one journal row (excluded from insights + swarm; CSV marks it deleted) |
| "Chitti, forget my watchlist" | Clears all watchlist symbols |
| "Chitti, forget everything" | Tombstones journal + watchlist + preferences (disability profile is re-asked next visit) |

Tombstoning is **immediate and local**. If a row was already contributed to the swarm anonymously, the anonymised aggregate cannot identify it back — but no *new* contribution is made from a tombstoned row. This honours DPDP's right to erasure and SAHAYAI_MASTER §2b (user-owned camera/data — "Chitti forget" deletes all).

---

## Swarm feed (anonymised, consent-gated)

When — and only when — the user opts in, **anonymised, aggregated** patterns feed the swarm (SAHAYAI_MASTER §2f, Swarm Intelligence LOCKED):

- **Never sent:** symbol-level holdings, identity, device id, exact P&L, raw journal rows.
- **Sent (aggregate only):** de-identified outcome patterns — e.g. "swing setups with confluence ≥4 had outcome distribution X" — so every Chitti Technicals instance gets smarter about honest setup quality.
- **Locked decisions are never learnable** — the swarm can refine *phrasing* and *insight surfacing*, never relitigate "analysis not advice", "paper-only", or "most traders lose" (CONSTITUTION Art. 4, 8).
- Flow: daily collect · weekly validate · monthly push · quarterly review. HIGH-risk insight changes (anything touching a number, a stop, or a verdict) go to human review before push.

---

## What memory is NEVER allowed to do

- ❌ Nudge more trades, gamify frequency, or send "you haven't traded today" pokes.
- ❌ Store or imply a real order, real holding, or real broker linkage.
- ❌ Leave the device without explicit consent (swarm/backup OFF by default).
- ❌ Hide losers to flatter the user — the journal records the truth (CONSTITUTION Art. 11).

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
