# PRD — Chitti Car Mechanic

## Problem
Indian car owners (esp. livelihood drivers + vernacular/non-technical/disabled owners) cannot
independently answer: *is this serious, can I drive, is this quote fair, did this used car crash,
which oil/tyre, when is PUC/insurance/service due?* — and pay for it in money, safety and stress.

## Goals
Free, neutral, voice-first, offline-first mechanic-in-the-pocket covering the full ownership lifecycle,
accessible to all 9 archetypes in 26 languages, with calibrated honesty and safety supremacy.

## Functional requirements (→ engine fn · UI tab)
1. Diagnose by symptom → `symptomCoach` · Diagnose
2. Decode OBD code → `obdLookup` · Diagnose
3. DIY-vs-mechanic triage → `diyTriage` · Diagnose
4. Quote fairness / scam → `scamCheck` · Fair price
5. Used-car buy score + negotiation → `buyScore` · Buy/Sell
6. Sell valuation → `sellAssistant` · Buy/Sell
7. Reminders (15 types, date+km) → `reminders` · Reminders
8. Insurance compare + add-ons → `insuranceCompare` · Insurance·PUC
9. PUC status → `pucStatus` · Insurance·PUC
10. Oil + service + mechanic compare → `oilRecommendation`/`mechanicCompare` · Service·Oil
11. Tyre health + recommend → `tyreHealth`/`tyreRecommend` · Tyre·Battery
12. Battery status → `batteryStatus` · Tyre·Battery
13. Fuel compare + CNG/EV ROI → `fuelCompare`/`fuelROI` · Fuel
14. Vehicle Twin + scores + savings → `twin`/`ownershipScores`/`savingsTracker` · My Car
15. Emergency cascade → `crisisCheck` (family-first, never auto-dial)

## Non-functional
Offline-first · no sign-up · no LLM in critical path · `{confidence,risks,sources}` on every result ·
WCAG AA · 18px/48px · 375px-first · 26 langs · per-response widget on every card · privacy: local-only.

## Out of scope
Booking, dispatch, selling parts/cars, fitness certification, certainty claims, auto-dialling.

## Acceptance
`node tools/test_car_mechanic.mjs` 97/97 + `node tools/cert_car_mechanic.mjs` 37/37 (incl. 5 device
screenshots, lang firing, axe 0 serious). See [CEOS_TRACEABILITY.md](CEOS_TRACEABILITY.md).
