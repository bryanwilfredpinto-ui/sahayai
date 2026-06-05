🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL — Accessibility

**Target: 100%** — the four-user contract is a floor, not a score to optimise.
A single failing check blocks the release.

## Checks (per page, per the 4 users + platform gates)
| # | Check | User |
|---|---|---|
| 1 | Every response box reads aloud (🔊) in the selected language | Blind |
| 2 | Audio Trade Summary speaks Trend→Entry→Stop→Target→Confidence | Blind |
| 3 | No meaning by colour alone — every signal has icon + word | Deaf / colour-blind |
| 4 | ISL panel renders on every response | Deaf |
| 5 | Whole flow reachable by tap; voice never required | Mute |
| 6 | Icon menus + voice-everything; usable with zero reading on 2G | Illiterate |
| 7 | Whole UI re-renders in the selected language (Bangla/Telugu/Tamil/…) | All |
| 8 | No Hinglish; indicator names stay English | All |
| 9 | 5-element box (🔊/🤖/👍/👎+feedback) on every card | Platform G1 |
| 10 | chitti_a11y.js + Disability Profile + lang-detect + ISL plugin | Platform G2–G5 |
| 11 | Tap targets ≥ 48×48px; 375px mobile pass | All |

## Method
- Playwright cert (`tools/cert_technical.mjs`, to be authored at build) across
  375 / 768 / 1280 viewports, with a **runtime language-switch proof** (e.g.
  en→bn re-renders the page title in Bangla script, zero English fallback on the
  9 primary labels) and a **runtime i18n leakage scan** (no Hinglish).
- Screenshots saved to `tools/cert_screenshots/`.

## Honesty
- This eval is **0/0 until the page is built.** No accessibility pass is claimed
  for a page that doesn't exist yet. See [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
