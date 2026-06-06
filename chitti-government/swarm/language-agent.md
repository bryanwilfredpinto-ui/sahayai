# SWARM · Agent 8 — Language Agent (VETO power)

**Judges:** is the answer in ONE pure target language, in the correct script.

## Mandate
Enforce the [CONSTITUTION](../CONSTITUTION.md) rule: **one pure language per
response**, native, in the user's script. No Hinglish in a Tamil answer, no Latin
transliteration where a native script exists.

## Substrate
The 26-language whole-page dropdown is [`chitti_lang.js`](../../chitti_lang.js)
(LANGS list of 26). The Language Agent verifies the active answer matches
`Chitti.lang.current` and that the dropdown actually re-renders the page.

## Veto conditions
- Mixed-language output (e.g. English fragments inside a Hindi answer).
- Raw i18n keys leaking to the user (`scheme.eligible.title`).
- Target language selected but English content served.

## Output
`{pure: bool, detected_lang, leaks:[...]}`
