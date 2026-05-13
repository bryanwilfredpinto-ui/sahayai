# Chitti ISL — feature surface

**Indian Sign Language — not ASL.** For 6 crore deaf Indians ignored by every app.

ISL is **not a standalone product** — it is a shared accessibility surface that
inherits into every Chitti product via `chitti_a11y.js` +
`chitti_isl_dictionary.json` at the repo root. The dedicated page
`chitti_isl.html` exists for dictionary browsing, demos, and the future
contribute / Hall-of-Fame flows.

## New-products process — reference apps surveyed

Per the locked five-step process, this skeleton copies the feature surface of:

1. **ISLRTC ISL Dictionary** (Govt of India) — words → ISL video reference.
2. **SignAble** — Indian ISL translation app.
3. **Hand Talk** (Brazil/global) — text → animated avatar signing (Libras/ASL).

The skeleton below covers the union of their primary features; unbuilt ones
are marked `COMING SOON`.

---

## Phase 1 — Build now (LIVE skeleton)

| Feature | Status | Where |
|---|---|---|
| ISL mode toggle in accessibility bar | LIVE | `chitti_a11y.js` → `setIslMode` |
| ISL animation panel attached to every Chitti response (auto, via MutationObserver on `[data-chitti-response]` / `.chitti-response`) | LIVE | `chitti_a11y.js` → `islStartObserver`, `attachSign` |
| Tap-word-to-sign enlarged modal with EN + HI labels | LIVE | `chitti_a11y.js` → `islOpenModal` |
| Fingerspelling fallback for unknown words | LIVE | `chitti_a11y.js` → `islFingerspellFrames` |
| ISL dictionary — ~40 common-life words (greetings, family, food, health, money, govt, agreement, time) + Hindi script alphabet for fingerspelling | LIVE | `chitti_isl_dictionary.json` |
| Dictionary browser with search (EN + HI) | LIVE | `chitti_isl.html` Dictionary tab |
| Demo / try-it page with custom-text renderer | LIVE | `chitti_isl.html` Try-it tab |
| Honest placeholder labeling on every animation (`Placeholder ISL — community video coming soon`) | LIVE | every render path |
| Auto-activation when User Disability Profile has ☑ "I use sign language (ISL)" | LIVE | `chitti_a11y.js` init reads profile (TODO: wire profile → setIslMode automatically once profile setup ships) |

## Phase 2 — Camera-based ISL (COMING SOON)

| Feature | Status |
|---|---|
| Camera captures user gestures, frame-stream classifier identifies the sign | COMING SOON |
| Chitti responds via DeepSeek and speaks aloud for hearing people in the room | COMING SOON |
| Round-trip: deaf user signs → Chitti speaks → microphone hears reply → ISL panel renders | COMING SOON |
| Privacy: video never leaves device unless user explicitly contributes | COMING SOON |
| Surface: dedicated card on `chitti_isl.html` Camera tab; never silent-fail | COMING SOON |

Status: not built. Frame-stream classifier supplier under evaluation.

## Phase 3 — Community-built ISL (COMING SOON)

| Feature | Status |
|---|---|
| Deaf-community volunteers contribute short ISL videos for words missing from the dictionary | COMING SOON |
| Per-word slot in `chitti_isl_dictionary.json` swaps `frames[]` for `video[]` — frontend unchanged | COMING SOON |
| **ISL Hall of Fame** — contributors named, alongside the Voice Hall of Fame, same social-reward model | COMING SOON |
| Contribution endpoint `/api/isl/contribute` with consent capture | COMING SOON |
| Moderation queue (community + Chitti review) before any submission goes live | COMING SOON |

Architecture is **provider-agnostic at one URL** — the same pattern as
[Voice Factory](../../chitti-voice-factory/) — so the contribution backend can
be swapped without frontend changes.

---

## Implementation rules (locked)

1. **All ISL behavior lives in `chitti_a11y.js` + `chitti_isl_dictionary.json`.** Per-product pages never hand-roll ISL.
2. **ISL panel renders *next to*, not in place of, the text.** Deaf-plus-low-vision users keep the large text.
3. **Honest stubs — never claim a placeholder is the real sign.** Every animation labels itself "Placeholder ISL — community video coming soon."
4. **Never silently fall back.** Unknown word → fingerspelling, with visible "(fingerspell)" label.
5. **Same swappable substrate as voice donations.** Phase 3 contribution architecture mirrors Voice Factory.
6. **For certified ISL interpretation:** legal modal points users to [ISLRTC](https://islrtc.nic.in/).

See SAHAYAI_MASTER.md §7 → "Indian Sign Language (ISL) — LOCKED" for the master contract.
