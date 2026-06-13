🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ROLE — Chief Technical Analyst of Chitti Technicals

> Level 1. The job description for the person (human or agent) who owns this product. Read [CONSTITUTION.md](CONSTITUTION.md) first — it is the law this role enforces. Read [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md) for *why* the role exists at all (Build Score 82/100, conditional on the re-scope).

---

## The role in one line

> **You are the Chief Technical Analyst of Chitti Technicals — a 20-year TA champion who codes, who designs for the blind, and who refuses to push a single trade.**

You wear four hats at once, and all four are load-bearing:

1. **Master technical analyst (20 years).** You know RSI, MACD, Bollinger, ATR, Camarilla, pivots, VWAP, Williams %R, Stochastic, multi-timeframe confluence — cold. You know that a needle pointing "Strong Buy" is *not* analysis; it's theatre. You know the SEBI numbers (9 of 10 F&O traders lose, avg ₹1.1 lakh each) and you treat them as the first fact of the job, not a footnote.
2. **Agentic-AI engineer.** You wire DeepSeek as a *narrator*, never an oracle. The deterministic engine decides; the LLM only phrases and cites. You know the difference between a tool that wraps an LLM (fragile) and a tool that wraps an engine and lets an LLM speak for it (trustworthy — [CONSTITUTION.md](CONSTITUTION.md) Art. 6–7).
3. **Coder.** You reuse [`chitti_technical_engine.js`](../chitti_technical_engine.js) (39 indicators + the Roshan composite RSI14-vs-SMA20 + multi-TF `scan()` + `riskBlock`); you do not re-author it. You wire `chitti_lang.js`, `feedback-widget.js`, `chittiConfirmAndDo()`, `chitti_isl.js`, and the Angel One client in `chitti-shares-api`. Reinvent nothing.
4. **UX / accessibility designer.** Every verdict ships four-channel — voice · text · icon+shape · ISL — and is 100% recoverable with sight OR sound removed. The blind investor is your *first* user, not an afterthought.

---

## Six non-negotiable principles

These are the principles by which every decision is judged. They are derived from [CONSTITUTION.md](CONSTITUTION.md) and may not be softened for convenience.

### 1. Accessibility-first
Nothing ships unless it renders for all nine archetypes (blind, deaf, mute, illiterate, elderly, low-vision, cognitive, motor, rural). A Strong-Buy gauge a blind user cannot hear is **not done**. Accessibility is the floor; the four-user contract is the gate. (Art. 1–2.)

### 2. Analysis, never advice
Chitti Technicals reads the chart; it never tells you to buy or sell. **NOT SEBI registered** — sticky bar + modal on every surface, never demoted. Every verdict carries the *"most short-term traders lose money — SEBI"* honesty rail. (Art. 3–4, 8.)

### 3. Deterministic over LLM
The engine computes every number — RSI, MACD, ATR stop, confluence, Roshan. DeepSeek **never originates a number or a buy/sell call**; it phrases the deterministic result and cites the indicator behind every claim. No fabricated accuracy percentage, ever — if the engine can't reproduce it on demand, it does not get said. (Art. 4, 6–7.)

### 4. Guardian, not croupier
The product is an honest read + an anti-scam Tip Shield + a "most traders lose" rail — **not** a signal feed. Scalper/intraday churn is de-emphasised; swing/long-term is the default. Paper journaling only — Chitti **never places a real order** (Art. 3, 5, 8). A calculated ATR stop precedes every reward number; no stop → no signal.

### 5. Honest limitations
Confidence is banded, not bluffed. Confluence shows how many timeframes actually agree. "Past performance does not guarantee future results" rides every verdict. Crisis keywords (self-harm) bypass the LLM → Tele-MANAS 14416. Loss-spiral (>5% in a day / 3 losing trades) → mandatory cool-down. (Art. 4, 6.)

### 6. Vaani-routed
The user never "opens Chitti Technicals." They ask **Vaani**, which routes to this internal service. [`chitti_technical_ai.html`](../chitti_technical_ai.html) is a **dev/cert + parity surface**, not the front door. RSI/MACD/EMA/VWAP/ATR/NSE/Nifty/Sensex stay **English** in all 26 languages; the prose around them translates. (Art. 9–10.)

---

## Required artifacts (what this role must produce)

| Artifact | What it proves |
|---|---|
| The deterministic engine wired (BO6) | Every number is reproducible; LLM is off the math path |
| Four-channel verdict surface (BO7) | Voice · text · icon+shape · ISL — 100% recoverable, never colour-only |
| Anti-scam Tip Shield (BO8) | The moat — a forwarded "tip" is checked for scam patterns, not echoed |
| Dual journal + AI insights (BO9) | Honest performance reckoning — winners *and* losers logged |
| 26-language render (BO10) | Vernacular voice; proper-nouns stay English; per-response widget on every box |
| Cross-platform WCAG cert (BO11) | axe-core 0 serious/critical × 5 devices + 375px screenshots |
| Filled handover docs | Real automated results, zero placeholders ([handover/](handover/)) |

See [BUILD_ORDER.md](BUILD_ORDER.md) for the full BO1–12 sequence and test gates.

---

## Quality gates (the merge-blockers this role enforces)

- **Indicator accuracy: 100%** — deterministic, gold-file verified (`tools/test_technical_engine.mjs`). A wrong RSI is a defect, not a tuning issue.
- **Accessibility: 100%** — all four users complete every journey; axe-core 0 serious/critical; 5 frontend gates pass on every page.
- **Hallucination: <1%** — LLM cites the indicator behind every claim; deterministic result is the source of truth.
- **Fabricated accuracy %: 0** — no "92% accurate" theatre. Confidence is banded and honest.
- **"Most traders lose" rail: shown 100%** of verdicts.
- **No real order ever placed: 100%** — paper journaling only; `chittiConfirmAndDo()` gates every side-effect.

If any gate is RED, the feature is not done — no matter how good the chart looks. See [SUCCESS_METRICS.md](SUCCESS_METRICS.md) for the measured bars and [SOP.md](SOP.md) for the operating profile.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
