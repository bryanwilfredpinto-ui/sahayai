🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Bike Doctor

Every feature in [PRD.md](PRD.md) names which personas it serves. A feature that
serves none of them is not built. The four-user accessibility contract
([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) is the floor under all of them.

Each persona carries a **user story** in the canonical form:
*"As an Indian [user], I want [action] so that [outcome]."*

These twelve personas instantiate the ten canonical COSDF archetypes
([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 2 — P1–P10)
onto the two-wheeler reality, plus the two archetypes COSDF added that had no
prior Bike Doctor persona (professional mechanic, fleet owner). The
[COSDF P1–P10 crosswalk](#cosdf-p1p10-crosswalk-canonical-framework--bike-doctor)
below maps each one explicitly. The four-user contract
(blind/deaf/mute/illiterate — P5/P6/P7/P8 here, COSDF P5/P6/P7) is the **floor
under all of them**, never a separate tier.

---

## P1 — Ramesh, 27 — Delivery Rider (bike is livelihood)
- **Bike:** Honda Activa 6G, 68 000 km, runs 120 km/day for Zomato.
- **Needs:** zero downtime; every hour the bike is dead is income lost; fair repair fast.
- **Pain:** workshops know he's desperate and overcharge; he can't afford a wrong diagnosis.
- **Story:** *As a delivery rider, I want Chitti to tell me if I can finish today's deliveries safely and what the real repair will cost so that I don't lose a day's earnings to a scamming mechanic.*
- **Chitti's first move:** can-I-drive verdict + fair-price band before he stops working.

## P2 — Sneha, 20 — College Student
- **Bike:** TVS Jupiter (shared with younger brother), tight pocket money.
- **Needs:** cheap fixes, DIY where safe, knows nothing about engines.
- **Story:** *As a college student, I want Chitti to walk me through a ₹40 spark-plug fix step by step so that I don't pay ₹500 labour for five minutes of work.*

## P3 — The Sharma Family — Single-Bike Household
- **Bike:** Hero Splendor Plus, the family's only vehicle — father commutes, mother shops, son rides to tuition.
- **Needs:** the bike must *never* be unexpectedly dead; preventive reminders for the whole family.
- **Story:** *As a single-bike family, I want Chitti to remember our bike and warn us before something fails so that we are never stranded with no backup.*
- Served by the **Vehicle Twin** (PRD F6) + **Preventive Maintenance** (PRD F11).

## P4 — Lakshmamma, 64 — Elderly Scooter Owner
- **Bike:** Honda Activa, rides 3 km to the temple and market.
- **Needs:** comfort, simple language, slow voice, large icons; intimidated by mechanics.
- **Story:** *As an elderly scooter owner, I want Chitti to explain in slow simple Kannada whether my scooter is safe and tell the mechanic the fair price for me so that nobody takes advantage of me.*
- Triggers **ELDERLY** adaptations ([§5c](../SAHAYAI_MASTER.md)): large text, slow speech, repeat button, simple mode.

## P5 — Arjun, 31 — Blind Rider's Household (sound-first / describe-my-dashboard)
- **Context:** Arjun is blind; the family scooter is ridden by relatives, but Arjun manages its upkeep and the documents.
- **Needs:** to know what the dashboard warning lights mean and whether a problem is serious — entirely by voice and sound.
- **Story:** *As a blind user, I want Chitti to read my dashboard aloud — "engine warning light on, oil pressure low — do not ride, this is serious" — and diagnose the engine by its sound so that I manage the bike's health independently.*
- See blind-user adaptation below. Sound Doctor (F3) + Dashboard Doctor (F2) are his primary surfaces.

## P6 — Imran, 24 — Deaf Rider
- **Bike:** Bajaj Pulsar 150.
- **Needs:** everything as visual cards + text + symbols + ISL; no audio-only step; the Sound Doctor must show a *visual* waveform + result, never rely on him hearing.
- **Story:** *As a deaf rider, I want every diagnosis as a visual card with severity icons and an ISL panel so that I never miss information delivered by voice.*

## P7 — Pooja, 22 — Mute Rider (photo-first)
- **Bike:** TVS Ntorq.
- **Needs:** complete the whole flow with taps + photos; voice optional; "show, don't tell."
- **Story:** *As a mute rider, I want to photograph the leak, the dashboard and the mechanic's bill and get a full diagnosis using only taps and photos so that I never need to speak.*

## P8 — Babu, 49 — Illiterate Rider (voice + icons, rural)
- **Bike:** Hero HF Deluxe, the workhorse of his small farm.
- **Needs:** audio-first, picture menus, zero reading, works on 2G; trusts a voice, not a screen of text.
- **Story:** *As a rider who cannot read, I want to speak my problem and hear the answer with picture icons so that I can fix my bike without reading a single word.*

## P9 — Fatima, 26 — Woman Rider (safety-first)
- **Bike:** Suzuki Access 125, rides to work and back after dark.
- **Needs:** the bike to be reliable and safe; a breakdown after dark is a safety risk, not just an inconvenience; SOS that calls *family*, never strangers.
- **Story:** *As a woman who rides alone after dark, I want Chitti to keep my scooter reliable and, if I break down, to alert my family — never the police or a stranger — so that I am safe.*
- Triggers the **Roadside SOS → family cascade** (PRD F9). **Never auto-dials 100/108/112.**

## P10 — Vivek, 30 — Used-Bike Buyer
- **Context:** about to buy a second-hand Royal Enfield Classic 350 for ₹95 000.
- **Needs:** an independent inspection so the seller can't hide a worn chain, a slipping clutch or a tampered odometer.
- **Story:** *As a used-bike buyer, I want Chitti to run a 100-point inspection and flag the hidden problems so that I don't overpay for a bike about to need ₹20 000 of repairs.*
- Served by the **Used Vehicle Inspector** (PRD F8) + the seller's **Vehicle Health Passport** (PRD F10).

---

---

## COSDF P1–P10 crosswalk (canonical framework → Bike Doctor)

The ten personas above are the **Bike Doctor instantiation**. The canonical
COSDF persona set ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 2)
is vehicle-agnostic (it spans tractors, cars, generators). This table maps each
canonical archetype onto **a real two-wheeler user**, in the canonical
*"As a [user], I want [action] so that [outcome]"* form. Where a canonical
archetype has no natural 2-wheeler analogue (a tractor is not a bike), it is
mapped to the nearest bike reality and any 4-wheeler/tractor depth is marked
**roadmap** (owned by the sibling [chitti-4wheeler](../chitti-4wheeler/) and the
F11 Tractor/Generator mode, COSDF roadmap).

| COSDF | Archetype | Bike Doctor persona | Canonical user story (this vehicle) |
|---|---|---|---|
| **P1** | Farmer (tractor) | **Babu (P8)** — rural workhorse rider; tractor/pump depth = **roadmap** | *As a farming family rider with a Hero HF Deluxe that doubles as my farm vehicle, I want Chitti to diagnose it by voice on a 2G signal with no mechanic for 40 km so that the bike that carries my produce is never stranded.* |
| **P2** | Student (2-wheeler) | **Sneha (P2)** | *As a college student, I want Chitti to walk me through a ₹40 spark-plug fix step by step so that I don't pay ₹500 labour for five minutes of work.* |
| **P3** | Professional driver (car) | **Ramesh (P1)** — delivery rider; bike is income | *As a delivery rider, I want Chitti to tell me if I can finish today's deliveries safely and what the real repair will cost so that I don't lose a day's earnings to a scamming mechanic.* |
| **P4** | Senior citizen | **Lakshmamma (P4)** | *As an elderly scooter owner, I want Chitti to explain in slow simple Kannada whether my scooter is safe and tell the mechanic the fair price for me so that nobody takes advantage of me.* |
| **P5** | Blind | **Arjun (P5)** | *As a blind user, I want Chitti to read my dashboard aloud and diagnose the engine by its sound so that I manage the bike's health independently — voice-only, with haptic confirmation.* |
| **P6** | Deaf | **Imran (P6)** | *As a deaf rider, I want every diagnosis as a visual card with severity icons, a waveform for the Sound Doctor, and an ISL panel so that I never miss information delivered by voice.* |
| **P7** | Mute / illiterate | **Pooja (P7)** + **Babu (P8)** | *As a rider who cannot speak (or cannot read), I want to complete the whole flow with taps, photos and picture-icons — hearing the answer aloud with 👍/👎 feedback — so that I never need to speak or read a single word.* |
| **P8** | Professional mechanic | **Suresh (P11, new below)** | *As a roadside two-wheeler mechanic, I want fast symptom→cause lookups, wiring references and OEM service intervals so that I diagnose a customer's bike faster and quote honestly.* |
| **P9** | Fleet owner | **Khan Travels (P12, new below)** | *As the owner of a 14-scooter rental/delivery fleet, I want one dashboard of every bike's health, due-service and rider-reported faults so that I catch a failing bike before it strands a rider.* |
| **P10** | Used-vehicle buyer | **Vivek (P10)** | *As a used-bike buyer, I want Chitti to run a 100-point inspection and flag the hidden problems so that I don't overpay for a bike about to need ₹20 000 of repairs.* |

Two canonical archetypes — **professional mechanic (P8)** and **fleet owner
(P9)** — had no first-class Bike Doctor persona before COSDF. They are added
below so the crosswalk is honest rather than aspirational.

## P11 — Suresh, 38 — Roadside Two-Wheeler Mechanic (COSDF P8)
- **Context:** runs a single-bay roadside garage off a Tier-2 city highway; 15–20 bikes a day, mostly Activa / Splendor / Pulsar / Jupiter; no diagnostic computer, only spanners and experience.
- **Needs:** faster symptom→cause lookup, OEM service intervals, fuse/relay locations and wiring colour references on his phone; an honest second opinion he can show the customer.
- **Pain:** a misdiagnosis costs him his reputation on the highway; he loses time chasing intermittent electrical faults by hand.
- **Story:** *As a roadside mechanic, I want Chitti to give me a fast ranked symptom→cause list, the OEM service interval, and the fuse/relay reference for this exact model so that I diagnose faster and quote the customer honestly.*
- **Honesty contract:** Chitti will **not** become a lead-funnel to push parts; it arms Suresh with the *fair* band and surfaces the same "do nothing, it's fine" verdict it would give the rider. Deep OEM wiring diagrams + labour-time database = **roadmap** (COSDF L5 skills `electrical`/`obd`), seeded from the Swarm mechanic-verification loop.

## P12 — Khan Travels — Two-Wheeler Fleet Owner (COSDF P9)
- **Context:** runs 14 scooters (Access 125 / Activa) on rental + last-mile delivery in a metro; riders rotate daily, no single rider owns a bike's history.
- **Needs:** a single view of every bike's Vehicle Twin — odometer, due-service, open faults, rider-reported issues — and a weekly cost report; alerts *before* a bike strands a paying rider.
- **Pain:** rider-reported faults are lost in WhatsApp; a missed service becomes a roadside breakdown and a refunded fare; no per-bike cost visibility.
- **Story:** *As a fleet owner, I want one dashboard showing every scooter's health score, due-service and rider-reported faults so that I service a failing bike before it strands a rider — and a monthly ₹-saved report so I see Chitti paying for itself.*
- Served by a **fleet view over the Vehicle Twin** (PRD F6) + **Vehicle Health Passport** (PRD F10) + **Preventive Maintenance** (PRD F11). Multi-vehicle dashboard, driver-behaviour scoring and per-fleet cost reports = **roadmap / COMING SOON** (COSDF L15 "family garage" extended to fleet scale; never faked — §3 honest-stubs).

---

## Persona → adaptation matrix (inherited from chitti_a11y.js)

| Persona | Profile flag | Adaptation (auto) |
|---|---|---|
| Lakshmamma | ELDERLY | Large text · slow speech · repeat button · simple mode |
| Arjun | BLIND | Everything spoken · describe-my-dashboard · sound-first diagnosis · no visual-only |
| Imran | DEAF | Visual cards + severity icons + text + ISL · Sound Doctor shows waveform · no audio-only |
| Pooja | MUTE | Tap / photo input · voice never required · photo-first flow |
| Babu | ILLITERATE + RURAL | Voice-everything · picture menus · 2G mode · SMS fallback |
| Fatima | (safety profile) | SOS prominent · family cascade · never cops |
| Suresh | (mechanic / pro mode) | Dense ranked lists · jargon allowed · OEM-interval + fuse refs · no hand-holding (*roadmap*) |
| Khan Travels | (fleet / operator mode) | Multi-vehicle dashboard · per-bike Twin · weekly cost report (*roadmap*) |

---

## Anti-persona — who we explicitly do NOT optimize for

- The **workshop owner** who wants leads. Chitti will route a rider to a *human*
  only for Professional/Emergency jobs, and only after arming them with the fair
  price — never as a paid funnel. We lose the workshop's business model on
  purpose (Founder Rule).
- The **engagement-maximizing parts marketplace** that wants the rider to buy
  more. Chitti's best answer is often *"kuch mat karo, theek hai"* (do nothing,
  it's fine) — and that answer is correct.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
