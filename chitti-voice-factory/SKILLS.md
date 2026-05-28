🎖️ **World Class Chitti Voice Factory — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Voice Factory — Skills

> Free, swappable voice substrate (STT + TTS) for every Chitti — 26 langs (12 primary + 14 cousin, including Sanskrit & Oraon) — with community-donated voices replacing Bhashini over time.

---

## The 4 Users I Serve

Voice Factory is **B2B internal substrate** — its direct users are other Chittis. But the 4-user contract is served *through* Voice Factory:

| User | How Voice Factory enables their Chitti to serve them |
|------|--------------------------------------------------------|
| 👁️ Blind | Every Chitti response read aloud via TTS in user's language |
| 🦻 Deaf | Voice Factory is not used by deaf flow; ISL panel substitutes |
| 🤫 Mute | STT bypassed for mute users (handled at Chitti UI layer) |
| 📖 Illiterate | TTS reads everything aloud in 26 langs incl. regional |

---

## Features

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | 26 languages — 12 primary + 14 cousin (Sanskrit, Oraon, Tulu, etc.) | ✅ | CTO | 2026-05-12 |
| 2 | 4-supplier cascade — mock_bhashini → real Bhashini → 3rd-party → community | ✅ | CTO | 2026-05-12 |
| 3 | Honest ledger — every supplier call logged with success/fail | ✅ | CTO | 2026-05-12 |
| 4 | Tier C NEVER silently falls back (e.g. Tulu never morphs into Kannada) | ✅ | CTO | 2026-05-12 |
| 5 | mock_bhashini active (Phase 1 / 1.5) | ✅ | CTO | 2026-05-12 |
| 6 | Real Bhashini Phase 2 — blocked on Sire's ULCA registration | ⬜ | — | — |
| 7 | YouTube fluency pipeline — 10 vids/lang cap | ✅ | CTO | 2026-05-12 |
| 8 | Voice Hall of Fame for community contributors | ✅ | CTO | 2026-05-13 |
| 9 | Lazy-import optional deps (sentence-transformers / torch / faiss / pymupdf / youtube-transcript-api) | ✅ | CTO | 2026-05-15 |
| 10 | Railway free tier OOM-safe (commit f5f3f3a) | ✅ | CTO | 2026-05-15 |
| 11 | `503 fluency_pipeline_not_installed` when optional deps absent | ✅ | CTO | 2026-05-15 |
| 12 | Pluggable at `window.Chitti.a11y.VOICE_FACTORY_URL` | ✅ | CTO | 2026-05-12 |
| 13 | 26 language landing pages (`chitti_hi.html` … `chitti_kru.html`) | ✅ | CTO | 2026-05-12 |
| 14 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ | CTO | 2026-05-27 |
| 15 | Golden Rule confirm gate on every side-effecting action | ✅ | CTO | 2026-05-23 |
| 16 | 26 language pages batch-cert (currently 🟡 unverified) | ⬜ | — | — |
| 17 | Textbook + Wikipedia corpus across 26 langs (79,414 chunks, 55 PDFs) | ✅ | CTO | 2026-05-12 |
| 18 | Donor consent lifecycle (annual re-affirm; expired → voice withdrawn) | ✅ | CTO | 2026-05-12 |
| 19 | Phonetic models per language (quarterly refresh) | ✅ | CTO | 2026-05-12 |
| 20 | Community voice donation flow — Hall of Fame surface | ✅ | CTO | 2026-05-13 |

---

## Indian User Support

- Every other Chitti backend (B2B internal)
- Voice donors contributing language samples
- Deaf flow does NOT use Voice Factory — substitutes with ISL panel

## Language Support — 26 total

| Tier | Languages |
|------|-----------|
| Primary (12) | `hi · en · ta · te · bn · mr · gu · kn · ml · or · as · pa` |
| Cousin (14) | `ur · bho · hne · mai · kok · doi · sd · ks · mni · brx · sat · sa · tcy · kfa · kru` |

## Mandatory 5-element widget on every response box

🔊 Speaker · 🤖 Chitti icon · 👍👎 Thumbs · ✏️🎙️ Pencil+Mic · 🌐 Language selector — verified live on `chitti_voice_factory.html` per [CERT_LOG.md](../CERT_LOG.md). 26 language pages 🟡 substrate-inherited, per-page cert run queued.

## Commando Standard

- Tier C NEVER silently falls back — surfaces *"not supported in this language"* honestly
- Lazy-import optional deps to keep Railway free tier OOM-safe
- Architecturally pluggable at ONE URL — no Chitti hard-codes Bhashini
- NEVER claim a community voice that hasn't crossed the quality threshold
- Phonetic models per language refreshed quarterly
- YouTube transcripts re-fetched only on explicit user request (never silent re-pull)
- Donor consent re-affirmed annually; expired consent → voice withdrawn from cascade

---

> **World Class Chitti Voice Factory — Commando Discipline. Zero Excuses.**
