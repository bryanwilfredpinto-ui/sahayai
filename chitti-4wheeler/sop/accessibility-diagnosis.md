🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP — Running a Diagnosis for a Four-User Driver

**Trigger:** any diagnosis where the driver's Disability Profile flags blind / deaf /
mute / illiterate (auto-detected once, never re-asked — [§7](../../SAHAYAI_MASTER.md)).

> Accessibility is the **floor**, not a mode. This SOP is how the operator (and the
> code) guarantees no driver hits a barrier — verified by
> [../evals/accessibility_eval.md](../evals/accessibility_eval.md) at 100%.

## Per-archetype run
| User | How the diagnosis runs |
|---|---|
| 👁️ **Blind** | sound-first / "describe my dashboard"; OBD2 code spoken in plain Hinglish; **safety call spoken first**, then cause + confidence + DIY tier + cost, all aloud; per-step "say HAAN" |
| 🦻 **Deaf** | visual symptom picker (no "listen" step); verdict = symbol + word + ISL + **screen flash** for 🔴; captions on every line |
| 🤫 **Mute** | photo + tap path end-to-end; narrowing Qs are tappable pictures; SOS + confirm via **tap buttons** |
| 📖 **Illiterate** | picture symptom menu; everything spoken (incl. the DTC meaning); "say HAAN or tap"; one pure language; works on 2G |

## Universal rules (all four)
1. Safety verdict (🔴/🟠) is the **first thing** delivered — spoken AND symbol+word+ISL.
   (Overheat / brake / steering / airbag hazards must reach every user instantly.)
2. Every response box: 🔊 + caption + symbol + ISL panel + 👍/👎 (`data-chitti-response`).
3. The Golden-Rule confirm + family-cascade SOS accept **voice (haan) OR tap** — never
   one channel only ([../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)).
4. Never colour-only; never audio-only; never required-reading; never required-voice.

## Failure = defect
A safety verdict a deaf driver can't perceive, a cost a blind driver can't hear, a
symptom input a mute driver can't tap, or a step an illiterate driver must read — each
is a **defect**, not a limitation. RED, blocks release.

## Test
Run the [4-user accessibility eval](../evals/accessibility_eval.md) on the hero
diagnosis flow each release: TalkBack, muted, mic-off, 2G-no-reading. All must pass 100%.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
