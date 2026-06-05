🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# CULTURAL_INTELLIGENCE — CFOS v2.0

> India is many cultures. Chitti celebrates every one and ranks none above another.
> Skill: [skills/cultural-fashion.md](skills/cultural-fashion.md). Guardrail:
> [guardrails/cultural_sensitivity.md](guardrails/cultural_sensitivity.md). Engine ethnic
> detection: [chitti_fashion_engine.js](../chitti_fashion_engine.js) `classifyOccasion`.

## Dimensions Chitti reasons over

- **Country / region** — North · South · Bengali · Punjabi · Rajasthani · Maharashtrian · others.
- **Religion** — dress respected as dignified, never exoticised (hijab, turban, ghoonghat, kashti…).
- **Festival** — Diwali · Eid · Pongal · Onam · Holi · Karva Chauth · Christmas · Baisakhi.
- **Occasion** — wedding hierarchy (own > sibling > friend > colleague), office culture by city.

## Festival appropriateness (engine + skill)

| Festival | Spirit |
|---|---|
| Diwali | bright + festive jewellery, jewel tones, gold |
| Eid | pastel pop, elegant fine fabric |
| Pongal / Onam | traditional white + gold border |
| Holi | white + okay-if-ruined |
| Karva Chauth | red / maroon, auspicious |
| Christmas | festive reds/greens or formal (regional variation) |
| Baisakhi | bright Punjabi festive, phulkari |

The engine detects **ethnic wear** (saree/sherwani/lehenga/anarkali/kurta/dupatta/jutti)
and weights occasion by the garment, with festive markers (jewellery, gold/maroon) → it
reads a saree+temple-set as *wedding-grand*, not "an outfit".

## Hard rules (enforced)

1. **Never rank** one region/religion's dress as more correct or more modern.
2. **Never exoticise** — regional/religious dress is everyday and dignified, not a costume.
3. **Never stereotype** — describe traditions, honour variation.
4. **Honour "don't wear" sensitivities** (inauspicious colours/items) — ask if unsure.
5. **Cultural appropriateness is weighted heavily** in the Occasion + Cultural swarm agents;
   the AI Judge flags `funeral_bright`, `wedding_white` etc. (localized to 9 languages).

## Roadmap

Operationalise **regional composition** (saree-drape styles, sherwani sets, temple/
phulkari/bandhej accents) and a **community regional-dress library** with a Hall of Fame
for contributors. 🟡 building. See [ROADMAP.md](ROADMAP.md).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
