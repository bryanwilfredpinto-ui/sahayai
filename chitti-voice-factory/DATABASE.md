# Database — Chitti Voice Factory

**Engine:** SQLite, single file.
**Path (prod):** `/tmp/chitti_voice_factory.sqlite` (configurable via `VOICE_FACTORY_DB`).
**Path (dev default):** `./chitti_voice_factory.sqlite`.
**Driver:** `sqlite3` (Python standard library). WAL journal mode. Module-level `threading.Lock` around every connection because gunicorn runs 2 workers and writes must serialise.

Schema lives in [`backend/ledger.py`](backend/ledger.py) — `init_db()` runs at app start via `create_app()`.

There are **five tables**: the original two from Phase 1 (`synthesis_log`,
`donor_consents`) plus three added in Phase 2 (`voice_submissions`,
`voice_winners`, `voice_synthesis_map`).

---

## 1. `synthesis_log` (Phase 1)

Every TTS attempt — success or failure — gets a row. The source of truth for
`available:true` in `/api/voice/status`. **Raw user text is never stored** —
only its sha256 + char count.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `language_code` | TEXT NOT NULL | ISO code from [`languages.py`](backend/languages.py) |
| `supplier` | TEXT NOT NULL | `on_device` \| `bhashini` \| `mock_bhashini` \| `ai4bharat` \| `sarvam` \| `none` |
| `text_sha256` | TEXT NOT NULL | sha256 of the input text |
| `text_chars` | INTEGER NOT NULL | length of the input text |
| `bytes_out` | INTEGER NULL | bytes of audio produced (`0` if client-side directive, `NULL` on failure) |
| `latency_ms` | INTEGER NULL | wall-clock latency of the supplier call |
| `ok` | INTEGER NOT NULL | `1` success, `0` failure |
| `error_code` | TEXT NULL | short token if `ok=0` |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

**Indexes:**
- `ix_log_lang_time ON (language_code, created_at)`

**Honest-status query** (`ledger.status_for`):

```sql
SELECT supplier, latency_ms, created_at
FROM synthesis_log
WHERE language_code = ?
  AND ok = 1
  AND latency_ms IS NOT NULL
  AND created_at >= ?  -- now - 24 hours
ORDER BY id DESC
LIMIT 1
```

A language is `available:true` if and only if this query returns a row. Spec §5.

---

## 2. `donor_consents` (Phase 1)

The original Phase-1 donor table. Currently unused by the runtime — the
Phase-2 flow writes to `voice_submissions` + `voice_winners` instead. Left in
place because the Phase-9 public-attribution `/api/voice/donate` flow is
designed to populate this table (audio-proof consent + revocation TTL).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | |
| `donor_handle` | TEXT NOT NULL | public attribution name |
| `language_code` | TEXT NOT NULL | |
| `consent_text_sha256` | TEXT NOT NULL | sha256 of the consent statement read aloud |
| `audio_proof_url` | TEXT NOT NULL | URL where the consent recording lives |
| `recorded_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `revoked_at` | TIMESTAMP NULL | non-null if donor revoked; spec §11.5 — removal in 24 h |

---

## 3. `voice_submissions` (Phase 2)

Every Stage-1 submission from [`../voice_donor.html`](../voice_donor.html).
Written by `POST /api/voice/submit`. Submissions can be discarded by the
admin — only `voice_winners` is permanent.

| Column | Type | Notes |
|---|---|---|
| `submission_id` | TEXT PRIMARY KEY | uuid4 string |
| `language_code` | TEXT NOT NULL | |
| `donor_name` | TEXT NOT NULL | for attribution |
| `donor_email` | TEXT NOT NULL | for winner-confirmation email (Stage 2) |
| `donor_phone` | TEXT NULL | optional |
| `audio_sha256` | TEXT NOT NULL | sha256 of the raw audio bytes |
| `audio_duration_s` | REAL NOT NULL | rough estimate (bytes / 48000) — replace with real PCM probe in Phase 9 |
| `audio_storage_url` | TEXT NULL | TeraBox / MEGA URL — today a deterministic mock string until storage stubs are real |
| `consent_stage1_accepted_at` | TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP | Stage-1 timestamp |
| `is_winner` | INTEGER DEFAULT 0 | flipped to `1` by `confirm_winner` |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

**Indexes:**
- `ix_submissions_lang ON (language_code, is_winner, created_at DESC)`

---

## 4. `voice_winners` (Phase 2)

The **permanent** Hall of Fame. `can_delete=0` — never overwritten, never
deleted. Spec §11.4 / §11.6.

| Column | Type | Notes |
|---|---|---|
| `winner_id` | TEXT PRIMARY KEY | uuid4 string |
| `submission_id` | TEXT NOT NULL UNIQUE | FK → `voice_submissions.submission_id` |
| `language_code` | TEXT NOT NULL | |
| `donor_name` | TEXT NOT NULL | denormalised from submission for public Hall of Fame |
| `donor_email` | TEXT NOT NULL | retained for legal/contact, never in public response |
| `donor_photo_url` | TEXT NULL | shown on Hall of Fame card |
| `audio_storage_url` | TEXT NOT NULL | URL the supplier will fetch when serving this voice |
| `audio_sha256` | TEXT NOT NULL | sha256 of the winning recording |
| `consent_stage2_accepted_at` | TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP | Stage-2 admin confirmation timestamp |
| `can_delete` | INTEGER DEFAULT 0 | **always `0`** by design. Spec §11.6. |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

**Indexes:**
- `ix_winners_lang ON (language_code, created_at DESC)`

**Foreign keys:**
- `submission_id` REFERENCES `voice_submissions(submission_id)`

---

## 5. `voice_synthesis_map` (Phase 2)

Per-language pointer. Tells the (future) `WinnerVoiceSupplier` which
recording to serve for which language. Upserted on `confirm_winner`.

| Column | Type | Notes |
|---|---|---|
| `language_code` | TEXT PRIMARY KEY | |
| `supplier_type` | TEXT NOT NULL | currently always `"winner_voice"`, room for `"bhashini"` / `"on_device"` overrides |
| `winner_id` | TEXT NULL | FK → `voice_winners.winner_id` when `supplier_type="winner_voice"` |
| `updated_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

**Foreign keys:**
- `winner_id` REFERENCES `voice_winners(winner_id)`

---

## 6. ER summary

```
synthesis_log              (audit log — no FK)
donor_consents             (Phase-1 public attribution — unused today)

voice_submissions  ──┐
   submission_id    │
                    ▼
              voice_winners
                  winner_id
                    │
                    ▼
        voice_synthesis_map
            language_code  (PK)
```

---

## 7. Operational notes

- **Render free tier resets `/tmp/` on every deploy.** Until the SQLite file
  moves to a mounted disk (or Postgres), every restart wipes the ledger and
  every Hall of Fame winner. Do **not** confirm a real winner on prod until
  storage is durable. See [`TODO.md`](TODO.md) §5.
- **Bootstrap.** `ledger.init_db()` uses `CREATE TABLE IF NOT EXISTS`, so it
  is idempotent and safe to re-run.
- **Concurrency.** Every write is wrapped in `_LOCK + _conn()`. SQLite WAL
  mode allows concurrent reads alongside one writer. Two gunicorn workers
  share the file; the lock is in-process per worker, so the only real
  concurrency cost is the disk-level WAL on the OS.
- **Anonymisation.** `text_sha256` + `audio_sha256` are the audit primitives.
  Raw text never enters the DB. Raw audio bytes only enter the DB indirectly
  via `audio_sha256` and `audio_storage_url` (the bytes themselves live in
  TeraBox / MEGA, not SQLite).
