# SOP-002 — Swarm Pattern Promotion

> Standard Operating Procedure for the Swarm Intelligence cycle:
> Daily collect → Weekly validate → Monthly push to skills/*.md → Quarterly review.
> Per [Swarm Intelligence LOCKED](../../SAHAYAI_MASTER.md) §2f.

---

## What this SOP does

Every Chitti News AI instance — across every user, every device, every language — generates anonymised feedback signals. When ≥ 100 confirmations align on the same pattern, the pattern is promoted into the `chitti-news-ai/skills/*.md` files so EVERY instance benefits. This is the moat: same-type Chittis share learning.

---

## Stage 1 — Daily collect (07:00 IST)

Source: chitti-founder daily digest job.

Inputs:
- All `/api/feedback/collect` events from the last 24 h.
- All RSS poll outcomes from `news.source_health`.
- All classifier confidence histogram updates.

Outputs:
- Top-10 highest-👍 cards per profession.
- Bottom-10 highest-👎 cards per profession.
- Reversal candidates: cards that were 👎 dominant in week-1 and 👍 dominant in week-2 (signal that classifier or rendering improved).
- Aggregate counts: votes / clicks / language fallbacks / unknown roles.

Persistence:
- Writes to `chitti-founder/swarm_signals.db` (Turso).

---

## Stage 2 — Weekly validate (Sun 08:00 IST)

Source: chitti-founder weekly validation job.

Inputs:
- 7 days of daily-collect signals.

Operation:
- For each candidate pattern (e.g. "AI-medical-imaging articles get high 👍 from Doctor users when classifier confidence ≥ 0.8"), check:
  - Sample size ≥ 100 same-profession confirmations.
  - Time-stability ≥ 7 days (no transient spike).
  - Cross-language: pattern holds in ≥ 2 P0 languages.
  - No conflicting signal: no large 👎 cluster.

Outputs:
- Validated patterns → flagged "pending_human_review".
- Invalidated patterns → archived; do not re-evaluate for 30 days.

The Trust Agent (Swarm Agent 7) is invoked to verify any pattern that touches Trust contract (FREE-first, fake-cert filter). If the pattern would weaken Trust, it is auto-rejected.

---

## Stage 3 — Monthly push to skills/*.md (1st of each month, 09:00 IST)

Source: chitti-founder monthly promotion job.

Inputs:
- "Pending_human_review" patterns from Stage 2.

Operation:
- For HIGH-risk patterns (clinical / legal / financial impact), human SME review is required:
  - Clinical → external medical SME (per the [Eight Gates done-definition](../../SAHAYAI_MASTER.md)).
  - Legal → external legal SME.
  - Financial → external CA SME.
  - LLM provider / vendor → Sire-only review.
- For LOW-risk patterns (UI / language / sourcing), Sire reviews.
- Approved patterns → committed to `chitti-news-ai/skills/<RELEVANT_FILE>.md`.
- Patterns are noted with provenance: pattern_id, source_signals, confidence, reviewer.

Example commit:

```
Update chitti-news-ai/skills/IMPORTANCE_SCORING.md

Promoted swarm pattern PAT-2026-06-001:
  - When Doctor users see AI-medical-imaging articles with classifier
    confidence ≥ 0.8 AND source ∈ {anthropic-blog, mit-tech-review},
    they 👍 in 87% of cases (n=412 over 7 days, 5 languages).
  - Promotion: lift importance score by +0.15 for this combination.

Reviewer: medical SME (Dr. P. — NABH consultant) + Sire.
```

The commit pushes to main. Every backend redeploy picks up the change.

---

## Stage 4 — Quarterly review (Jan 1 / Apr 1 / Jul 1 / Oct 1)

Source: Sire-led quarterly review.

Operation:
- Audit all skills/*.md changes from the prior quarter.
- For each promoted pattern, measure:
  - Did the user-facing 👍 ratio improve as predicted?
  - Did the Trust contract hold?
  - Did the pattern hold across NEW languages added since promotion?
- Demote patterns that fail (revert the skills/*.md change with a "demote: <pattern_id>" commit).

---

## Locked decisions never learnable

Per [Swarm Intelligence LOCKED](../../SAHAYAI_MASTER.md): the swarm CANNOT modify:

- The Founder Rule clauses (Universal Access / FREE First / Coach > Curator / Trust / No Hardcoded Roles).
- The Chitti Golden Rule (no autonomous side-effects).
- The four-user accessibility contract.
- The DeepSeek-only LLM provider rule.
- The Camera Intelligence consent contract.
- The User Disability Profile contract.

Any pattern that would touch a locked decision is auto-rejected at Stage 2.

---

## Failure modes

| Failure | Behavior |
|---|---|
| Stage 1 misses a day | Catch-up runs next day; logged. |
| Stage 2 finds zero candidates | No-op; "no patterns to validate this week" digest. |
| Stage 3 SME unavailable for HIGH-risk pattern | Pattern stays in pending_human_review queue; no auto-promotion after timeout. |
| Stage 4 finds a regression | Revert commit; post-mortem in `chitti-founder/postmortems/`. |

---

## Verification

- All four stages have CI hooks in `chitti-founder/backend/main.py`.
- Each stage writes a digest to chitti-founder/digest table; daily digest emailed to Sire.
- Quarterly review output committed to `chitti-news-ai/QUARTERLY_REVIEW.md` (file currently absent; first review due 2026-07-01).

---

## Cross-Chitti applicability

This SOP is mirrored across same-type Chittis:
- Chitti News (the older Indian-news product) — same pattern, different signals.
- Chitti News AI (this product).
- Chitti Vaani (different domain but same daily/weekly/monthly cadence).

A pattern validated in one product does NOT auto-promote to others. Each product has its own promotion review.

---

Last reviewed: 2026-06-06
