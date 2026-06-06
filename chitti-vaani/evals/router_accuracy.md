# Router Accuracy — Intent Routing Eval
# Chitti Vaani

> Vaani is the **sole user-facing surface** across the sahayai.in platform
> (SAHAYAI_MASTER.md §2, LOCKED 2026-05-15). Every capability — medicine cost,
> tax advice, legal help, government schemes, UPI fraud, news, bike / car
> diagnostics, product scanning, fundamentals, technical analysis — routes
> through Vaani's intent classifier to the correct internal Chitti.
> This file documents the eval design, target metrics, test-set design, and
> confidence-calibration contract for that routing layer.
>
> **HONESTY NOTE — live eval numbers are PENDING.**
> The judge eval (50 queries × 14 Chitti targets) requires a funded DeepSeek
> session and the Vaani relevance-rail to be live on Railway. Numbers in this
> file are **targets and design intentions only**; they are NOT measured results.
> Once the eval harness runs, this file will be updated with the real figures.

---

## Target Metrics

| Metric | Target | Current status |
|---|---|---|
| Top-1 intent accuracy (per target Chitti) | ≥ 85% | PENDING live eval |
| Fallthrough accuracy (no-match stays in Vaani) | ≥ 95% | PENDING live eval |
| Emergency-keyword bypass reliability | 100% | PENDING live eval |
| Confidence calibration ECE (expected calibration error) | ≤ 0.05 | PENDING live eval |
| Classification latency P95 | ≤ 100 ms | PENDING measurement |
| HIGH-risk confirm-before-route trigger rate (< 0.70 band) | Correct in ≥ 95% of low-confidence cases | PENDING live eval |

These targets are derived from the SOP-V002 intent routing contract
([`../sop/intent_routing_sop.md`](../sop/intent_routing_sop.md)) and
the SOP's escalation threshold: CTO alert fires if accuracy < 85% on judge eval.

---

## Routing Architecture (what we are evaluating)

The Router Agent ([`../swarm/router_agent.md`](../swarm/router_agent.md)) is a
**rules-only** classifier — no LLM call in the critical path. The eval must
test the rules, not a neural model.

Classification pipeline:
1. Emergency pre-check (Safety Agent keyword list — < 5 ms, before classification).
2. Keyword-tier matching against `data/intent_routing_table.json`
   (T1 = +0.40, T2 = +0.25, T3 = +0.10, NEG = hard veto).
3. Session-context boost (last intent, turn count).
4. Confidence banding: ≥ 0.85 → route direct; 0.70–0.85 → route + log;
   0.50–0.70 → confirm before route; < 0.50 → fallthrough (Vaani-direct).
5. HIGH-risk Chittis (chitti-ca, chitti-legal, chitti-medupi) extra log step.

---

## Test Set Design

### Ground-truth construction rules

- **All fixtures are human-labelled.** Sire or a domain SME assigns the
  `ground_truth_target` to every query. No auto-generated or LLM-synthesised
  labels are counted in the primary accuracy calculation.
- **Minimum 50 queries per Chitti target** in the judge-eval set.
- **Negative set size = 2× positive set.** For each Chitti's positive queries,
  we include ~100 queries that look adjacent but should NOT route there (e.g.
  "khabar sunao" should route to chitti-news, not chitti-vaani-direct; "mera
  paisa kahan gaya" should route to chitti-upi, not chitti-ca).
- **Language coverage:** queries in Hindi, English, Tamil, Telugu, Marathi,
  Bengali, Gujarati, Kannada, and Malayalam. Each target must have ≥ 5 queries
  per language in the P0 set.
- **Multi-turn fixtures:** 10% of the set are follow-up turns with prior session
  context injected — testing context-inheritance and topic-reset behaviour.

### 14 Chitti routing targets

| Target slug | Display name | Domain |
|---|---|---|
| `chitti-medupi` | Chitti MedUPI | Medicine cost / generic alternatives |
| `chitti-ca` | Chitti CA | Tax, GST, ITR, company law |
| `chitti-legal` | Chitti Legal | FIR, consumer court, family law |
| `chitti-news` | Chitti News | News headlines, current affairs |
| `chitti-news-ai` | Chitti News AI | AI tool discovery, tech trends |
| `chitti-2wheeler` | Chitti Mechanic (Bike) | Bike / scooter diagnostics |
| `chitti-4wheeler` | Chitti Mechanic (Car) | Car diagnostics |
| `chitti-government` | Chitti Government | PM schemes, Aadhaar, ration card |
| `chitti-upi` | Chitti UPI Fraud Guard | UPI fraud, OTP scam, phishing |
| `chitti-scanner` | Chitti Scanner | Product / food label scan |
| `chitti-fundamentals` | Chitti Fundamentals | Stock / company analysis |
| `chitti-technical` | Chitti Technical | Chart patterns, technical analysis |
| `chitti-vaani-local` | Chitti Local | Food order, grocery, cab, salon |
| `chitti-vaani-direct` | Vaani Direct | Fallthrough — psychology, general Q&A |

### Example fixture structure

```json
{
  "query_id": "med-hi-001",
  "text": "Paracetamol 500mg ka generic version kitne ka milega?",
  "lang": "hi",
  "disability_profile": {},
  "session_context": { "last_intent": null },
  "ground_truth_target": "chitti-medupi",
  "ground_truth_confidence_band": "high",
  "notes": "T1 keyword: paracetamol. T2: generic, kitne ka."
}
```

```json
{
  "query_id": "emer-hi-001",
  "text": "Bachao, mujhe bahut takleef ho rahi hai",
  "lang": "hi",
  "disability_profile": { "blind": true },
  "session_context": { "last_intent": null },
  "ground_truth_target": "SAFETY_AGENT_VETO",
  "ground_truth_confidence_band": "emergency",
  "notes": "Emergency keyword: bachao. Must bypass routing pipeline."
}
```

---

## Per-Target Accuracy Targets

Target: every target achieves precision ≥ 0.85, recall ≥ 0.80.

```
Target Chitti           Precision   Recall   Notes
chitti-medupi           ≥ 0.85      ≥ 0.80   T1: medicine names, jan aushadhi, generic
chitti-ca               ≥ 0.85      ≥ 0.80   T1: ITR, GST, TDS, advance tax
chitti-legal            ≥ 0.85      ≥ 0.80   T1: FIR, vakeel, legal notice, consumer court
chitti-news             ≥ 0.85      ≥ 0.80   T1: news, khabar; NEG: stock price
chitti-news-ai          ≥ 0.85      ≥ 0.80   T1: AI tool, LLM, ChatGPT
chitti-2wheeler         ≥ 0.85      ≥ 0.80   T1: bike, scooter; NEG: car, truck
chitti-4wheeler         ≥ 0.85      ≥ 0.80   T1: car, engine oil; NEG: bike, scooter
chitti-government       ≥ 0.85      ≥ 0.80   T1: PM scheme, ration card, Aadhaar
chitti-upi              ≥ 0.85      ≥ 0.80   T1: UPI fraud, OTP scam, phishing
chitti-scanner          ≥ 0.85      ≥ 0.80   T1: scan product, barcode, FSSAI
chitti-fundamentals     ≥ 0.85      ≥ 0.80   T1: P/E ratio, earnings, fundamentals
chitti-technical        ≥ 0.85      ≥ 0.80   T1: chart, RSI, SMA, MACD, signal
chitti-vaani-local      ≥ 0.85      ≥ 0.80   T1: food order, khana, grocery, cab
chitti-vaani-direct     ≥ 0.90      ≥ 0.85   Fallthrough must be reliable (no false positive)
SAFETY_AGENT_VETO       1.00        1.00     Emergency bypass is non-negotiable
```

---

## Confidence Calibration

The router emits `route_confidence ∈ [0, 1]`. We require this to be
calibrated — a query with confidence 0.85 should be correct ~85% of the time.

### Expected Calibration Error (ECE) target: ≤ 0.05

ECE is computed by binning confidence scores into 10 equal buckets and
measuring the gap between mean confidence and observed accuracy in each bucket.

```
Bucket     Confidence range     Target accuracy
B1         [0.0, 0.1)           fallthrough — does not apply
B2         [0.1, 0.2)           PENDING
B3         [0.2, 0.3)           PENDING
B4         [0.3, 0.4)           PENDING
B5         [0.4, 0.5)           < 0.50 → Vaani-direct (fallthrough)
B6         [0.5, 0.6)           ≥ 0.50 → confirm-before-route band
B7         [0.6, 0.7)           ≥ 0.50 → confirm-before-route band
B8         [0.7, 0.8)           ≥ 0.70 → mid-confidence route
B9         [0.8, 0.9)           ≥ 0.85 → direct route, ≥ 85% correct
B10        [0.9, 1.0]           ≥ 0.90 → direct route, ≥ 90% correct
```

If ECE > 0.05, we audit the keyword-tier weights — the most common fix is
adjusting T2/T3 weights or adding negative-keyword vetoes.

---

## Fallthrough Handling

Fallthrough (confidence < 0.50) routes to `chitti-vaani-direct`. The user
receives a Vaani-direct DeepSeek answer. We evaluate:

- **False negative fallthrough:** A query that should have hit a Chitti
  but fell through. This is a recall failure. Target: < 10% of queries per target.
- **False positive fallthrough:** A query that correctly fell through (no valid
  target). Target accuracy: ≥ 95% of true fallthrough queries produce a
  useful Vaani-direct answer.

Fallthrough is NOT a failure mode — it is a designed safe exit. The failure
mode is a **silent drop** or an **error page**, which we prohibit by contract
(SOP-V002 §8: "NEVER silently drop a query").

---

## Regression Fixtures

After every keyword-table change, regression tests run the prior failing
examples to ensure previously fixed bugs do not re-emerge.

Known historical regression cases (to be documented as fixtures):

| Fixture ID | Description | Expected route |
|---|---|---|
| reg-001 | "Khabar dijiye" with `last_intent=stock-price` — should NOT route to fundamentals | chitti-news |
| reg-002 | "Mera UPI band karo" — device-control intent, not fraud | SAFETY_AGENT_VETO (mute device control) |
| reg-003 | "ITR file karna hai, koi CA nahi mil raha" — distress phrase should not veto CA route | chitti-ca |
| reg-004 | "Paisa gaya, bachao!" — dual signal (UPI + emergency) — emergency wins | SAFETY_AGENT_VETO |
| reg-005 | "Nearest hospital" — safety card, not government | SAFETY_AGENT_VETO |

Regression test: `backend/tests/test_router_agent_regression.py`.
Must be GREEN on every PR. A single regression failure blocks merge.

---

## How a New Chitti Target Is Added to the Eval

1. Add the new target slug to the routing table (`data/intent_routing_table.json`).
2. Curate ≥ 50 positive fixtures (ground-truth = new target) and ≥ 100 negative fixtures.
3. Run the eval harness — target precision ≥ 0.85, recall ≥ 0.80.
4. Add the target row to the per-target table in this file.
5. Open a PR; CI runs `test_router_agent.py` + regression suite.

---

## Swarm Learning Boundary

The Router is a candidate for swarm improvement per SAHAYAI_MASTER.md §2f.

**Swarm CAN improve:**
- New regional-language phrasing for existing intents (Hindi variants, Tamil, Bengali).
- Better negative-keyword vetoes (avoiding false positives).
- Confidence-band calibration per language and per disability profile.

**Swarm CANNOT change (locked by architecture):**
- Emergency-keyword bypass — governed by Safety Agent, not the router.
- HIGH-risk confirm-before-route threshold — governed by Golden Rule (§2g).
- Fallthrough threshold (0.50) — locked in SOP-V002.

---

## When the Target Changes

Per the SOP escalation thresholds:
- Accuracy ≥ 85%: GREEN (release ready).
- Accuracy 75–85%: YELLOW — ship with a caveat banner in the Vaani response
  footer: *"Routing accuracy below target — please confirm this is the right
  Chitti."*
- Accuracy < 75%: RED — do not release; block the PR.

---

## Honest Caveats

- The test set is small in v1 (50 queries per target = 700 total). Confidence
  intervals are wide; a ±3% swing on an individual target is within noise.
- We evaluate on text input only. Transcription errors from voice input
  (especially on low-end devices) can degrade accuracy further. A voice-input
  eval pass is planned but not yet built.
- Multi-language eval coverage is thinner outside Hindi and English. Tamil and
  Bengali fixture sets will be expanded in Q3 2026.
- Numbers in this file are ALL pending live DeepSeek funding and Vaani
  relevance-rail activation. Do not quote any figure from this file as a
  measured result until the `PENDING` labels are replaced.

---

Last reviewed: 2026-06-06
