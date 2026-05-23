# CONTEXT — Chitti Health File

## The problem

Sire's wife has 500+ pages of medical history — prescriptions,
blood reports, MRI scans, insurance policies, discharge summaries —
scattered across folders, drawers, doctor inboxes. Generic
"document storage" apps treat each scan as a dead PDF. **Chitti
Health File treats each scan as a living record**: it READS the
document, EXTRACTS the structured facts (medicines, lab values,
follow-up dates, premium dues), and ACTS on them by setting the right
reminders + answering questions in the user's language.

It is **NOT** a doctor. It is the digital-twin filing cabinet that
every Indian family has been missing. The doctor is still the doctor;
Chitti is the family secretary who makes sure no follow-up is missed,
no premium lapses, and no out-of-range lab value goes unnoticed.

## The Golden Rule, applied to health data

Health data is the most personal data Chitti will ever touch. So the
Golden Rule (SAHAYAI_MASTER §2g) applies with EXTRA bite here:

- **Every upload** confirms — *"Sire, kya main yeh prescription
  upload karoon? Chitti padhke saara detail nikal degi."*
- **Every share** confirms PER USE — *"Sire, kya main Wife ki last 3
  reports Dr Sharma ko bhejun?"* (Even if you shared the same docs
  yesterday, today's share asks again. There is no "approve once,
  run forever" for medical data.)
- **Every vital log** confirms — *"Sire, kya main BP 140 over 90
  log karoon?"* — because typo'd vitals create false-alarm flags.
- **Every reminder save** confirms — *"Sire, kya main yeh medicine
  reminder lagaaun?"*
- **Every delete** confirms — *"Sire, kya main yeh document hamesha
  ke liye delete karoon? Wapas nahi aayega."*

This is enforced in code via `hfConfirmAndDo()` on the frontend —
the backend trusts that gate (same pattern as the rest of the Chitti
platform).

## Privacy contract (NON-NEGOTIABLE)

| Rule | Code |
|---|---|
| AES-256-GCM at rest | [`services/health_file_crypto.py`](../chitti-medupi/backend/services/health_file_crypto.py) — HKDF-SHA256 → 32-byte per-user key, 12-byte nonce, 16-byte tag |
| User_token never stored raw | sha256(token + user_token_pepper) — same pattern as the chitti-vaani vault |
| Per-use voice consent on every share | `hfConfirmAndDo()` on the frontend |
| No AI training on health data | DeepSeek API ToS opt-out (default for paid plans) |
| "Chitti forget" tombstones the blob | `DELETE /api/health-file/docs/<id>` blanks ciphertext + cascades fact rows |
| DPDP Act 2023 compliance | Grievance officer sire@sahayai.in, voice consent valid per Act §6 |

## Why this lives inside chitti-medupi-api (not its own service)

Per Sire 2026-05-23: *"extend chitti-medupi-api with /api/health-file/*
routes."* Rationale:

- Same Turso DB → consistent backups, one place to "Chitti forget"
- Same DeepSeek vision client → already proven on prescription scan
- Same APScheduler → reminder dispatch (Phase B) lands without new infra
- Same Quality Framework (Observability + HookRegistry + wrap_llm) →
  Health File LLM calls already get the audit trail
- Same FamilyProfile model → wallet + health file share the family

When Phase 3 ships (proactive briefs across products), this co-residence
makes the prescription → medicine-cost → Jan-Aushadhi → save chain
trivial.

## Four-user accessibility contract — applied

| User | What Chitti does on this page |
|---|---|
| **Blind** | Every action's confirm-modal speaks the question aloud. Vitals voice-log via `proMic`. Read-aloud of extracted summaries. |
| **Deaf** | Every confirm shows in the modal as text + Yes/No buttons. Extracted summaries land as visible cards. |
| **Mute** | Every action has a tap button (the voice path is parallel, not required). Manual entry on every modal. |
| **Illiterate** | Voice-log the vital, voice-listen to the timeline, ISL panel on every response box (inherited from `chitti_a11y.js`). |

The **elderly** user is the integration test — they hit every constraint at once. The "wife has 500 pages of history" framing is exactly this user.

## What lands when

| Phase | Status | What |
|---|---|---|
| **Phase A** | ✅ shipped 2026-05-23 | Backend skeleton + frontend full surface + prescription/blood-report auto-extract + family profiles + vitals + reminders + insurance CRUD + per-use voice consent share |
| **Phase B** | Queued | Per-type extractors (MRI/CT/discharge/insurance/etc.) + LLM reasoning over insurance + APScheduler dispatch + Chart.js + PDF export — see [`skills/FEATURES.md` §2](skills/FEATURES.md) |
| **Phase C** | Future, partnership-gated | ABDM / TPA integration, lab auto-pull, hospital discharge auto-pull |

## Spec source of truth

[`CHITTI_FULL_ACCESS_AGENT_v1.docx`](../) §5.1 (Health & Medicine) +
§3 (Document Vault) drove the scope. The detailed doc-type extractor
prompts are in [`services/health_file_extract.py`](../chitti-medupi/backend/services/health_file_extract.py).
