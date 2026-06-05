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

## Languages

Anchored to **Chitti Vaani's** language surface (per [CTO.md §5](../chitti-cto/CTO.md)):
**9 primary languages — 100% native UI** (verified 87/87 labels, 0 English fallback):
English · Hindi · Tamil · Telugu · Bengali · Marathi · Gujarati · Kannada · Malayalam.
Selector auto-enriches to the **26-language Voice Factory substrate** (`chitti_lang.js`);
voice-out covers all 26. Cousin-language UI text = English baseline pending community
translation (locked voice strategy). No Hinglish — one pure language per response.

## Live URL

- Page: `https://sahayai.in/chitti_fashion.html`
- Canonical: routed via `https://sahayai.in/chitti_vaani.html`

## Health endpoint

- `https://chitti-vaani-api-production.up.railway.app/health` (shared backend)

## Status

🟡 **YELLOW** — full CFOS operating system + rebuilt page committed 2026-06-03;
production functional cert pending next deploy. Substrate 5-gate inherited 🟢.

## Document map (CFOS v2.0)

| Area | File(s) |
|---|---|
| **Level 0 — Constitution** | [CONSTITUTION.md](CONSTITUTION.md) (Founder Rule) |
| **Level 1 — Role** | [ROLE.md](ROLE.md) (Chief Designer) |
| **Level 2 — Vision** | [VISION.md](VISION.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| **Level 3 — Users** | [PERSONAS.md](PERSONAS.md) (P1–P12) |
| Spec | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Level 4 — Skills** | [SKILLS.md](SKILLS.md) (12 skills) · [skills/](skills/) (+ [FEATURES.md](skills/FEATURES.md), [master-stylist-method.md](skills/master-stylist-method.md), [career-coach.md](skills/career-coach.md)) |
| **Level 5 — SOPs** | [SOP.md](SOP.md) · [sop/](sop/) |
| **Level 6 — Swarm** | [swarm/](swarm/) (9 voting agents + Trend) |
| **Level 7 — Guardrails** | [guardrails/](guardrails/) |
| **Level 8 — Accessibility** | [accessibility/](accessibility/) · [ADAPTIVE_CLOTHING.md](ADAPTIVE_CLOTHING.md) |
| **Level 9 — Memory / Twin** | [memory/](memory/) · [FASHION_TWIN.md](FASHION_TWIN.md) |
| **Level 10 — Observability** | [OBSERVABILITY.md](OBSERVABILITY.md) · [observability/](observability/) |
| **Level 11 — Evals** | [EVALS.md](EVALS.md) · [evals/](evals/) |
| Sustainability | [SUSTAINABILITY.md](SUSTAINABILITY.md) |
| Cultural | [CULTURAL_INTELLIGENCE.md](CULTURAL_INTELLIGENCE.md) |
| Quality | [QUALITY.md](QUALITY.md) · [CERTIFICATION_REPORT.md](CERTIFICATION_REPORT.md) |
| Roadmap | [ROADMAP.md](ROADMAP.md) |

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
