# Chitti 2-Wheeler Mechanic — Reference Research (20 apps + 20 AI apps)

**Created:** 2026-06-13 · **Owner:** Bryan Wilfred Pinto (Sire) · **Author:** Chitti CTO (Claude Opus 4.8)
**Purpose:** Step 1 of the LOCKED new-products process (SAHAYAI_MASTER §2a) for the **complete rebuild** of Chitti 2-Wheeler Mechanic — a voice-first AI mechanic that lives with an Indian bike/scooter owner 24×7×365. Old `chitti-2wheeler/` is kept as **legacy**; this rebuild ships in a **fresh folder** once Sire hands over the CEOS.

**Scope (Sire's brief):** (1) breakdown DIY-guidance · (2) used-bike accident/odometer/flood check · (3) new-bike recommendation · (4) service reminders · (5) which engine oil · (6) which tyres/when · (7) genuine-vs-fake parts · (8) PUC + insurance reminders.

**Doctrine carried in:** rules are the product, the LLM (DeepSeek only) is an enhancement; honest stubs over fake demos; four-user accessibility (Blind/Deaf/Mute/Illiterate); Golden Rule confirm-before-act; Vaani is the sole user interface.

---

## PART A — 20 conventional reference apps

### Maintenance / reminder / service-record
1. **Drivvo** — dual-trigger reminders (date OR odometer, whichever first); per-fill fuel-economy analytics → mileage-drop nudges; custom service checklists.
2. **Simply Auto** — passive odometer capture via GPS/Bluetooth (no manual entry — key for low-literacy); multi-driver/shared-vehicle sync; EV support.
3. **AUTOsist** — receipt-scanning OCR (snap a bill → captured); per-vehicle document vault (insurance/PUC/RC).

### OBD / diagnostic (2-wheeler = optional power-feature; moto OBD is non-standard)
4. **Torque Pro** — read/clear DTCs + turn off MIL via cheap ELM327; live gauge dashboard. (Works on OBD2 bikes only.)
5. **Car Scanner ELM OBD2** — Mode-06 ECU self-test + emissions-readiness + large plain-language DTC database.
6. **OBD Auto Doctor** — freeze-frame capture (snapshot at fault moment); readiness monitors → "ready to pass emissions/PUC"; CSV export.

### Indian OEM owner apps
7. **Hero App** — onboard a bike from just reg number/VIN → last/next service + advice; OEM service schedule per model; WhatsApp booking.
8. **Royal Enfield (RE Prime)** — built-in DIY fix videos for minor glitches + one-tap roadside assistance (≈ Chitti's breakdown → escalate flow).
9. **TVS Connect (SmartXonnect)** — crash alert + geofence + last-parked + battery/ride stats (→ emergency protocol + anti-theft).
10. **Bajaj Ride Connect** — owner's manual + riding tips in-app; hands-free call/SMS.
11. **MyHonda-India** — real-time workshop service tracking; service-history archive; nearest dealer + petrol pump.
12. **Ola Electric (MoveOS)** — remote diagnostics + proactive maintenance alerts + OTA (EV-scooter diagnostic bar).

### Used-bike inspection / valuation
13. **Droom (ECO + OBV + History)** — **FLAGSHIP**: 121-checkpoint inspection flagging accident/flood/odometer/tyre-life/hypothecation + photos + per-component score + faulty-parts cost estimate; OBV fair-price engine; History lookup in ~10s over 200M+ records.
14. **Orange Book Value / BikeWale / BikeDekho** — free instant used-bike valuation (make/model/year/km/city); new-bike spec compare + expert/user reviews + on-road price by city.
15. **CredR** — 120+ checkpoint expert inspection + 6-month engine/gearbox warranty + 7-day buy-protection + inspection sheet handed to buyer.
16. **Spinny Assured** — 200-point inspection published publicly per listing + upfront assured BuyBack value + 5-day return (transparency + resale-value gold standard; adapt for bikes).

### Genuine-parts authenticity
17. **Bosch KeySecure / Origify** — 18-digit secure code + rainbow-hologram visual test + scan-to-verify; surface-fingerprint capture.
18. **NGK / Niterra India** — scan packaging QR → instant authenticity check (spark plugs = most-counterfeited 2-wheeler part).

### PUC / insurance / RTO compliance
19. **mParivahan** — **FLAGSHIP**: reg number → RC status + insurance validity + PUC status + e-challans/dues from national VAHAN DB; legally valid virtual RC/DL.
20. **DigiLocker** — pull RTO-issued, VAHAN/SARATHI-verified, tamper-proof RC/DL into a per-bike vault.

### Supplementary (verified)
- **ACKO / PolicyBazaar** — auto renewal reminders + PUC-expiry check + one-tap renew.
- **Allianz / Europ Assistance 2W RSA** — jumpstart/flat-tyre/fuel/lost-key/free-tow escalation tier.
- **GoMechanic / Pitstop / Apna Mechanic** — transparent fixed-price service packages (~40% below authorised) + genuine-OEM-parts pledge → "what should this cost me" benchmark.
- **Castrol / Motul oil selectors** — make/model/year → exact oil grade (build as deterministic table).

---

## PART B — 20 AI reference apps

### OBD + AI explanation layer (copy the explanation, not the dongle)
1. **FIXD** — plain-English code → severity → **"safe to keep driving?"**; proactive severe-issue alert; shop-cost framing for DIY.
2. **Carly** — **Used Car Check reads odometer from multiple ECUs → mismatch = tamper detector**; severity + DIY steps; health tracking.
3. **OBDeleven** — one-click-action UX with safe defaults; credit (no-subscription) model.
4. **CarMD Connect** — **predictive diagnostics** ("likely to fail next year + cost" from make/model/mileage); VIN+mileage-scoped answers; technician-verified fix library as LLM grounding.
5. **OBDAI / ARIA** — GPT-powered agentic root-cause loop over live data; shareable inspection report.

### AI-native diagnosis (sound/photo/chat — no dongle, most bike-relevant)
6. **AI Mechanic: Engine Sound Scan** — record engine sound → candidate faults ("Shazam for noises"); zero-typing.
7. **MyAutoSound** — one recording → symptom-category routing (brake/engine/exhaust/suspension); web-first.
8. **TrunkMonkey AI** — multi-modal single funnel (photo of light/damage OR video of noise OR code) → diagnosis + step-by-step + local cost.
9. **Mechanic On Tap** — photo of visible damage → part + severity + cost; dashboard-light decoder.
10. **Wrenchly** — **gold-standard honesty model**: guided symptom Q&A → likely causes + urgency + cost, with built-in "a starting point, not a definitive answer."
11. **MECH AI** — conversational repair Q&A fallback.

### AI computer-vision inspection / used-vehicle
12. **Tractable** — photo → damage severity → repair-vs-replace (car-trained, huge dataset; copy the flow, stub the model).
13. **Ravin AI** — guided 360° capture with live "point here next" coaching + auto VIN/plate read + simple A/B/C condition grade.
14. **Inspektlabs** — **India-proven**: OCR odometer + plate from one photo; image-fraud (altered/duplicate) detection; photo-quality gating before analysis.
15. **Click-Ins** — "DamagePrint" tamper-evident condition fingerprint; misaligned-panel detection as prior-accident proxy.
16. **Cars24 Odometer-Fraud Detection (India)** — **reg number → tamper-probability score**, no hardware; explicit "high score ≠ proof" honesty. Chitti's edge: also cross-ref insurance-claim + service history.
17. **Spinny Assured** — 200-checkpoint checklist as canonical "what to inspect" knowledge base (human inspection; the checklist is the gold content).

### AI chat / copilots + price + predictive + authenticity
18. **Mercedes MBUX + ChatGPT** — context-carried multi-turn voice dialogue; keep chat layer separate from safety/diagnostic verdicts.
19. **RepairPal Fair Price Estimator** — deterministic fair-price *range* per named repair (build an **Indian 2W parts/labour table** — never reuse US numbers).
20. **Pitstop** — component-level failure forecasting (battery/brake/tyre) with no extra hardware (for Chitti = rules over interval/km/age, **don't claim ML accuracy**).
- **+ Bosch Secure Product Fingerprint / Authentic Vision** — QR/serial/hologram verify now; surface micro-texture CV later (needs OEM DB → stub).

---

## CONSOLIDATED BUILD SHORTLIST — by scope area

Legend: **[RULES]** deterministic · **[LLM]** DeepSeek enhancement · **[VISION]** image model (honest stub until built) · **[DATA]** needs an Indian dataset/feed.

| # | Scope | P0 features to build | Source patterns |
|---|---|---|---|
| 1 | **Breakdown DIY** | [RULES→LLM] guided symptom Q&A → cause + **urgency** + DIY-vs-mechanic verdict; [LLM] "safe to ride now?" + severity; DIY fix-step library; [VISION-stub] photo dashboard-light + [AUDIO-stub] "let Chitti listen"; one-tap RSA escalation (Golden-Rule confirmed, family-cascade) | Wrenchly, FIXD, RE videos, Sound Scan, Allianz |
| 2 | **Used-bike check** | [DATA+RULES] reg → odometer-tamper score (service + insurance-claim cross-ref) w/ Cars24 honesty line; [RULES] guided 200-point inspection checklist; [VISION-stub] guided 360° capture + A/B/C grade; [DATA] photo-quality gate + altered-image flag | Cars24, Droom, Spinny, Ravin, Inspektlabs, Click-Ins |
| 3 | **New-bike rec** | [RULES→LLM] need/budget/use/region → ranked models + reasons | BikeWale, RepairPal spec model |
| 4 | **Service reminders** | [RULES+DATA] dual-trigger (km OR months OR age) from OEM schedule per model; [DATA] "common at this age" priors (no ML claims) | Drivvo, Hero, CarMD, Pitstop |
| 5 | **Engine oil** | [RULES+DATA] model/variant → grade + capacity + interval; [LLM] "why this grade" | Castrol/Motul, Carly VIN-scope |
| 6 | **Tyres** | [RULES+DATA] model → OEM size/spec + tread/age/km change rule; [VISION-stub] tread photo | Pitstop, RepairPal |
| 7 | **Genuine vs fake** | [RULES] red-flag checklist (hologram/QR/serial/font/weight/price); [DATA] QR/serial verify; [VISION-stub] surface fingerprint | Bosch, NGK, Authentic Vision |
| 8 | **PUC + insurance** | [DATA+RULES] reg → mParivahan/DigiLocker validity → countdown reminders + one-tap renew nudge; [OCR] snap PUC/insurance → extract expiry | mParivahan, DigiLocker, ACKO, Inspektlabs OCR |

### Cross-cutting principles (distilled)
- **Honesty banner on every diagnostic surface** ("a starting point, not a definitive answer — confirm with a mechanic"); Cars24's "high score ≠ proof" for all scores.
- **Deterministic-first:** oil grade, tyre spec, service intervals, document expiries, fair-price ranges, used-bike checklist, fake-part red flags are all RULES/DATA — DeepSeek only for symptom narration, explanations, conversational follow-up.
- **No-hardware reality:** Indian 2-wheelers rarely have OBD2 → copy the explanation/severity/odometer-cross-check *patterns*, not the dongle. Bikes need symptom-Q&A + reg-lookup + photo/OCR.
- **Guided capture + photo-quality gating** is the cheap, high-value half of every vision feature — ship the coaching now, stub the CV, never fake the demo.
- **Always ground DeepSeek in the user's specific bike** (reg/model/km/age) — never a generic chatbot reply.
