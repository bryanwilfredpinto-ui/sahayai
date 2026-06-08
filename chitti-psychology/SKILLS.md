# SKILLS — Chitti Psychology (Level 5 index)

> The 10 core skills (from Sire's brief) + the identity/guardrail skill files. Each
> skill returns **reasoning, not just a verdict** (Teach, don't just recommend).
> Per-skill detail lives in [skills/](skills/).

## Core skills

| # | Skill | File | What it does |
|---|---|---|---|
| 1 | **Emotion Detection** | [skills/emotion-detection.md](skills/emotion-detection.md) | Reads lexical + prosody cues → *possible* emotions (never asserts); hosts the multilingual crisis lexicon + vernacular emotion picker. |
| 2 | **Behavior Analysis** | [skills/behavior-analysis.md](skills/behavior-analysis.md) | Identifies avoidance / defensiveness / procrastination / impulsiveness — patterns, never disorders. |
| 3 | **Communication Analysis** | [skills/communication-analysis.md](skills/communication-analysis.md) | Scores tone / empathy / clarity / respect; offers a kinder rewrite (NVC). |
| 4 | **Relationship Dynamics** | [skills/relationship-dynamics.md](skills/relationship-dynamics.md) | Trust, conflict, communication breakdowns; Gottman 5:1 + repair + ACR. |
| 5 | **Parenting Psychology** | [skills/parenting-psychology.md](skills/parenting-psychology.md) | Age-specific (toddler/child/teen) guidance; never labels the child. |
| 6 | **Leadership Psychology** | [skills/leadership-psychology.md](skills/leadership-psychology.md) | Empathy, feedback, team conflict, burnout for managers. |
| 7 | **Habit Formation** | [skills/habit-formation.md](skills/habit-formation.md) | Implementation intentions, WOOP, behavioral activation. |
| 8 | **Stress Pattern Recognition** | [skills/stress-pattern-recognition.md](skills/stress-pattern-recognition.md) | Detects stress signals over time (Emotional Twin); offers regulation. |
| 9 | **Conflict Resolution** | [skills/conflict-resolution.md](skills/conflict-resolution.md) | Listen → emotions → trigger → communication → resolution path. |
| 10 | **Self Reflection Coaching** | [skills/self-reflection-coaching.md](skills/self-reflection-coaching.md) | Guided journaling, gratitude, values, weekly insight. |

## Identity & control skill files (inherited pattern from chitti-government)

| File | Purpose |
|---|---|
| [skills/FEATURES.md](skills/FEATURES.md) | Live capability list read aloud by the Feature Discovery box. |
| [skills/IDENTITY.md](skills/IDENTITY.md) | Who Chitti Psychology is (and is not). |
| [skills/PERSONALITY.md](skills/PERSONALITY.md) | Tone: warm, calm, reality-grounded, never sycophantic. |
| [skills/VALUES.md](skills/VALUES.md) | Dignity, honesty, safety, accessibility. |
| [skills/BOUNDARIES.md](skills/BOUNDARIES.md) | The therapist boundary, operationalised. |
| [skills/GUARDRAILS.md](skills/GUARDRAILS.md) | The NEVER/ALWAYS list, in one place. |
| [skills/DEVILS_ADVOCATE.md](skills/DEVILS_ADVOCATE.md) | "What's the worst-case reading of this message?" |

> Every skill is implemented **deterministically** in `chitti_psychology_os_engine.js`
> first; the LLM only adds warmth, behind the crisis classifier.
