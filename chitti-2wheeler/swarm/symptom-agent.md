🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# AGENT — Symptom (Problem Understanding)

**Votes on:** what the rider's problem actually *is* — and what's still unknown.
Owns the narrowing questions so the rest of the swarm reasons on facts, not guesses.

## What it does
Turns *"meri bike start nahi ho rahi"* into a structured symptom set by asking the
**fewest** high-information questions first, then handing a clean picture to the
fault agents.

## The narrowing questions (highest information first)
| Question | What it rules in/out |
|---|---|
| Self-start chalu hota hai? (cranks?) | cranks-but-no-fire → fuel/spark; no-crank → battery/starter |
| Headlight / horn / indicators kaam karte? | dead → battery flat; bright → battery OK, look elsewhere |
| Petrol hai? reserve check kiya? | the #1 "no-start" cause; rule out free |
| Koi alag awaaz? (knock / whine / rattle / tick) | routes to [sound-doctor](../skills/sound-doctor.md) |
| Kal tak theek tha ya dheere-dheere bigda? | sudden → electrical/fuel; gradual → wear |
| Last service / odo kitna? | maps to wear intervals in MECHANIC_KNOWLEDGE |

## Must return
`{candidate_symptoms, unknowns, confidence}` — and it **flags missing info** so the
swarm downgrades to "recommend inspection" rather than inventing a cause.

## Hard rules
- One or two questions at a time — never a 10-question form (illiterate / blind users).
- If the rider can't answer (mute / on the roadside), fall back to **photo-first** +
  the safest assumption, and **say what it assumed**.
- Never let an unanswered question become a confident diagnosis — pass the unknown on.

## Accessibility
Questions are spoken **and** shown as tappable picture options (✅ headlight bright /
🌑 headlight dead). Voice answer optional; mute riders tap. Never a text-only form.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
