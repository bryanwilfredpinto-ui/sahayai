🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# KNOWN_ISSUES — Chitti Universal Scanner (CUSOS) · Part C3 (HONEST)

**Date:** 2026-06-05. Nothing here is hidden. If it isn't in this list and you find it, it's
a gap in this list — tell me and I'll add it.

## 🔴 P1 — Backend (block a full handover; not fixable from the frontend alone)

| # | Issue | Evidence | Owner / fix |
|---|---|---|---|
| K1 | **Relevance-rail blocks normal product labels.** Typing "Crocin 500mg paracetamol" → `{ok:false, source:"blocked"}`. Only passes with a trigger word (scan/photo/document…). Fleet-class (same off-topic rail as Fashion/Mechanic). | live curl: `[A plain food label] ok:false source:blocked` | Backend — relevance-rail allowlist for scanner intents. **Mitigated:** the deterministic router still routes from the typed text (resilience fix shipped). |
| K2 | **DeepSeek classification falls back.** Even when the rail passes, backend returns `type:"other" source:"fallback"` — no real LLM classification despite `deepseek_configured:true`. | live curl: `[B with word scan] ok:true type:other source:fallback` | Infra — DeepSeek funding (same standing blocker as Fashion/Mechanic). |

## 🟡 Medium — pre-existing accessibility (NOT introduced by CUSOS)

| # | Issue | Where | Note |
|---|---|---|---|
| K3 | **axe color-contrast (6 nodes)** — `Hear page description` button, feedback-widget "Chitti" label, observability "Degraded ⚠️" pill, disability-profile footer. | substrate-injected (`chitti_a11y.js`, `feedback-widget.js`, `chitti_observability.js`) | Present on **every** Chitti page. Fleet-wide substrate fix. CUSOS added **0** new contrast issues. |
| K4 | **axe nested-interactive (2 nodes)** — the original `Open camera` and `Type the label` capture buttons. | pre-existing in `chitti_scanner.html` (before CUSOS) | Not introduced by the router. Fix = restructure the cap-card buttons. |

## 🟡 COMING SOON (honest, gated — not bugs, declared limitations)

| # | Limitation | Gate |
|---|---|---|
| K5 | **Camera vision auto-detect** of arbitrary objects → returns describe-or-pick. | Funded DeepSeek-vision key (opt-in, cost-disclosed). |
| K6 | **Cross-device Universal Memory + Family Graph + predictive reminders.** Local-first only today. | Turso direct-HTTPS shim **unverified on chitti-scanner** (RED — QUALITY_STATUS 2026-05-29 / CTO defect #9). No backend write until verified. |
| K7 | **Specialist Chittis not built:** Farmer, Education, Home-Repair, Career, Guardian. | Router shows honest COMING-SOON + Vaani fallback. Flip to live in `routing/routing_table.md` when each ships. |
| K8 | **LLM-graded 8-agent swarm vote.** Deterministic vote ships; LLM grading pending. | DeepSeek funding + Vaani relevance-rail allowlist. |

## 🟡 Language

| # | Issue |
|---|---|
| K9 | Router `reason` strings authored **EN + HI only**. Tamil/Telugu/Malayalam/Kannada/Marathi/Bengali/Urdu get EN reason text + **native voice** via Voice Factory. Switch tested (no flicker/crash); per-language reason translation is tracked, not claimed. |

## ⛔ NOT TESTED in this environment (flagged, require Sire's devices / infra)

| # | Item | Needs |
|---|---|---|
| K10 | Real Firefox / Safari (desktop) | those browsers |
| K11 | Chrome Android (2) / Safari iOS (2) | physical devices / BrowserStack |
| K12 | 3G throttle (page load < 3s) | network throttling |
| K13 | Lighthouse score | Lighthouse run |
| K14 | Corrupted / 10MB+ image upload | manual file fuzzing on a device |
| K15 | localStorage full/disabled | manual browser config |
| K16 | Manual blind/deaf/illiterate journeys (5 each) | human testers / Sire |
| K17 | **Production (sahayai.in) re-cert of the router card** | a deploy + cert against the live URL (cert here ran against a local server) |

## Flicker check (your specific ask)

en → ta → te → ml language switch: **tested via Playwright — no flicker, no pageerror, the
router re-renders in each language.** This is the automated result; a human visual check on a
real device (K10–K11) is still recommended before the all-green claim.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
