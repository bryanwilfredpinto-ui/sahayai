🎖️ World Class Chitti Fashion — Memory: Preferences

# MEMORY — Preferences (local profile)

> Chitti remembers how to serve the user better — locally, never sold, always
> forgettable.

## Store
`localStorage` key `chitti_fashion_profile_v1` (per device, shared with chitti_a11y.js
where relevant for language + disability profile).

## Fields
| Field | Use |
|---|---|
| `gender` | Male / Female / Other — drives **overridable** pairing defaults ([../guardrails/gender_bias.md](../guardrails/gender_bias.md)) |
| `lang` | active language (one pure language, no Hinglish) |
| `disability` | flags from the platform Disability Profile (blind/deaf/mute/ISL/illiterate/elderly/limited-mobility/cognitive/rural) |
| `age_band` | optional, for comfort/safety guidance (never for bias) |
| `liked_styles` / `disliked_styles` | from 👍/👎 — shapes future suggestions (privacy: never synced) |
| `city` | for office-culture + weather context |

## Fashion Twin (PRD F12, PLANNED)
A derived style profile — colours owned, footwear owned, accessories owned — built
from wardrobe memory, used to sharpen advice. Computed on-device.

## Rules
- Preferences personalise; they **never** override suitability, accessibility, or budget-first.
- Disability flags trigger adaptations automatically (no re-asking).
- `"Chitti forget"` clears the profile.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
