# Chitti CA — Changelog

Sourced from `git log --oneline -- chitti-ca/` on the main branch.

## 2026-05-09 — Initial release

- **`db18427`** feat(chitti): Voice Factory (26 langs) + CA + Legal + Logo&Video

  Initial commit of the `chitti-ca/` folder as part of the larger "three new products plus shared Voice Factory" shipment. Contents:

  - Flask app skeleton ([backend/main.py](backend/main.py), [backend/config.py](backend/config.py))
  - `/api/ca/health` and `/api/ca/ask` endpoints ([backend/routes/ca.py](backend/routes/ca.py))
  - DeepSeek-backed service with server-enforced disclaimer ([backend/services/ca_service.py](backend/services/ca_service.py))
  - 12-language reply map (en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur)
  - System prompt (`CHITTI_CA_PROMPT`) covering ITR / GST / TDS / 80-series deductions / 44AD-44ADA / notice reading, with explicit "never give a binding number" guardrails
  - Render blueprint ([render.yaml](render.yaml)) targeting the `chitti-ca-api` web service on the free plan
  - Pinned runtime `python-3.11.10` and dependency set (flask, flask-cors, gunicorn, httpx)

  This is currently the **only commit** touching the `chitti-ca/` path. All behaviour documented in [API.md](API.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [PROMPTS.md](PROMPTS.md) was introduced here.
