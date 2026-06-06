🎖️ World Class Chitti Mechanic — Commando Discipline. Zero Excuses.

# THE PROCESS — how Chitti Mechanic (Bike + Car Doctor) is built

> Sire 2026-06-06: *"Dismantle both & follow the process — tell me what the process is."*
> This is it. It is the loop every BO goes through. It exists because the earlier builds
> skipped it (skinned an inherited shell, tested implementation-presence instead of the
> real user's first screen). Never again. The **four users — blind · deaf · mute ·
> illiterate** — are the floor of every step, not a final checkbox.

---

## Phase 0 — CEOS truth (read before building)
Read the product's CEOS chain: [ROLE](chitti-2wheeler/ROLE.md) · [PRODUCT_VISION](chitti-2wheeler/PRODUCT_VISION.md)
· [PERSONAS](chitti-2wheeler/PERSONAS.md) · [PRD](chitti-2wheeler/PRD.md) · [SKILLS](chitti-2wheeler/SKILLS.md)
· [SWARM](chitti-2wheeler/swarm/) · [GUARDRAILS](chitti-2wheeler/GUARDRAILS.md) · [ACCESSIBILITY](chitti-2wheeler/ACCESSIBILITY.md)
· [EVALS](chitti-2wheeler/EVALS.md). The PRD names which persona each feature serves; a feature that serves none is not built.

## Phase 1 — RESEARCH (world's best, first)
Study the best apps on Earth in the domain + accessibility ([RESEARCH.md](CHITTI_MECHANIC_RESEARCH.md)).
Map **every** finding → a PRD feature → a BO → an honest status (BUILT / ADD / ROADMAP). No invention.

## Phase 2 — BUILD ORDER (BO1 → BOn, each test-gated)
Decompose the product into thin vertical slices ([BUILD_ORDER.md](CHITTI_MECHANIC_BUILD_ORDER.md)). For each BO:
- **One hard TEST** that flips it GREEN — and the test is written as the **real user journey from the
  default landing screen**, NOT an implementation-presence check. *(The RC-on-landing miss happened because
  BO3's test jumped to the My-Bike tab before looking — so it passed while the feature was hidden. A BO test
  must START where the user starts and FAIL when a real user can't find/complete the action.)*
- **Names its four-user gate:** can Arjun (blind, voice), Imran (deaf, visual+ISL), Pooja (mute, photo/tap),
  Babu (illiterate, icons+2G) each start and finish this slice from the first screen?

## Phase 3 — DISMANTLE (archive, keep the tested core)
Archive the legacy UI to [_legacy/](_legacy/). **Keep only the tested deterministic engine/modules** (breakdown
KB, swarm math, reg parser, health score, scam band, DTC, scanners) and port them. Rebuild the **shell + every
visible surface fresh from the CEOS** — no inherited skin, no generic structure assumed.

## Phase 4 — EXECUTE each BO (test-first, real journey)
1. Write/strengthen the BO's test as the user's journey from landing (it must FAIL on the missing/old state).
2. Build the slice to make it pass — primary action **discoverable on the first screen**, large taps, voice in+out,
   icons, ISL, one pure language (no Hinglish).
3. **Visual / rendered cert** — assert the actual pixels + post-interaction state a user sees, never just DOM.

## Phase 5 — GATE (a BO is done only when ALL pass)
BO TEST green · four-user journey green · visual cert green · §5 No-Hinglish · 375px no-overflow · ≥48px taps ·
0 console errors. **Reuse is earned by passing the test — never assumed from code that happens to exist.**

## Phase 6 — HONEST LEDGER
Record **measured** numbers that trace to a run in the same change. Anything not run = **PENDING**, never GREEN.
The CTO runs the QA; **never hand verification steps to Sire** — deliverables state "what the CTO verified."

## Phase 7 — HANDOVER
Research + Build Order + measured execution log + Known Issues + sign-off (both roles). **Verify on live
(curl/load the deployed page) before saying "live."**

---

## The loop
`Phase 4 → 5 → 6` repeats per BO, BO1 → BOn. Both products (2-wheeler + 4-wheeler) go through the **same**
process; the 4-wheeler mirrors the 2-wheeler BO-for-BO with vehicle deltas.

## The non-negotiables (what broke before — locked so it can't repeat)
1. **Test the real landing journey**, not implementation presence. The four users must find + finish from screen 1.
2. **Visual/rendered cert** — pixels and post-click state, not DOM existence.
3. **No GREEN-wash** — measured or PENDING, nothing in between.
4. **Language dropdown = Chitti Vaani pattern** — static 9 native-script options, no runtime enrichment.
5. **Lead with the primary action** (Scan RC / Diagnose) on the first screen — never bury it in a tab.
6. **CTO does QA**, Sire uses + gives feedback. **Verify on live before handover.**

---
> **World Class Chitti Mechanic — Commando Discipline. Zero Excuses.**
