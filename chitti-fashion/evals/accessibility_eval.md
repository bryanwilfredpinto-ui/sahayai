🎖️ World Class Chitti Fashion — Eval: Accessibility (gate: 100%)

# EVAL — Accessibility (gate: 100% — release blocker)

**Question:** can each of the four users complete every feature with zero barriers?

## The four user passes (all must be 100%)
| User | Test |
|---|---|
| 👁️ Blind | Every feature completable by voice; every box reads aloud; "describe my outfit" works; no visual-only info. |
| 🦻 Deaf | Every audio output also text + symbols + ISL panel; no audio-only step. |
| 🤫 Mute | Every feature completable by tap/photo; voice never required to proceed. |
| 📖 Illiterate | Every step has voice + picture; no required reading; works on 2G. |

## Platform 5-gate check ([QUALITY_STATUS.md §1a](../../QUALITY_STATUS.md))
| Gate | Check |
|---|---|
| G1 | feedback-widget.js loaded + every response box has `data-chitti-response` |
| G2 | chitti_a11y.js loaded |
| G3 | Disability Profile prompt on first visit |
| G4 | language auto-detect → `<html lang>` |
| G5 | ISL plugin active, panel per response |

## Method
- Automated: `tools/cert_fashion.mjs` runs the 5 gates + screenshots @375px.
- Manual: keyboard-only + screen-reader (TalkBack) pass on the hero flow.
- Swarm: the [Accessibility Agent](../swarm/accessibility-agent.md) floor (< 6 = held) verified on adversarial cases.

## Pass bar
**100%.** Any single barrier for any of the four users = RED = blocks release.
No "accessibility asterisk" is ever acceptable.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
