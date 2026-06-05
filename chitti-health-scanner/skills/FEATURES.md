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

- **Health Scanner page skeleton** — `chitti_health_scanner.html` loads with brand palette (Saffron / Navy / Green), header, and capture surface.
- **Camera capture** — point-and-capture via `chitti_camera_universal.js`, behind the Golden-Rule confirm gate ("Sire, shall I open the camera? Haan / Nahi" — voice + tap, mute-safe, never default-to-yes).
- **Voice-guided, icon-first accessibility** — Blind / Deaf / Mute / Illiterate contract: Voice IN + Voice OUT + icons/symbols + plain language; never colour-only (🟢 normal / 🟡 monitor / 🔴 seek care always paired with icon + text); ISL panel + Disability Profile via `chitti_a11y.js`.
- **Multilingual substrate** — `chitti_lang.js` + `T` dictionary: 9 primary languages (en/hi/ta/te/bn/mr/gu/kn/ml) + 26-language substrate, one pure language per render, no Hinglish. Brand/technical terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) stay English.
- **Per-response widget on every box** — `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎 via `feedback-widget.js`.
- **Disclaimer banner** — persistent "This is not a medical diagnosis. Chitti helps you notice — doctors help you heal."
- **Health-File timeline link** — confirmed scans cross-link into the Chitti Health File timeline; cross-links to MedUPI (Jan Aushadhi) + Government (PMJAY).

---

## 2. Planned — COMING SOON

> These are the F0–F12 AI-analysis capabilities. **None of them work yet.**
> The AI vision models are not built or clinically validated. Backend endpoints
> under `/api/health-scanner/*` return an honest `501 coming_soon`. All accuracy
> numbers below are research **TARGETS**, never achieved results.

| ID | Feature | What it will help you notice | Status | Research target* |
|----|---------|------------------------------|--------|------------------|
| **F0** | **Skin scan** | Rashes, infections, discoloration patterns on skin | 🔜 COMING SOON | ~95% |
| **F1** | **Eye scan** | Redness, jaundice (yellowing), conjunctiva patterns | 🔜 COMING SOON | ___% |
| **F2** | **Tooth / dental scan** | Cavities, gum patterns, plaque, discoloration | 🔜 COMING SOON | 89–97% |
| **F3** | **Wound scan** | Wound size, redness, signs that may need care | 🔜 COMING SOON | ___% |
| **F4** | **Mole scan** | Asymmetry / border / colour / size change patterns (ABCDE) | 🔜 COMING SOON | ___% |
| **F5** | **Nail scan** | Colour, ridges, fungal-looking patterns | 🔜 COMING SOON | ___% |
| **F6** | **Hair / scalp scan** | Thinning, patches, scalp patterns | 🔜 COMING SOON | ___% |
| **F7** | **Swelling scan** | Visible swelling, comparison left vs right | 🔜 COMING SOON | ___% |
| **F8** | **Post-surgery scan** | Healing progress, redness around incision | 🔜 COMING SOON | ___% |
| **F9** | **Burn scan** | Burn area appearance, suggested care level | 🔜 COMING SOON | ___% |
| **F10** | **Child health journal** | Track a child's visible symptoms over time | 🔜 COMING SOON | ___% |
| **F11** | **Diabetic-foot scan** | Foot ulcers, colour change, pressure-point patterns | 🔜 COMING SOON | ___% |
| **F12** | **Change detection** | Compare today's scan to a past scan, flag change | 🔜 COMING SOON | ___% |

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
