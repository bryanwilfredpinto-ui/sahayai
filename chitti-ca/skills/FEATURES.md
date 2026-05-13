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
