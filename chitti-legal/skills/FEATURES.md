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
| Q1 | Cite **exact Act + Section** on every response — *"Section 138 of the Negotiable Instruments Act, 1881"*. Output-schema rail flags any HIGH-risk reply missing a citation. | Same enforcement as CA Q1 — `lib/quadrails.py` rail. |
| Q2 | **Disclaimer BEFORE the answer.** Same change as CA Q2 — Compliance INJECT rail `position='prepend'`. | Shared `lib/hooks.py` update with CA Q2. |
| Q3 | For **BNS 2023** — always show old IPC equivalent section for reference (users know old numbers). | Add `bns_to_ipc_map.json` (publicly available from MHA gazette); enrich every BNS answer with `(IPC §X equivalent)` parenthetical. |
| Q4 | Landmark SC judgment cited when relevant — year + case name (*"Vishaka v. State of Rajasthan, 1997"*). | LEGAL_KNOWLEDGE.md already carries landmark judgments; system-prompt requires citation when topic matches. |
| Q5 | Multi-state question → ask user's state first, then give state-specific answer. | State detector in the system prompt; if the topic touches state law (rent, family, etc.) and no state given, ask before answering. Voice-confirm in user's language. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | Legal notice draft generator — user describes situation, Chitti drafts. | **P0** | Strict-template DeepSeek output + LEGAL_KNOWLEDGE.md grounding. Add a disclaimer block at the top of the draft + WhatsApp/PDF share via [`Chitti.a11y`](../../chitti_a11y.js). |
| S2 | RTI application draft generator — plain language RTI for any government department. | P1 | Template-driven (RTI Act §6); user fills 5 fields by voice/tap; output ready to print or email. |
| S3 | Consumer complaint draft — RERA / Consumer Forum / NCDRC. | P1 | Same template approach as S2; choose forum based on value/category. |
| S4 | Rent agreement checklist — what must be in a valid rent agreement by state. | P1 | State-specific checklist from LEGAL_KNOWLEDGE.md state-law section; user's state from Q5 detector. |
| S5 | DPDP 2023 explainer — *"What are my data rights?"* for common users. | P1 | Already deep in LEGAL_KNOWLEDGE.md; surface as a tap-to-launch flow with 6 cards (access / correction / deletion / portability / consent withdrawal / grievance). |
| S6 | FIR guide — how to file, what to say, what NOT to say. | **P0** (safety) | Procedural walkthrough + a "what NOT to say" callout (right against self-incrimination, Article 20(3)). State-specific procedure notes. |
| S7 | Anticipatory bail explainer — when to apply, how to apply. | P1 | CrPC §438 → BNSS §482; explains threshold, court hierarchy, and timing. Lawyer-handover suggestion at the end. |

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
