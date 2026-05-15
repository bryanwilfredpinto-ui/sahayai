# Chitti CA — FEATURES

Honest inventory: **Built** · **Planned** · **Future**. Same contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-13**.

Verify with: `chitti-ca/backend/routes/`, `chitti_ca.html`, and
[`project_chitti_ca_legal_logo_video`](../../scripts/) for the
server-enforced disclaimer pattern.

---

## 1. Built and working
- DeepSeek-backed Q&A across ITR / GST / TDS / advance tax.
- Server-enforced CA disclaimer on every reply (never client-side).

---

## 2. Planned — queued 2026-05-13

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| C1 | **Tax-saving reminder before March 31** | **P1** | Deadline-driven, high-value, voice-first. Reaches the user when there is still time to act (80C / 80D / NPS / ELSS). | Cron at user-chosen IST window from early Feb → March 31; per-user `tax_profile` (regime, est. income, salaried/self-employed) → DeepSeek-generated personalised list of remaining deduction headroom. Vaani read-aloud handoff. |
| C2 | **GST filing deadline alerts** | **P1** | Self-employed / shopkeeper users miss GSTR-1 / GSTR-3B deadlines and pay late fees. | Per-user `gst_profile` (turnover bucket → return cadence) → cron 3 days before each statutory due date → readback "GSTR-3B due in 3 days for ₹ X estimated". Symbol + word label, never colour alone. |
| C3 | **"How much tax will I save if I invest X?"** | **P2** | Companion to C1 — turns the reminder into a decision. | Deterministic calculator (regime-aware: old vs new) for 80C / 80D / 80CCD(1B) / 80G / 24(b). DeepSeek explains the result; the number comes from the calculator, not the LLM. |

**How to apply:**
- C3 is **deterministic + DeepSeek-explained**, never LLM-computed.
  Mirror the chitti-government G1 pattern: rules table decides, LLM
  explains.
- Server-enforced disclaimer applies to every reply — Chitti CA is
  **not** a Chartered Accountant. "Consult a CA before filing" appended
  by the server, not the LLM
  (`project_chitti_ca_legal_logo_video`).
- C1 and C2 alerts respect Vaani quiet-hours rules — never wake the
  master at night for a tax reminder.

---

## 3. Future — needs partnership / regulator
- E-filing portal integration (income tax + GST) — government-only APIs.
- Auto-import of Form 26AS / AIS / TIS — needs ITD partner status.
- Tally / Zoho Books / Vyapar integration for the shopkeeper segment —
  per-vendor partnerships.
- TIN-NSDL FVU validation for TDS returns — currently no public API.

---

## How to keep this file honest

1. Server-enforced disclaimer is non-negotiable
   (`project_chitti_ca_legal_logo_video`). The LLM **does not author**
   the disclaimer — the server appends it.
2. C3 numbers are deterministic. If the calculator says ₹ 23,400, the
   reply says ₹ 23,400. The LLM is not allowed to round, soften, or
   approximate (`feedback_design_from_pwd_user_perspective` — Chitti is
   a commando, exact numbers when exact numbers exist).
3. New deduction sections / regime changes get added to the calculator
   in the **same commit** as the LLM prompt update — otherwise the
   explanation drifts from the math.
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Cite the **exact Section number** on every response — *"Section 80C of Income Tax Act, 1961"*. Already in the CA_KNOWLEDGE.md corpus; enforce in the system prompt with a required-format check. | System-prompt update + an output-schema rail in `lib/quadrails.py` that flags any answer lacking a `Section X` citation for HIGH-risk topics. |
| Q2 | **Disclaimer BEFORE the answer**, not after. Compliance INJECT rail prepends instead of appending. | [`lib/hooks.py::wrap_llm`](../../lib/hooks.py) — change `compliance_inject` to support `position='prepend'` for HIGH-risk Chittis. CA + Legal flip to prepend; MedUPI keeps the existing `legal_lines` JSON-field position because vision output is structured. |
| Q3 | Built-in calculators for HRA / 80C / 80D / NPS — deterministic numbers, DeepSeek explains. Mirrors the C3 pattern from §2 above. | Add `services/ca_calculators.py` (pure-Python, no LLM) for each deduction. DeepSeek wraps the result with the user's narrative context. |
| Q4 | Budget 2025 changes highlighted **separately** in every relevant answer — visible `Budget 2025 update` chip. | Tag every line in CA_KNOWLEDGE.md with a `<!-- budget-2025 -->` HTML comment; the response renderer extracts and re-highlights those lines. |
| Q5 | Confidence score on every answer via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js) — *"High confidence (CA Final grade)"* vs *"Medium — please verify with your CA"*. | Wrap CA responses with a judge call (`lib/evaluators.py`) that emits a 0–1 confidence; frontend renders the chip + auto-attaches `verifyWith: 'your CA'` when below 70%. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | ITR form selector — *"Which ITR form should I file?"* based on income type (salary / business / capital gains / etc.). | P1 | Decision tree in `ca_itr_selector.py` (deterministic — never LLM); LLM only narrates the result. Updated annually for the FY's ITR-1 → ITR-7 form revisions. |
| S2 | GST HSN code finder — search by product description. | P1 | DeepSeek + a curated `hsn_codes.json` seed (from CBIC). User describes the product, Chitti returns the HSN code + GST rate + reasoning. |
| S3 | TDS calendar — all TDS due dates for the current month. | P1 | Cron-generated calendar (no LLM); cross-references Section 192 / 194 / 195 etc. dates per FY. Renders as a tappable date grid. |
| S4 | Advance tax calculator — quarterly amounts. | P1 | Pure calculator + LLM narrative. Reuses Q3 deduction modules. |
| S5 | Form 26AS explainer — what each entry means in plain Hindi / regional language. | P2 | User pastes Form 26AS text (or PDF upload — COMING SOON); LLM explains TDS / TCS / refund entries with citations. |
| S6 | New Tax Regime vs Old Tax Regime — comparison with **user's actual numbers**. | **P0** (annually relevant) | Deterministic comparator + LLM narrative. Output: side-by-side ₹ difference + recommendation. Already in CA_KNOWLEDGE.md — surface as a tap-to-launch flow. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
