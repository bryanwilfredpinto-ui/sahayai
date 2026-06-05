🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# UI — Chitti Technical (responsive, multilingual, accessible)

The build spec for `chitti_technical.html` (parity surface) + the Vaani-routed
canonical experience. Designed from **top-app research**, fitted to **desktop ·
laptop · tablet · mobile**, fully **language-switching**, and **5-element** on every box.

## Reference-app research (top apps in the world → what we copy)

| App | Copy | Drop |
|---|---|---|
| **TradingView** | multi-pane charts, overlay/pane toggle, clean readouts, screener UX | social, paywall, clutter |
| **Zerodha Kite** | Indian-market defaults, fast mobile candles, minimal chrome | — |
| **Groww / Upstox** | beginner-friendly tiles, big tap targets, simple onboarding | over-simplification |
| **Investing.com / StockEdge** | indicator picker grouped by type, screener presets | ads |
| **Apple Stocks / Google Finance** | calm typography, glanceable cards | shallow analysis |

**Chitti's differentiator vs all of them:** voice-first + ISL + full-language UI +
risk-first signals + swarm explanation — accessibility no mainstream app offers.

## Layout (cards, in order)

```
┌───────────────────────────────────────────────┐
│ ⚠️ NOT SEBI REGISTERED  (sticky bar + modal)    │  always top, never footer
├───────────────────────────────────────────────┤
│ 🌐 language · 🔄 Refresh (manual) · data as of  │
├───────────────────────────────────────────────┤
│ 🔍 Stock Search (type/speak/pick)               │
├───────────────────────────────────────────────┤
│ 🎯 Trade Type: Long · Positional · Swing · Intra│
├───────────────────────────────────────────────┤
│ 📊 SIGNAL CARD  → BUY/SELL/HOLD + confidence    │  5-element box
│    entry · stop · targets+RR · invalidation     │
│    🔊 audio summary · 🤖 explain                 │
├───────────────────────────────────────────────┤
│ 🪜 Multi-timeframe ladder (per trade type)      │  5-element box
├───────────────────────────────────────────────┤
│ 📈 CHART  candles + configurable panes          │  overlay/separate toggle
├───────────────────────────────────────────────┤
│ 🧮 Indicators (catalogue, picker, Roshan ⭐)     │  5-element box
├───────────────────────────────────────────────┤
│ 🔎 Screener (cap tiers + filters, Run screen)   │
├───────────────────────────────────────────────┤
│ 📒 Portfolio Mode (open/closed/PnL/risk)        │  5-element box
└───────────────────────────────────────────────┘
```

## The 5-element box (mandatory on every response card)

Per [CTO.md §2](../../chitti-cto/CTO.md) + [SAHAYAI_MASTER.md §7](../../SAHAYAI_MASTER.md),
every card with `data-chitti-response` auto-gets, via `feedback-widget.js`:
1. 🔊 Speaker — reads the card aloud in the active language
2. 🤖 Chitti — explains that box further (DeepSeek, scoped to the box)
3. 👍 / 👎 — per-box feedback, tagged to the box ID
4. ✏️ / 🎙️ — type or speak a correction → reads back for approval

The 🌐 language selector lives at page level (`chitti_a11y.js`), not per-card.

## Language — the whole UI re-renders (Sire's hard requirement)

> *"If a person selects Bangla, UI has to change in Bangla, same for Telugu,
> Tamil, etc. Refer to Chitti Vaani."*

- **9 primary languages, native UI** (per [CTO.md §5](../../chitti-cto/CTO.md)):
  English · Hindi · Tamil · Telugu · Bengali · Marathi · Gujarati · Kannada ·
  Malayalam. Selecting one **re-renders every label, button, and card** in that
  script — not just the response text.
- Selector **auto-enriches to the 26-language Voice Factory substrate**
  (`chitti_lang.js`); voice-out covers all 26.
- Implementation: `<select id="lang-select">` + `chitti_lang.js` + a `strings.js`
  i18n bag (`data-vai-i18n`), `strFor` falling back to English for any missing key
  (clean, never garbled). New strings added to at least `en` + `hi` + the 9-primary set.
- **No Hinglish** — one pure language per response. Indicator names (RSI, MACD,
  EMA, VWAP, ATR), NSE, BSE, Nifty, SEBI stay English ([CTO.md §6](../../chitti-cto/CTO.md)).

## Responsive (desktop · laptop · tablet · mobile)

| Viewport | Behaviour |
|---|---|
| **Desktop / laptop ≥1280px** | Two-column: chart + panes left, signal/screener/portfolio right; full indicator picker. |
| **Tablet 768px** | Single column, chart with 2–3 panes; picker in a drawer; cards full-width. |
| **Mobile 375px** | Single column; candles + one oscillator pane (others tap-to-expand); pinch-zoom; sticky Refresh; **tap targets ≥ 48×48px**; the picker truly fits one row (the chitti-news-ai mobile-row lesson). |

The 375px floor is a **hard cert gate** — nothing horizontal-scrolls, nothing
overflows, the SEBI bar stays visible.

## Colour system (locked, [CTO.md §1](../../chitti-cto/CTO.md))
Saffron `#FF9933` · Navy `#000080` · Green `#138808` · White · Charcoal. Colour is
**never** the sole carrier of meaning — every signal pairs colour with an icon +
word (📈 BUY / 🛑 SELL / ⏸️ HOLD).

## Refresh model
- **Manual only.** A visible 🔄 Refresh control + "data as of <timestamp>" stamp.
  No polling, no auto-tick (Sire's 2026-06-06 decision).

## Substrate scripts (must load — inherits all 5 frontend gates)
`chitti_a11y.js` (which auto-injects `chitti_lang.js`, `chitti_isl.js`,
`feedback-widget.js`, `chitti_features.js`, `chitti_disability_profile.js`). Plus a
"Talk to Vaani instead" banner ([SAHAYAI_MASTER.md §8 P0 #3](../../SAHAYAI_MASTER.md)),
since Vaani is the canonical surface.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
