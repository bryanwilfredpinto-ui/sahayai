**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Chitti Health Scanner

> **Chitti helps you notice — doctors help you heal.**

A visual-health capability inside the **Chitti MedUPI** family
(Chitti = Bharat Premium AI · [sahayai.in](https://sahayai.in) · founder
Bryan Wilfred Pinto / "Sire"). Chitti Health Scanner lets a user point the
phone camera at skin, eyes, teeth, wounds, nails, hair and more, and — when
the AI vision capability ships — helps them **notice** patterns worth a
professional's attention. Chitti **never diagnoses**. It DETECTS / NOTICES
and **ESCALATES** to a doctor.

It complements:
- **Chitti MedUPI** — medicine cost intelligence (Jan Aushadhi, generics, family wallet)
- **Chitti Health File** — records / timeline; every scan feeds this timeline

---

## ⚠️ This is a SKELETON / FRAMEWORK — AI analysis is COMING SOON

**HONEST STATUS — read this first.**

- The AI vision models are **NOT built and NOT clinically validated**.
- Every accuracy number in this framework (skin 95%, dental 89–97%, etc.)
  is a **research TARGET / benchmark from published literature — NEVER an
  achieved or measured result of this product.**
- All backend analysis endpoints return an honest **`501 coming_soon`**.
- All certification scores stay **BLANK (`___%`)** until really measured.
- Nothing here is labelled "live", "verified", or "GREEN" unless it has
  actually been measured. The built surface is the page skeleton,
  camera capture, accessibility substrate, multilingual substrate, the
  per-response widget, the disclaimer banner, and the Health-File link.

What IS built today is listed honestly in
[`skills/FEATURES.md`](skills/FEATURES.md) under "Built and working".
Everything in the F0–F12 analysis catalogue is **COMING SOON**.

---

## The COSDF v1.0 Framework — Chitti Organ-Scan Discipline Framework

COSDF v1.0 is the 15-level discipline framework that governs how a visual
health-scan capability is built, gated, and held accountable inside Chitti.
It exists so that a medical-adjacent product never drifts into diagnosis,
never fakes a metric, and never abandons a Blind / Deaf / Mute / Illiterate
user.

| # | Level | What it locks |
|---|-------|---------------|
| **1** | **Constitution** | Non-negotiable laws: never diagnose; detect + escalate; "Chitti helps you notice — doctors help you heal"; no prescriptions; no "you have <disease>"; no certainty; no fear-mongering; no shaming; honest limitations. |
| **2** | **Vision** | The why: a guardian that helps 140 crore Indians *notice* early, then routes them to real care — bridging the rural specialist gap without ever replacing a doctor. |
| **3** | **Personas** | Blind / Deaf / Mute / Illiterate first; plus the rural mother, the diabetic elder, the anxious parent, the daily-wage worker who cannot afford a wasted clinic trip. |
| **4** | **PRD** | Product requirements: capture → confirm gate → (COMING SOON) analyse → confidence + plain explanation + suggested action + disclaimer → Health-File timeline. |
| **5** | **Skills** | Feature catalogue F0–F12 (Skin / Eye / Tooth / Wound / Mole / Nail / Hair / Swelling / Post-surgery / Burn / Child-journal / Diabetic-foot / Change-detection) — each an honest COMING SOON stub. |
| **6** | **SOP** | Standard operating procedure for every scan: consent, camera confirm gate, lighting guidance, capture, encrypt-at-rest, analyse-or-stub, escalate, log to timeline. |
| **7** | **Swarm** | Anonymised cross-instance learning — patterns only, ≥100 confirmations, HIGH-risk human (clinician) review before any skill update; locked safety rules never learnable. |
| **8** | **Guardrails** | Server-enforced disclaimer injection; refusal of diagnosis/prescription language; panic-language suppression; dark-skin accuracy honesty; confidence floor. |
| **9** | **Memory** | User-owned scan history; "Chitti forget" deletes all; never sold; anonymised before any aggregate. |
| **10** | **Observability** | Honest ledger of what's stubbed vs measured; per-endpoint status; no green without a real number. |
| **11** | **Evals** | Test sets and acceptance gates (held BLANK until models + validation exist). |
| **12** | **Accessibility** | Four-user contract: voice IN + voice OUT + icons/symbols + plain language; never colour-only; ISL panel; Disability Profile. |
| **13** | **Quality** | Eight-gate done-definition (Blind / Deaf / Mute / Illiterate × every-box widget × 10 languages × 375px × 48×48px taps). |
| **14** | **Certification** | Visual cert of rendered output; scores stay `___%` until measured; never fake GREEN. |
| **15** | **Constitution-recheck** | Every release re-reads Level 1 and proves no law was broken — diagnosis, certainty, fear, shame, or faked metric = automatic RED. |

---

## Every analysis output MUST carry (Constitution — Level 1)

No analysis result may render without all four:

1. **Confidence level** — honest, with a floor; lower on darker / Fitzpatrick IV–VI skin.
2. **Plain-language explanation** — one pure language per render, no jargon, illiterate-safe.
3. **Suggested action** — exactly one of:
   - 🟢 **monitor** (normal / watch at home)
   - 🟡 **consider consult** (book a professional soon)
   - 🔴 **seek care** (see a professional now / urgent)
4. **Disclaimer** — verbatim: **"This is not a medical diagnosis."**

Colour is **never** used alone — it is always paired with an icon + text:
🟢 normal · 🟡 monitor · 🔴 seek care.

---

## Architecture tree

```
chitti-health-scanner/
├── README.md                  ← this file (COSDF v1.0 overview + tree)
├── constitution/              ← Level 1  — non-negotiable laws (never diagnose)
├── vision/                    ← Level 2  — the why
├── personas/                  ← Level 3  — Blind/Deaf/Mute/Illiterate + rural users
├── prd/                       ← Level 4  — product requirements
├── skills/                    ← Level 5  — FEATURES.md (F0–F12 catalogue, live-parsed)
│   └── FEATURES.md
├── sop/                       ← Level 6  — per-scan standard operating procedure
├── swarm/                     ← Level 7  — anonymised cross-instance learning
├── guardrails/                ← Level 8  — disclaimer injection, refusals, panic suppression
├── memory/                    ← Level 9  — user-owned history, "Chitti forget"
├── observability/             ← Level 10 — honest stub-vs-measured ledger
├── evals/                     ← Level 11 — test sets + acceptance gates (BLANK)
├── accessibility/             ← Level 12 — four-user contract, ISL, Disability Profile
├── quality/                   ← Level 13 — eight-gate done-definition
└── certification/             ← Level 14 — visual cert; scores stay ___% until measured
```

---

## Where it lives in the platform

- **Backend** — extends `chitti-medupi-api` with **`/api/health-scanner/*`**.
  All analysis endpoints currently return honest **`501 coming_soon`**.
- **Frontend** — **`chitti_health_scanner.html`** (page skeleton built).
- **Health File** — every confirmed scan feeds the **Chitti Health File** timeline.
- **Cross-links** — MedUPI (Jan Aushadhi generics) + Government Chitti (PMJAY).

### Locked platform rules honoured here

- **LLM** = DeepSeek ONLY (`api.deepseek.com`, OpenAI-compatible); vision via
  DeepSeek-vision, disclaimer-guarded.
- **Four-user accessibility** — Blind / Deaf / Mute / Illiterate. Voice IN +
  Voice OUT + icons/symbols + plain language. Never colour-only.
- **Multilingual** via the shared substrate (`chitti_lang.js` + `T` dictionary),
  same as Chitti Vaani: 9 primary (en/hi/ta/te/bn/mr/gu/kn/ml) + 26-language
  substrate. **No Hinglish** — one pure language per render. Technical / brand
  terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) stay English.
- **Golden Rule** — Chitti NEVER acts on its own. Opening camera / capturing /
  saving / sharing / setting a reminder passes a confirm gate
  ("Sire, shall I open the camera? Haan / Nahi") — voice + tap, mute-safe,
  never default-to-yes, silence = wait.
- **Per-response widget** — every response box carries `data-chitti-response` +
  🔊 / 🤖 / 👍 / 👎 (`feedback-widget.js`).
- **Privacy** — health images **AES-256-GCM** encrypted at rest, user-owned,
  never sold, anonymised before any aggregate, "Chitti forget" deletes all.
  **DPDP 2023 + ABDM-aware.**

### Brand palette

Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## ⚕️ Medical Disclaimer

**Chitti Health Scanner is not a medical device and does not provide a
medical diagnosis.** It is an assistive tool that helps you *notice* visual
patterns and decide whether to seek professional care. It does not diagnose
disease, does not prescribe treatment, and does not replace a doctor,
dentist, dermatologist, or any qualified healthcare professional.

AI vision is inherently limited and is known to be **less accurate on darker
and Fitzpatrick IV–VI skin tones**; all accuracy figures in this framework
are research **targets**, not measured guarantees. Any result you see is a
suggestion to **monitor**, **consider a consult**, or **seek care** — never a
conclusion.

**If you have a medical emergency, or any symptom that worries you, contact a
qualified healthcare professional immediately.** Never delay or disregard
professional medical advice because of something Chitti showed you.

**Chitti helps you notice — doctors help you heal.**
