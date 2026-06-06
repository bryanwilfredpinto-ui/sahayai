CEOS Level 6 — Swarm: Savings Agent
Authored 2026-06-06

# AGENT — Savings (honest ₹ saved vs branded, never inflated)

**Votes on:** how much does the user *actually* save by choosing the cheapest
same-composition equivalent — stated honestly, never inflated, and never
fabricated when the price data is missing.

**Backing services:** `services/medupi_pricing.py` (`savings_vs_max`,
`annotate_savings`, `total_savings`, `chronic_projection`) ·
`services/medupi_recognition.py` (`_savings_summary`) ·
`services/medupi_family.py` (`wallet_report`).

---

## Inputs
| Input | Source |
|---|---|
| ordered alternatives with `mrp` / `jan_aushadhi_price` | Pricing Agent / `annotate_savings` |
| `max_price` (proxy for the original branded medicine) | most-expensive entry in the strict set |
| wallet entries (for realized savings) | `WalletEntry.savings_realized` |

## Outputs
`{savings_pct, max_savings_pct, primary_price_inr, cheapest_inr, savings_status, why_en, why_hi}`.

## Decision rules — how savings is computed (honestly)
| Rule | Behaviour |
|---|---|
| Baseline | savings is measured **against the priciest brand** in the strict same-composition set (`max_price`), not an imagined RRP |
| Formula | `savings_vs_max = (max_price - price) / max_price * 100`, **capped at 0%** — a more-expensive option never shows "negative savings" or a fake gain |
| Realized savings | wallet entries only count savings when `price_paid > cheapest_equivalent_price`; otherwise `savings = 0.0` |
| Chronic projection | `chronic_projection` is **plain rupees × 12 × years — no compounding, no inflation** (CONTEXT: a typical chronic family spends ₹8,000–15,000/yr) |

## Decision rules — the honesty gate
| Condition | Verdict |
|---|---|
| MRP + cheapest both present | show real `savings_percent` |
| MRP missing | `savings_status = "price_data_updating"` → UI reads "Price data updating — savings unknown" |
| No alternatives | `savings_status = "no_alternatives_found"` → never a blank 0% / null |

This is the SAHAYAI_MASTER §3 "honest stubs over fake demos" rule encoded in
`_savings_summary`: the agent **refuses to synthesize a savings number** when the
inputs aren't there.

## Hard rules — non-negotiable
1. **Never inflate.** Savings is vs the priciest in-set brand, not a marketing MRP.
2. **Never show negative or fabricated savings** — `savings_vs_max` is floored at 0%.
3. **Never claim a number when MRP is missing** — fall back to `price_data_updating`.
4. **Projections are simple arithmetic, clearly labelled** — no growth modelling,
   no scare-number annualisation beyond `monthly × 12`.
5. Savings text is bilingual (`speak_en` / `speak_hi`) and never leads on a
   HIGH-risk result (the Risk Agent's ⛔ banner comes first).

## Verification
`tools/test_medupi_samples_result.json` — `real_savings_present` true on all 25
samples; measured maxes are real (e.g. 71.4%, 67.3%), computed from seed MRP vs
Jan Aushadhi price, not asserted.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
