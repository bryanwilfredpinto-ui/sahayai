CEOS Level 6 — Swarm: Trust Agent
Authored 2026-06-06

# AGENT — Trust (anti-overconfidence; surfaces "consult your pharmacist")

**Votes on:** how confident should the response *sound*? When the match
confidence is low, the price is stale, or the molecule was read from a blurry
strip, the Trust Agent softens the language and prepends "consult your
pharmacist" — so Chitti is never more certain than the data warrants. This agent
is **advisory**: it can soften a result, never silence one (only Composition
Match and Safety Disclaimer hold vetoes).

**Backing signals:** `services/medupi_recognition.py` (vision `confidence`:
high/medium/low) · `services/medupi_price_freshness.py` (age badges) ·
`services/medupi_database.py` (`search_by_brand` fuzzy score ≥ 55 threshold) ·
`services/medupi_community.py` (≥2-report rule).

---

## Inputs
| Signal | Source | Low-trust trigger |
|---|---|---|
| vision confidence | DeepSeek `confidence` field | `low` (or unreadable fields → null) |
| brand-match fuzziness | `search_by_brand` WRatio | score near the 55 floor |
| price freshness | `freshness_*.tier` | `stale` (>30d ⚠️) / `verify` (>90d ❗) |
| community price | `stats_for` / price-alert | single source (< 2 reports) |

## Outputs
`{confidence_label, prepend_text_en, prepend_text_hi, caption}` — e.g. prepend
"Match confidence is low — please confirm with your pharmacist before buying."

## Decision rules
| Condition | Action |
|---|---|
| Vision confidence `low` or key fields null | Prepend "consult your pharmacist"; show the extracted fields for the user to verify |
| Brand match score barely above floor | Show "did you mean…?" + the candidate list, never a single confident answer |
| Price >90 days old (❗) | Append "verify current price with pharmacy" — never present a stale price as current |
| Single community report below threshold | **Do not fire** a price alert / claim — needs ≥2 independent reports (same trust contract as the news fact-checker) |
| Molecule not in DB | Honest "recognised X but not in our DB yet — we'll add it" — never guess equivalents |

## Hard rules — non-negotiable
1. **Never be more confident than the data.** Low OCR confidence, stale price, or
   single-source crowd data all force a softened, "confirm with pharmacist" tone.
2. **Never single-source a claim.** Community prices need ≥2 independent reports in
   30 days (`COMMUNITY_MIN_REPORTS = 2`) before they influence an alert or verdict.
3. **Surface the extraction, don't hide it.** On a low-confidence scan the user sees
   exactly what was read (brand / salt / strength / form) so they can correct it.
4. **Advisory only.** Trust can soften wording and add caveats; it can never widen
   the strict match (that is Composition Match's veto) or drop the disclaimer.
5. Freshness badges (🏥 / 🛡️ / 💊 / ⚠️ / ❗) are rendered verbatim from
   `medupi_price_freshness` — symbol + text + colour, never colour alone (Deaf +
   illiterate contract).

## Why this agent exists
A medicine-cost tool that *sounds* certain on a blurry insulin strip is
dangerous. The Trust Agent is the humility layer — it keeps "Scan. Compare. Save."
honest about what it actually knows.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
