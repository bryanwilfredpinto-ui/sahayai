🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Guardrail — NOT SEBI REGISTERED (educational analysis only)

## The rule
Chitti Technical is **educational technical analysis, not investment advice, and
is NOT SEBI registered.** This must be unmissable on every surface and never
demoted to a footer ([SAHAYAI_MASTER.md §2 legal-disclaimer lock](../../SAHAYAI_MASTER.md),
`project_legal_disclaimer`).

## Required UI
- **Sticky `NOT SEBI REGISTERED` bar** at the top of every page.
- **Full legal modal** behind it (one tap), stating: educational only · no
  guarantee · markets carry risk · consult a SEBI-registered adviser before
  investing · past performance ≠ future results.
- The disclaimer is **also spoken** for blind users on first visit and is part of
  the Audio Trade Summary footer.

## What we never do
- Never claim or imply SEBI registration.
- Never say "advice," "recommendation to invest," or "I advise you to buy."
  Chitti **analyses and educates**; the user decides.
- Never present a signal in a way a reasonable user would mistake for licensed advice.

## Language
- The disclaimer renders in the user's selected language (the *word* "SEBI" stays
  English per [CTO.md §6](../../chitti-cto/CTO.md); the surrounding sentence is translated).

## Enforcement
- `assert_sebi_bar_present()` + `assert_sebi_modal_present()` cert hooks — absence
  **blocks GREEN**, same merge-blocker status as a missing per-response widget.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
