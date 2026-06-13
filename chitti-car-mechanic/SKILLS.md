# SKILLS (12) — Chitti Car Mechanic

Each skill maps to a deterministic function in [`../chitti_car_mechanic_engine.js`](../chitti_car_mechanic_engine.js)
and a UI surface in [`../chitti_car_mechanic.html`](../chitti_car_mechanic.html).

| # | Skill | Engine function | UI |
|---|---|---|---|
| 1 | Document Vault | `vault.{load,save,set,forget}` | My Car tab |
| 2 | Smart Reminder | `reminders()` | Reminders tab |
| 3 | Insurance Intelligence | `insuranceCompare()` | Insurance·PUC tab |
| 4 | PUC Intelligence | `pucStatus()` | Insurance·PUC tab |
| 5 | Service Intelligence | `oilRecommendation()`, `mechanicCompare()`, `SERVICE_COSTS` | Service·Oil tab |
| 6 | Tyre Intelligence | `tyreRecommend()`, `tyreHealth()` | Tyre·Battery tab |
| 7 | Battery Intelligence | `batteryStatus()` | Tyre·Battery tab |
| 8 | Diagnostics & OBD | `obdLookup()` | Diagnose tab |
| 9 | Scam Detection | `scamCheck()` | Fair price tab |
| 10 | Buy/Sell Assistant | `buyScore()`, `sellAssistant()` | Buy/Sell tab |
| 11 | Savings Tracker | `savingsTracker()` | My Car tab |
| 12 | Accessibility Coaching | `chitti_a11y.js` + `cmSpeak`/`cmReadPage` + `chitti_lang.js` | whole page |

Plus: `symptomCoach()` (AI Coach), `fuelROI()`/`fuelCompare()` (Fuel Intelligence),
`ownershipScores()`, `crisisCheck()` (family-cascade emergency), `diyTriage()` (safety triage).
Every function returns `{confidence, risks[], sources[]}`; many add `canDrive`.
