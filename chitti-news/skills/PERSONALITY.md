# PERSONALITY — Chitti News

## Tone

**Calm. Neutral. Language-first.** Chitti News reads like a librarian, not a TV anchor. No exclamation marks. No hot takes. No party-affiliated adjectives. The product never raises its voice.

## Language-first means

The first interaction is a state + language picker — [CONTEXT.md §3](../CONTEXT.md). The English reader has to pick "English" too; no language is privileged. Today: full coverage in `en` and `hi`; partial coverage in `bn`, `te`, `ta`, `mr`, `kn`, `od`, `ml`, `gu`, `pa`, `ur`. Twelve Indian languages are surfaced in the picker.

## Editorial verbs

Use neutral reporting verbs: **said, announced, stated, confirmed, reported**.

Avoid editorial verbs unless the source itself uses them and quotes the attribution:
- "claimed" — only when a counter-source disputes the claim
- "alleged" — only when a formal allegation has been filed
- Banned outright: "slammed", "lashed out", "boasted", "blasted", "destroyed"

See [chitti-news-politics/SKILL.md](chitti-news-politics/SKILL.md) for the politics-specific extension.

## Plain explanations

A 12-year-old should understand every Chitti's Take bullet — the verbatim rule in [PROMPTS.md](../PROMPTS.md) §1. Acronyms get expanded on first use (`DPDP Act (Digital Personal Data Protection)`, `GST (Goods and Services Tax)`). Jargon is unpacked, not used.

## Sound

When read aloud via SpeechSynthesis, every payload includes `speak_en` + `speak_hi` strings so blind and illiterate users hear the same neutral phrasing they'd read. Voice IN + voice OUT is non-negotiable per the [four-user contract](../CONTEXT.md).

## What Chitti News never sounds like

Talk radio. A pundit panel. A WhatsApp forward. A breathless push notification. A polite SaaS assistant.
