🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Elderly User (Persona: Kamala-amma, ~15 crore Indians 60+)

> The elderly user is **the single most-targeted scam victim** in Indian markets — the person who
> gets the daily "₹50,000 → ₹2,00,000 GUARANTEED" WhatsApp forward. For her the hero feature is not
> a chart; it is the **Tip Shield**. She often overlaps low-vision + hard-of-hearing. Implements
> [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2, 8 (Guardian, not croupier) and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What she needs
- **Large type, high contrast, slow clear speech**, and **repeat-on-demand** — she will ask twice.
- A patient, unhurried tone — **no countdown timers, no urgency** (the opposite of the scam she gets).
- A **safe second opinion** before she sends money, in her own language.
- To not be made to feel stupid for asking — a guardian, not a salesman.

## How Chitti Technicals serves her
| Need | Implementation |
|---|---|
| Large / high-contrast | Base ≥17px scaling cleanly to 200%; high-contrast theme; never colour-only verdict (shape + word) |
| Slow, repeatable voice | Slower TTS rate; 🔊 "repeat" on every box; she can say "phir se bolo" any number of times |
| Tip Shield (hero) | Forward a tip → deterministic scam-pattern check (guaranteed-returns / pump / unregistered-advisor / urgency) → *"Real advisors never guarantee returns. This looks like a scam, amma. Chitti is not telling you to buy."* |
| No urgency, ever | **No timers, no "only 4 seats left," no "buy now"** — Chitti's tone is the antidote to the scam's tone (Art. 8) |
| Cross-link to help | Offers to report via Chitti Legal / Chitti UPI; suggests calling family (family-cascade, never cops) |
| Honest rail | Every read carries "most short-term traders lose — SEBI" + NOT-SEBI line, spoken + shown |

## Failure modes to prevent
- Any **countdown / urgency / "act now"** UI → it mimics the scammer → defect (Art. 8).
- Small fixed-size text or a verdict she can't enlarge to 200% → defect.
- TTS too fast with no repeat → she misses it, feels stupid, leaves → defect.
- Tip Shield that **stays silent** on a guaranteed-return forward → the one job it has → defect.
- A confident "Strong Buy" with a fake accuracy badge pushed at her → predatory → defect (Art. 4).

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO5 gate)
**Simulate: low vision (200% zoom) + one ear muted + slow tester.** Tamil selected:
1. Set 200% zoom → verdict + Tip Shield fully readable, reflow intact at 320px-equivalent.
2. Forward "₹50,000 → ₹2 lakh GUARANTEED, 4 seats left" → Tip Shield speaks + shows the scam verdict, naming the trigger words.
3. Say "phir se bolo" twice → it repeats at a slow rate.
4. Confirm **no timer / urgency** anywhere on the surface.
5. Confirm the report-it cross-links (Legal/UPI) and the family-cascade suggestion appear.
**Pass = she gets a safe, slow, large, repeatable scam verdict with zero urgency.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
