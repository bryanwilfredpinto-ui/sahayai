🎖️ World Class Chitti Car Doctor — SOP

> CTO-standard 7-field operating profile (mirrors [CHITTI_SOP.md](../CHITTI_SOP.md)
> format). Detailed per-feature playbooks live in [PRD.md](PRD.md).

| Field | Value |
|---|---|
| **Objective** | Sit between the owner and the service centre and answer: *"Do I really need a service centre, can I fix it myself, and is this quote fair?"* — diagnose by symptom/sound/photo/dashboard/OBD2 with calibrated confidence, coach safe DIY, catch overcharges (the ₹35 000 AC compressor that's really ₹2 000), inspect used cars, and keep the owner safe. |
| **Primary user** | The information-poor Indian car owner — family-car owner Tier-2/3, taxi/Ola-Uber driver (car = livelihood), small-business fleet manager, used-car buyer, elderly driver, woman night-driver — with the four-user contract (Blind/Deaf/Mute/Illiterate) as the floor and the Disability Profile personalising above it. Petrol/Diesel/EV/Hybrid. |
| **Success metric** | (a) Rupees the owner kept vs the service-centre quote (North Star — worth 5-20× a bike's); (b) diagnostic accuracy ≥ 90%; (c) safety accuracy = 100% / critical-safety errors = 0; (d) mechanic-verification confirmation ≥ 90%; (e) per-response 👍 ≥ 80%. See [SUCCESS_METRICS.md](SUCCESS_METRICS.md). |
| **Quality standard** | 8-agent swarm vote before any diagnosis; six fields on every diagnosis (Why/Severity/Can-I-drive/DIY-class/Cost/Alternatives); **never claim certainty** (Likely/Possible + High/Medium/Low); DIY-safety classification on every fix (Allowed/Assisted/Professional/Emergency) with unsafe-DIY recs = 0; **brake/fuel/airbag/HV-EV force-🔴, never DIY-coached**; Safety Agent veto (can only lower can-I-drive confidence); Trust Agent prevents over-diagnosis; photos/audio/OBD2 never leave the device; per-response widget + ISL on every card; ≥ 90% diagnostic accuracy, 100% safety accuracy, < 1% hallucination, ≥ 85% cost accuracy, ≥ 95% DTC decode, 100% mobile@375px. |
| **Scope** | **Does:** symptom/sound/dashboard/photo/OBD2 diagnosis, standard DTC P-code decode + freeze-frame + live PIDs (Mode 2 first-class for cars), DIY coaching (safe jobs only), scam/overcharge check, vehicle twin + part-life prediction, **100-point used-vehicle inspection**, breakdown coach + family-cascade SOS, preventive maintenance (incl. diesel DPF / EV SoH), document vault, DTC decode, Vehicle Health Passport, family/fleet view. **Does NOT:** book or hold service slots, sell spare parts, take any commission, dispatch a mechanic, issue a fitness/roadworthy cert, coach a 🟠/🔴 brake/fuel/airbag/HV-EV DIY job, claim certainty, auto-dial 100/108/112. |
| **Evolution owner** | [skills/FEATURES.md](skills/FEATURES.md) + [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) + [swarm/](swarm/). Diagnosis patterns learn via Swarm ([§2f](../SAHAYAI_MASTER.md)) — anonymised, confirmed by the mechanic-verification loop, ≥ 100 confirmations, HIGH-risk human review before push. Safety/DIY-class changes require Sire's review. |
| **Stale data rule** | Service-interval tables (`_BRAND_SCHEDULE`, 8 brands): per manufacturer model-year revision (annual). Fair-price bands (₹ car ranges): monthly diff per zone. DTC library: quarterly. RSA numbers: verify annually. Recall notices: weekly diff vs ARAI + OEM feeds — low-confidence recall matches ALWAYS surfaced (precautionary), never silently downgraded. |

## Operating rules

1. **Diagnose, don't default to the service centre.** Every diagnosis checks DIY-safety + fair price before routing to a human.
2. **Swarm before show.** No raw single-agent opinion reaches the owner.
3. **Six fields every time.** Why/Severity/Can-I-drive/DIY-class/Cost/Alternatives, or it's a defect.
4. **Never claim certainty.** Likely/Possible + confidence band; show the weighted vote.
5. **Safety downgrades on doubt.** When unsure if it's safe to drive → "Professional Required" or "Emergency Required," never optimistic.
6. **Never coach an unsafe DIY.** 🟠/🔴 jobs route to a human, armed with the fair price. **Brake / fuel / airbag / HV-EV is force-🔴.**
7. **Confirm before any action** (CHITTI GOLDEN RULE — [§2g](../SAHAYAI_MASTER.md)). RSA call, SOS, WhatsApp booking, document share — all gate on `chittiConfirmAndDo()`; speak "Sire, shall I do X?", wait for explicit haan/tap; never default to Yes, never time out into Yes.
8. **SOS is family cascade only.** confirm → alarm → spouse → family → Chitti-to-Chitti relay. **NEVER auto-dials 100/108/112.**
9. **Honest empty states.** Fault not in corpus / DTC not in library → route to a human, never invent a fault or a code meaning.

## The 5 CQOS layers (Business Continuity — [§2e](../SAHAYAI_MASTER.md))

1. **Self-ping** every 4 min (chitti-founder picks up `/health`).
2. **Health** endpoint + service restart.
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
| DTC not in local library | Honest 404 + "POST /api/4w/ask se DeepSeek pe pucho"; never fabricates a meaning |
| OBD2 pair fails | Fall back to Mode 1 (voice/photo/sound); never blocks the diagnosis |
| Turso unreachable | SQLite local fallback (current state); profile still persists locally |
| Recall feed > 24h stale | Last-good list + honest staleness banner |
| GPS denied (SOS) | Ask landmark; family cascade still fires on confirm |

## Escalation to CTO

- Any **critical-safety error** (told an owner to drive an unsafe car, or to DIY a 🟠/🔴 brake/fuel/airbag/HV-EV job) → P0 incident, same-day CTO fix, release blocked.
- Any **auto-dial to 100/108/112** → critical breach, immediate halt.
- Diagnostic accuracy eval < 90% → release blocked.
- Cost accuracy < 85% → Scam Shield disabled until refit.
- DTC decode accuracy < 95% → DTC library frozen until refit.
- 5× 👎 on a diagnosis card in 24h → hourly :15 escalator → CTO review.
- Recall feed sustained failure > 7 days → CTO.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
