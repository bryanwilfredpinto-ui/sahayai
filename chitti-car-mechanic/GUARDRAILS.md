# GUARDRAILS (Safety) — Chitti Car Mechanic

Safety is supreme. These are enforced in [`../chitti_car_mechanic_engine.js`](../chitti_car_mechanic_engine.js),
not just documented. Tests in [`../tools/test_car_mechanic.mjs`](../tools/test_car_mechanic.mjs).

## 1. No unsafe DIY — ever
`RULES.never_diy` = airbag, srs, abs, brake, brake_pad, brake_fluid, fuel, fuel_rail, ev_hv,
high_voltage, ac_refrigerant, ac_gas, steering, suspension, timing_belt, transmission, engine_internal.
`diyTriage()` hard-overrides any of these to 🔴 **Mechanic only** regardless of input.
*Test:* airbag/brake/fuel-rail/ev-hv/steering → `level==='red'`. **A green/yellow on these is a P0 defect.**

## 2. Never claim certainty
Every diagnostic returns `{confidence, canDrive, risks[], sources[]}`. `symptomCoach`/`obdLookup`
lead with a drive/don't-drive verdict; safety-critical cases force `canDrive:false`.
*Test:* grinding brakes → `canDrive:false`; overheating → `canDrive:false`.

## 3. No fabrication (hallucination gate, CEOS §25)
Unknown symptom or OBD code → `found:false`, `canDrive:null`, message "I'm not sure — see a mechanic."
Tyre with no tread/DOT → `verdict:'unknown'`. Battery with no date → `status:'unknown'`.
**Chitti never invents a verdict, a number, or a "safe to drive".**
*Test:* `obdLookup('P9999').found===false && canDrive===null`; `symptomCoach('flux capacitor').found===false`.

## 4. Never guarantee money
Insurance savings, fuel ROI, resale value are **indicative**, labelled, with "never guaranteed" in `risks[]`.
Repair fair-ranges are market averages (`scamCheck` says a genuine OEM part legitimately costs more).

## 5. Privacy first
Vault + Twin are `localStorage` only; nothing leaves the device. "Chitti forget" wipes both.

## 6. Emergency = FAMILY CASCADE, never auto-dial (LOCKED, SAHAYAI §2)
**Reconciliation of CEOS §24:** the CEOS draft said crisis → "Call 108/100". The platform lock is
absolute — *family cascade, never auto-dial 112/100/102*. So `crisisCheck()`:
- returns `autoDial:false` (Chitti NEVER dials on its own),
- cascade = confirm-safe → alert family → *then, only if the user says yes*, help place a call,
- emergency numbers are presented as **user-confirmed** options (Golden Rule `chittiConfirmAndDo`).
*Test:* `crisisCheck('accident').autoDial===false` and cascade present.

## 7. Golden Rule on every side-effect
Any action that produces a side effect (set a reminder, place a call, renew) must route through
`chittiConfirmAndDo()` (Vaani) — Chitti asks, waits for explicit "haan"/tap, never defaults to yes,
never times out into yes. The page itself takes no side-effecting action without confirmation.

## 8. Honest stubs over fake demos
Features needing DeepSeek/vision/live-APIs/Turso ship as visible **COMING SOON**, never faked
(BO11–BO15 in [BUILD_ORDER.md](BUILD_ORDER.md)).
