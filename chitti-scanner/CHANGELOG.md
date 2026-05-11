# Changelog — Chitti Product Scanner

All notable changes to the `chitti-scanner/` folder and the canonical `chitti_scanner.html`. Source: `git log --oneline -- chitti-scanner/ chitti_scanner.html`.

## Commit history

| SHA | Message |
|---|---|
| `bc3673b` | feat(chitti): ship Vaani + UPI Fraud Guard + Scanner — full skeleton |

## Release notes

### 2026 — initial skeleton (`bc3673b`)

First end-to-end ship of the Scanner product as part of a three-product skeleton sweep (Vaani + UPI Fraud Guard + Scanner). The skeleton lands the **full feature surface** in one commit rather than incrementing across multiple turns — consistent with the repo memory rule on exhaustive first passes.

Included in the skeleton:

- `backend/main.py` — Flask app, CORS, error handlers, blueprint registration
- `backend/config.py` — env-driven Settings dataclass (DeepSeek + CORS + MedUPI base)
- `backend/routes/scanner.py` — `/api/scanner/{analyze, analyze/text, health}` Blueprint
- `backend/services/scanner_service.py` — DeepSeek wrapper + `CHITTI_SCANNER_PROMPT` + per-type legal disclaimers + cross-product link builder + safe-parse + fallback
- `backend/requirements.txt`, `backend/runtime.txt` — Python 3.11.10 + flask 3.0.3 + flask-cors 4.0.1 + gunicorn 22.0.0 + httpx 0.27.2
- `render.yaml` — Render Blueprint (not yet connected)
- `frontend/index.html` (mirror of `chitti_scanner.html`) — consent gate, camera capture, gallery upload, text fallback with mic, result render, auto-speak in 9 Indian languages, MedUPI inline Jan Aushadhi panel, UPI Guard + Vaani hand-offs, 20-row local history
- `skills/chitti-scanner/SKILL.md` — top-level sub-agent spec

Behaviour highlights at v1:

- Text-fallback first; vision path wired but `DEEPSEEK_VISION_MODEL=off` in `render.yaml`
- Server-enforced legal disclaimer per `type`
- 8 MB image cap, 6000 char text cap
- Strict JSON response format from DeepSeek (`response_format: {type: "json_object"}`)
- Graceful `_fallback()` path when DeepSeek is unconfigured or unreachable

## Unreleased

Nothing committed yet beyond the skeleton. Outstanding items tracked in [TODO.md](./TODO.md). Top of the list: **first Render deploy** — the `render.yaml` exists but has never been connected.
