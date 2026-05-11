# Changelog

Phase-grouped commit history for `chitti-medupi/` from `git log --oneline --reverse`. Includes commits to the workspace-root `chitti_medupi.html` mirror and the master spec where they shipped real product changes.

---

## Phase 1 — Genesis (v1.4 skeleton)

| Commit | Title |
|---|---|
| `13c3b99` | feat(medupi): Chitti MedUPI v1.4 — master spec + frontend skeleton + backend stubs |

The big-bang first commit. Brought up:
- New `chitti-medupi/` folder mirroring `chitti-shares/`
- 51-row seed JSON across paracetamol / antidiabetics / antihypertensives / antibiotics / statins / antacids / thyroid / antiplatelets / NSAIDs / antihistamines / vitamins / asthma / insulin
- 25-row Jan Aushadhi seed across 12 states
- Insurance coverage seed (Ayushman / CGHS / ESI)
- SQLAlchemy models: Medicine · JanAushadhiStore · FamilyProfile · WalletEntry · Reminder
- Services: database · pricing · risk · alternatives · jan_aushadhi · recognition · family · reminders · insurance
- 14 endpoints under `/api/medupi/*` with light `X-User-Token` auth
- Frontend wired (Scan / Compare / Family Wallet / Reminders / Jan Aushadhi / Insurance / Learn / Settings)

---

## Phase 2 — v1.7 automated price updates (2026-05-07)

| Commit | Title |
|---|---|
| `be88be2` | feat(medupi): v1.7 — automated price update system |
| `0ee7a9f` | chore(medupi): add v1.7 env vars to render.yaml blueprint |

Brought the scheduler online:
- APScheduler `BackgroundScheduler` mode · 4 cron jobs (monthly Jan Aushadhi · weekly NPPA · daily top-100 Brave · daily cache evict)
- Brave Search snippet-only live pharmacy prices (ALLOWED_DOMAINS list · 24h cache · rupee regex)
- Community-reported price model + sanity bounds + median/IQR + by-city stats
- Search-frequency log to drive the top-100 refresh
- Price-freshness engine — official Jan Aushadhi 🏥 · NPPA shield 🛡️ · branded "Last updated X days ago" 💊⚠️❗ · community 👥
- New tables: `price_cache` · `community_prices` · `search_log` · `loader_runs`
- New columns: `medicines.price_source` · `medicines.updated_at`
- Idempotent migration runner (`medupi_migrations.run_all()`)
- Kaggle bulk loader (A-Z Medicine Dataset of India · ~250k rows)
- Auto-update wrappers `auto_jan_aushadhi()` · `auto_nppa()` invoked by scheduler

---

## Phase 3 — Demo mode + UX polish (2026-05-08)

| Commit | Title |
|---|---|
| `2e0cc45` | feat(medupi): Demo Mode — 8-step guided walk-through (4-user contract) |

Eight-step guided walk-through with EN/HI narration. Four-user contract honoured at every step (Blind narration · Deaf banner · Mute Next/Skip · Illiterate visible UI moves). Sample Crocin 650 result + freshness pills + fake wallet stats + sample JA stores — all rendered without API calls.

---

## Phase 4 — Render build battle (2026-05-08, all same day)

| Commit | Title |
|---|---|
| `51caebc` | fix(medupi): pin rapidfuzz to 3.6.1 for Render build |
| `a8ee499` | fix(medupi): wheel-only install + pin pydantic stack for Render free tier |
| `ed4d9f9` | fix(medupi): drop --only-binary + use pydantic 2.5.2 paired with pydantic-core 2.14.5 |
| `854bafc` | fix(medupi): drop to pydantic v1 — eliminates Rust dep entirely |
| `9b55dac` | refactor(medupi): swap FastAPI/pydantic/httpx for Flask/requests · zero Rust deps |
| `9beed1f` | fix(medupi): pin Python 3.11 + bump psycopg2-binary to 2.9.10 |

The Render free-tier slim image lacks Rust + cmake → pydantic-core can never compile from source. After four attempts to wrestle pydantic into shape, we **dropped the entire FastAPI/pydantic/httpx stack** and moved to **Flask + flask-cors + gunicorn + requests**. All 22 endpoints carried over identically — same shape, same response keys, frontend wiring unchanged.

---

## Phase 5 — Schema isolation + DB migration (2026-05-08 → 2026-05-09)

| Commit | Title |
|---|---|
| `3509b9d` | refactor(medupi): isolate all tables under `medupi` schema · share chitti-shares-db |
| `5dc82dd` | refactor(db): switch both backends to Supabase · isolate under shares/medupi schemas |

Both backends moved to a shared Supabase Postgres host. `models/_schema.py` introduced — Postgres → `medupi` schema, SQLite → flat (no schemas). Cross-schema FKs via `fk_target()` helper. `database.ensure_schema()` runs `CREATE SCHEMA IF NOT EXISTS medupi` on every boot.

---

## Phase 6 — Apollo 259k-row loader (2026-05-09)

| Commit | Title |
|---|---|
| `622fc50` | docs(medupi): add missing Kaggle entry to scripts/README.md |
| `971191b` | feat(medupi): standalone loader for Apollo Pharmacy 259k-row CSV |
| `7808ad5` | fix(medupi): redact DB password from loader log output |
| `098bc08` | feat(medupi): loader reads .env + supports DB_HOST/USER/PASSWORD kwargs |
| `7bbca5f` | fix(medupi): harden Apollo loader for cloud-pooler quirks |

Standalone [`scripts/load_apollo_oneshot.py`](backend/scripts/load_apollo_oneshot.py) — psycopg2 only, no backend imports. Auto-bootstraps `medupi` schema + `medicines` table + the `uniq_medicines_lower_bsf` unique constraint. Reads `.env` via stdlib parser. TCP keepalives + reconnect-on-drop for Neon pooler. Dedup-within-batch on `(brand, strength, form)`. **Successful run: 211,207 rows in `medupi.medicines` on Neon** (213k upserted from 259k seen, 46k skipped for missing fields, 0 errors, 0 reconnects, ~41 min wall time).

---

## Phase 7 — QR + cross-product nav + Phase 7 P1 + agentic /ask (2026-05-09 → 2026-05-10)

| Commit | Title |
|---|---|
| `ce0335e` | feat(medupi): QR scanner (Scan tab) + shareable QR (Settings tab) |
| `3ee1de1` | feat(p1): agentic priority-1 endpoints across all three Chitti products |
| `f45850e` | docs(skills): SKILL.md trio + CHITTI_FUNDAMENTALS_MASTER_SPEC |
| `b0dff16` | feat(medupi-ui): wire family-wallet preview + Ayushman insurance chip |
| `aa293d1` | feat(nav): cross-product 📰 News button on all sister pages + MedUPI spec §13 supplement |
| `175b5f7` | docs(specs): refresh Technical + MedUPI master specs for Phase 7 + /ask |

- **QR scanner** — 4th button in Scan tab. Decodes the CDSCO traceability QR / GS1 Datamatrix on Indian medicine packs (since 2023). jsQR (~50KB CDN). Three handler paths: GS1 string, URL, plain text.
- **Share QR** — Settings tab card encoding `https://sahayai.in/chitti_medupi.html`. qrcode-generator (~10KB CDN). Copy-link + Save-as-PNG. Bharat-realistic for community health camps + clinics + gram panchayat notice boards.
- **Phase 7 P1** — cart-simulator · family-wallet preview · insurance-match chip · Jan Aushadhi stock endpoint · agentic `/api/medupi/ask` with DeepSeek tool-calling (currently blocked on HTTP 402 — top-up pending).
- **Cross-product nav** — Chitti News added to all sister pages' headers. MedUPI now has Technical · Fundamentals · News switch chips.

---

## Phase 8 — Neon-only + global accessibility (2026-05-10 → 2026-05-11)

| Commit | Title |
|---|---|
| `313bb2e` | fix(medupi): Neon-only DATABASE_URL; drop Supabase + DB_HOST fallback |
| `e26fd86` | feat(a11y): 🔊 on every new section + global 🎤 Talk-to-Chitti FAB |
| `ec68056` | feat(a11y): auto-inject 🔊 on every existing card too — not just new ones |
| `fc17c6c` | feat(meter): per-utterance + per-day DeepSeek cost visible in the UI |
| `b540a8c` | feat(nav): expose Vaani · UPI Guard · Scanner from existing pages |

- **Neon as the single source of truth** — Supabase + DB_HOST fallback dropped. `DATABASE_URL` is the only configured connection. Closes the "two-DBs gap" from §13 of the master spec — live API serves Apollo's 211k rows.
- **Global accessibility wave** — `🔊` button auto-injected on every card (new and pre-existing) + global `🎤 Talk-to-Chitti` floating-action button. Four-user contract enforced across the page, not just per-feature.
- **DeepSeek cost meter** — per-utterance + per-day spend visible in the UI for the agentic `/ask` flow.

---

## Total commits to `chitti-medupi/` so far

`git log --oneline -- chitti-medupi/` returns **19 commits** (folder-scoped). Including the workspace-root `chitti_medupi.html` mirror and master-spec changes brings the medupi-tagged history to **28 commits**.
