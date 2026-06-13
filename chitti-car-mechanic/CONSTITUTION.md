# CONSTITUTION — Chitti Car Mechanic (12 Articles)

Each article maps to where it is **enforced in code/UI**. Engine = `../chitti_car_mechanic_engine.js`,
Page = `../chitti_car_mechanic.html`.

| # | Article | Enforcement |
|---|---|---|
| 1 | **Access First, Vehicle Second** — no feature without accessibility for all 9 archetypes | Page loads `chitti_a11y.js` (profile, ISL, read-page) + `feedback-widget.js` (🔊🤖👍👎✏️) + `chitti_lang.js` (26 langs). Cert proves G1–G5, lang firing, tap≥44px, axe-clean. |
| 2 | **Multi-Modal by Default** — visual + audio (+ haptic) | Every result box has a 🔊 read-aloud button (`cmSpeak`); page-wide 🔊 Read page; symbol+word status never colour-only. |
| 3 | **Mechanic Available 24/7/365** — no downtime | Deterministic engine runs offline; no LLM/network in the critical path. |
| 4 | **Document Vault — Privacy First** — local only; "Chitti forget" deletes all | `vault.*` + `twin.*` use `localStorage`; `vault.forget()`/`twin.forget()` wipe. No server write. |
| 5 | **Smart Reminder — Never Miss Anything** | `reminders()` covers insurance/PUC/RC/warranty/EMI + 10 service items. |
| 6 | **Best Parts & Tyres by model/usage/budget** | `tyreRecommend()`, `oilRecommendation()`, `batteryStatus()`. |
| 7 | **Insurance Comparison Mandatory** — 8+ insurers, show savings | `insuranceCompare()` ranks 8 insurers (CSR + indicative price); honest "confirm the quote". |
| 8 | **Safety First — Clear Triage** 🟢/🟡/🔴 | `diyTriage()` with hard `RULES.never_diy` override; airbag/brake/fuel/EV-HV/AC always 🔴. |
| 9 | **Honest Savings — never guaranteed** | `savingsTracker()` only counts logged realised savings; all engines say "never guaranteed". |
| 10 | **Journal Everything** | `twin` stores docs/service/savings; reminders read it. |
| 11 | **Indian 4W Market First** | `BRANDS` = 19 India brands (Maruti…Citroën). |
| 12 | **Open & Auditable** — deterministic, reproducible, inspectable | Pure JS, versioned `RULES`; `node tools/test_car_mechanic.mjs` reproduces every number. |

**Conflict-resolution order (ROLE):** Safety > Education > Trust > Engagement > Revenue. Locked
SAHAYAI §2 decisions are absolute and override this Constitution where they touch (LLM=DeepSeek,
emergency=family-cascade-never-cops, Vaani-sole-interface, four-user contract).
