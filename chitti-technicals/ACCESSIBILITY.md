🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — the four-channel verdict contract

> Level: Users. Implements [CONSTITUTION.md](CONSTITUTION.md) Articles 1 & 2. This is the single
> mechanism that serves all nine archetypes in [PERSONAS.md](PERSONAS.md) at once. Per-archetype
> review docs live under [accessibility/](accessibility/).

---

## The contract (Article 2, stated as an enforceable gate)

> **Every verdict is carried by FOUR parallel, redundant channels:**
> **1. VOICE · 2. TEXT · 3. ICON + SHAPE · 4. ISL / visual.**
>
> **THE GATE:** *Remove sight OR remove sound, and the verdict is still 100% recoverable.*

"Verdict" means every machine-decided output a user could act on:
- The 5-state composite — **Strong Buy → Buy → Neutral → Sell → Strong Sell**
- The RSI state — **oversold (<30) / neutral / overbought (>70)**
- The MACD event — **bullish cross / bearish cross**
- Support / resistance levels, the ATR stop, the confluence count
- The Tip Shield result — **looks safe to read / looks like a scam**

Colour may **decorate** but **never carries meaning alone** (WCAG 1.4.1). Red/green is the single
most common failure across all 40 audited apps ([RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md)) and
is useless to our blind, low-vision, and colour-blind users. Shape + word + voice carry the meaning.

---

## The four channels, mapped to a single example

Verdict: **"Neutral, leaning Sell. RSI 68 — overbought. MACD bearish cross 2 days ago."**

| Channel | What it emits | Who it serves |
|---|---|---|
| 🔊 **VOICE** | *"Neutral, leaning Sell. RSI is high at 68 — overbought. MACD turned down two days ago. Be careful, Sire — most short-term traders lose money."* (in-language, slow, repeat-on-demand) | Blind · illiterate · elderly · rural |
| 📝 **TEXT** | `Verdict: NEUTRAL → SELL · RSI 68 (overbought) · MACD bearish cross (2d ago)` — plain words, no colour dependence | Deaf · low-vision · cognitive · all readers |
| 🔺 **ICON + SHAPE** | 5-state shape ladder **▲▲ / ▲ / ■ / ▼ / ▼▼** (here: ▼ single-down), RSI gauge with a labelled "overbought" band marker, MACD ✕-cross glyph. Shape ≠ colour. | Deaf · low-vision · colour-blind · illiterate (reinforce only) |
| 🤟 **ISL / visual** | `chitti_isl.js` panel: ISL for "sell / careful / high", **fingerspells R-S-I and M-A-C-D** (no native sign exists → fingerspell + explain concept, **never fake a sign**) | Deaf (ISL-first) |

All four fire for **the same verdict object** — they are renderings of one deterministic result, not
four separately-authored messages. This is what makes the gate testable: drop two channels, the
other two must still fully reconstruct the verdict.

---

## Implementation map (substrate reuse — build nothing twice)

| Capability | Module (reused, per BUILD_ORDER.md) | Notes |
|---|---|---|
| Audio-graph (sonify price L→R, 220–880 Hz) | `audio_graph.js` (BO2) [STEAL: Highcharts Sonification / Apple Audio Graphs] | Earcons at RSI 30/70 + MACD cross; "Show data as table" toggle |
| Event-only screen-reader announce | `aria-live="polite"` result hosts (BO1) | Announce *events* ("RSI crossed 70"), **not** every tick — avoids spamming the blind user |
| Icon + shape verdict ladder | rendered in `chitti_technical_ai.html` (BO3/BO7) | ▲▲/▲/■/▼/▼▼ — shape carries state, colour only decorates |
| ISL panel | `chitti_isl.js` (BO3) | ISLRTC dictionary; fingerspell technical proper-nouns; never fabricate a sign |
| 26-language voice + text | `chitti_lang.js` `#lang-select` (BO10) | Auto-enrich + re-render + persist; RSI/MACD/EMA/NSE/Nifty stay **English** (Article 9) |
| Disability Profile | `chitti_a11y.js` (substrate) | One-time multi-select; tunes default channel emphasis (blind → voice-first, deaf → ISL-on) |
| Per-response widget | `feedback-widget.js` + `data-chitti-response` (BO10) | 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ on **every** verdict box |
| Confirm-gate | `chittiConfirmAndDo()` (substrate) | Every side-effect (reminder, paper-trade log) gates — Golden Rule |
| Haptic (where available) | Web Vibration API (progressive enhancement) | Short pulse on earcon events for deaf-blind / noisy-environment; **never the sole channel** |

---

## 26-language behaviour (Article 9)

- The **prose translates**; the **proper-nouns do not.** RSI, MACD, EMA, VWAP, ATR, NSE, BSE, Nifty,
  Sensex, Bank Nifty stay English in all 26 languages — translating them invents fake words that
  break trust and search. The *explanation around* them ("RSI yeh batata hai ki...") translates.
- Voice and text both honour the selected language; ISL panel is language-independent (ISL is a
  language of its own). A no-Hinglish scan (BO10 gate) blocks half-translated strings.

---

## The gate as a test procedure (run on every verdict surface)

1. **Sound-off pass (deaf/low-vision):** mute the device. Read a stock. Is the full 5-state verdict +
   RSI state + MACD event recoverable from TEXT + ICON+SHAPE + ISL alone? If anything is voice-only → **defect.**
2. **Screen-off pass (blind):** turn the screen off, TalkBack on. Read the same stock. Is the verdict
   recoverable from VOICE + the screen-reader table alone? If anything is colour/picture-only → **defect.**
3. **Colour-blind pass:** force greyscale. Every up/down/neutral state must remain distinguishable by
   **shape and word** (▲▲/▲/■/▼/▼▼ + label). If red/green is the only differentiator → **defect.**
4. **Per-channel parity:** the verdict object rendered to each channel must be byte-identical in
   meaning (same state, same RSI value, same disclaimer). No channel may soften or omit the
   "most short-term traders lose" rail or the NOT-SEBI disclaimer.

This procedure is part of the WCAG cert (BO11, `cert_chitti_technical_ai.mjs`) and the CTO 8-gate.
No surface ships GREEN until all four passes succeed on all five devices.

> See each archetype doc for the persona-specific needs / serve-table / failure-modes / test:
> [blind](accessibility/blind_user.md) · [deaf](accessibility/deaf_user.md) ·
> [mute](accessibility/mute_user.md) · [illiterate](accessibility/illiterate_user.md) ·
> [elderly](accessibility/elderly_user.md) · [low-vision](accessibility/low_vision_user.md) ·
> [cognitive](accessibility/cognitive_user.md) · [motor](accessibility/motor_user.md) ·
> [rural](accessibility/rural_user.md).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
