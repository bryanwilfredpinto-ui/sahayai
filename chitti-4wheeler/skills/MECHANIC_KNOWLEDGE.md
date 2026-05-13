# Chitti 4-Wheeler — Mechanic Knowledge Corpus

Depth corpus used by DeepSeek to ground every Chitti 4-Wheeler answer.
Workshop-floor-grade depth across the **95 % of Indian cars** (Maruti
· Hyundai · Tata · Mahindra · Honda · Toyota · Kia · MG · Skoda · VW
· Ford legacy · Nissan / Renault). Last touched 2026-05-14.

Loaded by the backend's DeepSeek client as a system prompt prefix when
the user's intent maps to a mechanic / DTC / service question. See
[SKILL.md](SKILL.md) for persona + tool-use rules.

---

## 1. Maintenance schedule — by component

| Component | Interval | Reminder method |
|---|---|---|
| Engine oil | 5 000–10 000 km (mineral) · 10 000–15 000 km (semi-synthetic) · 15 000–20 000 km (full synthetic) | odometer + OBD2 oil quality % |
| Oil filter | every oil change | odometer |
| Air filter | 20 000–30 000 km (clean metro) · 10 000–15 000 km (dusty Tier-2/3) | odometer |
| Coolant flush | 2–3 yr or 40 000 km | time + odometer |
| Brake fluid flush | every 2 yr | time |
| Brake pads | 30 000–50 000 km | odometer + wear indicator squeal |
| Spark plugs | 40 000–60 000 km (iridium) · 20 000–30 000 km (copper) | odometer + misfire detect |
| Timing belt | 60 000–100 000 km (varies hugely by car — check manual) | odometer |
| Timing chain | usually lifetime, inspect at 80 000 km | odometer |
| Transmission fluid (manual) | 50 000–80 000 km | odometer |
| Transmission fluid (AT / CVT / AMT) | 40 000–60 000 km | odometer |
| Tyre rotation | 8 000–10 000 km | odometer |
| Tyre replace | 40 000–60 000 km (subject to tread) | odometer |
| AC cabin filter | 15 000–20 000 km | odometer |
| Battery | 3–5 yr | time + voltage |
| Wheel alignment | 10 000 km or as-needed | odometer / steering pull |
| Power steering fluid | 60 000 km (where applicable) | odometer |
| Differential / transfer-case oil (4×4) | 40 000–60 000 km | odometer |

---

## 2. Brand-schedule deltas (Tier-2 reality vs manual)

- **Maruti** (Swift / Dzire / Brezza / Baleno) — engine oil 10 000 km
  in manuals; Tier-2 dust pushes real-world to 7 500 km.
- **Hyundai** (i10 / i20 / Creta / Verna) — oil 10 000 km manual; real
  ~8 000 km if mostly stop-go traffic.
- **Tata** (Nexon / Harrier / Tiago) — turbo-petrol engines need 7 500
  km oil; turbo intercooler check at 30 000 km.
- **Mahindra** (XUV700 / Scorpio / Thar) — diesel DPF regen check at
  40 000 km; coolant earlier (30 000 km) for 4×4 hard usage.
- **Honda** (City / Amaze / WR-V) — manuals overstate oil interval;
  10 000 km mineral / 15 000 km synthetic is conservative.
- **Toyota** (Fortuner / Innova / Glanza) — extremely conservative
  service intervals; manuals are accurate for India.
- **Kia** (Seltos / Sonet / Carens) — same Hyundai-group rules.
- **MG** (Hector / ZS EV / Astor) — EV: 12V battery check at 20 000
  km; coolant flush at 100 000 km for the high-voltage battery loop.

---

## 3. OBD2 sensor map (python-OBD command names)

`RPM` · `SPEED` · `COOLANT_TEMP` · `ENGINE_LOAD` · `INTAKE_TEMP` ·
`THROTTLE_POS` · `TIMING_ADVANCE` · `FUEL_PRESSURE` · `MAF` ·
`RUN_TIME` · `FUEL_LEVEL` · `CONTROL_MODULE_VOLTAGE` ·
`AMBIANT_AIR_TEMP` · `BAROMETRIC_PRESSURE` · `COMMANDED_THROTTLE` ·
`DISTANCE_W_MIL` · `RUN_TIME_MIL` · `HYBRID_BATTERY_REMAINING` ·
`FUEL_RATE` · `VIN`. Support varies by car — 2010+ Maruti / Hyundai /
Tata / Mahindra have strong coverage.

### Predictive maintenance trigger table

| Component | Sensors used | Warning timing |
|---|---|---|
| Engine oil | run-time + RPM + load + temp | 30 days before |
| Coolant | temp pattern + heat cycles | 60 days before |
| Battery | voltage drop pattern | 14 days before |
| Brake pads | wear sensor (where exposed) | 1 000 km before |
| Spark plugs | misfire freq + RPM stability | 5 000 km before |
| Transmission | run-time + load × shift count | 5 000 km before |

---

## 4. DTC plain-Hinglish library — common 4-wheeler codes

| Code | What | Severity | Hinglish |
|---|---|---|---|
| P0010–P0014 | Variable valve timing solenoid | M | "VVT solenoid — power kam, mileage girega" |
| P0101–P0104 | MAF / MAP sensor | M | "Air intake sensor pe problem — mileage girega" |
| P0117 / P0118 | Coolant temp sensor | M | "Coolant sensor — fan trigger sahi nahi" |
| P0128 | Coolant thermostat | L | "Thermostat stuck open — warm-up dheere" |
| P0130–P0167 | O2 sensor (bank/sensor) | M | "Oxygen sensor — fuel mixture galat, mileage girega" |
| P0171 / P0174 | System too lean (bank 1/2) | M | "Petrol kam mil raha — air leak / fuel filter blocked" |
| P0172 / P0175 | System too rich | M | "Petrol zyada mil raha — injector ya MAP issue" |
| P0201–P0212 | Injector circuit | H | "Injector circuit fault — misfire / start issue" |
| P0300 | Random misfire | H | "Random misfire — fuel quality / multiple plugs / coil" |
| P0301–P0312 | Cylinder n misfire | H | "Cylinder [n] misfire — plug / coil / injector" |
| P0335 | Crankshaft position sensor | H | "Crank sensor — start nahi hoga" |
| P0340 | Camshaft position sensor | H | "Cam sensor — start / stall issue" |
| P0401 | EGR flow insufficient | M | "EGR valve / passage chocked" |
| P0420 / P0430 | Catalytic converter (bank 1/2) | M | "Cat-con efficiency low — fuel / O2 sensor probable" |
| P0440–P0455 | EVAP system | L | "Petrol cap loose / EVAP leak — tight karo" |
| P0500 | Vehicle speed sensor | L | "Speed sensor — speedometer galat" |
| P0560 | System voltage | M | "Charging system fault — battery khali" |
| P0606 | ECM internal | H | "ECU internal fault — dealer ko dikhao" |
| P0700 | Transmission control | H | "Transmission control — workshop visit" |
| P0716 / P0741 | Torque converter / clutch | H | "AT clutch / torque converter issue" |
| P2270 / P2271 | O2 sensor stuck | M | "O2 sensor stuck — fuel trim off" |

Full set (~2 000 codes) ships in `backend/data/dtc_codes_4w.json`
(queued P1).

---

## 5. Brand-specific roadside assistance

| Brand | Number |
|---|---|
| Maruti Suzuki | 1800-102-1800 |
| Hyundai | 1800-102-4645 |
| Tata Motors | 1800-209-8282 |
| Mahindra | 1800-209-6006 |
| Honda Cars | 1800-113-121 |
| Toyota | 1800-425-0001 |
| Kia | 1800-108-5000 |
| MG Motor | 1800-100-6464 |
| Skoda | 1800-102-6464 |
| VW | 1800-209-0909 |
| Renault / Nissan | 1800-103-5353 / 1800-209-2002 |
| Generic | 1033 (Highway authority RSA) |

---

## 6. Fair-price bands by service item (Tier-2 metro median)

| Item | Fair band (₹) | Notes |
|---|---|---|
| Engine oil change (mineral, 1.2 L hatch) | 1 500–2 500 | oil ₹1 000–1 800 + filter ₹300–500 + labour ₹200–400 |
| Engine oil change (synthetic, 1.5 L SUV) | 3 500–5 500 | oil ₹2 800–4 500 + filter ₹400–700 + labour ₹300–500 |
| Air filter | 400–800 | OEM ₹500–700; aftermarket ₹300–500 |
| AC cabin filter | 350–700 | activated-carbon variants ₹500–800 |
| Spark plug set (4 plugs) | 800–2 000 | NGK / Denso iridium upper end |
| Brake pads (front pair) | 1 200–2 800 | EBC / Brembo upper; OEM mid |
| Brake fluid flush | 800–1 500 | DOT 4 ₹400–700 + labour |
| Battery (45 Ah) | 4 500–7 500 | Exide / Amaron with warranty |
| Tyre (per tyre, 14"–15") | 4 500–8 500 | MRF / Bridgestone / Continental |
| Wheel alignment + balancing | 600–1 200 | per wheel ₹150–300 |
| Major service (40k km) | 6 000–12 000 | full schedule items above |
| Coolant flush | 1 500–3 000 | coolant ₹600–1 200 + labour |
| Transmission flush (AT / CVT) | 3 500–7 500 | fluid ₹2 500–5 000 + labour |
| AC gas top-up | 1 500–3 500 | R-134a or R-1234yf |
| Clutch overhaul (hatch) | 8 000–18 000 | clutch + pressure + bearing + labour |
| Timing belt + tensioner | 6 000–15 000 | belt ₹2 000–4 000 + tensioner + labour |

Bands — never quote a single final number. Authorised dealer median
typically sits at the upper end; independent good-mechanic at lower
end. Anti-overcharge guard surfaces both.

---

## 7. Driver-question ↔ reply pattern

1. *"Mileage girr gaya."* → tyre pressure → air filter → spark plugs
   → O2 sensor → injector clean → fuel quality. Step-by-step.
2. *"Start nahi ho rahi."* → fuel → battery (lights / horn dim?) →
   crank but no start (fuel pump / spark / sensor) → click only
   (battery / starter motor).
3. *"AC thanda nahi kar raha."* → cabin filter → gas pressure → blower
   speed → condenser → compressor clutch.
4. *"PUC kab expire?"* → document vault lookup; empty → onboard.
5. *"Service centre ne ₹X maanga, theek hai?"* → anti-overcharge
   guard — return fair band + nearby alternates.
6. *"Insurance kab renew?"* → vault lookup → compare-quotes flow
   (P2 future).

---

## 8. Sources audited

- Maruti / Hyundai / Tata / Mahindra / Honda / Toyota / Kia / MG /
  Skoda / VW owner-manual service schedules (publicly available).
- Bharat Stage IV / BS-VI / BS-VIp emission DTC tables.
- TeamBHP / xBhp / Cardekho long-term review threads (community
  fair-price triangulation).
- Drivvo / GoMechanic / Spinny published maintenance schedules.
- BoodMo / partsbig — for OEM vs aftermarket part pricing.

Update this corpus on the same cadence as the 2W corpus — minor
tweaks monthly, major revisions quarterly.
