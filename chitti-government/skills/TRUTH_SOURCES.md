# TRUTH SOURCES — Chitti Government

Every fact Chitti speaks traces back to one of these. Nothing else.

## 1. PIB RSS — 10 feeds, every 6 hours

Press Information Bureau public RSS (English + Hindi). Polled by `services/government_pib.py` with a real User-Agent. Items are deduped by GUID, filtered for scheme-relevant keywords, and stored in `government.pib_announcements`. Exposed at `/api/government/alerts`. Headlines quoted **verbatim** — Chitti never rewrites a PIB headline.

Why RSS: no key, no GST gate, public XML. The four-user contract is honoured because freshness is observable at `/api/government/freshness`.

## 2. MyScheme.gov.in catalog

The 30-row seed in [`../backend/data/schemes_seed.json`](../backend/data/schemes_seed.json) is curated from MyScheme entries. No public scrape API exists; the planned nightly sitemap-driven refresh is item 3 in [`../TODO.md`](../TODO.md). For now, the catalog grows only by manual seed edits + redeploy.

Every scheme row carries: `slug`, `name`, `name_hi`, `ministry`, `category`, `state` (or "central"), `benefit_summary_en`, `benefit_summary_hi`, `source_url`, `helpline`, `status_check_url` (nullable), and a predicate JSON for the rule engine.

## 3. DigiLocker partner API — pending

Not integrated in v1. Partner registration is open (GST / incorporation certificate already filed). Until it lands, the Documents tab uses a local-only file picker + a deep-link to `digilocker.gov.in`. The backend already accepts up to 8 MB uploads (`MAX_CONTENT_LENGTH` in `main.py`) so when the partner key drops the only change is replacing the local picker with a fetch call. See [`../TODO.md`](../TODO.md) item 1.

## 4. Nominatim — locator

OpenStreetMap's Nominatim is the geocoder for the Nearby Office tab (`services/government_locator.py`). 1 req/s policy honoured via a 250 ms server-side sleep. Office kinds: CSC, post office, Aadhaar Seva Kendra, ration / FPS, Jan Aushadhi, panchayat, bank, police. Google Maps deep-link is the fallback when Nominatim is unreachable.

## What is NOT a truth source

DeepSeek. The LLM phrases the verdict — it cannot generate scheme facts, helpline numbers, or rupee amounts. See [`./GUARDRAILS.md`](./GUARDRAILS.md).
