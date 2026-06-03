🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# PERSONAS — Chitti Fashion

Every feature in [PRD.md](PRD.md) names which personas it serves. A feature that
serves none of them is not built. The four-user accessibility contract
([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) is the floor under all of them.

Each persona carries a **user story** in the canonical form:
*"As an Indian [user], I want [action] so that [outcome]."*

---

## P1 — Aarti, 16 — School / College Student
- **Needs:** affordable, trendy-enough, peer-appropriate; ₹0–₹800 budget.
- **Pain:** wants to look current but cannot buy; parents control spend.
- **Story:** *As a student, I want outfits built from clothes I already own so that I look good without asking for money.*
- **Chitti's first move:** "Dress Me From What I Own" → recreate one trend from her almari.

## P2 — Rohan, 21 — College Student
- **Needs:** budget casual, fest/interview-ready, one good formal set.
- **Pain:** owns random pieces, never knows what goes together.
- **Story:** *As a college student, I want Chitti to tell me which of my shirts and jeans pair well so that I stop guessing every morning.*

## P3 — Meera, 29 — Working Professional
- **Needs:** office wear by city culture, interview formality, festive-Friday.
- **Pain:** decision fatigue; wants confidence, not a runway.
- **Story:** *As a professional, I want to know if this outfit is right for a Bangalore office vs a Delhi client meeting so that I am never over- or under-dressed.*

## P4 — Suresh, 68 — Senior Citizen
- **Needs:** comfort, easy fasteners, weather-safe, dignity.
- **Pain:** small text, fiddly buttons, apps not built for him.
- **Story:** *As an elderly user, I want large text, slow voice, and comfort-first advice so that dressing well does not become a struggle.*
- Triggers **ELDERLY** adaptations ([§5c](../SAHAYAI_MASTER.md)): large text, slow speech, repeat button, simple mode.

## P5 — Lakshmi, 34 — Blind User
- **Needs:** to know *what she is wearing* and whether it's suitable, by voice.
- **Pain:** every fashion app is image-only; she is invisible to them.
- **Story:** *As a blind user, I want Chitti to describe my outfit aloud — "blue cotton kurta, black leggings, brown sandals — suitable for office" — so that I dress with confidence and independence.*
- See [accessibility/blind_user.md](accessibility/blind_user.md).

## P6 — Imran, 24 — Deaf User
- **Needs:** everything as text + symbols + ISL; no audio-only step.
- **Story:** *As a deaf user, I want every recommendation captioned with symbols and an ISL panel so that I never miss information delivered by voice.*
- See [accessibility/deaf_user.md](accessibility/deaf_user.md).

## P7 — Priya, 19 — Mute User
- **Needs:** complete the whole flow with taps + photos; voice optional.
- **Story:** *As a mute user, I want to build my wardrobe and get advice using only taps and photos so that I never need to speak.*
- See [accessibility/mute_user.md](accessibility/mute_user.md).

## P8 — Kamala, 52 — Illiterate User (rural)
- **Needs:** audio-first, picture menus, zero reading, works on 2G.
- **Story:** *As a user who cannot read, I want to hear everything and tap pictures so that I can dress well for a wedding without reading a word.*
- See [accessibility/illiterate_user.md](accessibility/illiterate_user.md).

## P9 — The Family (cross-persona)
- One device, many wearers: father, mother, child, grandparent.
- **Story:** *As a family, I want one Chitti to dress all of us for the same wedding so that we coordinate without four separate apps.*
- Served by the **Family Stylist** (PRD F12), each wearer a separate local profile.

---

## Persona → adaptation matrix (inherited from chitti_a11y.js)

| Persona | Profile flag | Adaptation (auto) |
|---|---|---|
| Suresh | ELDERLY | Large text · slow speech · repeat button · simple mode |
| Lakshmi | BLIND | Everything spoken · describe-my-outfit · no visual-only |
| Imran | DEAF | Text + symbols + ISL · no audio-only |
| Priya | MUTE | Tap/type input · voice never required |
| Kamala | ILLITERATE + RURAL | Voice-everything · picture menus · 2G mode · SMS fallback |

---

## Anti-persona — who we explicitly do NOT optimize for

- The **engagement-maximizing shopper** an ad-funded app chases. We will lose that
  user to a shopping app, and that is correct (Founder Rule).
- The **luxury-signal seeker** who wants the app to validate expensive taste.
  Chitti is polite but budget-first; it will always show the ₹0 option first.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
