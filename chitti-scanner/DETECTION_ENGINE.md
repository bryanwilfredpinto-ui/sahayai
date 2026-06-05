🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# DETECTION_ENGINE — Level 3 · the brain before routing

> "Before routing, determine **category** + **confidence**." This is the Universal
> Detector. It is **deterministic-first**: rules and the backend `type` field decide the
> category; the vision LLM only *enhances* when funded. Subordinate to
> [CONSTITUTION.md](CONSTITUTION.md).

## Output contract

Every detection emits exactly:

```json
{
  "category": "medicine",
  "confidence": 0.98,
  "alternatives": [ {"category": "food", "confidence": 0.01},
                    {"category": "document", "confidence": 0.01} ],
  "signals": ["matched: paracetamol", "matched: mg", "matched: exp"],
  "mode": "classified"          // or "describe_or_pick" when vision is unfunded
}
```

- `confidence` is honest. Below the threshold (default **0.55**) → `category = "unknown"`
  and `mode = "describe_or_pick"`. **Never coerce `unknown` into a guess.**
- `signals` is the audit trail the Explanation Layer reads back to the user (no black box).

## Category taxonomy

```
document      medicine      food        human        appliance
vehicle       crop          fashion     animal       building
fraud_signal  unknown
```

Sub-types refine routing (e.g. `human → skin/eye/wound`; `document → legal/government/
education/career/bill/mrp/insurance`). See [ROUTING_ENGINE.md](ROUTING_ENGINE.md).

## Detection sources, in priority order

1. **Backend `type`** (existing `analyze_text` / `analyze` response):
   `food · medicine · legal_doc · bill · mrp · insurance · other` → mapped to a category.
2. **Client-side keyword rules** (work offline, zero spend): keyword → category with a
   weight. Multiple matches raise confidence; conflicting matches lower it.
3. **Vision LLM (OPTIONAL, COMING SOON)** — DeepSeek-vision describes visible features of a
   camera frame for categories rules can't infer (a fan, a leaf, a wound). Paid, user-borne,
   opt-in. Until a key is funded, the camera path returns `mode: "describe_or_pick"`.

## Deterministic keyword map (illustrative — full table in [routing/routing_table.md](routing/routing_table.md))

| Category | Strong signals (examples) |
|---|---|
| medicine | `paracetamol, mg, tablet, capsule, exp, mfg, batch, ip, composition, Rx` |
| food | `fssai, ingredients, energy kcal, sugar, sodium, best before, mrp ₹` |
| vehicle | `dashboard, engine, tyre, brake, mileage, obd, dtc, rpm, coolant, chassis` |
| fashion | `cotton, size m, wash care, polyester, fabric, garment, footwear, jewellery` |
| government_doc | `aadhaar, pan, passport, ration, scheme, yojana, gazette, form, eligibility` |
| legal_doc | `notice, summons, eviction, section 138, demand, agreement, arbitration` |
| career_doc | `resume, cv, offer letter, ctc, designation, experience, skills` |
| crop | `leaf, pest, fungus, blight, soil, fertiliser, pesticide, crop, mandi` |
| appliance | `fan, ac, fridge, compressor, voltage, warranty, model no, watt` |
| fraud_signal | `upi, qr, otp, prize, lottery, kyc update, click link, refund, bank` |
| human/health | `skin, rash, mole, wound, eye, swelling, burn, lab report, hemoglobin` |

> **Health detection never names a disease.** A `human/health` detection routes to the
> Health Scanner, which describes only visible features + urgency and escalates to a
> doctor. The disease-name safety envelope is inherited from the Health Scanner.

## Confidence + honesty rules

- **High (≥ 0.85):** route directly; speak *"This looks like a medicine — sending it to
  MedUPI."*
- **Medium (0.55–0.85):** route but offer one alternative; speak *"This looks like a
  medicine. If that's wrong, tap here."*
- **Low (< 0.55):** `unknown`; ask *"I'm not sure what this is — can you describe it, or
  pick a category?"* Present the picture menu (icons) for illiterate users.
- **Conflicting strong signals** (e.g. an invoice that is also a UPI screenshot): present
  the top 2 categories as choices; never silently pick one.

## What detection does NOT do

- It does not diagnose, prescribe, or give a legal/financial verdict.
- It does not fabricate a category to avoid an honest `unknown`.
- It does not run the vision LLM silently — vision is opt-in + cost-disclosed.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
