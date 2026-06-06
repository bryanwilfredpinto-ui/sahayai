🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# 07 — SAMPLE TEST REPORT — Chitti Fashion

> **Honest scope note.** The Universal template's "5 real files per category in /test_samples/" assumes a
> **scan/upload** product (Health, Scanner, MedUPI). **Chitti Fashion is not a file-upload product** —
> its inputs are the user's **on-device wardrobe** (photos never leave the device, by design/DPDP) and
> typed/spoken outfits. So there is **no `/test_samples/` photo-folder structure**, and there shouldn't be.

## The deterministic-equivalent "sample corpus" (no hardcoding — loops every case)

| Sample set | What it is | Harness (loops all, no hardcoded list) | Result |
|---|---|---|---|
| **1000-case gold dataset** | generated outfit scenarios across occasion categories | `tools/fashion_gold_eval.mjs` → `evals/datasets/` | **occasion 91.6% exact / 99.3% within-band; harmony 96.9%; season 98.4%** |
| **66 engine unit cases** | colour-science / fabric / fit / judge / buildOutfits / v2.1 features | `tools/fashion_engine_test.mjs` | **66/66** |
| **9 languages × outfit** | select each language → generate a real outfit + 9-agent review | `tools/fashion_lang_outfit_check.mjs` | **9/9 native + 3 cousins English-baseline; 0 raw keys; 0 errors** |
| **107 accessibility cases** | live-page DOM/ARIA assertions | `tools/fashion_eval_harness.mjs` | **107/107** |
| **5 four-user journeys** | blind/deaf/mute/illiterate end-to-end | `tools/cert_fashion_journeys.mjs` | **5/5** + screenshots |

## Categories covered by the gold corpus (the "categories" for a wardrobe product)
occasion bands: casual · smart-casual · business-casual · formal · festive · wedding — plus colour-harmony,
seasonal-suitability, and the v2.1 features (repair / wedding-coordination / office-week / family / impact / size).

## "No hardcoded list" verdict — ✅ PASS
`fashion_gold_eval.mjs` and `fashion_lang_outfit_check.mjs` iterate the full dataset / all languages
programmatically. Screenshots: `tools/cert_screenshots/` (375/768/1280 + journey_1..5 + NEW_UI).

## Verdict
**PASS for a wardrobe-first product.** If the owner wants literal `/test_samples/` photo folders, that
implies adding a public photo-upload mode — a product decision that conflicts with the on-device-photos
privacy guarantee (DPDP). Flagged for the Product Owner.
