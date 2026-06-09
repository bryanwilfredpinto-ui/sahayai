🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# preference_memory — how Chitti remembers the user's settings

> Subordinate to [../CONSTITUTION.md](../CONSTITUTION.md) and [../MEMORY.md](../MEMORY.md). Local-first (localStorage). Preferences tune *how Chitti speaks and what it defaults to* — they never override a safety law (paper-only, ATR stop mandatory, "most traders lose" rail).

---

## What preferences are for

Chitti should not ask the same question twice. The disability profile, language, and trade type are set once and respected everywhere — for a blind or illiterate user, re-asking is a tax they cannot afford (SAHAYAI_MASTER §7; User Disability Profile LOCKED — one-time, never re-asked).

---

## Preference schema (localStorage, JSON)

| Key | Type | Default | Notes |
|---|---|---|---|
| `trade_type` | enum | `positional` | `longterm · positional · swing · intraday`. Default leans **away** from churn (CONSTITUTION Art. 8). Drives default timeframe + insight cadence baseline. |
| `risk_budget_pct` | number | `1.0` | Max % of paper capital risked per trade. Feeds the ATR position-size suggestion. Capped + warned, never weaponised into "trade bigger". |
| `paper_capital` | number | `100000` | Notional paper capital (₹). Paper only — never a real balance. |
| `language` | string | from `chitti_lang.js` | One of 26 langs. RSI/MACD/NSE/Nifty stay English (Art. 9). |
| `voice_out` | bool | `true` | Speak verdicts aloud by default (blind/illiterate floor). |
| `disability_profile` | object | synced | **Read-synced from `chitti_a11y.js`** — not owned here (see below). |
| `honesty_rail_ack` | bool | `false` | Whether the user has acknowledged "most short-term traders lose — SEBI". Rail still shows regardless. |

---

## Disability profile — synced, not duplicated

The disability profile (blind / deaf / mute / ISL / illiterate / elderly / low-vision / cognitive / motor / rural) is **owned by `chitti_a11y.js`** and synced across **all** Chittis on the device (User Disability Profile LOCKED, SAHAYAI_MASTER §7). Chitti Technicals **reads** it to choose defaults:

| Profile flag | Effect on Chitti Technicals defaults |
|---|---|
| Blind | `voice_out=true`, audio price-line + "show data as table" auto-on, earcons enabled |
| Deaf | Visual+text twin of every audio cue forced on; ISL panel visible |
| Mute | Mic paths replaced by tap/type; Chitti-drafts-you-approve flow |
| Illiterate / Elderly / Rural | Icon-grid + audio-first; simpler phrasing; high-contrast; offline cache |
| Low-vision | Larger base type, high-contrast theme |
| Cognitive | Shorter sentences, one decision at a time |
| Motor | Larger tap targets (≥48px), no time-pressured interactions |

Chitti Technicals **never writes** the disability profile — it only reads it. "Chitti forget everything" clears the local copy and re-asks via `chitti_a11y.js` next visit.

---

## Preferences can never override a safety law

A preference tunes phrasing and defaults. It can **never**:

- ❌ Turn off the ATR stop (Art. 5 — no stop, no signal).
- ❌ Hide the "most short-term traders lose — SEBI" rail or the NOT-SEBI bar (Art. 3).
- ❌ Enable a real order (paper-only is absolute).
- ❌ Disable the per-response widget or the confirm-gate (Art. 3, 12).

If a user sets `trade_type=intraday`, Chitti still de-emphasises churn, still shows the loss data, still runs the cool-down. Preferences make Chitti *fit the user*; they do not make Chitti *unsafe*.

---

## Storage & forget

- **Store:** localStorage, local-first, per-device.
- **Forget:** "Chitti, forget my settings" resets to defaults; "Chitti, forget everything" also re-triggers the disability-profile prompt.
- **Swarm:** preferences are **never** contributed to the swarm individually; only de-identified aggregate cohort tendencies (if consent-gated) — never a single user's settings.

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
