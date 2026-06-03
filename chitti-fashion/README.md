🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# Chitti Fashion

**Voice-first, wardrobe-first personal stylist for every Indian — children to
seniors, every income group, including blind, deaf, mute and illiterate users.**

## What I do

- **Dress you from what you already own** — the hero. ₹0 outfits from your almari.
- Review your outfit and tell you if it's right for where you're going.
- Plan for **occasions** (wedding, interview, office, festival) and **weather**.
- Show **Free → Budget → Premium** options — own-wardrobe first, always.
- **Teach** — explain *why* colours match, *why* a cut works, *why* an accessory clashes.
- Serve **accessibility fashion** — adaptive dressing for seniors, low-vision, seated users.
- **Describe your outfit aloud** for blind users; caption + ISL for deaf users.

Full capability surface: [skills/FEATURES.md](skills/FEATURES.md).

## Who I serve (always the 4 users)

| User | Challenge | How Chitti Fashion serves them |
|------|-----------|-------------------------------|
| 👁️ Blind | Cannot see UI | Every box reads aloud; "describe my outfit" by voice |
| 🦻 Deaf | Cannot hear | Full text + symbols + ISL panel on every response |
| 🤫 Mute | Cannot speak | Whole flow by tap + photo; voice optional |
| 📖 Illiterate | Cannot read | Voice-everything, picture menus, 2G-ready |

## How it works

- **Interface:** reached through **Chitti Vaani** (sole user surface). `chitti_fashion.html` is the dev/debug + parity page.
- **Reasoning:** **DeepSeek** only, via `chitti-vaani-api` `POST /api/vaani/ask`.
- **Swarm:** 7 agents vote before any advice shows (Fashion, Color, Occasion, Comfort, Accessibility, Budget, Confidence; Trend advises only).
- **Privacy:** wardrobe photos live in the browser (IndexedDB) and **never** leave the device — only short text descriptions reach the model. DPDP Act 2023 compliant.

## Live URL

- Page: `https://sahayai.in/chitti_fashion.html`
- Canonical: routed via `https://sahayai.in/chitti_vaani.html`

## Health endpoint

- `https://chitti-vaani-api-production.up.railway.app/health` (shared backend)

## Status

🟡 **YELLOW** — full CFOS operating system + rebuilt page committed 2026-06-03;
production functional cert pending next deploy. Substrate 5-gate inherited 🟢.

## Document map

| Area | File(s) |
|---|---|
| Constitution | [ROLE.md](ROLE.md) |
| Vision / metrics | [PRODUCT_VISION.md](PRODUCT_VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| Users | [PERSONAS.md](PERSONAS.md) |
| Spec | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| Capabilities | [skills/](skills/) (+ [skills/FEATURES.md](skills/FEATURES.md)) |
| Playbooks | [sop/](sop/) |
| Voting agents | [swarm/](swarm/) |
| Safety | [guardrails/](guardrails/) |
| Tests | [evals/](evals/) |
| Accessibility reviews | [accessibility/](accessibility/) |
| Memory model | [memory/](memory/) |
| Observability | [observability/](observability/) |

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
