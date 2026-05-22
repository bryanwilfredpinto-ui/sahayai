# skills/chitti_mechanic_car.md

Chitti Mechanic Car — voice-first diagnostic skill for every Indian driver.
Frontend: `chitti_4wheeler.html`. Backend: same chitti-vaani-api / DeepSeek pipeline.

## Operating principle

Same dynamic-diagnosis pattern as Mechanic Bike — no hardcoded
symptom tree. DeepSeek returns JSON with diagnosis, diy_possible,
diy_steps, mechanic_advice, fair_price, safety_critical,
ask_followup.

Frontend short-circuits `safety_critical` for: brakes, steering, tyres,
ABS, airbag, wobble, suspension, axle. Same hard rules as bike.

## Symptoms Chitti handles well (illustrative)

| Cluster | Common phrasing |
| --- | --- |
| Engine light (check-engine) | "engine light jal rahi", "yellow light on hai" |
| AC not cooling | "AC thandi nahi", "AC gas khatam" |
| Brake noise / fade | "brake awaaz kar raha", "brake pakad nahi raha" |
| Gear shifting hard | "gear lagne mein takleef", "clutch heavy" |
| Battery dead | "self nahi le raha", "lights dheemi" |
| Tyre pressure | "TPMS light on", "ek tyre soft" |
| Overheating | "temperature gauge red", "engine garam" |
| Starting trouble | "subah start nahi hoti", "ignition de raha" |
| Unusual sounds | "khat-khat awaaz", "engine rumble" |
| Suspension noise | "speed breaker pe awaaz" |
| Power window | "window niche/upar nahi ja rahi" |
| AC gas recharge | "saal mein ek baar AC gas kab" |

## OBD2 (Phase 2)

The "🔌 OBD2 device connect" card on Tab 2 (Meri Gaadi) is a Phase-2
honest stub. Spec: ELM327-compatible Bluetooth OBD2 dongle → Web
Bluetooth API → read error codes → DeepSeek translates them into
plain Hindi/Telugu/Bangla.

The card explicitly says "Coming soon · Phase 2" so users are not
misled. We never silently fake an OBD2 reading.

## Fair-price guardrails (car)

Same JSON contract, with INR ranges tuned to 2026 car rates for India.
Examples Chitti is trained to know:
- Oil change (small petrol): ₹1500 – ₹3500
- Brake pads (front): ₹2500 – ₹6000
- AC gas refill: ₹2000 – ₹4500
- Battery (sedan): ₹5000 – ₹9500
- Tyre (one, small car): ₹3500 – ₹6500

Surface as: "Yeh range hai — isse zyada mat dena."

## Documents (Tab 3)

Same 5 docs as bike: Insurance, PUC, RC, DL, FASTag. Storage key:
`chitti_car_docs_v1`. Reminder window 30/7/1 days → `chitti_inbox_v1`.

Cars get one extra default in Phase 2 — `road_tax` for commercial /
out-of-state cars.

## Brand-specific tweaks

Chitti's prompt mentions "Indian context (Maruti/Hyundai/Tata/Mahindra
most common)". DeepSeek uses this hint to scope mechanic advice to
parts that are typically available and labour rates that are realistic
in those workshop networks.

## Helmet gate — N/A for car

Cars do not use the helmet gate. Mechanic Maps opens directly. Keep
the gate code on the page only because the Mechanic Car page is the
sibling of Mechanic Bike; the gate functions are not invoked.

## Safety rules — non-negotiable (car)

Same list as bike, with these additions:
- ABS warning light → safety_critical=true.
- Airbag light → safety_critical=true.
- Brake fluid low → safety_critical=true.
- TPMS rapid blink → safety_critical=true (rapid loss).
Never tell user "drive karte raho".

## Quality v2 — escalation

Same as bike. 👎 on `chitti_mechanic_car` cards flows through
`/api/feedback` to the founder dashboard.
