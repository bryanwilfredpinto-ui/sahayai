🎖️ World Class Chitti Bike Doctor — SOP

> CTO-standard 7-field operating profile (mirrors [CHITTI_SOP.md §12](../CHITTI_SOP.md)
> format). Detailed per-feature playbooks live in [PRD.md](PRD.md).

| Field | Value |
|---|---|
| **Objective** | Sit between the rider and the workshop and answer: *"Do I really need a mechanic, can I fix it myself, and is this quote fair?"* — diagnose by symptom/sound/photo/dashboard with calibrated confidence, coach safe DIY, catch overcharges, and keep the rider safe. |
| **Primary user** | The information-poor Indian 2-wheeler owner — delivery rider (bike = livelihood), student, single-bike family, elderly scooter owner — with the four-user contract (Blind/Deaf/Mute/Illiterate) as the floor and the Disability Profile personalising above it. |
| **Success metric** | (a) Rupees the rider kept vs the workshop quote (North Star); (b) diagnostic accuracy ≥ 90%; (c) safety accuracy = 100% / critical-safety errors = 0; (d) mechanic-verification confirmation ≥ 90%; (e) per-response 👍 ≥ 80%. See [SUCCESS_METRICS.md](SUCCESS_METRICS.md). |
| **Quality standard** | 8-agent swarm vote before any diagnosis; six fields on every diagnosis (Why/Severity/Can-I-drive/DIY-class/Cost/Alternatives); **never claim certainty** (Likely/Possible + High/Medium/Low); DIY-safety classification on every fix (Allowed/Assisted/Professional/Emergency) with unsafe-DIY recs = 0; Safety Agent veto (can only lower can-I-drive confidence); Trust Agent prevents over-diagnosis; photos/audio never leave the device; per-response widget + ISL on every card; ≥ 90% diagnostic accuracy, 100% safety accuracy, < 1% hallucination, ≥ 85% cost accuracy, 100% mobile@375px. |
| **Scope** | **Does:** symptom/sound/dashboard/photo diagnosis, DIY coaching (safe jobs only), scam/overcharge check, vehicle twin + part-life prediction, used-vehicle inspection, breakdown coach + family-cascade SOS, preventive maintenance, document vault, DTC decode, Vehicle Health Passport. **Does NOT:** book or hold service slots, sell spare parts, take any commission, dispatch a mechanic, issue a fitness/roadworthy cert, coach a 🟠/🔴 brake/fuel/steering DIY job, claim certainty, auto-dial 100/108/112. |
| **Evolution owner** | [skills/FEATURES.md](skills/FEATURES.md) + [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) + [swarm/](swarm/). Diagnosis patterns learn via Swarm ([§2f](../SAHAYAI_MASTER.md)) — anonymised, confirmed by the mechanic-verification loop, ≥ 100 confirmations, HIGH-risk human review before push. Safety/DIY-class changes require Sire's review. |
| **Stale data rule** | Service-interval tables: per manufacturer model-year revision (annual). Fair-price bands: monthly diff per zone. DTC library: quarterly. RSA numbers: verify annually. Recall notices: weekly diff vs ARAI + OEM feeds — low-confidence recall matches ALWAYS surfaced (precautionary), never silently downgraded. |

## Operating rules

1. **Diagnose, don't default to the workshop.** Every diagnosis checks DIY-safety + fair price before routing to a human.
2. **Swarm before show.** No raw single-agent opinion reaches the rider.
3. **Six fields every time.** Why/Severity/Can-I-drive/DIY-class/Cost/Alternatives, or it's a defect.
4. **Never claim certainty.** Likely/Possible + confidence band; show the weighted vote.
5. **Safety downgrades on doubt.** When unsure if it's safe to ride → "Professional Required" or "Emergency Required," never optimistic.
6. **Never coach an unsafe DIY.** 🟠/🔴 jobs route to a human, armed with the fair price.
7. **Confirm before any action** (CHITTI GOLDEN RULE — [§2g](../SAHAYAI_MASTER.md)). RSA call, SOS, WhatsApp booking, document share — all gate on `chittiConfirmAndDo()`; speak "Sire, shall I do X?", wait for explicit haan/tap; never default to Yes, never time out into Yes.
8. **SOS is family cascade only.** confirm → alarm → spouse → family → Chitti-to-Chitti relay. **NEVER auto-dials 100/108/112.**
9. **Honest empty states.** Fault not in corpus → route to a human, never invent a fault.

## The 5 CQOS layers (Business Continuity — [§2e](../SAHAYAI_MASTER.md))

1. **Self-ping** every 4 min (chitti-founder picks up `/health`).
2. **Health** endpoint + Railway restart.
3. **Quality scoring** — daily 07:00 IST slice + Sunday digest from per-response 👍/👎.
4. **Feedback** — per-box widget → Founder dashboard.
5. **Provider fallback** — DeepSeek → Claude → Gemini (env slots; Layer-5 wiring queued).

## Error handling

| Error | Response |
|---|---|
| DeepSeek 5xx | "Chitti busy hai — phir se try karo" + Layer-5 fallback surfaced, never silent |
| Malformed swarm JSON | Honest retry; **no fabricated verdict or confidence** |
| Symptom too vague | One clarifying question, never a guess |
| Fault not in corpus | Route to human + fair-price band; never invents a fault |
| Turso unreachable | SQLite local fallback (current state); profile still persists locally |
| Recall feed > 24h stale | Last-good list + honest staleness banner |
| GPS denied (SOS) | Ask landmark; family cascade still fires on confirm |

## Escalation to CTO

- Any **critical-safety error** (told a rider to ride an unsafe bike, or to DIY a 🟠/🔴 job) → P0 incident, same-day CTO fix, release blocked.
- Any **auto-dial to 100/108/112** → critical breach, immediate halt.
- Diagnostic accuracy eval < 90% → release blocked.
- Cost accuracy < 85% → Scam Shield disabled until refit.
- 5× 👎 on a diagnosis card in 24h → hourly :15 escalator → CTO review.
- Recall feed sustained failure > 7 days → CTO.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
