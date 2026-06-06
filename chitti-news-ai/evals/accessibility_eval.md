# Accessibility Eval — axe-core WCAG 2.1 AA

> Live certification: 0 v1.1-introduced violations on the production URL.
> 3 pre-existing substrate violations tracked as BUG-009 (chitti_a11y.js
> upstream issue — see [`../HANDOVER/04_BUG_REPORT.md`](../HANDOVER/04_BUG_REPORT.md)).

---

## Scope

The eval covers `chitti_news_ai.html` rendered at:

- 375 × 667 px (mobile baseline, per the 8-Gate done-definition).
- 1280 × 800 px (desktop reference).

Per disability_profile states tested:
- `{}` (no profile set) — default visual.
- `{ blind: true }` — voice-first.
- `{ deaf: true, isl: true }` — visual + ISL.
- `{ mute: true }` — tap-only.
- `{ illiterate: true }` — voice + emoji.

Per language tested: en, hi, ta, mr, ml, kn, te, bn, gu, pa (10 P0 langs).

---

## Tooling

- **axe-core** v4.7 via `@axe-core/playwright`.
- Run via `tools/qa_news_ai_a11y.mjs` (Playwright headless Chromium).
- Run on every CI build + nightly on production.

---

## Latest run (2026-06-06)

```
URL:                  https://chitti-news-ai-production-*.up.railway.app
Profiles tested:      5
Langs tested:         10
Total scans:          50

Critical violations:  0
Serious violations:   3   (all pre-existing — BUG-009)
Moderate violations:  0
Minor violations:     0

v1.1-introduced violations:   0
```

The 3 serious violations are in the chitti_a11y.js substrate, shared across all 15 Chittis. They predate Chitti News AI v1.1 work. Tracked at substrate level — not blocking this product's certification.

---

## The 3 pre-existing violations (BUG-009 detail)

1. **`aria-allowed-attr`** on the language selector — the chitti_a11y.js auto-injected `<select>` has an attribute combo flagged by axe (`aria-expanded` on a non-button). Substrate-level fix planned.
2. **`color-contrast`** on the "Voice Required" marker — ratio 4.2:1 against pale-blue header (need 4.5:1). Substrate-level fix planned.
3. **`landmark-unique`** — multiple `<aside>` regions inserted by the ISL panel substrate share a generic label. Substrate-level fix planned.

None of these block a blind / deaf / mute / illiterate user from completing any journey. They are catalog hygiene.

---

## Per-disability journey passing criteria

### Blind ([`../accessibility/blind_user.md`](../accessibility/blind_user.md))

- [x] Voice-First Mode auto-activates from `disability_profile.blind`.
- [x] Welcome utterance plays within 1.2 s of page paint.
- [x] All 5 voice commands (tour / news / hub / help / stop) route correctly.
- [x] Every `[data-chitti-response]` has `aria-live="polite"`.
- [x] Every interactive element has an `aria-label` or accessible name.
- [x] Screen reader (NVDA tested) announces every content change.

### Deaf ([`../accessibility/deaf_user.md`](../accessibility/deaf_user.md))

- [x] ISL panel attaches to every `[data-chitti-response]`.
- [x] Relevance verdict uses color + emoji + text (never audio-only).
- [x] No audio is the only signal for any event.
- [x] Caption/transcript surfaced for any embedded audio/video card.
- [x] Voice-command listener does NOT auto-start.

### Mute ([`../accessibility/mute_user.md`](../accessibility/mute_user.md))

- [x] 6 quick-pick role buttons render without typing.
- [x] Every intake question has tap-only options.
- [x] All tap targets ≥ 48 × 48 px (axe `target-size` rule).
- [x] No captcha in any flow.
- [x] Feedback widget thumbs work tap-only.

### Illiterate ([`../accessibility/illiterate_user.md`](../accessibility/illiterate_user.md))

- [x] Voice-First Mode auto-activates from `disability_profile.illiterate`.
- [x] Every label has an emoji prefix.
- [x] 6 face-emoji role buttons render.
- [x] Mission card uses 📺 / 📖 / ✍️ / 🚀 icons.
- [x] Voice readback per section on scroll-into-view.

---

## Manual UAT (alongside automated scan)

Quarterly, the following manual UAT sessions are conducted:

| Persona | Recruitment | Session length |
|---|---|---|
| Blind UAT | NVDA user via NAB network | 60 min |
| Deaf UAT | ISL user via the Hall of Fame community | 45 min |
| Mute UAT | Voice-disability user via partner NGO | 45 min |
| Illiterate UAT | Limited-literacy user via rural-development partner | 60 min |

Findings feed into BUG_REPORT.md. Critical findings block the next release.

---

## How a regression is caught

```
PR opened
  → CI runs tools/qa_news_ai_a11y.mjs against the PR preview
  → For each (profile × lang), axe is run
  → If any "v1.1-introduced" violation is found, CI fails
  → "Pre-existing" violations (BUG-009 hashes) are allowlisted; they don't fail CI
  → PR cannot merge if v1.1 violation count > 0
```

The allowlist hash mechanism prevents the 3 known substrate issues from blocking PRs, while ensuring any NEW violation is caught immediately.

---

## Cert artefacts

Per [CTO visual screenshot mandatory](../../SAHAYAI_MASTER.md) rule, every cert run writes screenshots:

- `tools/cert_screenshots/chitti_news_ai_blind_375.png`
- `tools/cert_screenshots/chitti_news_ai_deaf_375.png`
- `tools/cert_screenshots/chitti_news_ai_mute_375.png`
- `tools/cert_screenshots/chitti_news_ai_illiterate_375.png`
- `tools/cert_screenshots/chitti_news_ai_<lang>_home.png` (one per P0 lang)

These are committed to the repo (already visible in `git status` under `tools/cert_screenshots/`).

---

## Honest caveats

- axe-core does NOT test voice quality, ISL animation accuracy, or the meaningfulness of audio cues. It checks the structure that lets assistive tech work. Manual UAT covers the meaningfulness layer.
- Performance under TalkBack on low-end Android (₹6,000 phones) has not been formally benchmarked beyond Chrome devtools emulation.
- We do not yet test on Braille displays (LOCKED Braille mode is in chitti_a11y.js but the Phase 2 substrate ISL camera input + Braille DOM mirror isn't shipped).

---

Last reviewed: 2026-06-06
