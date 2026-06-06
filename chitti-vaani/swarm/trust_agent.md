# Agent 6 — Trust Agent

> Swarm Agent 6 of 6 for Chitti Vaani. The last gatekeeper before the response
> reaches the user. Runs after Action Agent.
> Enforces honesty, confidence bands, legal disclaimer, and the anti-overconfidence
> contract across all 14 Chitti targets.
> Per SAHAYAI_MASTER.md §2 (knowledge-corpus expert grades + GUARDRAILS.md).

---

## Purpose

1. Verify the assembled response is honest and does not overstate certainty.
2. Attach the correct confidence band (HIGH / MED / LOW) to every response.
3. Ensure the legal disclaimer is always present.
4. Flag fabricated data (invented phone numbers, non-existent schemes, made-up medicine prices).
5. Emit the per-response trust strip rendered on the user-facing card.

---

## Input

```json
{
  "assembled_response": {
    "text": "Paracetamol 500mg Jan Aushadhi mein Rs. 2 per strip milti hai.",
    "source": "chitti-medupi",
    "route_confidence": 0.91,
    "data_freshness": "2026-06-05T09:00:00Z"
  },
  "empathy_output": { "helpline_required": false },
  "action_output": { "action_gated": false },
  "lang": "hi"
}
```

---

## Output

```json
{
  "verified_response": {
    "text": "Paracetamol 500mg Jan Aushadhi mein Rs. 2 per strip milti hai.",
    "disclaimer_appended": true,
    "disclaimer_text": "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.",
    "confidence_band": "HIGH",
    "confidence_score": 0.91,
    "data_freshness_label": "Verified 2026-06-05",
    "stale_flag": false
  },
  "trust_strip": {
    "confidence_band": "HIGH",
    "confidence_score": 0.91,
    "source": "chitti-medupi",
    "disclaimer_present": true,
    "fabrication_check": "PASS",
    "stale": false,
    "as_of": "2026-06-06T07:00:00Z"
  },
  "blocked_items": [],
  "honest_notes": [],
  "warnings": []
}
```

For a LOW-confidence response:
```json
{
  "verified_response": {
    "confidence_band": "LOW",
    "confidence_score": 0.44,
    "honest_note": "Main iss sawaal ke baare mein pakka nahi hun — please ek expert se confirm karein."
  },
  "trust_strip": { "confidence_band": "LOW", "confidence_score": 0.44, ... }
}
```

---

## Confidence Bands

| Band | Score range | User-facing label | Action |
|---|---|---|---|
| HIGH | >= 0.80 | "Chitti is confident" | No extra flag |
| MED | 0.50 – 0.79 | "Please verify" | `honest_note` appended |
| LOW | < 0.50 | "Chitti is not sure" | `honest_note` + `verify_with` guidance |

**Confidence below 0.70:** the `honest_note` explicitly names where to verify
(e.g. "FSSAI portal" / "your CA" / "Jan Aushadhi store near you").

**Confidence below 0.50:** Vaani speaks the uncertainty before the answer:
*"Main iss mein pakka nahi hun, lekin mujhe lagta hai..."*

---

## Anti-Fabrication Checks

### 1. Phone number verification
Any phone number in the response (e.g. a helpline, a shop contact) must be
traceable to a stored, verified source — the trusted-circle table or the
verified helpline list (GUARDRAILS.md §4-5). If a number appears that has no
verified source, it is blocked and `fabrication_check = FAIL`.

### 2. Medicine price verification
Medicine prices from `chitti-medupi` must be traceable to the Jan Aushadhi
pricelist or a verified pharmacy source. A price that cannot be sourced is
flagged as `stale_flag = true` and the response carries a data-freshness caveat.

### 3. Government scheme verification
Scheme details from `chitti-government` must be traceable to a PIB announcement
or the official portal URL. Unverified scheme benefits are flagged.

### 4. Legal / CA claim verification
Legal and CA responses from `chitti-legal` / `chitti-ca` must cite the applicable
act, section, or rule. A legal claim without a citation is downgraded to MED
band and carries `honest_note: "Please verify with a qualified professional."`.

### 5. Inflated-claim scan (regex)
```
/guarantee[ds]?/i
/assured.{0,20}(job|income|return)/i
/100%.(safe|accurate|certain)/i
/will definitely/i
/you will (definitely|certainly|surely)/i
```
Any hit is removed from the response and logged in `warnings`.

---

## Legal Disclaimer Contract (Server-Enforced)

Every Vaani response MUST carry:

> *"Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo."*

This is enforced by `_enforce_disclaimer()` in `vaani_service.py`.  The Trust
Agent verifies the disclaimer is present in the `verified_response.text` AFTER
the model has run.  If the model omitted it, the Trust Agent reinserts it.
The client never controls whether the disclaimer appears.

For psychology-path responses, the Trust Agent also verifies that the four-helpline
strip is present (cross-checked with `empathy_output.helpline_required`).

---

## Trust Strip Rendering

The trust_strip object is rendered on every response card as a small verification
footer (matching the Chitti News AI / Chitti MedUPI pattern):

```
[HIGH confidence] Source: Chitti MedUPI · Verified 2026-06-05 · Yeh AI ki madad hai.
```

For LOW confidence:
```
[LOW — Chitti is not sure] Please verify with your pharmacist.
```

The strip is spoken aloud for blind users: *"Chitti ko yeh jawab mein zyada
bharosa nahi hai — please apne pharmacist se confirm karein."*

---

## Guardrails

- **Disclaimer is never client-controlled.** The server enforces it; Trust Agent
  verifies it; client renders it.
- **Fabricated data blocks the response.** A response with an unverifiable phone
  number or an invented scheme benefit is blocked entirely (`fabrication_check = FAIL`).
  The user sees an honest error: *"Mujhe sahi jawab nahi mila — please ek expert se poochein."*
- **Stale data is flagged, not suppressed.** Data older than the freshness
  threshold (set per-Chitti) carries `stale_flag = true` and the trust strip
  shows the last-verified date. Stale data is never silently served as current.
- **No overconfidence.** The Trust Agent can **downgrade** a confidence score
  if the assembled response shows signals of overreach (e.g. a Chitti claiming
  a medicine cures a condition, or a legal Chitti giving a definitive verdict
  without citing precedent).

---

## Voting / Escalation

The Trust Agent is the final agent.  Its output is what the user receives.
It can:
- Block a response (`fabrication_check = FAIL`) — returns honest error.
- Downgrade confidence band — adds honest_note.
- Reinsert disclaimer — modifies response text.
- Flag stale data — adds stale_flag to trust strip.

The Trust Agent does not raise to Safety Agent — Safety runs before Trust.
If the Trust Agent finds a safety-relevant fabrication (e.g. a wrong emergency
number), it blocks the response and the CTO is notified via the founder dashboard.

---

## Swarm Learning

The Trust Agent is a candidate for swarm improvement at LOW-to-MED risk:

Patterns the swarm CAN learn (Sire review for MED):
- Better freshness thresholds per data type.
- Better inflated-claim regex patterns.
- Confidence-band calibration (if route_confidence 0.72 consistently correlates
  with user thumbs-down, the MED band upper threshold can be adjusted).

Patterns the swarm CANNOT change:
- The disclaimer requirement and its text.
- The fabrication-check block behaviour.
- The four-helpline strip requirement for psychology-path responses.
- The "never client-controlled" rule for the disclaimer.

---

## Test

`backend/tests/test_trust_agent.py`:
- `test_disclaimer_always_present` — model omits disclaimer -> Trust Agent reinserts.
- `test_fabricated_phone_blocks_response` — unverifiable phone -> fabrication_check = FAIL.
- `test_low_confidence_adds_honest_note` — score 0.44 -> honest_note + LOW band.
- `test_inflated_claim_stripped` — "guaranteed cure" -> removed + warning logged.
- `test_stale_data_flagged` — data > freshness threshold -> stale_flag = true.
- `test_psychology_helpline_strip_verified` — empathy helpline_required = true -> strip present.

---

Last reviewed: 2026-06-06
