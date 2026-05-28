# OBSERVABILITY — Chitti Product Scanner

Privacy-first observability: Chitti measures what it can without ever logging the user's document.

## 1. Anonymised request log

Per request, log only:

| Field | Example | Notes |
|---|---|---|
| `ts` | `2026-05-12T08:15:42Z` | ISO-8601 UTC |
| `route` | `/api/scanner/analyze/text` | No path params |
| `branch` | `text` / `image` | Which arm of `/analyze` fired |
| `language` | `hi` | Echoed from request |
| `bytes_in` | `412` | Body size only — never the body |
| `status` | `200` / `413` / `500` | HTTP status |
| `latency_ms` | `1820` | End-to-end |
| `source` | `deepseek` / `deepseek_vision` / `fallback` / `fallback_no_vision` | Where the response came from |
| `type_detected` | `medicine` | The enum returned by the model after `_normalise()` |
| `client_ip_hash` | first 8 hex of `sha256(ip + daily_salt)` | For rate-limit triage only; un-reversible |

**Never logged:** `text` body, image bytes, full IP, Aadhaar / PAN strings, the model's `summary` / `facts` content.

## 2. Vision-vs-text path mix

Aggregate from `source`:

- `% deepseek` (text path)
- `% deepseek_vision` (image path, will be 0% until vision flips on)
- `% fallback` (DeepSeek down / unconfigured)
- `% fallback_no_vision` (image submitted while `DEEPSEEK_VISION_MODEL="off"`)

A sudden spike in `fallback_no_vision` means users are tapping the camera button and getting a degraded response — a UX signal that vision must be turned on.

## 3. Disclaimer-injection audit

Periodic sample (e.g., 1-in-1000 responses, post-`_normalise()`) asserting:

- `legal_disclaimer` is the **verbatim** string from `LEGAL_BY_TYPE[type]` (see [../PROMPTS.md](../PROMPTS.md)).
- `legal_disclaimer` is non-empty.
- `type` is in the validated enum (`other` is the safe fallback).

Any mismatch is a P0 incident — the server-enforcement contract has regressed.

## 4. UptimeRobot — once deployed

Five-minute poll of:

- `GET /health` → expect `{"ok": true}`.
- `GET /api/scanner/health` → expect `deepseek_configured: true` and `vision_model` matching the env.

Alerts route to Bryan; the founder dashboard at `sahayai.in/founder` mirrors the green/red.

## 5. What Scanner does NOT measure

- No per-user analytics. No cookie. No session id. No funnel.
- No "scans per user per day" — there is no user-id concept server-side.
- No image-quality histogram (would require storing exemplars).
- No model-output sampling beyond the disclaimer audit (would require storing summaries).

## 6. Observability state today

Per [../TODO.md](../TODO.md) and workspace memory `project_render_deploy_status_2026_05_10.md`, Scanner is **not yet on Railway**. No live observability exists. The instrumentation above is the day-one wiring for whoever pushes the Railway connect button.
