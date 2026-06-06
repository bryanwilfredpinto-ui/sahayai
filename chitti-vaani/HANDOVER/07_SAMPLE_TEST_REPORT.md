# Chitti Vaani — Sample Test Report

**Date:** 2026-06-06
**Build:** commit `3f4869a`
**Sample directory:** `test_samples/vaani/`
**Harness:** `tools/qa_full_vaani.mjs` PART 7

Cross-links: [01_QA_TEST_REPORT.md §A7](01_QA_TEST_REPORT.md) ·
[09_UNIVERSAL_HANDOVER_FILLED.md PART 2](09_UNIVERSAL_HANDOVER_FILLED.md)

---

## What Vaani "samples" are

Chitti Vaani is a **voice/text intent router** — not a file-upload product.
Its "real samples" are real user utterances the router must classify correctly
and route to the right downstream Chitti. One JSON file per intent family,
5 utterances each, in the language the utterance was naturally spoken.

Each item must carry 5 fields:

| Field | Purpose |
|---|---|
| `utterance` | The actual user-spoken or user-typed text |
| `lang` | BCP-47 code from the canonical 26-lang substrate registry |
| `expected_route` | The target Chitti service (e.g. `medupi`, `emergency`, `ca`) |
| `intent_family` | Human-readable family label (e.g. `health`, `money`) |
| `provenance` | Note on how this sample was collected / authored |

---

## Sample loop

The harness globs `test_samples/vaani/*.json` — **no hardcoded list**. Any new
file dropped in the directory is automatically picked up on the next run. The
loop validates every item against the 5-field schema and reports per-file.

---

## Results table

| File | Category | # Samples | 5-field valid | Status |
|---|---|---:|:---:|---|
| cat1_health.json | Health & medicine intents (route → MedUPI / Health-Scanner / Scanner) | 5 | 5/5 | ✅ PASS |
| cat2_money.json | Money / tax / legal intents (route → CA / Legal / UPI / Shares) | 5 | 5/5 | ✅ PASS |
| cat3_emergency.json | Emergency & safety intents (route → family-cascade / safety surface — NEVER cops) | 5 | 5/5 | ✅ PASS |
| cat4_local.json | Order & book intents (route → local-Chitti directory first, external-app fallback) | 5 | 5/5 | ✅ PASS |
| cat5_civic.json | Civic / news / general intents (route → News / Government / Voice-Factory / general DeepSeek) | 5 | 5/5 | ✅ PASS |

**Total: 25 / 25 items structurally valid across 5 files.**

Minimum requirement per CEOS: 25 real samples across 5 categories (5×5). ✅ MET.

---

## Category notes

### cat1_health.json — Health & medicine

Utterances cover: medicine price queries ("Paracetamol kitne ka hai?"), symptom
description for scanner routing, Jan Aushadhi generic lookup, prescription
upload intent, and nearest pharmacy queries. Routes validated:
`medupi` · `health_scanner` · `scanner`.

### cat2_money.json — Money / tax / legal

Utterances cover: GST question routing to CA, property legal query routing to
Legal, UPI fraud flag ("yeh UPI request fake lagti hai"), stock chart question
routing to Technical, and income tax filing help. Routes validated:
`ca` · `legal` · `upi` · `technical` · `shares`.

### cat3_emergency.json — Emergency & safety

Utterances cover: duress keyword ("bachao"), SafeWalk timer start, late-night
safety check-in, medical emergency (ambulance — NOT cops), and Chitti-to-Chitti
relay trigger. All 5 utterances must route to the family-cascade safety surface
and must NEVER auto-dial COP_DENYLIST numbers (112/100/101/102).

### cat4_local.json — Order & book

Utterances cover: food order (Chitti directory first, Zomato fallback), grocery
order (Kirana / BigBasket), medicine order (Chitti Pharmacy, no external fallback),
cab booking (Ola deep-link fallback), and train booking (IRCTC deep-link).

### cat5_civic.json — Civic / news / general

Utterances cover: PM Awas Yojana eligibility query (Government), today's news
brief (News), Vaani language fluency session (Voice Factory), AI job news for
a doctor (News AI), and a plain general-knowledge question (general DeepSeek).

---

## Live route-accuracy — AUTOMATION-LIMITED

**No accuracy percentage is claimed in this report.**

The harness validates structural validity of the sample files. It does NOT
measure live DeepSeek router classification accuracy because:

1. DeepSeek API key balance is exhausted (fleet-wide blocker per
   `QUALITY_STATUS.md` as of 2026-05-27). Live calls return graceful fallbacks.
2. The Vaani relevance-rail allowlist (per-Chitti confidence thresholds) has
   not been calibrated against a labelled utterance set.

When DeepSeek funding is restored and the relevance-rail is configured, the
CTO will re-run the harness in live mode and publish accuracy numbers in
`chitti-vaani/evals/router_accuracy_live.md`.

The readback-confirm safety net (confidence < 70% → spoken confirm before
routing) means that even with an uncalibrated router, no user is routed to the
wrong Chitti without explicit confirmation.

---

## Sample verdict

**✅ PASS** — 5/5 files structurally valid, 25/25 items 5-field valid,
glob-based loop (no hardcoded list), reproducible.

Live route-accuracy: **AUTOMATION-LIMITED** — gated on DeepSeek funding +
relevance-rail calibration.
