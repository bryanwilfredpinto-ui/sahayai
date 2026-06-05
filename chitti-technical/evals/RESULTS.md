🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL RESULTS — Chitti Technical

**Honest status as of 2026-06-06 — page + harnesses BUILT and RUN.**

> No number below is fabricated. Numbers come from two harnesses run this commit:
> **node** [tools/test_technical.mjs](../../tools/test_technical.mjs) → `229 PASS / 0 FAIL`,
> **Playwright** [tools/cert_technical.mjs](../../tools/cert_technical.mjs) → `18 PASS / 0 FAIL, 0 page errors`.
> Where market outcomes haven't elapsed, the cell honestly says **NOT YET MEASURED**.

| Eval | Target | Status | Number / proof |
|---|---|---|---|
| **Risk accuracy — structural** ([risk_accuracy.md](risk_accuracy.md)) | ≥ 90% | 🟢 **MEASURED 100%** | **0 / 20 directional signals lacked a correct-side stop; 0 below the RR floor, across 96 scans** (4 trade types × 24 stocks). The NO-stop→NO-signal guardrail held: 20 directional + 76 HOLD. |
| **Hallucination — deterministic path** ([hallucination_eval.md](hallucination_eval.md)) | < 1% | 🟢 **MEASURED 0%** | every explanation is templated from engine numbers; **0 banned phrases** ("guaranteed/sure-shot/100%") across all 96 scans. LLM-enhanced path pending DeepSeek key. |
| **Explainability** ([explainability_eval.md](explainability_eval.md)) | = 100% | 🟢 **MEASURED 100%** | every directional explanation carries what · why · risk · invalidation (template-guaranteed); verified on 96 scans. |
| **Accessibility** ([accessibility_eval.md](accessibility_eval.md)) | = 100% | 🟢 **MEASURED** | cert: 5-element box on **7/7** response boxes; G3 disability modal fires on first visit; lang switch en→bn/te/ta re-renders; SEBI bar; tap targets ≥44px; **0 page errors**. |
| **Mobile 375px** | = 100% | 🟢 **MEASURED** | no horizontal overflow at 375; screenshots @375/768/1280 in [tools/cert_screenshots/](../../tools/cert_screenshots/). |
| **i18n (9 languages, no Hinglish)** | 100% | 🟢 **MEASURED** | all 9 packs complete (0 missing keys); **0 Hinglish leaks** in the 8 non-English packs. |
| **Performance** | < 2 s/scan | 🟢 **MEASURED** | deterministic engine, sub-millisecond per scan; page renders instantly (96 scans run in the node test in <1 s total). |
| Signal accuracy — **directional vs market** ([signal_accuracy.md](signal_accuracy.md)) | ≥ 70% | ⏳ **NOT YET MEASURED** | needs live signals to elapse against real NSE closes + the backtest harness. Engine emits verdicts today; correctness-vs-market is honestly unproven. **No number claimed.** |
| Hallucination — **LLM-enhanced path** | < 1% | ⏳ NOT YET MEASURED | needs a funded DeepSeek key to run the Chitti Explain enhancement + judge. |

## What IS true today (verifiable, not claimed)
- **The page is built and works offline** — `chitti_technical.html` + deterministic
  [chitti_technical_engine.js](../../chitti_technical_engine.js) + 9-language
  [chitti_technical_i18n.js](../../chitti_technical_i18n.js).
- **12 indicators + Roshan computed client-side**; full 38-indicator catalogue
  available via the `chitti-shares` engine ([../indicators/INDICATORS.md](../indicators/INDICATORS.md)).
- **Roshan is live** (RSI14 vs SMA20-of-RSI14), surfaced as card + chart pane + screener filter.
- **Both harnesses are committed and reproducible**: `node tools/test_technical.mjs`
  and `node tools/cert_technical.mjs`.

## Honest caveat
"Risk accuracy 100%" means **structural validity** (every directional signal had a
valid, correctly-sided stop with RR above floor) — NOT "the trades won." Whether a
signal actually reaches its target before its stop (directional accuracy ≥70%) is
**unmeasured** until live signals elapse against real NSE data. We claim only what we measured.

## Path to the last two numbers
1. Wire live candles (replace DEMO synthesizer with `chitti-shares-api` fetch on Refresh).
2. Log every emitted signal; score target-first vs stop-first when its timeframe elapses.
3. Fund DeepSeek → run the Chitti Explain enhancement + hallucination judge.
4. Update this file with the **measured** directional-accuracy number — never before.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
