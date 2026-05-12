# STANDARDS — What Chitti Follows

Every standard listed here is enforced in code, audited daily, and visible on [`../chitti_quality.html`](../chitti_quality.html). Standards without a code anchor or a public link do not appear.

---

## 1. Quadrails (Safety · Relevance · Truth · Compliance)

**Anchor:** [`../lib/quadrails.py`](../lib/quadrails.py).

Four rails gate every Chitti response:

| Rail | Catches | Default verdict |
|---|---|---|
| SafetyRail | hate, violence, self-harm, illegal goods | block + log |
| RelevanceRail | off-topic for *this* Chitti | polite redirect (not block) |
| TruthRail | model claim ≠ provided ground-truth | block + show source |
| ComplianceRail | disclaimer missing | inject + log |

Per-Chitti **disclaimer verbatim text** (enforced by ComplianceRail):

- medupi → *"Not medical advice. Consult your doctor."*
- legal → *"Not legal advice. Consult an advocate."*
- ca → *"Not financial advice. Consult a CA."*
- shares (technical + fundamentals) → *"NOT SEBI REGISTERED — Educational tool only."*
- news → *"Verify with the source — Chitti aggregates, not editorialises."*
- government → *"This is government scheme guidance. Chitti is a guide, not sarkari seva."*
- sales → *"This is sales coaching from distilled books, not a guarantee."*
- vaani / vaani-android → emergency protocol disclaimer + family-cascade-not-cops.
- voice-factory → "AI-generated voice. Attribution: Bhashini / NLTM."

Each Chitti's quadrails verdicts are emitted to its `quality_audit` Turso table and aggregated by [`../lib/founder_report.py`](../lib/founder_report.py).

---

## 2. Hooks (lifecycle observability)

**Anchor:** [`../lib/hooks.py`](../lib/hooks.py).

Every Chitti backend registers the same five hooks:

1. `before_request` — start latency timer + extract `X-User-Token` + locale.
2. `after_model` — record quadrails verdicts + token counts + supplier (DeepSeek today).
3. `after_response` — finalise log row + emit feedback prompt for response card.
4. `on_error` — single error envelope, server-friendly Hindi+English error message.
5. `on_disclaimer_missing` — last-ditch ComplianceRail injection (defensive).

A Chitti missing any of the five fails today's audit.

---

## 3. Observability

**Anchor:** [`../lib/observability.py`](../lib/observability.py).

Three obligations per Chitti:

- **Structured logs**, one JSON line per request, never with raw PII (PII strip via [`../lib/pii_guard.js`](../lib/pii_guard.js) on the way in).
- **Health endpoint** at `/health` — returns `{ok, version, last_audit, quadrails_active}`. UptimeRobot polls every 5 minutes.
- **`/admin/founder` JSON** — same shape across every Chitti. Read by [`../lib/founder_report.py`](../lib/founder_report.py).

---

## 4. Evaluators (LLM-as-judge for tone + truth)

**Anchor:** [`../lib/evaluators.py`](../lib/evaluators.py).

Three scheduled evaluator passes:

- **Tone evaluator** — 1% sample. Catches "I'd be happy to help" SaaS-bot drift; we want guardian-commando-coach voice.
- **Truth evaluator** — 100% sample for medupi & shares (highest-stakes); 5% elsewhere. Cross-checks against ground-truth bundle.
- **Disclaimer evaluator** — 100% sample. Confirms ComplianceRail injection actually fired.

Scores roll up daily into the **Hallucination Rate %** on the public page.

---

## 5. Braille + Accessibility (BrailleBack ready)

**Anchor:** [`../BRAILLE.md`](../BRAILLE.md), [`../chitti_a11y.js`](../chitti_a11y.js).

Seven must-pass rules per page (from BRAILLE.md):

1. `chitti_a11y.js` loaded; `Chitti.a11y.init({voiceRequired})` called.
2. Semantic landmarks: one `<h1>`, `<main>`, `<nav>`, `<footer>`.
3. Dynamic updates routed through `Chitti.a11y.announce(text)`.
4. Every interactive control has `aria-label` or visible text.
5. Decorative emojis marked `class="emoji-decor"` or `aria-hidden="true"`.
6. Tab order = reading order. No `tabindex > 0`.
7. Touch targets ≥ 48×48 CSS px.

WCAG target: **2.1 AA**, audited manually until axe-core CI lands.

---

## 6. Multi-language UI + Voice Provider Abstraction

**Anchor:** [`../chitti_a11y.js`](../chitti_a11y.js), [`../chitti-voice-factory/`](../chitti-voice-factory/).

- 26-language selector injected on every Chitti page.
- Voice IN + Voice OUT mandatory; pages where voice is part of the contract show the **🎤 Voice Required** marker.
- One URL (`Chitti.a11y.VOICE_FACTORY_URL`) routes all speech. **Bhashini today.** Swap any future provider by changing the URL or the supplier cascade in [`../chitti-voice-factory/backend/services/`](../chitti-voice-factory/backend/services/) — zero frontend changes.
- Tier C languages **never silently fall back**; the Voice Factory honestly reports `unsupported`.

---

## 7. Global Best Practices

**Anchor:** [`../GLOBAL_BEST_PRACTICES.md`](../GLOBAL_BEST_PRACTICES.md).

What we **adopt**:

| Standard | From | What we follow |
|---|---|---|
| **GB/T 37668-2019** — Accessibility design for elderly users | 🇨🇳 China | Single-tap elder/braille mode; 18pt + single-column layout when toggled. |
| **Voice-first finance UX** | 🇨🇳 Alipay / WeChat Pay | Speak-the-name flow in Chitti Vaani, MedUPI, Sales. |
| **UAE Charter for the Development & Use of AI** (2024) | 🇦🇪 Dubai | Inclusivity, transparency, accountability, safety, human oversight — each mapped to a quadrail or hook. |
| **DubaiNow / TAMM 8-language minimum** | 🇦🇪 Dubai | Indian-context equivalent: minimum 4 Indian languages live before a Chitti can be marked "shipped". |
| **Happiness meter** | 🇦🇪 Dubai government | Thumbs-up/down at [`../lib/feedback.py`](../lib/feedback.py) on every response card. |
| **Singapore Model AI Governance Framework v2** + companion guides | 🇸🇬 Singapore IMDA | Risk-tier per Chitti (high for medupi/legal/ca, medium for shares, low for news); each tier has matching observability + evaluator coverage. |
| **AI Verify** testing principles | 🇸🇬 Singapore | Eight principles (transparency, explainability, repeatability, safety, security, robustness, fairness, accountability) mapped to evaluator passes in [`../lib/evaluators.py`](../lib/evaluators.py). |
| **SG Enable Inclusive Design Mark** | 🇸🇬 Singapore | The four-user contract is the local equivalent. |
| **WCAG 2.1 AA** (continuous audit) | 🇸🇬 Singapore Govtech mandate | Manual via [`../BRAILLE.md`](../BRAILLE.md) checklist; axe-core CI planned. |

What we **refuse**:

- 🇨🇳 Social-credit feedback aggregation (China) — happiness meter is anonymised, per-product.
- 🇨🇳 Super-app monoculture (China WeChat / Alipay) — each Chitti is independently installable, deletable, auditable.
- 🇦🇪 Mandatory national-ID linking (UAE Pass) — Aadhaar is opt-in everywhere.
- 🇸🇬 Centralised digital identity (Singpass) — no Chitti-pass, no mandatory biometrics.

---

## 8. Privacy & Data

- DPDP Act 2023 compliance: audit log on-device (Vaani), never auto-uploaded.
- No third-party analytics. `X-User-Token` is a per-device UUID in `localStorage`.
- No reading-history sold to advertisers. No ad surfaces anywhere.

---

## 9. Provider lock-in refusal

- **LLM:** DeepSeek today. Provider swap is a single-file change in each Chitti's `services/<chitti>_deepseek.py`.
- **Voice:** Bhashini today. Provider swap is a backend supplier-cascade change — zero frontend churn.
- **DB:** Turso libSQL. Embedded-replica pattern means local SQLite is the source of truth on each instance; cloud is for sync only.

---

*Last refreshed 2026-05-12. Owner: Chitti Quality.*
