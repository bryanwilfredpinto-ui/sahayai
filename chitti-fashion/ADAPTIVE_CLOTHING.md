🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# ADAPTIVE_CLOTHING — CFOS v2.0

> Adaptive / accessible dressing — the surface almost no fashion app builds.
> For wheelchair users, seniors, limited-dexterity, low-vision, and sensory-sensitive
> users. Persona **P12 (Adaptive Clothing User)**. Skill:
> [skills/accessibility-fashion.md](skills/accessibility-fashion.md). SOP:
> [sop/accessibility-fashion.md](sop/accessibility-fashion.md).

## Principle

**Adaptive choices are good fashion, never a compromise.** Comfort, dignity and
independence are styled *as* style — never framed as medical or lesser.

## Guidance library

| Need | Adaptive guidance |
|---|---|
| Limited dexterity | magnetic / velcro / large-button / front-open over pullover (engine `fitNote` code `easy_fasten`) |
| Seated / wheelchair | shorter back-rise, no bulky back pockets, drape that sits well seated, jackets that don't bunch |
| Low vision | high-contrast pairings the user identifies by feel + Chitti's spoken label; consistent storage |
| Senior comfort | breathable fabric, easy waistbands, weather-safe layers, non-slip footwear (judge code `senior_footwear`) |
| Sensory sensitivity | tagless, soft seams, natural fibres |
| One-handed dressing | step-in styles, elastic, side-zips |

## How it's enforced in the engine

- The **AI Judge** ([engine](../chitti_fashion_engine.js) `judge()`) raises flags with
  language-neutral codes (`senior_footwear`, `easy_fasten`, `child_safety`) that the page
  localizes into all 9 languages.
- The **Accessibility Agent** ([swarm/accessibility-agent.md](swarm/accessibility-agent.md))
  holds a verdict if it scores < 6 — an inaccessible recommendation is rephrased before
  it reaches the user. **Accessibility never loses a tie.**

## Future — Haptic Fashion (DeafBlind)

For DeafBlind users, a wearable **haptic** channel (vibration patterns conveying
colour/occasion/confidence) is on the roadmap ([ROADMAP.md](ROADMAP.md)) — inspired by
assistive-robotics research. 🔵 COMING SOON, never claimed as built.

## Hard rules

- Never frame adaptive clothing as a downgrade.
- Never sacrifice fall-safety / independence for looks — say so plainly.
- 100% accessibility pass is a release blocker ([EVALS.md](EVALS.md)).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
