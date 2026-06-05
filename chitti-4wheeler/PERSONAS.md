🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Car Doctor

Every feature in [PRD.md](PRD.md) names which personas it serves. A feature that
serves none of them is not built. The four-user accessibility contract
([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) is the floor under all of them.

Each persona carries a **user story** in the canonical form:
*"As an Indian [user], I want [action] so that [outcome]."*

These car-specific personas are the **named, lived** versions of the canonical
COSDF archetypes P1–P10 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md)
**LEVEL 2**). The COSDF crosswalk is at the end of this file — every COSDF archetype
is covered, adapted to a 4-wheeler (Car Doctor) reality. Where an archetype is
inherently a 2-wheeler / rural-only role, it is mapped to its **car-world equivalent**
and any gap is marked roadmap (never faked — §3 honest-stubs).

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

## COSDF archetypes carried into the car world (P11–P13)

COSDF P1 (farmer/tractor), P2 (student/2-wheeler) and P8 (professional mechanic)
are not native to a 4-wheeler product. They are kept here as **first-class personas
mapped to their car-world equivalent**, so the COSDF crosswalk is honest end-to-end
and nothing is dropped.

## P11 — Devendra, 52 — Farmer with a Pickup / Utility 4×4 (COSDF P1 — tractor → utility-vehicle)
- **Vehicle:** Mahindra Bolero Pik-Up / Tata Yodha, hauls produce to the mandi; the tractor is COSDF P1's domain (see [chitti-2wheeler / Tractor Mode](../chitti-2wheeler/) + PRD F11 roadmap). For the car product, his **diesel utility 4×4** is the surface.
- **Needs:** diagnose a diesel utility vehicle with **no mechanic within 50 km**; works **offline** in the field on a 2G feature-phone-class connection; voice-first, low-literacy.
- **Pain:** a grounded pick-up means the day's produce rots; the nearest diesel mechanic is a 60 km tow away.
- **Story:** *As a farmer whose pick-up is my livelihood, I want Chitti to diagnose a diesel fault by sound and voice — offline, with no mechanic nearby — so that I can keep hauling to the mandi without a 60 km tow.*
- **Chitti's first move:** offline-cached diesel SOP + Sound Doctor + nearest-help cache. **Full tractor / generator / water-pump diagnosis = roadmap (PRD F11, rural differentiator) — not faked today.**

## P12 — Arjun, 21 — Student Driving the Family Hatchback (COSDF P2 — student)
- **Vehicle:** the household Maruti Alto / WagonR he borrows for college and errands; no income of his own.
- **Needs:** **budget repairs ₹500–2 000**; preventive alerts before a small problem becomes a big bill his parents pay; learn enough to not be cheated.
- **Pain:** zero repair knowledge, zero spare cash, and a service centre that sees a young face and upsells.
- **Story:** *As a student borrowing the family car, I want Chitti to flag cheap fixes early and teach me what's real so that I keep the car running on a student budget and never hand a mechanic an excuse to overcharge.*
- **Chitti's first move:** preventive alert (Vehicle Twin, PRD F6) + DIY-feasibility for the cheap, safe jobs + fair-price band. Served alongside the **repair-education** Founder-Rule priority.

## P13 — Rafiq, 39 — Professional Mechanic (COSDF P8 — pro-tool mode)
- **Context:** runs a 2-bay independent garage; uses Chitti as a **faster lookup**, not a replacement for his judgment.
- **Needs:** rapid OBD2 DTC decode, P-code → likely-component shortlists, parts-compatibility hints, labour-time reference — to quote a customer faster and more honestly.
- **Story:** *As an independent garage mechanic, I want Chitti to decode the OBD2 code, shortlist likely components and give a labour-time reference so that I quote my customer faster and at a fair price.*
- **Chitti's first move:** OBD2 freeze-frame + SAE J2012 P-code decode (PRD F3, LIVE) + fair-band. **Wiring diagrams + full parts-compatibility DB = roadmap (PRD pro-tool track) — deterministic decode is LIVE, the diagram library is not.**
- *Note:* Rafiq is a **partner, not the anti-persona**. The anti-persona is the *overcharging* advisor — Chitti arms the honest mechanic and exposes the dishonest quote.

---

## COSDF P1–P10 crosswalk (canonical archetype → this car persona)

Every COSDF LEVEL-2 archetype, mapped to the lived Car Doctor persona that carries
it. The four-user accessibility contract (P5–P8 in COSDF terms) is the floor under
all of them ([../SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)).

| COSDF # | Canonical archetype | Car Doctor persona | Notes |
|---|---|---|---|
| **P1** | Farmer (tractor) | **P11 Devendra** — diesel utility 4×4 | Tractor/generator/water-pump = roadmap (PRD F11); diesel-utility surface is the car-world live mapping |
| **P2** | Student (2-wheeler) | **P12 Arjun** — family hatchback | Mapped to a borrowed car; budget ₹500–2 000, preventive, education |
| **P3** | Professional driver (car) | **P2 Ravi** — taxi / Ola-Uber driver | Native fit; can-I-drive verdict + roadside SOS + mechanic verification |
| **P4** | Senior citizen | **P4 Lakshmi** — elderly driver | ELDERLY profile: large text, slow speech, simple mode |
| **P5** | Blind | **P5 Anand** — blind owner's household | Voice-only, describe-my-dashboard, Sound Doctor; no visual-only step |
| **P6** | Deaf | **P6 Imran** — deaf driver | Visual cards + severity icons + text + ISL; waveform, never audio-only |
| **P7** | Illiterate | **P8 Bhola** — illiterate rural driver | Audio + icons only; 👍👎; 2G; SMS fallback. (Mute = **P7 Priya**, photo-first) |
| **P8** | Professional mechanic | **P13 Rafiq** — independent garage | Faster OBD lookup; wiring diagrams = roadmap |
| **P9** | Fleet owner | **P3 Meera** — small-business fleet manager | Multi-vehicle health, service-due, document-expiry (PRD F12/F15) |
| **P10** | Used-vehicle buyer | **P10 Vikram** — used-car buyer | 100-point inspection + OBD2 + Health Passport (PRD F8/F10) |

Two car-world personas have **no COSDF archetype** and are kept because the car
context demands them:
- **P1 Suresh** — the single-family-car owner facing service-centre upsell. The
  North-Star persona (see [SUCCESS_METRICS.md](SUCCESS_METRICS.md)): one car, no
  spare cash, the upsell is the whole threat.
- **P9 Kavya** — the woman driving alone after dark. Drives the **Roadside SOS →
  family cascade** (PRD F9); **never auto-dials 100/108/112** ([../SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md)).

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
| Devendra | ILLITERATE + RURAL + OFFLINE | Offline-cached SOPs · voice-first · diesel sound library · nearest-help cache |
| Arjun | (budget profile) | Cheapest-safe-fix first · preventive alerts · repair education |
| Rafiq | PRO-MECHANIC | Fast OBD2 decode · P-code shortlist · labour-time ref (wiring diagrams roadmap) |

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
