🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# PERSONAS — Chitti Government (CEOS v1.0)

> Citizen archetypes the product is designed for. The first eight are *life-stage*
> personas; the six **Universal Accessibility Personas** cut across all of them and
> are the floor every feature must clear ([accessibility/](accessibility/)).

---

## Life-stage personas

### 1. Student — Anitha, 17, Govt school, Warangal (TS)
**Needs:** scholarships (Post-Matric, NMMS, PM-YASASVI), education loan
(PM-Vidyalaxmi), internships, skill development (Skill India). **Blocker:** doesn't
know the National Scholarship Portal exists; deadline passes every year.
**Chitti job:** surface every scholarship she qualifies for + documents + the NSP
deadline, in Telugu, by voice.

### 2. Farmer — Ramesh, 44, 1.5 acre, Latur (MH)
**Needs:** PM-KISAN, PMFBY crop insurance, Kisan Credit Card, Soil Health Card,
PM-KUSUM solar pump, state Namo Shetkari. **Blocker:** illiterate; relies on a
broker who takes a cut of his PM-KISAN. **Chitti job:** confirm his ₹6,000/yr is
arriving, flag the e-KYC deadline, detect the fake "PM-Kisan KYC" SMS, all in
Marathi by voice.

### 3. Woman / girl-child — Sunita, 28, Bhubaneswar (OD)
**Needs:** PMMVY maternity benefit, Sukanya Samriddhi for her daughter, Ujjwala
LPG, state Subhadra, self-help-group support. **Chitti job:** life-event "daughter
born" → birth certificate + Sukanya + vaccination + school pathway, in Odia.

### 4. Senior citizen — Abdul, 68, Hyderabad (TS)
**Needs:** IGNOAPS old-age pension, Atal/Vaya Vandana pension, Ayushman 70+,
travel + tax concessions, Rashtriya Vayoshri aids. **Blocker:** low vision, can't
read forms. **Chitti job:** large-text + voice, eligibility for the 70+ Ayushman
expansion, life-certificate (Jeevan Pramaan) deadline reminder.

### 5. Worker (informal) — Lakshmi, 35, domestic worker, Chennai (TN)
**Needs:** e-Shram card, PM-SYM pension, Ayushman/ESI, building & other
construction worker welfare, PM Vishwakarma (if artisan). **Chitti job:** register
on e-Shram by voice, explain what the card unlocks.

### 6. Disabled citizen — Joseph, 31, Kochi (KL)
**Needs:** UDID disability certificate, Divyangjan pension, ADIP assistive aids,
PwD scholarships, reservation in jobs/education. **Chitti job:** UDID application
walkthrough, screen-reader-perfect, document checklist, state disability pension.

### 7. Business owner / MSME — Farid, 39, kirana + small unit, Jaipur (RJ)
**Needs:** Udyam registration, PM Mudra / PMEGP loan, GST, Stand-Up India,
CGTMSE, PM Vishwakarma, ONDC onboarding. **Chitti job:** Udyam in minutes, the
right loan scheme for his ticket size, GST deadline tracking.

### 8. Family manager — Priya, 41, Pune (MH) — *the power user*
Manages **her own** + her parents' + spouse's + two children's government life.
**Chitti job:** Family Governance OS — every member's documents, schemes, renewals,
readiness score, in one dashboard, on her device.

---

## Universal Accessibility Personas (the floor — apply to ALL eight above)

| Persona | Design contract |
|---|---|
| **Blind** | Voice-first. Every screen auto-announces; every action speaks; `🔊 Read page` everywhere; nothing visual-only. |
| **Deaf** | Visual cards + captions + **ISL panel** on every response. Symbols **and** word labels (✅ Eligible / ⚠️ Partial / ❔ Unknown). Never colour alone. |
| **Mute** | Tap-first. Every input is a button/dropdown. Voice input optional, never required. |
| **Illiterate** | Voice + icons. Picture menus. Voice-out for everything. The 26-language dropdown read aloud. |
| **Low Vision** | Large text mode, high contrast, scalable. |
| **Cognitive challenges** | One step at a time. Simple language. No overwhelming walls of schemes. |

Plus **Elderly** and **Rural / low-connectivity** from the
[User Disability Profile](../SAHAYAI_MASTER.md): slow speech, repeat button, 2G
mode, SMS fallback, missed-call callback.

## Multi-language

**22+ Indian languages at launch, 100+ over time.** Today the
[`chitti_lang.js`](../chitti_lang.js) substrate ships **26 languages** with a
working whole-page dropdown — that is the hard accessibility gate for every persona
above.

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
