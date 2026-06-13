🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# RESEARCH_BEST_APPS — 20 TA + 20 AI-TA apps (we copy the best, reinvent nothing)

> Locked Step-1 "research before build" artifact. Lens: *how do we present technical analysis to a blind / deaf / mute / illiterate common man, language-dropdown-first.* Every claim evidence-backed (full source URLs in the agent research logs; key sources inline).

## Part 1 — 20 mainstream TA apps

**The one invention the whole industry converged on:** the composite **Strong Buy → Strong Sell gauge** (TradingView Technical Ratings; copied by Investing.com, Moneycontrol). Public, copyable algorithm: 26 indicators (15 MAs + 11 oscillators) each vote ±1 → two group means averaged → −1…+1 → thresholds **>0.5 Strong Buy · 0.1–0.5 Buy · ±0.1 Neutral · −0.5…−0.1 Sell · <−0.5 Strong Sell**.

| App | Steal |
|---|---|
| TradingView | Gauge-dial verdict + transparent vote math; color-blind/monochrome chart mode |
| TrendSpider | Plain-English request → machine does the TA (auto-draws levels) |
| MetaTrader | Extensible indicator marketplace (≈ our skills/*.md); bare terminal = anti-pattern |
| Webull | Color-coded "Cheat Sheet" key levels → speak "floor X, ceiling Y" |
| Robinhood | In-line education (tap indicator → plain-English def); blind-org partnership; VoiceOver nav bugs = what NOT to do |
| ThinkorSwim | Study taxonomy (Trend/Momentum/Volatility/Volume) → narratable "I checked 4 things" |
| Investing.com | **Visible buy-count vs sell-count tally** ("11 say Buy, 2 say Sell") — trust > a needle, trivially voiceable |
| StockCharts | **SCTR single 0–100 strength score**; pre-built expert chart templates |
| Trade Ideas | Named AI persona "Holly" hands a few risk-bounded ideas |
| Stocktwits | Bullish/Bearish % split — most illiterate-friendly verdict format (2 buckets, no jargon) |
| Zerodha Kite | Varsity-grade pedagogy — but embed it AT the signal, not a separate site |
| Groww | Best Indian vernacular coverage + beginner risk cues; stops at text, not voice |
| Upstox | Embed TradingView, charge ₹0 → chart is a commodity; our value-add = the accessibility layer |
| Angel One | ARQ personalization (age + risk → picks) → pair with our Disability Profile |
| Dhan | 40+ in-house indicators on TradingView (≈ our Roshan play); ScanX named scanners |
| Tickertape | **Market Mood Index fear-greed dial** (most intuitive "where are we?") + 0–10 Scorecard w/ red-flags |
| StockEdge | Intent-named scans ("show me oversold") → a voice command grammar; Edge Meter composite |
| Chartink | Outcome-language scan names ("Bullish for Next Day", "Volume Shockers") |
| Moneycontrol | Mass-India 5-state verdict + Hindi/Gujarati reach; but no vernacular TA *explanation* |
| Screener.in | Auto Pros/Cons bullet list → apply to technicals ("Pros: above 200-DMA. Cons: volume falling") |

## Part 2 — 20 AI-TA apps

| App | Steal / verdict |
|---|---|
| **Danelfin** ⭐ | Gold standard: 1–10 score + **green/red explainable signal breakdown** + honest "backtest ≠ future" |
| Composer.trade | Deterministic rule engine; LLM only parses intent + flags overfitting |
| Magnifi Mentor | "Plain English, not jargon" input contract; always answer "why" |
| Kavout | 0–100 → 5-band verdict labels (speakable/iconable) |
| Public.com Alpha | In-context ask-back; exemplary "experimental… not a recommendation" disclaimer |
| FinChat | Every answer carries its source |
| Fintool | Multi-agent self-verification before answering; suggested follow-up questions |
| BloombergGPT | Every bullet **tappable back to the exact source excerpt** |
| Perplexity Finance | Cite-as-you-speak; ⚠️ color-only heatmaps = negative example |
| Boosted.ai | Explainability as a first-class named surface ("why this") |
| QuantConnect Mia | Literally "a tight wrapper over LLM" on a deterministic engine; publishes honest 75% |
| TrendSpider Sidekick | Auto-annotate FIRST, narrate second (blind user never faces a blank chart) |
| Trade Ideas Holly | Overnight pre-computation → cheap short morning list to narrate |
| BlackBoxStocks | Publishes "**Alerts are NOT buy signals**" |
| Streetbeat "Warren" | News-impact-on-YOU framing + named persona |
| Candlestick.ai | Context kills false signals (pattern + macro/volume, never raw) |
| Numerai | Ensemble meta-model + skin-in-the-game (≈ our Swarm, long-term) |
| Tickeron | ⚠️ Overclaim trap (unaudited 80–92%). Steal only the user-set **confidence floor** dial |
| StockGPT | ⚠️ Ungrounded GPT wrapper, overclaims precision, no disclaimer = the pitfall |
| Incite AI | "Conversational answers, not ratio tables" (key UX lesson); ⚠️ "95%" = reject |

## Doctrine validated
The most-trusted products keep the math **deterministic** and use the LLM **only to phrase/cite**; the ones that let the **LLM do the analysis** are the honesty traps. → **Keep `chitti_technical_engine.js` (39 indicators + Roshan) as source-of-truth; DeepSeek narrates, cites, bands by confidence, disclaims — never originates a number or a call.**

## The STEAL list (folded into [BUILD_ORDER.md](BUILD_ORDER.md))
TradingView gauge math · Investing.com vote tally · Tickertape MMI mood dial + 0–10 scorecard · StockEdge/Chartink intent-named scans · Screener auto Pros/Cons · Danelfin score+explain+disclaimer · Bloomberg tap-to-source · Incite "talk, don't tabulate" · Tickeron confidence-floor dial.

## The REJECT list (guardrails)
Unaudited accuracy %s · color-only signals · ungrounded LLM analysis · jargon tables · separate-site education · scalper-churn glorification.

## The MOAT — what none of the 40 do (our whitespace)
1. No **spoken** verdict. 2. Charts are **screen-reader-dead**. 3. No **vernacular TA explanation by voice**. 4. No **illiterate-first** path. 5. No **deaf/mute + ISL**. 6. No personalization of **delivery** by disability. 7. No **guardian/anti-scam** framing.

## Accessibility toolkit (implementation, from the chart-presentation research)
- **Blind:** sonify price→pitch L→R (Highcharts Sonification / Apple Audio Graphs scrub-to-value) + earcons at RSI 30/70 + MACD cross; **"Show data as table"** + one-sentence summary (highest-leverage win); event-only `aria-live` (announce "RSI crossed 70", not every tick).
- **Deaf:** text mirror of all audio; ISL panel (ISLRTC dict now 10k words incl. financial; RSI/MACD have no sign → fingerspell + explain concept, never fake a sign).
- **Mute:** non-voice twin for every mic; Chitti-drafts-you-approve (`chittiConfirmAndDo`).
- **Illiterate:** voice-in/out in dialect; icons reinforce only (field evidence: non-readers fail composite/arrow icons) — every icon paired with audio.
- **Multilingual:** single `chitti_lang.js` dropdown swaps key→string + re-renders + persists; technical terms stay English.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
