🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Accessibility Eval — 9 archetypes × axe-core × four-channel recoverability

> Subordinate to [../EVALS.md](../EVALS.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Articles 1 & 2 ("Access First, Trading Second" · "Four-Channel by Default").
> **Hard target: 100% accessibility — axe-core 0 serious/critical** across 9 archetypes × 5 devices, and **every verdict 100% recoverable** with sight OR sound removed.
> **Status: 🔵 PENDING** — to be filled when `node tools/test_accessibility.mjs` runs (BO2–BO5) and `cert_chitti_technical_ai.mjs` runs (BO11).

---

## The nine archetypes (Article 1 floor — none excluded)

| # | Archetype | The recoverability question this eval asks |
|---|---|---|
| 1 | 👁️ Blind | With the screen **off**, can I get the full verdict by voice + earcons + "show data as table"? |
| 2 | 🦻 Deaf | With sound **off**, do text + icon+shape + ISL panel carry the full verdict? |
| 3 | 🤫 Mute | Can I complete the entire flow with **zero voice** (tap-list + type box)? |
| 4 | 📖 Illiterate | Can I use it with **zero reading** — icons paired with audio, on 2G? |
| 5 | 🧓 Elderly | ≥48px taps, base ≥17px, high contrast, slow-friendly, no time-outs? |
| 6 | 🔍 Low-vision | Reflow at 200% zoom, contrast ≥ WCAG AA, no colour-only meaning? |
| 7 | 🧠 Cognitive | One idea per box, plain language, no jargon without a tap-to-explain? |
| 8 | ✋ Motor | Keyboard-only operable, visible focus ring, large hit targets? |
| 9 | 🌾 Rural | Works offline / on 2G via service-worker cache (BO5)? |

## The four-channel recoverability gate (Article 2 — the hard line)

> **Remove sight OR sound and the verdict must still be 100% recoverable.**

Every verdict is asserted to exist in **all four channels**:

| Channel | Carrier | Asserted by |
|---|---|---|
| VOICE | spoken summary + sonified price + earcons (RSI 30/70, MACD cross) | blind profile |
| TEXT | written verdict + numbers + "show data as table" | deaf profile |
| ICON+SHAPE | ▲▲ / ▲ / ■ / ▼ / ▼▼ (never colour-only) | deaf + low-vision |
| ISL/visual | `chitti_isl.js` panel; fingerspell RSI/MACD (never fake a sign) | deaf |

## axe-core gate

`tools/cert_chitti_technical_ai.mjs --gate=structure` and the full BO11 run execute **axe-core** on each archetype state × 5 devices. **0 serious/critical** is the hard target; any serious finding **blocks GREEN**.

## Method

```
BO1  node tools/cert_chitti_technical_ai.mjs --gate=structure   # skip-link / single h1 / aria-live / axe
BO2  node tools/test_accessibility.mjs --profile=blind
BO3  node tools/test_accessibility.mjs --profile=deaf
BO4  node tools/test_accessibility.mjs --profile=mute
BO5  node tools/test_accessibility.mjs --profile=illiterate
BO11 node tools/cert_chitti_technical_ai.mjs                    # 9 archetypes × 5 devices + axe + screenshots
```

## Pass criteria (target — not yet measured)

- **9 / 9** archetypes recover the verdict fully.
- **axe-core 0 serious/critical** on every archetype × every device (Desktop 1920×1080 · Laptop 1366×768 · iPad · iPhone · Android).
- Remove-sight test: verdict recoverable → ✅. Remove-sound test: verdict recoverable → ✅.
- 375px screenshot saved per box per device (Article 12).

## Results

| Archetype / gate | Target | Measured | Status |
|---|---|---|---|
| Blind recoverability (screen off) | 100% | _to be filled_ | 🔵 PENDING |
| Deaf recoverability (sound off) | 100% | _to be filled_ | 🔵 PENDING |
| Mute (zero voice) | full flow | _to be filled_ | 🔵 PENDING |
| Illiterate (zero reading, 2G) | usable | _to be filled_ | 🔵 PENDING |
| Elderly / low-vision / cognitive / motor / rural | 5/5 pass | _to be filled_ | 🔵 PENDING |
| axe-core serious/critical | 0 | _to be filled_ | 🔵 PENDING |
| Four-channel (sight OR sound removed) | recoverable | _to be filled_ | 🔵 PENDING |

🟡 Real iPhone/Android hardware + human screen-reader (TalkBack/VoiceOver) pass is **Sire's slot** — flagged AUTOMATION-LIMITED, never claimed by the CTO.

Cross-checks: [safety_eval.md](safety_eval.md) (crisis redirect is voiced) · [../observability/feedback.md](../observability/feedback.md) (per-box widget reachable by keyboard).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
