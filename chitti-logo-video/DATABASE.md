# DATABASE — Chitti Logo & Video

## N/A — this service is stateless

There is **no database**, **no ORM**, **no `models/` directory**, **no schema migrations**, and **no persistent file storage** in `chitti-logo-video/`. `pip list` (per [`backend/requirements.txt`](backend/requirements.txt)) ships only `flask`, `flask-cors`, and `gunicorn` — no `psycopg2`, no `sqlalchemy`, no `pymongo`, no `redis-py`.

### What stands in for persistence today

| Concern | Where it lives | Lifetime |
|---|---|---|
| Logo SVGs | Generated inline per request in [`backend/services/logo_service.py`](backend/services/logo_service.py) `_mock_svg()`. Returned in the JSON body. Frontend re-downloads as `Blob` for the user. | Request-scoped. Never stored server-side. |
| Video jobs | In-process module-level `_JOBS: dict[str, _Job]` guarded by `_LOCK: threading.Lock` in [`backend/services/video_service.py`](backend/services/video_service.py). | Per-gunicorn-worker. Lost on restart. Not shared across the 2 workers. |
| Video "rendered output" | A `data:image/svg+xml,...` URL synthesised on-demand by `_placeholder_url(job_id)`. | Self-contained in the URL — no storage. |
| User accounts / sessions / history | — | None. The product is fully anonymous; no sign-up surface. |
| Generation counts / usage telemetry | — | None. Render's request log is the only audit trail. |

### Why stateless is the right call for v1

- Free-tier Render web service has no included DB plan; provisioning Postgres = paying.
- The product is anonymous, so there's no user to attach data to.
- SVG payloads are small enough (~1–3 KB) to ship inline.
- The video stub's mock URL is a `data:` URL — also self-contained.
- "Honest stub" means we don't pretend to persist anything we don't.

### When persistence is needed (future state)

Triggers that flip this to N/A → "needs a DB":

1. **Real video output (MP4 ≥ 1 MB)** — must go to object storage (R2/S3), and we need a job-id → URL mapping survivable across workers and restarts → Redis or Postgres.
2. **Auth / saved generations** — once Chitti-wide auth ships, "my brand assets" wants a user → asset mapping.
3. **Usage analytics for the founder dashboard** — counters per palette, per style, per language → time-series store (or just append-only to Postgres).
4. **Cross-worker job queue** — even before MP4s land, scaling beyond 2 gunicorn workers makes the in-process dict unsafe → Redis-backed queue.

These are tracked in [TODO.md](TODO.md) §21–24 and §9.

### Schema (zero tables)

```sql
-- Intentionally blank. No tables exist.
```
