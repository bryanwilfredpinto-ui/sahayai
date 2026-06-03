🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Mute User (first-class driver / car-owner)

> The entire diagnosis works with **photos and taps**. Voice input is optional, never
> required — especially on a roadside breakdown where a mute driver can't shout for help.

## What they need
- To run a full diagnosis using only camera + taps.
- A **photo-first** path: snap the dashboard / the warning light / the leak, tap the symptoms.
- The Golden-Rule confirm (and the SOS cascade) to accept a **tap** — never voice-only.

## How Chitti serves them
| Need | Implementation |
|---|---|
| Describe the problem | tap a visual symptom picker (jhatke / dhuaan / awaaz / warning-light / leak) + camera photo — zero speech |
| Dashboard read | photo of the cluster → Chitti identifies the lights + reads the OBD2 code → tap to drill in |
| Answer narrowing Qs | tappable picture options (✅ dashboard bright / 🌑 dead) — no spoken answer needed |
| Confirm an action | `chittiConfirmAndDo()` exposes Yes/No **buttons** (mute-safe by design, [§2g](../../SAHAYAI_MASTER.md)) |
| Roadside SOS | big tap button fires the **family cascade** — no need to speak ([../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)) |
| Feedback | 👍/👎 + **type** feedback (mic optional) |

## Failure modes to prevent
- Any diagnosis step that can only be completed by speaking → defect.
- An SOS / confirm gate with voice-only acceptance → **safety defect** (a stranded mute
  driver must be able to call family with a tap).
- A symptom input that's free-text-or-voice only, with no tappable picker → defect.

## Test (part of [../evals/accessibility_eval.md](../evals/accessibility_eval.md))
Disable the mic. Complete: onboard car → photo dashboard → tap symptoms → get diagnosis
→ tap-confirm an RSA dial → tap-fire family SOS. Must complete fully by tap/photo.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
