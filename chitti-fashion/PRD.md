🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# PRD — Chitti Fashion (CFOS v1.0)

> Governs every feature. Each feature carries: **User story · UX flow · A11y review ·
> Failure modes · Test/Eval ref · Rollback.** A feature missing any of these is not
> built (ROLE.md "Required documentation"). Personas referenced as P1–P9 from
> [PERSONAS.md](PERSONAS.md).

## Global contracts (apply to every feature below)

- **Swarm vote before display** — 7 agents ([swarm/](swarm/)) score, frontend shows the synthesized verdict + a per-agent breakdown the user can expand.
- **Teach, don't just recommend** — every output carries Why / Benefits / Tradeoffs / Alternatives.
- **Budget tiers** — Free (own wardrobe) → Budget → Premium, always in that order.
- **Per-response widget** — every card has `data-chitti-response` (🔊 / 🤖 / 👍 / 👎 + feedback). No card ships without it.
- **Privacy** — photos stay in IndexedDB; only short *text descriptions* reach DeepSeek. (See [ARCHITECTURE.md](ARCHITECTURE.md), [accessibility/](accessibility/), [skills/](skills/).)
- **Golden Rule** — Fashion takes no side-effecting action (no auto-buy, no share) without `chittiConfirmAndDo()` ([§2g](../SAHAYAI_MASTER.md)).
- **Honest empty states** — never a fake recommendation; if the wardrobe is empty, say so and guide the user to add items.

---

## F0 — "Dress Me From What I Own" (HERO)

- **Story (P1/P2/P8):** *As a user with a full almari and no money, I want outfits built only from clothes I own so that I look right for tomorrow at ₹0.*
- **UX flow:** Home → big primary button "👗 आज क्या पहनूँ — मेरी अलमारी से" → (if wardrobe empty) guided add → Chitti returns 3 complete outfits as image collages from owned item IDs, each with stars + Why + occasion fit.
- **A11y:** Outfit narrated aloud ("Outfit 1: blue kurta, black leggings, brown sandals — good for office"). Collage tiles labelled TOP/BOTTOM/SHOE. ISL panel per outfit. Mute users: pure tap. (See all four [accessibility/](accessibility/) files.)
- **Failure modes:** empty wardrobe → honest guide, never invents items; model returns an item ID not in wardrobe → frontend drops it and logs `phantom_item`; ≤2 valid pieces → "add one more top/bottom to unlock outfits."
- **Eval:** [evals/fashion_accuracy.md](evals/fashion_accuracy.md) (occasion-fit), [evals/hallucination_eval.md](evals/hallucination_eval.md) (phantom-item = hard fail).
- **Rollback:** feature-flag `cf_dress_me`; off → fall back to manual wardrobe browse.

## F1 — Wardrobe / Almari (the memory)

- **Story (all):** *I want to store my clothes with photos so Chitti remembers what I own.*
- **UX:** 7 categories (tops, bottoms, full outfits, footwear, bags, jewellery, dupattas/scarves). Add via camera/upload → auto colour-detect (canvas centre-sample) → tag occasions/season/condition/last_worn.
- **A11y:** voice-add ("add a blue cotton shirt for office"); category picker is a picture menu; colour spoken.
- **Failure:** photo too large → downscale on device; colour detect low-confidence → ask user to confirm colour, never guess silently.
- **Privacy:** photos **only** in IndexedDB `chitti_fashion_almari`. See [memory/wardrobe_memory.md](memory/wardrobe_memory.md).
- **Rare-worn alert:** items unworn > 6 months surfaced for reuse (sustainability).

## F2 — Outfit Review (rate what I'm wearing today)

- **Story (P3/P5):** *Tell me if today's outfit works for where I'm going.*
- **UX:** photo or describe → 7-agent vote → overall stars + per-axis (Fit/Colour/Occasion/Comfort/Confidence/Budget/Accessibility) + 1-line improvement using owned items first.
- **A11y:** for blind users this IS "describe my outfit" (P5 hero). See [sop/outfit-review.md](sop/outfit-review.md).
- **Guardrail:** rates clothing only, never the body ([guardrails/body_shaming.md](guardrails/body_shaming.md)).

## F3 — Occasion Readiness

- **Story (P3/P8):** *I'm going to a wedding/interview/office — is my outfit right?*
- **UX:** pick occasion → Chitti judges formality gap → "too casual / just right / over-dressed" + fix from wardrobe.
- **Logic:** Indian occasion hierarchy + city office cultures (see [skills/occasion-planner.md](skills/occasion-planner.md), [sop/wedding-advice.md](sop/wedding-advice.md), [sop/office-advice.md](sop/office-advice.md)).

## F4 — Weather Readiness

- **Story (all):** *Is this outfit right for today's weather here?*
- **UX:** uses `Chitti.location` (pincode) → climate band → fabric/layer advice. Honest stub if location denied ("tell me your city").

## F5 — Budget Alternatives (only when buying is truly needed)

- **Story (P1/P2):** *If I must buy, show me the cheapest honest option.*
- **UX:** Free (own wardrobe pairing) → Budget (Meesho/local ~₹X) → Premium (Myntra/Ajio ~₹Y). Chitti is honest about cheaper-elsewhere.
- **Guardrail:** Free tier is shown first and is never skipped. See [skills/budget-stylist.md](skills/budget-stylist.md).

## F6 — Closet AI / Wardrobe Audit

- **Story (P2/P9):** *Audit my wardrobe — what do I have too much / too little of, what pairs.*
- **UX:** stats per category, gaps ("you have 6 tops, 1 bottom"), reuse suggestions for rare-worn items. See [sop/wardrobe-audit.md](sop/wardrobe-audit.md).

## F7 — Travel Packing AI

- **Story (P3):** *I'm going to Goa for 3 days — pack from my wardrobe.*
- **UX:** destination + days + occasions → minimal mix-and-match packing list from owned items; flags the 1–2 gaps to buy only if essential.

## F8 — Interview / Confidence Coach

- **Story (P2/P3):** *Make me look professional and feel confident for my interview.*
- **UX:** formality check + confidence framing ("this clean straight cut reads polished") — never "you look bad." See [swarm/confidence-agent.md](swarm/confidence-agent.md).

## F9 — Festival & Cultural AI

- **Story (P8/P9):** *What should I wear for Diwali/Eid/Pongal/Onam/Karva Chauth?*
- **UX:** festival appropriateness + regional dress, celebrated never stereotyped. See [skills/cultural-fashion.md](skills/cultural-fashion.md), [sop/festive-fashion.md](sop/festive-fashion.md).

## F10 — Accessibility Fashion (the surface almost nobody builds)

- **Story (P4/P5/wheelchair users):** *Help me dress for my ability — easy fasteners, seated fit, low-vision-safe combos.*
- **UX:** adaptive-clothing guidance, magnetic/velcro fastener tips, seated drape, high-contrast pairings for low vision. See [skills/accessibility-fashion.md](skills/accessibility-fashion.md), [sop/accessibility-fashion.md](sop/accessibility-fashion.md).

## F11 — Fashion Learning Mode

- **Story (P1/P2):** *Don't just tell me — teach me why.*
- **UX:** every answer has an expandable "Chitti why?" that teaches the colour/cut/proportion principle. See [skills/color-theory.md](skills/color-theory.md), [skills/body-proportion.md](skills/body-proportion.md).

## F12 — Family Stylist + Fashion Twin

- **Story (P9):** *One Chitti for the whole family; remember each person's wardrobe.*
- **UX:** per-wearer local profile; coordinate a family for one occasion. Fashion Twin = the style profile (colours/shoes/accessories owned) per wearer. See [memory/preference_memory.md](memory/preference_memory.md).

## F13 — Makeup · Footwear · Jewellery advisors

- Gender-inclusive, occasion-aware, budget-first add-on advice. See [skills/makeup-advisor.md](skills/makeup-advisor.md), [skills/footwear-advisor.md](skills/footwear-advisor.md), [skills/jewellery-advisor.md](skills/jewellery-advisor.md).

## F14 — Emergency Fashion

- **Story (all):** *I have 5 minutes and an event — dress me NOW from what's clean.*
- **UX:** one-tap fastest acceptable outfit from owned, clean, weather-fit items. See [sop/emergency-fashion.md](sop/emergency-fashion.md).

---

## Out of scope (v1.0)

- Selling/holding inventory · taking sale commissions · body measurement scanning ·
  AR try-on (queued, COMING SOON) · camera-based ISL detection (Phase 2, platform-wide).

## Roadmap markers

`COMING SOON` (visible, never hidden) for: AR try-on, on-device camera ISL,
community-contributed regional-dress library, Fashion Twin auto-build from photos.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
