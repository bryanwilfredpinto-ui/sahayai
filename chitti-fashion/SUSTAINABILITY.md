🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# SUSTAINABILITY — CFOS v2.0

> Fashion is one of the most wasteful industries on earth. Chitti's answer is the
> **Founder Rule** ([CONSTITUTION.md](CONSTITUTION.md)): shopping is the *last* option.
> This doc defines how sustainability is **measured and enforced in code**, not just
> claimed. Skill: [skills/budget-stylist.md](skills/budget-stylist.md) + engine
> [chitti_fashion_engine.js](../chitti_fashion_engine.js).

## The reuse-before-buy ladder (enforced)

1. Use → 2. Reuse → 3. Mix & match → 4. **Repair** (Clothing Doctor) → 5. Borrow →
6. Rent → 7. **Buy (last option)**.

Wardrobe Audit surfaces the ladder and the rare-worn revival list **before** any shop
link, and the shop link itself is labelled "last option". Buy is never the default.

## Metrics (live + planned)

| Metric | Definition | Status |
|---|---|---|
| **Cost-per-wear** | item ₹ ÷ times worn — the truest value signal in styling | 🟢 live (Wardrobe Audit) |
| **Reuse score** | % of advice resolved from the owned wardrobe (₹0) | 🟢 live (wardrobe-first ratio, target ≥ 70%) |
| **Shopping-reduction %** | purchases avoided because an owned/repair/borrow answer existed | 🟡 observability ([OBSERVABILITY.md](OBSERVABILITY.md)) |
| **Cost saved** | ₹ not spent vs. the branded/new alternative | 🟡 observability |
| **Carbon saved** | ~ kg CO₂e avoided per garment not bought (industry avg per category) | 🔵 planned (estimate model) |
| **Rare-worn revival** | items unworn > 6 months brought back into rotation | 🟢 live |

## Clothing Doctor (repair-not-buy)

Before "buy a new one", Chitti offers a **repair** path: button/seam/hem fixes, stain
guidance, alteration tips, and a "find a local tailor" deep-link. Repair sits at step 4
of the ladder, above borrow/rent/buy. (🟡 building; the tailor deep-link reuses the
shop-link pattern.)

## Honest rules

- **Cost-per-wear needs real input** — Chitti asks for price + counts wears; it never
  fabricates a number. No price entered → the metric is simply absent, not guessed.
- **Carbon numbers, when shown, are honest estimates** with the basis stated — never a
  precise claim we can't defend (matches §3 honest-stubs rule).
- **Borrow/rent are first-class**, not afterthoughts — for occasion wear (weddings),
  renting one outfit beats buying one worn once.

## Stale-data rule

Cost-per-wear updates on every "worn" tap. Carbon factors reviewed annually. Reuse
ratio recomputed per session. The wardrobe is the user's and never stale.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
