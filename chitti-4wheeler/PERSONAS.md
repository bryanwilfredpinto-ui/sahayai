🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Car Doctor

Every feature in [PRD.md](PRD.md) names which personas it serves. A feature that
serves none of them is not built. The four-user accessibility contract
([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) is the floor under all of them.

Each persona carries a **user story** in the canonical form:
*"As an Indian [user], I want [action] so that [outcome]."*

---

## P1 — Suresh, 34 — Family-Car Owner, Tier-2/3
- **Car:** Maruti Swift petrol, 2019, 58 000 km — the family's only car, weekend trips + school runs.
- **Needs:** the car reliable and the service bill honest; no spare cash for a ₹35 000 surprise.
- **Pain:** the authorised service centre upsells every visit; he can't tell a real fault from a sold one.
- **Story:** *As a family-car owner in a Tier-2 town, I want Chitti to tell me whether a fault is real and what the fair repair costs so that the service centre cannot overcharge my one family car.*
- **Chitti's first move:** six-field diagnosis + fair-price band before he reaches the workshop.

## P2 — Ravi, 38 — Taxi / Ola-Uber Driver (car is livelihood)
- **Car:** Hyundai Aura / Toyota Etios, runs 200+ km/day; airport runs at all hours.
- **Needs:** zero downtime; a dead car is zero income; must know fast if it's roadworthy.
- **Pain:** every garage knows he's desperate and overcharges; a wrong diagnosis costs him a day.
- **Story:** *As a taxi driver, I want Chitti to tell me — "is my taxi roadworthy for the airport run right now?" — and what the real repair costs so that I don't lose a day's fares to a scamming mechanic.*
- **Chitti's first move:** can-I-drive verdict (roadworthy-for-the-run) + fair-price band before he stops earning. OBD2 freeze-frame when he has the ₹400 reader.

## P3 — Meera, 41 — Small-Business Fleet Manager
- **Fleet:** 4 cars + 2 bikes for a local distribution business — Swift Dzire ×2, Nexon, Bolero.
- **Needs:** one dashboard for the whole fleet — which vehicle is due service, which has an open fault, which document expires when.
- **Story:** *As a small-business fleet manager, I want a single Chitti view of all my vehicles' health, service-due and document-expiry so that no vehicle is grounded by a surprise or a ₹10 000 PUC fine.*
- Served by the **Family / Fleet View** (PRD F15) + **Document Vault** (PRD F12) + **Vehicle Twin** (PRD F6).

## P4 — Lakshmi, 58 — Elderly Driver
- **Car:** Honda City, drives 5 km to the temple, market and grandchildren's school.
- **Needs:** comfort, simple language, slow voice, large icons; intimidated by service advisors.
- **Story:** *As an elderly driver, I want Chitti to explain in slow simple Tamil whether my car is safe and tell the service advisor the fair price for me so that nobody takes advantage of me.*
- Triggers **ELDERLY** adaptations ([§5c](../SAHAYAI_MASTER.md)): large text, slow speech, repeat button, simple mode.

## P5 — Anand, 33 — Blind Owner's Household (sound-first / describe-my-dashboard)
- **Context:** Anand is blind; the family car is driven by relatives, but Anand manages its upkeep, the documents and the service decisions.
- **Needs:** to know what the dashboard warning lights mean and whether a problem is serious — entirely by voice and sound.
- **Story:** *As a blind user, I want Chitti to read my dashboard aloud — "check-engine light on, coolant temperature high — do not drive, engine may seize" — and diagnose the engine by its sound so that I manage the car's health independently.*
- See blind-user adaptation below. Sound Doctor (F3) + Dashboard Doctor (F2) are his primary surfaces.

## P6 — Imran, 28 — Deaf Driver
- **Car:** Tata Nexon.
- **Needs:** everything as visual cards + text + symbols + ISL; no audio-only step; the Sound Doctor must show a *visual* waveform + result, never rely on him hearing.
- **Story:** *As a deaf driver, I want every diagnosis as a visual card with severity icons and an ISL panel so that I never miss information delivered by voice.*

## P7 — Priya, 25 — Mute Driver (photo-first)
- **Car:** Hyundai Venue.
- **Needs:** complete the whole flow with taps + photos; voice optional; "show, don't tell."
- **Story:** *As a mute driver, I want to photograph the coolant leak, the dashboard and the service bill and get a full diagnosis using only taps and photos so that I never need to speak.*

## P8 — Bhola, 47 — Illiterate Driver (voice + icons, rural)
- **Car:** Mahindra Bolero — the workhorse of his small transport business.
- **Needs:** audio-first, picture menus, zero reading, works on 2G; trusts a voice, not a screen of text.
- **Story:** *As a driver who cannot read, I want to speak my problem and hear the answer with picture icons so that I can decide about my car without reading a single word.*

## P9 — Kavya, 29 — Woman Driver (night-safety)
- **Car:** Maruti Baleno, drives to work and back after dark, sometimes long highway stretches.
- **Needs:** the car reliable and safe; a breakdown after dark is a safety risk, not just an inconvenience; SOS that calls *family*, never strangers.
- **Story:** *As a woman who drives alone after dark, I want Chitti to keep my car reliable and, if I break down, to alert my family — never the police or a stranger — so that I am safe.*
- Triggers the **Roadside SOS → family cascade** (PRD F9). **Never auto-dials 100/108/112.**

## P10 — Vikram, 36 — Used-Car Buyer
- **Context:** about to buy a second-hand Hyundai Creta for ₹11 lakh.
- **Needs:** an independent inspection so the seller can't hide an accident repair, a slipping clutch, a tampered odometer or a cleared check-engine code.
- **Story:** *As a used-car buyer, I want Chitti to run a 100-point inspection with an OBD2 scan and flag the hidden problems so that I don't overpay for a car about to need ₹1 lakh of repairs.*
- Served by the **Used Vehicle Inspector** (PRD F8) + the seller's **Vehicle Health Passport** (PRD F10). **HUGE for cars — India's used-car market.**

---

## Persona → adaptation matrix (inherited from chitti_a11y.js)

| Persona | Profile flag | Adaptation (auto) |
|---|---|---|
| Lakshmi | ELDERLY | Large text · slow speech · repeat button · simple mode |
| Anand | BLIND | Everything spoken · describe-my-dashboard · sound-first diagnosis · no visual-only |
| Imran | DEAF | Visual cards + severity icons + text + ISL · Sound Doctor shows waveform · no audio-only |
| Priya | MUTE | Tap / photo input · voice never required · photo-first flow |
| Bhola | ILLITERATE + RURAL | Voice-everything · picture menus · 2G mode · SMS fallback |
| Kavya | (safety profile) | SOS prominent · family cascade · never cops |

---

## Anti-persona — who we explicitly do NOT optimize for

- The **service centre / advisor** who wants leads. Chitti will route an owner to
  a *human* only for Professional/Emergency jobs, and only after arming them with
  the fair price — never as a paid funnel. We lose the workshop's business model on
  purpose (Founder Rule).
- The **engagement-maximizing parts marketplace** that wants the owner to buy
  more. Chitti's best answer is often *"sirf gas top-up chahiye, compressor theek
  hai"* (just needs a gas top-up, the compressor is fine) — and that answer, which
  saves ₹33 000, is correct.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
