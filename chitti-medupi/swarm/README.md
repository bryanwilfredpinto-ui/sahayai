CEOS Level 6 — Swarm: Chitti MedUPI Diagnostic & Quality Swarm
Authored 2026-06-06

# SWARM — the 6-agent verdict (medicine-cost intelligence)

> **This Chitti is someone's lifeline. Build it like your family depends on it.**

Before any alternative is shown to a user, the MedUPI swarm composes a single
**verdict**. The user sees the synthesized result — cheapest same-composition
option, ₹ saved, risk banner, disclaimer — never one agent's raw opinion. Every
agent is grounded in a real backend service; this swarm is a *diagnostic + quality*
panel layered on top of `services/medupi_*.py`, not a second prediction engine.

MedUPI is a **HIGH-risk Chitti** (medical). Per [SAHAYAI_MASTER.md §2f](../../SAHAYAI_MASTER.md)
no swarm-learned pattern reaches `skills/*.md` without Sire's explicit approval.

---

## The panel — 6 agents (Level 6)

| Agent | Judges | Backing service | Can it BLOCK a result? |
|---|---|---|---|
| [Composition Match](composition_match_agent.md) | strict molecule + strength + form — zero cross-molecule leakage | `medupi_alternatives.find` → `medupi_database.search_by_composition` | ✅ **hard veto** (the safety supreme) |
| [Pricing](pricing_agent.md) | NPPA ceiling as a hard cap + Jan Aushadhi cheapest | `medupi_pricing.annotate_savings` · `medupi_jan_aushadhi` | ✅ flags `above_nppa_ceiling` |
| [Risk](risk_agent.md) | H / M / L molecule risk band | `medupi_risk.classify` | ✅ gates the UI banner |
| [Savings](savings_agent.md) | honest ₹ / % saved vs branded, never inflated | `medupi_pricing` · `_savings_summary` | ✅ forces `price_data_updating` over fake 0% |
| [Safety Disclaimer](safety_disclaimer_agent.md) | server-enforced medical disclaimer; refuses diagnosis | `_disclaimer_en` / `_disclaimer_hi` | ✅ blocks any response missing the disclaimer |
| [Trust](trust_agent.md) | anti-overconfidence; "consult your pharmacist" on low confidence | recognition `confidence` · freshness badges | ❌ advisory — can soften, never silence |

**Composition Match and Safety Disclaimer hold absolute vetoes.** A result that
fails strict composition matching, or that would render without the disclaimer,
is *never shown* — it is rephrased or replaced with an honest "no equivalent found".

---

## How the swarm composes a verdict

```
1. Composition Match  → strict same molecule + strength + form set (or empty)
2. Risk               → classify(molecule) → H | M | L  → banner + STOP-AND-THINK gate
3. Pricing            → annotate_savings + NPPA ceiling flag + Jan Aushadhi cheapest
4. Savings            → honest ₹ / % vs priciest brand (or price_data_updating)
5. Safety Disclaimer  → attach EN + HI disclaimer; refuse if absent
6. Trust              → if confidence low / price stale → prepend "consult your pharmacist"
        ↓
   Synthesized verdict: cheapest card · risk banner · savings line · disclaimer
```

The verdict is **deterministic** — it is assembled from the backend services'
real fields (`alternatives`, `risk.class`, `savings_pct`, `above_nppa_ceiling`,
`freshness_*`). No LLM is required to compose it. DeepSeek vision (`medupi_recognition`)
only *extracts* the strip; the swarm still runs over the extracted molecule.

## Ordering rule — safety before savings
- **Composition is the floor.** No price, no saving, no banner is rendered for a
  set that failed strict matching. Cross-molecule leakage is a P0 defect, not a
  low score (see [sop_incident_wrong_match.md](../sop/sop_incident_wrong_match.md)).
- **Risk gates the tone.** HIGH-risk molecules (insulin, cardiac, psychiatric,
  antibiotics, thyroid, anticoagulants) get a red ⛔ "always ask your doctor"
  banner *before* the savings line. Money never leads on a HIGH-risk result.
- **Honest over impressive.** Savings shows `price_data_updating` rather than a
  fabricated 0% / null when MRP is missing (SAHAYAI_MASTER §3 — honest stubs).

## Swarm learning ([SAHAYAI_MASTER.md §2f](../../SAHAYAI_MASTER.md))

| Cadence | Step |
|---|---|
| **Daily** | Collect anonymised 👍/👎 + 👎→👍 reversals + multi-turn savings traces. user_token stripped, GPS → pincode centroid. |
| **Weekly** | Validate — **≥ 100 confirmations** + cross-region sanity (a Bhopal-only pattern is never pushed as national). |
| **Monthly** | Push validated patterns to [../skills/](../skills/) via a `chitti-founder` PR. |
| **Quarterly** | Audit every skill file for drift / conflicts with locked decisions. |

### Non-negotiable gates (this is a HIGH-risk Chitti)
- **≥ 100 confirmations** before any pattern is a candidate for push.
- **Sire approves every patch** to `skills/*.md` before merge — no silent push to
  a medical Chitti, ever. See [../sop/sop_swarm_skill_update.md](../sop/sop_swarm_skill_update.md).
- **Anonymised always.** No user_token, no raw GPS, no free-text PII in the swarm.
- **"Chitti forget" removes from swarm too** — the user's contribution is wiped and
  replaced with a tombstone so confirmation counts stay honest (§2b + §2f).
- **Locked decisions are not learnable.** The swarm can never relax strict matching,
  drop the disclaimer, suggest a dose, or cross molecules — those are §2 locked.
- **Honest provenance.** Every swarm-added line carries
  `<!-- swarm: 2026-MM-DD, N confirmations, Sire-approved -->`.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
