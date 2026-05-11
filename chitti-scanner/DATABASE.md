# Database — Chitti Product Scanner

**N/A — Chitti Product Scanner is intentionally stateless.** Every scan is a single in-memory HTTP fan-out to DeepSeek; the backend writes nothing to disk or to any database, and the only persistence is a 20-row `localStorage` ring buffer (`chitti_scanner_history`) that lives entirely in the user's browser.

## Why no DB

1. **Privacy posture.** The product handles labels that may carry Aadhaar / PAN / VPA / medical brand information. A database is the easiest place for that PII to leak; not having one means there is nothing to leak.
2. **No multi-request flows.** A scan is one shot. There is no session, no draft state, no "resume later" — so no need for persistence.
3. **Operational simplicity.** The Render service is a single web dyno with `--workers 2 --timeout 90`. No managed Postgres, no migrations, no schema versioning.

## What about the in-browser history?

`localStorage.chitti_scanner_history` stores up to 20 rows of:

```json
{ "type": "medicine", "summary": "...", "ts": 1715472000000, "lang": "hi" }
```

That is not a server-side database — it is per-device, user-clearable from the "Clear history" header button, and never transmitted anywhere.

## What about future state?

If a future feature (e.g., reusable saved scans, family-shared lists) requires server-side persistence, it must be designed against the privacy posture in [CONTEXT.md](./CONTEXT.md). At minimum: PII redaction at write time, encryption at rest, and explicit user consent that survives the existing T&C modal.

For now: no models, no migrations, no ORM, no `models/` folder.
