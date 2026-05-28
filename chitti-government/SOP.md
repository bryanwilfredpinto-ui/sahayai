🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Government — Standard Operating Procedure

## Objective
Surface every central + state scheme the user is eligible for, with plain-English explanation, document checklist, and (where partnered) DigiLocker fetch.

## Primary User
Indian in the BPL / OBC / SC/ST / farmer / women / senior-citizen / PwD brackets who cannot navigate gov portals — and the family member helping them apply.

## Success Metric
(a) Eligibility-match accuracy (false-positive rate held below 5%) · (b) *"I applied successfully"* follow-up rate · (c) document-checklist completeness (scanner deep-link click-through).

## Quality Standard
- 30 schemes seeded at launch + PIB poll every 6h auto-refresh
- **DigiLocker partner-only** — local-upload flow used until DigiLocker partner approval lands (no silent stub claiming integration)
- Honest *"unclear eligibility — check with district office"* state, never coerced to *"eligible"*
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **Eligibility honesty.** False positives are worse than false negatives. When confidence is low, surface "unclear — check district office", never coerce to "eligible".
2. **DigiLocker is partner-only.** Local-upload flow until approval. NEVER fake the integration.
3. **No submission on behalf of user.** Government shows what to do; user submits via official portal.
4. **PIB poll cadence is sacrosanct.** Every 6h. If feed stale, surface *"central catalog last refreshed Nh ago"* — never silently serve stale.
5. **State overlay.** When user provides state, surface state-specific schemes; never blanket-apply central rules.
6. **Camera capture on document upload.** Per [SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md) — what / where / when / result / user / satisfaction, anonymised.
7. **Golden Rule on every action.** Deadline reminders, status checks, document uploads — all confirm before fire.

## Error Handling
- PIB feed unreachable → fall back to last-good catalog; surface staleness honestly
- DigiLocker partner endpoint 4xx/5xx → degrade to local-upload flow with honest banner
- Eligibility model confidence < threshold → surface "unclear" state; never silently coerce to "eligible"
- DeepSeek 5xx → fallback canned response with disclaimer

## Escalation to CTO
- Eligibility false-positive rate > 5% on judge eval
- PIB feed stale > 12h (cron broken)
- DigiLocker partner status change requires re-wiring
- Scheme catalog gap detected (state gazette amendment not picked up monthly)
- Camera capture write-rate drop

## Stale Data Rule
PIB poll every 6h auto-refreshes the central catalog. State gazettes: monthly diff per state. Scheme delisting / freeze: daily diff against the central scheme portal. Application-deadline reminders re-validated weekly.

## Evolution Owner
[chitti-government/skills/FEATURES.md](skills/FEATURES.md) + PIB feed + per-state gazette. Sire reviews every new scheme before it enters the seed catalog.

---

> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
