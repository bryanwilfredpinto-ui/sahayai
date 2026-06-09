🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 8 — Disability Rules (accessibility is the floor, not a feature)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 1 & 2. This is *why Chitti Technicals exists*: the ~15 crore Indians who hold shares but are blind, deaf, mute, or illiterate and cannot use a single existing chart tool. A feature that excludes any one of the **nine archetypes** is not done — it is broken.

---

## The rule
Every feature serves **all nine archetypes**: blind · deaf · mute · illiterate · elderly · low-vision · cognitive · motor · rural. **Never visual-only, never audio-only.** Every verdict is **four-channel** — VOICE · TEXT · ICON+SHAPE · ISL — and the gate is absolute: *remove either sight OR sound and the verdict must still be 100% recoverable.* **Colour only decorates; shape/word/voice carry meaning** (WCAG 1.4.1).

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| A red/green candle verdict with no shape or word | ▲▲ Strong-Buy / ▲ Buy / ■ Wait / ▼ Sell / ▼▼ Strong-Sell — shape + word + voice + ISL |
| A spoken-only signal (excludes deaf) | Every audio cue has a visual+text twin; earcons mirrored as on-screen markers |
| A chart image with no audio/table (excludes blind) | Sonified price line (pitch L→R) + "Show data as table" + one-sentence spoken summary |
| Voice-only input (excludes mute) | Tap-list of symbols + type box; Chitti-drafts-you-approve via `chittiConfirmAndDo()` |
| Dense English jargon (excludes illiterate/rural) | Voice-in/voice-out in dialect; icons reinforce; RSI/MACD stay English but the prose is plain |
| 30px tap targets, 12px text | ≥48px taps, ≥17px base, high-contrast, 2G-friendly offline cache |

---

## Enforcement
- **Build-time floor:** no BO ships until its accessibility TEST GATE passes — blind/deaf/mute/illiterate journeys each prove the verdict is 100% recoverable ([BUILD_ORDER.md](../BUILD_ORDER.md) BO2–BO5).
- **Four-channel assertion:** the verdict object must carry voice + text + icon+shape + ISL fields; a verdict missing a channel is rejected, not rendered.
- **axe-core 0 serious/critical** + manual screen-reader pass + CTO 8-gate (blind/deaf/mute/illiterate × every-box widget × 26 languages × 375px × 48px taps).
- **Substrate reuse:** `chitti_a11y.js` (Disability Profile, language selector, Braille mode), `chitti_isl.js`, `feedback-widget.js` are wired on every page — every page inherits the 5 frontend gates.
- **Per-archetype, every feature:** the disability profile is one-time, never re-asked, synced across Chittis on the device.

---

## Slip-rate target
- **Verdict not recoverable with sight OR sound removed: 0 slips** (cert-blocking, all 5 devices).
- **Colour-only meaning anywhere: 0** (WCAG 1.4.1 assertion).
- **axe-core serious/critical violations: 0** on every shipped page.
- **An archetype excluded by any feature: 0, forever.**

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [CONSTITUTION.md](../CONSTITUTION.md) · [privacy.md](privacy.md) · `chitti_a11y.js` · `chitti_isl.js`

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
