🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# KNOWN ISSUES LIST (HONEST) — Chitti Mechanic
**Deliverable 3 of 5 · Pre-handover sign-off (Part C)**

**Date:** 2026-06-05 · **Owner:** Chitti CTO. Nothing hidden. If it isn't here, QA believes it doesn't exist —
the live demo + spot-check is the cross-check (see [Sign-off](CHITTI_MECHANIC_HANDOVER_SIGNOFF.md)).

## 1. The Tamil/Telugu/Malayalam flicker — **RESOLVED** (documented in full per request)
- **What it was:** the shared chrome (brand, bottom-nav, feedback-widget labels) flickered English↔active-
  language. **Root cause:** two translation systems fighting over the same DOM — `strings.js` (`VAI_STRINGS`,
  per-key) vs a 6,600-line machine-translated `chitti_lang.js` T-table that re-asserted English on elements it
  didn't know. **a11y** also ran its own text-node translator over the same nodes.
- **When it happened:** on/after any `changeLang`, intermittently, worst on ta/te/ml (timing-dependent).
- **Fix (shipped `d52a645`):** removed `chitti_lang.js` (legacy translator) from both pages; `a11y` now skips
  `[data-vai-i18n]`; `updateAllStrings` idempotent + self-heal. **`strings.js` is now the SOLE translator.**
- **Verified clean:** §5 scanner **stable 8–16** (was racy 99↔2400); per-language settle **~0–5**;
  cross-engine (Chromium/Firefox/WebKit) Tamil render confirmed. **No flicker remains** on these languages.

## 2. Slow first-visit load on 2G/3G — **OPEN (Medium)** → BUG-1
- **Exactly when:** a **first** visit on a ~400 kbps connection takes **~37s** to DOMContentLoaded (measured).
  Repeat visits are fast (service-worker cache). On Wi-Fi/4G: **<1.3s** (measured).
- **Why:** the substrate JS bundle is large. Removing `chitti_lang.js` already cut ~250KB; further split needed.
- **Workaround:** the offline service worker caches everything after the first load → all subsequent visits +
  full offline use are instant. **Mitigation/fix tracked:** Architecture Review tech-debt #1.

## 3. First-visit disability-onboarding modal language — **OPEN (Low, by-design nuance)**
- The first-visit accessibility-onboarding modal (a11y substrate) shows in a default language **until the user
  picks** — but that modal **contains the language picker itself** (the user chooses their language there). So
  it is onboarding UX, not steady-state chrome. Once chosen, the whole app honors it. Could be pre-translated
  into `strings.js` for polish (small follow-up).

## 4. Camera / audio **AI auto-detect** — **OPEN (by-design honest stub)**
- Dashboard photo auto-read, tyre/leak photo AI, and audio sound classification are **not built** — they need a
  vision/audio model (DeepSeek funding, §8). The **deterministic versions are LIVE** (pick-the-light, tyre
  coin-test checklist, sound-picker, leak colour-guide). The UI says **"AI auto-read — coming soon"** and
  **never fabricates an AI verdict**. This is intentional (honest-stubs rule), not a bug.

## 5. Live LLM diagnosis + measured CQOS accuracy numbers — **BLOCKED ON SIRE**
- Swarm Diagnosis / Scam Shield call DeepSeek via `chitti-vaani-api`. Today this is gated by **DeepSeek
  funding (429s) + the Vaani relevance-rail returning mechanic intent as `off_topic`**. Until then the card
  shows its **honest "confidence low" fallback**, and the CQOS accuracy targets (diag ≥90% / safety =100%) are
  **not measured** — we do **not** print a number we haven't measured. (Control Panel MECH-4.)

## 6. Turso server-side persistence — **BLOCKED ON SIRE**
- `DATABASE_URL` is unset on the Railway backends → they fall back to local SQLite, which is **ephemeral across
  Railway restarts**. The **device-local copy persists**; the server copy does not yet. Fix: `turso auth login`
  / paste the `libsql://…` URL. (Control Panel §G.)

## 7. JavaScript disabled — **OPEN (by-design)**
- It is a client-side app; with JS disabled, static content shows but interactivity (diagnosis, scanners) needs
  JS. Acceptable for the target (modern mobile browsers); a `<noscript>` hint could be added.

## 8. Language coverage — **OPEN (Low)**
- **9 languages fully translated** (en, hi, ta, te, bn, mr, gu, kn, ml). The dropdown is **pruned to those 9**
  so a user can never pick one that doesn't fully translate. The wider 22/26-language set (Urdu, Punjabi, Odia,
  Assamese, …) is **roadmap**; voice covers 26 via Voice Factory. Untranslated strings show **clean English
  fallback** (no garble, no code-switch) per §5.

## 9. Test-coverage gaps (honest) — what was NOT tested
- **Physical iOS/Android handsets** — only the rendering engines (Chromium/Firefox/WebKit) were tested, not
  real devices/touch/sensors. **Recommend** a real-device pass before mass launch.
- **Human blind/deaf/illiterate user sessions** — a11y was verified by **structure/attributes/voice paths**,
  not by real assistive-technology users living the flow. **Recommend** moderated AT-user testing.
- **Automated a11y scanner** (WAVE/Lighthouse) — not installed; a **manual attribute audit** was substituted.
- **Real production curl** of the deployed Railway endpoints + live Vaani answer — blocked by §5/§6 above.

## Severity roll-up
| Critical | High | Medium | Low / by-design / Sire-blocked |
|---|---|---|---|
| **0** | **0** | **1 open** (slow 3G) + 1 fixed (img-alt) | flicker (resolved), modal lang, AI-stubs, JS-off, lang-coverage, persistence (Sire), live-LLM (Sire) |

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
