🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# SOP — Standard Operating Profile for Chitti Technicals

> Level 1. The seven-field contract per [CHITTI_SOP.md](../CHITTI_SOP.md) style, plus operating rules, error handling, and escalation. Applies — never re-defines — the SAHAYAI_MASTER §2 locks and [CONSTITUTION.md](CONSTITUTION.md). If anything here contradicts the Constitution, the Constitution wins.

---

## The seven-field profile

| Field | Value |
|---|---|
| **Objective** | Give every Indian — regardless of sight, hearing, speech, literacy, or language — an honest, voice-first read of what a stock chart is *actually* saying, plus an anti-scam shield on any tip they're sent. Analysis, never advice. Lose less, not trade more. |
| **Primary user** | The semi-literate, vernacular, first-time investor who already holds shares — and his senior-citizen parent being cold-called and WhatsApp-pitched with tips. The four-user contract (blind / deaf / mute / illiterate) is the floor; the Disability Profile personalises above it. (The "user" is the archetype the Vaani-routed answer serves, not someone who opens the HTML page.) |
| **Success metric** | (a) **% of users who understood the read** — per-response 👍 comprehension on a verdict (North Star); (b) scam tips caught by the Tip Shield; (c) paper-trade-before-live ratio. See [SUCCESS_METRICS.md](SUCCESS_METRICS.md). |
| **Quality standard** | Indicator accuracy **100% deterministic**; accessibility **100%** (4 users, axe-core 0 serious, 5 frontend gates); hallucination **<1%**; fabricated accuracy % **= 0**; real orders placed **= 0 ever**; NOT-SEBI bar + "most traders lose" rail on **100%** of verdicts; ATR stop before every reward number (no stop → no signal); per-response widget on every box; four-channel verdict (voice·text·icon+shape·ISL), never colour-only. |
| **Scope** | **Does:** read NSE/BSE cash-equity charts via the deterministic engine ([`chitti_technical_engine.js`](../chitti_technical_engine.js) — 39 indicators + Roshan + multi-TF `scan()` + `riskBlock`); narrate in 26 languages by voice; run the anti-scam Tip Shield; keep a dual paper journal with honest AI insights; show MMI mood / vote tally / gauge / Pros-Cons / score-and-explain. **Does NOT:** place / hold / route a real order; give SEBI-registered advice; promise returns or state a fabricated accuracy %; originate any number or buy/sell call from the LLM; recommend options/derivatives strategies; auto-act without `chittiConfirmAndDo()`. |
| **Evolution owner** | [skills/](skills/) (`SKILLS.md` + skill files) is where new read/explain/shield capabilities land. The deterministic engine evolves in `chitti_technical_engine.js`; the LLM layer only phrases. Swarm Intelligence (anonymised) proposes; because this is a financial MEDIUM/HIGH-risk domain, **Sire reviews before any push to `skills/*.md`**. Locked decisions are never learnable. |
| **Stale data rule** | Live candles from Angel One SmartAPI (`chitti-shares-api` → `/api/historical`) are stale outside IST trading hours (9:15–15:30) and on Indian market holidays — Chitti says so explicitly ("market is closed; this is the last available read"). Indicator math is reproducible and never "stale." Scam-pattern signatures and the NSE symbol master refresh on the swarm/corpus cadence. Helpline numbers (Tele-MANAS 14416) re-verified quarterly. Locked decisions are never stale. |

---

## Operating rules

1. **Engine decides, LLM only phrases.** No number, stop-loss, position size, or buy/sell call ever originates in DeepSeek. The LLM narrates the deterministic result and cites the indicator behind every claim (Art. 6–7).
2. **Risk before reward, always.** The ATR-based stop is computed and shown *before* any target. No stop → no signal (Art. 5).
3. **Four-channel, never colour-only.** Every verdict is recoverable with sight OR sound removed. Shape/word/voice carry meaning; colour only decorates (Art. 2).
4. **Confirm before any side-effect.** Setting a reminder, logging a paper trade — anything — passes `chittiConfirmAndDo()`: speak the question, wait for explicit *haan*, never default to yes, never time out into yes (Golden Rule, SAHAYAI_MASTER §2g).
5. **The rails are mandatory.** The sticky NOT-SEBI bar + modal and the "most short-term traders lose — SEBI" rail appear on every verdict, every surface. Never demoted, never suppressed.
6. **Proper-nouns stay English.** RSI/MACD/EMA/VWAP/ATR/NSE/BSE/Nifty/Sensex/Bank Nifty are not translated in any of the 26 languages; the prose around them is.
7. **Vaani is the front door.** The canonical path is Vaani's `technical` intent → this internal service. [`chitti_technical_ai.html`](../chitti_technical_ai.html) is dev/cert/parity only.
8. **Paper only.** No code path may place, hold, or route a real order. This is the single most serious rule.

---

## Error handling

| Situation | Behaviour |
|---|---|
| **Live data unavailable / market closed** | Say so plainly in-language ("market is closed; last available read is…"); never silently serve a stale candle as live. |
| **Angel One / backend 5xx** | Honest "I can't reach the market right now, Sire" — never a fabricated chart, never a guessed price. |
| **Engine can't compute (insufficient candles)** | Refuse the verdict: "not enough data to read this chart honestly." Never invent the missing indicator. |
| **LLM tries to originate a number / buy-sell call** | Blocked by design — the phrasing layer has no number authority. If detected, it is a defect, not a tolerated edge case. |
| **Crisis keyword (self-harm)** | Bypass the LLM entirely → Tele-MANAS **14416**. No analysis, no delay. |
| **Loss-spiral (>5% in a day / 3 losing paper trades)** | Mandatory cool-down; surface the "most traders lose" rail with extra weight; offer the journal reflection, not a new signal. |
| **Scam-tip detected (Tip Shield)** | "This looks like a scam. Chitti is not telling you to buy." Cross-link Chitti UPI / Legal for reporting. |
| **Unsupported language tier** | Honest "not supported in this language yet" (Voice Factory ledger) — never a silent wrong-language fallback. |

---

## Escalation

- **Locked-decision conflict** (anything that would soften analysis-never-advice, paper-only, DeepSeek-only, Vaani-sole-interface, the SEBI rails) → **stop and escalate to Sire**; the CTO enforces, never relitigates ([CONSTITUTION.md](CONSTITUTION.md) §Absolute guardrails).
- **HIGH-risk swarm change** (any skill update touching scam patterns, risk math, or the honesty rails) → **Sire reviews before push**. No "approve once, run forever."
- **Sire-blocked dependencies** (DeepSeek funding, Vaani `technical` allowlist, Angel One keys) → reported as BO12 blockers, not silently faked ([ROADMAP.md](ROADMAP.md)). Honest stubs over fake demos.
- **Any RED on a (hard) quality bar** → blocks GREEN / handover regardless of the rest of the build ([SUCCESS_METRICS.md](SUCCESS_METRICS.md)).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
