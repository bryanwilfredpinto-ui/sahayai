🎖️ World Class Chitti Fashion — Skill: Wardrobe Planner

# SKILL — Wardrobe Planner

The engine behind the **hero** feature "Dress Me From What I Own" (PRD F0) and
**Wardrobe Audit** (PRD F6). Reads the on-device wardrobe; never asks the user to buy.

## Input
Wardrobe as `id : category : colour : occasions : season : condition : last_worn`
triplets (text only — photos stay on device, see [../memory/wardrobe_memory.md](../memory/wardrobe_memory.md)).

## Capabilities
1. **Build outfits from owned items** — returns combinations as arrays of item IDs
   the frontend resolves to image collages. For female users include a
   jewel/dupatta piece if owned; for male users include footwear + belt if owned.
2. **Audit** — counts per category, flags gaps ("6 tops, 1 bottom"), surfaces
   **rare-worn** items (unworn > 6 months) for reuse.
3. **Mix-and-match math** — maximises distinct outfits from minimum pieces (powers Travel Packing, PRD F7).

## Output contract
- Each outfit: title · stars · 1–2 line body-positive **why** · piece roles (TOP/BOTTOM/SHOE/JEWEL/DUPATTA).
- **Never** invents an item not in the wardrobe (phantom-item = hard fail, [../evals/hallucination_eval.md](../evals/hallucination_eval.md)).
- Empty wardrobe → honest guide: *"Pehle Almari mein kapde add karein — Chitti
  combinations banayegi 🎙️."* Never a fabricated outfit.

## Sustainability hook
Always prefers reusing a rare-worn owned item over suggesting a buy. A "wear what
you have" answer scores highest on the [Budget Agent](../swarm/budget-agent.md).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
