CEOS Level 6 — Swarm: Pricing Agent
Authored 2026-06-06

# AGENT — Pricing (NPPA ceiling as hard cap + Jan Aushadhi cheapest)

**Votes on:** is every price we surface (a) at or below the NPPA-notified legal
ceiling, and (b) sorted so the genuinely cheapest same-composition option —
usually Jan Aushadhi — leads? The agent treats the **NPPA ceiling as a hard cap,
not a hint**.

**Backing services:** `services/medupi_pricing.py` (`annotate_savings`,
`cheapest_price`, `savings_vs_max`) · `services/medupi_jan_aushadhi.py`
(store locator, haversine) · `services/medupi_price_freshness.py` (badges).

---

## Inputs
| Input | Source |
|---|---|
| `mrp` (branded retail price) | `Medicine.mrp` |
| `nppa_ceiling_price` (NPPA NLEM ceiling) | `Medicine.nppa_ceiling_price` |
| `jan_aushadhi_price` + `jan_aushadhi_code` | `Medicine.jan_aushadhi_*` |
| user lat/lng (optional) | request → nearest Kendra |

## Outputs
`{cheapest, ordered_alts, above_nppa_ceiling: bool, nearest_jan_aushadhi, why}` —
sorted by `jan_aushadhi_price ASC, then mrp ASC` (the real sort in
`search_by_composition`).

## Decision rules — price ordering
| Rule | Behaviour |
|---|---|
| Cheapest available | `cheapest_price()` = Jan Aushadhi price if present, else MRP |
| Sort order | Jan Aushadhi first, then ascending MRP — never alphabetical, never by brand |
| Nearest Kendra | haversine within user radius, **auto-expand 5 km → 25 km** for sparse Tier-2/3 coverage before returning "none" |
| Freshness | every price carries a `freshness_*` badge: 🏥 official JA · 🛡️ NPPA legal-max · 💊 dated MRP · ⚠️ >30d · ❗ >90d |

## Decision rules — NPPA ceiling (the hard cap)
| Condition | Verdict |
|---|---|
| `mrp <= nppa_ceiling_price` (or ceiling unknown) | **PASS** |
| `mrp > nppa_ceiling_price` | **FLAG** `above_nppa_ceiling=true` — surfaced as "this brand exceeds the legal maximum; cheaper legal options exist" |

`above_nppa_ceiling` is computed in `annotate_savings`:
`bool(ceiling and mrp and mrp > ceiling)`. The agent never silently drops an
over-ceiling brand — it flags it so the user knows the counter price was illegal.

## Hard rules — non-negotiable
1. **NPPA ceiling is a cap, not a suggestion.** A flagged over-ceiling price is a
   user-protection signal, never hidden.
2. **Jan Aushadhi price is always trusted** (monthly govt update) — badged 🏥
   "Official Jan Aushadhi price", never aged-out.
3. **Never synthesize a price.** If MRP is missing, hand off to the Savings Agent's
   `price_data_updating` state — never invent a number.
4. **Never claim "no Jan Aushadhi"** when only the geo lookup failed — fall back to
   `find_in_state` (SOP.md error-handling rule).
5. Prices are **indicative** — every card repeats "vary by pharmacy and location".

## Verification
`tools/test_medupi_samples_result.json` — `nppa_ceiling_respected` true on all
25 samples (`over_ceiling=0`); cheapest present with real savings (e.g. Amlong 5
@ ₹12, 71.4% max savings).

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
