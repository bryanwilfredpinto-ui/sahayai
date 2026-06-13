# Chitti Car Mechanic — Reference Research (20 apps + 20 AI apps)

**Created:** 2026-06-13 · **Owner:** Bryan Wilfred Pinto (Sire) · **Author:** Chitti CTO (Claude Opus 4.8)
**Status:** Step 1 of the locked new-products process (SAHAYAI_MASTER §2a) — research BEFORE any code.
**Scope note:** This is a **complete fresh rebuild** in a NEW folder (`chitti-car-mechanic/`). The legacy
`chitti-4wheeler/` tree is intentionally left untouched per Sire (2026-06-13). Awaiting Sire's CEOS doc set.

---

## 0. Product vision (Sire, 2026-06-13)

> A mechanic who is **with the user 24 hours, 365 days**. On a breakdown, instead of going to a mechanic,
> Chitti guides the user to repair minor issues himself. If the user has no vehicle and wants to **buy a
> second-hand car**, Chitti (as a mechanic) checks whether it had **major accidents** etc. Chitti also
> **suggests the best vehicle** for a new buyer. Reminds about **services due**, **which oil**, **which
> tyres** to change, **genuine vs fake parts**, and reminds about **PUC + insurance**.

### The 6 capability pillars (this is what we are building)
1. **24/7 breakdown + minor-repair coach** — diagnose, then guide a safe DIY fix or escalate.
2. **Used-car pre-purchase inspector** — accident / odometer / loan / legal history + condition check.
3. **New-car buying advisor** — recommend the best vehicle for the user's real need + true cost to own.
4. **Service / oil / tyre intelligence** — when due, which oil grade, which tyre size, tread/age checks.
5. **Genuine vs fake parts detection** — scan QR / hologram, verify against OEM database.
6. **PUC + insurance + RC reminder engine** — proactive renewal alerts, one-tap renewal, document vault.

---

## PART A — 20 Conventional reference apps

### Cat 1 — OBD2 / diagnostics scanners
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **Torque Pro** | Android | Live ECU data via ELM327 | Customizable "what my car is telling me now" live panel |
| **Car Scanner ELM OBD2** | Android/iOS | Reads/clears faults across ALL modules | Scan **every** control module, not just the engine MIL |
| **FIXD** | Android/iOS + dongle | Plain-language fault + severity + consequences | **Plain-language translation + "what if you ignore it" + family multi-car** |
| **Carly** | Android/iOS + dongle | TÜV-endorsed diag + repair guides | **Used-car ECU mileage-fraud detection** |
| **BlueDriver / OBDeleven** | Android/iOS + dongle | Verified-fix reports / one-click apps | **"Top reported fixes for this code"** crowd ranking; no-paywall trust model |

### Cat 2 — maintenance / service-log / reminders
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **Drivvo** | Android/iOS | Expense + fuel + maintenance log, repair-cost estimates | True ₹/km cost-of-ownership |
| **Fuelio** | Android/iOS | Fuel + reminders | **Dual-trigger reminders (date OR km, whichever first)** |
| **aCar / Fuelly** | Android/iOS | Log + community mileage benchmark | "Your Swift gives 16; similar give 18 — get it checked" (swarm) |
| **Simply Auto** | Android/iOS | Logs + camera receipt capture | **Snap-the-bill → auto-log** (read aloud for elderly/illiterate) |
| **CARFAX Car Care** | Android/iOS | Due dates + history + recalls | **Automatic safety-recall alerts** + localized repair-cost estimate |

### Cat 3 — used-car inspection / history / valuation
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **Spinny** | App/web | 200-point inspection, 1-hr report, warranty | Structured shareable checklist; camera-assisted DIY version |
| **Cars24** | App/web | Instant valuation + buy/sell + inspection | Instant on-the-spot valuation engine |
| **Droom OBV** | App/web | Algorithmic price, Fair/Good/Excellent grade | **Condition-graded instant valuation**; "Droom History" CARFAX-for-India |
| **CARFAX / AutoCheck** | App/web | VIN accident/title/odometer history | **Accident + odometer-rollback report** (India gap to fill) |

### Cat 4 — new-car buying advisors
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **CarWale** | App/web | Compare across 200+ params | Side-by-side narrowed to "best for YOU" |
| **CarDekho** | App/web | On-road price, EMI break-up, owner reviews | **Owner reviews (real mileage/niggles) + EMI total-payable** |
| **Edmunds / KBB** | App/web | Fair price + True Cost to Own | **5-year True Cost to Own** (depreciation+fuel+service+insurance) |
| **ZigWheels / Team-BHP** | App/web/forum | Expert + long-term ownership reviews | **"After 50,000 km, here's what broke"** trust signal |

### Cat 5 — tyre selection
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **Michelin Tyre Selector** | Web | Vehicle → exact OE tyre size | **Vehicle-led fitment** (no sidewall code reading) |
| **MRF / Apollo / CEAT finders** | App/web | India sizing + dealer + price | India dealer+price+size in one flow; + camera tread/DOT-age check |

### Cat 6 — genuine vs fake parts
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **Maruti "Scan & Assure"** | Android/iOS | QR scan → genuine/fake verdict | **One-tap QR → verdict**; guide hologram/scratch check via camera |
| **Bosch (Origify / app)** | Android/iOS | Code + QR + hologram + surface fingerprint | **Multi-layer verify**, incl. optical surface fingerprint without QR |

### Cat 7 — PUC + insurance + RC reminders
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **mParivahan (Govt/Vahan)** | Android/iOS | Reg-no → auto RC/DL/PUC, legally valid | **Reg-number → auto-fetch all official data** (one-number onboarding) |
| **ACKO** | Android/iOS | Garage: insurance+challan+FASTag+PUC reminders | **Unified Garage + proactive reminders + 1-tap renewal** |
| **Policybazaar** | Android/iOS | Multi-vehicle renewal reminders + compare | **Shop best renewal price** (don't blindly auto-renew) |
| **DigiLocker (Govt)** | Android/iOS | Legally-valid document wallet | Store all car papers; produce on demand |

### Cat 8 — roadside assistance / breakdown
| App | Platform | What it does | ★ Copy-worthy |
|---|---|---|---|
| **GoMechanic Top Assist** | Android/iOS | 24/7 flat/jump/lockout/fuel/tow/medical | **Granular breakdown menu + ambulance escalation** (fits family cascade) |
| **Pitstop Connect** | App + telematics | Predict failure 94–95% accuracy, risk-tiered | **Predict-the-breakdown-before-it-happens**, critical/major/minor |
| **Park+** | Android/iOS | FASTag+challan+PUC+RC+insurance hub | **Single "everything about my car" hub** with reminders |
| **Insurer RSA (Bajaj/Europ)** | App/hotline | Bundled towing/repair/fuel/battery | Detect RSA **already bundled in user's insurance** (don't pay twice) |

---

## PART B — 20 AI-powered reference tools

### Cat 1 — AI "describe your problem" diagnostic chatbots
- **MECH AI** — LLM over fault KB → **cause + cost + DIY-difficulty score** (the voice-answer shape).
- **FIXD AI Mechanic** — LLM **grounded in live OBD sensor data** (cite, don't override).
- **Carly Smart Mechanic** — **per-fault severity gauge** + step-by-step guides + odometer-fraud detection.
- **RepairPal Fair Price** — cost as a **range with honesty caveat**, grounded in real parts+labor data.
- **AutoMD** — AI estimate + **nearby vetted-shop discovery + reviews** (close the loop).

### Cat 2 — AI sound diagnosis
- **AI Mechanic: Engine Sound Scan** — "Shazam for engine noise"; value is **severity triage** (lifter tick vs rod knock).
- **MyAutoSound** — **domain-route the sound** (brake/engine/exhaust/suspension) before naming a fault.
- **Škoda Sound Analyser** — **anomaly-vs-known-good baseline** for that model (>90% claimed).
- **Bosch SoundSee** — **predictive acoustic health**; HARD lesson: warn on ambient-noise/confidence (garage ≠ lab).

### Cat 3 — AI dashboard-light recognition (photo)
- **AI DashScan (Zymbia, India)** — CV on the cluster; multi-vehicle-type.
- **DashOrNOT** — one photo → severity + causes + cost + **"can you keep driving?"** verdict + TSBs.
- **Warning Light Camera** — **ranked candidates with confidence** (no single overconfident answer).
- **CarLightScan** — plain-English + **binary "is this serious?"** flag (accessibility tone).

### Cat 4 — AI used-car inspection / damage from photos
- **Tractable** — trained on 100M+ images; **guided capture auto-selects usable frames** + part-level severity+cost.
- **Inspektlabs** — **163-part inspection** from phone; detects **internal** (not just cosmetic) damage.
- **Ravin AI** — guided **360° walk-around** on a normal phone.
- **Cars24 CarTruth / Spinny** (India) — **fuse CV condition with VAHAN/RTO** (accident/loan/challan/court history). *"1 in 4 used cars has accident history."* — **most directly copyable architecture.**
- **Spyne AI** (India) — number-plate auto-masking (privacy) + standardized 360° capture.

### Cat 5 — AI car-buying advisor
- **CarGurus Discover (+ChatGPT plugin)** — **conversational search replacing filters**, grounded in **live inventory + market-value** (explicitly NOT vanilla ChatGPT memory).

### Cat 6 — AI predictive maintenance
- **Pitstop (Fullbay)** — **94% accuracy, failures weeks early, per-component**, 10B+ data points. **Predii** = symptom→matched historical fixes.

### Cat 7 — AI counterfeit-parts detection
- **Acviss / Ennoventure** — serialized QR + invisible crypto markers + **CV hologram anomaly-match against central OEM DB**; self-destruct "VOID" labels. THREAT: gen-AI now clones textures → **never declare genuine from a photo alone; verify against server DB**.

### Cat 8 — general AI-assistant patterns (honesty / multilingual)
- **WayCare.app** — plain-language reminders (oil/inspection/insurance) + document vault, zero jargon.
- **Medical-chatbot uncertainty research (PMC/CIDRAP)** — chatbots confident-but-wrong **~50%**, refuse only 0.8%, score below junior residents on uncertainty. → **Calibrated honesty is non-negotiable**: show/speak confidence, route to "see a mechanic" when unsure, ground+cite evidence.

---

## TOP BEST PRACTICES TO COPY (merged + ranked for an Indian car owner)

1. **Calibrated honesty + safe handoff** — every answer carries a spoken confidence; low → "I'm not sure, see a mechanic." Never fake confidence. (HARD backend gate — safety product for vulnerable users.) Mirrors Chitti Legal/CA RAG's "I cannot find this" refusal.
2. **Three-part diagnosis: Cause + Cost-range + DIY-difficulty** — the canonical voice answer shape.
3. **"Can I keep driving right now?" safety verdict** — first thing a stranded user needs.
4. **Reg-number → auto-fetch RC/PUC/insurance/fitness from Vahan** — zero-typing onboarding foundation.
5. **Used-car: fuse camera condition + ECU odometer + VAHAN/RTO history** into one trust verdict.
6. **One-tap QR/hologram scan → genuine/fake verdict via OEM DB** (never from a photo alone).
7. **Proactive PUC + insurance + challan reminders in one Garage**, one-tap renewal, shop best price, detect RSA already bundled.
8. **Predictive maintenance with stated accuracy + lead time**, risk-tiered (critical/major/minor).
9. **Automatic safety-recall alerts by vehicle** (a near-total India gap).
10. **Dual-trigger service reminders (date OR km)** + **which oil grade / which tyre size** vehicle-led (no code reading) + camera tread-depth & DOT-age check.
11. **5-year True Cost to Own** for new-car advice + owner-review real mileage + EMI total-payable.
12. **Localized repair-cost estimates** to protect against overcharging.
13. **Guided capture that tolerates bad photos** (360° walk-around, auto-frame-select) — essential for low-literacy users.
14. **Conversational/voice search replacing dropdown filters** — core to voice-first accessibility.
15. **Snap-the-bill → auto-log service history** (read aloud) + **swarm benchmarking** (mileage vs similar cars, top-reported-fixes, long-term ownership reports).

---

## India gaps worth turning into a moat
- **No true CARFAX in India** (Droom History is nascent) → a vehicle-history layer stitched from RTO + insurance-claim + FASTag + service signals would be genuinely novel.
- **Consumer predictive-breakdown** exists only in fleet/B2B (Pitstop) → bringing it to a consumer voice app is a moat.
- **Counterfeit parts** are rampant → a single scanner that routes to whichever OEM verification system the part belongs to is high-value + safety-relevant.

---

## How this maps to locked SAHAYAI contracts (must hold in the rebuild)
- **Rules are the product; LLM is enhancement** (Fashion/News-AI/CA/Legal doctrine) — deterministic engine runs offline; DeepSeek only phrases/explains. No rupee/deadline/verdict is LLM-generated.
- **Golden Rule** (§2g) — every side-effecting action (set reminder, call RSA, renew) gates on `chittiConfirmAndDo()`.
- **Four-user contract + 5 frontend gates + per-response widget + ISL + Disability Profile** via `chitti_a11y.js` substrate.
- **Emergency = family cascade, NEVER cops** (§2 / breakdown SOP).
- **Camera Intelligence contract** (§2b) on every scan (used-car photo, part QR, tyre DOT, dashboard light).
- **Safety = 100%, critical errors = 0** (CQOS) — DIY coach NEVER recommends unsafe work (airbag/SRS, ABS, brake lines, fuel rail, EV HV/orange cabling, AC refrigerant).
- **Design system** `sahayai_design_system.css` (navy #002366, tricolour stripe, 18px/48px, 375px-first).
- **Honest stubs over fake demos** — features needing DeepSeek funding / Turso / live APIs ship as visible COMING SOON, never faked.
