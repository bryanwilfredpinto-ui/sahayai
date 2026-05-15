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
| Q1 | Eligibility wizard — ask **5 qualifying questions** before showing schemes (age / income / category / state / occupation). Never show the full 30+ scheme list to everyone. | Decision tree in `government_eligibility.py` (deterministic — no LLM). LLM only narrates the result + missing-document checklist. |
| Q2 | Document checklist must be **specific** — *"Aadhaar"*, not *"ID proof"*. Each scheme carries an explicit `documents_required: []` array. | Audit the 30-scheme seed catalog; every scheme gets a typed checklist. PIB poll adds new schemes with the same shape. |
| Q3 | Application deadline shown **prominently** — red badge if within 30 days, amber if within 90, green otherwise. | Frontend renders `deadline_iso` + auto-coloured badge. No silent expiry — closed schemes carry a `closed_on` field. |
| Q4 | State-specific schemes → ask user's state first. | Same state-detector pattern as Legal Q5. Already partially wired via `Chitti.location.pincode` — extend to surface the state name. |
| Q5 | *"Applied"* button — user marks when they applied; Chitti tracks status across visits. | Per-device list (local-only); reminder cron checks back in 30 days asking *"Did you hear back?"* for status tracker. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | PM-KISAN payment status checker | P1 | Deep-link into the PM-KISAN portal with prefilled Aadhaar (user-consented; never stored). Read the resulting page aloud. |
| S2 | Ayushman Bharat / PMJAY eligibility checker | **P0** (health) | Decision tree based on SECC-2011 categorisation; cross-link from MedUPI's PMJAY medicine coverage flow. |
| S3 | Ration card status + entitlement checker | P1 | Per-state portal deep-link; LLM narrates the entitlement table for the user's category (AAY / PHH). |
| S4 | Scholarship finder for students — state + category + class | P1 | Filter the existing scheme catalog by `category: education`; future: pull from NSP (National Scholarship Portal) directly when API access lands. |
| S5 | MGNREGA work availability in user's block | P1 | Deep-link into the MGNREGA MIS for the user's panchayat (derived from pincode). Narrates job-card status. |
| S6 | DigiLocker document fetch — **COMING SOON** until partner approval lands | P1 | Honest stub; local-upload flow remains the user-facing path. When approval arrives, swap the upload step for an OAuth-bound DigiLocker fetch. |
| S7 | Grievance filing guide — which portal for which complaint | P1 | Decision tree mapping complaint type → CPGRAMS / RBI ombudsman / SACHET / consumer forum / etc. |

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
