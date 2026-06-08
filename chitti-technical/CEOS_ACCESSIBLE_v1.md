🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# CEOS — Chitti Technical · Accessible Technical Analysis for All Users (v1.0)

> Authored from Sire's CEOS PDF (June 2026). Structured like the chitti-fashion CEOS doc set.
> This is the **accessibility-first refinement** of Chitti Technical: every signal must be
> expressible in ≥3 modalities (visual · audio · haptic), and no feature ships unless all 5
> primary archetypes (blind · deaf · mute · illiterate · elderly) can use it.
> **STATUS column** marks what is already built vs. what this CEOS adds.

## 1. Constitution (core principles)
| # | Article | Status |
|---|---|---|
| 1 | **Access First, Indicators Second** — no indicator unless renderable for all 5 archetypes | 🟡 partial (visual+voice done; audio-graph/haptic NEW) |
| 2 | **Multi-Modal by Default** — every signal in ≥3 modalities (visual/audio/haptic) | 🔴 NEW (haptic + audio-graph to build) |
| 3 | **No Text Dependency for Core Functions** — trend/BUY-SELL-HOLD/confidence without reading | 🟡 partial (icons+voice; full icon-only mode NEW) |
| 4 | **Safety-First Signal Design** — no 100% claims; confidence from multiple confirmations | 🟢 built (no-guarantee guardrail, confidence band) |
| 5 | **Deterministic Safety Over LLM Warmth** — safety path never routes through an LLM | 🟢 built (deterministic engine; LLM only explains) |

## 2. Personas / archetypes
Blind · Deaf · Mute · Illiterate · Elderly (primary) + Cognitive · Low-vision · Motor (secondary).
Maps to the existing [PERSONAS.md](PERSONAS.md) P5–P9 + the [accessibility/](accessibility/) archetype docs.
**NEW:** elderly + cognitive + low-vision + motor get first-class profiles (48px taps ✅, 4.5:1 contrast,
400% zoom, keyboard-only, no rapid flashing).

## 3. Scope (v1.0)
| Category | Indicator | Accessible format | Status |
|---|---|---|---|
| Trend | **SuperTrend w/ Exhaustion Clues** (4-state: Transition/Confirmed/Compression/Exhausted) | audio graph + colour zones + haptic | 🟡 Supertrend built; **4-state Exhaustion NEW** |
| Trend | **Ichimoku Cloud** (cloud = sonic boundary) | tone above/inside/below cloud | 🟡 Ichimoku built; **sonic-boundary mapping NEW** |
| Trend strength | **ADX simplified** (<20 flat / 20-40 rising / >40 high tone) | pitch intensity | 🟡 ADX built; **pitch mapping NEW** |
| Momentum | **RSI binary** (oversold/neutral/overbought) | icon + vibration | 🟢 RSI built |
| Volatility | **Bollinger Bands** (price vs bands) | haptic (tight=rapid pulses) | 🟢 Bollinger built |
| Volume | **Volume surge vs MA** | audio pitch mapping | 🟢 volume built |
| Signal | **BUY/SELL/HOLD + HIGH/MED/LOW** | all 3 modalities | 🟡 visual+voice built; **haptic NEW** |

**OUT of scope v1:** fundamentals (Chitti CA), options chains, custom scripting, social sentiment.
**DEFERRED v2:** full Chart2Music, predictive-AI signals (needs safety cert), multi-asset correlation.

## 4. Accessibility architecture (the heart of this CEOS)
| Layer | Tech | Status |
|---|---|---|
| Chart rendering | **SVG (not Canvas)** so screen readers parse the DOM | 🔴 NEW — current chart is `<canvas>` + a data-table alt (built). Add SVG-or-ARIA-described chart. |
| **Sonification / audio graph** | Web Audio API; x=time, y=pitch; last 10 candles played as a pitch sequence (rising=uptrend) | 🔴 NEW — `audio_graph.js` (SK-A11Y-01) |
| **Haptics** | Vibration API; per-signal vibration patterns (BUY=[200,100,200], crisis=3 long pulses) | 🔴 NEW — `haptic_encoder.js` (SK-A11Y-02) |
| Screen reader | ARIA roles + live regions; `role="img"`+title+desc on the chart; spoken chart summary | 🟡 partial (audio summary + data table built; chart ARIA-desc NEW) |
| **Icon-only illiterate mode** | 🟢 check=BUY · 🔴 X=SELL · 🟡 circle=HOLD; ≥48px taps; voice-on-tap; logo grid search | 🔴 NEW — `icon_renderer.js` (SK-A11Y-04) |
| Colour-blind themes | deuteranopia/protanopia CSS filters | 🔴 NEW |
| Keyboard | full tab/arrow/Enter; no hover-only; no keyboard traps | 🟡 partial |

WCAG 2.2 targets: 1.1.1 AAA · 1.4.3 AAA (4.5:1) · 2.1.1 AAA (keyboard) · 2.3.1 AAA (no flashing). Section 508.

## 5. Skills (engine + a11y)
Engine: `supertrend_evaluate` (w/ exhaustion), `ichimoku_analyze`, `rsi_simplified`, `volume_surge_detect`,
`consensus_generate` → BUY/SELL/HOLD + confidence. → maps to [SKILLS.md](SKILLS.md) + the engine.
A11y output skills (NEW): `audio_graph_render` · `vibration_encode` · `screen_reader_announce` ·
`icon_state_render` · `color_blindness_remap`.

## 6. SOPs (new/updated)
- **SOP-TECH-001 Multi-Modal Signal Generation** — fetch Angel candles → run indicators → consensus →
  emit **visual + audio + haptic** simultaneously → log for audit. (visual/audio ✅; **haptic NEW**)
- **SOP-A11Y-001 Screen-Reader Chart Announcement** — focus chart → spoken summary + optional audio graph.
- **SOP-A11Y-002 Illiterate Path** — icon-only UI, voice-on-tap, logo-grid search, ≤3 taps to a verdict. (NEW)
- **SOP-SAFE-001 Loss-Prevention Alert** — drawdown > threshold → crisis alert in all modalities → require
  explicit ack → **never auto-sell** (aligns with the Golden Rule + [guardrails/](guardrails/)). (NEW, needs login)

## 7. Guardrails
Signal: BUY/SELL only if confidence ≥70% else HOLD ✅ · suppress on 3 flips/5 periods (NEW) ·
low-volume caution tag (NEW). Accessibility: no canvas-only (SVG fallback — NEW), colour never sole
carrier ✅, no keyboard traps, no auto-playing audio (user-initiated). Financial: no guaranteed returns ✅,
no leverage advice ✅, human-override / no auto-execution ✅ (Golden Rule), paper-trading-first (NEW).

## 8. Build order (this CEOS) — each phase test-gated
| Phase | Deliverable | Acceptance | Status |
|---|---|---|---|
| 1 | engine + signal consensus + **270+ unit tests** | node 270/0 | 🟢 DONE (270/0) |
| 1 | Angel live candles + quotes | curl-verified live | 🟢 DONE (RELIANCE ₹1291) |
| 2 | `audio_graph.js` (sonification) | blind playback test | 🔴 TODO |
| 2 | `haptic_encoder.js` (vibration) | Android/iOS haptics | 🔴 TODO |
| 2 | chart SVG/ARIA-described + colour-blind themes | NVDA/VoiceOver + axe 0 | 🔴 TODO |
| 2 | `icon_renderer.js` illiterate icon-only mode | 0 text on core path, ≤3 taps | 🔴 TODO |
| 3 | SuperTrend-Exhaustion (4-state) + Ichimoku sonic boundary + ADX pitch | engine unit tests | 🔴 TODO |
| 4 | end-to-end **30/0 Playwright** + price display + handover | 30/0 + 441-line handover | 🟢 30/0 + price ✅ |

## Current-price display (Sire's 2026-06-08 ask: "can u see the price")
The signal card now always shows the **current price + day change** (`₹1291 ▼ 0.97%`) next to the
symbol — live close when LIVE (Angel), demo close otherwise. Built 2026-06-08.

## Next phase (proposed)
The multi-modal accessibility layer (Phase 2 above) is the meaningful next build: **audio graph
sonification**, **haptic patterns**, **SVG/ARIA chart**, and the **icon-only illiterate mode** — the
pieces that make Chitti Technical usable by a blind/deaf/illiterate trader, per this CEOS's Article 2.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
