🎖️ World Class Chitti Fashion — Memory: Wardrobe

# MEMORY — Wardrobe (on-device, private)

> The wardrobe is the user's most personal data. It lives **on the device** and
> never reaches the server (ROLE.md Principle: trust; [../ARCHITECTURE.md](../ARCHITECTURE.md)).

## Store
- **IndexedDB** database `chitti_fashion_almari`, object store `items`.
- Per-wearer namespacing for Family Stylist (PRD F12): `items` keyed by `wearer_id`.

## Item schema
| Field | Source |
|---|---|
| `id` | client UUID |
| `photo` | base64 data URL — **local only, never uploaded** |
| `category` | tops / bottoms / full / footwear / bags / jewellery / dupattas |
| `colour` | auto-detected (canvas centre 40×40 average → {hex, name}); user can correct |
| `occasions` | multi-select (casual/office/formal/wedding/festive) |
| `season` | summer / winter / all |
| `condition` | new / good / old |
| `last_worn` | nullable ISO date (voice/tap update) |
| `added_at` | auto |

## What leaves the device
Only a **short text snapshot** for reasoning: `id : category : colour : occasions`.
Never the photo. Never identity.

## Derived memory
- **Stats** per category (powers Wardrobe Audit).
- **Rare-worn** flag: `last_worn` (or `added_at`) older than 6 months → reuse prompt.

## Forget
`"Chitti forget"` (voice or button) clears the IndexedDB store and tombstones any
anonymised aggregate. Matches platform forget-me semantics.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
