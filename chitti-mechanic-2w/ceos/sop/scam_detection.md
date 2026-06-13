🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# SOP — Scam Detection, Buy & Sell Assistant

Covers: **Scam Detector**, **Pre-Purchase Inspection & Buy Assistant**, **Sell Assistant**,
and **Savings Tracker**.

## Goal
Stop the user being conned — on a service bill, a used-bike purchase, a sale, or an
insurance/PUC fraud — and total up what they saved.

## Scam detection flow
1. **Take the bill / quote / offer** by voice or entry.
2. **Compare to fair bands** (versioned tables) — flag inflated labour, ghost parts,
   "urgent" repairs that aren't, duplicate line items, unnecessary part swaps.
3. **Explain plainly** what's normal vs what's a con, in the user's language, read aloud.
4. **Arm the user** — exactly what to say back to the workshop/seller.
5. **Log the save** to the Savings Tracker when a scam is avoided.

## Pre-Purchase (Buy Assistant)
- A walk-the-bike checklist: papers (RC/insurance/PUC match the seller?), engine, frame,
  chassis number, accident signs, tyres, battery, service history.
- **Fair price band** for the model/year/km — a range, never a guaranteed figure.
- **Walk-away red flags** — mismatched papers, tampered odometer, no RC, flood/accident signs.
- 🔵 Live RC/challan lookup (mParivahan/DigiLocker) is COMING SOON.

## Sell Assistant
- Fair resale value (range), what to fix first for the best return, transfer paperwork
  steps, how to avoid being lowballed.

## Savings Tracker
- Every avoided scam, cheaper genuine part, right insurer choice → totalled toward the
  **₹10,000+ yearly goal**, read aloud with the running total.

## Rules
- **Never guarantee** a price, saving, or resale figure (see
  [../guardrails/no_guarantee.md](../guardrails/no_guarantee.md)).
- **Never invent** a fair-price number, insurer premium, or service centre → "I'm not
  sure" (see [../guardrails/hallucination.md](../guardrails/hallucination.md)).
- Every flag carries `{confidence, risks[], sources[]}`.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
