# Chitti Kisan — Features

Chitti Kisan is India's voice-first agriculture, livestock & garden companion. **Rules are the product** — every answer is computed from a transparent, auditable table in [`chitti_kisan_engine.js`](../../chitti_kisan_engine.js) (`window.ChittiKisan`), works fully offline, and never fabricates a price or a forecast. Reached through **Chitti Vaani**; `chitti_kisan.html` is the developer/debug surface.

## Live now 🟢

- **Aapki mitti — Soil by district (BO3).** District + state → dominant soil type (NBSS&LUP national soil-map, district-level approximation) + water-holding + suited crops. Says so honestly when a location isn't in the table — never guesses a soil silently.
- **Kaunsi fasal — Crop advisor (BO4).** Auto-detects Kharif / Rabi / Zaid from the month, intersects with the soil's suited crops, returns crop + ICAR variety + sowing window + days-to-harvest.
- **Aaj paani doon — Irrigation advisor (BO5).** Deterministic decision tree over soil water-holding + recent rain + heat + "feels dry" → water now / wait + how much. Saves water, power and diesel; flags over-watering as a root-rot risk.
- **Organic vikalp — Organic alternatives (BO6).** Any chemical / molecule / brand (urea, DAP, glyphosate, mancozeb…) → ICAR-grounded organic alternative **first** (CEOS Art-2). Chemical only as a documented last resort.
- **Pashu Helpline 1962 (BO7).** The national veterinary helpline is always one tap away on every livestock screen. Never changes (CEOS Art-1).
- **Roz ki dekhbhaal — Livestock daily manager (BO8).** Per-animal (cattle/buffalo, poultry, goat/sheep, pig) daily husbandry checklist + vaccination reminders. Animal health log is **local-only** (never sent to a server).
- **Lakshan checker → 1962 (BO9).** Any animal symptom triages straight to the vet (1962) with do-now steps. Chitti **never** diagnoses or prescribes for animals (CEOS Art-1, LOCKED) — escalation only.
- **Voice-first everywhere.** Every result has a 🔊 "Sun" button; whole page reads aloud; 26 Indian languages via the Vaani-canonical `chitti_lang.js`. Built for blind / deaf / mute / illiterate farmers (four-user contract).

## Coming soon 🟡

- **Live 7-day weather (BO1).** Real IMD forecast via the backend + IMD API. Until wired, an honestly-labelled **seasonal** advisory is shown — never presented as a live prediction.
- **Aaj ka mandi bhav (BO2).** Live mandi prices from **Agmarknet only** (CEOS Art-3 — a price is NEVER guessed). The query is captured; the live number appears the moment the backend is connected.

## Future 🔵

- **Farm-to-table matchmaker.** Connect farmers to buyers directly. Chitti is a matchmaker — never a delivery or payment platform.
- **Camera intelligence.** Leaf / pest / disease photo triage that routes to KVK / 1962 (never a standalone diagnosis), under the platform camera-intelligence contract.
- **Scheme bridge.** Hand-off to Chitti Government for PM-KISAN, KCC, crop-insurance (PMFBY) eligibility.

## Always true

- Free. No sign-up. Works offline (the deterministic engine needs no network).
- A matchmaker and an advisor — **not** a substitute for a Krishi Vigyan Kendra (KVK) officer or a veterinarian, and never a delivery/payment platform.
- Honest stubs over fake demos: live data that isn't wired yet says so, in plain language.
