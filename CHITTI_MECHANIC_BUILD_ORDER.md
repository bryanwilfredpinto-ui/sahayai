🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# BUILD ORDER — Chitti Mechanic (BO0 → BOn, each test-gated)

> Sire's rule (2026-06-06): *"Research the best apps in the world, prepare a build order
> like BO1-TEST, BO2-TEST … BOn-TEST for my users who are blind / deaf / mute / illiterate,
> then execute."* This file is that build order, shared across **Chitti 2-Wheeler (Bike
> Doctor)** and **Chitti 4-Wheeler (Car Doctor)** — mirror builds; vehicle deltas inline.
>
> Grounded in the CEOS: [chitti-2wheeler/ROLE.md](chitti-2wheeler/ROLE.md) ·
> [PERSONAS.md](chitti-2wheeler/PERSONAS.md) · [PRD.md](chitti-2wheeler/PRD.md) ·
> [WORLD_CLASS_FEATURES.md](chitti-2wheeler/WORLD_CLASS_FEATURES.md) (4-wheeler mirrors).
> BO0 research: [CHITTI_MECHANIC_RESEARCH.md](CHITTI_MECHANIC_RESEARCH.md).

## Doctrine
1. **The four users gate EVERY BO** — blind (Arjun P5) · deaf (Imran P6) · mute (Pooja P7) ·
   illiterate (Babu P8). A BO is not GREEN if it breaks any of them. This is the floor, not a
   final step ([ACCESSIBILITY.md](chitti-2wheeler/ACCESSIBILITY.md) + per-archetype files).
2. **Rules are the product; the LLM is an enhancement.** The breakdown KB, swarm verdict math,
   reg parser, health score, scam band and DTC library are **deterministic** — they work with
   DeepSeek offline, so they are Node-testable without a browser.
3. **A BO is "done" only when its TEST passes.** Reuse is *earned by passing the test*, never
   assumed from inheritance. A number is never claimed before it is measured (honest stubs).
4. **Test harnesses:**
   - Node/logic + DOM-presence: [tools/test_mechanic.mjs](tools/test_mechanic.mjs), backend `pytest`.
   - Playwright cert (375/768/1440 + 5-element box + language re-render): [tools/cert_mechanic.mjs](tools/cert_mechanic.mjs).
   - Full QA pass (22 journeys × 3 engines): [tools/qa_handover.mjs](tools/qa_handover.mjs).
   - §5 No-Hinglish: [tools/scan_hinglish.mjs](tools/scan_hinglish.mjs). RC: [test_rc_scan](tools/test_rc_scan.mjs) + [test_rc_langs](tools/test_rc_langs.mjs).

---

## BO0 — Research best apps, THEN decide the dismantle
**Build:** study the world's best vehicle + accessibility apps ([RESEARCH.md](CHITTI_MECHANIC_RESEARCH.md));
decide what to dismantle vs keep. **Decision (honest):** keep the **tested deterministic modules**
(breakdown KB, swarm, scanners, health score, OBD, RC, i18n) — exactly as the Chitti Technical BO0
kept its indicators — and re-derive the **shell + every feature claim from the CEOS via the build
order below**, proving each against a test. The generic inherited-skin *assumption* is dismantled;
a 24/24-certified product is **not** thrown away for a from-zero rewrite (Founder Rule: trust first).
**TEST (BO0):** RESEARCH.md cites real apps and maps each to a PRD feature + BO + honest status;
every BO below names its four-user gate and its exact pass test.

## BO1 — Page shell + 5 substrate gates + emergency banner + Disability Profile
**Build:** `chitti_2wheeler.html` / `chitti_4wheeler.html` load `chitti_a11y.js` + `strings.js` +
`feedback-widget.js` → inherit a11y, ISL, **User Disability Profile** prompt, Feature Discovery,
language select; per-response `data-chitti-response` boxes; emergency = **family cascade** copy
(never cops). **Four users:** profile prompt routes blind→voice, deaf→visual, mute→tap, illiterate→icons.
**TEST (BO1):** [cert_mechanic.mjs](tools/cert_mechanic.mjs) asserts a11y + feedback-widget + ≥10
`data-chitti-response` boxes + 5-element box present; HTML parses; 0 console errors.

## BO2 — i18n: 9-language whole-UI re-render, zero Hinglish
**Build:** `data-vai-i18n` on every label; `VAI_STRINGS` for en·hi·ta·te·bn·mr·gu·kn·ml; `strings.js`
is the **sole** translator (legacy `chitti_lang.js` removed); whole-UI re-render on `chitti:langchange`;
model/part names (RSI-equivalents: "DTC", "ABS") stay English. **Four users:** illiterate/elderly hear
the same content their language; no code-switch garble.
**TEST (BO2):** [scan_hinglish.mjs](tools/scan_hinglish.mjs) stable single/low-double digits; every
`rc.*`/form key in all 9 langs ([test_rc_langs.mjs](tools/test_rc_langs.mjs) 54/54); en→ta→te→ml switch clean.

## BO3 — Onboarding: Scan-your-RC + Vehicle Profile + Vehicle Twin (F1/F6)
**Build:** **Scan your RC** (camera) → reg parsed to **State + RTO offline** (37-code table); make/model/
year (voice/tap/confirm); persist the **Vehicle Twin** to localStorage; make/model auto-read **wired** to
`CHITTI_RC_VISION_URL`, honest "coming soon" until funded — **never fabricates**. **Four users:** mute →
photo+tap only; illiterate → voice + the deterministic State/RTO chip; blind → spoken readback.
**TEST (BO3):** [test_rc_scan.mjs](tools/test_rc_scan.mjs) 20/20 — card+buttons ≥48px, parser UP/MH/KA +
junk→null, live chip, honest no-fabrication, photo device-local; profile save→persist (qa J2).

## BO4 — Symptom Doctor HERO: 8-agent confidence swarm (F0)
**Build:** symptom (voice/text) → **Swarm Diagnosis** (Symptom·Engine·Electrical·Fuel·Safety[veto]·DIY·
Cost·Trust) → *Likely/Possible* verdict + can-I-ride + cost band; DeepSeek enhances when keyed, honest
"confidence low" fallback offline. **Four users:** blind → spoken verdict; deaf → visual card + severity
icon; mute → typed/tap symptom; illiterate → voice + icons.
**TEST (BO4):** qa_handover J3 (verdict renders, 3 engines); never prints a fabricated certainty; Trust
agent caps overconfidence ([swarm/trust-agent.md](chitti-2wheeler/swarm/trust-agent.md)).

## BO5 — Roadside Self-Fix: offline cause → SVG diagram → steps (the "don't go to a mechanic" core)
**Build:** symptom → deterministic cause → **SVG part locator** + numbered DIY steps + tools + time +
"can you do this at home or need a mechanic"; 100% offline (no network, 2G/no-signal). **Four users:**
illiterate/2G (Babu) is the primary persona — picture steps + voice; deaf → diagram+text; blind → spoken steps.
**TEST (BO5):** qa_handover J5 (diagram+steps render); edge "No internet → offline Self-Fix works" PASS.

## BO6 — Safety guardrails + Emergency = family cascade, NEVER cops (F9) — the supreme veto
**Build:** never-claim-certainty; DIY safety red-lines (brakes/fuel/electrical → "get a mechanic");
Roadside SOS → confirm-with-master → ring alarm → **family cascade**, **never auto-dials 100/108/112**;
Golden Rule (no side-effect without explicit haan/tap). **Four users:** SOS reachable by voice (blind),
visual (deaf), tap (mute), icon (illiterate).
**TEST (BO6 — guardrail):** [guardrails/emergency-protocol.md](chitti-2wheeler/guardrails/emergency-protocol.md)
honored; no code path auto-dials emergency numbers (grep + eval); safety red-line downgrades to "inspect".

## BO7 — Scam Shield / fair-price band (F5/F14)
**Build:** job + quote → **fair band** + scam verdict; "do nothing, it's fine" is a first-class answer;
no parts-funnel. **Four users:** voice job entry (illiterate), photo the bill (mute), spoken band (blind).
**TEST (BO7):** qa_handover J4 (band renders); band never below 0 / never fabricated; anti-funnel copy present.

## BO8 — Dashboard Doctor + Sound Doctor + AI Scanners (F2/F3)
**Build:** Dashboard Doctor (pick/scan light → meaning + can-I-ride); Sound Doctor (record → **visual
waveform** + pick-the-sound); AI Scanners (Dashboard/Tire/Sound/Leak) — **deterministic today**, photo/
audio AI **wired + honest "coming soon"**, never a fake verdict. **Four users:** deaf → waveform never
audio-only; blind → spoken dashboard read; mute → photo; illiterate → icon picker.
**TEST (BO8):** qa_handover J6 (scanners open); edge "10MB + corrupted image → no crash"; no fabricated AI verdict.

## BO9 — Vehicle Health Score + Passport + Digital Service Book + Preventive (F6/F8/F10/F11)
**Build:** rate-6 → 0–100 health score + band; Digital Service Book (log/persist); preventive reminders
by odo+time; Health Passport export (roadmap). **Four users:** spoken score (blind), visual band+icon (deaf).
**TEST (BO9):** qa_handover J7 (score number + band); service log round-trips localStorage.

## BO10 — DTC plain-English library + OBD2 BLE (F13/F7)
**Build:** OBD2 via Web-Bluetooth ELM327 → DTC decode; ~12-code plain-English library, honest fallback
when no adapter; wider DB roadmap. **Four users:** spoken code meaning (blind), visual card (deaf).
**TEST (BO10):** qa_handover J8 (no-bluetooth → honest fallback, no crash); DTC lookup returns plain text.

## BO11 — The FOUR USERS, end-to-end (per-persona journey)
**Build:** prove each archetype can complete a real job start-to-finish — Arjun (blind, voice+haptic),
Imran (deaf, visual+waveform+ISL), Pooja (mute, photo+tap), Babu (illiterate, voice+icons+2G). Per-response
widget (🔊/🤖/👍/👎) on every box; ISL panel; `<html lang>`; never colour-only.
**TEST (BO11):** a11y attribute audit 5/5 (html-lang, aria-label, all-img-alt, ≥10 response boxes, taps
≥44×40); §5 across all 9 langs; **human blind/deaf/illiterate AT sessions = ROADMAP (honestly PENDING)**.

## BO12 — Responsive (mobile 375 · tablet 768 · desktop 1440) + MedUPI-aligned visual + final cert
**Build:** 375 single-column no overflow; ≥48px taps; MedUPI design language ([chitti_mechanic_medupi_skin.css](chitti_mechanic_medupi_skin.css));
emergency/SEBI-equivalent disclaimers always visible. **Four users:** large-tap + high-contrast (elderly/low-vision).
**TEST (BO12 — cert):** [cert_mechanic.mjs](tools/cert_mechanic.mjs) 24/24 — screenshots @375/768/1440, no
overflow, 5-element box on every card, language re-render proof, 0 console errors.

## BOn (= BO13) — Honest results + certification report (measured, not claimed)
**Build:** run every harness; write **measured** numbers into [CHITTI_MECHANIC_HANDOVER.md](CHITTI_MECHANIC_HANDOVER.md)
+ the 5 sign-off docs; any gate that didn't run is marked **PENDING**, never GREEN.
**TEST (BOn):** every number in the handover traces to a harness run in the same change; ROADMAP/PENDING
items (vision-AI, human-AT, live-LLM CQOS, Turso durability) are listed, not hidden.

---

## Execution log — EXECUTED + RE-TESTED 2026-06-06 (every BO test re-run after the dropdown rebuild)

> Sire: *"YOUR JOB BO1-TEST, BO2-TEST … BOn-TEST."* Every BO below was test-run against the
> current build today; numbers are measured in this same change, not asserted. The legacy UI
> was archived to [_legacy/](_legacy/); BO1/BO2 were **rebuilt** (clean Vaani-pattern language
> system — see the dropdown note under BO2).

| BO | Built / rebuilt | Test gate (command) | Status (measured 2026-06-06) |
|----|-------|-----------|-------------------|
| BO0 | research + dismantle decision | RESEARCH maps apps→PRD→BO | ✅ [RESEARCH.md](CHITTI_MECHANIC_RESEARCH.md) |
| BO1 | shell + 5 a11y gates + emergency cascade + profile | `cert_mechanic` | ✅ cert **24/24** |
| BO2 | **REBUILT** 9-lang dropdown → clean static Vaani pattern (28-opt prune cruft deleted) | `test_lang_dropdown` + `scan_hinglish` + `test_rc_langs` | ✅ dropdown **22/22** · §5 **0 violations** (was 8–16) · matrix **54/54** |
| BO3 | Scan-RC + profile + Vehicle Twin | `test_rc_scan` + qa J2 | ✅ RC **20/20** · J2 PASS |
| BO4 | Symptom Doctor 8-agent swarm | qa J3 (3 engines) | ✅ J3 PASS ×2 |
| BO5 | Roadside Self-Fix (offline SVG+steps) | qa J5 + offline edge | ✅ J5 + offline PASS |
| BO6 | safety guardrails + family-cascade SOS | no-auto-dial grep | ✅ **0** dials to 100/108/112 |
| BO7 | Scam Shield fair band | qa J4 | ✅ J4 PASS |
| BO8 | Dashboard/Sound/AI Scanners (det. + honest stub) | qa J6 + image-edge | ✅ J6 PASS · no fake verdict |
| BO9 | Health Score + Service Book + Preventive | qa J7 | ✅ J7 PASS |
| BO10 | DTC library + OBD2 BLE | qa J8 | ✅ J8 honest fallback PASS |
| BO11 | four users end-to-end | a11y audit 5/5 + §5 | ✅ attributes **5/5** · 🔵 human-AT **PENDING** |
| BO12 | responsive 375/768/1440 + MedUPI skin | `cert_mechanic` | ✅ cert **24/24**, no overflow |
| routes | backend deterministic routes | `pytest` 2w + 4w | ✅ **24 + 22 passed** |
| BOn | measured handover + 5 sign-off docs | `qa_handover` (22 journeys × 3 engines) | ✅ **44/45** (1 = slow-3G BUG-1) · `qa_mechanic` **0 issues** |

## Rebuild journey gates — added 2026-06-06 (test-first, from the real landing screen)

Per [CHITTI_MECHANIC_PROCESS.md](CHITTI_MECHANIC_PROCESS.md): these tests start where the USER starts
(default landing, no tab nav, no saved vehicle) — the discipline the old QC lacked. Each was written
**failing-first**, then built to green.

| Gate | What it proves (real journey) | Test | Status |
|---|---|---|---|
| **Landing** | screen 1 has the 9-lang dropdown + visible Scan-RC + visible voice + ≥44px taps + dropdown matches content language | [test_landing_journey.mjs](tools/test_landing_journey.mjs) | ✅ **12/12** (fixed: Scan-RC was buried in a tab; dropdown showed en while content was hi) |
| **Diagnose** | a roadside user diagnoses on screen 1 WITHOUT adding a vehicle first | [test_diagnose_journey.mjs](tools/test_diagnose_journey.mjs) | ✅ **10/10** (fixed: HERO was trapped in #*-summary, hidden until a vehicle existed) |
| **Four users** | blind (box-speak+mic) · deaf (visible verdict+ISL) · mute (type+photo+tap) · illiterate (icon+speak) each operate screen 1 | [test_four_users.mjs](tools/test_four_users.mjs) | ✅ **12/12** |

**Honest gaps (ROADMAP / PENDING — not GREEN):**
- **Vision/audio AI** (RC make/model auto-read, dashboard/tyre/leak photo, sound classification) — wired,
  honest "coming soon", **never fabricated**; needs DeepSeek-vision funding or a VAHAN/Parivahan API.
- **Human blind/deaf/illiterate AT sessions** (BO11) — attribute-verified only; real-user sessions PENDING.
- **Physical iOS/Android device pass** — 3 engines headless tested, not real handsets.
- **Live-LLM diagnosis + measured CQOS accuracy** + **Turso durable persistence** — Sire-blocked.
- **Slow-3G first load ~37s** (BUG-1) — documented, SW-cache mitigated.

---
> **World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.**
