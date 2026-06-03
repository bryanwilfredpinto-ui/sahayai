# Chitti News Operating System (CNOS) — PRODUCT VISION

> *"My job is to give you the news that matters to you, in your language, in your state, in your time — without selling you outrage."*

---

## The vision in one line

CNOS is **News + Verification + Context + Impact + Action Plan** — the four things every story should answer that no Indian aggregator does.

## What every CNOS article answers

| Question | How CNOS answers |
|---|---|
| **What happened?** | Publisher's verbatim headline + body; never re-written |
| **Why does it matter?** | Context Agent supplies the 1-line stake (per [swarm/CONTEXT_AGENT.md](swarm/CONTEXT_AGENT.md)) |
| **Who is affected?** | Personalization Agent surfaces if you, by state/language/profession, are in the affected set |
| **What happens next?** | Action Agent's 1-sentence "what to watch for" |
| **Should I care?** | The reader's own 👍/👎 + saved/cancelled state drive the For You ranking |

If a story cannot answer any of these five, it does not get promoted to the top of the feed. It still appears in the latest-by-source view — but the home + For You surface is reserved for stories that pass all 5.

---

## The 10-year picture

CNOS becomes the **default morning news ritual for every Indian household that wants signal over noise** — the operating system, not just an app.

| | World-class state |
|---|---|
| Publisher coverage | 200+ across 22 Indian languages |
| Vernacular depth | ≥10 publishers per Indian-state official language |
| Trust signal latency | Trust Strip visible in <2 s per card |
| Fact-check verdict latency | p50 < 6 hours from publish to verdict |
| State-awareness | State-first ordering on every state-category combo |
| Honest empty state | Coverage payload narrates every gap |
| Voice-first | Every story playable end-to-end via Voice Factory; blind-user auto-read on first visit |
| Privacy | For You + Read Later + Cancelled run in localStorage only; never on backend |

---

## The 5 strategic moats

1. **Multi-language NATIVE (not translated).** Cloudscraper-fallback ingest for Cloudflare-protected regional publishers (Saamana, Prajavani, Rozana Spokesman) is a 12-month engineering investment.
2. **State-aware routing.** State-first ordering with `coverage` payload narrating gaps. No US aggregator does this.
3. **Trust Strip on every card.** Verified · ≥2-source corroboration · publisher trust · reading time — in <2s.
4. **7-agent swarm.** News → Verification → Context → Personalization → Accessibility → Career → Action — per story, deterministic where possible, with explainability per agent.
5. **Per-device For You.** Algorithm in browser. No tracking. Moat against Google/Meta data-extraction aggregators.

---

## Founder rules (locked)

> **Trust > Engagement · Truth > Virality · Context > Clicks · Learning > Doomscrolling**

Plus a CNOS-specific:

> **Never auto-play. Never hide reading time. Never re-write a headline.**

---

## What we will never be

| Anti-vision | Why we reject |
|---|---|
| A push-notification machine | Chitti PA owns morning brief; we supply data |
| Editorial product | Publisher's stance is the publisher's; we link, not opine |
| Paywall | Free, forever, no exception |
| Clickbait engine | Headlines come from publishers verbatim |
| Personalised in the dark-pattern sense | For You opt-in, transparent, in-browser |
| US product translated | Bengali is not Hindi-with-Latin-script |

---

## The three north-star metrics

| Metric | Target at world-class |
|---|---|
| **Vernacular completion rate** (user picks Marathi → gets ≥10 mr stories per category) | ≥ 0.95 for every Indian state's official language |
| **Trust score** (per-card user survey: "Did this come from a real source?") | ≥ 0.95 |
| **Time-to-informed** (user opens → reads 3 "Chitti's Take" bullets → feels caught up) | < 90 seconds |

---

## What "phase 2" looks like

| Phase 2 feature | Why |
|---|---|
| 200+ publisher coverage | Tier-3 city coverage (Marathwada / Kongu Nadu / Bundelkhand / Rayalaseema) |
| Per-story TTS pre-warm | Voice Factory pre-generates audio for top stories per language |
| Native Android push | Chitti PA morning brief at 07:00 IST |
| Per-publisher trust score auto-weekly | Quality decay → low-trust publishers auto-deprioritised |
| Daily reading budget | "You have 12 minutes; here are 3 stories that fit" |
| Federated fact-check across publishers | Multi-source claim verification |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
