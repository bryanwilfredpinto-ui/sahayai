# Chitti 2-Wheeler — Mechanic Knowledge Corpus

Depth corpus used by DeepSeek to ground every Chitti 2-Wheeler answer.
Not exhaustive — bike-shop-floor-grade depth across the **90 % of
common Indian bikes** (Hero · Honda · Bajaj · TVS · Royal Enfield ·
Suzuki · Yamaha · KTM). Last touched 2026-05-14.

This file is loaded by the backend's DeepSeek client as a system
prompt prefix when the user's intent maps to a mechanic question. See
[SKILL.md](SKILL.md) for persona + tool-use rules.

---

## 1. Maintenance schedule — by component

### Engine & oil

| Component | Interval | Notes |
|---|---|---|
| Engine oil (mineral 10W-30 / 20W-40) | 3 000–5 000 km (commuter) · 5 000–10 000 km (semi-synthetic on premium) | Always replace filter the same time. Indian dust shortens intervals. |
| Oil filter | every oil change | non-negotiable |
| Air filter | 5 000–10 000 km (dusty / Tier-2/3) · 10 000–20 000 km (clean / metro) | dry paper or oiled foam — check brand spec |
| Spark plug | 10 000–20 000 km | misfire = early replace |
| Valve clearance | 15 000–30 000 km | brand specific; RE Bullet older units need 5 000 km |
| Timing chain | 20 000–30 000 km | stretch causes rattle at cold start |

### Cooling (liquid-cooled bikes — KTM Duke, RE Himalayan, Pulsar RS200, R15, etc.)

| Component | Interval |
|---|---|
| Coolant level | every ride |
| Coolant flush | 2–3 yr or 30 000 km |
| Radiator clean | 10 000–20 000 km |

### Brakes

| Component | Interval |
|---|---|
| Brake pads (disc) | 10 000–20 000 km |
| Brake shoes (drum) | 20 000–30 000 km |
| Brake fluid flush (DOT 3/4) | every 2 yr |
| Brake disc | 20 000–40 000 km |

### Drive (chain / sprocket)

| Component | Interval |
|---|---|
| Chain lubrication | every 500 km (every 300 km in monsoon) |
| Chain slack check | every 1 000 km |
| Chain + front + rear sprocket (set) | 15 000–25 000 km |

### Tyres

| Component | Interval |
|---|---|
| Tyre pressure | every ride (cold) |
| Tyre tread | every 1 000 km |
| Tyre replace | 15 000–25 000 km (depends on compound) |

### Electrical

| Component | Interval |
|---|---|
| Battery inspection | every 6 months |
| Battery replace | 2–3 yr (lead-acid) · 4–5 yr (Li-ion on premium) |
| Headlight bulb | check monthly |

### Suspension

| Component | Interval |
|---|---|
| Fork oil | 20 000–30 000 km |
| Steering bearings | 20 000–30 000 km |
| Rear shock | 25 000–40 000 km (refurb cheaper than replace) |

---

## 2. OBD2 sensor map (for bikes with diagnostic port)

`RPM` · `SPEED` · `COOLANT_TEMP` · `ENGINE_LOAD` · `INTAKE_TEMP` ·
`THROTTLE_POS` · `BATTERY_VOLTAGE` · `O2_SENSOR` · `RUN_TIME` ·
`DISTANCE_W_MIL`. Bikes that have OBD2: RE 350+ (BS-IV onward), KTM
390/250, Pulsar NS200+, R15v3+, Dominar 400, most ABS bikes 2018+.

### Predictive table

| Component | Trigger |
|---|---|
| Oil quality | run-time × RPM × load × temp — drop below 30 % ⇒ 1 500 km warning |
| Coolant | temp pattern abnormal ⇒ 3-month warning |
| Battery | voltage drop trend ⇒ 2-3 week warning |
| Chain | slack increase + lube-due — *immediate* |

---

## 3. DTC plain-Hinglish library (common bike codes)

| Code | What | Severity | Hinglish |
|---|---|---|---|
| P0107 / P0108 | Manifold absolute pressure | M | "MAP sensor pe problem — air intake reading galat" |
| P0117 / P0118 | Coolant temp sensor | M | "Coolant sensor kharab — fan trigger sahi nahi" |
| P0131 / P0134 | O2 sensor | M | "Oxygen sensor kharab — fuel mixture galat, mileage girega" |
| P0171 | System too lean | M | "Petrol kam mil raha hai — air leak ya fuel filter chocked" |
| P0172 | System too rich | M | "Petrol zyada mil raha hai — injector ya MAP issue" |
| P0201–P0204 | Injector circuit | H | "Injector circuit fault — start nahi hoga ya dhak-dhak karega" |
| P0301–P0304 | Cylinder misfire | H | "Cylinder [n] mein misfire — spark plug ya coil ya injector" |
| P0335 | Crankshaft sensor | H | "Crank sensor kharab — bike start nahi hogi" |
| P0420 | Catalytic converter | M | "Catalytic converter efficiency low — fuel system issue probable" |
| P0500 | Vehicle speed sensor | L | "Speed sensor kharab — speedometer galat reading" |
| P0560 | System voltage | M | "Charging system mein fault — battery khali ho rahi hai" |
| P0700 | Transmission control (rare on bikes) | H | "Transmission control fault — mechanic ko dikhao" |

Full set lives in `backend/data/dtc_codes_2w.json` (queued P1).

---

## 4. Brand-specific roadside-assistance numbers

| Brand | Number |
|---|---|
| Hero | 1800-258-4747 |
| Honda | 1800-103-1234 |
| Bajaj | 1800-233-2453 (or 1033 generic) |
| TVS | 1800-258-8888 |
| Royal Enfield | 1800-210-0007 |
| Yamaha | 1800-420-1600 |
| Suzuki | 1800-103-3402 |
| KTM | 1800-419-1090 |
| Generic | 1033 (Highway authority RSA) |

---

## 5. Fair-price bands by service item (Tier-2 metro median)

| Item | Fair band (₹) | Notes |
|---|---|---|
| Mineral oil change (Splendor / Activa / Pulsar 150) | 350–500 | oil ₹250–400 + labour ₹100 |
| Semi-synthetic oil change (RE Classic / Pulsar 220) | 700–1 000 | oil ₹500–800 + labour ₹150 |
| Synthetic oil change (KTM / RE Himalayan) | 1 200–1 800 | oil ₹1 000–1 500 + labour ₹200 |
| Air filter | 200–500 | OEM ₹300–500; aftermarket ₹150–250 |
| Spark plug (per plug) | 100–300 | NGK / Bosch genuine |
| Chain + sprocket set | 1 500–3 500 | DID / RK genuine cheapest range |
| Brake pads (per pair) | 300–700 | EBC ₹500–700; OEM ₹300–500 |
| Tyre (per tyre, commuter) | 1 200–2 200 | MRF / Apollo; sportier compounds cost more |
| Battery (12V 5Ah) | 1 200–2 500 | Exide / Amaron |
| Major service | 800–1 500 | oil + air + spark + chain lube + brake check |

These are **bands** — Chitti must never quote a single number as
final. Add a city / pincode delta when the community price-table
lands (P1).

---

## 6. Common rider questions ↔ Chitti's reply pattern

1. *"Mileage girr gaya, kya karu?"* → check tyre pressure → check air
   filter → check spark plug → check chain slack → fuel quality. Walk
   step-by-step.
2. *"Starting problem mein."* → check fuel → check battery (horn /
   indicators) → check spark plug → side-stand sensor (Activa /
   Splendor BS-VI).
3. *"Engine awaaz alag aa rahi hai."* → ask rider to record 10 s
   audio (P2 AI-listening feature; today walk through tappet rattle
   vs valve noise vs chain slap by pattern description).
4. *"Insurance kab expire?"* → document vault lookup; if empty,
   onboard the doc.
5. *"PUC center kahaan hai?"* → geo-aware list via Vaani Local
   directory + chitti-government PUC scheme listing.

---

## 7. Sources audited

- Hero / Honda / Bajaj / TVS / RE / Yamaha / Suzuki / KTM owner manuals
  (publicly available service schedule pages).
- Bharat Stage IV / BS-VI emission DTC tables (published in homologation
  documents).
- TeamBHP / xBhp / RushLane long-term review threads (community
  fair-price triangulation).
- Drivvo / GoMechanic public maintenance schedules.

Update this corpus when a brand revises its schedule (typically once
a year at the model-year refresh). Match the rhythm of the founder
report — minor tweaks land monthly, major revisions quarterly.
