🎖️ **World Class Chitti Voice Factory — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Voice Factory — Standard Operating Procedure

## Objective
Free, swappable voice substrate (STT + TTS) for every Chitti — 26 langs (12 primary + 14 cousin, including Sanskrit & Oraon) — with community-donated voices replacing Bhashini over time.

## Primary User
**B2B internal** — every other Chitti backend, plus voice donors (the community contributing voice samples).

## Success Metric
(a) STT / TTS uptime per language (honest ledger) · (b) community voice-donation count + Hall of Fame growth · (c) % langs migrated from `mock_bhashini` → real Bhashini → community voices.

## Quality Standard
- **Tier C never silently falls back** — *"not supported in this language"* surfaces honestly (e.g. Tulu never morphs into Kannada)
- 4-supplier cascade ledger logs every call with success/fail
- Lazy-import optional deps (sentence-transformers, torch, faiss, pymupdf, youtube-transcript-api) so Railway free tier stays OOM-safe
- Fluency endpoints return `503 fluency_pipeline_not_installed` honestly when optional deps absent
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **Tier C honest failure.** When Tier C supplier fails, surface *"not supported in this language"* in user's language — NEVER silently morph Tulu from Kannada.
2. **Honest ledger every call.** Success or fail, every supplier call logged with timestamp + supplier + lang + latency. No silent fallbacks.
3. **Pluggable at one URL.** `window.Chitti.a11y.VOICE_FACTORY_URL` is the contract. No Chitti hard-codes Bhashini.
4. **Lazy imports.** Optional deps (torch, faiss, etc.) loaded on demand only. Railway free tier must not OOM.
5. **Honest 503 on missing fluency deps.** NEVER fake the corpus.
6. **Community voice quality gate.** Donor sample crosses quality threshold before entering cascade. Expired consent → voice withdrawn.
7. **Golden Rule on every action.** Donor submissions, consent re-affirms, voice withdrawals — all confirm before fire.

## Error Handling
- mock_bhashini fail → cascade to real Bhashini (Phase 2, blocked) → 3rd-party → community
- All suppliers fail for a language → return honest *"voice service unavailable for [lang], please type"*
- Optional deps absent → fluency endpoints return `503 fluency_pipeline_not_installed`
- OOM during build → split requirements (already done in commit f5f3f3a)

## Escalation to CTO
- Any supplier sustained > 5% fail rate in honest ledger over 24h
- Railway build OOM (optional deps creeping back into `requirements.txt`)
- Donor consent expiry sweep misses (annual cadence)
- New language cousin added without phonetic model
- Bhashini Phase 2 unblocks (Sire's ULCA registration) — wire real supplier

## Stale Data Rule
Phonetic models per language refreshed quarterly. YouTube transcripts re-fetched only on explicit user request (never silent re-pull). Donor consent re-affirmed annually; expired consent → voice withdrawn from cascade.

## Evolution Owner
[chitti-voice-factory/skills/FEATURES.md](skills/FEATURES.md) + community voice donations + spec at [CHITTI_VOICE_FACTORY_MASTER_SPEC.md](../CHITTI_VOICE_FACTORY_MASTER_SPEC.md). Phase 2 (real Bhashini) blocked on Sire's ULCA registration.

---

> **World Class Chitti Voice Factory — Commando Discipline. Zero Excuses.**
