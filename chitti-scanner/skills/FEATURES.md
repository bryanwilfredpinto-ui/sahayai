# Chitti Product Scanner — FEATURES

Honest, code-verified inventory of what the [`chitti_scanner.html`](../../chitti_scanner.html) surface actually does today. Same three-section contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md): **Built & working**, **Planned**, **Future**.

Chitti Scanner is the **single multi-purpose scanner** — packaged food, FSSAI labels, medicines (deep-link to MedUPI), UPI scam screenshots (deep-link to UPI Guard), legal documents, KYC documents, generic text. Camera or text input; never both for the same scan.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-scanner/backend/routes/scanner.py`](../backend/routes/scanner.py),
[`chitti-scanner/backend/services/scanner_service.py`](../backend/services/scanner_service.py),
and [`chitti_scanner.html`](../../chitti_scanner.html) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 Multi-modal scan endpoint — `POST /api/scanner/analyze`

- Accepts either a **multipart image upload** (field `image`) OR a
  JSON body `{text, language?}`. Returns the same response shape in
  both cases so the frontend stays simple.
- **8 MB image cap; 6000-char text cap.**
- Source:
  [`routes/scanner.py:analyze_route`](../backend/routes/scanner.py),
  [`services/scanner_service.py`](../backend/services/scanner_service.py).

### 1.2 Text-only path — `POST /api/scanner/analyze/text`

- JSON-only convenience path: `{text, language?}` → same response
  shape. Used by the frontend when the user types instead of
  capturing.

### 1.3 DeepSeek classification with strict JSON schema

- DeepSeek call uses `response_format: {type: "json_object"}` for a
  strict shape: `{type, summary, facts[], risks[], actions[],
  cross_links{}}`.
- The `type` is one of 7: `packaged_food`, `medicine`,
  `legal_doc`, `kyc_doc`, `upi_scam`, `general_text`, `unknown`.
- Per-type legal disclaimer is **server-enforced** — Chitti cannot
  return a verdict without the appropriate disclaimer attached. See
  `LEGAL_LINES_BY_TYPE` in
  [`scanner_service.py`](../backend/services/scanner_service.py).

### 1.4 Honest fallback when DeepSeek is unconfigured

- `_fallback()` returns `type: "unknown"` with a clear "AI offline"
  message in the user's language. Never fakes a verdict.

### 1.5 Cross-product deep links (frontend)

- **MedUPI** — when `type=medicine`, the frontend calls
  `${MEDUPI_API_BASE}/api/medupi/medicine/<query>` and inline-renders
  the Jan Aushadhi alternatives panel. One tap → `chitti_medupi.html`
  with the scanned medicine pre-filled.
- **UPI Guard** — when `type=upi_scam`, the frontend deep-links to
  `chitti_upi.html` with the scanned text pre-filled.
- **Vaani** — every scan can be re-spoken via Vaani's read-aloud
  hook (the scan result is POSTed to `/api/vaani/ask` with
  `mode=read` so blind users hear the verdict).

### 1.6 Frontend — `chitti_scanner.html`

- Bharat-themed saffron / navy single-page UI.
- Consent gate with 6 T&C sections + 🔊 per section (same pattern as
  UPI / Vaani).
- **Camera capture** via `MediaStream` (rear camera preferred).
- **Gallery upload** for existing photos.
- **Text fallback** with dictation mic when camera is unavailable
  (desktop / permission denied).
- Auto-speak result in 9 Indian languages (Hindi / English / Tamil /
  Telugu / Bengali / Marathi / Gujarati / Kannada / Malayalam) — the
  remaining 17 Voice Factory languages route through the cascade
  but speech-synth voice may not be available on every OS.
- **20-row local history** in `localStorage` — type + summary +
  timestamp only, never the original image or full text. Zero PII
  in history by design (CONTEXT.md privacy contract).

### 1.7 SEBI disclaimer + four-user contract

- Sticky `NOT SEBI REGISTERED` bar + full legal modal (even though
  Scanner is not an investment product — repo-wide merge-blocker per
  [[project_legal_disclaimer]]).
- Every result card carries symbol + word label, never colour-only
  ([[project_four_user_contract]]).

### 1.8 Diagnostics — `GET /api/scanner/health`

- Returns whether DeepSeek text + vision are configured, current
  model, vision status (today: `off`).

---

## 2. Planned — queued

Source: [`chitti-scanner/TODO.md`](../TODO.md) P0 / P1 / P2.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| S1 | **First Render deploy** of `chitti-scanner-api` | **P0** | `render.yaml` ready since the skeleton commit `bc3673b`, never connected. Per [[project_render_deploy_status_2026_05_10]] this is in the "8 with render.yaml unconnected" bucket. | Click "Apply" on [render.yaml](../render.yaml); paste `DEEPSEEK_API_KEY`; curl `/health` + one `/analyze/text`; verify on live before handover ([[feedback_verify_before_handover]]). |
| S2 | **Verify frontend `API_BASE`** points to the right Render slug after deploy | **P0** | `chitti_scanner.html` defaults to `https://chitti-scanner-api.onrender.com`; if Render assigns a different slug we need to either rename the service or update the constant. | Live-page click after S1. |
| S3 | **Wire DeepSeek vision** (or replace) | **P1** | `analyze_image()` is wired for an OpenAI-compatible vision endpoint but `render.yaml` ships with `DEEPSEEK_VISION_MODEL="off"`. Per [[project_ai_provider_switch_to_deepseek]] the team is pending DeepSeek credentials AND a scope decision (especially around MedUPI vision). | Set `DEEPSEEK_VISION_MODEL=<id>`; verify the multipart path returns `source: "deepseek_vision"`. |
| S4 | **Aadhaar / PAN / KYC redaction in the frontend** | **P1** | CONTEXT.md promises last-4 masking for Aadhaar / PAN / VPA but the HTML renders the model's `summary` verbatim. | Client-side post-processor masking `\d{4}\s?\d{4}\s?\d{4}` (Aadhaar), `[A-Z]{5}\d{4}[A-Z]` (PAN), and VPA patterns before display. |
| S5 | **Server-side PII scrubbing** | **P1** | Same masking must hold even if the frontend regresses. | `_normalise()` in [`scanner_service.py`](../backend/services/scanner_service.py) runs the masking before returning `summary` / `facts`. |
| S6 | **MedUPI hand-off contract test** | P1 | Frontend calls `${MEDUPI_API_BASE}/api/medupi/medicine/<q>` and expects `alternatives` or `items`. Add a smoke test so a MedUPI shape-drift doesn't silently break Scanner. | New test in `chitti-scanner/backend/tests/` or pytest from the integration layer. |
| S7 | **Persist consent language alongside consent flag** | P2 | Today `LANG_KEY` and `CONSENT_KEY` are independent; returning users re-derive their T&C language from `chitti_scanner_lang`. | Combine into one localStorage key. |
| S8 | **Voice Factory fallback** for non-native-voice OSes | P2 | Web SpeechSynthesis voice quality varies by OS. For Tamil / Telugu / Bengali / Marathi / Gujarati / Kannada / Malayalam, queue the text to `/api/voice/speak` (Voice Factory cascade) instead of falling back to English ([[project_chitti_voice_factory_spec]]). | Frontend speech helper change. |
| S9 | **Camera permission re-prompt UX** | P2 | `openCamera()` shows a raw `alert()` on permission denial — breaks the four-user contract for blind users. | Replace with the consent-style modal that reads the explanation aloud. |
| S10 | **`GET /api/scanner/version`** endpoint | P2 | Founder dashboard at `sahayai.in/founder` wants git SHA + DeepSeek model + vision status visible at a glance. | New route returning the diagnostic triple. |

**How to apply** when implementing:
- PII redaction (S4 + S5) must run **both** client- and server-side
  — the server is the authoritative guard, the client is defence in
  depth. Don't ship one without the other.
- DeepSeek vision (S3) must follow the same four-user contract: if
  vision can't classify, return `type: "unknown"` and surface the
  failure in voice — never fake a verdict.
- Voice Factory fallback (S8) hooks into the existing
  `Chitti.a11y.speak()` substrate — no new pipe.

---

## 3. Future — research / out-of-scope

Tracked under TODO P3.

- **Offline scan log export.** Email a CSV of the 20-row local
  history (zero PII; just type + summary + timestamp).
- **Per-type prompt fine-tuning.** Split `CHITTI_SCANNER_PROMPT` into
  a `_PROMPT_BY_TYPE` dispatch if quality drifts on a specific type
  (e.g., legal_doc).
- **Rate limiting** (per-IP token bucket). DeepSeek key cost is the
  only cap today; once the service is live, add a limiter.
- **Database persistence** — explicitly **out-of-scope by design**.
  The privacy posture in
  [`chitti-scanner/CONTEXT.md`](../CONTEXT.md) depends on the
  service staying stateless. Adding a DB is a relock decision, not a
  TODO.

---

## Cross-product hooks (already wired)

- **Chitti Scanner → MedUPI** — `type=medicine` inlines the Jan
  Aushadhi panel and deep-links to `chitti_medupi.html`.
- **Chitti Scanner → UPI Guard** — `type=upi_scam` deep-links to
  `chitti_upi.html` with text pre-filled.
- **Chitti Scanner → Vaani** — every scan can be read aloud via
  `/api/vaani/ask?mode=read` for blind / illiterate users.
- **Chitti Scanner → Founder dashboard** — health-ping pending S1
  (Render deploy).

---

## How to keep this file honest

1. Database stays disallowed. If a future PR adds SQLAlchemy / SQLite
   to `chitti-scanner/`, this file (and the PR) must be reverted —
   the privacy contract in CONTEXT.md is the floor.
2. Move S1–S10 from Planned → Built **only after** curling the live
   endpoint AND clicking the camera / text flow in the live page
   ([[feedback_verify_before_handover]]).
3. SEBI sticky banner is required on the page even though Scanner is
   not an investment product — repo-wide merge-blocker
   ([[project_legal_disclaimer]]).
4. PII redaction (S4 + S5) is a **policy lock**, not a quality
   target. If either side regresses, the regression is a P0 bug.
