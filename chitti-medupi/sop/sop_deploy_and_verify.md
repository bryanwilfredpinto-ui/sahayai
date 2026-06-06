CEOS Level 7 — SOP: Deploy & Verify
Authored 2026-06-06

# SOP — Deploy MedUPI + verify before handover

**Trigger:** any backend change, a swarm skill update merge, or a catalog/price
refresh that needs to reach production.

**Non-negotiable (MEMORY):** never say "live" without curling the production
endpoint first. Sire should never be the one to find it broken.

**Backing:** `chitti-medupi/render.yaml` + Railway deploy ·
`https://chitti-medupi-api-production.up.railway.app/health` ·
backend boot order `ensure_schema → create_all → migrate → seed → scheduler`.

---

## Deploy
1. Branch off `main` (never commit straight to the default branch).
2. Confirm `runtime.txt` pins a Railway-compatible Python (3.11) and
   `requirements.txt` is intact (Flask · SQLAlchemy · APScheduler · rapidfuzz).
3. Deploy to Railway (`chitti-medupi-api-production`). Backend self-bootstraps the
   `medupi.*` schema, seeds if empty, and starts the APScheduler jobs.

## Verify — health + smoke (curl before handover)
```bash
# 1. Health
curl https://chitti-medupi-api-production.up.railway.app/health

# 2. Strict-match smoke (brand → same-composition alternatives + risk + disclaimer)
curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/medicine/Crocin%20650'

# 3. Jan Aushadhi geo (nearest Kendra, 5→25km auto-expand)
curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/jan_aushadhi?lat=23.26&lng=77.41'

# 4. Risk band
curl 'https://chitti-medupi-api-production.up.railway.app/api/medupi/risk/Metformin'
```

## Verify — Turso/DB write-read roundtrip
A read-only health check passes even when writes are silently failing (the
embedded-replica bug that lost writes fleet-wide — MEMORY). So verify a **real
write then read**:
1. POST a family profile (or wallet entry) for a throwaway `user_token`.
2. GET it back; confirm the row returned matches what was written.
3. Delete the throwaway row.

If the write disappears, the DB layer is broken (check the direct-HTTPS Turso
shim `lib/turso_http.py`) — **do not hand over.**

## Verify — sample suite (the safety gate)
Run the strict-match regression and confirm
`tools/test_medupi_samples_result.json` is **25/25 PASS,
`zero_cross_molecule_leakage` true on every row**. A failure here blocks handover
(see [sop_incident_wrong_match.md](sop_incident_wrong_match.md)).

## Verify — five frontend gates (QUALITY_STATUS §1a)
Confirm `chitti_medupi.html` still inherits all five via `chitti_a11y.js`:
feedback-widget.js + `data-chitti-response` · chitti_a11y.js · Disability Profile
prompt · language auto-detect · ISL plugin. Plus the sticky amber disclaimer banner.

## Hard rules — non-negotiable
- **Curl production before saying "live".**
- **A read-only /health pass is not enough** — prove a write round-trips.
- **25/25 zero-leakage or no handover.**
- **Branch, don't push to `main` directly.** Commit/push only when Sire asks.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
