🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Tip Shield Eval — the anti-scam moat must catch the pump

> Subordinate to [../EVALS.md](../EVALS.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Article 8 ("Guardian, Not Croupier").
> **Hard target: 0 misses on the gold set.** A scam tip the shield lets through is the worst failure in the product — that is the senior-citizen being cold-called.
> **Status: 🔵 PENDING** — to be filled when `node tools/test_tip_shield.mjs` runs (BO8).

---

## Why Tip Shield is the moat

The real buyer is the semi-literate vernacular investor — and his parent — being pitched a "tip" on WhatsApp. Tip Shield is the feature no chart app has: paste/forward a tip → **deterministic scam-pattern check** → *"this looks like a scam, Chitti is not telling you to buy."* It is a guardian act (Article 8), not a signal. It is deterministic (rules, not LLM mood) so it is auditable by a blind user.

## Scam patterns detected (deterministic rules)

| Pattern | Trigger | Verdict weight |
|---|---|---|
| **Guaranteed returns** | "guaranteed", "100% sure", "fixed profit", "no loss" | 🔴 high |
| **Pump language** | "to the moon", "multibagger guaranteed", "act before it's gone" | 🔴 high |
| **Unregistered advisor** | "join my paid group", "DM for tips", no SEBI reg number | 🔴 high |
| **Urgency / FOMO** | "only today", "last chance", "buy in next 10 min" | 🟠 medium |
| **Target without risk** | a target price with no stop / no downside (violates Article 5 ethos) | 🟠 medium |
| **Authority spoof** | "RBI approved", "SEBI insider", "fund manager leak" | 🔴 high |

A tip crossing the threshold → verdict **SCAM / LIKELY SCAM**, plain-language explanation in the user's language, and a cross-link to **Chitti UPI** (fraud) / **Chitti Legal** (recourse). Chitti **never** says "buy" — only "be careful, Sire."

## Gold cases

Cases live in [datasets/tip_shield_cases.json](datasets/tip_shield_cases.json). Each is **tip text → expected verdict + matched patterns**, including at least:
- a clear guaranteed-returns scam,
- a pump-and-dump,
- an unregistered paid-group pitch,
- an urgency/FOMO scam,
- a benign neutral message (must **not** false-positive),
- a legitimate-sounding but unregistered "insider" spoof.

## Method

1. `node tools/test_tip_shield.mjs` loads each case.
2. Runs the tip text through the deterministic pattern engine.
3. Asserts the **verdict** (SCAM / LIKELY SCAM / CLEAN) matches gold.
4. Asserts the **matched pattern set** matches gold (explainability — a blind user must hear *why*).
5. Asserts **0 false positives** on the benign case.
6. Asserts the verdict carries **"Chitti is not telling you to buy"** + NOT-SEBI.

## Pass criteria (target — not yet measured)

- **0 misses** on the scam gold cases (no scam classified CLEAN).
- **0 false positives** on benign cases.
- Matched-pattern explanation present on **100%** of flagged tips.

## Results

| Metric | Target | Measured | Status |
|---|---|---|---|
| Scam recall (misses) | 0 misses | _to be filled_ | 🔵 PENDING |
| False positives (benign) | 0 | _to be filled_ | 🔵 PENDING |
| Pattern explanation present | 100% | _to be filled_ | 🔵 PENDING |
| "Not telling you to buy" + NOT-SEBI | 100% | _to be filled_ | 🔵 PENDING |

Cross-checks: [safety_eval.md](safety_eval.md) (tip routing) · [hallucination_eval.md](hallucination_eval.md) (LLM never softens a SCAM verdict).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
