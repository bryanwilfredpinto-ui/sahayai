**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 💡 What can Chitti Health Scanner do for you?

> **Chitti helps you notice — doctors help you heal.**
> Chitti never diagnoses. It helps you *notice* a pattern, then sends you to a
> real professional. Every result carries a confidence level, a plain-language
> explanation, a suggested action, and the line **"This is not a medical
> diagnosis."**

This file is read **live** by `chitti_features.js` and spoken aloud on the
Feature Discovery Box. Honest status only.

---

## 1. Built and working

> **Guardian Memory release (2026-06-05)** — the Scanner is now a *companion that
> remembers*, not just a camera. See [`../GUARDIAN.md`](../GUARDIAN.md) for the full
> 10-level map. Everything below is real and local-first; **no AI diagnosis is
> claimed**. The AI visual analysis in §2 is now **built (non-diagnostic, paid)** —
> it describes visible features + urgency, never a disease.

- **🩺 Capture / Upload a health photo** — point-and-capture, or **Upload** a photo when there is no camera (rural / desktop). Behind the Golden-Rule confirm gate ("Sire, shall I open the camera? Haan / Nahi" — voice + tap, mute-safe, never default-to-yes).
- **📖 Health Memory timeline (Level 2 — Chitti remembers)** — every saved photo is kept on a private, on-device timeline per body-area. A memory grid shows photo count + days tracked; tap an area to see it. **Save is Golden-Rule confirmed.**
- **🔁 First-vs-latest compare + conservative trend (Level 2 + 9)** — side-by-side compare of your first and most-recent photo, a full day-by-day strip, and an honest trend line (*"4 photos over 12 days — if it looks worse, see a doctor"*). **No fake %, no measurement claim, no prophecy.**
- **👨‍👩‍👧 Family mode + caregiver alert (Level 7)** — per-family-member profiles; save a caregiver + WhatsApp number; daily-check reminder; **"Notify caregiver — something looks worse"** → Golden-Rule confirm → pre-filled WhatsApp message. Chitti never auto-sends.
- **💊 Medicine link (Level 4)** — from any scan, **"Scan the medicine for this"** deep-links into Chitti MedUPI. Reads the medicine *strip*, never the skin.
- **🌾 Village / rural mode (Level 8)** — local-first (works offline), upload fallback, voice-first, low-data.
- **🗑️ "Chitti forget"** — delete a single photo or a whole area; the data is the user's.
- **Voice-guided, icon-first accessibility** — Blind / Deaf / Mute / Illiterate contract: Voice IN + Voice OUT + icons/symbols + plain language; never colour-only (🟢 normal / 🟡 monitor / 🔴 seek care always paired with icon + text); ISL panel + Disability Profile via `chitti_a11y.js`.
- **Multilingual substrate** — `chitti_lang.js` + `T` dictionary: 9 primary languages (en/hi/ta/te/bn/mr/gu/kn/ml) + 26-language substrate, one pure language per render, no Hinglish. Brand/technical terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) stay English.
- **Per-response widget on every box** — `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎 via `feedback-widget.js`.
- **Disclaimer banner** — persistent "This is not a medical diagnosis. Chitti helps you notice — doctors help you heal."
- **Health-File timeline link** — confirmed scans cross-link into the Chitti Health File timeline; cross-links to MedUPI (Jan Aushadhi) + Government (PMJAY).

---

## 2. AI analysis — BUILT (non-diagnostic) · paid · 2026-06-05

> **The AI visual analysis is now built and wired** — `POST /api/health-scanner/analyze`
> (DeepSeek-vision, [`services/health_scanner_analyze.py`](../../chitti-medupi/backend/services/health_scanner_analyze.py)).
> It is **NON-DIAGNOSTIC by construction**: it describes only *visible features*,
> gives a confidence level + an urgency (🟢 normal / 🟡 monitor / 🔴 seek care) +
> the mandatory disclaimer, and a **server-side safety envelope** suppresses any
> disease name / diagnosis the model might emit (escalating to seek-care). It
> **never** names a condition. The research accuracy numbers below remain
> **TARGETS** (clinical validation is still pending — see CERTIFICATION, RED).
>
> **Cost (user-borne):** each scan is one paid vision call, ~**₹0.05–0.10**. The
> page shows a cost-disclosure gate before the first scan ("Continue?" + "Don't
> ask again for 24 hours"). **The user bears this cost, not Chitti/Sahayai.**
>
> **Honest availability:** until the backend's LLM key is funded, `/analyze`
> returns `status:"unavailable"` and the UI shows "please consult a doctor" — it
> **never fabricates** a result (SAHAYAI_MASTER §3 rule 4).

| ID | Feature | What it describes (visible only) | Status | Research target* |
|----|---------|------------------------------|--------|------------------|
| **F0** | **Skin scan** | colour, redness, dryness, border, size, spreading/oozing | ✅ BUILT (non-diagnostic) | ~95% |
| **F1** | **Eye scan** | redness, swelling, watering/discharge, yellow tint, lid lump | ✅ BUILT (non-diagnostic) | ___% |
| **F2** | **Tooth / dental scan** | dark spots/holes, chips, discolouration, gum redness/swelling | ✅ BUILT (non-diagnostic) | 89–97% |
| **F3** | **Wound scan** | size, wound-bed colour, spreading redness, swelling, discharge | ✅ BUILT (non-diagnostic) | ___% |
| **F4** | **Mole scan** | Asymmetry / border / colour / size change patterns (ABCDE) | ✅ BUILT (non-diagnostic) | ___% |
| **F5** | **Nail scan** | Colour, ridges, fungal-looking patterns | ✅ BUILT (non-diagnostic) | ___% |
| **F6** | **Hair / scalp scan** | Thinning, patches, scalp patterns | ✅ BUILT (non-diagnostic) | ___% |
| **F7** | **Swelling scan** | Visible swelling, comparison left vs right | ✅ BUILT (non-diagnostic) | ___% |
| **F8** | **Post-surgery scan** | Healing progress, redness around incision | ✅ BUILT (non-diagnostic) | ___% |
| **F9** | **Burn scan** | Burn area appearance, suggested care level | ✅ BUILT (non-diagnostic) | ___% |
| **F10** | **Child health journal** | Track a child's visible symptoms over time | ✅ BUILT (non-diagnostic) | ___% |
| **F11** | **Diabetic-foot scan** | Foot ulcers, colour change, pressure-point patterns | ✅ BUILT (non-diagnostic) | ___% |
| **F12** | **Change detection** | Compare today's scan to a past scan, flag change | ✅ BUILT (non-diagnostic) | ___% |

\* Targets are from published research literature, NOT measured results of this
product. AI is known to be **less accurate on darker / Fitzpatrick IV–VI skin
tones** — this limitation is disclosed honestly at every result.

---

## 3. Future — partnership / regulator gated

> These depend on clinical partners, regulators, or large datasets and are not
> on the immediate roadmap. Honest stubs only.

- **Clinical validation** — independent clinical studies measuring real accuracy before any number turns from `___%` to a measured value.
- **Medical Advisory Board** — qualified clinicians review HIGH-risk swarm patterns and sign off on every skill update.
- **On-device / offline models** — run analysis privately on the phone with no upload, for low-connectivity Bharat.
- **ABDM link** — connect verified scans to the user's ABHA / national health record (consent-gated, DPDP 2023 compliant).
- **Diverse-skin-tone dataset** — build and validate a Bharat dataset across all Fitzpatrick types to close the dark-skin accuracy gap.

---

## ⚕️ Reminder

**This is not a medical diagnosis.** If a symptom worries you, contact a
qualified healthcare professional immediately. **Chitti helps you notice —
doctors help you heal.**
