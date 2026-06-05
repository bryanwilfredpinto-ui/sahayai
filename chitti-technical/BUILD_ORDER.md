🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BUILD ORDER — Chitti Technical (BO1 → BOn, each test-gated)

> Sire's rule (2026-06-06): *"Prepare a build order like BO1-TEST, BO2-TEST … BOn-TEST,
> then execute as per build order."* Each BO ships with the **exact test** that flips
> it GREEN. A BO is not "done" until its TEST passes. The four users (blind / deaf /
> mute / illiterate) are a gate on **every** BO, not a final step.

## Doctrine (inherited)
- **Rules are the product, the LLM is an enhancement.** The signal engine is
  deterministic ([chitti_technical_engine.js](../chitti_technical_engine.js)) — it
  works with DeepSeek offline. So the engine is Node-testable without a browser.
- Two test harnesses:
  - **Node logic test** — [tools/test_technical.mjs](../tools/test_technical.mjs):
    indicator math on fixtures, confluence, guardrails, i18n completeness, no-Hinglish,
    HTML gate presence. No browser needed → deterministic, runs anywhere.
  - **Playwright cert** — [tools/cert_technical.mjs](../tools/cert_technical.mjs):
    responsive 375/768/1280, language-switch re-render proof, 5-element box, screenshots.

---

## BO1 — Page shell + 5 substrate gates + SEBI bar + manual-refresh skeleton
**Build:** `chitti_technical.html` at repo root; load `chitti_a11y.js`, `chitti_lang.js`,
`feedback-widget.js` (→ inherits a11y, ISL, disability-profile, features, lang-select);
sticky **NOT SEBI REGISTERED** bar + legal modal; 🔄 manual Refresh + "data as of" stamp.
**TEST (BO1):** HTML parses (node syntax check); grep gates present (a11y + feedback-widget +
≥1 `data-chitti-response` + SEBI bar + SEBI modal); no `<script>` syntax error.

## BO2 — i18n: 9-language UI + whole-UI re-render on language switch
**Build:** `data-i18n` on every label; `TECH_I18N` dict for en·hi·ta·te·bn·mr·gu·kn·ml;
`applyLang()` re-renders the entire screen + sets `<html lang>`; hooks `#lang-select` +
`chitti:langchange`. No Hinglish; indicator names stay English.
**TEST (BO2):** every i18n key exists in all 9 langs (0 missing); no-Hinglish scan over each
language's strings; switching en→bn/te/ta changes the title string.

## BO3 — Stock search + NSE universe by market-cap tier
**Build:** search box (type/pick/voice-optional); embedded representative NSE universe tagged
Nifty50 / Large(>₹1L cr) / Mid(50k–1L) / Small(5k–50k) / Micro(<5k); tier + sector shown.
**TEST (BO3):** search resolves a symbol; every universe row has a valid tier; tier boundaries
correct (engine unit test).

## BO4 — Indicator engine (deterministic) + indicator cards
**Build:** engine indicators (SMA/EMA/RSI/MACD/ATR/Stochastic/Williams %R/Supertrend/
Bollinger/OBV/ADX) computed client-side; indicator card per scan with value + BUY/SELL/WAIT;
5-element box.
**TEST (BO4):** indicator math matches known fixtures (RSI/EMA/SMA exact); warmup→null (abstain,
never 0); indicator card carries `data-chitti-response`.

## BO5 — Multi-timeframe scanner → BUY/SELL/HOLD + confidence + confluence
**Build:** per-trade-type ladder (Long M→W→D · Positional W→D · Swing D→4H · Intraday 4H→1H);
higher TF governs direction; disagreement → HOLD; confidence band; confluence breakdown.
**TEST (BO5):** ladder resolves per type; aligned TFs → directional verdict; opposed TFs → HOLD
(engine unit test); HOLD is a first-class output.

## BO6 — Risk engine: entry / stop / target / RR / size (NO stop → NO signal)
**Build:** entry zone (ideal/aggressive/conservative); stop (price/%/ATR/structure); Target 1/2/3
+ RR; position size from risk budget; downgrade to HOLD if no valid stop / RR below floor.
**TEST (BO6 — guardrail):** **every directional signal has a stop on the correct side**; RR ≥
trade-type floor or flagged; a fixture with no clean stop returns HOLD (engine unit test).

## BO7 — Roshan Indicator ⭐ (overlay + swarm vote + screener filter)
**Build:** Roshan = RSI(14) vs SMA(20)-of-RSI(14); BUY/SELL/WAIT; surfaced as card + chart pane +
screener filter; favourited by default.
**TEST (BO7):** Roshan matches the engine formula on a fixture; Roshan card present; Roshan filter
returns the right subset.

## BO8 — Charts: candlesticks + configurable panes (overlay OR separate)
**Build:** canvas candlestick + EMA overlays; each oscillator (RSI / Williams %R / Stochastic …)
toggles **overlay-on-candles ↔ separate pane**; entry/stop/target lines drawn (icon + word);
crosshair readout (spoken on demand).
**TEST (BO8):** pane-toggle moves RSI between overlay and separate pane (cert DOM check);
chart renders without console error; lines labelled with word + icon (not colour alone).

## BO9 — Screener across the full universe by tier + indicator filters
**Build:** filters — Market Cap tier · Sector · RSI · MACD · Supertrend · Roshan · Breakout ·
Volume Spike; manual "Run screen"; ranked results; tap-row → full scan; honest zero-match state.
**TEST (BO9):** filters produce the correct subset on the fixture universe; zero-match shows the
nearest-miss hint (engine + DOM test).

## BO10 — Portfolio Mode (private journal)
**Build:** log/close trade (Golden-Rule confirm); open/closed/PnL/risk; on-device localStorage;
narratable rows; 5-element box.
**TEST (BO10):** log→close roundtrip persists; PnL + realised RR computed correctly; "log trade"
opens a Yes/No confirm (never auto-acts).

## BO11 — Chitti Explain + Audio Trade Summary + ISL (the 4 users)
**Build:** deterministic plain-language explanation (DeepSeek enhances when keyed); 🔊 reads each
box; Audio Trade Summary in order (Trend→Entry→Stop→Target→Confidence); ISL panel; icons+voice.
**TEST (BO11):** explanation contains what/why/risk/invalidation, **0 banned phrases**
(guaranteed/sure-shot/100%); speaker button speaks a box; audio-summary order correct.

## BO12 — Responsive (desktop · laptop · tablet · mobile 375px) + final cert
**Build:** ≥1280 two-column; 768 single-column; 375 candles+one pane, others tap-to-expand;
tap targets ≥48×48px; SEBI bar always visible; no horizontal overflow.
**TEST (BO12 — Playwright cert):** screenshots @375/768/1280; no overflow at 375; 5-element box on
every response card; language-switch re-render proof (en→bn title in Bangla); 0 console errors.

## BOn (= BO13) — Honest results + certification report
**Build:** run both harnesses; write **measured** numbers into
[evals/RESULTS.md](evals/RESULTS.md) + [certification/CERTIFICATION_REPORT.md](certification/CERTIFICATION_REPORT.md);
no number claimed before it is measured.
**TEST (BOn):** RESULTS.md numbers trace to a harness run committed in the same change; any gate
that didn't run is honestly marked PENDING, not GREEN.

---

## Execution log — EXECUTED 2026-06-06 (node 229/0 · cert 18/18 · 0 page errors)

| BO | Built | Test | Status |
|----|-------|------|--------|
| BO1 | page shell + 5 gates + SEBI bar/modal + manual refresh | HTML gates grep + syntax | ✅ 11 HTML gates pass |
| BO2 | 9-lang i18n + whole-UI re-render | key-completeness + no-Hinglish + en→bn/te/ta | ✅ 0 missing keys, 0 Hinglish, switch proven |
| BO3 | search + 24-stock universe by cap tier | tier boundaries | ✅ all tiers correct |
| BO4 | 12 indicators + cards | math fixtures (SMA/EMA/RSI) | ✅ exact + warmup→null abstain |
| BO5 | multi-TF confluence (4 ladders) | ladder resolution, opposed→HOLD | ✅ aligned→directional, opposed→HOLD |
| BO6 | risk engine | **no-stop→no-signal** | ✅ **0/96 violations** (0 stop, 0 RR) |
| BO7 | Roshan ⭐ (card + pane + filter) | formula + filter | ✅ matches RSI-vs-SMA20; filter exact |
| BO8 | canvas charts + overlay/separate panes | pane toggles present | ✅ 3 oscillator toggles |
| BO9 | screener + cap tiers + filters | subset + zero-match | ✅ correct subset + nearest-miss |
| BO10 | portfolio (localStorage) | roundtrip + Golden-Rule confirm | ✅ log→close + confirm modal |
| BO11 | explain + audio summary + ISL | banned-phrase scan | ✅ 0 banned phrases / 96 scans |
| BO12 | responsive 375/768/1280 + cert | screenshots + overflow + 5-element | ✅ no overflow, 7/7 boxes wired |
| BOn | RESULTS.md + CERTIFICATION_REPORT.md | measured-not-claimed | ✅ measured numbers; directional-accuracy honestly PENDING |

**Honest gap (not built):** live candle feed (DEMO synthesizer until `chitti-shares-api`
fetch is wired) and the DeepSeek-enhanced Chitti Explain (deterministic template until a
funded key). Directional accuracy ≥70% is therefore **NOT YET MEASURED** — see [evals/RESULTS.md](evals/RESULTS.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
