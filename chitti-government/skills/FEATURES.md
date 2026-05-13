# Chitti Government — FEATURES

Honest inventory: **Built** · **Planned** · **Future**. Same contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-13**.

Verify with: `chitti-government/backend/routes/`,
`chitti-government/backend/services/`, `chitti_government.html`, and
[`CHITTI_GOVERNMENT_MASTER_SPEC.md`](../../CHITTI_GOVERNMENT_MASTER_SPEC.md)
before claiming "built".

---

## 1. Built and working
- 30 schemes seeded (PMJDY, Ayushman Bharat, PM-KISAN, etc.).
- PIB poll every 6 h (new-scheme + amendment ingest).
- DigiLocker partner-only path; local-upload flow available until
  partner approval lands.

---

## 2. Planned — queued 2026-05-13

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| G1 | **"Am I eligible?" checker** for every scheme | **P0** | This is the core value prop — the #1 question every applicant asks. Without it the product is a list of schemes, not an assistant. | Per-scheme `eligibility_rules` JSON (income, age, state, occupation, caste-category). Voice-driven Q&A drives the form — `chitti.speak` asks one question at a time → readback → "haan" to advance. Result: ✅ eligible / ❔ check / ❌ not eligible — symbol + word label. |
| G2 | **Application status tracker** | **P1** | Closes the loop after applying. Without it Chitti hands the user off and goes silent. | `applications` table per user + scheme; poll partner / portal status (or manual user-confirm prompt) → readback when status changes. Vaani read-aloud handoff for blind users. |
| G3 | **Document checklist per scheme** | **P0** | Most applicants fail because they don't know which documents are needed. Blocks completion of G1. | Per-scheme `documents_required` array → checklist with ✅/❌ per row, voice-buildable. Each row deep-links to scanner (`chitti_scanner.html`) so the user can capture the document then-and-there. DigiLocker fetch when partner approval lands. |

**How to apply:**
- G1 eligibility logic must be **deterministic** — never let DeepSeek
  invent a rule. The LLM explains the result, the rules table decides
  it. Server-enforced disclaimer per
  [`project_chitti_ca_legal_logo_video`](../../scripts/) pattern.
- G3 checklist + scanner deep-link must follow the four-user contract:
  symbols + word labels, voice-out for every row, no colour alone.
- G2 must never auto-confirm a scheme as "approved" from a third-party
  signal we don't trust — verify on the official portal first
  (`feedback_verify_before_handover`).

---

## 3. Future — needs partnership / regulator
- DigiLocker live integration (currently partner-only path).
- Per-scheme direct-submission APIs (NSAP, DEPwD, MoTA portals).
- State-portal SSO (Seva Sindhu, MahaOnline, etc.) — per-state
  agreements.

---

## How to keep this file honest

1. Eligibility data is the **trust contract** for this product. If a
   rule changes after a budget / amendment, update the rules table
   within 7 days and surface a "scheme amended on …" banner.
2. Application status updates **never** infer approval from absence of
   bad signals. Either we have a confirmation from the portal or we
   say "pending — check back".
3. Voice-out is mandatory on every result (`project_four_user_contract`).
   The 30 schemes already loaded must all pass the "blind user can
   complete eligibility check end-to-end" test before G1 ships.
