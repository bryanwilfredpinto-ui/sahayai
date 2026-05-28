# SALES_BRIEF — Chitti Voice Factory

For investors, partner Chitti product owners, and accessibility funders.

## What this product is, in one sentence

> The shared, honestly-audited voice substrate for every Chitti product —
> 26 Indian languages, four-supplier cascade, community-donated Hall of
> Fame voices, never silent about what it cannot do.

## 10 pain points it solves

1. **Existing TTS dialects are wrong for Indians.** Off-the-shelf "Hindi"
   voices sound like American callers reading transliterated Devanagari —
   not like anyone's actual mother tongue.
2. **Sanskrit, Bhojpuri, and Maithili voices are missing entirely** from
   most commercial TTS catalogues, including big-cloud Indian offerings.
3. **ElevenLabs is too expensive at PWD-scale.** Sub-paise-per-character
   commercial TTS is fine for podcasts; it is unaffordable for a free
   accessibility service serving blind users across 26 languages.
4. **Donor-voice consent UX is clunky elsewhere.** Most platforms bury
   consent in a EULA. Chitti Voice Factory makes it three explicit
   checkboxes plus an irreversible Stage-3 confirmation.
5. **Existing TTS quietly substitutes Hindi for Tulu / Oraon / Kodava.**
   Tier C users get silently mocked. Voice Factory returns 503 + donor
   link instead.
6. **Doordarshan / AIR scraping is the lazy path** other startups have
   already tried and lost in court. Voice Factory's legal-only corpus
   policy keeps us off the takedown list.
7. **No service tells you which supplier actually answered.** Voice
   Factory carries a `supplier` field and a spoken disclaimer on every
   response.
8. **No service distinguishes "we have a model" from "we have a
   model that worked in the last 24 h."** Voice Factory's honest-status
   SQL grounds `available:true` in a real recent success.
9. **Phone-keyboard-bound Mute users cannot navigate dense apps.** Voice
   Factory makes voice-in a shared dependency the moment STT lands
   (Phase 9), removing the need for every Chitti product to roll its own.
10. **Every other Chitti would otherwise re-implement TTS five times
    over.** One substrate, one ledger, one consent flow.

## 10 benefits it delivers

1. **26 Indian languages** including Sanskrit (sa), Bhojpuri (bho), Bodo
   (brx), Konkani (kok), Santhali (sat), Manipuri (mni) — and an honest
   donor pathway for Tulu, Kodava, Oraon.
2. **Tier-aware fallback** that never lies. Tier C never silently becomes
   Tier A.
3. **Free at point of use** for Tier A/B today via `mock_bhashini` →
   real Bhashini once ULCA approves.
4. **One env-var flip to go live.** Set three ULCA vars on Railway and
   real Bhashini takes over — no code change, no redeploy logic.
5. **Permanent Hall of Fame.** Native-speaker donors get a page that
   never goes down (`can_delete=0`).
6. **Honest audit ledger.** Every TTS call logged with supplier, latency,
   and `text_sha256` — never the raw text.
7. **Privacy-preserving by construction.** No raw text in DB; donor
   email/phone never in public responses.
8. **OAuth-gated admin.** GitHub or Google, allowlisted emails only —
   no DIY auth surface.
9. **CORS-locked.** Three origins by default; the substrate is not a
   public TTS-as-a-service for arbitrary callers.
10. **Voice-first across the entire Chitti family** — meaning every
    product gets the four-user accessibility contract for free, the day
    they integrate.

## Differentiators vs. alternatives

| Alternative | Why Voice Factory wins |
|---|---|
| ElevenLabs | unaffordable per-char cost at PWD scale; English-trained voices for Indian languages |
| Google / Azure cloud TTS | dialect coverage is shallow; no Bhojpuri / Tulu / Oraon; SaaS lock-in |
| Sarvam direct | excellent quality but commercial; we use it as **last** fallback only |
| Direct Bhashini integration in every product | each Chitti would re-implement the cascade, ledger, and donor consent; we centralise |

## What is still incomplete (do not over-promise)

- Storage uploads to TeraBox / MEGA are stubbed.
- Real Bhashini awaits ULCA credentials.
- STT (voice IN) does not exist yet.
- The winner-voice cascade is not wired into `/api/voice/speak`.

See [`DEVILS_ADVOCATE.md`](DEVILS_ADVOCATE.md) and
[`../TODO.md`](../TODO.md).
