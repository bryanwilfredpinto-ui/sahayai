🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Bike Doctor

Every feature in [PRD.md](PRD.md) names which personas it serves. A feature that
serves none of them is not built. The four-user accessibility contract
([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) is the floor under all of them.

Each persona carries a **user story** in the canonical form:
*"As an Indian [user], I want [action] so that [outcome]."*

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

## Persona → adaptation matrix (inherited from chitti_a11y.js)

| Persona | Profile flag | Adaptation (auto) |
|---|---|---|
| Lakshmamma | ELDERLY | Large text · slow speech · repeat button · simple mode |
| Arjun | BLIND | Everything spoken · describe-my-dashboard · sound-first diagnosis · no visual-only |
| Imran | DEAF | Visual cards + severity icons + text + ISL · Sound Doctor shows waveform · no audio-only |
| Pooja | MUTE | Tap / photo input · voice never required · photo-first flow |
| Babu | ILLITERATE + RURAL | Voice-everything · picture menus · 2G mode · SMS fallback |
| Fatima | (safety profile) | SOS prominent · family cascade · never cops |

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
