# Family Graph — N/A for Chitti News AI

> **Status: N/A — by design.**
>
> Chitti News AI is a single-user career-information product. There is no
> family-graph layer in this product. This file documents the explicit N/A
> so future maintainers don't try to retrofit one.

---

## Why N/A

The Family Graph is a feature of Chitti products that act on behalf of multiple related users — e.g. spouse, parents, children, in-laws — to:

- Share medical history (Chitti Health / Chitti MedUPI).
- Route emergency cascade (Chitti Vaani — *family cascade, never cops*).
- Share financial decisions (Chitti CA / Chitti Fundamentals).
- Coordinate prescriptions (Chitti MedUPI family wallet).

Chitti News AI does NONE of these. It is a learning + news product for ONE user, whose career, skills, and goals are personal. There is no concept of "spouse's profession" or "family curriculum".

---

## Where family-graph IS implemented (the canonical references)

If you need the family-graph contract for a different product, the live implementations to study are:

| Product | What it shares | Spec / code |
|---|---|---|
| **Chitti Vaani** | Emergency cascade — call spouse, parents, in-laws on keyword spotting | [`SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md) §2 emergency protocol + chitti-vaani/ |
| **Chitti Health** | Health twin — shared medical history with explicit consent per family member | `CHITTI_HEALTH_FILE_MASTER_SPEC.md` (planned) |
| **Chitti MedUPI** | Family wallet — pooled medicine budget; per-member prescription | `CHITTI_MEDUPI_MASTER_SPEC.md` + `chitti-medupi/` |
| **Chitti CA** | Family-level tax / financial planning (joint returns, HUF) | `chitti-ca/` (Phase 2) |
| **Chitti Fundamentals** | Shared watchlist between joint-account holders | `chitti_fundamentals.html` (Phase 2) |

---

## What if a future requirement asks for family-graph in News AI?

Two scenarios:

### Scenario A — "Show news that affects my family's professions"

A user with profession Doctor wants news that also affects their CA spouse. The correct answer is **NOT** a family-graph in News AI; the correct answer is the user maintains multiple browser profiles or uses the "More roles" picker to manually switch hubs. Reasons:

1. Storing other people's profession data on this user's device violates the consent model.
2. The Privacy contract ([`../guardrails/privacy.md`](../guardrails/privacy.md)) Principle 1 says profile is localStorage-only — there's no consent mechanism to "ingest spouse's profession".
3. The product is read-only / advise-only — there is no payment / health / emergency that needs a graph.

### Scenario B — "Generate a learning plan for my entire family"

The same answer: per-user. Each family member should open Chitti News AI on their own device, set their own profile, and get their own plan. We do not aggregate across people because there is no benefit large enough to overcome the privacy cost.

If the product ever ships an explicit "family learning plan" feature, it must:

- Live in a separate Chitti (e.g. Chitti Family Coach) with its own consent flow.
- Use the shared family-graph schema from Chitti Vaani / Chitti Health.
- Not pull data into Chitti News AI's localStorage.

---

## Schema (intentionally empty)

```json
{}
```

There is no `chitti_news_ai_family_graph` localStorage key.
There is no `family_graph` field in [`./life_twin.md`](./life_twin.md).
There is no `/api/family/*` endpoint in [`../backend/`](../backend/).

The CI guard `test_no_family_graph_keys_in_news_ai_storage` enforces this — any code that writes a key matching `/family.?graph/i` to localStorage from this product fails CI.

---

## Cross-product references

- See [`../../SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md) §2 for the family-cascade emergency protocol (Chitti Vaani).
- See `chitti-medupi/` README for the family-wallet contract.
- See `CHITTI_VAANI_*` skill files for the per-family-member voice routing.

---

Last reviewed: 2026-06-06
