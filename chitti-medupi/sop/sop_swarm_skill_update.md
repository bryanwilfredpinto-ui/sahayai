CEOS Level 7 — SOP: Swarm Skill Update (HIGH-risk gate)
Authored 2026-06-06

# SOP — Landing a swarm-learned pattern in skills/*.md

**Trigger:** the monthly swarm push proposes a change to
[`chitti-medupi/skills/`](../skills/) — a new molecule risk band, a refined
copy phrasing, a new same-composition mapping, a community-validated price signal.

**MedUPI is a HIGH-risk (medical) Chitti.** Per [SAHAYAI_MASTER.md §2f](../../SAHAYAI_MASTER.md)
**Sire must approve every patch before it lands.** No silent push to a medical
Chitti, ever.

---

## The swarm learning cycle (§2f)
| Cadence | Step |
|---|---|
| **Daily** | Collect anonymised patterns from the previous 24 h — per-response 👍/👎, 👎→👍 reversals, multi-turn savings traces. user_token stripped, GPS → pincode centroid, free-text PII scrubbed. |
| **Weekly** | Validate — **≥ 100 confirmations** + cross-region sanity (a Bhopal-only pattern is never pushed as national). |
| **Monthly** | `chitti-founder` opens a PR against `skills/*.md`. **HIGH-risk → blocked on Sire's approval.** |
| **Quarterly** | Full audit of every skill file for drift / conflicts with §2 locked decisions. |

## Steps to land a patch
1. **Confirmation gate.** Confirm the pattern has **≥ 100 confirmations**. Below
   threshold = candidate only; it is never pushed.
2. **Anonymisation check.** Confirm zero PII in the proposed line. If anonymisation
   can't be guaranteed for a signal, that signal does not enter the swarm.
3. **Locked-decision check.** The patch must not relax any §2 guardrail —
   strict matching, the disclaimer, no-diagnosis, no-dose, no cross-molecule, the
   four-user contract, camera intelligence. Locked decisions are **not learnable**.
4. **Risk-band check.** Any molecule risk change is reviewed against
   `medupi_risk.RISK_MAP` — a HIGH-category drug can never be learned down to LOW.
5. **Sire approval (HIGH-risk gate).** Open the PR; request Sire's review; **wait**.
   No merge without explicit approval.
6. **Provenance comment.** Every merged line carries
   `<!-- swarm: 2026-MM-DD, N confirmations, Sire-approved -->` so future readers
   (Claude included) can tell swarm-authored lines from Sire-authored ones.
7. **Deploy + verify** (see [sop_deploy_and_verify.md](sop_deploy_and_verify.md)) —
   the next deploy of any MedUPI instance ships the new skill file.

## Hard rules — non-negotiable
- **Never silently push to a medical Chitti.** HIGH-risk patches always wait on
  human review (§2f hard rule).
- **≥ 100 confirmations or it doesn't ship.**
- **Honest provenance on every line.**
- **"Chitti forget" removes from the swarm too** — when a user wipes their
  contribution, the aggregate drops it and leaves a tombstone so confirmation
  counts stay honest. A pattern can fall back below 100 if contributors forget.

## Escalation to CTO (SOP.md)
- A HIGH-risk pattern surfaces in swarm review (e.g. a wrong dosage-form match) —
  halt the push, file an incident (see [sop_incident_wrong_match.md](sop_incident_wrong_match.md)).

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
