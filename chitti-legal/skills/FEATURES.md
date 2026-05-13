# Chitti Legal — FEATURES

Honest inventory: **Built** · **Planned** · **Future**. Same contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-13**.

Verify with: `chitti-legal/backend/routes/`, `chitti_legal.html`, and
the server-enforced disclaimer pattern in
[`project_chitti_ca_legal_logo_video`](../../scripts/).

---

## 1. Built and working
- DeepSeek-backed Q&A for notices / NDAs / rent agreements, plain
  English + Hindi.
- Server-enforced legal disclaimer on every reply (never client-side).

---

## 2. Planned — queued 2026-05-13

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| L1 | **Plain-language explainer for any legal notice** | **P0** | Core PWD-aligned use case — a notice arrives, user is panicked, can't read it. Same "Explain simply" substrate as the homepage and news. | Scanner deep-link from `chitti_scanner.html` → OCR text → DeepSeek with class-5 plain-Hindi system prompt → read-aloud + symbol-labelled "what to do next" steps. Disclaimer server-enforced. |
| L2 | **"Is this contract fair?" checker** | **P1** | High demand around rent / employment / loan contracts. Surfaces specific clauses that are unusual / one-sided / illegal in India. | Per-clause analysis: ✅ standard / ⚠️ unusual / ❌ likely unenforceable in India — symbol + word label, never colour alone. DeepSeek + a checklist of red-flag clause types (waiver of rights, ambiguous termination, illegal penalty). |
| L3 | **Tenant rights by state** | **P2** | India has state-specific rent acts (Maharashtra, Delhi, Karnataka, Tamil Nadu, etc.). One national answer is wrong. | Per-state rent-act table (key sections + plain-language summary). State picker via `chitti_a11y.js` language selector → state. Voice read-aloud. |

**How to apply:**
- Every reply still carries the server-enforced disclaimer — Chitti
  Legal is **not** a lawyer. "Consult a lawyer for binding advice" is
  appended by the server, not the LLM
  (`project_chitti_ca_legal_logo_video`).
- L2 must never tell the user a clause is "illegal" without naming the
  Indian Act / Section the clause violates. If the LLM can't cite,
  downgrade ❌ → ⚠️.
- L3 should default to the user's state from `chitti_a11y.js`, but
  always show "showing rights for: <STATE> — change?" with voice
  readback.

---

## 3. Future — needs partnership / regulator
- Bar Council / lawyer-marketplace integration to escalate "Chitti
  can't answer this" cases to a paid lawyer call.
- Court-case status (eCourts API) — public but rate-limited; needs
  caching infra.
- Per-state rent-tribunal / consumer-forum filing assistance — needs
  per-state forms inventory.

---

## How to keep this file honest

1. Server-enforced disclaimer is non-negotiable. Never move it client-side
   — see `project_chitti_ca_legal_logo_video` and
   [`feedback_verify_before_handover`](../../).
2. L1 explainer must read aloud by default (not opt-in). The user
   panicked enough to scan a notice — they don't have spare cognitive
   load to click another button.
3. Every contract analysis result must have a "what to do next" step
   (symbol + word label). Information without action breaks the
   "guardian / commando / coach" contract
   (`feedback_design_from_pwd_user_perspective`).
