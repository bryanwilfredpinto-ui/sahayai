# FEATURE_EVIDENCE — Chitti Technical (BO14–BO21 + multi-modal)

Evidence-only. Every screenshot path is under [`tools/cert_screenshots/`](../../tools/cert_screenshots/).
Harness: `tools/test_technical.mjs` (361/0), `tools/cert_technical.mjs` (31/0), `tools/certify_technical.mjs`
(132/132 buttons, axe 0×5, 0 errors), `tools/gates_shots.mjs` (5 devices). Code lines verified 2026-06-10.

Screenshot legend (the device shots used as D/E/F/G below):
- Per-feature 3-viewport: `evidence_desktop_1920x1080.png`, `evidence_tablet_ipad_810x1080.png`, `evidence_mobile_iphone_390x844.png`
  (each: full page, LIVE data, signal generated, Keltner+ATR+Ichimoku added, a paper trade logged — programmatic check confirmed paper+learn+sonify+"Indicators (40)"+readouts present, 0 errors on all three).
- 5-device whole-page + axe: `gate1_full_{desktop_1920x1080,laptop_1366x768,tablet_ipad_810x1080,mobile_android_360x800,mobile_iphone_390x844}.png`.
- Feature-specific: `prd_chart_39ind.png` (40-indicator picker + readouts), `prd_paper_learn.png` (paper badge + learning chip).

---

## BO14 — Chart timeframe selector (all 8: 1m·5m·15m·1H·4H·Daily·Weekly·Monthly)
- **A. Requirement:** a tab row on the chart to switch the candle timeframe across all 8 frames.
- **B. Files changed:** `chitti_technical.html`.
- **C. Code lines:** `CHART_TFS` [chitti_technical.html:1223](../../chitti_technical.html#L1223); `setChartTf` [:1235](../../chitti_technical.html#L1235).
- **D. Desktop:** `evidence_desktop_1920x1080.png` (tab row visible). **E. Mobile:** `evidence_mobile_iphone_390x844.png`. **F. Tablet:** `evidence_tablet_ipad_810x1080.png`. **G. (same set).**
- **H. Accessibility:** axe 0 serious WCAG 2.2 AA on all 5 devices (`gates_shots` GATE1_RESULT allClean:true).
- **I. Unit test:** **NO** — no assertion targets the 8 tabs switching.
- **J. Cert test:** `certify_prd` CC7 verifies the chart **renders** (candles fill width) — not the 8-TF switch specifically.
- **K. Manual journey:** open page → chart shows with TF tabs → tap Weekly → candles redraw at weekly. (Tabs are among the 132/132 buttons clicked, 0 error.)
- **L. Limitations:** intraday frames (1m/5m/15m) depend on shallow live history; no test asserts each tab re-renders.

## BO15 — Triple-screen multi-timeframe selection
- **A. Requirement:** user picks trend timeframes + entry frame (presets + custom); higher TF governs, disagreement → WAIT.
- **B. Files:** `chitti_technical.html`, `chitti_technical_engine.js`.
- **C. Code lines:** `tickedTfs` [:755](../../chitti_technical.html#L755); engine ladders/confluence `tfVerdict`/`confluenceScore` in `chitti_technical_engine.js`.
- **D–G. Screenshots:** TF checkboxes + presets visible in `evidence_*` (3 viewports) and `gate1_full_*` (5 devices).
- **H. Accessibility:** axe 0×5.
- **I. Unit test:** **YES** — `test_technical.mjs` asserts aligned TFs → directional, opposed TFs → HOLD (confluence/ladder cases).
- **J. Cert test:** **NO named check.** Exercised live without error (cert 31/0).
- **K. Manual journey:** pick Daily+4H preset → call uses those frames; flip a frame opposed → WAIT.
- **L. Limitations:** no named cert assertion for the preset→entry-frame mapping in the browser.

## BO16 — 39-indicator picker (24 plotted + readings)
- **A. Requirement:** dropdown of all 39 indicators, on the chart (overlay) or below it (pane/reading).
- **B. Files:** `chitti_technical.html`.
- **C. Code lines:** `OVERLAYS` [:1239](../../chitti_technical.html#L1239); `OSCILLATORS` [:1249](../../chitti_technical.html#L1249); `READOUTS`/`ensureReadouts` [:1268](../../chitti_technical.html#L1268); `buildChartIndMenu` [:1381](../../chitti_technical.html#L1381).
- **D. Desktop / E. Mobile / F. Tablet / G:** `prd_chart_39ind.png` + `evidence_*` — picker button reads **"➕ Indicators (40)"**; Ichimoku/Vortex render as value+signal readings.
- **H. Accessibility:** axe 0×5; each oscillator pane `role=img` + `aria-label`.
- **I. Unit test:** **YES** — `test_technical.mjs:137-144` `indicatorSet returns >=38` + every name produced (no phantoms).
- **J. Cert test:** **YES** — `cert_technical.mjs` `chart_indicator_picker_present` (≥ menu items) + `indicator_dropdown_toggle_filters_grid`.
- **K. Manual journey:** tap ➕ Indicators → menu lists 40 → add Keltner (draws on price) → add ATR (pane) → add Ichimoku (reading row). Confirmed in evidence run (readouts=1).
- **L. Limitations:** ~15 indicators are value+signal **readings**, not full multi-line plots (Ichimoku cloud, PSAR dots, Heikin candles drawn as readings, honestly labelled).

## BO17 — Dual journal (portfolio + system signal) with outcome
- **A. Requirement:** user trade journal + auto system-signal journal; outcomes (SL/T1/T2) + accuracy.
- **B. Files:** `chitti_technical.html`, `chitti_technical_engine.js`.
- **C. Code lines:** `logSystemSignal` [:1511](../../chitti_technical.html#L1511); engine `scorecard` [chitti_technical_engine.js:1163], `evaluateSignal` [:1138].
- **D–G. Screenshots:** journal/portfolio + scorecard cards visible in `gate1_full_*` (full mode).
- **H. Accessibility:** axe 0×5; narratable rows + 5-element box.
- **I. Unit test:** **YES** — `test_technical.mjs` scorecard (sample/win-rate/PF/expectancy/go-no-go) + backtestJournal rows.
- **J. Cert test:** **YES (partial)** — `certify_prd` CC6 "every signal logged" (system journal + scorecard/calibration present).
- **K. Manual journey:** generate → system signal auto-logged; log a portfolio trade (Golden-Rule confirm) → close → P&L computed.
- **L. Limitations:** CC6 checks presence, not a full browser log→close→outcome round-trip assertion.

## BO18 — Backtest: net of brokerage+STT+slippage, long & short
- **A. Requirement:** backtest the chosen config, **net of costs**, both directions, no look-ahead.
- **B. Files:** `chitti_technical_engine.js`, `chitti_technical.html`.
- **C. Code lines:** `backtestJournal` cost model [chitti_technical_engine.js:1301] (`costPct`, `grossPnl`/`cost`/`pnl`); page label `renderBacktest` [chitti_technical.html:972].
- **D–G. Screenshots:** backtest **card** visible on 3 viewports (`evidence_*`); **the rendered net figure is NOT screenshotted** (requires "Run backtest" tap, not triggered).
- **H. Accessibility:** axe 0×5 (card on page).
- **I. Unit test:** **YES (new, 7 assertions)** — `test_technical.mjs`: row carries grossPnl+cost+net; `net = gross − cost`; default cost > 0; `costPct=0` → gross; **NET total < GROSS total**; **both BUY & SELL present**. Measured on fixture: **₹1,06,854 gross → ₹79,592 net**.
- **J. Cert test:** **NO** — no named browser cert asserts the net figure renders.
- **K. Manual journey:** Full analysis → Backtest → Run → table caption shows "NET of brokerage + STT + slippage · long & short".
- **L. Limitations:** intraday backtest window is shallow (free feed) and labelled honestly; net-figure render is unit-proven, **not** screenshot/cert-proven.

## BO19 — Glass-box: scorecard / calibration / AI insights
- **A. Requirement:** show track record + success-probability; coaching insights after ≥10 trades.
- **B. Files:** `chitti_technical_engine.js`, `chitti_technical.html`.
- **C. Code lines:** `aiInsights` [chitti_technical_engine.js:1116]; `scorecard` [:1163]; `calibration` [:1185].
- **D–G. Screenshots:** scorecard card in `gate1_full_*`.
- **H. Accessibility:** axe 0×5.
- **I. Unit test:** **YES** — `test_technical.mjs:220-242`: aiInsights silent before 10 trades, win-rate insight after 10; scorecard win-rate/PF/expectancy/go-no-go.
- **J. Cert test:** **YES (partial)** — `certify_prd` CC6.
- **K. Manual journey:** after 10 logged trades, insights surface (win-rate labelled "estimate, not advice").
- **L. Limitations:** win-rate is an **estimate from logged/backtested trades, not live-verified accuracy** (labelled as such).

## BO20 — Paper-trading first
- **A. Requirement:** "practise N/10 before live"; Paper-trade logs without real money; confirmation required.
- **B. Files:** `chitti_technical.html`.
- **C. Code lines:** `paperLogTrade` [:780](../../chitti_technical.html#L780); `paperBadge` [:785](../../chitti_technical.html#L785).
- **D. Desktop / E. Mobile / F. Tablet / G:** `prd_paper_learn.png` (mobile, "📝 Practice first 3/10" + button) + `evidence_*` (paper=true on all 3 viewports).
- **H. Accessibility:** axe 0×5; badge + button have text + min 44px target.
- **I. Unit test:** **NO** — UI/localStorage logic, not asserted in `test_technical.mjs`.
- **J. Cert test:** **NO named check.** The Paper-trade button **was clicked** in the 132/132 audit with 0 error (integration-exercised).
- **K. Manual journey:** generate BUY → "Practice first 0/10" + Paper-trade button → tap (confirm) → "1/10" persists. Verified live (0→3/10).
- **L. Limitations:** the 10-trade threshold does not hard-block "live" calls (Chitti gives educational calls, never orders) — it is an informational practice gate; no automated test.

## BO21 — Pattern-learning v1 (on-device)
- **A. Requirement:** remember the user's timeframes/stocks/calls; no PII to server.
- **B. Files:** `chitti_technical.html`.
- **C. Code lines:** `learnRecord` (+ dedup guard) [:768](../../chitti_technical.html#L768).
- **D–G. Screenshots:** `prd_paper_learn.png` + `evidence_*` — "🧠 Chitti is learning you: N calls · <TF>" (learn=true on all 3 viewports).
- **H. Accessibility:** axe 0×5.
- **I. Unit test:** **NO** — localStorage/UI.
- **J. Cert test:** **NO named check.** Exercised live (records on generate; count = 1 per distinct call, verified).
- **K. Manual journey:** generate → chip shows "1 call"; re-generate same → still 1 (dedup); new stock → 2.
- **L. Limitations:** v1 records + displays; it does **not yet bias defaults** (Stage 2 deferred). No PII leaves device (no network call carries the profile) — asserted by reasoning, **not** by an automated network test.

## MM-1 — Sonification ("🎵 Hear the chart")
- **A. Requirement:** a blind user hears the chart shape (price → pitch) + spoken trend.
- **B. Files:** `chitti_technical.html`.
- **C. Code lines:** `sonifyChart` [:794](../../chitti_technical.html#L794).
- **D–G. Screenshots:** "🎵 Hear the chart" button present on 3 viewports (`evidence_*`, sonify=true).
- **H. Accessibility:** the feature **is** an accessibility affordance; axe 0×5 on the page; button has text label.
- **I. Unit test:** **NO** — Web Audio doesn't run meaningfully in headless.
- **J. Cert test:** **NO named check.** Button **clicked** in 132/132 audit with 0 error.
- **K. Manual journey:** generate → tap "🎵 Hear the chart" → ascending/descending tones + "Price is rising. 40 candles."
- **L. Limitations:** audio output itself is **not** verified by automation — only that the button exists and clicks without error. Needs a human ear (Sire's gate 10).

## MM-2 — Haptics (feel the call)
- **A. Requirement:** distinct vibration for BUY/SELL/WAIT.
- **B. Files:** `chitti_technical.html`.
- **C. Code lines:** `haptic` [:815](../../chitti_technical.html#L815); `hapticForDecision` [:816](../../chitti_technical.html#L816); fired in `renderVerdict`.
- **D–G. Screenshots:** **NONE** — vibration is not visible.
- **H. Accessibility:** intended accessibility feature; **not axe-testable**.
- **I. Unit test:** **NO.** **J. Cert test:** **NO** — `navigator.vibrate` is absent/no-op in headless Chromium.
- **K. Manual journey:** generate BUY → phone vibrates [200,100,200] (real device only).
- **L. Limitations:** **No automated evidence exists.** Code path only. Real-device confirmation required (Sire's gate 10). This is the one feature where I have nothing but the code — stated plainly.
