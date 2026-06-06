# Accessibility Eval — Chitti Vaani
# axe-core WCAG 2.1 AA + Four-User Contract

> Vaani is the **sole user-facing surface** for the entire platform. If a
> blind / deaf / mute / illiterate user cannot use Vaani, they cannot use
> sahayai.in at all. This makes accessibility an absolute requirement, not a
> nice-to-have.
>
> This file documents the eval design for the four-user contract
> (SAHAYAI_MASTER.md §7), axe-core scan configuration, 26-language coverage
> targets, and tap-target standards.
>
> **HONESTY NOTE — live scan results are PENDING.**
> The automated accessibility cert harness (Playwright + axe-core) has not
> yet completed a full production run against `chitti_vaani.html` on Railway.
> The zero-violations target and per-disability passing criteria below are
> the **design contract**, not measured results. This file will be updated
> once the cert harness runs.

---

## Scope

The eval covers `chitti_vaani.html` rendered at:
- 375 × 667 px (mobile baseline per 8-Gate done-definition).
- 768 × 1024 px (tablet).
- 1280 × 800 px (desktop reference).

Per disability_profile states tested:
- `{}` (no profile set) — default visual layout.
- `{ blind: true }` — voice-first, SpeechRecognition auto-start.
- `{ deaf: true, isl: true }` — ISL panel on every response box.
- `{ mute: true }` — tap-only; speech recogniser suppressed.
- `{ illiterate: true }` — voice-first + emoji-rich labels.
- `{ blind: true, illiterate: true }` — combined voice path.
- `{ mute: true, deaf: true }` — touch + ISL only.
- `{ elderly: true }` — integration stress test (all constraints at once).

Per language tested (P0 set):
en, hi, ta, mr, ml, kn, te, bn, gu, pa (10 languages).

Total scans: 8 profiles × 10 languages × 3 viewports = 240 scans per run.

---

## Tooling

- **axe-core** v4.7 via `@axe-core/playwright`.
- Playwright headless Chromium (for automated cert).
- Firefox and WebKit runs quarterly (manual + automated).
- Android Chrome via BrowserStack quarterly (TalkBack integration test).
- Run: `tools/qa_vaani_a11y.mjs` (to be authored — modelled on
  `tools/qa_news_ai_a11y.mjs`).

---

## Target: Zero New Violations

```
Critical violations introduced by Vaani code:   0
Serious violations introduced by Vaani code:    0
Moderate violations introduced by Vaani code:   0
Minor violations introduced by Vaani code:      0

Pre-existing substrate violations (BUG-009 in chitti_a11y.js):
  tracked separately, allowlisted in CI — do not fail Vaani PRs.
```

The three known substrate violations (aria-allowed-attr on language selector,
color-contrast on Voice Required marker, landmark-unique on ISL panel regions)
are shared across all 15 Chittis and tracked at the substrate level.
They do not block Vaani certification.

---

## Per-Disability Passing Criteria

### Blind User — [`../accessibility/blind_user.md`](../accessibility/blind_user.md)

- [ ] `disability_profile.blind = true` → Voice-First Mode auto-activates
      within 1.5 s of DOMContentLoaded.
- [ ] Welcome utterance plays within 1.5 s of first paint (Voice Factory cascade).
- [ ] `SpeechRecognition` starts in continuous mode automatically.
- [ ] Golden Rule confirm modal (`chittiConfirmAndDo`) has audible
      question + Yes/No buttons with aria-labels.
- [ ] Every `[data-chitti-response]` carries `aria-live="polite"`.
- [ ] Every interactive element has an accessible name
      (aria-label or inner text, not placeholder-only).
- [ ] Every action Pro Card speaks a confirmation question before executing
      (Golden Rule — SAHAYAI_MASTER.md §2g).
- [ ] Emergency cascade spoken aloud at each step; no silent state change.
- [ ] Voice failure: if SpeechRecognition is unsupported, welcome utterance
      appends *"Voice commands unavailable — use buttons or ask a helper."*
- [ ] NVDA on Windows: all content changes announced.
- [ ] TalkBack on Android Chrome: all content changes announced.

### Deaf User — [`../accessibility/deaf_user.md`](../accessibility/deaf_user.md)

- [ ] Voice-First Mode does NOT auto-activate for deaf-only profile.
- [ ] ISL panel attaches to every `[data-chitti-response]` when
      `disability_profile.deaf = true` or `.isl = true`.
- [ ] ISL panel has `role="region"` + `aria-label="Indian Sign Language animation"`.
- [ ] Relevance verdict uses color + emoji + text (never audio-only).
- [ ] No audio-only notification for any event (emergency, route confirmation,
      Pro Card trigger).
- [ ] Emergency cascade is fully visual: banner + flashing indicator +
      ISL animation of emergency phrase.
- [ ] Voice listener does NOT auto-start (no microphone permission request).
- [ ] Captioned alternative for any audio content surfaced in responses.
- [ ] ISL dictionary gaps shown as honest stub (never a wrong sign).

### Mute User — [`../accessibility/mute_user.md`](../accessibility/mute_user.md)

- [ ] SpeechRecognition does NOT auto-start for mute-only profile.
- [ ] Golden Rule confirm modal has explicit Haan / Nahi tap buttons
      (not voice-only confirm).
- [ ] Every Pro Card action is triggerable by tap, not voice-only.
- [ ] All tap targets ≥ 44 × 44 px (iOS HIG minimum) / ≥ 48 × 48 px
      (Android / WCAG 2.5.8 minimum).
- [ ] No CAPTCHA in any flow.
- [ ] Trusted Circle can be built by typing (not voice-only).
- [ ] Feedback widget thumbs register on tap without speaking.
- [ ] Disability Profile multi-select is tap-completable (no voice needed).
- [ ] Language selector is tap-completable.

### Illiterate User — [`../accessibility/illiterate_user.md`](../accessibility/illiterate_user.md)

- [ ] `disability_profile.illiterate = true` → Voice-First Mode auto-activates
      within 1.5 s (same path as blind).
- [ ] Every label, section heading, and CTA has an emoji prefix.
- [ ] Every Pro Card icon speaks its name on focus / hover / voice "what is this?"
- [ ] All responses are read aloud automatically in Voice-First Mode.
- [ ] Feedback thumbs-down opens a voice-record option, not a typed field.
- [ ] "Say HAAN to confirm" spoken before every Golden Rule action.
- [ ] No text-only navigation path exists (emoji + voice covers every action).
- [ ] Voice Factory fallback speaks honestly in the closest supported language
      (never silently morphs one language into another).

---

## WCAG 2.1 AA Specific Rules

The following axe-core rules are mandatory (zero violations):

| Rule ID | Description |
|---|---|
| `color-contrast` | All text ≥ 4.5:1 contrast ratio against its background |
| `aria-required-attr` | All ARIA roles have required attributes |
| `aria-valid-attr` | No invalid ARIA attribute names |
| `button-name` | All buttons have accessible names |
| `image-alt` | All images have alt text |
| `label` | All form inputs have labels |
| `link-name` | All links have discernible text |
| `region` | All page content is inside landmark regions |
| `landmark-unique` | Landmark regions have unique accessible names |
| `focus-visible` | Focus is visible on all interactive elements |
| `target-size` | All tap targets ≥ 44 × 44 px |
| `frame-title` | All iframes have titles |
| `html-has-lang` | `<html>` has a `lang` attribute matching `chitti_lang` |

---

## 26-Language Coverage

Voice Factory supports 26 languages (12 primary + 14 cousin including
Sanskrit and Oraon). Accessibility eval covers all 26 for:

- Welcome utterance: spoken audibly in the selected language (or honest
  "voice not supported" in the closest language — Tier C contract).
- Golden Rule confirm question: spoken in the selected language.
- Emergency cascade: spoken in the selected language.
- ISL panel: animations do not depend on language (ISL is visual).

P0 languages (fully tested in every cert run):
  en, hi, ta, mr, ml, kn, te, bn, gu, pa (10 languages).

P1 languages (tested in quarterly cert run):
  or, as, ur, sa, mai, bho, raj, sd, kok, mni, brx, sat, dog, ks (14 languages).

Honest status: Tier C (honest fallback) is active for all 26 until ULCA
Bhashini credentials are provisioned. The cert does NOT fail because of Tier C —
the contract is "honest failure", not "silent failure".

---

## Tap-Target Standard

Per the 8-Gate done-definition (SAHAYAI_MASTER.md §7):
- All interactive elements ≥ 48 × 48 px on Android.
- All interactive elements ≥ 44 × 44 px on iOS.

Vaani-specific elements that must pass:
- Every Pro Card action button (call, SMS, WhatsApp, UPI, email).
- The Golden Rule Haan / Nahi confirm buttons.
- Emergency trigger button.
- Feedback widget icons (🔊 / 🤖 / 👍 / 👎).
- Language selector.
- Disability Profile multi-select items.
- SafeWalk timer stop button.

Violation of tap-target standard = CI failure on every PR.

---

## How a Regression Is Caught

```
PR opened
  → CI runs tools/qa_vaani_a11y.mjs against the PR preview URL
  → For each (profile × lang), axe-core is run at 375px
  → If any NEW violation (not in pre-existing BUG-009 allowlist), CI fails
  → PR cannot merge
  → Pre-existing substrate violations are allowlisted by hash — they
    don't fail CI but also don't get forgotten
```

Nightly: full 240-scan matrix runs against production Railway URL.
Result written to `tools/cert_vaani_a11y_result.json`.

---

## Manual UAT Schedule

Quarterly manual UAT sessions alongside automated scans:

| Persona | Recruitment | Session length | Tools |
|---|---|---|---|
| Blind UAT | NVDA user via NAB India network | 60 min | NVDA + Chrome Windows |
| Deaf + ISL UAT | ISL user via Hall of Fame community | 45 min | No audio, ISL panel |
| Mute UAT | Voice-disability user via partner NGO | 45 min | Tap-only walkthrough |
| Illiterate UAT | Limited-literacy user via rural-dev partner | 60 min | Voice + emoji only |
| Elderly UAT | User over 65 from Vaani user base | 45 min | TalkBack on Android |

Findings feed into `HANDOVER/04_BUG_REPORT.md`. Critical findings
(P0/P1) block the next release. P2 findings tracked as YELLOW.

---

## Cert Artefacts

Per CTO visual screenshot mandatory rule (SAHAYAI_MASTER.md §7), every
cert run writes screenshots:
- `tools/cert_screenshots/chitti_vaani_blind_375.png`
- `tools/cert_screenshots/chitti_vaani_deaf_375.png`
- `tools/cert_screenshots/chitti_vaani_mute_375.png`
- `tools/cert_screenshots/chitti_vaani_illiterate_375.png`
- `tools/cert_screenshots/chitti_vaani_<lang>_home_375.png` (one per P0 lang)
- `tools/cert_screenshots/chitti_vaani_golden_rule_modal_375.png`
- `tools/cert_screenshots/chitti_vaani_emergency_cascade_375.png`

---

## Honest Caveats

- axe-core does NOT test: voice quality, ISL animation accuracy, the
  meaningfulness of audio cues, or real-device performance on ₹6,000
  Android phones. It checks the DOM structure that lets assistive tech work.
  Manual UAT covers the meaningfulness layer.
- Performance under TalkBack on low-end MIUI devices has not been formally
  benchmarked. BrowserStack testing planned for Q3 2026.
- Braille display testing is planned (Braille mode is in chitti_a11y.js)
  but Phase 2 substrate ISL camera input and Braille DOM mirror are not
  yet shipped.
- All numbers in this file (violation counts, pass counts, scan counts)
  are TARGETS until the `tools/qa_vaani_a11y.mjs` harness runs on production
  and this file is updated with real figures.

---

Last reviewed: 2026-06-06
