# CNOS — Memory · The Reader Twin (Life Twin)

> *"A twin that lives in your pocket, not in our datacentre. It knows you so well precisely because it never tells us anything."*

---

## What a "reader twin" is

Every reader of CNOS has a **reader twin** — a small, private, on-device model of their news life. It is not a profile in a backend. It is a handful of `localStorage` keys on the reader's own device that let CNOS open to the right state, the right language, the right category, and the right For You ranking — instantly, every morning, without a single byte leaving the phone.

This is the deliberate, privacy-first answer to the Google/Meta data-extraction aggregators. Their twin of you lives on *their* servers and is sold. **The CNOS twin lives on your device and is yours.** It is moat #5 in [PRODUCT_VISION.md](../PRODUCT_VISION.md): *Per-device For You. Algorithm in browser. No tracking.*

It ties to every Founder rule: **Trust > Engagement · Truth > Virality · Context > Clicks · Learning > Doomscrolling.** A twin that can't be sold can't be used to manipulate you.

---

## What the twin remembers (all `localStorage`-only)

Full schema in [memory/README.md](README.md). Summary:

| What | Key | Why it helps the reader |
|---|---|---|
| Home state | `chitti_news_state` | Opens to Maharashtra news first, not Delhi-centric national |
| Display language | `chitti_news_lang` | Marathi reader gets Marathi, not English-with-Latin-script |
| Last category | `chitti_news_category` | Returns you to where you left off |
| For You weights | `chitti_news_for_you` | Per-category 👍/👎 — *categories only, never party/religion* |
| Read Later | `chitti_news_read_later` | "Finish this tonight" without an account |
| Cancelled | `chitti_news_cancelled` | A muted story **never** comes back |
| Disability profile | `chitti_disability_profile` | Blind → auto-read; deaf → captions; shared across all Chittis |
| Anonymous token | `chitti_news_user_token` | Aggregate feedback only — never identity-linked |

There is **no server-side mirror** of any of this. The For You ranker runs in the browser; the backend never receives the weights.

---

## Recall in the reader's life — four personas

### Maharashtra–Marathi mother (P1)
Twin holds `state=mh`, `lang=mr`. She opens CNOS at 6 a.m.: Maharashtra state news first, Marathi publishers (Saamana, Loksatta) prioritised, school/health stories surfaced because she 👍'd them before. The twin never knows she is a mother — only that "health" and "education" weights are up on this device.

### Tamil retired teacher (P2)
Twin holds `state=tn`, `lang=ta`, and (if set) `blind=true`. CNOS opens Tamil Nadu + Tamil publishers, and if blind is true, **🔊 auto-read turns on** so the front page is spoken without a tap. The twin enables dignity, not surveillance: nothing about his eyesight ever leaves the device.

### Vidarbha farmer (P5)
Twin holds `state=mh`, `lang=mr`, `illiterate=true`. CNOS does voice-first onboarding, floats the agriculture rail to the top (mandi rates, monsoon, MSP), and reads "Chitti's Take" aloud. The twin lets a non-reading user *use* news as an equal — the four-user accessibility contract made personal.

### Tech student (P10)
Twin holds `state=ka`, `lang=en`. CNOS floats the tech rail (Indian startups, AI, telecom policy) and — in Phase 2 cross-Chitti swarm — can hand a career-relevant story to CNAIOS. The twin's "tech up, politics down" is a category preference, never a political identity.

---

## What the twin deliberately does NOT remember

| Never remembered | Why |
|---|---|
| Name / email / phone | No PII; we never ask (see [../guardrails/privacy.md](../guardrails/privacy.md)) |
| Location beyond state | Sub-state location → tracking risk |
| Political / communal / religious profile | Hard Founder neutrality rule — structurally absent |
| Reading history beyond Read Later / Cancelled | That is the doomscroll incentive; we refuse it |
| Cross-device link | Per-device only; no cloud sync, no account |
| Which political stories you opened | Only the *category* weight moves, never the party |

The twin is intentionally **shallow on identity and rich on usefulness**. It knows enough to serve you tomorrow morning, and nothing that could be sold or subpoenaed.

---

## Why this is the anti-Google / anti-Meta design

| Big-tech twin | CNOS reader twin |
|---|---|
| Lives on their servers | Lives on your device |
| Built from everything you click | Built from explicit 👍/👎 + saved/cancelled |
| Monetised via ads | No ads, no monetisation, free forever |
| Models who you *are* | Models which *categories* you want |
| You cannot delete it | One tap deletes it entirely |

The personalization is real and good — and it costs the reader nothing in privacy because the algorithm executes in their browser. The strongest twin is the one we cannot see.

---

## How `Chitti.forget()` resets the twin

A reader taps **🗑 Forget me** anywhere in the Chitti ecosystem and the twin ceases to exist:

1. **All `localStorage` keys are deleted** — state, language, category, For You weights, Read Later, Cancelled, token, disability profile.
2. **The aggregate row keyed on `chitti_news_user_token` in `quality_feedback` is tombstoned** — the count survives (quality stats stay honest) but the identity is gone.
3. **The disability / ISL profile is cleared**, so the next visit re-asks from scratch.
4. **A per-device opt-out flag is set** — future feedback is dropped, not aggregated.

No soft-delete. No retention window. No backup that outlives the tap. The twin is born on-device and dies on-device, on the reader's command.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
