# CNAI_BO2_BEST_PRACTICES.md
## BO2 — Course Discovery & Registration · Best Practices

**Top 3 insights:** (1) free-first is a *sort key*, not a quality penalty — keep paid eligible but always last; (2) never emit an unverified/hallucinated course URL; (3) every fraud warning must carry evidence + cybercrime.gov.in + 1930 and must say "shows warning *signs*", never "is a scam".

### Applied in BO2
- **Preserve API** (`find, registrationPlan, speakable, tierLadder`). Additive: `scamCheck`, `certificationGate`, `freeSourcePriority`.
- **Scam shield (Skill 10 / SOP 10):** detect all 7 patterns (unrealistic income, fake-govt-paid-cert, unrealistic timeline, pressure tactics, job-guarantee+fee, no-transparency, social-media-only). Output mandatory format; never definitively accuse; always offer a verified free alternative + 1930.
- **Certification Gate (SOP 11):** 4 checks before any cert is shown — (1) free alternative checked, (2) cost disclosed exactly, (3) time estimated, (4) provider + verify URL. If free-alt not checked → `blocked:true`.
- **Free-first proof:** `find()` already free-first; add a test that paid never outranks a relevant free result.
- **Privacy / consent:** registration stays a *plan* (no auto-enrol, no exam-sitting); user data localStorage-only (UI layer).
- **Error boundaries:** `scamCheck('')` → not suspicious; `certificationGate(null)` → safe default. Never throw.
- **A11y-ready:** warnings/checks are plain text (not color/emoji-only) so screen readers convey them.

### Accessibility specific to BO2
Scam warnings must read fully in a screen reader (text evidence, not just ⚠️). Free/paid status is a text label (`tier_label`), never color-only. Helpline number 1930 shown as **plain text** (COP_DENYLIST — never a `tel:` link).

### CEOS connection / deviation
Satisfies CEOS BO2 + Skill 3/10 + SOP 5/10/11. No deviation; all additive.
