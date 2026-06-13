# SWARM INTELLIGENCE — Chitti Car Mechanic

Per SAHAYAI_MASTER §2f. Every Chitti Car Mechanic learns from every other — anonymised, privacy-safe.

## Agents (logical roles inside the engine)
Document · Reminder · Insurance · Service · Tyre · Diagnostic (OBD/symptom) · Scam · Location · Battery · Fuel.
Each is a deterministic module today; the "agent" framing is how the swarm groups learnings.

## Cross-domain insights (deterministic, shipped)
- Weak battery → cold-start risk (Battery + Diagnostic) — `symptomCoach('car_wont_start')`.
- Worn tyres + monsoon → high accident risk (Tyre) — `tyreHealth` warning.
- Missed service + engine noise → urgent (Service + Diagnostic).
- Low coolant + overheating → immediate stop (`symptomCoach('overheating')` canDrive=false).

## Swarm learning (privacy-safe) — platform path
- **Anonymised, no PII** (user-token stripped, GPS→pincode centroid). Same contract as Camera Intelligence (§2b).
- **≥100 confirmations** before a pattern becomes best practice (e.g. "fair price for X in district Y", "top fix for code Z").
- **HIGH-risk (safety) patterns require Sire's review** before landing in `skills/*.md`.
- **"Chitti forget"** removes the user's contribution (tombstone keeps counts honest).
- Candidate signals: high-👍 diagnoses · 👎→👍 reversals · confirmed scam/fake-part sightings (→ §2b community-alert flywheel) · mileage-vs-similar benchmarks.

**Status:** cross-domain insights are LIVE (deterministic). The cross-instance learning loop is 🟡 —
rides the platform swarm (`lib/swarm.py` + founder cron); no PII leaves the device until opted in.
