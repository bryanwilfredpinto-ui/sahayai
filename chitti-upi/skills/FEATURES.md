# Chitti UPI Fraud Guard — FEATURES

Honest, code-verified inventory of what the [`chitti_upi.html`](../../chitti_upi.html) surface actually does today. Same three-section contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md): **Built & working**, **Planned**, **Future**.

**Scope correction (locked in [[project_chitti_product_scope_clarifications]]):** Chitti UPI is a **fraud classifier**, NOT a payment surface. It never accepts a `upi://pay` intent, never generates one in v1, never moves money. It takes scam text and tells the user if it's HIGH / MEDIUM / LOW risk, in their language.

Last verified against the working tree on **2026-05-14**. When in doubt, re-grep
[`chitti-upi/backend/routes/upi.py`](../backend/routes/upi.py),
[`chitti-upi/backend/services/upi_service.py`](../backend/services/upi_service.py),
and [`chitti_upi.html`](../../chitti_upi.html) before claiming "built".

---

## 1. Built and working on the web

End-to-end wired: a real HTTP endpoint OR a frontend handler that produces a visible, externally-observable effect.

### 1.1 Fraud classifier — `POST /api/upi/check`

- Takes `{text, language?}` (language default `hi`), returns a DeepSeek
  classification with `risk: HIGH | MEDIUM | LOW`, `indicators[]`,
  `actions[]`, and a hard-coded legal-line block. Source:
  [`routes/upi.py:check_route`](../backend/routes/upi.py),
  [`services/upi_service.py:check`](../backend/services/upi_service.py).
- DeepSeek call uses `response_format=json_object` for strict
  shape. Safe-parse + normalise; `risk` clamped to the 3 allowed
  values.
- **Text cap 4000 chars** (413 above that).
- Honest fallback: when DeepSeek is unconfigured / fails, `_fallback()`
  returns **MEDIUM** (never LOW) with an "AI offline" warning. The
  fail-safe is "be cautious", never "be permissive".

### 1.2 RBI 2026 educational cards — `GET /api/upi/rules`

- Four static cards covering: **2FA / step-up auth**, **1-hour cooling
  lag** for new payees, **Trusted Person**, **Kill Switch**. Source:
  [`upi_service.py:rbi_2026_rules`](../backend/services/upi_service.py).
- Returned as JSON so the frontend can render them in the user's
  language (Hindi today; full localisation queued — see §2).

### 1.3 Per-text legal disclaimer

- Two-line `LEGAL_LINES` block appended to every verdict
  (Hindi today): one disclaimer naming Chitti as AI guidance, one
  pointing the user to RBI's official channel.
- This is **server-enforced**, not client-controlled — Chitti cannot
  return a verdict without the lines attached.

### 1.4 Single-page frontend with full four-user contract

- [`chitti_upi.html`](../../chitti_upi.html) (591 LOC): saffron / navy
  Bharat palette; consent overlay with 6 T&C sections + 🔊 speak per
  section; dictation mic for voice-IN; sample-card grid (KYC scam,
  electricity scam, KBC-lottery scam, OTP-on-call); verdict band
  (HIGH red flashes, MEDIUM orange, LOW green) — **symbol + colour +
  word label**, never colour-only ([[project_four_user_contract]]).
- Indicators chips, actions list, dashed legal-lines block, header
  language toggle.
- Auto-read of the verdict in the user's language via Voice Factory
  cascade.

### 1.5 Consent gate

- 6-section T&C modal locks the textarea until the user taps
  **I AGREE**. Each section has a 🔊 read-aloud button. Acceptance
  persisted in `localStorage.chitti_upi_consent_given`. Same pattern
  as Vaani — onboarding-grant, never per-action modal
  ([[feedback_design_from_pwd_user_perspective]]).

### 1.6 Cross-product hooks (frontend)

- **HIGH verdict → Vaani SOS** — the verdict card surfaces a "Tell
  Chitti Vaani" button that deep-links to `chitti_vaani.html` with
  the scam text pre-filled. (Documented in
  [`skills/chitti-upi/SKILL.md`](chitti-upi/SKILL.md); live-page test
  is a P0 — see §2.)
- **← Chitti Scanner** — the scanner page (`chitti_scanner.html`)
  surfaces UPI fraud as one of its 7 scan types; when text resembles
  a UPI scam it deep-links **into** `chitti_upi.html` with the
  pre-filled text so the user gets a full risk classification.

### 1.7 Diagnostics

- `GET /api/upi/health` — returns whether DeepSeek is configured,
  current model, and supplier status. Used by the founder dashboard
  health-ping.

---

## 2. Planned — queued

Source: [`chitti-upi/TODO.md`](../TODO.md) sections P0 and P1.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| U1 | **First Render deploy** of `chitti-upi-api` | **P0** | `render.yaml` exists since `bc3673b` but has never been connected. Per [[project_render_deploy_status_2026_05_10]] the product is in the "Blueprint present, never connected" bucket — functionally broken in prod. | Click "Apply" on the [render.yaml](../render.yaml) Blueprint in the Render dashboard; paste `DEEPSEEK_API_KEY`; curl `/health` + one `/check` before claiming live (per [[feedback_verify_before_handover]]). |
| U2 | **Wire HIGH-verdict → Vaani deep-link** (live test) | **P0** | Documented in the skill spec; needs a real-page click-through verification, not just a comment in markdown. | Open `chitti_upi.html`, run a HIGH-verdict scam through it, confirm the "Tell Chitti Vaani" button opens Vaani with the text pre-filled. |
| U3 | **Add `chitti-upi-api` to the founder-dashboard health-ping list** | P0 | Otherwise an outage is invisible. | Add the endpoint to `sahayai.in/founder` health-ping config. |
| U4 | **Per-IP rate limit** on `/api/upi/check` | P1 | Today a paste loop burns DeepSeek tokens with no cap. | `flask-limiter` token bucket; ~5/min/IP. |
| U5 | **Expand `_LANG_NAMES` to all 26 Voice Factory languages** | P1 | Today only 9 of the 26 are mapped; the rest fall back to English. | Edit [`upi_service.py`](../backend/services/upi_service.py) `_LANG_NAMES`. |
| U6 | **Per-language `_fallback()` strings** | P1 | The "AI offline" warning is Hindi-only. | Add per-language fallback dict. |
| U7 | **Localise `LEGAL_LINES`** for non-Hindi languages | P1 | Currently Hindi-only — non-Hindi users see Hindi disclaimers. | Per-language `LEGAL_LINES` dict. |
| U8 | **SSE streaming variant** `POST /api/upi/check/stream` | P1 | Lets the spoken warning start before `actions[]` finishes. UX win for blind users. | New SSE route. |
| U9 | **5-min in-memory cache** for identical input text | P1 | Same scam SMS hits us thousands of times; one DeepSeek call per unique text suffices. | LRU cache keyed on SHA256(text). |
| U10 | **Telemetry counters** — requests, risk distribution, fallback rate | P1 | Without metrics we can't tell how often the fallback fires. | `/metrics` endpoint or push to founder dashboard. |
| U11 | **"Report this scam" button** | P1 | Builds a private corpus for future prompt-tuning. | New `/api/upi/report` endpoint + frontend button. |
| U12 | **4000-char counter** on the textarea | P1 | Today users get a silent 413 with no warning. | Frontend counter pill. |
| U13 | **Localise the 4 RBI 2026 cards** beyond Hindi | P1 | Same gap as `LEGAL_LINES` — Hindi-only today. | `title_xx`, `body_xx`, `speak_xx` per language. |

**How to apply** when implementing:
- The fail-safe must stay MEDIUM, never LOW. Any rate-limit /
  caching / fallback change that flips the default toward
  permissiveness is **rejected** — Chitti errs on caution.
- All localisation work flows through the Voice Factory cascade
  ([[project_voice_factory_complete]]) — never browser-native TTS,
  which doesn't cover 26 Indian languages.

---

## 3. Future — research / out-of-scope for v1

Tracked under TODO P2 as **research only**. None of these are
committed work; all are listed because users / Bryan have asked.

### 3.1 Voice-biometric UPI v2 (research)

Per [[project_chitti_product_scope_clarifications]] this is explicitly
**out of v1 scope**. v2 would turn UPI Guard from a warning tool into
a payment-grade voice-first UPI front end. None of the below is in
code today; treat as a research arc, not a roadmap.

| # | Item | Notes |
|---|---|---|
| P2-1 | Voice biometrics: enrol the user's voice on first run; refuse to surface a `upi://pay` intent if speaker mismatch. | Requires the Android wrapper — pure web cannot do this safely. |
| P2-2 | Parse natural-language payment intent ("Pay 200 to Ramesh") → `{payee_label, amount, note}`. | Needs a new DeepSeek prompt. |
| P2-3 | Resolve `payee_label` against on-device contacts (Android `READ_CONTACTS`) — never a server-side directory. | Privacy contract. |
| P2-4 | Generate `upi://pay?pa=&pn=&am=&tn=&cu=INR` and hand off via Android intent — Chitti **never** executes the payment. | NPCI TPAP regime. |
| P2-5 | Readback + 5-second undo: speak "Pay two hundred rupees to Ramesh? Cancel in five." before launching intent. | Mirrors Vaani family-cascade pattern. |
| P2-6 | Family-cascade for amounts above a threshold (≥ ₹10,000): require master + spouse confirm. | Same as Vaani emergency cascade. |
| P2-7 | Build the Android wrapper required for biometric mic + intent launch. | Web cannot do this safely. |
| P2-8 | Threat-model replay attack on stored voice sample → mitigate with challenge-phrase (random word user must repeat). | Spec only. |
| P2-9 | Confirm with payments lawyer that "intent generation" without execution stays outside NPCI's TPAP regime. | Legal review needed. |

### 3.2 Hard refusals stay hard

The four code-level hard refusals in the Vaani Android wrapper
([[project_chitti_product_scope_clarifications]]) — locking the
device, unlocking the device, auto-tapping send, and auto-answering
calls — translate here as: **Chitti UPI will never auto-tap "Pay" in
any UPI app, ever, including for trusted contacts under threshold.**
This is a policy lock, not a TODO.

---

## Cross-product hooks (already wired or planned)

- **Chitti UPI → Vaani** (HIGH-verdict deep link) — frontend wired,
  live-page verification queued as P0 (§2 U2).
- **Chitti Scanner → Chitti UPI** — when scanner detects a UPI scam
  text, deep-links here with the text pre-filled. Wired in
  `chitti_scanner.html`.
- **Chitti UPI → Founder dashboard** — health ping queued
  (§2 U3); request / risk / fallback counters queued (§2 U10).

---

## How to keep this file honest

1. The fail-safe verdict on `_fallback()` is **MEDIUM**, never LOW.
   If a future change flips that default permissive, this file (and
   the PR) must be reverted.
2. Move U1–U13 from Planned → Built **only after** curling the live
   production endpoint AND seeing the verdict in the live page
   ([[feedback_verify_before_handover]]).
3. Voice-biometric UPI v2 stays in §3 as **research** until the
   Android wrapper, the legal review, AND the threat model all land.
   It does not get promoted to §2 just because the spec is written.
4. SEBI sticky banner is required on the page even though Chitti UPI
   is not an investment product — repo-wide merge-blocker
   ([[project_legal_disclaimer]]).
