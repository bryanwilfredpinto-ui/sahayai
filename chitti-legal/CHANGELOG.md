# Changelog — Chitti Legal

Derived from `git log --oneline --reverse -- chitti-legal/` at the time of writing. Chitti Legal shipped in a single commit alongside three other products.

## 2026-05-09

- **db18427** — `feat(chitti): Voice Factory (26 langs) + CA + Legal + Logo&Video`
  - Initial release. Created `chitti-legal/backend/` with:
    - [main.py](backend/main.py) — Flask app factory, `/` banner, `/health`, CORS via `ALLOWED_ORIGINS`.
    - [config.py](backend/config.py) — `Settings` dataclass driven by env vars (`DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_URL`, `LEGAL_MAX_TOKENS=800`, `LEGAL_TEMPERATURE=0.25`).
    - [routes/legal.py](backend/routes/legal.py) — `/api/legal/health` and `/api/legal/explain` with 400 / 413 guards.
    - [services/legal_service.py](backend/services/legal_service.py) — `CHITTI_LEGAL_PROMPT`, 12-language map, DeepSeek httpx call, `_enforce_disclaimer()`, `_fallback()`.
    - [requirements.txt](backend/requirements.txt) — flask 3.0.3, flask-cors 4.0.1, gunicorn 22.0.0, httpx 0.27.2.
    - [runtime.txt](backend/runtime.txt) — python 3.11.10.
    - [render.yaml](render.yaml) — `chitti-legal-api` web service on Render free tier, 2 gunicorn workers, 60s timeout.
  - Frontend [chitti_legal.html](../chitti_legal.html) shipped in the same commit at repo root: sticky red disclaimer bar, 12-language picker, 8 doc-type chips, voice-in (SpeechRecognition) / voice-out (SpeechSynthesis), "never drafts" red card.
  - Disclaimer text frozen at: *"AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."*

## Pending

No subsequent commits have touched `chitti-legal/`. The product is feature-complete for v1 against the four-user contract — open gaps (photo-OCR upload, partial-reveal of Aadhaar/PAN scrubbing, lawyer-directory referral) are tracked in [TODO.md](TODO.md).
