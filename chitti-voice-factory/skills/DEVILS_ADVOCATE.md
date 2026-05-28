# DEVILS_ADVOCATE — Chitti Voice Factory

Eight honest critiques. Each one identifies a place where the codebase
or the rollout story is weaker than the marketing.

## 1. Storage is a lie today — submission audio is never uploaded

[`../backend/routes/voice.py:244`](../backend/routes/voice.py) — there is
a `# TODO: Upload to TeraBox/MEGA`. `submit_voice` allocates a
deterministic mock URL of the form
`https://chitti-internal/submissions/<uuid>` and writes it to
`voice_submissions.audio_storage_url` without ever calling
`storage_service.upload_audio_blob`. The audio bytes are dropped after
the sha256 is computed. Every submission row therefore points at an
unreachable URL. Until [`../TODO.md`](../TODO.md) §2.1 is closed, the
Hall of Fame pipeline is half-real.

## 2. `_OAUTH_STATE_CACHE` GC bug — expired states never clear

[`../backend/services/admin_auth.py:48`](../backend/services/admin_auth.py)
— `validate_oauth_state` reassigns `_OAUTH_STATE_CACHE` to a filtered
dict **without** a `global` declaration. The assignment binds a local;
the module-level dict keeps growing. In a long-lived gunicorn worker,
this is a slow memory leak and means stale states linger past their TTL.
Fix in [`../TODO.md`](../TODO.md) §2.5.

## 3. Tier C is mock-only until ULCA approves us

[`../backend/suppliers/mock_bhashini.py`](../backend/suppliers/mock_bhashini.py)
honestly refuses Tier C. [`../backend/suppliers/bhashini.py`](../backend/suppliers/bhashini.py)
is wired but disabled until `BHASHINI_USER_ID` + `BHASHINI_API_KEY` +
`BHASHINI_INFERENCE_KEY` land. Today every Tier B language that Bhashini
*claims* to support (Bhojpuri, Bodo, Manipuri, Santhali, Sanskrit) is
actually being served by the browser's Web Speech API via
`mock_bhashini`. Web Speech does not even *list* most of these voices —
many devices silently fall back to a default voice. We call it
`mock_bhashini`, which is honest, but the practical user experience is
"English-American accent reading Devanagari text" on a lot of phones.

## 4. The winner-voice cascade is not actually wired

[`../backend/router.py`](../backend/router.py) does not consult
`voice_synthesis_map`. The admin can confirm a winner, the Hall of Fame
page can show the photo and play the audio file directly, but
`POST /api/voice/speak` for that language still walks the generic
supplier cascade. The Phase-2 promise ("the winner becomes the synthesis
voice for that language across every Chitti") is therefore *partly*
true — the recording exists; the cascade has not yet been taught to use
it. [`../TODO.md`](../TODO.md) §2.2.

## 5. `/tmp` storage on Railway free tier is destructive

[`../DATABASE.md`](../DATABASE.md) §7 — the SQLite file lives at
`/tmp/chitti_voice_factory.sqlite` and Railway's free tier resets `/tmp/`
on every deploy. The first time we confirm a real winner on production
and Railway redeploys, the row vanishes. Spec §11.6 promises permanence;
the storage layer cannot keep that promise yet. Migrate to a mounted
disk or Postgres **before** the first real winner is confirmed.

## 6. Admin route opens the DB by hard-coded path

[`../backend/routes/admin.py:96`](../backend/routes/admin.py) calls
`sqlite3.connect("./chitti_voice_factory.sqlite")` directly, bypassing
`ledger.py` and ignoring the `VOICE_FACTORY_DB` env var. On Railway this
points at the wrong location. The query happens to fail closed (empty
result), but it's silently looking at the wrong file. Fix in
[`../TODO.md`](../TODO.md) §2.6.

## 7. No STT yet — half the four-user contract is unfulfilled

The product is currently **TTS only**. The Mute and Illiterate users in
the four-user contract need *voice IN*, which means STT. There is no
`Supplier.synthesize_to_text` method, no `transcription_log` table, no
ASR cascade. Every Chitti that needs voice-in (Vaani, MedUPI photo
queries) is using the browser's Web Speech recognition directly, with
none of Voice Factory's audit / consent / honesty guarantees.
[`../TODO.md`](../TODO.md) §3.3.

## 8. `COUSIN_12` actually has 14 entries

[`../backend/languages.py`](../backend/languages.py) declares
`COUSIN_12` but the list literal contains 14 languages (the original 11
Tier B + Sanskrit + Tulu + Kodava + Oraon). The math `PRIMARY_12 +
COUSIN_12 = 26` only works because the variable name is historical.
Cosmetic, but it confuses anyone reading the source for the first time.
[`../TODO.md`](../TODO.md) §3.4.
