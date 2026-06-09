🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Blind User (Persona: Ravi, ~5 crore Indians)

> The blind user is a **first-class** Chitti Technicals user, not an afterthought. A stock chart is
> the single most screen-reader-hostile object in finance — pure pixels, zero text. **None of the 40
> apps we audited speaks a verdict** ([RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)). This is our
> hero feature. Implements [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What he needs
- To know **what the chart is actually saying** — by voice, in one sentence, *first* — without looking.
- To explore the price line and indicators with no sight: pitch, earcons, and a real data table.
- Every number, state, and disclaimer spoken — **nothing locked in an image.**
- Screen-reader announcements that fire on **events**, not on every tick (no spam).
- Zero sighted assistance to complete a full read or a tip-check.

## How Chitti Technicals serves him
| Need | Implementation |
|---|---|
| One-sentence verdict first | On result, speak: *"Reliance daily: Neutral leaning Sell. RSI 68, overbought. Be careful — most short-term traders lose."* (highest-leverage blind win) |
| Sonify the price line | `audio_graph.js`: pitch L→R, 220–880 Hz across the window [STEAL: Highcharts / Apple Audio Graphs] — he *hears* the trend shape |
| Earcons at key events | Distinct tones when RSI crosses 30/70 and at the MACD cross — he hears *where* it happened |
| "Show data as table" | A real screen-reader `<table>` of date/close/RSI he can arrow through — the price is never trapped in a canvas |
| Tap-to-explain, spoken | "RSI kya hai?" → DeepSeek phrases the deterministic value, cites the indicator (Art. 6); RSI/MACD stay English |
| Event-only `aria-live` | Announce *"RSI crossed 70"*, never every candle; `role=main`, skip-link, visible focus order |
| No order, ever | "Buy" → *"Main order nahi laga sakta — paper trade likh doon?"* gated by `chittiConfirmAndDo()` (Art. 3) |
| Per-box widget | 🔊 re-reads any box; 🤖 explains; 👍/👎 + ✏️🎙️ voice-feedback (`feedback-widget.js`) |

## Failure modes to prevent
- Any verdict, RSI value, stop-loss, or disclaimer shown but **not spoken** → defect (Art. 2, BLIND P0).
- A chart canvas with **no sonification and no data table** → defect (price trapped in pixels).
- `aria-live` firing on every tick → spam → he turns it off → defect. Events only.
- A "Strong Buy" spoken **without** the "most short-term traders lose" rail and NOT-SEBI line → defect.
- Colour-only red/green leaking into the spoken path (e.g. "the green one") → meaningless to him → defect.
- VoiceOver/TalkBack focus traps or unlabeled buttons (the Robinhood anti-pattern) → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO2 gate)
**TalkBack/VoiceOver, screen OFF, headphones on.** Full journey with **zero** sighted help:
1. Vaani → "Reliance ka chart" → page auto-announces, speaks one-sentence verdict.
2. "Sunao price line" → sonification plays with RSI-70 + MACD earcons audible.
3. "Table dikhao" → arrow through the data table; values match the spoken verdict.
4. "RSI kya hai?" → spoken explanation, indicator cited, RSI stays English.
5. "Buy" → refused + paper-trade offer; `chittiConfirmAndDo()` confirms before logging.
**Pass = the verdict is 100% recoverable with the screen off** (the [ACCESSIBILITY.md](../ACCESSIBILITY.md) gate).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
