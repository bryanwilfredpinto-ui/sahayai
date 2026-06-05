**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 🛡️ Chitti Guardian — the 10-level path to a 10/10 Health Scanner

> **The thesis:** a 10/10 Health Scanner is **not a better detector — it is a
> Guardian.** And the Guardian is built almost entirely from *memory and
> connection*, not from medical-AI accuracy. That matters because the
> AI-detection levels are the one part we **must not** rush (they need
> clinically-validated models + a Medical Advisory Board), while the companion
> levels deliver real value **today** on substrate we already own.
>
> **Chitti helps you notice — doctors help you heal.** Chitti never diagnoses.

This document is the product north-star for Chitti Health Scanner. It maps the
10 Guardian levels to honest status (**🟢 SHIPPED · 🟡 PARTIAL · 🔴 GATED**),
and records exactly what is built versus what is intentionally held back.

---

## Why "memory, not diagnosis" is the unlock

The Guardian's signature line —

> *"This rash appears similar to the one photographed 10 days ago. It has
> expanded slightly despite medication. Consider contacting your provider."*

— breaks into four honest, buildable pieces, **none of which require Chitti to
know it is a rash**:

| Phrase | What it really is | Needs AI diagnosis? |
|---|---|---|
| "similar to 10 days ago" | timeline memory | ❌ no |
| "expanded slightly" | measured area change (user's eyes today; CV later) | ❌ no |
| "despite medication" | MedUPI / Health-File link | ❌ no |
| "consider contacting your provider" | rule-based escalation | ❌ no |

So **7 of the 10 levels ship now without a single medical-AI claim.** That is
the Guardian Memory release.

---

## The 10 levels — honest status

| Lvl | Guardian capability | Status | What is live now |
|----|----|----|----|
| **1** | **Visual scanner** (skin/eye/tooth/wound/…) | 🟢 BUILT (non-diagnostic) | **AI analysis shipped 2026-06-05** — `/api/health-scanner/analyze` (DeepSeek-vision) describes visible features + confidence + urgency (🟢/🟡/🔴) + disclaimer; a server-side safety envelope suppresses any disease name. **Paid (~₹0.05–0.10/scan, user-borne; cost gate before first scan).** Returns honest `unavailable` until the LLM key is funded — never faked. *Clinical-grade accuracy* (validated diagnosis) is still 🔴 — needs dataset + medical board. |
| **2** | **Health Timeline — Chitti remembers** | 🟢 SHIPPED | Every scan saved to a private, on-device health memory; per-area "Day 1 / Day 5…" history; side-by-side **first-vs-latest compare**; full photo strip. |
| **3** | **Blind / Deaf / Illiterate friendly** | 🟢 SHIPPED | Icon-first nav, per-box 🔊 read-aloud, colour **+ icon + text** urgency (🟢🟡🔴), ISL + Disability Profile via `chitti_a11y.js`. Voice-guided capture phrasing is wired; full "move left / lighting low" coaching is 🟡 next. |
| **4** | **Medicine integration (MedUPI)** | 🟢 SHIPPED | From any saved scan: **"Scan the medicine for this"** deep-links into Chitti MedUPI (same-composition + Jan Aushadhi price). Honest — it reads the *strip*, never the skin. |
| **5** | **Health File intelligence** | 🟢 SHIPPED | One-tap into the Chitti Health File timeline where prescriptions, blood reports and scans sit together for the user/doctor to connect. Framed as *organising memory*, not AI correlation. |
| **6** | **Emergency detection swarm** (N-agent vote) | 🔴 GATED | The 9-agent swarm is *documented* ([`swarm/agents.yaml`](swarm/agents.yaml)); the **verdict requires the vision models**, so no fake "4 of 5 agents" votes ship. |
| **7** | **Family mode (elderly daily check)** | 🟢 SHIPPED | Per-family-member profiles; save a caregiver + WhatsApp number; daily-check reminder; **"Notify caregiver — something looks worse"** → Golden-Rule confirm → pre-filled WhatsApp message. Never auto-sends. |
| **8** | **Village / rural mode** | 🟢 SHIPPED | Local-first (works with no/poor internet), photo **Upload** fallback when no camera, voice-first, low-data. Rule-based escalation ("this needs a doctor / keep monitoring") is honest. |
| **9** | **Predictive health (trend)** | 🟡 PARTIAL | Conservative, honest trend now: *"You have tracked this area 4 photos over 12 days — compare first and latest; if it looks worse, see a doctor."* **No fake % and no prophecy.** Auto-measured size trend is 🔴 gated on CV. |
| **10** | **Chitti Guardian** (the companion) | 🟢 EMERGENT | The composition of levels 2·3·4·5·7·8·9 into one companion that *remembers, connects and escalates* — without ever diagnosing. |

---

## What "Guardian Memory" ships (this release)

Implemented in [`../chitti_health_scanner.html`](../chitti_health_scanner.html),
local-first (per-device `localStorage`), every side-effect Golden-Rule gated:

1. **Profiles** — Self + family members; the memory and caregiver are per-profile.
2. **Capture / Upload** → **Save to health memory** (confirm first).
3. **Health memory grid** — one card per body-area with photo count + days tracked.
4. **Site detail + compare** — first-vs-latest side by side, full day-by-day strip,
   and a conservative trend sentence (counts + days only).
5. **Medicine link** → Chitti MedUPI. **Health File link** → encrypted timeline.
6. **Family mode** — caregiver + daily-check + Golden-Rule-confirmed WhatsApp alert.
7. **"Chitti forget"** — delete a photo or a whole area; data is the user's.

**Backend:** the product is local-first today; `/api/health-scanner/*` (on
`chitti-medupi-api`) carries the honest sync shape, with `/analyze` returning
`501 coming_soon` and timeline-sync to the encrypted Chitti Health File vault as
the documented next step. No health data leaves the device unless the user
chooses to save it to Health File.

---

## The gated track (🔴) — the honest path to real detection

Levels 1, 6, and the diagnosis-half of 9 stay `COMING SOON` until **all** of:

1. A diverse, Bharat-representative, multi-skin-tone (Fitzpatrick I–VI) dataset.
2. Per-body-site models meeting the [`evals/EVALS.md`](evals/EVALS.md) targets on a
   held-out clinical set — measured, not claimed.
3. A **Medical Advisory Board** (dermatologist + dentist + wound-care specialist)
   sign-off on every output template and escalation path
   ([`certification/CERTIFICATION.md`](certification/CERTIFICATION.md)).
4. Skin-tone accuracy parity within 5% (Test 7) before any number replaces `___%`.

Until then, the certification scorecard stays **RED / NOT CERTIFIED**, and the
scanner says so out loud. Shipping a guess here would violate the constitution
([`constitution/ROLE.md`](constitution/ROLE.md)) and the guardrails
([`guardrails/GUARDRAILS.md`](guardrails/GUARDRAILS.md)).

---

## ⚕️ Reminder

**This is not a medical diagnosis.** Chitti Guardian remembers, connects, and
escalates — it does not diagnose, prescribe, or claim certainty. If a symptom
worries you, contact a qualified healthcare professional. **Chitti helps you
notice — doctors help you heal.**
