# Chitti Government — TODO

Open items pulled from
[`../CHITTI_GOVERNMENT_MASTER_SPEC.md`](../CHITTI_GOVERNMENT_MASTER_SPEC.md)
("Future ramp (post-v1)") and any in-code `TODO`/`FIXME` markers.

---

## P0 — partner registration / API gates

### 1. DigiLocker integration

The Documents tab today is local-upload + DigiLocker deep-link only — the
honest fallback while partner registration is pending.

- [ ] Submit partner application (GST / incorporation certificate already
      filed in Bryan's compliance folder).
- [ ] Sandbox cycle: fetch test Aadhaar / driving licence / 10th + 12th
      mark sheet via the DigiLocker pull-API.
- [ ] Wire the existing `<input type="file">` button to instead call the
      DigiLocker fetch endpoint when a session token is present.
- [ ] Backend already accepts up to 8 MB uploads
      (`MAX_CONTENT_LENGTH = 8 * 1024 * 1024` in [`backend/main.py`](backend/main.py))
      for the eventual DigiLocker XML / PDF reply — no infra rework needed.
- [ ] Add `digilocker_*` columns or a new table to
      [`backend/models/`](backend/models/) once we know what we want to
      persist (current plan: nothing — pass-through to the user device).

**Why partner-only:** DigiLocker production keys are issued to registered
entities only; the API is not a public OAuth surface.

Fast-path alternative — Setu / Signzy aggregator route while waiting for
direct partner status. Bryan to evaluate cost vs revenue path.

---

### 2. Document expiry sweep (server-side reminder)

The expiry tracker currently lives in `localStorage` on the user's
browser. To send notifications without the browser tab being open we'd
need:

- [ ] A consented (opt-in) per-user record of `{document, expires_on,
      notify_channel}` — channel is most likely WhatsApp via Twilio or
      Gupshup, given Bryan's user base.
- [ ] A nightly APScheduler job (slot already exists alongside `pib_poll`
      and `cleanup_old_pib` in
      [`backend/services/government_scheduler.py`](backend/services/government_scheduler.py))
      that scans the table and queues 90 / 30 / 7-day reminders.
- [ ] Hard rule: the channel ID (phone number) is encrypted at rest and
      never returned over the API. Anonymous-by-default is the Chitti
      contract.
- [ ] Add a `document_expiry_reminders` table to [`backend/models/`](backend/models/).
- [ ] Add `POST /api/government/expiry/subscribe` and
      `DELETE /api/government/expiry/<id>` routes.
- [ ] Add `requirements.txt` entries for Twilio / Gupshup SDK once Bryan
      picks the channel.

Note from `requirements.txt`: APScheduler is "drives PIB poll (every 6 h)
+ nightly MyScheme refresh + daily document-expiry sweep" — only the
first job is currently wired.

---

## P1 — catalog scale-out

### 3. MyScheme nightly refresh

Catalog is 30 hand-curated rows. There are ~2,300 schemes on
`myscheme.gov.in`. Goal: a nightly poll that grows the catalog without
ever clobbering a curated row.

- [ ] Sitemap-driven scrape of `myscheme.gov.in` (publicly available).
- [ ] HF dataset for cold-start backfill of the ~2,300-row baseline.
- [ ] Add a new APScheduler job `myscheme_refresh` cron @ 02:00 IST.
- [ ] Update [`backend/services/government_database.py`](backend/services/government_database.py)
      `seed_if_empty` is one-time only — the refresh path must skip the
      30 curated `slug`s and never overwrite them.
- [ ] `is_active` column on `schemes` (already exists) → newly scraped
      rows ship with `is_active=false` until a human reviews them; the
      `/schemes` endpoint already filters `is_active.is_(True)`.

### 4. CSC list ingest from data.gov.in

The locator today is Nominatim-only. The official CSC locator
(`locator.csccloud.in/`) does not expose an API, but
[`data.gov.in`](https://data.gov.in) hosts state-wise CSC lists under a
free API key (no GST gate).

- [ ] Daily/weekly ingest into a `csc_centres` table.
- [ ] Update [`backend/services/government_locator.py`](backend/services/government_locator.py)
      `find_nearby(kind="csc", ...)` to query the table first and only
      fall through to Nominatim when no row is within `radius_km`.

---

## P2 — language coverage

### 5. Bhashini / AI4Bharat handoff for non-EN/HI voice

`_LANG_NAMES` in [`backend/services/government_deepseek.py`](backend/services/government_deepseek.py)
already lists Tamil / Telugu / Bengali / Marathi / Gujarati / Kannada /
Malayalam / Odia / Punjabi / Urdu as prompt-target languages. The voice
substrate is shared with Chitti Voice Factory.

- [ ] Wire the explainer's `language` parameter through to the Voice
      Factory TTS endpoint instead of relying on the device's Web Speech
      synth (which doesn't have good non-EN/HI Indian voices).
- [ ] Keep the rule-engine fallback at parity — `_fallback_reply()` is
      English-only today; needs language switch (or a deferred-translation
      step) so the no-coming-soon rule still holds when DeepSeek is down.

### 6. Frontend Hindi-by-default toggle

The accessibility plugin has a language toggle; the eligibility coach
already takes `language: "hi"` by default. Audit every static string in
[`../chitti_government.html`](../chitti_government.html) for missed
English-only labels.

---

## P3 — operational hardening

### 7. Distributed lock on `pib_poll`

APScheduler runs per-worker. Two gunicorn workers means two `pib_poll`
runs every 6 h. The job is idempotent (GUID dedupe) but we waste outbound
PIB requests. Options:

- [ ] Move to APScheduler `SQLAlchemyJobStore` so workers share state.
- [ ] OR pin scheduler to worker-0 via gunicorn `worker_class` hook
      (matches chitti-medupi's pattern).

### 8. `/freshness` view also includes catalog stats

Right now `/freshness` returns last `IngestLog` rows and the max
`Scheme.last_synced_at`. Add a count-by-state and count-by-category
roll-up so the frontend's freshness footer can warn the user when their
state has too few seeded schemes.

---

## In-code markers

Sole `coming soon` / `TODO` / `FIXME` mention in the codebase:

- [`backend/services/government_locator.py`](backend/services/government_locator.py)
  line 17 — comment "the 'no coming soon' rule" — not a TODO, just
  policy-referencing prose. No outstanding action.

No `TODO:` / `FIXME:` markers in any `.py` file under `chitti-government/backend/`.
