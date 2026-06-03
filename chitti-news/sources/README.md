# CNOS — Sources

Per-publisher registry. **Real, free, public, attributed.**

---

## Live state (2026-06-04)

| | Count |
|---|---:|
| Total publishers in registry | **296** |
| Active (live RSS / app-API) | live count via `/api/news/sources` |
| Cloudflare-protected (cloudscraper fallback) | Saamana · Prajavani · Rozana Spokesman + more |
| Per-language depth | en 53 · hi 18 · ml 11 · ta 8 · te 7 · pa 7 · mr 6 · or 5 · bn 5 · kn 4 · ur 3 · gu 3 |

---

## Per-language SLA (the gate)

Per Indian-state-official language: **≥ 10 publishers** required for world-class.

| Lang | Now | Target | Gap |
|---|---:|---:|---:|
| en | 53 | 10 | ✅ |
| hi | 18 | 10 | ✅ |
| ml | 11 | 10 | ✅ |
| ta | 8 | 10 | ⚠️ |
| te | 7 | 10 | ⚠️ |
| pa | 7 | 10 | ⚠️ |
| mr | 6 | 10 | ⚠️ |
| or | 5 | 10 | 🔴 |
| bn | 5 | 10 | 🔴 |
| kn | 4 | 10 | 🔴 |
| ur | 3 | 10 | 🔴 |
| gu | 3 | 10 | 🔴 (app-API only — Sandesh / Divya Bhaskar pending mitmproxy capture) |

---

## How a new source lands

1. Discovery — RSS feed sniff (WordPress `/feed`, `<link rel="alternate">` discovery, cloudscraper for Cloudflare)
2. Allow-list check — domain on approved list per [`backend/data/sources.json`](../backend/data/sources.json)
3. Trust score seed — default 0.0; updated weekly based on factcheck verdicts
4. Per-language assignment — explicit `language` field
5. Per-state assignment — explicit `state` field (for state-routed sources)
6. UPSERT into Turso `news.sources` table (idempotent)

---

## Source-registry endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/news/sources` | live publisher list (296 today) |
| `POST /api/news/admin/sources/upsert` | (admin) add / update a source |
| `POST /api/news/admin/reclassify` | (admin) re-run content classifier across all articles |

---

## App-API capture pattern (for publishers with no RSS)

For Gujarati publishers Sandesh / Divya Bhaskar / ABP Asmita / VTV (no public RSS):
1. Sire captures app API via mitmproxy
2. Drops URL into [`backend/data/sources.json`](../backend/data/sources.json) with `json+` prefix
3. Creates per-slug config at [`backend/data/json_configs/<slug>.json`](../backend/data/json_configs/)
4. Next ingest poll picks it up; no schema migration

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
