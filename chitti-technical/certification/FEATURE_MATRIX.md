# FEATURE_MATRIX — Chitti Technical (BO14–BO21 + multi-modal)

**Evidence-only. YES = evidence file/line exists and is named below. NO = no evidence (not "implied", not "soon").**
Generated 2026-06-10. Harness run: `node test_technical.mjs` **361/0** · `cert_technical` **31/0** ·
`certify_technical` **buttons 132/132, axe 0 serious × 5 devices, pageErrors 0** · `gates_shots` **5 devices, 14 boxes, axe 0**.

Column meanings (so YES/NO is unambiguous):
- **Exists** — code is in the repo (file:line given in FEATURE_EVIDENCE.md).
- **UI Exists** — rendered element confirmed present in a screenshot/DOM check.
- **Button Clicked** — the feature's control was among the **132/132 buttons** clicked with 0 error in `certify_technical`.
- **Accessibility Tested** — page carrying the feature passed **axe-core 0 serious/critical WCAG 2.2 AA** on that run.
- **Mobile / Tablet / Desktop Tested** — feature confirmed present + 0 page-error on iPhone 390 / iPad 810 / Desktop 1920 (evidence shots).
- **Unit Tested** — a named assertion in `tools/test_technical.mjs` targets it.
- **Integration Tested** — live page exercised the feature without error in `cert_technical`/`certify_technical`.
- **Certification Covered** — a **named** assertion in `cert_technical`/`certify_prd` validates its behaviour.

| Feature | Exists | UI Exists | Button Clicked | Accessibility Tested | Mobile Tested | Tablet Tested | Desktop Tested | Unit Tested | Integration Tested | Certification Covered |
|---|---|---|---|---|---|---|---|---|---|---|
| **BO14** Chart TF selector (8 TFs 1m→Monthly) | YES | YES | YES | YES | YES | YES | YES | **NO** | YES | YES¹ |
| **BO15** Triple-screen MTF (8-TF checkboxes + 4 presets) | YES | YES | YES | YES | YES | YES | YES | YES | YES | **NO** |
| **BO16** 39-indicator picker (24 plotted + readings) | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| **BO17** Dual journal + outcome (portfolio + system signal) | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES² |
| **BO18** Net-of-cost, both-direction backtest | YES | YES³ | YES | YES | YES³ | YES³ | YES³ | YES | YES | **NO** |
| **BO19** Glass-box: scorecard / calibration / aiInsights | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES² |
| **BO20** Paper-first badge + Paper-trade button | YES | YES | YES | YES | YES | YES | YES | **NO** | YES | **NO** |
| **BO21** Pattern-learning v1 ("learning you" chip) | YES | YES | YES | YES | YES | YES | YES | **NO** | YES | **NO** |
| **MM-1** Sonification ("🎵 Hear the chart") | YES | YES | YES | YES | YES | YES | YES | **NO** | YES | **NO** |
| **MM-2** Haptics (BUY/SELL/WAIT vibration) | YES | **NO**⁴ | **NO**⁴ | **NO**⁴ | **NO**⁴ | **NO**⁴ | **NO**⁴ | **NO** | **NO**⁴ | **NO** |

**Footnotes (honest caveats — read these):**
1. BO14 "Certification Covered" = `certify_prd` CC7 verifies the **chart renders** (candles fill width); there is **no named check that asserts all 8 TF tabs switch** — only that the chart draws. Treat as partial.
2. BO17/BO19 "Certification Covered" = `certify_prd` CC6 ("every signal logged" → system journal + scorecard/calibration present). It does **not** assert a full log→close→outcome UI round-trip in the browser.
3. BO18 "UI/Mobile/Tablet/Desktop" = the **backtest card is present** on all viewports, but the **net-of-cost number renders only after tapping "Run backtest"**, which the evidence shots did **not** trigger. The cost **math** is proven by 7 unit tests (net < gross, cost field, both directions); there is **no screenshot of the rendered net figure** and **no named cert check** for it. NO on "Certification Covered" is honest.
4. MM-2 Haptics: code exists and fires on every verdict, but vibration is **not visible in a screenshot, not runnable in headless Chromium, and not axe-testable**. There is **no automated evidence** — only the code path. Everything but "Exists" is NO until a real device confirms it (Sire's gate 10).

**Net honest tally:** 8 of 10 features have real automated evidence across UI + 3 viewports + a11y. **Gaps with NO:** BO14 has no 8-TF-switch cert; BO18 net-figure has no screenshot/cert (math is unit-tested); BO20/BO21/Sonify have **no unit test** (UI/localStorage/Web-Audio — exercised live but not asserted); Haptics has **no automated evidence at all**.
