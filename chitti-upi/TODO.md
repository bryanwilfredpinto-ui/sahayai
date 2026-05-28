# Chitti UPI Fraud Guard — TODO

Status as of 2026-05-11.

Priority key:
- **P0** — blocking real users / commitments to Bryan
- **P1** — needed to feel finished
- **P2** — research / future shape

---

## P0 — Ship to production

| #   | Item                                                                                                                | Why                                                                                                       |
|-----|---------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| P0-1 | Connect `chitti-upi/render.yaml` Blueprint to Railway and deploy `chitti-upi-api`                                   | Per memory _Railway deploy status 2026-05-10_, this product has a Blueprint but **no live backend** yet.   |
| P0-2 | Set `DEEPSEEK_API_KEY` in Railway dashboard (it is `sync:false` in render.yaml)                                     | Without it, every request falls back to MEDIUM "AI offline" — the product is functionally broken in prod. |
| P0-3 | Verify on live before handover: `curl https://chitti-upi-api.onrender.com/api/upi/health` and one `/check` smoke   | Project memory _Verify on live before handover_ — Bryan should never be the one who discovers it broken.  |
| P0-4 | Add `chitti-upi-api` to the founder-dashboard health-ping list (sahayai.in/founder)                                | Memory: _All feature status visible at sahayai.in/founder_.                                               |
| P0-5 | Wire HIGH-verdict → Vaani deep-link in `chitti_upi.html` (skill says it exists; verify in the live page)           | Cross-product hook documented in `skills/chitti-upi/SKILL.md` but needs a live test.                      |

## P1 — Finish the v1 surface

| #    | Item                                                                                          | Pointer                                                  |
|------|-----------------------------------------------------------------------------------------------|----------------------------------------------------------|
| P1-1 | Rate-limit `/api/upi/check` (per-IP token bucket) so abusive paste-loops don't burn DeepSeek  | Currently no rate limit. `flask-limiter` would fit.      |
| P1-2 | Expand `_LANG_NAMES` to all 26 Voice Factory languages (currently 9)                          | `backend/services/upi_service.py` line ~77               |
| P1-3 | Per-language `_fallback()` strings — today the fallback warning is Hindi-only                 | `backend/services/upi_service.py` `_normalise()` / `_fallback()` |
| P1-4 | Localise `LEGAL_LINES` for non-Hindi languages (currently Hindi-only)                         | `backend/services/upi_service.py`                        |
| P1-5 | Add a `POST /api/upi/check/stream` SSE variant so the spoken warning can start before `actions[]` finishes | UX win for blind users                       |
| P1-6 | Cache identical `text` for 5 min (LRU in-memory) — same scam SMS hits us thousands of times   | DeepSeek tokens / latency                                |
| P1-7 | Telemetry counters: requests, risk distribution, fallback rate                                | Add a `/metrics` or push to founder dashboard            |
| P1-8 | Frontend: add a "report this scam" button that POSTs the text + verdict to a future endpoint  | Builds a private corpus for prompt-tuning                |
| P1-9 | Add a 4000-char counter on the textarea so users don't get a silent 413                       | `chitti_upi.html`                                        |
| P1-10 | Localise the 4 RBI 2026 cards beyond Hindi (`title_xx`, `body_xx`, `speak_xx`)               | `rbi_2026_rules()`                                       |

## P2 — Voice-biometric UPI v2 (research)

Per project memory `CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` (referenced in
the user prompt) — long-arc work that would turn UPI Guard from a
**warning tool** into a **payment-grade voice-first UPI front end**.
None of this is in the current commit. Treat as research.

| #    | Item                                                                                                       |
|------|-------------------------------------------------------------------------------------------------------------|
| P2-1 | Voice biometrics: enrol the user's voice on first run; refuse to surface a `upi://pay` intent if speaker mismatch. |
| P2-2 | Parse natural-language payment intent: "Pay 200 to Ramesh" → `{payee_label, amount, note}`. Needs a NEW LLM prompt — see `PROMPTS.md`. |
| P2-3 | Resolve `payee_label` against the user's on-device contacts (Android `READ_CONTACTS`) — never a server-side directory. |
| P2-4 | Generate `upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&cu=INR` and hand off via Android intent — Chitti never executes the payment itself. |
| P2-5 | Readback + 5-second undo: speak "Pay two hundred rupees to Ramesh? Cancel in five." before launching intent. Mirrors Vaani family-cascade pattern. |
| P2-6 | Family-cascade for amounts above a threshold (e.g. ≥ ₹10,000): require master + spouse confirm, never silently send. |
| P2-7 | Build the Android wrapper required for biometric mic capture + intent launch — pure web cannot do this safely. |
| P2-8 | Threat-model: replay attack on stored voice sample → mitigate with challenge-phrase (random word the user must repeat). |
| P2-9 | Legal: confirm with a payments lawyer that "intent generation" without execution remains outside NPCI's TPAP regime. |

## Maintenance / hygiene

| #    | Item                                                                                       |
|------|---------------------------------------------------------------------------------------------|
| M-1  | Pin `httpx` upper-bound (currently `==0.27.2`) — fine, but add a Dependabot/Renovate rule. |
| M-2  | Add `pytest` + a tiny fixture suite for `_safe_parse` / `_normalise` (no DeepSeek needed). |
| M-3  | Add a `Makefile` with `make dev`, `make smoke`, `make deploy-check`.                       |
| M-4  | Sync `chitti-upi/frontend/index.html` with root `chitti_upi.html` — they drift easily.    |

## Grep results (TODO/FIXME)

`grep -nE 'TODO|FIXME|XXX|HACK' chitti-upi/` returned **no source-code
TODOs**. The only matches are sample-card `data-text=` strings inside
`frontend/index.html` (the fake scam-SMS bodies used as example inputs)
— those are content, not action items.
