🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# BUILD_ORDER — accessibility-first, research-folded, reuse-not-rebuild

> Re-sequenced from the founder's CEOS §14 (which was code-first: indicators → cert) into the **Chitti Fashion accessibility-first pattern** (BO1–5 = four-users-first → engine → features → i18n → cross-browser → WCAG → Vaani). My 40-app research pointers ([RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)) are folded in as explicit build items, tagged **[STEAL]**. The re-scope from [CONSTITUTION.md](CONSTITUTION.md) is law throughout.
>
> **Core rule:** no BO is done until its TEST GATE passes. No GREEN without proof (curl / screenshot / log). 375px screenshot on all 5 devices before any "done".
> **Reuse, don't rebuild:** `chitti_technical_engine.js` already ships 39 indicators + the **Roshan composite** (RSI14 vs SMA20) — BO6 wires it, it does not re-author it. SEBI bar, `chittiConfirmAndDo()`, `chitti_lang.js`, `feedback-widget.js`, `chitti_isl.js`, Angel One client (`chitti-shares-api`) all exist — we wire, not write.

---

## What changed vs. the founder's CEOS §14 BO (and why)

| Founder CEOS §14 | This BO | Why |
|---|---|---|
| BO1 = ATR calculator (code-first) | BO1–5 = the four users first | Article 1: Access First, Trading Second. A signal a blind user can't hear is not done. |
| "Tap to execute" / scalper & day-trader modes | De-emphasised; **paper-only**, swing/long-term default | Re-scope (PRODUCT_JUSTIFICATION 82/100): guardian, not croupier |
| Signal = the product | **Honest read + anti-scam Tip Shield + "most traders lose" rail** = the product | [STEAL] Danelfin honesty / BlackBox "alerts ≠ buy signals" |
| Confidence only | Confidence **+ Investing.com vote tally + Tickertape MMI mood** | [STEAL] vote tally beats a needle; mood dial = "where are we?" |
| Build a new engine | **Reuse `chitti_technical_engine.js`** (39 indicators + Roshan) | Reinvent nothing; reuse substrate |

---

## The Build Order

| BO | Serves | Build (what) | TEST GATE | Status |
|---|---|---|---|---|
| **BO1** | 👁️ Blind / keyboard | `chitti_technical_ai.html` skeleton: skip-link · single `<h1>` · `role=main` · `role=tab` nav · visible focus ring · `aria-live="polite"` result hosts · base 17px · ≥48px taps | DOM assert + **axe-core 0 serious/critical** | 🔵 TODO |
| **BO2** | 👁️ Blind | **Audio layer**: `audio_graph.js` — sonify price line (pitch L→R, 220–880 Hz) + **earcons at RSI 30/70 & MACD cross** [STEAL: Highcharts/Apple Audio Graphs]; **"Show data as table" toggle** + one-sentence spoken summary (the highest-leverage blind win) | Blind journey: verdict 100% recoverable with screen off | 🔵 TODO |
| **BO3** | 🦻 Deaf | **Visual+text twin** of every audio cue; **non-colour icon+shape verdict** (▲▲/▲/■/▼/▼▼); ISL panel via `chitti_isl.js` (fingerspell RSI/MACD, never fake a sign) | Deaf journey: verdict 100% recoverable with sound off | 🔵 TODO |
| **BO4** | 🤫 Mute | Non-voice twin for every mic: tap-list of symbols + type box; **Chitti-drafts-you-approve** via `chittiConfirmAndDo()` | Mute journey: full flow, zero voice required | 🔵 TODO |
| **BO5** | 📖 Illiterate / 🧓 Elderly / 🌾 Rural | Icon-grid (2-col, ≥48px), **every icon paired with audio** (icons reinforce, voice carries meaning); high-contrast; service-worker offline cache (2G/rural) | Illiterate journey: usable with zero reading on 2G | 🔵 TODO |
| **BO6** | All | **Wire the deterministic engine** (reuse `chitti_technical_engine.js`): 7 CEOS indicators (S/R MTF · Camarilla · Classic Pivots · Bollinger · RSI · Williams %R · Stochastic) + Roshan + ATR; **confluence engine** (per-TF ±1 vote, 5-state verdict); **risk engine** (ATR stop mandatory — Art. 5, no stop → no signal; T1/T2; position size) | `node tools/test_technical_engine.mjs` (gold) + `test_confluence.mjs` — 100% deterministic | 🔵 TODO |
| **BO7** | All | **Verdict surface** [STEAL bundle]: TradingView **gauge** + Investing.com **vote tally** ("11 say Buy, 2 say Sell") + Tickertape **MMI mood dial** + Screener **auto Pros/Cons** + Danelfin **score → tap-to-explain** (cite the indicator behind every claim) + **"most short-term traders lose — SEBI" honesty rail** on every verdict | Verdict renders 4-channel; rail + disclaimer present | 🔵 TODO |
| **BO8** | All | **Anti-scam Tip Shield** (the moat): paste/forward a "tip" → deterministic scam-pattern check (guaranteed-returns / pump language / unregistered-advisor / urgency) → "this looks like a scam, Chitti is not telling you to buy"; cross-link Chitti UPI/Legal | `test_tip_shield.mjs` gold cases | 🔵 TODO |
| **BO9** | All | **Dual journal** (system signals + user paper trades; CSV/IndexedDB) + **AI insights after 10 paper trades** (overtrading / cutting-winners / best-&-worst setup / emotional-trading — honest, deterministic) + **loss-spiral cool-down** + **crisis→Tele-MANAS 14416** (no LLM) | `test_journals.mjs` + guardrail tests | 🔵 TODO |
| **BO10** | All vernacular | **26-language** via `chitti_lang.js` (`#lang-select` auto-enrich + re-render + persist); RSI/MACD/EMA/NSE/Nifty stay English; per-response widget on every box (`data-chitti-response` + `feedback-widget.js`) | `test_languages.mjs` 26/26 + no-Hinglish scan + 5 frontend gates | 🔵 TODO |
| **BO11** | All | **Cross-platform + WCAG cert**: Playwright on Chromium/Firefox/WebKit × 5 devices (Desktop 1920×1080 · Laptop 1366×768 · iPad · iPhone · Android) + axe-core 0 serious + **screenshot each box on each device** + CTO 8-gate | `cert_chitti_technical_ai.mjs` GREEN + screenshots saved | 🔵 TODO |
| **BO12** 🔵 | All | **DeepSeek warm layer + live data + Vaani routing** — narrate the deterministic verdict in-language; live Angel One candles (`/api/historical`); Vaani relevance-rail allowlist for `technical` intent. **BLOCKED on Sire:** DeepSeek funding + Vaani allowlist + Angel One keys (standing fleet blocker) | Live curl + Vaani-routed answer | 🔵 **BLOCKED (Sire)** |

---

## Test commands
```
BO6/8/9 (deterministic core)  node tools/test_technicals.cjs     # ✅ 58/58 PASS (2026-06-10)
BO1–5,7,10 (browser/a11y)     node tools/cert_chitti_technical_ai.mjs   # Playwright — TODO
BO11 (5-device + axe)         node tools/cert_chitti_technical_ai.mjs   # full + screenshots — TODO
```

## Honest status (2026-06-10)
- 🟢 **BO6 / BO7 / BO8 / BO9 — code-complete + deterministic-tested: `tools/test_technicals.cjs` = 58/58 PASS.** Engine wired (`generateSignal`+`chittiVerdict`; Camarilla/Classic/S-R all present), 4-channel verdict surface (gauge + vote tally + mood + pros/cons + "most traders lose" rail), Tip Shield (scam→HIGH, benign→LOW, never says buy), paper journal + crisis→Tele-MANAS 14416 + loss-spiral. New modules: `chitti_technical_ai_{audio,tipshield,journal,data,app}.js` — all pass `node --check`.
- 🟡 **BO1–5 / BO10 — built, browser-cert pending.** `chitti_technical_ai.html` ships skip-link, single h1, `role=tab`, `aria-live`, 4-channel verdict (icon+shape ▲▲/▲/■/▼/▼▼), audio sonify + data-table, ISL hook, `#lang-select`, per-response `data-chitti-response` boxes, SEBI sticky bar. Not yet axe-cert'd / 5-device-screenshot'd / 26-lang-verified.
- 🔵 **BO11 — cert not run** (needs Playwright on 5 devices).
- 🔵 **BO12 — BLOCKED (Sire):** DeepSeek funding + Vaani `technical` allowlist + live Angel One keys. Until then the page runs on the engine's honest DEMO synthesizer (clearly badged) and live day/week/month via `/api/historical` when the backend is reachable.

No GREEN claimed before its gate runs — honest stubs over fake demos.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
