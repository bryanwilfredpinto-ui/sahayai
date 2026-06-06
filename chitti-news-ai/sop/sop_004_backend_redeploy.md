# SOP-004 — Backend Redeploy

> Standard Operating Procedure for redeploying the Chitti News AI backend.
> Railway git push → APScheduler boot → boot_ingest → /health check.
> Target: < 90 seconds from push to "GREEN /health".

---

## When to invoke

- Code change to `chitti-news-ai/backend/**` merged to `main`.
- Data change to `chitti-news-ai/data/*.json` (catalog, registry, salary bands).
- Env var change in Railway dashboard (e.g. rotating DEEPSEEK_API_KEY).
- Manual restart needed (rare — only after a runaway memory event).

---

## Step 0 — Pre-flight

Verify locally:

```bash
cd chitti-news-ai/backend
python -m pytest tests/ -v             # all GREEN
python -m flask --app main.py run --port 5005  # boots without error
curl http://localhost:5005/health     # 200 OK
```

If any test is RED, do NOT push. Fix locally.

---

## Step 1 — Git push

```bash
cd chitti-news-ai
git status                  # confirm only intended files staged
git diff --staged           # eyeball the change
git commit -m "feat(chitti-news-ai): <one-line> "
git push origin main
```

Railway watches `main` branch via the repo's `chitti-news-ai/railway.json` config. Push triggers a build.

---

## Step 2 — Railway build

What happens automatically:

1. Railway pulls latest commit.
2. Nixpacks builds the Python image:
   - Reads `runtime.txt` for Python version pin.
   - Installs `requirements.txt`.
   - Honors `Procfile` for the entrypoint.
3. Image is pushed to Railway's registry.
4. Old instance receives SIGTERM; new instance starts.

Build duration: ~ 45-60 seconds on average. Watch logs:

```bash
railway logs --service chitti-news-ai
```

---

## Step 3 — APScheduler boot

When the new instance starts, `backend/main.py` boot sequence runs:

1. SQLAlchemy `create_engine(creator=turso_http.connect)` per the Turso direct-HTTPS shim contract.
2. APScheduler starts with 3 jobs registered:
   - `rss_poll` (every 30 min).
   - `classify_sweep` (after each rss_poll).
   - `streams_refresh` (hourly).
3. Flask app binds to `$PORT`.

A successful boot logs:

```
[boot] db_engine=turso_http connected_to=<host>
[boot] apscheduler started: 3 jobs
[boot] flask listening on :$PORT
```

If any step fails, the process exits non-zero; Railway auto-rolls back to the prior healthy image. Verify with `railway logs`.

---

## Step 4 — boot_ingest

The first `rss_poll` cycle is triggered IMMEDIATELY on boot (not after the 30-min delay). This is the `boot_ingest` contract — fresh deploys should not serve stale data.

Watch:

```
[rss_poll] BOOT cycle starting
[rss_poll] source=anthropic-blog fetched=3 new=0 dupes=3
[rss_poll] source=openai-blog fetched=2 new=0 dupes=2
...
[rss_poll] BOOT cycle complete; 0 new, 18 dupes (deploy data fresh)
[classify_sweep] no unclassified articles; skipping
[streams_refresh] cycle complete
```

For a real new-data deploy (typical), boot_ingest pulls 5-15 new articles within 30 seconds.

---

## Step 5 — /health check

After boot, hit `/health`:

```bash
curl https://chitti-news-ai-production-*.up.railway.app/health
```

Expected response:

```json
{
  "status": "GREEN",
  "uptime_seconds": 12,
  "db": "GREEN",
  "scheduler": "GREEN",
  "sources": {
    "anthropic-blog":  { "status": "GREEN", "last_ok": "2026-06-06T07:00:01Z" },
    "openai-blog":     { "status": "GREEN", "last_ok": "2026-06-06T07:00:01Z" },
    "google-ai-blog":  { "status": "YELLOW", "last_error": "timeout" },
    "mit-tech-review": { "status": "GREEN" },
    "indianexpress-ai":{ "status": "GREEN" },
    "inc42":           { "status": "GREEN" },
    "skill-india":     { "status": "YELLOW", "note": "honest stub" },
    "nptel":           { "status": "YELLOW", "note": "honest stub" }
  },
  "version": "v1.1.<commit>"
}
```

GREEN on `status` AND `db` AND `scheduler` = deploy successful.

YELLOW on individual sources is acceptable (1-2 sources can be down without blocking).

RED on `status` or `db` or `scheduler` = deploy FAILED. Investigate logs immediately.

---

## Step 6 — Smoke test the user path

Quick verification:

```bash
# News feed
curl 'https://chitti-news-ai-production-*.up.railway.app/api/news-ai/feed/news?profession=software-developer&lang=en' | head -100

# Trust strip
curl 'https://chitti-news-ai-production-*.up.railway.app/api/news-ai/feed/news?profession=accountant&lang=en' | grep trust_strip

# Frontend page
curl -I https://chitti-news-ai-production-*.up.railway.app/
```

All should be HTTP 200 with non-empty JSON.

---

## Failure modes

| Failure | Recovery |
|---|---|
| Build fails (requirements / runtime mismatch) | Railway keeps prior image live. Fix locally; re-push. No user impact. |
| Boot fails (Turso connection / env var missing) | Railway auto-rolls back. No user impact. Check env vars; re-push. |
| `boot_ingest` fails (all RSS sources down) | Backend stays up; serves cached articles; logs RED. |
| `/health` shows YELLOW > 30 min | chitti-founder Layer 1 self-ping cron emails Sire. Investigate. |
| `/health` shows RED | chitti-founder Layer 1 self-ping cron emails Sire immediately. Investigate. |

---

## Rollback

```bash
railway rollback --service chitti-news-ai
```

This reverts to the last GREEN deploy. Useful when a code change passes CI but breaks production.

---

## Manual restart (last resort)

```bash
railway restart --service chitti-news-ai
```

Use only when the process is wedged (e.g. memory leak, runaway scheduler thread). Do NOT use as a substitute for fixing bugs.

---

## Cross-references

- [`../observability/logs.md`](../observability/logs.md) — what log lines to expect.
- [`../observability/metrics.md`](../observability/metrics.md) — what metrics start emitting post-deploy.
- [`./sop_003_classifier_rule_update.md`](./sop_003_classifier_rule_update.md) — for classifier-only changes (uses this SOP for the deploy step).
- [`../../SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md) Layer 1 self-ping contract.

---

Last reviewed: 2026-06-06
