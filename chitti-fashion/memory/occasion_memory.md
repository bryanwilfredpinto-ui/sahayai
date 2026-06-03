🎖️ World Class Chitti Fashion — Memory: Occasions

# MEMORY — Occasions (local, time-aware)

> Chitti remembers what's coming up so it can help *before* the user asks.

## Store
`localStorage` key `chitti_fashion_occasions_v1` — a small list of upcoming
occasions the user mentioned or saved.

## Fields per occasion
| Field | Use |
|---|---|
| `id` | client UUID |
| `type` | wedding / interview / festival / office-event / travel / party |
| `date` | ISO date (used for proactive reminders + weather lookup) |
| `closeness` | for weddings (own/sibling/friend/colleague) → formality ceiling |
| `region` / `community` | cultural-sensitivity context |
| `planned_outfit` | optional array of owned item IDs Chitti pre-assembled |

## Behaviour
- **Proactive (opt-in):** as a saved occasion nears, Chitti can offer "your cousin's
  wedding is in 3 days — want me to plan an outfit from your almari?" — only with the
  user's consent, and only via the Golden-Rule confirm for any notification.
- **Weather-aware:** on the day, re-checks weather and adjusts fabric/layers.
- **Festival calendar:** standard Indian festivals pre-seeded (annual review) so the
  user needn't add them manually.

## Rules
- Never nags. One gentle offer, dismissable, never repeated unprompted.
- `"Chitti forget"` clears saved occasions.
- Privacy: occasion memory is local; only the abstract type/closeness rides a
  request when the user asks for advice.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
