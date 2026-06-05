🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# accessibility/deaf_user.md — Level 9

> Deaf = **visual-first.** Caption + symbol + ISL on everything. Never audio-only.

## Requirements

- **Caption on every route card + result box** — full text, not just an icon.
- **Symbol + word label** — ✅ / ⚠️ / ❔ paired with a word. **Never colour alone.**
- **ISL animation panel** next to every response (auto via `chitti_a11y.js` + the ISL
  dictionary). Tap any word → enlarged sign; unknown words fingerspell.
- **No audio-only step** — if Chitti would normally speak the route, it is also written +
  signed.

## Substrate

`chitti_a11y.js` ISL plugin (default-on for the ISL profile) + caption rendering on
`data-chitti-response` boxes.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
