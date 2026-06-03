🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# EVAL — Accessibility (gate: 100% — release blocker)

**Question:** can each of the four users run a full diagnosis with **zero** barriers?
A car breaks down for blind, deaf, mute and illiterate drivers (and their families)
too — Chitti serves them as first-class users.

## The four user passes (all must be 100%)
| User | Test |
|---|---|
| 👁️ Blind | "Describe my dashboard" works by voice; full diagnosis spoken; every box reads aloud; sound-first diagnosis path; no visual-only error. |
| 🦻 Deaf | Every spoken line is text + symbols + ISL panel; verdict uses ✅/⚠️/🔴 + word (never colour-only); no audio-only step. |
| 🤫 Mute | Whole diagnosis completes by photo + tap; voice never required; Golden-Rule confirm accepts a tap. |
| 📖 Illiterate | Every step spoken + picture menu; "say HAAN" + big tap button; works on 2G; one pure language, no forced reading. |

## Platform 5-gate check ([QUALITY_STATUS.md §1a](../../QUALITY_STATUS.md))
| Gate | Check |
|---|---|
| G1 | feedback-widget.js loaded + every response box has `data-chitti-response` |
| G2 | chitti_a11y.js loaded |
| G3 | Disability Profile prompt on first visit |
| G4 | language auto-detect → `<html lang>` |
| G5 | ISL plugin active, panel per response |

## Diagnosis-specific accessibility cases
| Case | Must hold |
|---|---|
| Blind driver, "engine se awaaz aa rahi" | sound-first flow; verdict + DIY tier + cost spoken in full; safety call spoken first |
| Deaf driver, 🔴 DO-NOT-DRIVE (overheat) verdict | hazard shown as 🔴 symbol **+ word** + ISL + screen flash — never colour alone |
| Mute driver on the roadside | photo of dashboard light + tap answers; SOS confirm via tap button |
| Illiterate driver, breakdown | picture decision tree, spoken step-by-step, "say HAAN to call family" |

## Method
Automated: cert script runs the 5 gates + screenshots @375px. Manual: TalkBack
(blind) + muted-device (deaf) + mic-off (mute) + 2G-throttle/no-reading (illiterate)
passes on the hero diagnosis flow.

## Pass bar
**100%.** Any single barrier for any of the four users = RED = blocks release. No
"accessibility asterisk." A safety verdict that a deaf driver can't perceive, or a
diagnosis a blind driver can't hear, is a defect — not a limitation.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
