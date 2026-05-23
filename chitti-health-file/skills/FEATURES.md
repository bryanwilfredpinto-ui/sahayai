# Chitti Health File — FEATURES

Honest, code-verified inventory. Phase A skeleton landed 2026-05-23 in
commit `98a87ad` (backend) + the follow-up commit (frontend). Three
sections per the new-products process: **Built & working**, **Phase B
queued**, **Future / partnership-gated**.

> **CHITTI GOLDEN RULE applies to every feature here.** No upload /
> share / log fires without `hfConfirmAndDo()` first — *"Sire, [action]
> karoon? Haan / Nahi"*. Silence = wait. Never defaults. See
> [SAHAYAI_MASTER.md §2g](../../SAHAYAI_MASTER.md).

Frontend: [`chitti_health_file.html`](../../chitti_health_file.html).
Backend: extends `chitti-medupi-api` with `/api/health-file/*` —
[`routes/health_file.py`](../../chitti-medupi/backend/routes/health_file.py),
[`services/health_file_*.py`](../../chitti-medupi/backend/services/).

Privacy: documents are AES-256-GCM encrypted at rest. Per-user key
derived via HKDF-SHA256(pepper || user_token). Server stores ciphertext
+ nonce + tag — never the raw user_token. Per-use voice consent on
every doctor share. DPDP Act 2023 + ABDM-compliant.

---

## 1. Built and working (Phase A — 2026-05-23)

### 1.1 Family profiles
- Multi-profile per device — Self · Spouse · Mother · Father · Child · Other.
- `GET /api/health-file/profiles` · `POST /api/health-file/profiles`
- Frontend tab bar switches active profile; localStorage remembers
  the last-used. Voice intent `"wife ki health file"` opens this page.

### 1.2 Document upload (encrypted at rest)
- `POST /api/health-file/docs` with `blob_b64` (≤15MB).
- AES-256-GCM encryption via
  [`services/health_file_crypto.py`](../../chitti-medupi/backend/services/health_file_crypto.py).
- Stored fields: ciphertext + 12-byte nonce + 16-byte tag + mime + size +
  doc_type + display_name + doc_date + doctor_name + hospital_name.
- File limit: 15MB per document (Phase B: 500MB per family ceiling
  enforced via a quota check at upload time).
- Doc types accepted: prescription · blood_report · mri · ct_scan · xray ·
  ultrasound · ecg · echo · eye · dental · discharge_summary ·
  insurance_health · insurance_life · vaccination · other.

### 1.3 DeepSeek-vision auto-extraction for two doc types
- **Prescription** → medicines (name + composition + dose + frequency +
  duration) + follow-up date + diet/activity restrictions.
- **Blood report** → every lab line (name + value + unit + normal range
  + out-of-range flag).
- Triggered synchronously on upload (response includes the summary).
- Other doc types return `extract_status="coming_soon"` honestly —
  upload still works, manual tags persist, full extractor lands Phase B.

### 1.4 Health facts (searchable structured projection)
- `GET /api/health-file/facts?q=...&kind=...&profile_id=...`
- Auto-populated from extracted docs (medicines / lab values /
  follow-ups / restrictions / diagnoses).
- Powers the **Timeline** tab + **Search** tab on the frontend.
- "Wife ki diabetes ka history dikhao" = `q=diabet` + the Timeline
  filter.

### 1.5 Vitals log
- `POST /api/health-file/vitals` (BP / sugar / HbA1c / weight / SpO2 /
  pulse / temp).
- Server-side out-of-range detection per ADA + WHO thresholds (e.g.
  HbA1c > 6.5% flagged).
- Voice input: `"BP log karo 140 over 90"` →
  Golden-Rule-confirmed → posted from `chitti_vaani.html`.
- Inline trend chart on the Vitals tab (HTML canvas, 30/90/365 day
  windows). Chart.js + PDF export land Phase B.

### 1.6 Smart reminders (auto-created from extracts)
- `POST /api/health-file/reminders` · `GET /api/health-file/reminders`
- Five kinds: `medicine` (daily RRULE) · `followup` (one-shot) ·
  `premium_due` (with 30/7/1 day advance alerts) · `test_due` ·
  `prescription_expiry`.
- Auto-spawned on document upload — frontend Reminders tab lists +
  toggles + deletes.
- Channels CSV: `browser` + `whatsapp` today. `sms` and `voice_call`
  (Twilio) land Phase B when the env vars are configured (the same
  Layer-5 fallback chain SAHAYAI_MASTER §2e documents).

### 1.7 Insurance manager
- `POST /api/health-file/insurance` (health · life · vehicle · term).
- Fields: company · policy_number · coverage_inr · premium_inr ·
  premium_mode · due_date · renewal_date · maturity_date · nominee.
- **Auto-spawns a `premium_due` reminder with `advance_alerts="30,7,1"`** —
  no manual setup needed. Frontend Insurance tab shows all policies +
  premium-due-soon highlights.

### 1.8 Quick share with doctor (per-use voice consent)
- `POST /api/health-file/share/token` mints a one-shot, 30-min-TTL
  link. Plaintext bytes cached in memory ONLY for the token lifetime.
- `GET /api/health-file/share/file?token=…` consumes the token (404 on
  second hit).
- Frontend Share tab picks N documents + WhatsApp number + optional
  note → `chittiConfirmAndDo("Sire, shall I share … with …?")` →
  `wa.me/?text=` pre-filled with the links.

### 1.9 "Chitti forget" tombstone
- `DELETE /api/health-file/docs/<id>` sets `forget_at`, blanks the
  encrypted blob bytes (so a future pepper leak can't recover them),
  cascades to delete the structured facts.

---

## 2. Phase B — queued

These are the spec items that need follow-up work. The frontend tabs
that depend on them show `COMING SOON` badges so the user isn't
surprised.

| # | Item | Why it's Phase B |
|---|---|---|
| B1 | Per-type extractors for MRI / CT / X-ray / ultrasound / ECG / echo / eye / dental / discharge_summary / insurance docs / vaccination | Each needs its own DeepSeek prompt + facts projection. Prescription + blood report were the highest-value pair for Phase A; rest queued in order of user demand. |
| B2 | LLM reasoning over insurance ("Kya wife ki surgery covered hai?") | Needs a multi-shot DeepSeek call that joins the policy's coverage + exclusions JSON with the user's question. Server-enforced "this is not legal/insurance advice" disclaimer. |
| B3 | Hospital network checker ("Kya Apollo policy mein hai?") | Same reasoning path as B2; needs the network_hospitals JSON to be reliably extracted from policy docs first. |
| B4 | APScheduler dispatch worker for reminders | v1 returns reminders via `/reminders` GET — frontend polls + speaks alerts. Phase B fires WhatsApp deep-links and (env-gated) Twilio voice calls. |
| B5 | Chart.js trend charts + PDF export for vitals | v1 ships an inline canvas line chart that's enough to spot trends. Phase B = polished Chart.js + a "Doctor PDF" export. |
| B6 | 500MB per-family quota enforcement | v1 enforces 15MB per document; aggregate quota lands when we have real usage data. |
| B7 | "Doctor visit summary" auto-generation across last N visits | A DeepSeek summarisation pass over the timeline. Useful before appointments. |
| B8 | Prescription comparison (what's new vs what stopped vs Jan Aushadhi link) | Cross-references the most recent prescription against the prior one; links each medicine to Chitti MedUPI Jan Aushadhi alternative (already a live endpoint in this same backend). |
| B9 | Voice-driven "compose visit note" — Chitti speaks the timeline aloud before the doctor walks in | Reuses `Chitti.a11y.speak`; needs a curated ordering that doesn't dump 500 facts. |
| B10 | Caregiver mode — daughter can manage mom's profile from her own account | Needs a delegation token model. v1 ships with localStorage profile per device only. |

---

## 3. Future — partnership-gated

| Item | Partner / regulator |
|---|---|
| ABDM integration ("link your ABHA, pull records from PHRs") | NHA partnership + scope grant |
| Direct cashless authorisation request to insurance company | TPA API access (per insurer) |
| Pre-authorisation upload (planned surgery) | Same TPA stack |
| Hospital-discharge auto-pull | Hospital HIS integration — out of reach for a sideload-tier product |
| Lab-result auto-pull from chain labs (Thyrocare / Metropolis / SRL / Dr Lal) | Per-lab partnership |
| Aadhaar-verified family chain (binds profiles to legal relationship) | Aadhaar OTP scope — opt-in per SAHAYAI §2 (Aadhaar refusal default) |

---

## Cross-product hooks already in place

- **Chitti MedUPI ↔ Chitti Health File** — same backend, same Turso DB,
  shared FamilyProfile model. The Jan Aushadhi lookup is already
  available; Phase B's "B8 prescription comparison" just calls it.
- **Chitti Vaani ↔ Chitti Health File** — voice intents wired in
  `chitti_vaani.html`:
  - `"Wife ki health file"` → opens this page scoped to that profile.
  - `"BP log karo 140 over 90"` → posts to `/api/health-file/vitals`.
  - `"Insurance reminder set karo"` → opens the Reminders tab.
  - `"Upload blood report"` → opens the Upload tab.
- **Chitti MedUPI camera** ↔ this page — Phase B will share the
  scanner UX (the user already gestures at a strip; same gesture for
  a prescription).

---

## How to keep this file honest

Each row above maps to either (a) a route + service function in
`chitti-medupi/backend/`, or (b) a UI control in `chitti_health_file.html`.
When you change behaviour, update the matching row here. When you ship a
Phase B item, **MOVE** it from §2 to §1 — never duplicate. If you remove
an item, document why in the commit message + delete the row.

The 30-second undo on every action lives in the existing `logAction`
audit pattern used by `chitti_vaani.html`. The Health File page does
not yet emit `logAction` rows (gap noted) — Phase B will plumb it in.
