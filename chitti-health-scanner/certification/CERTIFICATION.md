**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Chitti Health Scanner — Pre-Release Certification (COSDF Level 14)

> Golden line: **"Chitti helps you notice — doctors help you heal."**
> **CURRENT STATUS: 🔴 RED / NOT CERTIFIED — skeleton only, no clinical validation yet.**
> The AI vision models are NOT built or clinically validated. Every "Chitti Score" below is **BLANK
> (`___%`)** on purpose. No domain may be filled in until a model is built, validated on a held-out
> set, and signed off by the Medical Advisory Board. Backend analysis endpoints return honest
> `501 coming_soon`. Nothing here is "live", "verified", or "GREEN".

Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Pre-release certification table

A domain certifies only when its **Chitti Score** meets or exceeds the passing score AND the Medical
Advisory Board has signed off. Passing scores are **research TARGETS**, not achieved numbers. The Chitti
Score column stays BLANK until honestly measured on a held-out validation set, reported separately by
Fitzpatrick band.

| Domain                  | Passing score (TARGET) | Chitti Score | Status        |
|-------------------------|------------------------|--------------|---------------|
| Skin / dermatology      | 95% (research TARGET)  | `___%`       | 🔴 NOT CERTIFIED |
| Dental / oral           | 89–97% (research TARGET) | `___%`     | 🔴 NOT CERTIFIED |
| Wound care              | TARGET (TBD)           | `___%`       | 🔴 NOT CERTIFIED |
| Eye / ocular surface    | TARGET (TBD)           | `___%`       | 🔴 NOT CERTIFIED |
| Nail                    | TARGET (TBD)           | `___%`       | 🔴 NOT CERTIFIED |
| Tongue / oral mucosa    | TARGET (TBD)           | `___%`       | 🔴 NOT CERTIFIED |
| Posture / gait (visual) | TARGET (TBD)           | `___%`       | 🔴 NOT CERTIFIED |
| **Safety guardrails**   | 100% (no-diagnosis / disclaimer / no-panic) | `___%` | 🔴 NOT CERTIFIED |
| **Accessibility**       | 100% (four-user × 10 lang × 375px × 48px) | `___%` | 🔴 NOT CERTIFIED |
| **Privacy / DPDP**      | 100% (AES-256-GCM · forget · no-sell)     | `___%` | 🔴 NOT CERTIFIED |

> Per-domain accuracy MUST be reported separately for Fitzpatrick I–III and IV–VI. A single blended
> number is not acceptable evidence. AI is honestly **less accurate on darker / Fitzpatrick IV–VI skin
> tones** — this limitation is surfaced in-product and must be measured, not hidden.

---

## Grade bands

| Grade | Band | Meaning |
|-------|------|---------|
| 🟢 **GREEN** | All gates PASS · all relevant domain Chitti Scores ≥ passing TARGET · Medical Advisory Board signed off | Certified for release |
| 🟡 **YELLOW** | Wired + most gates PASS but unverified in production, OR ≥1 domain below TARGET, OR Board sign-off pending | NOT releasable — finish + re-cert |
| 🔴 **RED** | Any Safety-CRITICAL gate FAIL, OR no clinical validation, OR scores BLANK, OR skeleton only | NOT certified — do not ship |

A single Safety-CRITICAL FAIL (Level 13, Gate 2) forces 🔴 RED regardless of all other scores.

---

## Medical Advisory Board requirement (mandatory before GREEN)

No domain reaches 🟢 GREEN without written sign-off from the relevant specialist(s). Sign-off attests
that outputs never diagnose, always carry the disclaimer, escalate appropriately, and acknowledge the
darker-skin-tone limitation.

| Reviewer | Scope | Sign-off |
|----------|-------|----------|
| Dermatologist          | Skin / nail / mucosa domains | [ ] NOT SIGNED |
| Dentist                | Dental / oral domains        | [ ] NOT SIGNED |
| Wound-care specialist  | Wound domains                | [ ] NOT SIGNED |

> All three sign-offs are currently **NOT SIGNED**. Until all relevant reviewers sign, the product
> cannot be marked GREEN. The Board also reviews HIGH-risk swarm patterns before any skills/*.md change
> (Level 13, Gate 5).

---

## Post-release monitoring cadence

Certification is not a one-time event. After any future GREEN release, monitoring continues:

- **Continuous:** safety guard never bypassed; every output carries "This is not a medical diagnosis."
- **Daily:** scan volume, action distribution (monitor/consult/seek-care), 👍/👎 per response box,
  `501`/error rates → Founder dashboard.
- **Weekly:** accessibility spot-check (four-user × 375px × 48px) + swarm pattern validation.
- **Monthly:** re-run domain evals on held-out set; re-report accuracy by Fitzpatrick band; push
  reviewed swarm improvements.
- **Quarterly:** Medical Advisory Board re-review; re-certification of each domain; audit darker-skin-tone
  accuracy gap and remediation progress.
- **On regression:** any eval regression or safety incident → immediate downgrade to 🔴 RED and re-cert.

---

## Current certification statement

**Chitti Health Scanner is 🔴 RED / NOT CERTIFIED.**

- Skeleton only — AI vision models not built, not clinically validated.
- All Chitti Scores BLANK (`___%`); all passing scores are research TARGETS, not achievements.
- Backend analysis endpoints return honest `501 coming_soon`.
- Medical Advisory Board sign-offs: 0 / 3.
- Level-13 quality gates (`../quality/QUALITY.md`): 0 / 10 PASS.

Nothing in this product is to be described as "live", "verified", "achieved", or "GREEN" until measured.
