CEOS Level 7 — SOP: Camera Capture & "Chitti Forget"
Authored 2026-06-06

# SOP — Strip-scan capture fields + the forget tombstone

**Trigger:** a user scans a medicine strip / bottle / blister / prescription with
the camera, or invokes "Chitti forget" to wipe their data.

**Backing:** `services/medupi_recognition.py` (DeepSeek vision strip extraction) ·
the Camera Intelligence contract [SAHAYAI_MASTER.md §2b](../../SAHAYAI_MASTER.md) ·
the swarm anonymisation contract §2f.

---

## Capture fields per scan (§2b — every camera Chitti)
| Field | What it records | MedUPI mapping |
|---|---|---|
| **What** | what was scanned | brand_name / salt_composition / strength / dosage_form / pack_size (DeepSeek extraction) |
| **Where** | location | GPS → **rounded to pincode centroid** before any aggregate (never raw) |
| **When** | timestamp | scan time (UTC) |
| **Result** | what Chitti returned | matched? cheapest equivalent · ₹ saved · risk band |
| **User** | per-device owner | opaque `user_token` (localStorage UUID) — stripped before swarm |
| **Satisfaction** | did it help | per-response 👍 / 👎 from the widget |

## Use of the capture (user-owned, never sold)
- Feeds **community alerts** (e.g. "fake medicine batch in Bhopal → alert MedUPI
  users nationally", §2f example) and the planned annual public-health report.
- Feeds the swarm — **anonymised** (user_token stripped, GPS → pincode, PII
  scrubbed) before any cross-instance aggregate.
- Data is the user's: per-device, exportable on request, **never sold**.

## "Chitti forget" — the wipe (§2b + §2f)
1. **Trigger.** Voice command or button: "Chitti forget" / "Chitti, bhool jao".
   This is a side-effecting action → it routes through the Golden Rule confirm
   gate first ("Sire, shall I delete all your MedUPI data?") — never auto-fires.
2. **Wipe local.** Delete the device's family profiles, wallet entries, reminders,
   price alerts, and scan history tied to that `user_token`.
3. **Wipe from swarm.** The user's contribution is removed from the anonymised
   aggregate and **replaced with a tombstone** so confirmation counts stay honest
   (a pattern can legitimately fall below 100 confirmations after a forget).
4. **Confirm.** Speak + caption a bilingual confirmation that the data is gone.

## Hard rules — non-negotiable
- **Never store raw GPS in any aggregate** — pincode centroid only.
- **Never sell or share identifiable capture** — anonymised, user-owned.
- **"Chitti forget" is total** — local + swarm, with a tombstone, not a soft hide.
- **Capture never bypasses the disclaimer** — a scan result is still
  price/composition intelligence, never a diagnosis.
- **Vision is honest-degradable** — when DeepSeek vision is unavailable the scan
  falls back to manual entry ("vision service unavailable, please type"), and no
  capture is fabricated.

## Escalation to CTO (SOP.md)
- Camera-capture write-rate drops (could mean the Turso write path is broken —
  cross-check with [sop_deploy_and_verify.md](sop_deploy_and_verify.md) roundtrip).

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
