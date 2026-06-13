🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — what we measure, and the bars we will not ship below

> Level 1. The number Sire tracks, plus the supporting telemetry and the merge-blocker quality bars. Derived from [CONSTITUTION.md](CONSTITUTION.md) and the Founder Rule (lose less, not trade more). If a metric rewards *more trading*, it is the wrong metric — by law.

---

## North Star — comprehension, not engagement

> **% of users who understood the read** — measured as the per-response 👍 ("I understood this") on a verdict, especially from blind / illiterate / vernacular users.

We deliberately do **not** make trade count, session length, or order volume a North Star. Those are the industry's engagement metrics, and engagement is the predation the Founder Rule rejects. A user who understood her share's read, dodged a scam, and *did nothing* is a **success** here. (Contrast: every one of the 40 audited apps in [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) optimises engagement.)

How it's captured: the per-response widget (👍 / 👎 / 🔊 / 🤖 / ✏️🎙️ via `feedback-widget.js` + `data-chitti-response`) on every verdict box, tagged to box ID, into the Founder dashboard daily.

---

## Secondary metrics (supporting telemetry)

| Metric | What it tells us | Target direction |
|---|---|---|
| **Scam tips caught** | Tip Shield flagged a forwarded "tip" as a scam pattern before money moved | ↑ (the moat working) |
| **Paper-trade-before-live ratio** | Users journaling on paper vs. (eventually) acting elsewhere — protection over churn | ↑ paper |
| **Per-response 👍 rate** | Quality of every box, not just the North Star verdict | ↑ |
| **"Most traders lose" rail shown** | The SEBI honesty rail surfaced on every verdict | **100% (hard)** |
| **Four-channel recoverability** | Verdict 100% recoverable with sight OR sound removed | **100% (hard)** |
| **Blind/illiterate journey completion** | The four-user floor actually holds | **100% (hard)** |
| **Crisis / loss-spiral interventions fired** | Cool-down + Tele-MANAS 14416 triggered when thresholds hit | as-designed (every time) |
| **Confluence honesty** | Verdicts where the stated agreement matches the engine's vote count | **100%** |

The three rows marked **(hard)** are not KPIs to trend upward — they are constants. Anything below them is a defect.

---

## Quality bars (merge-blockers — below this is a defect, not a gap)

| Bar | Standard | How verified |
|---|---|---|
| **Indicator accuracy** | **100% deterministic** — RSI/MACD/ATR/Roshan/confluence reproducible on demand | `tools/test_technical_engine.mjs` gold files + `test_confluence.mjs` |
| **Accessibility** | **100%** — all 4 users complete every journey; axe-core 0 serious/critical; 5 frontend gates | `cert_chitti_technical_ai.mjs` + `test_accessibility.mjs` × 4 profiles |
| **Hallucination** | **<1%** — LLM cites the indicator behind every claim; engine is source of truth | Eval suite ([EVALS.md](EVALS.md)) + sampled review |
| **Fabricated accuracy %** | **0** — no "92% accurate" theatre; confidence is banded and reproducible | Static scan + eval (any unreproducible % = fail) |
| **Real orders placed** | **0 — ever** — paper journaling only; `chittiConfirmAndDo()` gates every side-effect | Code audit + guardrail tests |
| **NOT SEBI bar present** | **100%** of surfaces — sticky bar + modal, never demoted to footer | Cert per page |
| **SEBI "most traders lose" rail** | **100%** of verdicts | Cert per verdict |
| **Proper-noun lock** | RSI/MACD/EMA/VWAP/ATR/NSE/Nifty/Sensex stay **English** in all 26 languages | `test_languages.mjs` 26/26 + no-Hinglish scan |

---

## What a RED looks like (so it can't hide)

- A verdict renders correctly *visually* but the blind journey can't recover it → **RED** (accessibility 100% breached).
- The LLM states a number the engine can't reproduce → **RED** (hallucination / fabricated %).
- A verdict ships without the "most traders lose" rail → **RED** (rail 100% breached).
- Any code path that could place a real order → **RED** (paper-only law breached) — the most serious of all.

A defect in any (hard) row blocks GREEN regardless of how strong the rest of the build is. See [SOP.md](SOP.md) for the operating profile and escalation, and [ROLE.md](ROLE.md) for who enforces these.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
