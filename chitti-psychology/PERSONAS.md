# PERSONAS — Chitti Psychology

> Level 3. Who we serve first. Every PRD feature traces to at least one persona +
> the four-user accessibility contract ([accessibility/](accessibility/)).

## Life-stage personas

### P1 — Student (Aarav, 17, Class 12, Patna)
- **Needs:** focus, confidence, exam-stress relief, sleep.
- **Pain:** ~81% of CBSE students report extreme exam stress; parents add pressure.
- **Chitti:** exam-mode pack (Pomodoro + breathing + realistic study plan + reframe
  catastrophic thoughts), confidence coach, sleep-wind-down. Loops in parents gently.

### P2 — Parent (Sunita, 41, homemaker, Indore)
- **Needs:** understand child behaviour, discipline without shouting, communication.
- **Chitti:** parenting coach (age-specific), anger-de-escalation SOS, NVC composer
  for "say it without a fight", postpartum-rage coping for new mothers.

### P3 — Couple (Ramesh & Latha, 34/31, Coimbatore)
- **Needs:** conflict resolution, feeling heard, communication in a joint family.
- **Chitti:** relationship coach (Gottman 5:1, active-constructive responding, repair
  phrases), conflict SOP, joint-family-aware framing — never couples therapy.

### P4 — Employee (Farhan, 28, BPO, Hyderabad)
- **Needs:** workplace stress, burnout, difficult conversations, feedback.
- **Chitti:** workplace-psychology cards, burnout check-in, "prepare a hard
  conversation" composer, urge-surfing for doom-scrolling.

### P5 — Manager / Leader (Priya, 38, team lead, Pune)
- **Needs:** leadership coaching, empathy, team conflict, giving feedback.
- **Chitti:** leadership-psychology skills, empathy framing, conflict-mediation steps.

### P6 — Senior Citizen (Dadaji, 72, Nagpur)
- **Needs:** companionship, loneliness reduction, memory/reminiscence, dignity.
- **Chitti:** reminiscence / life-story prompts (ties to Emotional Twin), daily
  check-in, slow voice, large text. Loneliness reframing + nudge to reach one person.

### P7 — Grieving person (Meera, 49, recent widow, Kochi)
- **Needs:** to not be alone, to understand grief, coping frameworks.
- **Chitti:** grief companion (education + coping, explicitly *not therapy*), warm
  presence, helpline if grief turns to crisis.

### P8 — Person in financial stress (Vikram, 36, small shop, Surat)
- **Needs:** cope with money-shame and worry; separate controllable from not.
- **Chitti:** financial-stress psychology (worry-time, values-based framing); routes
  money *mechanics* to Chitti CA, routes distress to coping + helplines.

## Accessibility personas (the floor — every feature must serve all)

| Persona | Mode | Design call |
|---|---|---|
| 👁️ **Blind** (Kamala, 33) | **Voice-first** | Every box reads aloud; audio-led breathing; emotion named by voice. |
| 🦻 **Deaf** (Imran, 25) | **Visual-first** | Text + emotion symbols + ISL panel; never telephone-only escalation. |
| 🤫 **Mute** (Geeta, 40) | **Tap-first** | Emoji/symbol mood grid; text-in, voice-out; re-confirm intent often. |
| 📖 **Illiterate** (Bhola, 52) | **Voice + icons** | Vernacular emotion words + pictures; nothing requires reading. |
| 👴 **Elderly** (Dadaji, 72) | **Slow + large + simple** | Bigger text, slower speech, one task at a time, repetition is friendship. |

> A feature that cannot serve **all** of the above is **redesigned, not shipped**.
> See [accessibility/](accessibility/) for the per-archetype review of every feature.

## The crisis persona (always present, never a "segment")

Any persona above can, on any day, be in crisis. The
[crisis-escalation SOP](sop/crisis-escalation.md) treats this as a state, not a user
type — detected out-of-band, handled with calm, routed to **Tele-MANAS 14416** +
family cascade, never diagnosed, never auto-dialled.
