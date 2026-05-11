# Changelog — Chitti Voice Factory

All notable changes to the voice substrate. Most recent first.

The Voice Factory has two commits in `git log` against `chitti-voice-factory/`,
plus two commits touching the user-facing voice-donor HTMLs at repo root. They
correspond to the two build phases delivered so far.

---

## Phase 2 — Community Voice Contest + Hall of Fame · 2026-05-10

**Commit:** `c91cb76` — *feat(chitti-voice-factory): Phase 2 — Community Voice Contest + Hall of Fame*

The product pivots from a pure 4-supplier technical cascade to a
**community-driven voice sourcing** model layered on top of that cascade.
Real Indian native speakers donate their voice and become the permanent
Hall of Fame voice for their language.

### New features

- **Voice Submissions** — two-stage consent flow (recording + irreversible confirmation).
- **Hall of Fame** — public page with donor attribution, scrollable card grid grouped by language.
- **Admin dashboard** — OAuth-gated panel (GitHub or Google) to review submissions and confirm winners.
- **Permanent voice locking** — winners are stored with `can_delete=0` and never overwritten.
- **No silent fallback** for non-Bhashini / non-AI4Bharat languages — they show a "donor contest required" banner instead of a wrong-language synthesised voice.

### Files added

| File | Purpose |
|---|---|
| [`backend/config.py`](backend/config.py) | OAuth + storage Settings dataclass |
| [`backend/routes/admin.py`](backend/routes/admin.py) | OAuth start/callback + admin endpoints |
| [`backend/services/admin_auth.py`](backend/services/admin_auth.py) | GitHub + Google OAuth exchange |
| [`backend/services/storage_service.py`](backend/services/storage_service.py) | TeraBox + MEGA upload stubs |
| [`../chitti_voice_hall_of_fame.html`](../chitti_voice_hall_of_fame.html) | Public Hall of Fame UI |
| [`../voice_donor.html`](../voice_donor.html) | 3-stage recording consent flow |
| [`../voice_confirmation.html`](../voice_confirmation.html) | Post-submission timeline page |
| [`admin/dashboard.html`](admin/dashboard.html) | Admin sidebar UI |

### Database schema extended

`ledger.py` gained three new tables:

- `voice_submissions` — recordings + stage-1 consent
- `voice_winners` — permanent Hall of Fame, `can_delete=0`
- `voice_synthesis_map` — language → supplier_type + winner_id pointer

See [`DATABASE.md`](DATABASE.md).

### Routes added

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/voice/submit` | Record voice + donor info |
| `GET` | `/api/voice/hall-of-fame` | Public winners list |
| `GET` | `/admin/oauth/start` | OAuth flow start (GitHub or Google) |
| `GET` | `/admin/oauth/callback` | OAuth callback handler |
| `GET` | `/admin/submissions` | List submissions (admin only) |
| `GET` | `/admin/submissions/<id>` | Submission detail (admin only) |
| `POST` | `/admin/submissions/<id>/confirm-winner` | Stage 2 winner confirmation (admin only) |
| `GET` | `/admin/winners` | List winners (admin only) |
| `GET` | `/admin/voice-synthesis-map` | Current per-language mapping (admin only) |

### Storage config (ENV)

```
STORAGE_PROVIDER=terabox|mega
TERABOX_API_KEY
MEGA_EMAIL · MEGA_PASSWORD
ADMIN_OAUTH_PROVIDER=github|google
ADMIN_OAUTH_ID · ADMIN_OAUTH_SECRET · ADMIN_EMAILS
```

### Stats

`13 files changed, 1569 insertions(+), 1 deletion(-)`

---

## Phase 1 — Initial substrate · 2026-05-09

**Commit:** `db18427` — *feat(chitti): Voice Factory (26 langs) + CA + Legal + Logo&Video*

The first commit. Shipped the full skeleton-first surface: backend, language
registry, ledger, four-supplier cascade, mock supplier, public status
dashboard, and the master specification document.

### Highlights from the commit body

> Voice Factory: shared multi-language voice substrate. 26 languages
> covered by the new `CHITTI_VOICE_FACTORY_MASTER_SPEC.md`. Generator
> regenerates all 26 `chitti_<lang>.html` front doors. Public ledger UI
> at `chitti_voice_factory.html`. Voice Factory runs in mock mode until
> ULCA Bhashini credentials arrive (`VOICE_FACTORY_USE_MOCK_BHASHINI=1`).

### Files added

| File | Lines |
|---|---|
| [`../CHITTI_VOICE_FACTORY_MASTER_SPEC.md`](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md) | 357 |
| [`README.md`](README.md) | 68 |
| [`backend/languages.py`](backend/languages.py) | 67 |
| [`backend/ledger.py`](backend/ledger.py) | 164 |
| [`backend/main.py`](backend/main.py) | 52 |
| [`backend/requirements.txt`](backend/requirements.txt) | 4 |
| [`backend/router.py`](backend/router.py) | 78 |
| [`backend/routes/voice.py`](backend/routes/voice.py) | 180 |
| [`backend/runtime.txt`](backend/runtime.txt) | 1 |
| [`backend/suppliers/base.py`](backend/suppliers/base.py) | 28 |
| [`backend/suppliers/bhashini.py`](backend/suppliers/bhashini.py) | 122 |
| [`backend/suppliers/sarvam.py`](backend/suppliers/sarvam.py) | 38 |
| [`render.yaml`](render.yaml) | 25 |
| [`tools/generate_lang_pages.py`](tools/generate_lang_pages.py) | 121 |
| [`tools/i18n.json`](tools/i18n.json) | 128 |
| [`tools/template.html`](tools/template.html) | 175 |
| [`../chitti_voice_factory.html`](../chitti_voice_factory.html) | 176 |

(Note: `suppliers/mock_bhashini.py`, `suppliers/ai4bharat.py`,
`suppliers/on_device.py` were added in this same commit even though the
truncated `git show --stat` excerpt only lists a subset — all four supplier
files exist from Phase 1.)

### Decisions baked in at Phase 1

- **No fake data.** `available:true` only from a real `synthesis_log` row.
- **No scraping.** Doordarshan / AIR / YouTube forbidden.
- **Mock supplier is named `mock_bhashini`,** never silently labelled `bhashini`.
- **Tier C never silently falls back.** Tulu, Kodava, Oraon get a donor banner.
- **Every audio response includes a disclaimer** naming the supplier.

These rules are restated in spec §11 and enforced in `routes/voice.py` +
`router.py` + every supplier.

---

## Spec versions

| Version | Date | Status |
|---|---|---|
| `1.0` | 2026-05-09 | Current — living document at [`../CHITTI_VOICE_FACTORY_MASTER_SPEC.md`](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md) |

The spec is the source of truth. Every Claude session that touches voice
must read it first (recorded under
`project_chitti_voice_factory_spec.md` in the user's auto-memory).

---

## Unreleased / next phases

From spec §10 build phases and current TODOs:

- **Phase 6** — wire real Bhashini supplier once ULCA credentials are issued. `VOICE_FACTORY_USE_MOCK_BHASHINI=0` flips it live.
- **Phase 7** — AI4Bharat IndicTTS / IndicParler-TTS wrapper for Tier B.
- **Phase 8** — Sarvam paid fallback, rate-limited 100 chars/req.
- **Phase 9** — full donor-flow wiring including real TeraBox / MEGA upload (currently mocked).
- **Phase 10** — on-device quantised IndicTTS via `onnxruntime-web`, IndexedDB cache.
- **Hall-of-Fame audio playback** — wire `voice_synthesis_map` → `winner_voice` into the cascade so the actual winner's recording plays for that language.
- **Hall-of-Fame moderation** — auto-rejection rules (SNR, duration), reporting flow, abuse-removal procedure.

See [`TODO.md`](TODO.md) for the full list.
