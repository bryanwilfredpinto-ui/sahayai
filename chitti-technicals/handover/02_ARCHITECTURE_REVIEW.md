🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# 02 — ARCHITECTURE REVIEW

> 🔵 **PENDING skeleton — authored 2026-06-10.** The architecture is *specified* (the docs are law); the *review of the built system against it* runs when the BO gates run. Verification cells = **🔵 PENDING — to be filled when BO gate runs.**

---

## Architecture under review (the contract to verify against)

```
Vaani (sole interface, BO12)
   │  routes "technical" intent
   ▼
chitti_technical_ai.html  ── dev/cert + parity surface only (Art. 10)
   │
   ├─ chitti_technical_engine.js  ── DETERMINISTIC (reused: 39 indicators + Roshan)
   │        • computes RSI/MACD/ATR/Roshan/confluence/risk
   │        • DECIDES the verdict, the stop, the position size
   │
   ├─ DeepSeek  ── PHRASES ONLY (Art. 6) — never originates a number/stop/verdict
   │
   ├─ chitti_lang.js · chitti_a11y.js · chitti_isl.js · feedback-widget.js  ── substrate (wire, not write)
   │
   └─ Memory (local-first): journal · watchlist · preferences  ── on-device, "Chitti forget"
            │  (consent-gated, anonymised)
            ▼
         Swarm
```

Data: `chitti-shares-api` → Angel One SmartAPI (NSE/BSE candles, multi-timeframe). IST hours + Indian holiday calendar.

---

## Review checklist (each = 🔵 PENDING until the gate proves it)

| # | Architectural law (from CONSTITUTION) | How verified | Result |
|---|---|---|---|
| 1 | **Engine decides, LLM only phrases** (Art. 6) — DeepSeek never on the path of a number, stop, size, or verdict | Trace verdict origin in code + `test_technical_engine.mjs` reproducibility | 🔵 PENDING |
| 2 | **Deterministic + reproducible** — same input → same output, engine_version logged | Gold-vector test | 🔵 PENDING |
| 3 | **ATR stop mandatory** (Art. 5) — no stop → no signal | Risk-engine unit test | 🔵 PENDING |
| 4 | **Four-channel verdict** (Art. 2) — voice/text/icon+shape/ISL, never colour-only | Per-profile journeys + axe colour-contrast | 🔵 PENDING |
| 5 | **Confirm-gate** (Art. 3) — every side-effect via `chittiConfirmAndDo()` | Code audit of all write paths | 🔵 PENDING |
| 6 | **Paper-only** — no real order/holding/broker path exists | Code audit (grep for order/broker), schema review | 🔵 PENDING |
| 7 | **NOT SEBI bar + "most traders lose" rail** never demoted | Cert verdict gate | 🔵 PENDING |
| 8 | **Reuse not rebuild** — `chitti_technical_engine.js` wired, not re-authored | Diff vs existing engine | 🔵 PENDING |
| 9 | **Local-first memory** + "Chitti forget" tombstones + swarm anonymised | Storage audit + tombstone test | 🔵 PENDING |
| 10 | **Vaani sole interface**, page is dev/cert only (Art. 10) | Routing review (BO12) | 🔵 **BLOCKED (Sire)** |
| 11 | **DeepSeek-only** LLM, no Anthropic/other provider in backend | Provider grep | 🔵 PENDING |
| 12 | **Crisis path** (suicide/self-harm) → Tele-MANAS 14416, no LLM | Guardrail test | 🔵 PENDING |

---

## Substrate reuse map (wire, not write)

| Concern | Reused substrate | Status |
|---|---|---|
| Signal math | `chitti_technical_engine.js` (39 indicators + Roshan) | exists — wire in BO6 |
| Language (26) | `chitti_lang.js` (`#lang-select`) | exists — wire in BO10 |
| Accessibility | `chitti_a11y.js` | exists — wire in BO1–5 |
| ISL | `chitti_isl.js` | exists — wire in BO3 |
| Per-response widget | `feedback-widget.js` + `data-chitti-response` | exists — wire in BO10 |
| Confirm-gate | `chittiConfirmAndDo()` | exists — wire in BO4/BO9 |
| Market data | Angel One via `chitti-shares-api` | exists — keys Sire-blocked (BO12) |

---

## Summary

> Architecture is **specified and law**. The build-vs-spec review is **🔵 PENDING — to be filled when the BO gates run**. The known *spec-level* gap (engine lacks Camarilla / Classic Pivots / S-R confluence) is tracked in [03_KNOWN_ISSUES.md](03_KNOWN_ISSUES.md), not hidden here.

---

> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
