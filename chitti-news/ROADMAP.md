# CNOS — ROADMAP

> *"Honest status on every line. We ship what's real and label what isn't."*

The phased roadmap for the Chitti News Operating System. Each item carries an honest status: ✅ live · 🟡 partial / wired-but-unverified · 🔜 planned.

---

## Phase 1 — Foundation (shipping now)

The trustworthy, accessible, state-aware core.

| Item | Status | Notes |
|---|---|---|
| RSS ingest pipeline (25+ feeds, en + hi) | ✅ live | Regional langs partly stubbed for v1.1 |
| 6 categories (National / State / Sports / Business / Tech / Entertainment) | ✅ live | Emoji glyph on every tab |
| State × language × category routing | ✅ live | State-first ordering; `coverage` payload narrates gaps |
| Trust Strip on every card | ✅ live | Verified · ≥2-source · publisher trust · reading time, <2 s |
| Chitti's Take (DeepSeek 3-bullet summary) | ✅ live | In `[data-chitti-response]`; read aloud + ISL-capable |
| Fact-check verdict (≥2-source cross-reference) | ✅ live | verified / partial / disputed / unverified + rationale |
| For You (per-device ranking) | ✅ live | `localStorage` only; never on backend |
| Read Later folder | ✅ live | 🔖 picture; tap-only save |
| Cancelled folder | ✅ live | 4/4 cert PASS; cancelled never re-appears |
| Four-user accessibility (blind/deaf/mute/illiterate) | 🟡 partial | Core journeys live; auto-read top-3 + ISL per-card cert TODO |
| Politics neutrality guardrail | ✅ live | 0/100 partisan-adjective violations |
| Coverage SLA cron | 🟡 partial | 27/66 cells pass — multi-language gap is the work of Phase 2 |

---

## Phase 2 — Depth + intelligence

Make the swarm complete and the vernacular real.

| Item | Status | Notes |
|---|---|---|
| Career Agent (profession-relevance handoff to CNAIOS) | 🔜 planned | Slot 7 of the swarm; surfaces "this matters for your work" |
| Action Agent ("what to watch for") | 🔜 planned | The 5th question every article must answer |
| 200+ publishers | 🔜 planned | Tier-3 city coverage (Marathwada / Kongu Nadu / Bundelkhand / Rayalaseema) |
| Cloudscraper-fallback ingest for Cloudflare-protected regional publishers | 🔜 planned | Saamana / Prajavani / Rozana Spokesman — 12-month engineering moat |
| Per-story TTS pre-warm | 🔜 planned | Voice Factory pre-generates audio for top stories per language; instant 🔊 on 2G |
| Morning brief | 🔜 planned | Chitti PA owns delivery at 07:00 IST; CNOS supplies the data |
| Federated fact-check across publishers | 🔜 planned | Multi-source claim verification beyond the local DB |
| Per-publisher trust score auto-weekly | 🔜 planned | Quality decay → low-trust publishers auto-deprioritised |
| Vernacular completion ≥ 0.95 (mr/or/bn/kn/ur/gu) | 🟡 in progress | Closing the coverage-SLA gap from Phase 1 |

---

## Phase 3 — Operating-system scale

The default morning ritual for every Indian household.

| Item | Status | Notes |
|---|---|---|
| 200+ publishers × 22 Indian languages | 🔜 planned | Full vernacular parity, native not translated |
| ≥10 publishers per Indian-state official language | 🔜 planned | Vernacular depth target |
| Daily reading budget | 🔜 planned | "You have 12 minutes; here are 3 stories that fit" — anti-doomscroll |
| Native Android push (via Chitti PA) | 🔜 planned | Morning brief; CNOS never push-spams on its own |
| ISL Phase 2 (camera) + Phase 3 (community signs + Hall of Fame) | 🔜 planned | Phase 1 honest-placeholder animations live today |
| Quarterly trust + time-to-informed survey | 🔜 planned | Activates once there is a live user base |

---

## What gates each phase

- A phase ships only when its Phase-N items clear the 10-stage definition of done in `QUALITY.md` at ≥ 95%.
- No Phase-2 or Phase-3 item ships if it violates a Founder Rule (Trust > Engagement · Truth > Virality · Context > Clicks · Learning > Doomscrolling).
- Accessibility is not a phase — it is a gate on every line above.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
