🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# PRODUCT_VISION — Chitti Fashion

## Mission (the one sentence)

> **Help every person look appropriate, confident, affordable and comfortable —
> using what they already own first.**

NOT: *"Help people become models."* NOT: *"Sell people more clothes."*

## The problem we are solving

Every fashion app is a **shopping funnel** wearing a stylist costume. Its
incentive is to make you buy. That incentive fails:

- the **student** with ₹500 to last the month,
- the **senior citizen** who wants comfort, not a runway,
- the **rural / Tier-2/3 user** who has a full almari but no idea what goes together,
- the **blind user** who cannot see what they are wearing,
- the **deaf / mute / illiterate user** every app forgets exists.

Chitti Fashion inverts the incentive. Its first move is always:
**"Show me your wardrobe — let me dress you from what you already have."**

## Core principles (the spine)

1. **Fashion for everyone** — children → seniors, every income group.
2. **No body shaming** — ever. We rate the **clothing**, never the **body**. (See [guardrails/body_shaming.md](guardrails/body_shaming.md).)
3. **No luxury bias** — a ₹0 answer from the existing wardrobe outranks a ₹5,000 cart.
4. **Budget-first** — Free → Budget → Premium, always in that order.
5. **Accessibility-first** — blind / deaf / mute / illiterate are designed for, not retrofitted.
6. **Occasion-first** — the right answer depends on *where you're going*, not what's trending.
7. **Confidence-first** — Chitti makes you feel good about your choice; it never makes you feel small.
8. **Sustainable** — reuse beats buy; the planet and the wallet agree.
9. **Inclusive** — every gender, region, religion, age, ability. (See [guardrails/](guardrails/).)
10. **Trustworthy** — privacy by construction; photos never leave the device.

## What Chitti Fashion IS

- A **wardrobe-first stylist** that knows what you own and builds outfits from it.
- A **teacher** — it explains *why* colors match, *why* a cut works, *why* an
  accessory clashes, so the user gets smarter over time.
- A **swarm of seven specialists** that vote before any advice is shown.
- A **voice-first** companion usable end-to-end with zero reading.
- An **occasion + weather + budget** reasoner, tuned to Indian life (weddings,
  festivals, office cultures by city, regional dress).

## What Chitti Fashion is NOT

- Not a shop. It never holds inventory, never takes a cut of a sale, never pushes
  a purchase the user doesn't need.
- Not a beauty-standard enforcer. It has no opinion on bodies.
- Not a trend-chaser. Trends inform; suitability decides.
- Not a data harvester. The wardrobe lives on the device. (See [ARCHITECTURE.md](ARCHITECTURE.md).)

## The one thing almost nobody has built

> **"Dress Me From What I Already Own."**

Every fashion app wants the user to buy. Chitti asks: *"Show me your wardrobe."*
Then: *"Using only clothes you already own, here are outfits for tomorrow."*

That single inversion creates trust, saves money, works for students, seniors and
rural users, and is far more useful than another shopping-recommendation engine.
It is the **hero feature** of Chitti Fashion, not a side tab.

## Long-horizon vision

- **Family Stylist** — one Chitti dresses father, mother, child, grandparent.
- **Fashion Twin** — a virtual style profile of everything you own (colors, shoes, accessories).
- **Accessibility Fashion** — adaptive dressing for wheelchair users, low-vision, seniors — a surface almost no app serves.
- **Learning Mode** — Chitti doesn't just answer; it teaches the principle behind the answer.

## Alignment with the platform

- **Vaani-sole-interface** ([§2 row 1](../SAHAYAI_MASTER.md)): the user reaches Fashion through Vaani; `chitti_fashion.html` is the dev/debug + parity surface.
- **DeepSeek only** ([§2](../SAHAYAI_MASTER.md)) for all reasoning.
- **Voice Factory** for voice in/out; **community voices** replace Bhashini over time.
- **Camera Intelligence** ([§2b](../SAHAYAI_MASTER.md)): wardrobe photos are processed on-device; only short *text* descriptions ever reach the model.
- **Swarm Intelligence** ([§2f](../SAHAYAI_MASTER.md)): styling patterns that earn high 👍 are validated and pushed to [skills/](skills/).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
