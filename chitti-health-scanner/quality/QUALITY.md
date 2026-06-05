**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Chitti Health Scanner — Quality Gates (COSDF Level 13)

> Golden line: **"Chitti helps you notice — doctors help you heal."**
> This is a medical product. Safety is the top priority, above features, above speed, above launch dates.
> **NOTHING in this document is GREEN.** No gate below is checked. The AI vision models are NOT built or
> clinically validated yet. Backend analysis endpoints return honest `501 coming_soon`. Every accuracy
> number elsewhere in this product is a **research TARGET**, never an achieved/verified score.

Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## How to read this document

Each of the 10 quality gates below is a checklist. Every box is **UNCHECKED** (`[ ]`) — this is the
honest current state. A gate is only ever marked PASS once every line under it is independently verified
and evidenced (screenshot, eval run, sign-off, or live curl). A single FAIL anywhere keeps the whole
product **RED / NOT CERTIFIED** (see Level 14 — `../certification/CERTIFICATION.md`).

- `[ ] PASS` / `[ ] FAIL` — set exactly one, with evidence, per gate.
- A gate with any unchecked sub-item CANNOT be marked PASS.
- "Coming soon" is an honest state. Faking a PASS is a Commando-Discipline violation.

---

## Gate 1 — Functional

Does the capability do what it claims, end to end, on a real device?

- [ ] Camera opens only after the confirm gate ("Sire, shall I open the camera? Haan / Nahi").
- [ ] Capture → encrypt → store → analyze → render pipeline runs without crash on 375px Android.
- [ ] Each analysis output renders: confidence level + plain-language explanation + suggested action.
- [ ] Suggested action is one of: **monitor / consider consult / seek care** — never a diagnosis.
- [ ] Results write to the Chitti Health File timeline (Level: records/timeline integration).
- [ ] Cross-links resolve: MedUPI (Jan Aushadhi) + Government (PMJAY) deep-links open correctly.
- [ ] Backend `/api/health-scanner/*` analysis endpoints return honest `501 coming_soon` (until validated).
- [ ] "Chitti forget" deletes all images + derived data for that user.

**Gate 1 result:** [ ] PASS [ ] FAIL

---

## Gate 2 — Safety (CRITICAL)

The gate that can block release on its own. No override.

- [ ] No output ever says "you have <disease>", "this is cancer", or any certainty claim.
- [ ] Every analysis output carries the disclaimer: **"This is not a medical diagnosis."**
- [ ] No prescriptions, no dosages, no "stop/start this medicine" instructions.
- [ ] No fear-mongering, no panic language, no shaming, no body-shaming.
- [ ] Red-flag escalation: high-risk patterns route to **seek care** with the nearest-care cross-link.
- [ ] Confidence level is always shown — low confidence is stated plainly, never hidden.
- [ ] Honest limitation surfaced in-product: AI is **less accurate on darker / Fitzpatrick IV–VI skin tones.**
- [ ] No emergency auto-actions — Chitti never dials 112/100/102; family-cascade protocol only.
- [ ] DeepSeek-vision responses pass the server-side disclaimer guard before reaching the user.

**Gate 2 result:** [ ] PASS [ ] FAIL — *(CRITICAL: a FAIL here blocks the entire product, no exceptions.)*

---

## Gate 3 — Accuracy

Honest measurement against the stated research TARGETS — never a claim of achievement.

- [ ] Each domain (skin / dental / wound / eye / nail / etc.) has a written research TARGET, labelled as a TARGET.
- [ ] Targets are framed as research benchmarks (skin 95%, dental 89–97%, …) — **NEVER** written as "achieved/live/verified".
- [ ] A held-out validation set exists per domain before any accuracy number is reported as measured.
- [ ] Measured accuracy is reported **separately by Fitzpatrick band** (I–III vs IV–VI), never a single blended figure.
- [ ] Sensitivity/specificity for red-flag (seek-care) cases is reported, not just overall accuracy.
- [ ] Until a model is built + validated, all certification scores stay BLANK (`___%`).

**Gate 3 result:** [ ] PASS [ ] FAIL

---

## Gate 4 — Accessibility (Four-User Contract)

Blind / Deaf / Mute / Illiterate — voice IN + voice OUT + icons/symbols + plain language.

- [ ] **Blind:** full voice-out of confidence + explanation + action; camera framing audio-guided.
- [ ] **Deaf:** full on-screen text + icons; no audio-only information; ISL panel available.
- [ ] **Mute:** every confirm gate accepts a tap as well as voice ("Haan / Nahi" tappable).
- [ ] **Illiterate:** plain language + symbols; status pairs colour with icon + text
      (🟢 normal / 🟡 monitor / 🔴 seek care) — **NEVER colour-only.**
- [ ] One pure language per render — **no Hinglish**; brand/technical terms stay English
      (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM).
- [ ] 9 primary languages render via the shared substrate (chitti_lang.js + T dictionary): en/hi/ta/te/bn/mr/gu/kn/ml.
- [ ] 48×48px minimum tap targets across the scanner UI.
- [ ] Layout holds at 375px width with no overflow/clipping.

**Gate 4 result:** [ ] PASS [ ] FAIL

---

## Gate 5 — Swarm Review

Cross-instance learning + HIGH-risk human review (this is a HIGH-risk medical domain).

- [ ] Anonymised pattern collection wired (no raw images leave the device boundary un-encrypted).
- [ ] Pattern detection (high 👍, 👎→👍 reversals) feeds a review queue, not auto-push.
- [ ] HIGH-risk medical patterns require human (Medical Advisory Board) review before any skills/*.md change.
- [ ] Locked decisions are never learnable / never overridden by swarm.
- [ ] Collect daily · validate weekly · push monthly · review quarterly — cadence scheduled.

**Gate 5 result:** [ ] PASS [ ] FAIL

---

## Gate 6 — Observability

Can we see what the scanner did, for every request, after the fact?

- [ ] Every analysis logs: timestamp, domain, confidence, action, language, Fitzpatrick band (if given).
- [ ] Errors and `501 coming_soon` returns are logged and counted, not silently swallowed.
- [ ] Confirm-gate decisions (Haan/Nahi/timeout-wait) are logged.
- [ ] Founder dashboard receives daily rollup of scans, actions, and 👍/👎 per response box.
- [ ] No PII or raw health image is written to logs.

**Gate 6 result:** [ ] PASS [ ] FAIL

---

## Gate 7 — Privacy (DPDP 2023 + ABDM-aware)

- [ ] Health images **AES-256-GCM** encrypted at rest.
- [ ] Images are user-owned, **never sold**, anonymised before any aggregate.
- [ ] "Chitti forget" deletes all images + derived data, verifiably.
- [ ] No image or derived health data leaves the device boundary without an explicit confirm gate.
- [ ] DPDP 2023 consent + purpose-limitation honoured; ABDM-aware data handling.
- [ ] Sharing (to doctor / family) goes through the Golden-Rule confirm gate every time.

**Gate 7 result:** [ ] PASS [ ] FAIL

---

## Gate 8 — Evals

- [ ] A versioned eval set exists per domain (normal / monitor / seek-care exemplars).
- [ ] Eval set includes balanced Fitzpatrick I–III and IV–VI samples.
- [ ] Safety evals: no-diagnosis, disclaimer-present, no-panic-language — automated and passing.
- [ ] Accessibility evals: voice-out present, colour-never-alone, 375px snapshot — automated.
- [ ] Eval results stored with version + date; regressions block release.

**Gate 8 result:** [ ] PASS [ ] FAIL

---

## Gate 9 — Documentation

- [ ] Every .md first line is exactly the Commando-Discipline header.
- [ ] COSDF Levels reproduced faithfully (safety templates / response templates / metric tables verbatim).
- [ ] Honest-stub status stated everywhere a model is referenced (not built / not clinically validated).
- [ ] User-facing limitation (darker skin tones) documented and surfaced in-product.
- [ ] Cross-product links (MedUPI, Health File, Government) documented.

**Gate 9 result:** [ ] PASS [ ] FAIL

---

## Gate 10 — Founder Review

- [ ] Sire (Bryan Wilfred Pinto) has reviewed the rendered output (canvas pixels / post-click state), not just the DOM.
- [ ] 375px screenshot evidence attached per surface to `tools/cert_screenshots/`.
- [ ] No "live"/"verified"/"GREEN" claim exists for anything not actually measured.
- [ ] Founder explicitly signs off that the safety gate (Gate 2) is satisfied.

**Gate 10 result:** [ ] PASS [ ] FAIL

---

## Mapping onto Chitti's existing gates

The 10 COSDF quality gates above subsume — and must be cross-checked against — Chitti's existing
**eight gates** done-definition and the **5 frontend cert gates**. A feature is not "done" until both
legacy gate sets pass *in addition to* the 10 above.

**Eight gates** (blind × deaf × mute × illiterate × per-box widget × 10 languages × 375px × 48px taps):

| Eight-gate item            | Covered by COSDF gate |
|----------------------------|-----------------------|
| Blind                      | Gate 4 (Accessibility) |
| Deaf                       | Gate 4 (Accessibility) |
| Mute                       | Gate 4 (Accessibility) + Gate 1 (confirm-gate tap) |
| Illiterate                 | Gate 4 (Accessibility) |
| Per-box feedback widget    | Gate 6 (Observability) — `data-chitti-response` + 🔊/🤖/👍/👎 |
| 10 languages (no Hinglish) | Gate 4 (Accessibility) |
| 375px layout               | Gate 4 (Accessibility) |
| 48×48px tap targets        | Gate 4 (Accessibility) |

**5 frontend cert gates** — all must pass on the scanner page, all currently 🔴 RED until verified:

- [ ] feedback-widget.js present + every response box has `data-chitti-response` (🔊/🤖/👍/👎).
- [ ] chitti_a11y.js loaded (language selector, Voice Required marker, Braille mode, aria-live).
- [ ] User Disability Profile prompt inherited (blind/deaf/mute/ISL/illiterate/elderly/mobility/cognitive).
- [ ] Language auto-detect active.
- [ ] ISL plugin (Phase 1: dictionary + per-response animation panel + tap-word modal).

---

**Overall Level-13 status: 🔴 RED — 0 / 10 gates PASS. Skeleton only. No clinical validation yet.**
