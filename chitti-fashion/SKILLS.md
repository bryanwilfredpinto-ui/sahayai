🎖️ World Class Chitti Fashion — Skills

> CTO-standard skills index. Detailed skill definitions live in [skills/](skills/);
> the user-facing capability surface (parsed live by `chitti_features.js`) is
> [skills/FEATURES.md](skills/FEATURES.md).

## CFOS v2.0 — the 12 skills (Level 4)

| # | Skill | Where it lives | Status |
|---|---|---|---|
| 01 | **Clothing recognition** (shirt/saree/kurta/jeans/blazer/shoes…) | vision — needs LLM | 🔵 vision-pending; categories used today |
| 02 | **Colour matching** (complementary/analogous/monochrome + real undertone/value/chroma) | engine `analyseColour`/`colorHarmony` + [color-theory.md](skills/color-theory.md) | 🟢 |
| 03 | **Body-proportion analysis** (garment terms, never shame) | engine `fitNote` + [body-proportion.md](skills/body-proportion.md) | 🟢 |
| 04 | **Climate intelligence** (weather/location/season, fabric→season) | engine `fabricSeason`/`seasonalSuitability` + [climate agent](swarm/climate-agent.md) | 🟢 |
| 05 | **Cultural intelligence** (region/religion/festival) | engine ethnic detection + [CULTURAL_INTELLIGENCE.md](CULTURAL_INTELLIGENCE.md) | 🟢 |
| 06 | **Accessibility assistant** (blind/deaf/mute/illiterate) | [accessibility/](accessibility/) + a11y substrate | 🟢 |
| 07 | **Budget optimizer** (₹0 → ₹500 → ₹2000 → ₹10000, ₹0 first) | [budget-stylist.md](skills/budget-stylist.md) + Founder Rule | 🟢 |
| 08 | **Sustainability advisor** (reuse score · cost-per-wear) | [SUSTAINABILITY.md](SUSTAINABILITY.md) + Audit | 🟢 |
| 09 | **Fashion teacher** (explain WHY) | Learn + [teacher agent](swarm/teacher-agent.md) | 🟢 |
| 10 | **Travel stylist** (destination-based) | Travel Packing | 🟢 |
| 11 | **Adaptive clothing** (disability-friendly) | [ADAPTIVE_CLOTHING.md](ADAPTIVE_CLOTHING.md) | 🟢 guidance; UI surface 🟡 |
| 12 | **Fashion Digital Twin** (wardrobe/usage/history + learning) | [FASHION_TWIN.md](FASHION_TWIN.md) + engine learning loop | 🟢 profile + learning |

## Features

| Feature | Status | Tested By | Date |
|---|---|---|---|
| Dress Me From What I Own (hero) | ✅ LIVE | CTO | 2026-06-03 |
| Wardrobe / Almari (on-device) | ✅ LIVE | CTO | 2026-06-03 |
| Outfit Review (7-agent swarm vote) | ✅ LIVE | CTO | 2026-06-03 |
| Occasion Readiness | ✅ LIVE | CTO | 2026-06-03 |
| Weather Readiness | ✅ LIVE | CTO | 2026-06-03 |
| Budget Alternatives (Free→Budget→Premium) | ✅ LIVE | CTO | 2026-06-03 |
| Wardrobe Audit / Closet AI | ✅ LIVE | CTO | 2026-06-03 |
| Festival & Cultural AI | ✅ LIVE | CTO | 2026-06-03 |
| Confidence / Interview Coach | ✅ LIVE | CTO | 2026-06-03 |
| Describe My Outfit (blind users) | ✅ LIVE | CTO | 2026-06-03 |
| Fashion Learning Mode (teach why) | ✅ LIVE | CTO | 2026-06-03 |
| Accessibility Fashion (adaptive dressing) | ✅ LIVE | CTO | 2026-06-03 |
| Travel Packing AI | ✅ LIVE | CTO | 2026-06-03 |
| Emergency Fashion | ✅ LIVE | CTO | 2026-06-03 |
| 🩺 Clothing Doctor (repair-not-buy) | ✅ LIVE | CTO | 2026-06-05 |
| 💍 Wedding Planner (family coordination) | ✅ LIVE | CTO | 2026-06-05 |
| 📅 Office Week Planner (5 days, no repeats) | ✅ LIVE | CTO | 2026-06-05 |
| Family Stylist + Fashion Twin | ✅ LIVE | CTO | 2026-06-05 |
| AR Try-On · On-device camera ISL | 🔵 COMING SOON | — | — |

## Skill definitions (reasoning libraries)

- [fashion-stylist.md](skills/fashion-stylist.md) · [color-theory.md](skills/color-theory.md) · [body-proportion.md](skills/body-proportion.md)
- [cultural-fashion.md](skills/cultural-fashion.md) · [accessibility-fashion.md](skills/accessibility-fashion.md)
- [makeup-advisor.md](skills/makeup-advisor.md) · [footwear-advisor.md](skills/footwear-advisor.md) · [jewellery-advisor.md](skills/jewellery-advisor.md)
- [wardrobe-planner.md](skills/wardrobe-planner.md) · [occasion-planner.md](skills/occasion-planner.md) · [budget-stylist.md](skills/budget-stylist.md)

## Indian user support

- Office cultures by city · Indian wedding hierarchy · festival appropriateness ·
  regional dress (Bengali, Rajasthani, South Indian, Punjabi) · Indo-western fusion ·
  budget platforms (Meesho/Myntra/Ajio/local market).

## Language support

Anchored to **Chitti Vaani's** language surface (per [CTO.md §5](../chitti-cto/CTO.md), updated 2026-06-03):
**9 primary — 100% native UI** (87/87 labels, verified 0 English fallback):
English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam —
plus the **26-language Voice Factory substrate** (`chitti_lang.js`) auto-enriching
the selector + voice-out. (Cousin-language UI text = English baseline pending
community translation per the locked voice strategy.)
No Hinglish — one pure language per response.

## Commando standard

- 375px mobile-first · 2G compatible · works for blind/deaf/mute/illiterate ·
  ISL on every page · 5 mandatory elements on every box · no body commentary, ever.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
