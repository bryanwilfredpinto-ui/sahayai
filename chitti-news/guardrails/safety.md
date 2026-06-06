# CNOS — Guardrails · Content & User Safety

> *"A news OS that harms the reader to hold the reader is not a news OS. It is a slot machine."*

Hard rules on what CNOS will and will not do **to** the human reading it. Every rule ties to a Founder rule: **Trust > Engagement · Truth > Virality · Context > Clicks · Learning > Doomscrolling.**

---

## 1. The safety contract

| # | Rule | Founder rule it serves |
|---|---|---|
| 1 | **No auto-play video.** Media plays only on explicit tap. | Learning > Doomscrolling |
| 2 | **No doomscroll dark patterns.** No infinite-scroll trap, no "you're all caught up → here's more", no variable-reward refresh. Reading time is always shown, never hidden. | Learning > Doomscrolling |
| 3 | **No paywall.** Free, forever, no exception, no metered limit, no "register to continue". | Trust > Engagement |
| 4 | **Communal / violence-sensitive content** → link the publisher verbatim, never amplify, never editorialize, never auto-rank to the top of the feed. | Truth > Virality |
| 5 | **Self-harm / emergency content** → surface helplines, never engagement. | Trust > Engagement |
| 6 | **Children's safety** → no profiling of minors, no ad surface, no age-targeting (we have no ads and no PII to begin with). | Trust > Engagement |
| 7 | **No push notification without explicit consent.** Silence is the default. | Context > Clicks |

---

## 2. Communal / violence-sensitive handling (Rule 4 expanded)

When a story touches communal tension, riot, lynching, or active violence:

1. **Link the publisher verbatim.** The headline and body are the publisher's words; CNOS never rewrites them (see [hallucination.md](hallucination.md)).
2. **Never amplify.** Such stories are **excluded from For You boosting** and from the home hero rail. They appear in latest-by-source only.
3. **Never editorialize.** No "Chitti's Take" adjective, no party/religion label — the politics neutrality lock (`scripts/neutrality_eval.py`, 0/100 violations 2026-06-03) applies in full.
4. **Show, don't sensationalize.** No auto-play of violent footage (Rule 1 makes this structural).
5. **Fact-check verdict is mandatory** on these items before any promotion — `verified` requires the same ≥-source corroboration as everything else (see hallucination.md §3).

---

## 3. Self-harm / emergency content (Rule 5 expanded)

If a story or a user query signals self-harm, suicide, or acute crisis, CNOS does **not** optimize for engagement on it. It surfaces help:

| Need | What CNOS surfaces |
|---|---|
| Mental-health crisis | **Tele-MANAS 14416** (Govt of India, 24×7, multilingual) |
| Emergency (life-threatening) | Reader's own contacts via Chitti PA family cascade — **never auto-dials 112/100/102** per locked emergency protocol |
| Ongoing support | Link to the publisher's resource box verbatim, never a CNOS-authored counsel |

CNOS never renders graphic self-harm method detail, never auto-plays related media, and never ranks such a story for reach.

---

## 4. Notifications & consent (Rule 7 expanded)

1. CNOS ships **zero** push notifications by default.
2. Chitti PA — not CNOS — owns the optional 07:00 IST morning brief; CNOS only supplies data (see [PRODUCT_VISION.md](../PRODUCT_VISION.md) anti-vision row).
3. Any notification surface is **opt-in, revocable in one tap**, and never re-prompts after a decline.
4. No "re-engagement" pings. No "you haven't read in 3 days" guilt nudge. Silence is respected as a choice.

---

## 5. CI enforcement

| Rule | Where enforced |
|---|---|
| No auto-play / reading-time shown | `tools/cert_chitti_news_v2.mjs` — per release |
| Communal-story not boosted | structural — For You ranker excludes sensitive categories |
| Neutrality (0 partisan adjectives / 100) | `backend/scripts/neutrality_eval.py` — weekly |
| Cancelled story never re-appears | `tools/cert_cancelled_story.mjs` — per release |
| Helpline surfacing (Tele-MANAS 14416) | manual smoke + content review |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
