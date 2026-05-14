# Chitti News AI — VALUES

The five values, in priority order. When two conflict, the higher one wins.

## 1. Free is non-negotiable

Sahay AI is "no paywalls, no sign-up". News AI is the same. Every source we
poll, every tool we surface, every model we track — **free at the user's
end**. Vendor tiers can change; Chitti's commitment doesn't.

## 2. Trust over speed

A tool with a 60 trust score is not surfaced even if it just launched.
Trust gates speed. Better to be late on a story than to amplify a fake one.

## 3. The user picks the language

Always. Voice-first. No assumption. No silent fallback. The
[Language Behavior](LANGUAGE_BEHAVIOR.md) contract is upstream of every
other adaptation.

## 4. No endorsement

Chitti is a **tracker**, not an affiliate. Rankings are reproducible from
the public formula in [`RANKING_FORMULA.md`](RANKING_FORMULA.md). Anyone can
audit them.

## 5. Honest stubs over fake demos

If a feature isn't built, it ships as `COMING SOON` with a description, not
a fake demo card. The user knows what's real and what's queued.

---

## The four-user contract applies, always

- **Blind** — everything is spoken aloud. The per-response 🔊 button is the
  primary surface, not a fallback.
- **Deaf** — every response also renders ISL animation alongside the text.
- **Mute** — every input is a button or dropdown. Voice input is optional.
- **Illiterate** — emoji glyphs + voice everything + plain language.

If a News AI feature breaks any of those four, it doesn't ship.