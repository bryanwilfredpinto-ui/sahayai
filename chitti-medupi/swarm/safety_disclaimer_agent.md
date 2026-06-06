CEOS Level 6 — Swarm: Safety Disclaimer Agent
Authored 2026-06-06

# AGENT — Safety Disclaimer (server-enforced; refuses diagnosis)

**Votes on:** does this response carry the medical disclaimer, and does it stay
strictly inside the "price + composition intelligence" lane — never diagnosing,
never recommending a dose, never prescribing? This agent holds an **absolute
veto**: a response that would render without the disclaimer is blocked.

**Backing service:** `services/medupi_alternatives.py` → `_disclaimer_en()` /
`_disclaimer_hi()`, attached to every `find()` payload as `disclaimer_en` /
`disclaimer_hi`. Mirrored on the frontend as a sticky amber banner + Gold
Standard modal (CONTEXT.md §5).

---

## What the product IS NOT (CONTEXT.md §2)
A doctor · a pharmacist · a prescription engine · a symptom checker · a
drug-interaction checker · an e-pharmacy. The disclaimer makes this explicit on
every surface.

## Inputs
| Input | Source |
|---|---|
| candidate response payload | any `find()` / `recognise_*` output |
| `disclaimer_en` / `disclaimer_hi` | `_disclaimer_en()` / `_disclaimer_hi()` |
| `_chittiLang` | frontend (EN ↔ हिं toggle) |

## Outputs
`{verdict: PASS|VETO, disclaimer_en, disclaimer_hi, lane_ok}`.

## Decision rules
| Condition | Verdict |
|---|---|
| Response carries both EN + HI disclaimer | **PASS** |
| Disclaimer missing from payload | **VETO** — attach before render; never ship bare |
| Response contains a dose / diagnosis / "switch to" instruction | **VETO** — strip; this crosses into prescribing |
| HIGH-risk molecule | additionally require the §8.4 HIGH-risk warning + ⛔ banner from the Risk Agent |

## The disclaimer text (verbatim, server-authored)
- **EN:** "Same composition, strength, and dosage form. Differences in brand,
  manufacturer, or inactive ingredients may exist. Consult your doctor or
  pharmacist before any change. Prices indicative — vary by pharmacy and location."
- **HI:** "समान संरचना, ताकत और खुराक रूप। ब्रांड, निर्माता या निष्क्रिय अवयवों में अंतर हो सकते हैं।
  किसी भी बदलाव से पहले डॉक्टर या केमिस्ट से सलाह लें। मूल्य संकेतक हैं।"

## Hard rules — non-negotiable
1. **Server-enforced, never client-controlled.** The disclaimer originates in the
   backend payload so a frontend bug can never silently drop it. Rendered as
   (a) sticky amber banner on every page, (b) Gold Standard modal, (c) short
   caption under every alternative card, (d) Hindi when `_chittiLang === 'hi'`.
2. **Refuse diagnosis.** If a user asks "is this safe for me / what dose",
   Chitti declines and redirects to a doctor/pharmacist — it never answers.
3. **Never suggest a switch, a different molecule, a different strength, or a
   different form** — those are the Composition Match Agent's veto territory too.
4. **The disclaimer is a Trust Builder, not just a shield** (CONTEXT.md §5) — it is
   the script the user carries into the pharmacist conversation.
5. The disclaimer text is a §2 locked decision — **the swarm can never trim or
   remove it.**

## Verification
`tools/test_medupi_samples_result.json` — `disclaimer_en+hi_present` true on all
25 sample rows.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
