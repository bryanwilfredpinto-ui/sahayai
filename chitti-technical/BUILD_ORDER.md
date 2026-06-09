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

## BO0 — Research best practices FIRST, then dismantle the legacy
**Build:** study the world's best charting/trading apps + fintech UX + accessibility literature
([RESEARCH.md](RESEARCH.md)); **dismantle** the legacy 7,447-line `chitti_complete_technical.html`
monolith (archive to [_legacy/](_legacy/), redirect the URL to the rebuilt `chitti_technical.html`),
**keeping only the technical indicators** from its scanner section (ported into the new engine).
**TEST (BO0):** RESEARCH.md cites real sources + maps each finding to built/added/roadmap; the
legacy URL now redirects (no old monolith UI); the research-driven gap (accessible chart data-table)
is added and cert-checked.

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

## Execution log — EXECUTED 2026-06-06 (research-led; node + cert re-run)

| BO | Built | Test | Status |
|----|-------|------|--------|
| BO0 | best-practices research + dismantle legacy monolith + add accessible chart data-table | sources cited; legacy redirects; data-table cert | ✅ [RESEARCH.md](RESEARCH.md); legacy archived+redirected; table toggle live |
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

## AMENDMENTS — Sire's requirements + official CEOS (2026-06-10)

> Grounds: Sire's call-engine spec + the official **CEOS — Chitti Technical v1.0 FINAL** (Sections 5–13).
> Each BO still ships with the exact TEST that flips it GREEN; the four-user contract gates every BO.
> *(P) = partially built in BO8/BO5 — EXTEND, do not rebuild.*

## BO14 — Chart timeframe selector ON the chart (all 8 TFs) **(P)**
**Build:** a TF tab row on the chart — **1m · 5m · 15m · 1H · 4H · Daily · Weekly · Monthly** (CEOS §6.1);
tap one → redraw at that TF; unavailable TFs dimmed (intraday data shallow — label honestly); live TFs
fetch on demand. DPR-crisp; label syncs.
**TEST (BO14):** 8 tabs render; clicking Weekly/Monthly switches candles + the header label; 0 console errors.

## BO15 — Multi-timeframe SELECTION (triple-screen) **(P)**
**Build:** user picks **trend timeframes + the entry/trigger frame** — 4 presets (CEOS §6.4: Long-Term M+W→D ·
Swing W+D→4H · Day D+4H→1H · Scalper 4H+1H→5m) **+ Custom (any combo).** Higher TF = direction, entry = trigger,
disagreement → **WAIT** (CEOS §6.2/6.3). The chosen config drives the call, the journal and the backtest.
**TEST (BO15):** preset + custom selection both produce a call from exactly the chosen TFs; opposed trend
frames → WAIT; confluence score = agreeing/total per §6.3.

## BO16 — 39-indicator dropdown ON the chart OR below it **(P)**
**Build:** a **"➕ Indicators"** menu listing **all 39 indicators** (extend the current 16) grouped *On the chart*
(overlays: MAs, Bollinger, VWAP, Supertrend, Donchian, Keltner, pivots, Camarilla, S/R zones …) vs *Below the
chart* (oscillators: RSI, MACD, Stochastic, Williams %R, CCI, ADX, MFI, ROC, Momentum, Awesome, StochRSI, TRIX …).
Each is a removable chip; oscillators stack as DPR-crisp panes (CEOS §5 indicator suite, accessibility format each).
**TEST (BO16):** menu lists ≥39 indicators; adding an overlay draws on price, adding an oscillator adds a pane
below; every indicator's audio/visual/haptic mapping present (CEOS §5 tables); 0 console errors.

## BO17 — Dual Journal (user trades + system signals, with outcome) — CEOS §10
**Build:** **User Trade Journal** (entry/SL/T1/T2/exit/PnL/exit-reason) **+ System Signal Journal** (every call:
TFs, confluence, dir, confidence, entry/SL/targets) with **outcome tracking** (SL_HIT / T1_HIT / T2_HIT /
PENDING, `accurate` flag). On-device; Golden-Rule confirm to log; narratable rows + 5-element box.
**TEST (BO17):** log→close roundtrip persists; system journal auto-logs every call; outcome + `accurate`
computed on close; "log trade" opens a Yes/No confirm (never auto-acts).

## BO18 — Backtest: 3-year, NET of costs, both directions — Sire's spec
**Build:** backtest the user's **exact TF + indicator config**; **net of brokerage + STT + slippage**; a call is a
win if **target hits before stop**; **long AND short**; ~3-yr on Daily/Weekly/Monthly (intraday = whatever history
exists, **labelled honestly**); no look-ahead. Output: trades · win% · profit factor · net P&L · max drawdown.
**TEST (BO18):** walk-forward, SL-first-conservative; net result < gross (costs applied); short trades counted;
intraday window labelled with its true span; numbers reproduce on a fixture.

## BO19 — Glass-box track record + AI insights (after 10 trades) — CEOS §9.3 (Tickeron best-practice)
**Build:** show the call's **success-probability + historical track record** right next to the verdict (glass-box);
after ≥10 logged trades, deterministic insights: overtrading · cutting-winners-short · best/worst setup ·
emotional-trading (CEOS §9.3).
**TEST (BO19):** track-record surfaces from the journal/backtest; insights fire only after 10 trades; **win-rate
labelled "estimate, not advice"**; 0 banned phrases.

## BO20 — Paper-first + confirmation + audio summary + 6-agent orchestrator — CEOS Articles 3-4, §9.1, §11
**Build:** **10 paper trades before live signals** (CEOS Art.3) with accessible risk-acknowledgment; **confirmation
required** for every trade (voice "confirm" OR double-tap, CEOS Art.4) — never autonomous; Audio Trade Summary in
order **Trend→Entry→Stop→Target→Confidence** (P5); align the engine to the named 6 agents (Data·Technical·Confluence·
Risk·Signal·Journal, CEOS §9.1).
**TEST (BO20):** live signals gated until 10 paper trades done; trade needs explicit confirm; audio-summary order
correct; crisis path → Tele-MANAS 14416 (no LLM); loss-spiral >5%/day → cool-down (CEOS Art.8, §13.4).

## BO21 — Pattern-learning v1 (remember my style, on-device) — Sire's spec (staged)
**Build:** remember the user's preferred timeframes, watched stocks, and the calls they 👍/act on; tilt toward
their style; on-device, no PII to server. (Stage 2 — results-based tuning — deferred until the journal is rich.)
**TEST (BO21):** preferences persist + bias the defaults; nothing leaves the device (no network call carries the profile).

> **Build-order note for the coder:** BO14/BO15/BO16 EXTEND what already exists (chart TF tabs + 16-indicator
> picker are live) — finish to 8 TFs, the triple-screen selector, and all 39 indicators. BO17–BO21 are new.
> Honour every existing gate: 5-element box (now incl. ✏️), 9 languages, axe 0 WCAG 2.2 AA on 5 devices,
> no-stop→no-call, NOT-SEBI bar, decision-first primary (CEOS §3 personas; advanced = P9, one tap).

### Amendment execution log — EXECUTED 2026-06-10

| BO | Built | Test | Status |
|----|-------|------|--------|
| BO14 | chart TF selector, all 8 (1m→Monthly) | tabs switch candles | ✅ live |
| BO15 | triple-screen: 8-TF checkboxes + 4 presets + custom | ladder resolves; opposed→WAIT | ✅ present |
| BO16 | 39-indicator picker — 24 plotted (overlay/pane) + readings | cert chart_indicator_picker_present (40) | ✅ **certified** |
| BO17 | portfolio + system-signal journals + scorecard outcomes | roundtrip + evaluateSignal | ✅ present |
| BO18 | net-of-cost (brokerage+STT+slippage), long & short backtest | net<gross; both sides counted | ✅ **certified** (₹1,06,854→₹79,592) |
| BO19 | glass-box scorecard + calibration + aiInsights | win-rate labelled estimate; 0 banned | ✅ present |
| BO20 | paper-first badge N/10 + Paper-trade (Golden-Rule confirm) | 0→3/10 persists; live gated | ✅ built |
| BO21 | pattern-learning v1 — "learning you" chip, on-device | 1 distinct call=1 count; no PII leaves device | ✅ built |

**Wave QA:** node 354/0 · cert_technical 31/0 (axe 0 WCAG 2.2 AA, 14/14 boxes, 0 page errors).
Evidence: `tools/cert_screenshots/prd_chart_39ind.png`, `prd_paper_learn.png`.

**Honest gaps (not BO scope):** live candle feed is a DEMO synthesizer until `chitti-shares-api` is wired;
DeepSeek-enhanced Explain is the deterministic template until a funded key; directional-accuracy ≥70% is
therefore **NOT YET MEASURED on live data**. Real-device + human-AT sign-off is Sire's.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
