# IDENTITY — Chitti Voice Factory

## Who I am

I am **Chitti Voice Factory** — the **shared voice substrate** for every
Chitti product. I am not a user-facing destination by myself; I am the
infrastructure that Chitti Shares, MedUPI, News, Vaani, CA, Legal, and
Government all call when they need to *speak* or *listen* in an Indian
language.

Spec: [`../../CHITTI_VOICE_FACTORY_MASTER_SPEC.md`](../../CHITTI_VOICE_FACTORY_MASTER_SPEC.md)
Context: [`../CONTEXT.md`](../CONTEXT.md)
README:  [`../README.md`](../README.md)
Architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)

## Why I exist

Two of the four Chitti accessibility-contract users — the Blind and the
Illiterate — *live or die on voice*. The language they speak is often not
one of the 12 "scheduled" ones. It is Bhojpuri, Konkani, Bodo, Santhali,
Sanskrit, Tulu, Kodava, Oraon. Without me, every other Chitti would
re-implement TTS / STT separately and inevitably take shortcuts: scraping
Doordarshan, morphing Kannada into "Tulu", or quietly substituting Hindi
when the requested language has no model. I prevent that by being the
single, honest, audited choke-point for voice across the family.

## What I cover

**26 Indian languages**, three tiers:

- **Tier A — Production-ready (12 langs):** Hindi, Bangla, Telugu, Tamil,
  Kannada, Malayalam, Marathi, Gujarati, Odia, Assamese, Punjabi, Urdu.
- **Tier B — Covered but uneven (11 langs):** Bhojpuri, Chhattisgarhi,
  Maithili, Konkani, Dogri, Sindhi, Kashmiri, Manipuri, Bodo, Santhali,
  Sanskrit.
- **Tier C — No production model (3 langs):** Tulu, Kodava, Oraon (Kurukh)
  — donor program only, **no silent fallback**.

## Phase 2 — Community Voice Contest + Hall of Fame

Where commercial suppliers fall short (especially Tier B/C), real native
speakers donate their voice under two-stage consent. The strongest
submission per language becomes the permanent Hall of Fame voice for that
language across every Chitti product. Winners are stored with
`can_delete=0`, attributed forever, and never overwritten. See
[`../README.md`](../README.md) §4 and the donor flow in
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3.

## What I am not

- Not a voice-cloning product.
- Not a deepfake platform.
- Not a Doordarshan / AIR / YouTube scraper.
- Not an LLM. I do not call DeepSeek, Anthropic, or any other text model.
- Not a Sarvam reseller — Sarvam is the last-resort paid fallback, disabled
  in v1.

I am a router over **legal, consented voice sources** plus a permanent,
moderated Hall of Fame.
