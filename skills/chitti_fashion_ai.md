# skills/chitti_fashion_ai.md

Chitti Fashion AI — voice-first personal stylist for every young Indian.
Frontend: `chitti_fashion.html`. Backend: same chitti-vaani-api / DeepSeek pipeline.

## Privacy contract (non-negotiable)

- All clothing photos are stored in the browser's **IndexedDB** under
  `chitti_fashion_almari` → `items`. Never touches the server.
- The photo payload (base64 data URL) lives inside the user's device.
  When Chitti needs to reason about a shopping item, it sends ONLY a
  short *text description* of the wardrobe + the user's stated
  occasion, gender, and price — never the photos themselves.
- `/api/feedback` carries the card name and the user's typed feedback
  — never images.
- The first-visit banner reads "आपकी photos सिर्फ़ आपकी हैं — आपके
  device पर ही रहती हैं — AI training के लिए कभी नहीं" in 9 languages.
- Compliant with DPDP Act 2023.

## Body positivity contract (non-negotiable)

Chitti's DeepSeek prompt for shopping ratings opens with:

> "You are Chitti — a body-positive fashion stylist for young
> Indians. **NEVER comment on the user's body. ONLY rate the
> clothing fit, colour, and style.**"

The closing rule line is repeated:

> "Never mention the user's body shape, size or weight. Compliment
> cut/colour/fit instead."

If a stylist response slips into body commentary, the per-card 👎
feedback path (`fa_shop` card) flags it. The founder dashboard
flags it.

## Gender (inclusive)

Three options on first visit — Male / Female / Other (Prefer not to
say). Saved as `chitti_fashion_profile_v1.gender`. The shopping
prompt branches at request-time:
- **Female** — `pairing` block asks Chitti for *earrings, dupatta,
  footwear, bag*.
- **Male** — `pairing` block asks for *trouser, belt+shoe, watch,
  formal vs casual*.
- **Other** — `pairing` block asks for *accessories, footwear*.

No assumptions, no stereotypes, no fashion advice locked behind a
gender wall.

## Wardrobe (Tab 1 · Almari)

Seven categories: tops, bottoms, full outfits, footwear, bags,
jewellery, dupattas/scarves. Each item carries:

| Field | Source |
| --- | --- |
| `id` | client-generated UUID |
| `photo` | base64 data URL (local only) |
| `category` | user-picked dropdown |
| `colour` | **auto-detected** by canvas pixel sampling — centre 40×40 average → `{hex, name}` |
| `occasions` | multi-select (casual/office/formal/wedding/festive) |
| `season` | summer/winter/all |
| `condition` | new/good/old |
| `last_worn` | nullable ISO date; voice update only |
| `added_at` | auto |

**Stats card** counts items per category. **Rare-worn alert** flags
any item with `last_worn` older than 6 months (or no `last_worn`
and `added_at` older than 6 months).

## Shopping (Tab 2)

Five star ratings (saffron stars when filled):
- ⭐ **Fit** — cut suits this body type? (answered in clothing terms only)
- ⭐ **Colour** — works with the stated occasion + season?
- ⭐ **Wardrobe match** — goes with the existing wardrobe snapshot?
- ⭐ **Occasion** — right for the stated purpose?
- ⭐ **Value** — fair price vs the asked price?

Plus:
- **Fair price** — INR range from real 2026 Indian rates.
- **Cheaper options** — Myntra / Amazon / Meesho / local market with
  estimated prices. Chitti is honest about cheaper-elsewhere.
- **Pairing block** — gender-aware suggestions (earring / dupatta /
  footwear / bag for female; belt+shoe / watch / trouser for male).

## Aaj Kya Pehnu (Tab 3)

3 complete outfits **from the user's own wardrobe** — never asks to
buy. The page sends DeepSeek the wardrobe as `id : category : colour`
triplets; the model returns 3 outfits as arrays of item IDs which
the frontend resolves into image collages.

Each outfit:
- title, ⭐ stars rating, 1-2 sentence body-positive `why`.
- Pieces collage (4-tile grid), each tile labeled with its role
  (TOP / BOTTOM / SHOE / JEWEL / DUPATTA …).
- For female users — include a jewellery/dupatta piece if available.
- For male users — include footwear + belt if available.

If the wardrobe is empty, Chitti says "Pehle Almari tab mein apne
kapde add karein — Chitti aapke liye combinations banayegi 🎙️."

## Trends (Tab 4)

Daily refresh (6h cache). DeepSeek generates 5 stories per the
prompt: Instagram India + Bollywood this week + festive/wedding
season + budget finds (Meesho/Myntra). Always includes one regional
trend (Bengali/Rajasthani/South Indian/Punjabi) + one budget find.

Each trend card surfaces two lists:
- **You can recreate this** — short item types Chitti detects from
  the wardrobe summary.
- **You'd need to buy** — short item names with estimated INR.

## Coach (Tab 5)

Same profiling pattern as Chitti News AI:
1. Pick a role (free-text equivalent — student / pro / designer /
   boutique / influencer / curious).
2. Chitti generates a profession-specific snapshot:
   - **best_tools** — 6 items minimum. Must include Midjourney +
     DALL-E + Runway + CLO3D + Canva + one role-specific tool.
   - **free_certifications** — 5 real free courses ONLY from this
     allow-list (DeepSeek is instructed to never invent):
     - Google UX Design Certificate (Coursera audit)
     - Adobe Creative AI essentials
     - Canva Design certification
     - NSDC Skill India Fashion Design
     - Elements of AI — University of Helsinki
     - Plus: Coursera "Fashion as Design" (MoMA audit),
       FutureLearn fashion courses (audit)
3. Sahayai Fashion AI Certificate auto-generated on track
   completion, with QR + 3 recommended next real free certs.

## Body type guidance — what to say and NOT say

| ❌ Never say | ✅ Say instead |
| --- | --- |
| "Yeh aap par mota dikhata hai" | "Yeh cut zyada loose hai — taller silhouette deta hai" |
| "Aapke body type ke liye nahi" | "Yeh fabric is occasion ke liye perfect nahi" |
| "Slim look ke liye" | "Yeh straight line cut clean look deta hai" |
| "Heavy figure ke liye" | "A-line / drape isse comfortable rakhega" |

Language guide: empowering ("aapko jachega", "yeh aapki personality
chamkayega"), warm ("Chitti khush hai aapke choice se"), never cold,
never comparison to thin ideals.

## Indian context — short reference

- **Office culture by city** — Mumbai (smart-casual usually), Delhi
  (more formal), Bangalore (very casual), Chennai (modest formal),
  Hyderabad (smart-casual + festive on Fridays).
- **Wedding outfit hierarchy** — own wedding > sibling > close
  friend > office colleague. Lehengas / sarees / sherwanis on top.
- **Festival appropriateness** — Diwali = bright + festive jewellery;
  Eid = pastel pop; Pongal/Onam = traditional white + gold border;
  Holi = white + okay-if-ruined; Karva Chauth = red/maroon.
- **Budget platforms** — Meesho (cheapest, variable quality), Myntra
  (mid, reliable), Amazon (variable), Ajio (curated), Nykaa Fashion
  (mid-premium), local market (try-on + bargain).
- **Indo-western fusion** — always celebrated. Kurta + jeans, saree
  + sneakers, dhoti pants + crop top, anarkali + boots.
- **Regional fashion** — Bengali (red+white tant), Rajasthani
  (mirror-work + bandhej), South Indian (silk + jasmine + temple
  jewellery), Punjabi (phulkari + paranda) — all celebrated, never
  stereotyped.

## Quality v2 — escalation

Per-card 👎 sends `{chitti:'chitti_fashion_ai', card, message}` to
`/api/feedback`. Cards: `fa_almari`, `fa_shop`, `fa_today`,
`fa_trends`, `fa_tools`, `fa_certs`. Founder dashboard aggregates.
Body-commentary slip-through is the most-watched signal — five 👎
on `fa_shop` in 24h triggers the hourly :15 escalator.
