# Chitti Voice Factory — FEATURES

Honest, code-verified inventory of what the [`chitti_voice_factory.html`](../../chitti_voice_factory.html) surface (plus the 26 per-language pages) actually does today. Same three-section contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md): **Built & working**, **Planned**, **Future**.

Chitti Voice Factory is the **shared voice substrate** every Chitti product calls. Its locked architecture is in [[project_voice_factory_complete]] + [[project_chitti_voice_factory_spec]]: 26 languages (12 primary + 14 cousin incl. Sanskrit + Oraon), 4-supplier cascade (mock_bhashini → real Bhashini → AI4Bharat → Sarvam → on-device), Tier C **never silently falls back**, honest ledger on every call.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-voice-factory/backend/routes/voice.py`](../backend/routes/voice.py),
[`chitti-voice-factory/backend/routes/donate.py`](../backend/routes/donate.py),
[`chitti-voice-factory/backend/routes/fluency.py`](../backend/routes/fluency.py),
[`chitti-voice-factory/backend/router.py`](../backend/router.py), and
[`chitti-voice-factory/backend/suppliers/*.py`](../backend/suppliers/) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 26-language registry — `GET /api/voice/languages`

- Returns every language with `code`, `name`, `native_name`, `tier`.
  Source: [`services/languages.py`](../backend/services/languages.py).
- 12 primary languages (Hindi / Bengali / Telugu / Marathi / Tamil /
  Gujarati / Kannada / Malayalam / Odia / Punjabi / Urdu / Assamese)
  + 14 cousin (Sanskrit, Nepali, Kashmiri, Sindhi, Maithili,
  Manipuri, Konkani, Dogri, Bodo, Santhali, Bhojpuri, Chhattisgarhi,
  Tulu, Kodava, Oraon).

### 1.2 4-supplier cascade — `POST /api/voice/speak`

- Takes `{text, language?}`. Walks the cascade in tier order until a
  supplier returns audio (or a client-side `directive` for Web Speech
  API fallback). Source:
  [`router.py`](../backend/router.py),
  [`services/voice_factory.py`](../backend/services/voice_factory.py).
- **Order:** `mock_bhashini` (Tier A, active until ULCA creds land)
  → `bhashini` (Tier A, gated on `BHASHINI_*` env vars) →
  `ai4bharat` (Tier B, stub today) → `sarvam` (Tier C, paid, gated)
  → `on_device` (Tier D, currently `supports()=False` everywhere).
- **Tier C never silently falls back** — if Sarvam fails, the
  cascade reports the failure to the ledger; it does **not** morph
  Tulu into Kannada.

### 1.3 Honest ledger — `GET /api/voice/ledger`

- Returns every recent synthesis call with `supplier`, `language`,
  `success/fail`, latency, char-count. Text is anonymised
  (SHA256-only — never stored) before logging.
- Source:
  [`services/ledger_service.py`](../backend/services/ledger_service.py),
  [`backend/ledger.py`](../backend/ledger.py).

### 1.4 Per-language status — `GET /api/voice/status/<lang>`

- Returns supplier-by-supplier readiness for that language — what
  Tier A / B / C / D say about it today. Used by the 26 language
  pages to render the "what works right now" pill.

### 1.5 Aggregate status — `GET /api/voice/status`

- Returns the same shape across all 26 languages — used by the
  founder dashboard.

### 1.6 Honest disclaimer banner — `GET /api/voice/honest-banner`

- Returns a localised one-line disclaimer (`"Yeh AI ki madad hai.
  Chitti Voice Factory se synthesise kiya gaya hai."` etc.) that
  every Chitti product reads aloud after synthesis. Coverage today:
  12 languages explicitly mapped in
  [`routes/voice.py:_disclaimer_for_language`](../backend/routes/voice.py).

### 1.7 Mock Bhashini supplier (Phase 1)

- [`backend/suppliers/mock_bhashini.py`](../backend/suppliers/mock_bhashini.py)
  returns deterministic `directive` payloads pointing the client at
  the browser's Web Speech API so users hear *something* in every
  language while real Bhashini is pending. Never claims to be real
  Bhashini — `supplier: "mock_bhashini"` in every response.

### 1.8 Real Bhashini supplier (code ready, creds pending)

- [`backend/suppliers/bhashini.py`](../backend/suppliers/bhashini.py)
  implements the full ULCA pipeline-config → inference call. Gated
  on `BHASHINI_USER_ID` + `BHASHINI_API_KEY` + `BHASHINI_INFERENCE_KEY`
  + `VOICE_FACTORY_USE_MOCK_BHASHINI=0`. Sire's ULCA registration
  unblocks it; no code change required after creds land.

### 1.9 Fluency corpus — textbook + Wikipedia ingestion

- `GET /api/voice/fluency/status` — aggregate honest status across
  every language with ingested data.
- `GET /api/voice/fluency/status/<lang>` — per-language: chunks
  ingested, embedding readiness, source plan (NCERT PDF URLs count,
  Wikipedia language tag, cousin-language map).
- `GET /api/voice/fluency/search/<lang>?q=&k=` — semantic search
  across the per-language corpus.
- Source:
  [`services/fluency_corpus.py`](../backend/services/fluency_corpus.py),
  [`services/fluency_ingester.py`](../backend/services/fluency_ingester.py),
  [`services/textbook_sources.py`](../backend/services/textbook_sources.py).
- 79,414 chunks across 55 curriculum PDFs as of 2026-05-12
  ([[project_voice_factory_fluency_pipeline]]). `fluency_ready=true`
  requires `chunks ≥ 50` AND embeddings on disk.
- **Independent of Bhashini.** Fluency is grammar / vocabulary /
  sentence patterns. Pronunciation is owned by `/api/voice/speak`.

### 1.10 YouTube video learning per language

- Endpoints under `/api/voice/fluency/<lang>/videos*`. Users paste
  YouTube URLs on each language page; transcript → chunks. **Cap:
  10 videos per language.** Source:
  [`services/youtube_learner.py`](../backend/services/youtube_learner.py),
  [`routes/fluency.py`](../backend/routes/fluency.py).
  See [[project_voice_factory_youtube_learning]].

### 1.11 26 language pages

- `chitti_hi.html`, `chitti_bn.html`, `chitti_te.html`, … (full
  list in [SAHAYAI_MASTER §4a](../../SAHAYAI_MASTER.md#4a-frontend--folder-map-root-html-files)).
- Each page: read-aloud passage, "Donate your voice" CTA, fluency
  status pill, video-paste-in URL field, supplier-readiness chips.
- Generated via
  [`tools/generate_lang_pages.py`](../tools/generate_lang_pages.py)
  from
  [`tools/template.html`](../tools/template.html) +
  [`tools/i18n.json`](../tools/i18n.json) — adding a 27th language
  is one JSON entry + one regen.

### 1.12 Hall of Fame (Phase 2)

- `POST /api/voice/submit` — record voice + donor info (two-stage
  consent: recording + irreversible confirmation).
- `GET /api/voice/hall-of-fame` — public donor list.
- DB schema in [`backend/ledger.py`](../backend/ledger.py): three
  new tables — `voice_submissions`, `voice_winners`
  (`can_delete=0`, permanent), `voice_synthesis_map`.
- Frontend:
  [`chitti_voice_hall_of_fame.html`](../../chitti_voice_hall_of_fame.html),
  [`voice_donor.html`](../../voice_donor.html),
  [`voice_confirmation.html`](../../voice_confirmation.html).
- Admin: GitHub + Google OAuth gate via `/admin/oauth/start` /
  `/admin/oauth/callback`; `GET /admin/submissions`,
  `GET /admin/submissions/<id>`.
- **No silent fallback** — languages without a Bhashini /
  AI4Bharat option AND no winner show a "donor contest required"
  banner. They are **never** synthesised in the wrong language.

### 1.13 Render deploy (Phase 1 + Phase 2 live)

- [`render.yaml`](../render.yaml) connected; service live at
  `chitti-voice-factory.onrender.com`. The substrate's
  `window.Chitti.a11y.VOICE_FACTORY_URL` defaults to that host.

### 1.14 Donations endpoint (Phase 3 placeholder)

- `GET /api/voice/donations` — public list (empty stub today, note
  field directs interest to `chitti@sahayai.in`).
- `POST /api/voice/donate` — 202 with "under development; contact us"
  message. Honest stub; not pretending to enrol.

### 1.15 Provider-swappable contract

- One URL — `window.Chitti.a11y.VOICE_FACTORY_URL` — is the only hook
  every other Chitti uses. Swapping Bhashini for any future provider
  is a backend change; no frontend touch ever needed
  ([[project_voice_strategy_locked]]).

---

## 2. Planned — queued

Source: [`chitti-voice-factory/TODO.md`](../TODO.md) §1 / §2 / §3.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| VF1 | **Obtain ULCA Bhashini citizen credentials** | **P0** | Phase 6 unblock. `bhashini.py` is code-ready; creds are the only gate. | Submit ULCA form (body draft in [README.md §6](../README.md)); on approval set 3 Render env vars + flip `VOICE_FACTORY_USE_MOCK_BHASHINI=0`; verify `supplier: "bhashini"` on live `hi` synth. |
| VF2 | **Wire AI4Bharat IndicTTS / IndicParler-TTS** | P0 | [`suppliers/ai4bharat.py`](../backend/suppliers/ai4bharat.py) is a stub returning `not_implemented`. Covers Bhojpuri / Bodo / Manipuri / Santhali / Sanskrit (Tier B where Bhashini is thin). | Decide hosting (self-host vs HuggingFace inference endpoint); set `AI4BHARAT_ENDPOINT` / `AI4BHARAT_API_KEY`; flip `supports()`. |
| VF3 | **Wire Sarvam paid fallback** | P1 | [`suppliers/sarvam.py`](../backend/suppliers/sarvam.py) is a stub gated on `SARVAM_ENABLED=1` + `SARVAM_API_KEY`. Spec §11.3 requires a 100-char/request rate-limit in the supplier (not the router). | Implement the per-call rate-limit + surface ₹/char in the ledger. |
| VF4 | **On-device IndicTTS via `onnxruntime-web`** | P1 | [`suppliers/on_device.py`](../backend/suppliers/on_device.py) reports `supports() = False` everywhere today. Phase 10 unlocks offline TTS. | Package quantised IndicTTS ONNX models (~50–200 MB each); IndexedDB cache; per-language download button on each `<lang>.html`; status pill `(local cache · 124 MB)`. |
| VF5 | **Real audio uploads** (Hall of Fame submissions) | P0 | 4 `TODO` markers in code today: `storage_service.py:39, 50, 58`; `routes/voice.py:244`. Submissions currently allocate a mock URL (`https://chitti-internal/submissions/<uuid>`) and never call `storage_service.upload_audio_blob`. | Decide provider (TeraBox or MEGA — cost + Indian-jurisdiction storage); add the upload call **before** `ledger.create_submission`; **fail closed** if upload fails (otherwise the submission row points at an empty URL). |
| VF6 | **Hall-of-Fame audio in the cascade** | P0 | `voice_synthesis_map[language_code]` is populated when an admin confirms a winner (`supplier_type="winner_voice"`, `winner_id=...`), but the **router does not consult this map yet** — it walks the generic supplier cascade. | Router `walk()` must check the map first; on hit, return the winner's stored audio. This is the whole point of the contest. |
| VF7 | **Embed pass on fluency corpus** | P1 | Last-mile: 79,414 chunks ingested, embeddings need a Render py3.11 pass to complete ([[project_voice_factory_fluency_pipeline]]). | Run `backend/scripts/embed_all.py` on a Render shell; verify `fluency_ready=true` for all 26 langs. |
| VF8 | **Honest banner read-after-synth in every consumer** | P1 | `/api/voice/honest-banner` exists; not every Chitti product reads it aloud after synth today. | Per-product wiring — Vaani, MedUPI, Government, Scanner, UPI Guard should each call the banner endpoint and append the read-aloud. |
| VF9 | **Localise the disclaimer dictionary** beyond 12 languages | P1 | `_disclaimer_for_language` covers 12 of the 26; the other 14 fall back to English. | Add per-language strings to the dict in [`routes/voice.py`](../backend/routes/voice.py). |

**How to apply** when implementing:
- VF5 must **fail closed** — if storage upload fails, don't create
  a submission row. A row pointing at an empty URL is worse than
  none, because the contest pages will show ghosts.
- VF6's router check must respect the "no silent fallback" rule.
  If a winner is configured but the audio fetch fails, surface the
  failure to the ledger and fall through to the next supplier; do
  **not** synthesise with the wrong language.
- The whole substrate must remain **provider-swappable at any
  time** ([[project_voice_strategy_locked]]) — every change must
  preserve the `window.Chitti.a11y.VOICE_FACTORY_URL` single-hook
  contract.

---

## 3. Future — needs partnership / regulator / community

Listed because users / Bryan / Sire have asked. No code today.

- **Real Sora / Pika / Runway TTS-to-video** for the narrator
  pipe (Chitti Logo & Video LV5 reuses this substrate). Out of
  scope here; lives in chitti-logo-video.
- **Speaker diarisation** + **emotion classification** on donor
  submissions. Useful for matching donor voices to product
  contexts; needs a paid model or self-hosted Whisper-large.
- **Per-emotion voice synth** — the same donor speaking happy /
  calm / concerned. Needs richer recording protocol + capable
  supplier.
- **Tier-2/3 dialect inventory** beyond the 26 — Marwari, Awadhi,
  Khariboli, etc. Would extend the cousin-language map via more
  `voice_synthesis_map` rows; need community contributors before
  building.

---

## Cross-product hooks (already wired)

- **Every Chitti product → Voice Factory.** `chitti_a11y.js`'s
  `Chitti.a11y.speak()` calls `/api/voice/speak` on this substrate
  ([[project_chitti_a11y_substrate]]). Swap Bhashini for any
  future provider at one URL.
- **Chitti Voice Factory → Hall of Fame** (Phase 2 wiring) —
  admin confirms winners; `voice_synthesis_map` is the contract
  the router will consult once VF6 lands.
- **Chitti Voice Factory ↔ Founder dashboard** — health-ping,
  ledger summary, supplier-failure alerts.
- **Chitti Voice Factory ↔ Chitti Logo & Video** — narrator TTS
  reuses this cascade (planned, LV5 in
  [`../../chitti-logo-video/skills/FEATURES.md`](../../chitti-logo-video/skills/FEATURES.md)).

---

## How to keep this file honest

1. **`mock_bhashini` stays the active default** until VF1 lands AND
   `supplier: "bhashini"` has been curl-verified on the production
   `/api/voice/speak` for `hi` ([[feedback_verify_before_handover]]).
2. Tier C must **never silently fall back**. If Sarvam fails, the
   ledger logs the failure and the response surfaces it — do not
   morph Tulu from Kannada. Any PR that weakens this contract must
   be reverted.
3. Hall of Fame winners are **permanent** — `can_delete=0` in
   [`ledger.py`](../backend/ledger.py). Removing a winner is a
   relock decision, not a hotfix.
4. The provider-swappable contract is a **policy lock**: every
   future supplier wire-up must preserve the single
   `window.Chitti.a11y.VOICE_FACTORY_URL` hook
   ([[project_voice_strategy_locked]]).
