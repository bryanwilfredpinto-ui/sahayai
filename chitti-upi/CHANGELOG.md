# Chitti UPI Fraud Guard — Changelog

History is reconstructed from `git log --oneline -- chitti-upi/ chitti_upi.html`
on branch `main`.

## v0.1.0 — initial skeleton (commit `bc3673b`)

> `feat(chitti): ship Vaani + UPI Fraud Guard + Scanner — full skeleton`

Single commit that introduces the entire product in one pass, in line
with the project memory entry _Skeleton-first pass must be exhaustive_.

**Backend** (`chitti-upi/backend/`)
- `main.py` — Flask app factory, CORS allow-list, error handlers for
  400/404/405/413/500, root banner + `/health`, registers
  `routes.upi` blueprint.
- `config.py` — `Settings` dataclass: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`
  (default `deepseek-chat`), `DEEPSEEK_URL`, `ALLOWED_ORIGINS`,
  `UPI_MAX_TOKENS` (500), `UPI_TEMPERATURE` (0.2).
- `routes/upi.py` — Blueprint `/api/upi/*` with `POST /check`,
  `GET /rules`, `GET /health`.
- `services/upi_service.py` —
  - `CHITTI_UPI_FRAUD_PROMPT` system prompt.
  - `check(text, language)` — DeepSeek call with `response_format=json_object`,
    safe-parse, normalise, clamp `risk` to `{HIGH, MEDIUM, LOW}`.
  - `_fallback()` — returns `MEDIUM` (never LOW) on AI outage.
  - `rbi_2026_rules()` — 4 static educational cards (2FA, 1-hour
    cooling lag, Trusted Person, Kill Switch).
  - `health()` — diagnostic.
  - `LEGAL_LINES` — two hard-coded disclaimer strings appended to every
    verdict.
- `requirements.txt` — flask 3.0.3, flask-cors 4.0.1, gunicorn 22.0.0,
  httpx 0.27.2.
- `runtime.txt` — `python-3.11.10`.

**Frontend**
- `chitti_upi.html` (root, 591 lines) — single-page UI: Bharat-themed
  saffron/navy palette, consent overlay with 6 T&C sections + 🔊 speak
  buttons, dictation mic, sample-card grid (KYC scam, electricity scam,
  KBC-lottery scam, OTP-on-call), verdict band (HIGH red flashes, MEDIUM
  orange, LOW green), indicators chips, actions list, dashed legal-lines
  block, header language toggle.
- `chitti-upi/frontend/index.html` — mirror of the root page.
- `chitti-upi/frontend/README.md` — one-line note that this mirrors the
  root and supports `?api=...` query override.

**Skill**
- `chitti-upi/skills/chitti-upi/SKILL.md` — top-level sub-agent skill
  manifest documenting repo layout, endpoint surface, consent gating,
  cross-product hooks (→ Vaani on HIGH, ← Scanner), and live URLs.

**Deploy**
- `chitti-upi/render.yaml` — Render Blueprint, free plan, Python runtime,
  rootDir `backend`, gunicorn 2 workers, 60s timeout. Env: `PYTHON_VERSION`,
  `DEEPSEEK_API_KEY` (sync:false), `DEEPSEEK_MODEL`, `ALLOWED_ORIGINS`
  (sahayai.in + www.sahayai.in), `UPI_MAX_TOKENS`, `UPI_TEMPERATURE`.

## Outside the chitti-upi/ tree — relevant project events

| Date       | Memory entry                                              | Impact on UPI Guard                                                |
|------------|-----------------------------------------------------------|---------------------------------------------------------------------|
| 2026-05-09 | _AI provider switching Anthropic → DeepSeek_              | `upi_service.py` already targets DeepSeek; no migration needed.    |
| 2026-05-10 | _Render deploy status 2026-05-10_                         | `render.yaml` present but **not yet connected** to Render. P0.     |

## Pending (not yet a commit)

See [`./TODO.md`](./TODO.md).
