# DEVIL'S ADVOCATE — Chitti Government

Eight critiques an honest reviewer would land before declaring v1 "done". Each is open in [`../TODO.md`](../TODO.md) or in the spec's "Future ramp" section.

## 1. The catalog is thin

30 schemes seeded against a universe of 2,300+ on MyScheme.gov.in. That is **1.3 percent** of the universe. A user from Tripura or Mizoram may search and find zero state-specific rows. MyScheme nightly refresh is item 3 in [`../TODO.md`](../TODO.md) but not yet built.

## 2. DigiLocker not integrated

Partner registration is gated to GST-registered / incorporated entities and takes weeks. v1 ships an `<input type="file">` local picker and a deep-link to `digilocker.gov.in`. The user still has to upload manually — the four-user contract takes a hit for illiterate / low-vision users who cannot navigate DigiLocker's English-heavy UI alone.

## 3. DeepSeek fallback handles only 30 schemes

When `DEEPSEEK_API_KEY` is missing the `_fallback_reply()` path produces a deterministic English/Hindi reply — but the rule engine driving it knows only the 30 seeded rows. A user asking about scheme #31 gets `unknown` regardless of model availability.

## 4. No public status API

PM-Kisan / PMAY / PMJAY / MGNREGA do not expose a public status endpoint. The Track Status tab is an honest deep-link handoff. The user still needs to type their registration number or Aadhaar into the government portal — Chitti cannot read it back.

## 5. APScheduler per-worker duplication

Two gunicorn workers means two `pib_poll` runs every 6 h. Idempotent (GUID dedupe) but wasteful. [`../TODO.md`](../TODO.md) item 7.

## 6. Document expiry sweep is browser-only

`localStorage` notifications fire only when the tab is open. The nightly server-side sweep slot exists in the scheduler but is unwired (no opt-in channel, no WhatsApp / Gupshup integration yet).

## 7. Hindi-by-default toggle has gaps

Static English labels in `chitti_government.html` haven't been audited end-to-end. [`../TODO.md`](../TODO.md) item 6.

## 8. CSC locator falls back to Google Maps

Nominatim's 1 req/s policy is honoured (250 ms server sleep) but coverage of CSC centres is patchy. data.gov.in CSC ingest is open in [`../TODO.md`](../TODO.md) item 4.
