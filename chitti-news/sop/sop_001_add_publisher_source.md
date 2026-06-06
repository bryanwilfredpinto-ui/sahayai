# SOP-001 — Onboard a New Publisher Source

> World Class CNOS — Commando Discipline. Zero Excuses.

Mechanical procedure for adding a new RSS / JSON publisher to the CNOS source registry without breaking idempotency, trust, or the per-(state×lang×cat) coverage SLA.

---

## Profile

| | |
|---|---|
| Owner | News Agent ([`swarm/`](../swarm/)) + source maintainer |
| Cadence | On demand — whenever a coverage gap (SOP-004) names a thin cell, or a publisher is requested |
| Trigger | New publisher candidate identified (manual request OR `coverage_sla_check.py` flags a thin state×lang×cat cell) |
| Escalation | No public RSS exists → escalate app-API capture (mitmproxy) to Sire; never ship a translate-and-relabel feed |

---

## Steps

1. **Discover the feed.** Run [`scripts/publisher_discovery.py`](../backend/scripts/publisher_discovery.py) against the publisher domain (`probe_domain` tries `/feed`, `/rss`, then `_discover_via_html` for `<link rel="alternate">`). Confirm a real RSS/Atom URL — never invent one.
2. **Cloudscraper fallback test.** Verify the URL fetches through the two-stage path: `requests` first, then `cloudscraper` impersonation. In `publisher_discovery.py` this is `_try_http` → `_try_cloudscraper`; in production it is [`news_ingest._http_get`](../backend/services/news_ingest.py). If only cloudscraper succeeds, record `fetcher=cloudscraper` so ingest knows.
3. **Confirm parse shape.** For RSS, confirm `_is_rss` passes on the body/content-type. For JSON publishers, confirm the `_dotget` field paths (title/link/published/body) resolve via `_fetch_source_json`. A feed that fetches but does not parse is NOT onboarded.
4. **Seed the trust score.** Run [`scripts/compute_publisher_trust.py`](../backend/scripts/compute_publisher_trust.py) to compute the publisher's seed trust score; do not hand-assign. New publishers start at the computed value, never a flattering default.
5. **Tag the cell.** Record `(state, language, category)` the publisher serves so it maps to the coverage matrix. A publisher with no declared cell cannot close a coverage gap.
6. **UPSERT into `sources.json`.** Add the row (rss_url, name, lang, state, category, trust, fetcher) to [`backend/data/sources.json`](../backend/data/sources.json). Use [`scripts/merge_discovered_sources.py`](../backend/scripts/merge_discovered_sources.py) to merge discovery output — it dedupes on URL so a re-run does not double-insert.
7. **Idempotent re-seed.** Run [`services/news_seed.py`](../backend/services/news_seed.py). It is idempotent — it checks row count and short-circuits if non-empty, and `_HEALTH_COLUMNS` are ALTER-added if missing. Re-seeding must NOT duplicate the publisher; confirm row count delta = exactly the new publishers.
8. **Live fetch + verify.** Trigger `fetch_source` (or `fetch_all`) and confirm articles land in `news.articles` with `last_success_at` set and `status=healthy`. A 0-article first fetch = investigate before declaring done.
9. **Coverage SLA re-check.** Re-run [`scripts/coverage_sla_check.py`](../backend/scripts/coverage_sla_check.py). Confirm the previously-thin cell is now ≥ per-cell minimum (default 5/24h). If still thin, the gap is real — return to SOP-004.

---

## Hard rules

- NEVER seed a publisher whose feed only "fetches" but does not parse — a green HTTP 200 is not coverage.
- NEVER hand-assign a flattering trust score; trust is computed, auditable, and downgradeable.
- NEVER translate-and-relabel another language's feed to fake vernacular coverage — that violates the Founder Rule (Truth > Virality).
- Re-seed must be idempotent: running `news_seed.py` twice yields the same registry.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
