# Chitti News — PRODUCT VISION

> *"My job is to give you the news that matters to you, in your language, in your state, in your time — without selling you outrage."*

---

## The user we serve

An Indian reader — a mother in Pune who reads Marathi, a college student in Coimbatore who switches between Tamil and English, a farmer in Vidarbha who only watches voice-driven news, a senior citizen in Kolkata who wants Bengali politics with a clear "verified" badge — opens Chitti News and gets:

1. Their state's stories first
2. Their language's stories without falling back to English
3. A "verified" badge they can trust
4. A 3-bullet "Chitti's Take" so they don't waste 10 minutes per article
5. The publisher's name and link, always

## The problem we solve

Indian news consumption today is broken:

- **Doom-scroll feeds** optimise for outrage clicks, not understanding
- **English-first aggregators** treat vernacular as second-class (1-3 publishers per Indian language)
- **No fact-check layer** — a regional headline goes viral before anyone checks it
- **No state-awareness** — a Maharashtra user gets national + Delhi news; their own state ranks below celebrity gossip
- **No reading-time honesty** — 1500-word articles look identical to 200-word briefs
- **No "Chitti's Take"** — every story demands the reader's full attention

We fix every one of these.

## The 10-year picture

When this product matures, **Chitti News is the default morning news ritual for every Indian household that wants signal over noise** — the equivalent of how AIR/Doordarshan was for an earlier generation, except always-on, multi-language, state-aware, fact-checked.

## What we will be when we are world-class

| | World-class state |
|---|---|
| **Publisher coverage** | 200+ Indian publishers across 22 languages (currently 50+ across 10) |
| **Language coverage** | ≥10 publishers per language for every Indian state's official languages |
| **Trust signal** | Every story carries: verification badge · ≥2-source corroboration · publisher trust score · reading time |
| **State awareness** | Reader's state's stories surface first across all categories; `coverage` payload narrates gaps honestly |
| **Fact-check latency** | < 6 hours from publish to verdict (verified / partial / disputed / unverified) |
| **Honest empty state** | Reader never sees a blank feed — coverage payload tells them what's available and how to pivot |
| **Voice-first** | Every story playable end-to-end via Voice Factory; auto-read on first visit for blind users |
| **Privacy** | For You algorithm runs in localStorage only; never sent to backend |

## What we will never be

- A push-notification machine. The morning brief is for Chitti PA to deliver; we supply the data.
- An editorial product. We link to the publisher; the publisher's stance is theirs.
- A paywall product. Free, forever.
- A clickbait product. Reading time always visible; "Cancelled" folder lets users permanently mute a story.
- A "personalised" feed in the dark-pattern sense. For You is opt-in, transparent, and runs in your browser.
- A US-product translated. Bengali is not Hindi-with-Latin-script; Tamil is not en-IN. We design vernacular-first.

## The three north-star metrics

| Metric | Target at world-class |
|---|---|
| **Vernacular completion rate** (user picks Marathi, gets ≥10 Marathi stories per category) | ≥ 0.95 for every Indian state's official language |
| **Trust score** (per-card user survey: "Did this come from a real source?") | ≥ 0.95 |
| **Time-to-informed** (user opens → reads 3 "Chitti's Take" bullets → feels caught up) | < 90 seconds |

## Strategic moats

1. **Multi-language native, not translated.** Cloudscraper-fallback ingestion for Cloudflare-protected regional publishers (Saamana, Prajavani, Rozana Spokesman, etc.) is a 12-month engineering investment competitors won't match.
2. **State-aware routing.** Most aggregators surface national-first; Chitti surfaces state-first with an honest `coverage` payload. Structural moat.
3. **Trust Strip on every story.** Verified / fact-checked / reading-time badges visible in <2s. Most aggregators don't show this.
4. **Fact-check engine.** Cross-references against ≥2 trusted RSS sources before assigning a verdict. Sub-agents per category (politics / business / sports / etc.) with their own trust thresholds.
5. **"Chitti's Take"** — extractive 3-bullet summary in user's language. Inspired by CNA Singapore FAST button. Few aggregators do this; none do it well in Indian languages.
6. **Per-device For You.** Algorithm in browser. No tracking. This is a moat against Google/Meta data-extraction aggregators.

## What "phase 2" looks like

Once v1 ships at world-class quality:

| Phase 2 feature | Why |
|---|---|
| 200+ publisher coverage | Tier-3 city coverage (Marathwada / Kongu Nadu / Bundelkhand / Rayalaseema) — currently underserved |
| Per-story TTS pre-warm | Voice Factory pre-generates audio for top stories per language, so playback is <500ms |
| Native Android push | Chitti PA morning brief at 07:00 IST, voice-first, language-aware |
| Per-publisher trust score (auto-updated weekly) | Quality decay → low-trust publishers auto-deprioritised |
| Reader's "expected reading time" → daily budget | Like Pocket but Indian-first: "You have 12 minutes; here are 3 stories that fit" |
| Federated fact-check across publishers | Multi-source claim verification → reduces single-publisher hoaxes |

## The product principle in one line

> **The news service an Indian reader's mother would build if she had the data — vernacular, state-aware, trustable, never wasting your time.**

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
