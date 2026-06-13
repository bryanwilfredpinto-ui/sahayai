# ACCESSIBILITY — Chitti Car Mechanic (26 languages, 9 profiles)

Inherited via the shared substrate (`chitti_a11y.js` + `chitti_lang.js` + `feedback-widget.js`) plus
page-level structure in [`../chitti_car_mechanic.html`](../chitti_car_mechanic.html). All
**proven live** by [`../tools/cert_car_mechanic.mjs`](../tools/cert_car_mechanic.mjs).

## Four-user contract (the floor)
| User | What we ship | Proof (cert) |
|---|---|---|
| **Blind** | Every result has 🔊; page-wide 🔊 Read page; `aria-live` hosts; speaks via Voice Factory/`a11y.speak`. | read-aloud button on result; G2 |
| **Deaf** | Symbol **+ word** status on every result (🟢 "Safe DIY", 🔴 "Mechanic only", "Replace now") — never colour-only; ISL panel via substrate. | "result has WORD status"; G5 |
| **Mute** | Every input is tap/type/select; voice optional. | all controls keyboard/tap; chips |
| **Illiterate** | Emoji glyphs on every tab/action; voice in+out; plain English; auto-read for blind. | tabs have emoji; read-aloud |

## 9 archetypes (CEOS §3) → adaptation
BLIND (audio+SR) · DEAF (captions+symbols+ISL) · MUTE (tap/type) · ILLITERATE (icons+voice) ·
ELDERLY (≥48px taps, slow speech) · LOW_VISION (400% zoom; reflow, no fixed px traps) ·
COGNITIVE (one step, no flashing; `prefers-reduced-motion`) · MOTOR (keyboard/voice; ≥44px) ·
RURAL (offline-first engine; SMS reminder path 🟡). All ride `chitti_a11y.js` disability profile.

## 5-element per-response widget (LOCKED)
Every card carries `data-chitti-response` + `data-chitti-section`; `feedback-widget.js` auto-attaches
**🔊 read · 🤖 ask Chitti · 👍 · 👎 · ✏️ (type AND mic) feedback**. Cert: 15 `[data-chitti-response]` boxes.

## Language dropdown (Vaani-canonical) — PROVEN
`chitti_lang.js` owns `#lang-select` (26 languages incl. RTL ur/ks/sd). The page leaves it empty;
the substrate populates + auto-translates the **whole UI** and persists the choice.
**Cert proof:** 26 options · en→hi sets `html[lang]=hi` + **34 text nodes translated** + persists to
`localStorage.chitti_lang` + returns to en stably.

## WCAG / locked UI rules (cert-enforced)
- Min font 18px · min tap 48px (authored controls all ≥44px in cert) · 375px-first (5 viewports shot).
- Colour contrast AA: `.btn.primary` uses dark-saffron `#B34700` (white text 4.5:1+) — cert **axe-core 0 serious/critical**.
- Tricolour stripe + navy `#002366` header + `#F7F7F4` bg (locked design system loaded first).
- `prefers-reduced-motion` / `prefers-contrast` / `forced-colors` media queries present.
