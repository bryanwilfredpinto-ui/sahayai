🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Illiterate User (Persona: Lakshmi, ~25 crore Indians)

> The non-reader is the **largest** archetype and the most ignored by every finance app. She cannot
> read English jargon — and crucially, **cannot read Hindi or her own script either.** Field
> evidence: non-readers misread composite/arrow icons. So **voice carries the meaning; icons only
> reinforce.** Implements [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What she needs
- **Voice in, voice out, in her dialect** (Telugu/Marathi/Bhojpuri/…) — not "Hindi" as a fallback.
- A flow she can complete **reading nothing at all**.
- Icons that *back up* the spoken word, never replace it — every icon **paired with audio**.
- A safe check before she sends money on a forwarded "tip" (her highest-stakes interaction).

## How Chitti Technicals serves her
| Need | Implementation |
|---|---|
| Zero-reading home | Icon-grid, 2-column, ≥48px; **every icon speaks when focused** (`chitti_a11y.js`) — she taps, it tells her what it is |
| Dialect voice in/out | `chitti_lang.js` 26 languages; output spoken in her selected dialect; questions spoken, not typed |
| Audio carries meaning | The verdict is **spoken first and fully**; the ▲▲/▲/■/▼/▼▼ shape + 🛡️/⚠️ icons only **reinforce** (Art. 2 — icons reinforce only) |
| Tip check by voice | Long-press a WhatsApp forward → share into Chitti → Tip Shield speaks: *"Idi scam laaga undi… Chitti ninnu konamani cheppatledu"* (no reading) |
| Honest rail spoken | "Most short-term traders lose money" + "not advice" are **spoken**, not just printed |
| Per-box widget | 🔊 re-reads; 👍/👎 are taps; ✏️🎙️ takes a **voice** note (she never types) |

## Failure modes to prevent
- A verdict, warning, or disclaimer delivered **as text only** → invisible to her → defect.
- An **icon without paired audio** (she taps it, silence) → she guesses wrong → defect (field-tested).
- Relying on a composite arrow/colour icon to **carry** the verdict instead of reinforce it → defect.
- A flow that requires typing a stock name or reading a list → defect (must be voice/tap + spoken labels).
- Dialect "fallback to Hindi/English" when her language is selected → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO5 gate)
**Tester treats all text as invisible** (covers the screen text, listens only). Telugu selected, 2G:
1. Tap home icons → each speaks its name; reach "check a tip" by audio alone.
2. Share a "guaranteed profit, buy tomorrow" forward → Tip Shield **speaks** the scam verdict.
3. Ask "Reliance manchidha?" by voice → verdict spoken fully, including the "most traders lose" rail.
4. Confirm every icon shown had a spoken label and **no step required reading**.
5. Confirm it worked from the offline service-worker cache on 2G.
**Pass = a full read + a tip-check complete with zero reading, in dialect, on 2G.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
